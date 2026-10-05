/**
 * Cosmetics: what a player's hadu wears, and how their table and tower are
 * dressed. None of it touches a rule. Every slot has one piece that is free
 * and worn from the start; the rest come out of the two cosmetic packs
 * (`packs.ts`). The drawings live with the sprites, keyed by these ids.
 */

import type { Rarity } from "./cats";

/** What a hadu wears. `halo` is the aura drawn behind it: `Aura` is a legendary's rule. */
export const HADU_SLOTS = ["hat", "eyes", "body", "tail", "halo"] as const;
/** How the table and the tower are dressed. */
export const TABLE_SLOTS = ["mat", "cloth", "tower", "sky"] as const;
export const COSMETIC_SLOTS = [...HADU_SLOTS, ...TABLE_SLOTS] as const;

export type HaduSlot = (typeof HADU_SLOTS)[number];
export type TableSlot = (typeof TABLE_SLOTS)[number];
export type CosmeticSlot = (typeof COSMETIC_SLOTS)[number];

export const SLOT_LABELS: Record<CosmeticSlot, string> = {
  hat: "Hat",
  eyes: "Eyes",
  body: "Body",
  tail: "Tail",
  halo: "Aura",
  mat: "Board",
  cloth: "Tablecloth",
  tower: "Tower",
  sky: "Sky",
};

export interface Cosmetic {
  id: string;
  slot: CosmeticSlot;
  name: string;
  rarity: Rarity;
  /** True for the one piece of its slot every account has from the start. */
  free: boolean;
}

type Row = readonly [key: string, name: string, rarity: Rarity];

/** A slot's pieces; the first is the free one. */
function slot(id: CosmeticSlot, first: readonly [string, string], rows: Row[]) {
  return [
    {
      id: `${id}-${first[0]}`,
      slot: id,
      name: first[1],
      rarity: "common",
      free: true,
    },
    ...rows.map(([key, name, rarity]) => ({
      id: `${id}-${key}`,
      slot: id,
      name,
      rarity,
      free: false,
    })),
  ] satisfies Cosmetic[];
}

