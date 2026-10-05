/**
 * Chooses a recipe for every cat that has neither patches drawn by hand nor a
 * recipe yet, and prints the whole `SPRITE_RECIPES` table to stdout, sorted
 * by id, to be pasted over the one in `src/components/sprites/cats.ts`.
 *
 *   pnpm sprites:recipes
 *   pnpm sprites:recipes --fake=75
 *   pnpm sprites:recipes --seed=another
 *
 * The recipes are chosen to look as unlike one another as they can: each cat
 * takes the recipe that leaves it farthest from the cat nearest to it, among
 * the cats drawn by hand and the recipes already chosen, and then every cat
 * is given the chance to move farther away until none can. A rarer cat is
 * built from more parts and bigger ones. How far apart the nearest two ended
 * up, and the mean, go to stderr.
 *
 * `--fake=75` runs against 75 cats that do not exist, 15 to an element, in
 * the rarities the catalogue still has to fill, so the library can be tried
 * before the cats are written. The choices come from a seeded stream, so a
 * run can be repeated.
 */
import { pathToFileURL } from "node:url";

import {
  BASE_SPRITE,
  COAT_DISTANCE,
  MIN_RECIPE_DISTANCE,
  SPRITE_PATCHES,
  SPRITE_RECIPES,
  SPRITE_ZONES,
  catLook,
  gridDistance,
  recipeSprite,
  spriteDistance,
  spritePartIds,
  type SpriteLook,
  type SpriteRecipeDraft,
  type SpriteZone,
} from "~/components/sprites/cats";
import { CAT_PALETTES, ELEMENT_COATS } from "~/components/sprites/palettes";
import { CAT_LIST, RARITIES, type Rarity } from "~/server/game/cats";
import { ELEMENTS, type Element } from "~/server/game/elements";
import { createRng, type Rng } from "~/server/game/rng";

/** What the generator needs to know of a cat. */
export interface Subject {
  id: string;
  element: Element;
  rarity: Rarity;
}

const DEFAULT_SEED = "sprite-recipes";

/** How many cats of each rarity an element has once the catalogue is full. */
const ELEMENT_SHAPE: Record<Rarity, number> = {
  common: 8,
  uncommon: 5,
  rare: 4,
  epic: 2,
  legendary: 1,
};

/**
 * How much of a cat a rarity may change: how many zones take a part, and how
 * many cells of the base those parts repaint between them.
 */
const BUILDS: Record<
  Rarity,
  { parts: readonly [number, number]; cells: readonly [number, number] }
> = {
  common: { parts: [2, 3], cells: [10, 24] },
  uncommon: { parts: [3, 4], cells: [18, 34] },
  rare: { parts: [4, 5], cells: [28, 46] },
  epic: { parts: [5, 6], cells: [40, 60] },
  legendary: { parts: [6, 8], cells: [54, 256] },
};

/** Recipes tried for one cat at each turn, besides its neighbours. */
const TRIES = 240;
/** Times round the whole set letting each cat move farther away. */
const SWEEPS = 8;

/** A cat standing where it has been put: drawn by hand, or given a recipe. */
interface Placed extends Subject {
  look: SpriteLook;
  recipe: SpriteRecipeDraft | null;
}

/** The cats of the catalogue that have neither patches nor a recipe. */
export function undrawnCats(): Subject[] {
  return CAT_LIST.filter(
    (cat) => !SPRITE_PATCHES[cat.id] && !SPRITE_RECIPES[cat.id],
  ).map(({ id, element, rarity }) => ({ id, element, rarity }));
}

/**
 * The rarities an element still has to fill, commonest first. Cats drawn
 * from life stand outside the count.
 */
function missingRarities(element: Element): Rarity[] {
  return RARITIES.flatMap((rarity) => {
    const have = CAT_LIST.filter(
      (cat) =>
        cat.element === element &&
        cat.rarity === rarity &&
        !CAT_PALETTES[cat.id],
    ).length;
    return Array<Rarity>(Math.max(0, ELEMENT_SHAPE[rarity] - have)).fill(
      rarity,
    );
  });
}

