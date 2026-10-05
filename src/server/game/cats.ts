/**
 * The cat catalogue: every card that can appear in a run deck.
 *
 * A cat is pure data. Its power is one effect primitive plus a timing; the
 * match engine in `match.ts` is the only thing that interprets it.
 */

import { FOOD_LABELS, TREAT_LABEL, type Element } from "./elements";

export const RARITIES = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
] as const;
export type Rarity = (typeof RARITIES)[number];

export const RARITY_LABELS: Record<Rarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

export const ARCHETYPES = [
  "rogue",
  "bruiser",
  "familiar",
  "scout",
  "mage",
  "tank",
] as const;
export type Archetype = (typeof ARCHETYPES)[number];

export const ARCHETYPE_LABELS: Record<Archetype, string> = {
  rogue: "Rogue",
  bruiser: "Bruiser",
  familiar: "Familiar",
  scout: "Scout",
  mage: "Mage",
  tank: "Tank",
};

/** The three habitat rows. Activating one is a turn. */
export const ROWS = ["hunt", "den", "prowl"] as const;
export type Row = (typeof ROWS)[number];

export const ROW_LABELS: Record<Row, string> = {
  hunt: "Hunt",
  den: "Den",
  prowl: "Prowl",
};

/** One pip of a cat's food cost. `any` is paid with any food. */
export type CostPip = Element | "any";

/**
 * What a "between turns" power watches the other seat for: the row it
 * activates, or any turn at all, a played cat included.
 */
export type Watched = Row | "any";

export type Effect =
  /** Gain essence of one element from the supply. */
  | { kind: "essence"; element: Element; n: number }
  /** Gain wild essence, which pays for any pip. */
  | { kind: "wild"; n: number }
  /** Lay yarn on this cat, up to its capacity. */
  | { kind: "yarnSelf"; n: number }
  /** Lay yarn on every cat in this cat's row. */
  | { kind: "yarnRow"; n: number }
  /** Draw from the deck. */
  | { kind: "draw"; n: number }
  /** Cache essence on this cat; each is worth a point. */
  | { kind: "cache"; n: number }
  /** Tuck the top cards of the deck under this cat; each is worth a point. */
  | { kind: "tuckDeck"; n: number }
  /** Reveal the top card: tuck it if it is small enough, else discard it. */
  | { kind: "pounce"; maxPoints: number }
  /** Player choice: may tuck a hand card under this cat to draw. */
  | { kind: "tuckHand"; draw: number }
  /** Player choice: may spend 1 yarn from this cat for 1 wild essence. */
  | { kind: "trade" }
  /** Every other cat in this cat's row fires its activated power again. */
  | { kind: "encore" };

export type Power =
  | { timing: "played" | "activated" | "roundEnd"; effect: Effect }
  | { timing: "between"; on: Watched; effect: Effect };

export type Timing = Power["timing"];

/**
 * A legendary's relic: a lasting change it makes for as long as it is on
 * the board. `aura` in the code, since a relic there is already the kind a
 * run carries from match to match (`relics.ts`).
 */
export type Aura =
  /** Gain wild essence after each of the player's turns. */
  | { kind: "treat"; n: number }
  /** Every cat costs fewer pips to play. */
  | { kind: "discount"; n: number }
  /** Every row gives more when it is activated. */
  | { kind: "reward"; n: number };

export interface Cat {
  id: string;
  name: string;
  element: Element;
  rarity: Rarity;
  archetype: Archetype;
  /** Rows this cat may be played into. */
  rows: readonly Row[];
  cost: readonly CostPip[];
  points: number;
  /** Most yarn this cat can hold. */
  yarnCap: number;
  power: Power | null;
  /** Legendaries only. */
  aura: Aura | null;
  flavor: string;
}

interface CatRules {
  rows: readonly Row[];
  cost: readonly CostPip[];
  points: number;
  yarnCap: number;
  power: Power | null;
  aura?: Aura;
}

function c(
  id: string,
  name: string,
  element: Element,
  rarity: Rarity,
  archetype: Archetype,
  rules: CatRules,
  flavor: string,
): Cat {
  return { id, name, element, rarity, archetype, aura: null, ...rules, flavor };
}

