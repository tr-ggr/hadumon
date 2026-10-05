/**
 * Packs: what coins buy. A cat pack holds five cats of one element; a
 * cosmetic pack holds two pieces the account does not have yet. Opening one
 * is a pure function of the pack and an RNG, so the server rolls it and a
 * test can roll it again.
 *
 * Coins are only ever earned by playing (`payout.ts`). Nothing here, or
 * anywhere, takes money.
 */

import { CAT_LIST, getCat, RARITIES, type Rarity } from "./cats";
import { gainCards, type Owned } from "./collection";
import {
  COSMETIC_LIST,
  HADU_SLOTS,
  TABLE_SLOTS,
  type CosmeticSlot,
} from "./cosmetics";
import { ELEMENT_LABELS, type Element } from "./elements";
import type { Rng } from "./rng";

export interface CatPack {
  kind: "cats";
  id: string;
  name: string;
  element: Element;
  text: string;
}

export interface CosmeticPack {
  kind: "cosmetics";
  id: string;
  name: string;
  slots: readonly CosmeticSlot[];
  text: string;
}

export type Pack = CatPack | CosmeticPack;
export type PackKind = Pack["kind"];

/** What a pack costs, in coins. The one table every price is read from. */
export const PACK_PRICE: Record<PackKind, number> = {
  cats: 100,
  cosmetics: 150,
};

/** Cats in a cat pack. */
export const PACK_CARDS = 5;
/** Pieces in a cosmetic pack, while the account still lacks that many. */
export const PACK_PIECES = 2;

function catPack(id: string, name: string, element: Element): CatPack {
  return {
    kind: "cats",
    id,
    name,
    element,
    text: `${PACK_CARDS} ${ELEMENT_LABELS[element]} cats. The last is rare or better.`,
  };
}

export const CAT_PACKS: readonly CatPack[] = [
  catPack("cinder-pack", "Cinder Pack", "flame"),
  catPack("tide-pack", "Tide Pack", "mist"),
  catPack("static-pack", "Static Pack", "volt"),
  catPack("bramble-pack", "Bramble Pack", "thorn"),
  catPack("dusk-pack", "Dusk Pack", "shade"),
];

export const COSMETIC_PACKS: readonly CosmeticPack[] = [
  {
    kind: "cosmetics",
    id: "wardrobe-pack",
    name: "Wardrobe",
    slots: HADU_SLOTS,
    text: `${PACK_PIECES} things for your hadu to wear. Never one you have.`,
  },
  {
    kind: "cosmetics",
    id: "table-pack",
    name: "Table and Tower",
    slots: TABLE_SLOTS,
    text: `${PACK_PIECES} looks for your board, your cloth, the tower or its sky. Never one you have.`,
  },
];

export const PACK_LIST: readonly Pack[] = [...CAT_PACKS, ...COSMETIC_PACKS];

export const PACKS: Readonly<Record<string, Pack>> = Object.fromEntries(
  PACK_LIST.map((pack) => [pack.id, pack]),
);

export function isPackId(value: unknown): value is string {
  return typeof value === "string" && Object.hasOwn(PACKS, value);
}

export function getPack(packId: string): Pack {
  const pack = PACKS[packId];
  if (!pack || !Object.hasOwn(PACKS, packId)) {
    throw new Error(`Unknown pack: ${packId}`);
  }
  return pack;
}

/** The cats a cat pack can hold: every cat of its element. */
export function packCats(pack: CatPack): string[] {
  return CAT_LIST.filter((cat) => cat.element === pack.element).map(
    (cat) => cat.id,
  );
}

/** The pack a cat is found in. */
export function packOf(catId: string): CatPack {
  const element = getCat(catId).element;
  const pack = CAT_PACKS.find((p) => p.element === element);
  if (!pack) throw new Error(`No pack holds ${catId}`);
  return pack;
}

/** The pieces a cosmetic pack can hold: every one of its slots that is not free. */
export function packPieces(pack: CosmeticPack): string[] {
  return COSMETIC_LIST.filter(
    (cosmetic) => !cosmetic.free && pack.slots.includes(cosmetic.slot),
  ).map((cosmetic) => cosmetic.id);
}

type Odds = Partial<Record<Rarity, number>>;

/**
 * The chance, in a hundred, of each rarity in each of a cat pack's five
 * slots. Three are common or uncommon, the fourth uncommon or rare, and the
 * last rare or better.
 */