/**
 * `count` cats that do not exist, shared evenly between the elements. Each
 * element's take the rarities it is missing, then a full element's over
 * again if more are asked for than that.
 */
export function fakeCats(count: number): Subject[] {
  const whole = RARITIES.flatMap((rarity) =>
    Array<Rarity>(ELEMENT_SHAPE[rarity]).fill(rarity),
  );
  return ELEMENTS.flatMap((element, index) => {
    const share =
      Math.floor(count / ELEMENTS.length) +
      (index < count % ELEMENTS.length ? 1 : 0);
    const missing = missingRarities(element);
    return Array.from({ length: share }, (_, n): Subject => {
      const rarity =
        missing[n] ?? whole[(n - missing.length) % whole.length] ?? "common";
      return {
        id: `fake-${element}-${String(n + 1).padStart(2, "0")}`,
        element,
        rarity,
      };
    });
  });
}

function lookOf(recipe: SpriteRecipeDraft): SpriteLook {
  return { grid: recipeSprite(recipe), coat: recipe.coat ?? 0 };
}

/** Whether a recipe is as large as its rarity asks, and no larger. */
function fits(recipe: SpriteRecipeDraft, rarity: Rarity): boolean {
  const { parts, cells } = BUILDS[rarity];
  const used = SPRITE_ZONES.filter((zone) => recipe[zone] !== undefined);
  if (used.length < parts[0] || used.length > parts[1]) return false;
  const changed = gridDistance(recipeSprite(recipe), BASE_SPRITE);
  return changed >= cells[0] && changed <= cells[1];
}

/** A recipe with one zone given another part, or emptied. */
function withPart(
  recipe: SpriteRecipeDraft,
  zone: SpriteZone,
  part: string | undefined,
): SpriteRecipeDraft {
  const made: Partial<Record<SpriteZone, string>> & { coat?: number } = {
    ...recipe,
  };
  if (part === undefined) delete made[zone];
  else made[zone] = part;
  return made;
}

/** A recipe drawn at random, of a size its rarity allows. */
function randomRecipe(rng: Rng, subject: Subject): SpriteRecipeDraft | null {
  const { parts } = BUILDS[subject.rarity];
  const coats = ELEMENT_COATS[subject.element].length;
  for (let attempt = 0; attempt < 64; attempt++) {
    const zones = rng
      .shuffle(SPRITE_ZONES)
      .slice(0, rng.int(parts[0], parts[1]));
    const recipe = zones.reduce<SpriteRecipeDraft>(
      (made, zone) => withPart(made, zone, rng.pick(spritePartIds(zone))),
      { coat: rng.int(0, coats - 1) },
    );
    if (fits(recipe, subject.rarity)) return recipe;
  }
  return null;
}

/** Every recipe one change away from `recipe`: a zone's part, or the coat. */
function neighbours(
  recipe: SpriteRecipeDraft,
  subject: Subject,
): SpriteRecipeDraft[] {
  const parts = SPRITE_ZONES.flatMap((zone) =>
    [undefined, ...spritePartIds(zone)]
      .filter((part) => part !== recipe[zone])
      .map((part) => withPart(recipe, zone, part)),
  );
  const coats = ELEMENT_COATS[subject.element]
    .map((_, coat) => ({ ...recipe, coat }))
    .filter(({ coat }) => coat !== (recipe.coat ?? 0));
  return [...parts, ...coats].filter((made) => fits(made, subject.rarity));
}

/**
 * How far apart two cats stand. Within an element it is `spriteDistance`. A
 * cat of another element is in other colours already, which is counted as
 * another coat, so that no two cats in the catalogue share a silhouette.
 */
