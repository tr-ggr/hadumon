/**
 * The deck builder's rules, worked out apart from the screen: what a press
 * adds or takes out, why a press is refused, and what the rail says. The
 * server checks a saved deck again with the same `validateDeck`.
 */

import {
  CAT_LIST,
  getCat,
  RARITIES,
  type Cat,
  type Rarity,
} from "~/server/game/cats";
import { copyCap, type Owned } from "~/server/game/collection";
import {
  countCards,
  DECK_SIZE,
  describeProblem,
  MAX_COPIES,
  sortDeck,
  validateDeck,
} from "~/server/game/deck";
import { ELEMENTS, type Element } from "~/server/game/elements";

export interface Filters {
  element: Element | null;
  rarity: Rarity | null;
  /** Leaves out the cats the account owns no copy of. */
  ownedOnly: boolean;
}

export const NO_FILTERS: Filters = {
  element: null,
  rarity: null,
  ownedOnly: true,
};

/** One cat of the collection, as the builder shows it. */
export interface Shelved {
  cat: Cat;
  /** Copies the account owns. */
  owned: number;
  /** Copies of it in the deck being built. */
  inDeck: number;
  /** Why another copy cannot go in; `null` if one can. */
  refusal: string | null;
}

/** Why one more copy of `catId` cannot go into `deck`, or `null` if it can. */
export function addRefusal(
  deck: readonly string[],
  catId: string,
  owned: Owned,
): string | null {
  const cat = getCat(catId);
  const have = owned[catId] ?? 0;
  const inDeck = deck.filter((id) => id === catId).length;
  if (have === 0) return `You do not own ${cat.name}.`;
  if (inDeck >= copyCap(catId)) {
    return cat.rarity === "legendary"
      ? `${cat.name} is a legendary: a deck holds one of it.`
      : `A deck holds ${MAX_COPIES} of a cat at most.`;
  }
  if (inDeck >= have) {
    return have === 1
      ? `You own one ${cat.name}, and it is in the deck.`
      : `You own ${have} of ${cat.name}, and all ${have} are in the deck.`;
  }
  return null;
}

/** `deck` with one more copy of `catId`, kept in reading order; unchanged if refused. */
export function addCard(
  deck: readonly string[],
  catId: string,
  owned: Owned,
): string[] {
  return addRefusal(deck, catId, owned) === null
    ? sortDeck([...deck, catId])
    : [...deck];
}

/** `deck` with one copy of `catId` taken out. */
export function removeCard(deck: readonly string[], catId: string): string[] {
  const index = deck.indexOf(catId);
  return index < 0 ? [...deck] : deck.filter((_, i) => i !== index);
}

/** The collection as the builder lists it: by element, rarity, then name. */
export function shelve(
  owned: Owned,
  deck: readonly string[],
  filters: Filters,
): Shelved[] {
  const counts = countCards(deck);
  return CAT_LIST.filter(
    (cat) =>
      (filters.element === null || cat.element === filters.element) &&
      (filters.rarity === null || cat.rarity === filters.rarity) &&
      (!filters.ownedOnly || (owned[cat.id] ?? 0) > 0),
  )
    .sort(
      (a, b) =>
        ELEMENTS.indexOf(a.element) - ELEMENTS.indexOf(b.element) ||
        RARITIES.indexOf(a.rarity) - RARITIES.indexOf(b.rarity) ||
        a.name.localeCompare(b.name),
    )
    .map((cat) => ({
      cat,
      owned: owned[cat.id] ?? 0,
      inDeck: counts[cat.id] ?? 0,
      refusal: addRefusal(deck, cat.id, owned),
    }));
}

/** A deck as stacks: each cat once with its count, in reading order. */
export function stacks(deck: readonly string[]): [string, number][] {
  const counts = countCards(deck);
  return [...new Set(sortDeck(deck))].map((catId) => [
    catId,
    counts[catId] ?? 0,
  ]);
}

/** How many cats of each element a deck holds, in the elements' own order. */
export function elementCounts(deck: readonly string[]): [Element, number][] {
  return ELEMENTS.map((element) => [
    element,
    deck.filter((catId) => getCat(catId).element === element).length,
  ]);
}

/** True if two decks hold the same cards, in whatever order. */
export function sameDeck(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && [...a].sort().join() === [...b].sort().join();
}

export interface DeckStatus {
  /** Everything wrong with the deck, as sentences; empty if it is legal. */
  problems: string[];
  /** True if it differs from the deck that is saved. */
  dirty: boolean;
  /** True if it can be saved now: legal, and changed. */
  canSave: boolean;
  /** The one sentence the rail shows. */
  sentence: string;
}

/** Where a deck being built stands against the one saved. */
export function deckStatus(
  deck: readonly string[],
  owned: Owned,
  saved: readonly string[],
): DeckStatus {
  const problems = validateDeck(deck, owned).map(describeProblem);
  const dirty = !sameDeck(deck, saved);
  const [first] = problems;
  return {
    problems,
    dirty,
    canSave: dirty && problems.length === 0,
    sentence:
      first ??
      (dirty
        ? `${DECK_SIZE} cards. Save it to bring it to your next run.`
        : `${DECK_SIZE} cards, saved. This is the deck your next run is played with.`),
  };
}
