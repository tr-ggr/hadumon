/**
 * The decks the rivals play. A rival's deck is the size a run deck is by the
 * same match: 16 cards, and one more for each match already played. It is
 * drawn to the rarity mix of the deck the player built, so a player who
 * brings rares meets rares, and from the cats the player owns, so an account
 * never meets a cat it could not have. A rival holds one relic, its clan's
 * charm.
 */

import { getCat, RARITIES, type Rarity } from "./cats";
import { CLANS } from "./clans";
import { copyCap } from "./collection";
import type { Element } from "./elements";
import { GAUNTLET, getRival } from "./rival";

/** Cards in a rival's deck at the first match; a run deck's size with eight stolen. */
export const RIVAL_DECK = 16;

export function themeOf(rivalId: string): Element {
  return getRival(rivalId).theme;
}

/**
 * The relics a rival holds: its clan's charm, and no other. A player starts
 * with one relic too, from the chest; the ones picked up along the way are
 * the reward for winning.
 */
export function rivalRelics(rivalId: string): string[] {
  return [CLANS[themeOf(rivalId)].relicId];
}

/**
 * How many cards of each rarity a deck of `size` holds when it is mixed as
 * `built` is. Every rarity above common is rounded down and the commons
 * make up the rest, so a rival never holds more of a rarity than the player
 * does for its size.
 */
export function rarityMix(
  built: readonly string[],
  size: number,
): Record<Rarity, number> {
  const mix = Object.fromEntries(RARITIES.map((r) => [r, 0])) as Record<
    Rarity,
    number
  >;
  if (built.length === 0) return { ...mix, common: size };
  for (const rarity of RARITIES) {
    if (rarity === "common") continue;
    const held = built.filter((id) => getCat(id).rarity === rarity).length;
    mix[rarity] = Math.floor((size * held) / built.length);
  }
  mix.common = size - RARITIES.reduce((sum, r) => sum + mix[r], 0);
  return mix;
}

/**
 * `n` cards of one rarity for a rival of `theme`: its own element's cats
 * first, a copy of each in turn up to the cap, the one worth most first;
 * then the other elements' the same way. Fewer than `n` if the pool runs
 * out.
 */
function draw(
  pool: readonly string[],
  rarity: Rarity,
  theme: Element,
  n: number,
): string[] {
  const cats = [...new Set(pool)]
    .filter((catId) => getCat(catId).rarity === rarity)
    .sort((a, b) => getCat(b).points - getCat(a).points || a.localeCompare(b));
  const out: string[] = [];
  for (const own of [true, false]) {
    const group = cats.filter(
      (catId) => (getCat(catId).element === theme) === own,
    );
    for (let copy = 1; out.length < n; copy++) {
      const round = group.filter((catId) => copyCap(catId) >= copy);
      if (round.length === 0) break;
      out.push(...round.slice(0, n - out.length));
    }
  }
  return out;
}

/**
 * The deck `rivalId` brings to the match at `matchIndex`, given the cats
 * the player owns and the deck the player built. A rarity the pool cannot
 * fill is made up from the one below it.
 */
export function rivalDeck(
  rivalId: string,
  matchIndex: number,
  pool: readonly string[],
  built: readonly string[],
): string[] {
  const theme = themeOf(rivalId);
  const mix = rarityMix(built, RIVAL_DECK + matchIndex);
  const deck: string[] = [];
  let short = 0;
  for (const rarity of [...RARITIES].reverse()) {
    const want = mix[rarity] + short;
    const drawn = draw(pool, rarity, theme, want);
    deck.push(...drawn);
    short = want - drawn.length;
  }
  return deck;
}

/** The deck of the rival who waits at `matchIndex` of the gauntlet. */
export function gauntletDeck(
  matchIndex: number,
  pool: readonly string[],
  built: readonly string[],
): string[] {
  const rivalId = GAUNTLET[matchIndex];
  if (!rivalId) throw new Error(`No rival for match ${matchIndex}`);
  return rivalDeck(rivalId, matchIndex, pool, built);
}