function apart(a: Subject & { look: SpriteLook }, b: Placed): number {
  return a.element === b.element
    ? spriteDistance(a.look, b.look)
    : gridDistance(a.look.grid, b.look.grid) + COAT_DISTANCE;
}

/**
 * The best of `candidates` for `subject` among `others`: the one whose
 * nearest neighbour is farthest, and of those the one farthest from them
 * all. `floor` is what it has to beat to be worth taking.
 */
function farthest(
  subject: Subject,
  candidates: readonly SpriteRecipeDraft[],
  others: readonly Placed[],
  floor: { nearest: number; total: number },
): { recipe: SpriteRecipeDraft; look: SpriteLook } | null {
  let best: { recipe: SpriteRecipeDraft; look: SpriteLook } | null = null;
  let { nearest: bestNearest, total: bestTotal } = floor;

  for (const recipe of candidates) {
    const look = lookOf(recipe);
    const here = { ...subject, look };
    let nearest = Infinity;
    let total = 0;
    for (const other of others) {
      const distance = apart(here, other);
      total += distance;
      if (distance < nearest) nearest = distance;
      if (nearest < bestNearest) break;
    }
    if (
      nearest > bestNearest ||
      (nearest === bestNearest && total > bestTotal)
    ) {
      best = { recipe, look };
      bestNearest = nearest;
      bestTotal = total;
    }
  }
  return best;
}

/** The cats that are already drawn, by hand or by a recipe in the table. */
function drawnCats(): Placed[] {
  return CAT_LIST.filter(
    (cat) => SPRITE_PATCHES[cat.id] ?? SPRITE_RECIPES[cat.id],
  ).map(({ id, element, rarity }) => ({
    id,
    element,
    rarity,
    look: catLook(id),
    recipe: null,
  }));
}

export interface Chosen {
  /** The recipe chosen for each subject, by id. */
  recipes: Record<string, SpriteRecipeDraft>;
  /** `spriteDistance` over every pair of one element with a new cat in it. */
  nearest: number;
  mean: number;
  pairs: number;
  /** The two cats of one element that ended up nearest. */
  closest: readonly [string, string] | null;
  /** The fewest cells between a new cat's grid and any other grid at all. */
  nearestGrid: number;
}

/** Chooses a recipe for each subject. The same seed chooses the same ones. */
export function chooseRecipes(
  subjects: readonly Subject[],
  seed: string = DEFAULT_SEED,
): Chosen {
  const rng = createRng(seed);
  const drawn = drawnCats();
  const placed: Placed[] = [];

  // The cats with the least room to differ go first.
  const order = [...subjects].sort(
    (a, b) =>
      RARITIES.indexOf(a.rarity) - RARITIES.indexOf(b.rarity) ||
      a.id.localeCompare(b.id),
  );

  const tries = (subject: Subject) =>
    Array.from({ length: TRIES }, () => randomRecipe(rng, subject)).filter(
      (recipe) => recipe !== null,
    );

  for (const subject of order) {
    const best = farthest(subject, tries(subject), [...drawn, ...placed], {
      nearest: -1,
      total: -1,
    });
    if (!best) throw new Error(`no recipe fits ${subject.id}`);
    placed.push({ ...subject, ...best });
  }

  for (let sweep = 0; sweep < SWEEPS; sweep++) {
    let moved = false;
    for (const [index, cat] of placed.entries()) {
      if (!cat.recipe) continue;
      const others = [...drawn, ...placed.filter((other) => other !== cat)];
      const distances = others.map((other) => apart(cat, other));
      const best = farthest(
        cat,
        [...neighbours(cat.recipe, cat), ...tries(cat)],
        others,
        {
          nearest: Math.min(...distances),
          total: distances.reduce((sum, distance) => sum + distance, 0),
        },
      );
      if (best) {
        placed[index] = { ...cat, ...best };
        moved = true;
      }
    }
    if (!moved) break;
  }

  let nearest = Infinity;
  let nearestGrid = Infinity;
  let closest: readonly [string, string] | null = null;
  let total = 0;
  let pairs = 0;
  placed.forEach((cat, index) => {
    for (const other of [...drawn, ...placed.slice(0, index)]) {
      const cells = gridDistance(cat.look.grid, other.look.grid);
      if (cells < nearestGrid) nearestGrid = cells;
      if (other.element !== cat.element) continue;
      const distance = spriteDistance(cat.look, other.look);
      total += distance;
      pairs++;
      if (distance < nearest) {
        nearest = distance;
        closest = [other.id, cat.id];
      }
    }
  });

  return {
    recipes: Object.fromEntries(
      placed.flatMap((cat) => (cat.recipe ? [[cat.id, cat.recipe]] : [])),
    ),
    nearest,
    mean: pairs === 0 ? 0 : total / pairs,
    pairs,
    closest,
    nearestGrid,
  };
}

