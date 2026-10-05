/**
 * The deck a player builds from their collection and brings to a run: 24
 * cards, no more than three of one cat and one of a legendary. A run opens
 * with eight of them stolen (`run.ts`).
 */

import { CATS, getCat, RARITIES } from "./cats";
import {
  copyCap,
  MAX_COPIES,
  MAX_LEGENDARY,
  STARTER_COLLECTION,
  type Owned,
} from "./collection";
import { ELEMENTS } from "./elements";

export { MAX_COPIES, MAX_LEGENDARY };

export const DECK_SIZE = 24;
/** How many of a deck's cards the rivals hold when a run begins. */
export const STOLEN = 8;

/** One thing wrong with a deck. A deck with none can be saved and played. */
export type DeckProblem =
  | { kind: "size"; have: number }
  | { kind: "unknown"; catId: string }
  | { kind: "copies"; catId: string; have: number; cap: number }
  | { kind: "owned"; catId: string; have: number; owned: number };

/** How many of each cat a list of cards holds. */
export function countCards(cards: readonly string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const catId of cards) counts[catId] = (counts[catId] ?? 0) + 1;
  return counts;
}

/**
 * Everything wrong with `deck` for an account that owns `owned`, the size
 * first and then cat by cat in the deck's own order. Empty if it is legal.
 */
export function validateDeck(
  deck: readonly string[],
  owned: Owned,
): DeckProblem[] {
  const problems: DeckProblem[] = [];
  if (deck.length !== DECK_SIZE) {
    problems.push({ kind: "size", have: deck.length });
  }
  for (const [catId, have] of Object.entries(countCards(deck))) {
    if (!Object.hasOwn(CATS, catId)) {
      problems.push({ kind: "unknown", catId });
      continue;
    }
    const cap = copyCap(catId);
    const mine = owned[catId] ?? 0;
    if (have > cap) problems.push({ kind: "copies", catId, have, cap });
    else if (have > mine) {
      problems.push({ kind: "owned", catId, have, owned: mine });
    }
  }
  return problems;
}

export function isLegalDeck(deck: readonly string[], owned: Owned): boolean {
  return validateDeck(deck, owned).length === 0;
}

/** A problem as a sentence for the deck builder's rail. */
export function describeProblem(problem: DeckProblem): string {
  switch (problem.kind) {
    case "size":
      return problem.have < DECK_SIZE
        ? `${problem.have} of ${DECK_SIZE} cards. Add ${DECK_SIZE - problem.have} more.`
        : `${problem.have} of ${DECK_SIZE} cards. Take ${problem.have - DECK_SIZE} out.`;
    case "unknown":
      return "One of these cards is not in the game any more. Take it out.";
    case "copies": {
      const name = getCat(problem.catId).name;
      return problem.cap === MAX_LEGENDARY
        ? `${name} is a legendary: a deck holds one of it.`
        : `A deck holds ${MAX_COPIES} of a cat at most, and this has ${problem.have} of ${name}.`;
    }
    case "owned": {
      const name = getCat(problem.catId).name;
      return problem.owned === 0
        ? `You do not own ${name}.`
        : `You own ${problem.owned} of ${name}, and this deck has ${problem.have}.`;
    }
  }
}

/**
 * The deck a new account has before it builds one: two of each of its ten
 * commons and one of four of its uncommons, all from the starter collection.
 */
const DEFAULT_DECK: readonly string[] = Object.freeze([
  ...[
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
  ].flatMap((id) => [id, id]),
  "cinderpounce",
  "brumefang",
  "burrfang",
  "gloomtail",
]);

export function defaultDeck(): string[] {
  return [...DEFAULT_DECK];
}

/** A deck in the order a player reads it: by element, then rarity, then name. */
export function sortDeck(deck: readonly string[]): string[] {
  const place = (catId: string) => {
    const cat = getCat(catId);
    return [ELEMENTS.indexOf(cat.element), RARITIES.indexOf(cat.rarity)];
  };
  return [...deck].sort((a, b) => {
    const [x, y] = [place(a), place(b)];
    return (
      (x[0] ?? 0) - (y[0] ?? 0) ||
      (x[1] ?? 0) - (y[1] ?? 0) ||
      getCat(a).name.localeCompare(getCat(b).name)
    );
  });
}

// The default deck must be one a new account can play.
if (validateDeck(DEFAULT_DECK, STARTER_COLLECTION).length > 0) {
  throw new Error("The default deck is not legal for the starter collection.");
}
