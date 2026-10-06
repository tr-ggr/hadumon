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
    c(
      "sootmitt",
      "Sootmitt",
      "flame",
      "common",
      "tank",
      {
        rows: ["den"],
        cost: ["flame"],
        points: 1,
        yarnCap: 5,
        power: { timing: "played", effect: { kind: "cache", n: 2 } },
      },
      "Keeps the hearth warm by sitting in it.",
    ),
    c(
      "hearthpurr",
      "Hearthpurr",
      "flame",
      "common",
      "familiar",
      {
        rows: ["den"],
        cost: ["flame"],
        points: 2,
        yarnCap: 3,
        power: {
          timing: "between",
          on: "den",
          effect: { kind: "essence", element: "flame", n: 1 },
        },
      },
      "Appears beside any lit stove within the minute, uninvited.",
    ),
    c(
      "matchflick",
      "Matchflick",
      "flame",
      "common",
      "rogue",
      {
        rows: ["hunt", "prowl"],
        cost: ["any"],
        points: 1,
        yarnCap: 2,
        power: {
          timing: "played",
          effect: { kind: "essence", element: "flame", n: 2 },
        },
      },
      "Strikes once, brightly, and expects dinner for it.",
    ),
    c(
      "ashwhisper",
      "Ashwhisper",
      "flame",
      "common",
      "mage",
      {
        rows: ["den", "prowl"],
        cost: ["any"],
        points: 2,
        yarnCap: 3,
        power: { timing: "roundEnd", effect: { kind: "cache", n: 1 } },
      },
      "Reads the ashes every evening and always sees supper.",
    ),
    c(
      "scorchfang",
      "Scorchfang",
      "flame",
      "common",
      "bruiser",
      {
        rows: ["hunt"],
        cost: ["flame"],
        points: 3,
        yarnCap: 2,
        power: {
          timing: "roundEnd",
          effect: { kind: "essence", element: "flame", n: 1 },
        },
      },
      "Bites first and blows on it afterwards.",
    ),
    c(
      "flickertail",
      "Flickertail",
      "flame",
      "common",
      "scout",
      {
        rows: ["prowl"],
        cost: ["flame"],
        points: 2,
        yarnCap: 2,
        power: {
          timing: "activated",
          effect: { kind: "essence", element: "flame", n: 1 },
        },
      },
      "Its tail-tip glows faintly, which ruins every ambush.",
    ),
    c(
      "kilnback",
      "Kilnback",
      "flame",
      "uncommon",
      "tank",
      {
        rows: ["den", "hunt"],
        cost: ["flame", "any"],
        points: 3,
        yarnCap: 5,
        power: { timing: "played", effect: { kind: "cache", n: 2 } },
      },
      "Warm to lean on, and it knows what that is worth.",
    ),
    c(
      "coalpurr",
      "Coalpurr",
      "flame",
      "uncommon",
      "familiar",
      {
        rows: ["den"],
        cost: ["flame", "any"],
        points: 3,
        yarnCap: 4,
        power: {
          timing: "roundEnd",
          effect: { kind: "essence", element: "flame", n: 2 },
        },
      },
      "Banks itself overnight and is still warm at breakfast.",
    ),
    c(
      "brandfang",
      "Brandfang",
      "flame",
      "uncommon",
      "bruiser",
      {
        rows: ["hunt"],
        cost: ["flame", "any"],
        points: 2,
        yarnCap: 3,
        power: {
          timing: "activated",
          effect: { kind: "essence", element: "flame", n: 2 },
        },
      },
      "Leaves its mark on everything it catches, and on most of the furniture.",
    ),
    c(
      "smokestalk",
      "Smokestalk",
      "flame",
      "uncommon",
      "scout",
      {
        rows: ["prowl"],
        cost: ["flame", "any"],
        points: 3,
        yarnCap: 2,
        power: {
          timing: "between",
          on: "hunt",
          effect: { kind: "essence", element: "flame", n: 1 },
        },
      },
      "Follows other hunters at a polite distance and eats what they drop.",
    ),
    c(
      "magmaloaf",
      "Magmaloaf",
      "flame",
      "rare",
      "tank",
      {
        rows: ["den", "hunt"],
        cost: ["flame", "flame", "any"],
        points: 5,
        yarnCap: 6,
        power: {
          timing: "between",
          on: "prowl",
          effect: { kind: "cache", n: 1 },
        },
      },
      "A loaf of cat that takes all night to cool.",
    ),
    c(
      "blazepard",
      "Blazepard",
      "flame",
      "rare",
      "bruiser",
      {
        rows: ["hunt"],
        cost: ["flame", "flame", "any"],
        points: 4,
        yarnCap: 3,
        power: {
          timing: "played",
          effect: { kind: "essence", element: "flame", n: 2 },
        },
      },
      "Brings its own dinner and still asks about yours.",
    ),
    c(
      "flintslink",
      "Flintslink",
      "flame",
      "rare",
      "rogue",
      {
        rows: ["hunt", "prowl"],
        cost: ["flame", "flame", "any"],
        points: 4,
        yarnCap: 3,
        power: {
          timing: "between",
          on: "hunt",
          effect: { kind: "essence", element: "flame", n: 2 },
        },
      },
      "Takes two bites of every kill that is not its own.",
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
    c(
      "marshbelly",
      "Marshbelly",
      "mist",
      "common",
      "tank",
      {
        rows: ["den", "hunt"],
        cost: ["any", "any"],
        points: 2,
        yarnCap: 6,
        power: { timing: "played", effect: { kind: "yarnRow", n: 1 } },
      },
      "Sits in the shallows until the shallows give up and go around.",
    ),
    c(
      "sleetslip",
      "Sleetslip",
      "mist",
      "common",
      "rogue",
      {
        rows: ["hunt", "prowl"],
        cost: ["any"],
        points: 1,
        yarnCap: 2,
        power: { timing: "activated", effect: { kind: "draw", n: 1 } },
      },
      "Gone before the door has finished opening.",
    ),
    c(
      "squallfang",
      "Squallfang",
      "mist",
      "common",
      "bruiser",
      {
        rows: ["hunt"],
        cost: ["mist"],
        points: 3,
        yarnCap: 2,
        power: { timing: "played", effect: { kind: "draw", n: 1 } },
      },
      "Arrives soaked, shakes once, and that is everyone's problem.",
    ),
    c(
      "hazepurr",
      "Hazepurr",
      "mist",
      "common",
      "familiar",
      {
        rows: ["den"],
        cost: ["mist"],
        points: 2,
        yarnCap: 4,
        power: { timing: "between", on: "den", effect: { kind: "draw", n: 1 } },
      },
      "Settles on a sleeper's chest and forecasts light rain.",
    ),
    c(
      "brookskip",
      "Brookskip",
      "mist",
      "common",
      "scout",
      {
        rows: ["prowl"],
        cost: ["any"],
        points: 2,
        yarnCap: 2,
        power: { timing: "roundEnd", effect: { kind: "draw", n: 1 } },
      },
      "Knows every stepping stone, and which ones are lying.",
    ),
    c(
      "puddlemew",
      "Puddlemew",
      "mist",
      "common",
      "mage",
      {
        rows: ["den"],
        cost: ["mist"],
        points: 2,
        yarnCap: 3,
        power: {
          timing: "activated",
          effect: { kind: "essence", element: "mist", n: 1 },
        },
      },
      "Stares into a puddle until a fish feels obliged.",
    ),
    c(
      "glacierpaw",
      "Glacierpaw",
      "mist",
      "uncommon",
      "tank",
      {
        rows: ["den", "hunt"],
        cost: ["mist", "any"],
        points: 3,
        yarnCap: 6,
        power: {
          timing: "between",
          on: "hunt",
          effect: { kind: "yarnSelf", n: 1 },
        },
      },
      "Moves an inch a year and has never once been late.",
    ),
    c(
      "drizzledart",
      "Drizzledart",
      "mist",
      "uncommon",
      "rogue",
      {
        rows: ["hunt", "prowl"],
        cost: ["mist", "any"],
        points: 3,
        yarnCap: 2,
        power: { timing: "roundEnd", effect: { kind: "draw", n: 2 } },
      },
      "Slips between the raindrops and comes home dry, with your sandwich.",
    ),
    c(
      "dewspinner",
      "Dewspinner",
      "mist",
      "uncommon",
      "scout",
      {
        rows: ["prowl"],
        cost: ["mist", "any"],
        points: 2,
        yarnCap: 3,
        power: { timing: "roundEnd", effect: { kind: "yarnRow", n: 1 } },
      },
      "Strings every cobweb with beads before the others are awake.",
    ),
    c(
      "tarnseer",
      "Tarnseer",
      "mist",
      "uncommon",
      "mage",
      {
        rows: ["den", "prowl"],
        cost: ["mist", "any"],
        points: 3,
        yarnCap: 4,
        power: { timing: "played", effect: { kind: "draw", n: 2 } },
      },
      "Consults a mountain pool on all matters, chiefly lunch.",
    ),
    c(
      "monsoonpelt",
      "Monsoonpelt",
      "mist",
      "rare",
      "tank",
      {
        rows: ["den"],
        cost: ["mist", "mist", "any"],
        points: 4,
        yarnCap: 5,
        power: {
          timing: "between",
          on: "prowl",
          effect: { kind: "yarnRow", n: 1 },
        },
      },
      "Wherever it lies down, the whole row wakes up damp and somehow better for it.",
    ),
    c(
      "breakerjaw",
      "Breakerjaw",
      "mist",
      "rare",
      "bruiser",
      {
        rows: ["hunt"],
        cost: ["mist", "mist", "any"],
        points: 5,
        yarnCap: 3,
        power: { timing: "activated", effect: { kind: "draw", n: 1 } },
      },
      "Comes in like a wave and goes out the same way, carrying things.",
    ),
    c(
      "cirrusgaze",
      "Cirrusgaze",
      "mist",
      "rare",
      "mage",
      {
        rows: ["den", "prowl"],
        cost: ["mist", "mist", "any"],
        points: 4,
        yarnCap: 4,
        power: {
          timing: "between",
          on: "prowl",
          effect: { kind: "draw", n: 2 },
        },
      },
      "Reads the high clouds and is right about tomorrow slightly too often.",
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
    c(
      "fizzlekit",
      "Fizzlekit",
      "volt",
      "common",
      "rogue",
      {
        rows: ["hunt", "prowl"],
        cost: ["any"],
        points: 1,
        yarnCap: 2,
        power: { timing: "played", effect: { kind: "wild", n: 1 } },
      },
      "Went off once, by accident, and has been pleased with itself ever since.",
    ),
    c(
      "ampurr",
      "Ampurr",
      "volt",
      "common",
      "familiar",
      {
        rows: ["den"],
        cost: ["volt"],
        points: 1,
        yarnCap: 2,
        power: { timing: "activated", effect: { kind: "trade" } },
      },
      "Sells its static by the spark. No refunds.",
    ),
    c(
      "boltjaw",
      "Boltjaw",
      "volt",
      "common",
      "bruiser",
      {
        rows: ["hunt"],
        cost: ["volt"],
        points: 2,
        yarnCap: 3,
        power: { timing: "roundEnd", effect: { kind: "wild", n: 1 } },
      },
      "Chews on live wires for the flavour.",
    ),
    c(
      "coilhaunch",
      "Coilhaunch",
      "volt",
      "common",
      "tank",
      {
        rows: ["den", "hunt"],
        cost: ["any", "any"],
        points: 2,
        yarnCap: 5,
        power: { timing: "activated", effect: { kind: "trade" } },
      },
      "Stores a week of sparks in its haunches and spends them grudgingly.",
    ),
    c(
      "fusetrick",
      "Fusetrick",
      "volt",
      "common",
      "mage",
      {
        rows: ["den", "prowl"],
        cost: ["volt"],
        points: 1,
        yarnCap: 3,
        power: { timing: "played", effect: { kind: "tuckHand", draw: 2 } },
      },
      "Trades one small secret for two larger ones.",
    ),
    c(
      "wirewalker",
      "Wirewalker",
      "volt",
      "common",
      "scout",
      {
        rows: ["prowl"],
        cost: ["volt"],
        points: 2,
        yarnCap: 2,
        power: {
          timing: "between",
          on: "hunt",
          effect: { kind: "essence", element: "volt", n: 1 },
        },
      },
      "Watches every hunt from the telephone line and takes a commission.",
    ),
    c(
      "humscruff",
      "Humscruff",
      "volt",
      "uncommon",
      "familiar",
      {
        rows: ["den"],
        cost: ["volt", "any"],
        points: 2,
        yarnCap: 3,
        power: { timing: "activated", effect: { kind: "tuckHand", draw: 1 } },
      },
      "Files away whatever it is handed and hums until it is handed more.",
    ),
    c(
      "shockruff",
      "Shockruff",
      "volt",
      "uncommon",
      "bruiser",
      {
        rows: ["hunt"],
        cost: ["volt", "any"],
        points: 3,
        yarnCap: 3,
        power: { timing: "played", effect: { kind: "wild", n: 1 } },
      },
      "Lands with a crack and leaves a treat where it hit.",
    ),
    c(
      "zipdash",
      "Zipdash",
      "volt",
      "uncommon",
      "scout",
      {
        rows: ["prowl", "hunt"],
        cost: ["volt", "any"],
        points: 2,
        yarnCap: 2,
        power: {
          timing: "played",
          effect: { kind: "essence", element: "volt", n: 2 },
        },
      },
      "Has already been, eaten, and come back to tell you about it.",
    ),
    c(
      "staticsage",
      "Staticsage",
      "volt",
      "uncommon",
      "mage",
      {
        rows: ["den"],
        cost: ["volt", "any"],
        points: 2,
        yarnCap: 4,
        power: { timing: "between", on: "den", effect: { kind: "wild", n: 1 } },
      },
      "Feels a storm three dens away and charges accordingly.",
    ),
    c(
      "thunderbulk",
      "Thunderbulk",
      "volt",
      "rare",
      "tank",
      {
        rows: ["den", "hunt"],
        cost: ["volt", "volt", "any"],
        points: 5,
        yarnCap: 6,
        power: { timing: "played", effect: { kind: "yarnSelf", n: 3 } },
      },
      "Arrives fully wound and sits down on the fuse box.",
    ),
    c(
      "flashscribe",
      "Flashscribe",
      "volt",
      "rare",
      "mage",
      {
        rows: ["den", "prowl"],
        cost: ["volt", "volt", "any"],
        points: 4,
        yarnCap: 3,
        power: { timing: "activated", effect: { kind: "tuckHand", draw: 2 } },
      },
      "Writes each answer on a spark and has to be quick about reading it.",
    ),
    c(
      "afterclap",
      "Afterclap",
      "volt",
      "rare",
      "rogue",
      {
        rows: ["hunt", "prowl"],
        cost: ["volt", "volt", "any"],
        points: 4,
        yarnCap: 2,
        power: { timing: "activated", effect: { kind: "encore" } },
      },
      "By the time you hear it, the whole row has gone off again.",
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
    c(
      "mossback",
      "Mossback",
      "thorn",
      "common",
      "tank",
      {
        rows: ["den", "hunt"],
        cost: ["thorn"],
        points: 1,
        yarnCap: 6,
        power: { timing: "roundEnd", effect: { kind: "yarnSelf", n: 1 } },
      },
      "Sat down in spring. By autumn it was landscape.",
    ),
    c(
      "cloverknead",
      "Cloverknead",
      "thorn",
      "common",
      "familiar",
      {
        rows: ["den"],
        cost: ["thorn"],
        points: 1,
        yarnCap: 5,
        power: { timing: "activated", effect: { kind: "yarnSelf", n: 1 } },
      },
      "Kneads the same patch of clover every day. The clover has stopped objecting.",
    ),
    c(
      "twigstep",
      "Twigstep",
      "thorn",
      "common",
      "scout",
      {
        rows: ["prowl"],
        cost: ["thorn"],
        points: 2,
        yarnCap: 3,
        power: { timing: "played", effect: { kind: "yarnRow", n: 1 } },
      },
      "Leaves a little of itself on every branch it passes.",
    ),
    c(
      "nettlemew",
      "Nettlemew",
      "thorn",
      "common",
      "mage",
      {
        rows: ["den", "prowl"],
        cost: ["thorn"],
        points: 1,
        yarnCap: 4,
        power: {
          timing: "activated",
          effect: { kind: "essence", element: "thorn", n: 1 },
        },
      },
      "Grows its own supper in a window box and shares none of it.",
    ),
    c(
      "oakshoulder",
      "Oakshoulder",
      "thorn",
      "common",
      "bruiser",
      {
        rows: ["hunt"],
        cost: ["thorn"],
        points: 3,
        yarnCap: 4,
        power: null,
      },
      "Has never lost an argument with a door.",
    ),
    c(
      "tanglehide",
      "Tanglehide",
      "thorn",
      "common",
      "tank",
      {
        rows: ["den", "hunt"],
        cost: ["any", "any"],
        points: 2,
        yarnCap: 6,
        power: { timing: "played", effect: { kind: "yarnSelf", n: 2 } },
      },
      "Collects burrs the way other cats collect grudges.",
    ),
    c(
      "briarbroker",
      "Briarbroker",
      "thorn",
      "uncommon",
      "tank",
      {
        rows: ["den", "hunt"],
        cost: ["thorn", "any"],
        points: 3,
        yarnCap: 6,
        power: { timing: "activated", effect: { kind: "trade" } },
      },
      "Will part with a burr for a Treat, and counts both twice.",
    ),
    c(
      "ivycurl",
      "Ivycurl",
      "thorn",
      "uncommon",
      "familiar",
      {
        rows: ["den"],
        cost: ["thorn", "any"],
        points: 2,
        yarnCap: 5,
        power: { timing: "played", effect: { kind: "yarnSelf", n: 3 } },
      },
      "Winds itself around the warmest thing in the den, which is usually you.",
    ),
    c(
      "thicketlurk",
      "Thicketlurk",
      "thorn",
      "uncommon",
      "scout",
      {
        rows: ["prowl", "hunt"],
        cost: ["thorn", "any"],
        points: 3,
        yarnCap: 3,
        power: {
          timing: "between",
          on: "prowl",
          effect: { kind: "yarnSelf", n: 1 },
        },
      },
      "Watches the others go out at night and knits until they are back.",
    ),
    c(
      "bristlesnatch",
      "Bristlesnatch",
      "thorn",
      "uncommon",
      "rogue",
      {
        rows: ["hunt", "prowl"],
        cost: ["thorn", "any"],
        points: 2,
        yarnCap: 3,
        power: {
          timing: "activated",
          effect: { kind: "pounce", maxPoints: 3 },
        },
      },
      "Anything left on a low branch is, by its reckoning, lost property.",
    ),
    c(
      "elderbark",
      "Elderbark",
      "thorn",
      "rare",
      "tank",
      {
        rows: ["den", "hunt"],
        cost: ["thorn", "thorn", "any"],
        points: 4,
        yarnCap: 6,
        power: { timing: "activated", effect: { kind: "yarnSelf", n: 1 } },
      },
      "Adds a ring every time anyone so much as looks at it.",
    ),
    c(
      "brackenhorn",
      "Brackenhorn",
      "thorn",
      "rare",
      "bruiser",
      {
        rows: ["hunt"],
        cost: ["thorn", "thorn", "any"],
        points: 5,
        yarnCap: 4,
        power: {
          timing: "between",
          on: "hunt",
          effect: { kind: "yarnSelf", n: 1 },
        },
      },
      "Puts on a new point for every hunt it was not invited to.",
    ),
    c(
      "willowweave",
      "Willowweave",
      "thorn",
      "rare",
      "mage",
      {
        rows: ["den", "prowl"],
        cost: ["thorn", "thorn", "any"],
        points: 4,
        yarnCap: 4,
        power: {
          timing: "between",
          on: "den",
          effect: { kind: "yarnRow", n: 1 },
        },
      },
      "Whenever the neighbours tidy their den, hers grows a little too.",
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
    c(
      "murkwink",
      "Murkwink",
      "shade",
      "common",
      "scout",
      {
        rows: ["prowl"],
        cost: ["shade"],
        points: 2,
        yarnCap: 2,
        power: {
          timing: "between",
          on: "prowl",
          effect: { kind: "tuckDeck", n: 1 },
        },
      },
      "Blink while the others are out prowling and something of yours is gone.",
    ),
    c(
      "inkmaul",
      "Inkmaul",
      "shade",
      "common",
      "bruiser",
      {
        rows: ["hunt"],
        cost: ["shade"],
        points: 3,
        yarnCap: 2,
        power: { timing: "played", effect: { kind: "pounce", maxPoints: 3 } },
      },
      "Lands on the first thing it sees in the dark and works out what it was later.",
    ),
    c(
      "cellarlump",
      "Cellarlump",
      "shade",
      "common",
      "tank",
      {
        rows: ["den", "hunt"],
        cost: ["shade"],
        points: 2,
        yarnCap: 5,
        power: {
          timing: "between",
          on: "prowl",
          effect: { kind: "yarnSelf", n: 1 },
        },
      },
      "Has not moved since the lamps went out, but is somehow larger.",
    ),
    c(
      "hushear",
      "Hushear",
      "shade",
      "common",
      "familiar",
      {
        rows: ["den"],
        cost: ["shade"],
        points: 2,
        yarnCap: 3,
        power: {
          timing: "between",
          on: "den",
          effect: { kind: "pounce", maxPoints: 3 },
        },
      },
      "Hears a den settle three streets off and is under the bed before you are.",
    ),
    c(
      "nightfilch",
      "Nightfilch",
      "shade",
      "common",
      "rogue",
      {
        rows: ["hunt", "prowl"],
        cost: ["any"],
        points: 1,
        yarnCap: 2,
        power: { timing: "played", effect: { kind: "tuckDeck", n: 2 } },
      },
      "Leaves with more than it came with, and never by the same door.",
    ),
    c(
      "vesperhex",
      "Vesperhex",
      "shade",
      "common",
      "mage",
      {
        rows: ["den", "prowl"],
        cost: ["shade"],
        points: 2,
        yarnCap: 3,
        power: { timing: "roundEnd", effect: { kind: "pounce", maxPoints: 3 } },
      },
      "Puts one thing away at the end of each day and will not say where.",
    ),
    c(
      "barrowbulk",
      "Barrowbulk",
      "shade",
      "uncommon",
      "tank",
      {
        rows: ["den", "hunt"],
        cost: ["shade", "any"],
        points: 2,
        yarnCap: 5,
        power: {
          timing: "between",
          on: "hunt",
          effect: { kind: "essence", element: "shade", n: 1 },
        },
      },
      "Lies across the path home and takes its toll in pork.",
    ),
    c(
      "sablestrike",
      "Sablestrike",
      "shade",
      "uncommon",
      "bruiser",
      {
        rows: ["hunt"],
        cost: ["shade", "any"],
        points: 3,
        yarnCap: 3,
        power: {
          timing: "between",
          on: "prowl",
          effect: { kind: "pounce", maxPoints: 3 },
        },
      },
      "Waits for someone else to go out prowling, then takes the house.",
    ),
    c(
      "eaveswatch",
      "Eaveswatch",
      "shade",
      "uncommon",
      "scout",
      {
        rows: ["prowl"],
        cost: ["shade", "any"],
        points: 3,
        yarnCap: 3,
        power: {
          timing: "between",
          on: "hunt",
          effect: { kind: "tuckDeck", n: 1 },
        },
      },
      "Watches every hunt from the gutter and files away whatever falls.",
    ),
    c(
      "omenpaw",
      "Omenpaw",
      "shade",
      "uncommon",
      "mage",
      {
        rows: ["den", "prowl"],
        cost: ["shade", "any"],
        points: 3,
        yarnCap: 4,
        power: {
          timing: "activated",
          effect: { kind: "pounce", maxPoints: 2 },
        },
      },
      "Predicts small misfortunes and then arranges them.",
    ),
    c(
      "catacombra",
      "Catacombra",
      "shade",
      "rare",
      "tank",
      {
        rows: ["den", "hunt"],
        cost: ["shade", "shade", "any"],
        points: 5,
        yarnCap: 6,
        power: {
          timing: "between",
          on: "den",
          effect: { kind: "tuckDeck", n: 1 },
        },
      },
      "Everything that goes missing at night ends up underneath it, filed.",
    ),
    c(
      "onyxmaw",
      "Onyxmaw",
      "shade",
      "rare",
      "bruiser",
      {
        rows: ["hunt"],
        cost: ["shade", "shade", "any"],
        points: 4,
        yarnCap: 3,
        power: {
          timing: "activated",
          effect: { kind: "pounce", maxPoints: 4 },
        },
      },
      "Opens wide enough to take almost anything, and usually does.",
    ),
    c(
      "wraithflit",
      "Wraithflit",
      "shade",
      "rare",
      "scout",
      {
        rows: ["prowl", "hunt"],
        cost: ["shade", "shade", "any"],
        points: 4,
        yarnCap: 2,
        power: {
          timing: "between",
          on: "hunt",
          effect: { kind: "draw", n: 2 },
        },
      },
      "Follows every hunt unseen and comes back knowing two things it should not.",
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
    c(
      "larderqueen",
      "Larderqueen",
      "flame",
      "epic",
      "familiar",
      {
        rows: ["den", "hunt"],
        cost: ["flame", "flame", "any"],
        points: 5,
        yarnCap: 4,
        power: {
          timing: "between",
          on: "hunt",
          effect: { kind: "cache", n: 2 },
        },
      },
      "Everything the others catch passes through her paws on its way to the larder.",
    ),
    c(
      "echomere",
      "Echomere",
      "mist",
      "epic",
      "familiar",
      {
        rows: ["den", "prowl"],
        cost: ["mist", "mist", "any"],
        points: 5,
        yarnCap: 3,
        power: { timing: "activated", effect: { kind: "encore" } },
      },
      "Still enough that everything beside it happens twice.",
    ),
    c(
      "borealmane",
      "Borealmane",
      "volt",
      "epic",
      "familiar",
      {
        rows: ["den", "hunt"],
        cost: ["volt", "volt", "any"],
        points: 5,
        yarnCap: 4,
        power: { timing: "roundEnd", effect: { kind: "wild", n: 2 } },
      },
      "Lights the whole sky at the end of the day and expects to be paid for it.",
    ),
    c(
      "everroot",
      "Everroot",
      "thorn",
      "epic",
      "tank",
      {
        rows: ["den", "hunt"],
        cost: ["thorn", "thorn", "any"],
        points: 5,
        yarnCap: 6,
        power: {
          timing: "between",
          on: "any",
          effect: { kind: "yarnSelf", n: 1 },
        },
      },
      "Grows a little while you are looking, and a little more while you are not.",
    ),
    c(
      "thistlecrown",
      "Thistlecrown",
      "thorn",
      "epic",
      "bruiser",
      {
        rows: ["hunt"],
        cost: ["thorn", "thorn", "any"],
        points: 6,
        yarnCap: 5,
        power: { timing: "roundEnd", effect: { kind: "yarnSelf", n: 3 } },
      },
      "Wears every season at once and sheds the lot on the stairs.",
    ),
    c(
      "midnightmare",
      "Midnightmare",
      "shade",
      "epic",
      "rogue",
      {
        rows: ["hunt", "prowl"],
        cost: ["shade", "shade", "any"],
        points: 5,
        yarnCap: 2,
        power: {
          timing: "between",
          on: "any",
          effect: { kind: "pounce", maxPoints: 2 },
        },
      },
      "Whatever you do, something small of yours goes missing straight after.",
    ),
    c(
      "lethewhisker",
      "Lethewhisker",
      "shade",
      "epic",
      "mage",
      {
        rows: ["prowl", "hunt"],
        cost: ["shade", "shade", "any"],
        points: 5,
        yarnCap: 3,
        power: { timing: "activated", effect: { kind: "tuckDeck", n: 2 } },
      },
      "Two things vanish each time she is asked, and nobody can say what they were.",
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
    c(
      "heliopard",
      "Heliopard",
      "flame",
      "legendary",
      "bruiser",
      {
        rows: ["hunt", "den"],
        cost: ["flame", "flame", "any", "any"],
        points: 8,
        yarnCap: 4,
        power: {
          timing: "between",
          on: "den",
          effect: { kind: "cache", n: 1 },
        },
        aura: { kind: "treat", n: 1 },
      },
      "The sun comes up when it stretches, or so it lets everyone believe.",
    ),
    c(
      "stussy",
      "Stussy",
      "flame",
      "legendary",
      "familiar",
      {
        rows: ["hunt", "den", "prowl"],
        cost: ["flame", "flame", "any", "any"],
        points: 8,
        yarnCap: 5,
        power: { timing: "activated", effect: { kind: "cache", n: 1 } },
        aura: { kind: "reward", n: 1 },
      },
      "Ginger from nose to tail, and the warmest thing in any room she walks into.",
    ),
    c(
      "tidelune",
      "Tidelune",
      "mist",
      "legendary",
      "familiar",
      {
        rows: ["den", "prowl"],
        cost: ["mist", "mist", "any", "any"],
        points: 8,
        yarnCap: 5,
        power: {
          timing: "between",
          on: "hunt",
          effect: { kind: "yarnRow", n: 1 },
        },
        aura: { kind: "reward", n: 1 },
      },
      "The sea goes out when she yawns and comes back when she is hungry.",
    ),
    c(
      "canopyx",
      "Canopyx",
      "thorn",
      "legendary",
      "tank",
      {
        rows: ["den", "hunt"],
        cost: ["thorn", "thorn", "any", "any"],
        points: 9,
        yarnCap: 6,
        power: { timing: "roundEnd", effect: { kind: "yarnRow", n: 1 } },
        aura: { kind: "discount", n: 1 },
      },
      "The whole forest is its den; the rest of you are staying over.",
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

/**
 * Rules text in the two parts a card prints apart: what sets it off, and what
 * it does. The second is a sentence less its first word's capital.
 */
export interface RulesParts {
  trigger: string;
  text: string;
}

export function powerParts(power: Power): RulesParts {
  const effect = describeEffect(power.effect);
  return {
    trigger: TIMING_PREFIX[power.timing],
    text:
      power.timing === "between"
        ? `${WATCHED_TEXT[power.on]}, ${effect}.`
        : `${effect}.`,
  };
}

/** A legendary's relic, in the same two parts. */
export function auraParts(aura: Aura): RulesParts {
  const text = {
    treat: `gain ${plural(aura.n, TREAT_LABEL)} after each of your turns`,
    discount: `your cats cost ${aura.n} less food to play`,
    reward: `every lane gives ${aura.n} more`,
  }[aura.kind];
  return { trigger: "Relic", text: `from now on, ${text}.` };
}

function sentence({ trigger, text }: RulesParts): string {
  return `${trigger}: ${text}`;
}

/** Rules text shown on the card, generated so wording stays consistent. */
export function describePower(power: Power): string {
  return sentence(powerParts(power));
}

/** A legendary's relic as printed on its card. */
export function describeAura(aura: Aura): string {
  return sentence(auraParts(aura));
}
