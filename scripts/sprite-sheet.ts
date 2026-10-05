/**
 * Writes a contact sheet of every cat's sprite, to look the whole catalogue
 * over at once: one HTML file with nothing outside it, each cat at six times
 * its size on a dark ground and again at the small size the table draws it,
 * on the cream of a card. The cats are set out by element, then by rarity.
 *
 *   pnpm sprites:sheet
 *   pnpm sprites:sheet /tmp/cats.html
 *   pnpm sprites:sheet /tmp/cats.html --fake=75
 *
 * With no path the sheet goes under the system's temporary directory, and
 * the path it was written to is printed. `--fake=75` adds the cats that
 * `pnpm sprites:recipes --fake=75` chooses recipes for, marked as fakes.
 */
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import {
  SPRITE_PATCHES,
  SPRITE_RECIPES,
  SPRITE_SIZE,
  SPRITE_ZONES,
  catSprite,
  recipeSprite,
  type SpriteRecipeDraft,
} from "~/components/sprites/cats";
import {
  ELEMENT_COATS,
  ELEMENT_PALETTES,
  furColors,
  spriteColors,
} from "~/components/sprites/palettes";
import { CAT_LIST, RARITIES, RARITY_LABELS } from "~/server/game/cats";
import { ELEMENTS, ELEMENT_LABELS } from "~/server/game/elements";

import {
  chooseRecipes,
  fakeCats,
  fakesAsked,
  option,
  type Subject,
} from "./sprite-recipes";

/** Whole multiples of the sprite: the close look, and the table's size. */
const LARGE = 6;
const SMALL = 2;

type Colors = Record<string, string | null>;

/** One cat on the sheet. */
interface Entry extends Subject {
  rows: readonly string[];
  colors: Colors;
  /** How it came to be drawn: by hand, by a recipe, or not yet. */
  source: "drawn" | "recipe" | "fake" | "base";
  /** Its recipe, written out, for the hover text. */
  note: string;
}

function describe(recipe: SpriteRecipeDraft): string {
  const parts = SPRITE_ZONES.flatMap((zone) => {
    const part = recipe[zone];
    return part === undefined ? [] : [`${zone} ${part}`];
  });
  return [...parts, `coat ${recipe.coat ?? 0}`].join(", ");
}

function frame(scale: number, content: string): string {
  const edge = SPRITE_SIZE * scale;
  return (
    `<svg viewBox="0 0 ${SPRITE_SIZE} ${SPRITE_SIZE}" width="${edge}" ` +
    `height="${edge}" shape-rendering="crispEdges">${content}</svg>`
  );
}

/** A grid's pixels as SVG, one rect to each run of a colour. */
function pixels(rows: readonly string[], colors: Colors): string {
  const rects: string[] = [];
  rows.forEach((row, y) => {
    let start = 0;
    for (let x = 1; x <= row.length; x++) {
      if (row[x] === row[start]) continue;
      const fill = colors[row[start] ?? "."];
      if (fill) {
        rects.push(
          `<rect x="${start}" y="${y}" width="${x - start}" height="1" fill="${fill}"/>`,
        );
      }
      start = x;
    }
  });
  return rects.join("");
}

function catalogueEntries(): Entry[] {
  return CAT_LIST.map(({ id, element, rarity }): Entry => {
    const recipe = SPRITE_RECIPES[id];
    const drawn = Boolean(SPRITE_PATCHES[id]);
    return {
      id,
      element,
      rarity,
      rows: catSprite(id),
      colors: spriteColors(element, rarity, id),
      source: drawn ? "drawn" : recipe ? "recipe" : "base",
      note: drawn ? "drawn by hand" : recipe ? describe(recipe) : "the base",
    };
  });
}

function fakeEntries(): Entry[] {
  const subjects = fakeCats(fakesAsked());
  if (subjects.length === 0) return [];
  const { recipes } = chooseRecipes(subjects, option("seed"));
  return subjects.flatMap((subject): Entry[] => {
    const recipe = recipes[subject.id];
    if (!recipe) return [];
    const fur =
      ELEMENT_COATS[subject.element][recipe.coat ?? 0] ??
      ELEMENT_PALETTES[subject.element];
    return [
      {
        ...subject,
        rows: recipeSprite(recipe),
        colors: furColors(fur, subject.rarity),
        source: "fake",
        note: describe(recipe),
      },
    ];
  });
}

/** A cat drawn once at the large size and shown again at the small one. */
function figure(entry: Entry): string {
  const drawing = `<g id="${entry.id}">${pixels(entry.rows, entry.colors)}</g>`;
  return (
    `<figure class="${entry.source}" title="${entry.id}: ${entry.note}">` +
    frame(LARGE, drawing) +
    `<span class="small">${frame(SMALL, `<use href="#${entry.id}"/>`)}</span>` +
    `<figcaption>${entry.id}</figcaption></figure>`
  );
}

function page(entries: readonly Entry[]): string {
  const sections = ELEMENTS.map((element) => {
    const rows = RARITIES.map((rarity) => {
      const cats = entries.filter(
        (entry) => entry.element === element && entry.rarity === rarity,
      );
      if (cats.length === 0) return "";
      return (
        `<h3>${RARITY_LABELS[rarity]} (${cats.length})</h3>` +
        `<div class="row">${cats.map(figure).join("")}</div>`
      );
    });
    return `<section><h2>${ELEMENT_LABELS[element]}</h2>${rows.join("")}</section>`;
  });

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>HaduMon sprites</title>
<style>
  body { margin: 24px; background: #1a1120; color: #f4ecdc; font: 12px/1.3 monospace; }
  h1 { font-size: 16px; }
  h2 { font-size: 14px; margin: 28px 0 0; border-top: 2px solid #f4ecdc; padding-top: 8px; }
  h3 { font-size: 12px; margin: 14px 0 6px; color: #9aa9b7; font-weight: normal; }
  .row { display: flex; flex-wrap: wrap; gap: 14px 10px; }
  figure { margin: 0; width: ${SPRITE_SIZE * LARGE + SPRITE_SIZE * SMALL + 6}px; display: grid; grid-template-columns: auto auto; gap: 4px 6px; align-items: end; }
  figure > svg { background: #4a4458; }
  .small { background: #f4ecdc; line-height: 0; }
  figcaption { grid-column: 1 / -1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .fake figcaption, .recipe figcaption { color: #d8ff4f; }
  .base figcaption { color: #ff7163; }
</style>
</head>
<body>
<h1>HaduMon sprites: ${entries.length} cats</h1>
<p>White ids are drawn by hand, lime ids are built from a recipe, coral ids are still the bare base. Hover a cat for its recipe.</p>
${sections.join("\n")}
</body>
</html>
`;
}

const target = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
const outFile = target
  ? resolve(target)
  : join(tmpdir(), "hadumon-sprites.html");
const entries = [...catalogueEntries(), ...fakeEntries()];
writeFileSync(outFile, page(entries));
console.log(`${outFile}: ${entries.length} cats`);