export const SLOT_ODDS: readonly Odds[] = [
  { common: 75, uncommon: 25 },
  { common: 75, uncommon: 25 },
  { common: 75, uncommon: 25 },
  { uncommon: 70, rare: 30 },
  { rare: 70, epic: 24, legendary: 6 },
];

function rollRarity(odds: Odds, rng: Rng): Rarity {
  let roll = rng.float(0, 100);
  for (const rarity of RARITIES) {
    roll -= odds[rarity] ?? 0;
    if (roll < 0) return rarity;
  }
  // The odds of a slot add up to a hundred, so this is the float's last ulp.
  return (
    [...RARITIES].reverse().find((rarity) => (odds[rarity] ?? 0) > 0) ??
    "common"
  );
}

/** The five cats in one cat pack. A cat can come up twice. */
export function openCatPack(pack: CatPack, rng: Rng): string[] {
  const cats = packCats(pack);
  return SLOT_ODDS.map((odds) => {
    // A pack with no cat of the rarity rolled gives the next one down.
    for (let at = RARITIES.indexOf(rollRarity(odds, rng)); at >= 0; at--) {
      const pool = cats.filter((id) => getCat(id).rarity === RARITIES[at]);
      if (pool.length > 0) return rng.pick(pool);
    }
    return rng.pick(cats);
  });
}

/** How much likelier a piece of each rarity is to come out of a cosmetic pack. */
export const PIECE_WEIGHT: Record<Rarity, number> = {
  common: 12,
  uncommon: 6,
  rare: 3,
  epic: 2,
  legendary: 1,
};

/** The pieces of a cosmetic pack an account that has gained `gained` still lacks. */
export function piecesLeft(
  pack: CosmeticPack,
  gained: readonly string[],
): string[] {
  return packPieces(pack).filter((id) => !gained.includes(id));
}

/**
 * The pieces in one cosmetic pack: two the account lacks, or the last one.
 * Empty once it has them all, when the pack cannot be bought.
 */
export function openCosmeticPack(
  pack: CosmeticPack,
  gained: readonly string[],
  rng: Rng,
): string[] {
  const left = piecesLeft(pack, gained);
  const weight = (id: string) =>
    PIECE_WEIGHT[COSMETIC_LIST.find((c) => c.id === id)?.rarity ?? "common"];
  const out: string[] = [];
  while (out.length < PACK_PIECES && left.length > 0) {
    let roll = rng.float(
      0,
      left.reduce((sum, id) => sum + weight(id), 0),
    );
    let index = left.findIndex((id) => (roll -= weight(id)) < 0);
    if (index < 0) index = left.length - 1;
    out.push(...left.splice(index, 1));
  }
  return out;
}

/** Coins paid back for a cat the account already holds every copy of. */
export const DUPLICATE_REFUND: Record<Rarity, number> = {
  common: 4,
  uncommon: 8,
  rare: 20,
  epic: 50,
  legendary: 150,
};

/**
 * What a cat pack pays back, on average, to an account that can keep none
 * of it. It has to stay under the price, or opening packs would mint coins.
 */
export function expectedRefund(): number {
  return SLOT_ODDS.reduce(
    (total, odds) =>
      total +
      RARITIES.reduce(
        (sum, rarity) =>
          sum + ((odds[rarity] ?? 0) / 100) * DUPLICATE_REFUND[rarity],
        0,
      ),
    0,
  );
}

export interface PulledCat {
  catId: string;
  /** False if the account already held every copy it can. */
  kept: boolean;
  /** Coins paid back for it; 0 if it was kept. */
  refund: number;
}

/** A pack as it was opened: what the shop records and the reveal shows. */
export type PackResult =
  | { kind: "cats"; packId: string; cats: PulledCat[]; refund: number }
  | { kind: "cosmetics"; packId: string; pieces: string[] };

/**
 * Adds a cat pack's cards to a collection. Each one past its cap is turned
 * back into coins by its rarity.
 */
export function settleCats(
  cards: readonly string[],
  owned: Owned,
): { owned: Owned; cats: PulledCat[]; refund: number } {
  const { owned: next, gains } = gainCards(owned, cards);
  const cats = gains.map(({ catId, kept }): PulledCat => ({
    catId,
    kept,
    refund: kept ? 0 : DUPLICATE_REFUND[getCat(catId).rarity],
  }));
  return {
    owned: next,
    cats,
    refund: cats.reduce((sum, cat) => sum + cat.refund, 0),
  };
}
