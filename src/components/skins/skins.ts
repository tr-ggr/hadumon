/**
 * The colours of every table and tower cosmetic, keyed by its id in
 * `game/cosmetics.ts`. Flat fills only: a skin changes what the board, the
 * cloth, the tower and its sky are painted in, never how they are built.
 */

import {
  cosmeticsIn,
  TABLE_SLOTS,
  type TableSlot,
} from "~/server/game/cosmetics";

/** Three colours a skin is known by: its main fill, its second, its mark. */
export type Swatch = readonly [main: string, second: string, mark: string];

export const SKIN_SWATCHES: Readonly<Record<string, Swatch>> = {
  // The board the lanes are printed on: its fill, its paler fields, its line.
  "mat-sky": ["#a9ddf5", "#e7f7fd", "#73bde4"],
  "mat-clay": ["#e2a781", "#f4d3bd", "#c27f58"],
  "mat-moss": ["#a8cf8e", "#d7edc6", "#7fae63"],
  "mat-slate": ["#a9b6c4", "#d9e1e8", "#7d8d9e"],
  "mat-rose": ["#f3b3c0", "#fbdde3", "#dd8497"],
  "mat-midnight": ["#51648f", "#8a9bc4", "#2f3e63"],
  "mat-gilt": ["#f0cf6b", "#fbeab0", "#c9a53f"],
  // The cloth under everything: its ground, its weave, a thread through it.
  "cloth-cream": ["#fff8e7", "#f4ead4", "#b9a47e"],
  "cloth-gingham": ["#fdf1ee", "#f3b7ae", "#e58a7c"],
  "cloth-denim": ["#a9c0dc", "#8fabcd", "#e7eff8"],
  "cloth-tartan": ["#d6e8cb", "#a5cb93", "#d98a7a"],
  "cloth-tweed": ["#e9dfc9", "#cdbd96", "#9a8a63"],
  "cloth-baize": ["#a6d3a1", "#8cc088", "#5f9a5c"],
  "cloth-starfield": ["#27304f", "#3a4670", "#fff0a8"],
  // The tower's wall: its lit face, its body, its ribs and shadow.
  "tower-stone": ["#d0dae2", "#9aa9b7", "#6e7f90"],
  "tower-brick": ["#e9a58f", "#c9705a", "#8f4435"],
  "tower-timber": ["#e3c08f", "#b98d55", "#7d5a30"],
  "tower-sandstone": ["#f4e2b4", "#dcc07e", "#a98f52"],
  "tower-mossy": ["#c5d6b0", "#8fae7c", "#5c7d52"],
  "tower-ice": ["#e8f6fc", "#b5dff0", "#6fb1d1"],
  "tower-candy": ["#ffd9de", "#ff9aa8", "#c9586a"],
  // The sky behind it: overhead, at the horizon, and what hangs in it.
  "sky-day": ["#a9ddf5", "#e7f7fd", "#ffffff"],
  "sky-dawn": ["#f9c9b0", "#fde9c9", "#fff8e7"],
  "sky-dusk": ["#c79ac6", "#f3b08f", "#ffd36b"],
  "sky-overcast": ["#b9c4cf", "#dbe2e8", "#f1f4f6"],
  "sky-snow": ["#cfe4ee", "#eef6fa", "#ffffff"],
  "sky-night": ["#1f2a4a", "#33426b", "#fff0a8"],
  "sky-aurora": ["#1d2f4f", "#3f8f8a", "#b4efd1"],
};

/** A skin's three colours. An id with none drawn yet gets its slot's free one. */
export function skinSwatch(cosmeticId: string): Swatch {
  const known = SKIN_SWATCHES[cosmeticId];
  if (known && Object.hasOwn(SKIN_SWATCHES, cosmeticId)) return known;
  const slot = TABLE_SLOTS.find((id) => cosmeticId.startsWith(`${id}-`));
  return freeSwatch(slot ?? "mat");
}

function freeSwatch(slot: TableSlot): Swatch {
  const free = cosmeticsIn(slot).find((cosmetic) => cosmetic.free);
  return SKIN_SWATCHES[free?.id ?? ""] ?? ["#ffffff", "#ffffff", "#17212b"];
}