/** The complete HaduMon catalogue. Ids are stable and stored in run state. */
export const CATS: Record<string, Cat> = Object.fromEntries(
  [
    /* ------------------------------------------------------------- flame */
    c(
      "flameclaw",
      "Flameclaw",
      "flame",
      "common",
      "bruiser",
      {
        rows: ["hunt"],
        cost: ["flame"],
        points: 2,
        yarnCap: 3,
        power: {
          timing: "activated",
          effect: { kind: "essence", element: "flame", n: 1 },
        },
      },
      "Sharpens its claws on smouldering coals and purrs at the sparks.",
    ),
    c(
      "emberkit",
      "Emberkit",
      "flame",
      "common",
      "scout",
      {
        rows: ["prowl", "hunt"],
        cost: ["any"],
        points: 1,
        yarnCap: 2,
        power: { timing: "played", effect: { kind: "draw", n: 2 } },
      },
      "Leaves tiny scorch-marks wherever it naps.",
    ),
    c(
      "cinderpounce",
      "Cinderpounce",
      "flame",
      "uncommon",
      "rogue",
      {
        rows: ["hunt", "prowl"],
        cost: ["flame", "any"],
        points: 3,
        yarnCap: 2,
        power: {
          timing: "activated",
          effect: { kind: "pounce", maxPoints: 2 },
        },
      },
      "Strikes from a cloud of ash, then vanishes into the smoke.",
    ),
    c(
      "pyrelynx",
      "Pyrelynx",
      "flame",
      "rare",
      "mage",
      {
        rows: ["den", "prowl"],
        cost: ["flame", "flame", "any"],
        points: 4,
        yarnCap: 3,
        power: { timing: "activated", effect: { kind: "cache", n: 1 } },
      },
      "Its whiskers trace burning sigils in the night air.",
    ),

    /* -------------------------------------------------------------- mist */
    c(
      "mistpaw",
      "Mistpaw",
      "mist",
      "common",
      "scout",
      {
        rows: ["prowl"],
        cost: ["mist"],
        points: 2,
        yarnCap: 3,
        power: { timing: "activated", effect: { kind: "draw", n: 1 } },
      },
      "Pads across water without leaving a single ripple.",
    ),
    c(
      "dewhisker",
      "Dewhisker",
      "mist",
      "common",
      "mage",
      {
        rows: ["den", "prowl"],
        cost: ["any"],
        points: 1,
        yarnCap: 4,
        power: { timing: "played", effect: { kind: "yarnSelf", n: 2 } },
      },
      "Collects morning dew on its whiskers to read the weather.",
    ),
    c(
      "brumefang",
      "Brumefang",
      "mist",
      "uncommon",
      "familiar",
      {
        rows: ["den"],
        cost: ["mist", "any"],
        points: 3,
        yarnCap: 4,
        power: {
          timing: "between",
          on: "hunt",
          effect: { kind: "essence", element: "mist", n: 1 },
        },
      },
      "Sailors say a fog that follows you home is a Brumefang.",
    ),
    c(
      "nimbustail",
      "Nimbustail",
      "mist",
      "rare",
      "familiar",
      {
        rows: ["den", "hunt"],
        cost: ["mist", "mist", "any"],
        points: 4,
        yarnCap: 5,
        power: { timing: "roundEnd", effect: { kind: "yarnRow", n: 1 } },
      },
      "Its tails trail thunderheads that smell of rain.",
    ),

    /* -------------------------------------------------------------- volt */
    c(
      "voltwhisk",
      "Voltwhisk",
      "volt",
      "common",
      "scout",
      {
        rows: ["prowl", "hunt"],
        cost: ["volt"],
        points: 2,
        yarnCap: 2,
        power: { timing: "activated", effect: { kind: "tuckHand", draw: 1 } },
      },
      "Static clings to its coat; petting it is a gamble.",
    ),
    c(
      "sparkmew",
      "Sparkmew",
      "volt",
      "common",
      "mage",
      {
        rows: ["den"],
        cost: ["any"],
        points: 2,
        yarnCap: 3,
        power: { timing: "activated", effect: { kind: "yarnSelf", n: 1 } },
      },
      "Mews in morse. Nobody has decoded it yet.",
    ),
    c(
      "joltpad",
      "Joltpad",
      "volt",
      "uncommon",
      "rogue",
      {
        rows: ["hunt", "prowl"],
        cost: ["volt", "any"],
        points: 2,
        yarnCap: 3,
        power: { timing: "activated", effect: { kind: "trade" } },
      },
      "Its paw-pads spark on stone, so it hunts on rooftops.",
    ),
    c(
      "arcpurr",
      "Arcpurr",
      "volt",
      "rare",
      "bruiser",
      {
        rows: ["hunt"],
        cost: ["volt", "volt", "any"],
        points: 4,
        yarnCap: 2,
        power: { timing: "activated", effect: { kind: "wild", n: 1 } },
      },
      "A purr you feel in your teeth from three rooms away.",
    ),

    /* ------------------------------------------------------------- thorn */
    c(
      "thornkit",
      "Thornkit",
      "thorn",
      "common",
      "rogue",
      {
        rows: ["hunt", "prowl"],
        cost: ["thorn"],
        points: 2,
        yarnCap: 2,
        power: {
          timing: "activated",
          effect: { kind: "pounce", maxPoints: 2 },
        },
      },
      "Hides in bramble patches and ambushes anything ankle-height.",
    ),
    c(
      "bramblepaw",
      "Bramblepaw",
      "thorn",
      "common",
      "tank",
      {
        rows: ["den", "hunt"],
        cost: ["any", "any"],
        points: 3,
        yarnCap: 5,
        power: null,
      },
      "Grows a hedge of burrs each spring and refuses to be brushed.",
    ),
    c(
      "burrfang",
      "Burrfang",
      "thorn",
      "uncommon",
      "bruiser",
      {
        rows: ["hunt"],
        cost: ["thorn", "any"],
        points: 3,
        yarnCap: 3,
        power: {
          timing: "activated",
          effect: { kind: "essence", element: "thorn", n: 1 },
        },
      },
      "Fangs like rose-thorns; a bite that takes root.",
    ),
    c(
      "verdantmane",
      "Verdantmane",
      "thorn",
      "rare",
      "tank",
      {
        rows: ["den"],
        cost: ["thorn", "thorn", "any"],
        points: 5,
        yarnCap: 6,
        power: { timing: "roundEnd", effect: { kind: "yarnSelf", n: 2 } },
      },
      "Moss grows along its shoulders. It has not moved since Tuesday.",
    ),

    /* ------------------------------------------------------------- shade */
    c(
      "shadewhisker",
      "Shadewhisker",
      "shade",
      "common",
      "rogue",
      {
        rows: ["hunt", "prowl"],
        cost: ["shade"],
        points: 2,
        yarnCap: 2,
        power: {
          timing: "between",
          on: "prowl",
          effect: { kind: "draw", n: 1 },
        },
      },
      "Only its grin arrives on time; the rest catches up later.",
    ),
    c(
      "duskmew",
      "Duskmew",
      "shade",
      "common",
      "mage",
      {
        rows: ["den", "prowl"],
        cost: ["any"],
        points: 1,
        yarnCap: 3,
        power: { timing: "activated", effect: { kind: "tuckDeck", n: 1 } },
      },
      "Sings the sun down every evening, whether it needs it or not.",
    ),
    c(
      "gloomtail",
      "Gloomtail",
      "shade",
      "uncommon",
      "familiar",
      {
        rows: ["den"],
        cost: ["shade", "any"],
        points: 3,
        yarnCap: 4,
        power: {
          timing: "between",
          on: "den",
          effect: { kind: "yarnSelf", n: 1 },
        },
      },
      "Keeps a spare shadow in case it loses the first.",
    ),
    c(
      "umbralynx",
      "Umbralynx",
      "shade",
      "rare",
      "rogue",
      {
        rows: ["hunt", "prowl"],
        cost: ["shade", "shade", "any"],
        points: 4,
        yarnCap: 2,
        power: {
          timing: "activated",
          effect: { kind: "pounce", maxPoints: 3 },
        },
      },
      "Steps between lamp-posts without crossing the light.",
    ),

    /* -------------------------------------------------------------- epic */
    c(
      "infernomane",
      "Infernomane",
      "flame",
      "epic",
      "bruiser",
      {
        rows: ["hunt"],
        cost: ["flame", "flame", "any"],
        points: 5,
        yarnCap: 3,
        power: { timing: "roundEnd", effect: { kind: "cache", n: 2 } },
      },
      "Its mane is a slow wildfire that never quite catches.",
    ),
    c(
      "stormsabre",
      "Stormsabre",
      "volt",
      "epic",
      "rogue",
      {
        rows: ["hunt", "prowl"],
        cost: ["volt", "volt", "any"],
        points: 5,
        yarnCap: 2,
        power: { timing: "activated", effect: { kind: "draw", n: 2 } },
      },
      "Thunder arrives after it does, apologising.",
    ),
    c(
      "oraclemew",
      "Oraclemew",
      "mist",
      "epic",
      "mage",
      {
        rows: ["den", "prowl"],
        cost: ["mist", "mist", "any"],
        points: 5,
        yarnCap: 4,
        power: { timing: "activated", effect: { kind: "yarnRow", n: 1 } },
      },
      "Reads futures in condensation. Charges in fish.",
    ),

    /* --------------------------------------------------------- legendary */
    c(
      "nyxaroth",
      "Nyxaroth",
      "shade",
      "legendary",
      "familiar",
      {
        rows: ["hunt", "den", "prowl"],
        cost: ["shade", "shade", "any", "any"],
        points: 8,
        yarnCap: 4,
        power: {
          timing: "between",
          on: "any",
          effect: { kind: "yarnSelf", n: 1 },
        },
        aura: { kind: "discount", n: 1 },
      },
      "Nine tails, one of which is always somewhere else.",
    ),
    c(
      "aurelynx",
      "Aurelynx",
      "volt",
      "legendary",
      "tank",
      {
        rows: ["den", "hunt"],
        cost: ["volt", "volt", "any", "any"],
        points: 9,
        yarnCap: 6,
        power: { timing: "played", effect: { kind: "yarnSelf", n: 3 } },
        aura: { kind: "reward", n: 1 },
      },
      "A living lightning rod in gilded plate. Storms ask permission.",
    ),
    c(
      "hadu",
      "Hadu",
      "shade",
      "legendary",
      "familiar",
      {
        rows: ["hunt", "den", "prowl"],
        cost: ["any", "any", "any"],
        points: 10,
        yarnCap: 9,
        power: { timing: "activated", effect: { kind: "encore" } },
        aura: { kind: "treat", n: 1 },
      },
      "Loafs on the warm laptop with his paws crossed. The game is named after him, and he knows it.",
    ),
  ].map((cat) => [cat.id, cat] as const),
);

