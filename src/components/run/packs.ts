/**
 * How a deck's cards stack: the copies of one cat as one pile, and how thick
 * that pile stands. The packs these once came out of are the shop's now
 * (`~/components/shop/packs`).
 */

/**
 * How thick a stack of `copies` of one card stands, in pixels: a card's own
 * 3px, and 1px for every copy under it.
 */
export function stackEdge(copies: number): number {
  return Math.min(6, 2 + Math.max(1, copies));
}

/** A deck as `[catId, copies]`, most copies first. */
export function countCats(deck: readonly string[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const catId of deck) counts.set(catId, (counts.get(catId) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}