export const COSMETIC_LIST: readonly Cosmetic[] = [
  ...slot(
    "hat",
    ["none", "Bare Head"],
    [
      ["wool-cap", "Wool Cap", "common"],
      ["ribbon-bow", "Ribbon Bow", "common"],
      ["leaf-sprig", "Leaf Sprig", "common"],
      ["feather-plume", "Feather Plume", "uncommon"],
      ["top-hat", "Top Hat", "uncommon"],
      ["little-horns", "Little Horns", "rare"],
      ["wizard-hat", "Wizard Hat", "rare"],
      ["paper-crown", "Paper Crown", "epic"],
    ],
  ),
  ...slot(
    "eyes",
    ["gold", "Gold Eyes"],
    [
      ["green", "Green Eyes", "common"],
      ["blue", "Blue Eyes", "common"],
      ["amber", "Amber Eyes", "common"],
      ["rose", "Rose Eyes", "uncommon"],
      ["sleepy", "Sleepy Eyes", "uncommon"],
      ["odd", "Odd Eyes", "rare"],
      ["wink", "Wink", "rare"],
      ["star", "Star Eyes", "epic"],
    ],
  ),
  ...slot(
    "body",
    ["bell", "Bell Collar"],
    [
      ["red-collar", "Red Collar", "common"],
      ["wool-scarf", "Wool Scarf", "common"],
      ["bandana", "Bandana", "common"],
      ["bow-tie", "Bow Tie", "uncommon"],
      ["striped-jumper", "Striped Jumper", "uncommon"],
      ["waistcoat", "Waistcoat", "rare"],
      ["raincoat", "Raincoat", "rare"],
      ["cape", "Cape", "epic"],
    ],
  ),
  ...slot(
    "tail",
    ["plain", "Plain Tail"],
    [
      ["white-tip", "White Tip", "common"],
      ["ringed", "Ringed Tail", "common"],
      ["bobtail", "Bobtail", "common"],
      ["bushy", "Bushy Tail", "uncommon"],
      ["ribbon", "Ribbon Tail", "uncommon"],
      ["bolt", "Bolt Tail", "rare"],
      ["flame", "Flame Tail", "rare"],
      ["twin", "Twin Tails", "epic"],
    ],
  ),
  ...slot(
    "halo",
    ["none", "No Aura"],
    [
      ["sparkles", "Sparkles", "common"],
      ["leaves", "Falling Leaves", "common"],
      ["bubbles", "Bubbles", "uncommon"],
      ["hearts", "Hearts", "uncommon"],
      ["stars", "Stars", "rare"],
      ["embers", "Embers", "rare"],
      ["storm", "Storm", "epic"],
      ["nine-lives", "Nine Lives", "legendary"],
    ],
  ),
  ...slot(
    "mat",
    ["sky", "Sky Board"],
    [
      ["clay", "Clay Board", "common"],
      ["moss", "Moss Board", "common"],
      ["slate", "Slate Board", "uncommon"],
      ["rose", "Rose Board", "uncommon"],
      ["lilac", "Lilac Board", "rare"],
      ["gilt", "Gilt Board", "epic"],
    ],
  ),
  ...slot(
    "cloth",
    ["cream", "Cream Cloth"],
    [
      ["gingham", "Gingham", "common"],
      ["denim", "Denim", "common"],
      ["tartan", "Tartan", "uncommon"],
      ["tweed", "Tweed", "uncommon"],
      ["baize", "Green Baize", "rare"],
      ["starlit", "Starlit Cloth", "epic"],
    ],
  ),
  ...slot(
    "tower",
    ["stone", "Stone Tower"],
    [
      ["brick", "Brick Tower", "common"],
      ["timber", "Timber Tower", "common"],
      ["sandstone", "Sandstone Tower", "uncommon"],
      ["mossy", "Mossy Tower", "uncommon"],
      ["ice", "Ice Tower", "rare"],
      ["candy", "Candy-stripe Tower", "epic"],
    ],
  ),
  ...slot(
    "sky",
    ["evening", "Evening Sky"],
    [
      ["day", "Clear Day", "common"],
      ["dawn", "Dawn", "common"],
      ["overcast", "Overcast", "uncommon"],
      ["snow", "Snowfall", "uncommon"],
      ["night", "Night", "rare"],
      ["aurora", "Aurora", "epic"],
    ],
  ),
];

export const COSMETICS: Readonly<Record<string, Cosmetic>> = Object.fromEntries(
  COSMETIC_LIST.map((cosmetic) => [cosmetic.id, cosmetic]),
);

export function isCosmeticId(value: unknown): value is string {
  return typeof value === "string" && Object.hasOwn(COSMETICS, value);
}

export function getCosmetic(id: string): Cosmetic {
  const cosmetic = COSMETICS[id];
  if (!cosmetic || !Object.hasOwn(COSMETICS, id)) {
    throw new Error(`Unknown cosmetic: ${id}`);
  }
  return cosmetic;
}

export function cosmeticsIn(slot: CosmeticSlot): Cosmetic[] {
  return COSMETIC_LIST.filter((cosmetic) => cosmetic.slot === slot);
}

/** What is worn in each slot. */
export type Look = Record<CosmeticSlot, string>;

/** The free piece of every slot: what a new account wears. */
export const DEFAULT_LOOK: Look = Object.fromEntries(
  COSMETIC_SLOTS.map((id) => [
    id,
    COSMETIC_LIST.find((c) => c.slot === id && c.free)?.id ?? "",
  ]),
) as Look;

/** True if an account that has gained `gained` may wear `id`. */
export function ownsCosmetic(id: string, gained: readonly string[]): boolean {
  return isCosmeticId(id) && (getCosmetic(id).free || gained.includes(id));
}

/**
 * A stored look made whole: a slot it leaves out, or fills with a piece that
 * does not exist, belongs to another slot or is not owned, wears the free one.
 */
export function lookOf(stored: unknown, gained: readonly string[]): Look {
  const look = { ...DEFAULT_LOOK };
  if (typeof stored !== "object" || stored === null) return look;
  for (const id of COSMETIC_SLOTS) {
    const worn = (stored as Record<string, unknown>)[id];
    if (
      typeof worn === "string" &&
      ownsCosmetic(worn, gained) &&
      getCosmetic(worn).slot === id
    ) {
      look[id] = worn;
    }
  }
  return look;
}
