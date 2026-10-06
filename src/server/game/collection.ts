/**
 * The cards an account owns. Every account starts with the same small
 * collection, which is never stored: what the database holds is the copies
 * an account has gained since, and the two are added together when they are
 * read. Pure, like the rest of the game.
 */

import { getCat } from "./cats";

/** Copies of each cat an account owns, by cat id. A cat it has none of is left out. */
export type Owned = Readonly<Record<string, number>>;

/** The most copies of one cat an account can own, or play in a deck. */
export const MAX_COPIES = 4;
/** A legendary is one of a kind. */
export const MAX_LEGENDARY = 1;

/** The most copies of `catId` an account can own, or play in a deck. */
export function copyCap(catId: string): number {
  return getCat(catId).rarity === "legendary" ? MAX_LEGENDARY : MAX_COPIES;
}

/** The ten commons a new account holds three of. */
const STARTER_COMMONS = [
  "flameclaw",
  "emberkit",
  "mistpaw",
  "dewhisker",
  "voltwhisk",
  "sparkmew",
  "thornkit",
  "bramblepaw",
  "shadewhisker",
  "duskmew",
] as const;

/** The five uncommons it holds two of. */
const STARTER_UNCOMMONS = [
  "cinderpounce",
  "brumefang",
  "joltpad",
  "burrfang",
  "gloomtail",
] as const;

/**
 * What every account owns from the start: 40 cards. The ids are written out,
 * so a cat added to the catalogue later is not handed to everyone.
 */
export const STARTER_COLLECTION: Owned = Object.freeze({
  ...Object.fromEntries(STARTER_COMMONS.map((id) => [id, 3])),
  ...Object.fromEntries(STARTER_UNCOMMONS.map((id) => [id, 2])),
});

/** One stored row: the copies of a cat an account has gained since it began. */
export interface GainedCopies {
  catId: string;
  copies: number;
}

/** Everything an account owns: the starter collection and what it has gained. */
export function ownedCards(gained: readonly GainedCopies[]): Owned {
  const owned: Record<string, number> = { ...STARTER_COLLECTION };
  for (const { catId, copies } of gained) {
    if (copies <= 0) continue;
    owned[catId] = (owned[catId] ?? 0) + copies;
  }
  return owned;
}

/** How many cards a collection holds, every copy counted. */
export function cardCount(owned: Owned): number {
  return Object.values(owned).reduce((sum, copies) => sum + copies, 0);
}

/** The ids of the cats an account owns at least one of, sorted. */
export function ownedIds(owned: Owned): string[] {
  return Object.keys(owned)
    .filter((catId) => (owned[catId] ?? 0) > 0)
    .sort();
}

/** One card from a pack or a prize, once it has been added to a collection. */
export interface Gain {
  catId: string;
  /** False if the account already held as many as it can: it was not kept. */
  kept: boolean;
}

/**
 * Adds `cards` to a collection one at a time. A card past its cap is not
 * kept; what that pays back is the shop's business (`packs.ts`).
 */
export function gainCards(
  owned: Owned,
  cards: readonly string[],
): { owned: Owned; gains: Gain[] } {
  const next: Record<string, number> = { ...owned };
  const gains = cards.map((catId): Gain => {
    const have = next[catId] ?? 0;
    if (have >= copyCap(catId)) return { catId, kept: false };
    next[catId] = have + 1;
    return { catId, kept: true };
  });
  return { owned: next, gains };
}