export const CAT_LIST: Cat[] = Object.values(CATS);

export function getCat(catId: string): Cat {
  const cat = CATS[catId];
  if (!cat) throw new Error(`Unknown cat: ${catId}`);
  return cat;
}

/** What a cat costs to play with `discount` pips taken off, the last first. */
export function playCost(catId: string, discount = 0): readonly CostPip[] {
  const cost = getCat(catId).cost;
  return discount > 0
    ? cost.slice(0, Math.max(0, cost.length - discount))
    : cost;
}

export function catsByRarity(rarity: Rarity): Cat[] {
  return CAT_LIST.filter((cat) => cat.rarity === rarity);
}

export function catsByElement(element: Element): Cat[] {
  return CAT_LIST.filter((cat) => cat.element === element);
}

const TIMING_PREFIX: Record<Timing, string> = {
  played: "When played",
  activated: "When activated",
  between: "Between turns",
  roundEnd: "End of round",
};

const WATCHED_TEXT: Record<Watched, string> = {
  any: "after each of the rival's turns",
  hunt: "when the rival hunts",
  den: "when the rival goes to the Den",
  prowl: "when the rival prowls",
};

function plural(n: number, word: string): string {
  return n === 1 ? `1 ${word}` : `${n} ${word}s`;
}

export function describeEffect(effect: Effect): string {
  switch (effect.kind) {
    case "essence":
      return `gain ${effect.n} ${FOOD_LABELS[effect.element]}`;
    case "wild":
      return `gain ${plural(effect.n, TREAT_LABEL)}`;
    case "yarnSelf":
      return `lay ${effect.n} yarn on this cat`;
    case "yarnRow":
      return `lay ${effect.n} yarn on each cat in this row`;
    case "draw":
      return `draw ${plural(effect.n, "cat")}`;
    case "cache":
      return `cache ${effect.n} food on this cat`;
    case "tuckDeck":
      return `tuck ${plural(effect.n, "cat")} from the deck under this cat`;
    case "pounce":
      return `reveal the top cat of the deck; tuck it if it is worth ${effect.maxPoints} or less, otherwise discard it`;
    case "tuckHand":
      return `you may tuck a cat from your hand to draw ${plural(effect.draw, "cat")}`;
    case "trade":
      return `you may spend 1 yarn from this cat to gain 1 ${TREAT_LABEL}`;
    case "encore":
      return "every other cat in this row fires again";
  }
}

/** Rules text shown on the card, generated so wording stays consistent. */
export function describePower(power: Power): string {
  const effect = describeEffect(power.effect);
  if (power.timing === "between") {
    return `${TIMING_PREFIX.between}: ${WATCHED_TEXT[power.on]}, ${effect}.`;
  }
  return `${TIMING_PREFIX[power.timing]}: ${effect}.`;
}

/** A legendary's relic as printed on its card. */
export function describeAura(aura: Aura): string {
  const text = {
    treat: `gain ${plural(aura.n, TREAT_LABEL)} after each of your turns`,
    discount: `your cats cost ${aura.n} less food to play`,
    reward: `every lane gives ${aura.n} more`,
  }[aura.kind];
  return `Relic: from now on, ${text}.`;
}
