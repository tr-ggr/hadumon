/**
 * The decks the rivals play. A rival's deck is built on the budget a run
 * deck has by the same match: a clan's 16 starting cards, plus one cat for
 * each match already played. Each of those picks is held to the rarity a
 * player has typically taken by then, and comes from the cats the player has
 * unlocked, so an account never meets a cat it could not own. A rival holds
 * no relics.
 */

import { getCat, RARITIES, type Rarity } from "./cats";
import type { Element } from "./elements";
import { GAUNTLET } from "./rival";
import { starterDeck } from "./run";

/** The clan each rival's deck is built around. */
export const RIVAL_THEMES: Record<string, Element> = {
  "alley-tom": "thorn",
  "dockside-twins": "mist",
  "madame-mittens": "flame",
  "rooftop-syndicate": "volt",
  "the-archivist": "thorn",
  "old-nine-lives": "shade",
};

/**
 * The rarest cat the pick after each won match may be: the rarity the best
 * of a reward's three offered cats most often has by then. `rivalDecks.test`
 * measures it against `makeOffer`.
 */
export const PICK_CAPS: readonly Rarity[] = [
  "uncommon",
  "uncommon",
  "rare",
  "rare",
  "rare",
];

export function themeOf(rivalId: string): Element {
  const theme = RIVAL_THEMES[rivalId];
  if (!theme) throw new Error(`No deck theme for rival: ${rivalId}`);
  return theme;
}

/**
 * The cats a rival adds to its starting deck, in the order it adds them. A
 * pick is the best cat left in `pool` at or under its cap: the rarest first,
 * its own clan's before another's, then the one worth the most. No cat is
 * picked twice.
 */
export function rivalPicks(
  rivalId: string,
  picks: number,
  pool: readonly string[],
): string[] {
  const theme = themeOf(rivalId);
  const taken: string[] = [];
  for (let pick = 0; pick < picks; pick++) {
    const cap = RARITIES.indexOf(PICK_CAPS[pick] ?? "rare");
    const rank = (catId: string) => RARITIES.indexOf(getCat(catId).rarity);
    const best = [...new Set(pool)]
      .filter((catId) => !taken.includes(catId) && rank(catId) <= cap)
      .sort((a, b) => {
        const [x, y] = [getCat(a), getCat(b)];
        return (
          rank(b) - rank(a) ||
          Number(y.element === theme) - Number(x.element === theme) ||
          y.points - x.points ||
          a.localeCompare(b)
        );
      })[0];
    if (best === undefined) break;
    taken.push(best);
  }
  return taken;
}

/**
 * The deck `rivalId` brings to the match at `matchIndex`, given the cats the
 * player has unlocked: 16 cards and one more for each match before it.
 */
export function rivalDeck(
  rivalId: string,
  matchIndex: number,
  pool: readonly string[],
): string[] {
  return [
    ...starterDeck(themeOf(rivalId)),
    ...rivalPicks(rivalId, matchIndex, pool),
  ];
}

/** The deck of the rival who waits at `matchIndex` of the gauntlet. */
export function gauntletDeck(
  matchIndex: number,
  pool: readonly string[],
): string[] {
  const rivalId = GAUNTLET[matchIndex];
  if (!rivalId) throw new Error(`No rival for match ${matchIndex}`);
  return rivalDeck(rivalId, matchIndex, pool);
}
