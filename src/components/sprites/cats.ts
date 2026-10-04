/**
 * Per-cat pixel grids. Every cat starts from one shared 16x16 chibi base and
 * layers its own patches on top, so a cat with no patches yet still renders.
 */

export const SPRITE_SIZE = 16;

/** What each grid character means. Colours are resolved in `palettes.ts`. */
export const SPRITE_LEGEND = {
  ".": "transparent",
  o: "outline",
  "1": "fur",
  "2": "secondary fur",
  "3": "accent",
  e: "eye",
  w: "white",
} as const;

export type SpritePixel = keyof typeof SPRITE_LEGEND;

/** `[row, column, pixels]`: overwrite `pixels` starting at that cell. */
export type SpritePatch = readonly [
  row: number,
  column: number,
  pixels: string,
];

export const BASE_SPRITE = [
  "................",
  ".oo..........oo.",
  "o11o........o11o",
  "o121oooooooo121o",
  "o11111111111111o",
  "o11111111111111o",
  "o11we111111we11o",
  "o11ee111111ee11o",
  "o1111ww33ww1111o",
  ".o111wwooww111o.",
  "..oooo1111oooo..",
  "....o122221o.oo.",
  "....o122221oo11o",
  "....o1122111111o",
  "....o11oo11oooo.",
  ".....oo..oo.....",
] as const;

export const SPRITE_PATCHES: Record<string, readonly SpritePatch[]> = {
  flameclaw: [
    [0, 7, "oo"],
    [1, 6, "o33o"],
    [2, 5, "o3223o"],
    [3, 6, "3333"],
    [12, 13, "33"],
  ],
  mistpaw: [
    [4, 7, "22"],
    [5, 6, "2222"],
    [14, 5, "ww"],
    [14, 9, "ww"],
    [12, 13, "ww"],
  ],
  voltwhisk: [
    [2, 1, "33"],
    [2, 13, "33"],
    [4, 8, "3"],
    [5, 7, "3"],
    [7, 1, "3"],
    [7, 14, "3"],
    [8, 1, "33"],
    [8, 13, "33"],
    [12, 13, "33"],
  ],
  thornkit: [
    [0, 8, "oo"],
    [1, 7, "o33o"],
    [2, 6, "o32o"],
    [5, 2, "2"],
    [5, 13, "2"],
    [12, 13, "22"],
  ],
  nyxaroth: [
    [0, 5, "o"],
    [0, 10, "o"],
    [1, 4, "owo"],
    [1, 9, "owo"],
    [2, 4, "owo"],
    [2, 9, "owo"],
    [3, 5, "w"],
    [3, 10, "w"],
    [4, 7, "ee"],
    [5, 2, "3333"],
    [5, 10, "3333"],
    [6, 2, "3"],
    [6, 5, "3"],
    [6, 10, "3"],
    [6, 13, "3"],
    [7, 2, "3"],
    [7, 5, "3"],
    [7, 10, "3"],
    [7, 13, "3"],
    [12, 13, "33"],
  ],
};

/** Returns `rows` with one patch written over it. */
function applyPatch(
  rows: readonly string[],
  [row, column, pixels]: SpritePatch,
): string[] {
  return rows.map((line, y) =>
    y === row
      ? line.slice(0, column) + pixels + line.slice(column + pixels.length)
      : line,
  );
}

/**
 * The 16 rows of a cat's sprite. A cat with no patches yet gets the base
 * sprite unchanged.
 */
export function catSprite(catId: string): readonly string[] {
  const patches = SPRITE_PATCHES[catId];
  if (!patches) return BASE_SPRITE;
  return patches.reduce<readonly string[]>(applyPatch, BASE_SPRITE);
}