/** One entry of the table, on one line if it fits in 80 columns. */
function formatEntry(id: string, recipe: SpriteRecipeDraft): string {
  const key = /^[A-Za-z_$][\w$]*$/.test(id) ? id : JSON.stringify(id);
  const fields = SPRITE_ZONES.flatMap((zone) => {
    const part = recipe[zone];
    return part === undefined ? [] : [`${zone}: ${JSON.stringify(part)}`];
  });
  if (recipe.coat) fields.push(`coat: ${recipe.coat}`);

  const line = `  ${key}: { ${fields.join(", ")} },`;
  if (line.length <= 80) return line;
  return [
    `  ${key}: {`,
    ...fields.map((field) => `    ${field},`),
    "  },",
  ].join("\n");
}

/** The table as the object literal `SPRITE_RECIPES` is set to. */
export function formatRecipes(
  recipes: Record<string, SpriteRecipeDraft>,
): string {
  const ids = Object.keys(recipes).sort();
  if (ids.length === 0) return "{}";
  const entries = ids.flatMap((id) => {
    const recipe = recipes[id];
    return recipe ? [formatEntry(id, recipe)] : [];
  });
  return ["{", ...entries, "}"].join("\n");
}

/** The value of `--name=value` on the command line, if it was given. */
export function option(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv
    .slice(2)
    .find((arg) => arg.startsWith(prefix))
    ?.slice(prefix.length);
}

/** How many fake cats `--fake=` asks for: none if it was not given. */
export function fakesAsked(): number {
  const fake = Number(option("fake") ?? 0);
  return fake > 0 ? Math.floor(fake) : 0;
}

function main() {
  const fake = fakesAsked();
  const subjects = fake > 0 ? fakeCats(fake) : undrawnCats();
  if (subjects.length === 0) {
    console.log(formatRecipes(SPRITE_RECIPES));
    console.error(
      "Every cat is drawn by hand or has a recipe already: nothing to do.",
    );
    return;
  }

  const chosen = chooseRecipes(subjects, option("seed") ?? DEFAULT_SEED);
  console.log(formatRecipes({ ...SPRITE_RECIPES, ...chosen.recipes }));

  const [a, b] = chosen.closest ?? ["", ""];
  console.error(
    [
      `${subjects.length} recipes chosen.`,
      `Within an element, over ${chosen.pairs} pairs: ` +
        `nearest ${chosen.nearest} (${a} and ${b}), ` +
        `mean ${chosen.mean.toFixed(1)}.`,
      `No new cat's grid is within ${chosen.nearestGrid} cells of ` +
        "another cat's, of any element.",
    ].join("\n"),
  );
  if (chosen.nearest < MIN_RECIPE_DISTANCE) {
    console.error(
      `That is under MIN_RECIPE_DISTANCE (${MIN_RECIPE_DISTANCE}): ` +
        "the test in cats.test.ts will fail on this table.",
    );
    process.exitCode = 1;
  }
}

const entry = process.argv[1];
if (entry !== undefined && import.meta.url === pathToFileURL(entry).href) {
  main();
}
