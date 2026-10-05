/**
 * How a table or tower skin is shown on its tile: a 12x12 picture of the
 * thing it dresses, printed in the skin's three flat colours. `1` is the
 * skin's main fill, `2` its second and `3` its mark, in the order
 * `skinSwatch` gives them.
 */

import type { TableSlot } from "~/server/game/cosmetics";

export const SWATCH_SIZE = 12;

const row = (pattern: string) =>
  pattern.repeat(SWATCH_SIZE / pattern.length).slice(0, SWATCH_SIZE);

export const SWATCH_GRIDS: Record<TableSlot, readonly string[]> = {
  // A board: three paler lanes with a line between them.
  mat: [
    row("1"),
    ...[0, 1, 2].map(() => `1${row("2").slice(2)}1`),
    `1${row("3").slice(2)}1`,
    ...[0, 1, 2].map(() => `1${row("2").slice(2)}1`),
    `1${row("3").slice(2)}1`,
    ...[0, 1].map(() => `1${row("2").slice(2)}1`),
    row("1"),
  ],
  // A cloth: the weave's marks, a brick apart, and one thread through it.
  cloth: [
    row("2211"),
    row("1"),
    row("1122"),
    row("1"),
    row("2211"),
    row("1"),
    row("3"),
    row("1"),
    row("2211"),
    row("1"),
    row("1122"),
    row("1"),
  ],
  // A tower's wall: the lit face, the body with its ribs, the shaded side.
  tower: Array.from({ length: SWATCH_SIZE }, () => "222131131133"),
  // A sky: overhead, the horizon dithered in under it, and what hangs there.
  sky: [
    row("1"),
    "111111111311",
    "113331111111",
    "133333111111",
    row("1"),
    "111111113111",
    row("1"),
    row("12"),
    row("21"),
    row("2"),
    row("2"),
    row("2"),
  ],
};
