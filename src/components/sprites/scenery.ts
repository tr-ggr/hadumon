/**
 * Where the tower stands: a rock in the sea under an evening sky, with a
 * bank of cloud along the horizon and the near shore dark in front. It is
 * drawn the way the tower is, as rows of legend characters at the tower's
 * own pixel size, and most of it is a tile that repeats sideways, since the
 * camera may look a long way to either side.
 *
 * Nothing here is smooth. A sky that goes from one colour to the next does
 * it in a dither: more and more pixels of the new colour, row by row.
 */

/** What each character of a scenery grid means. */
export const SCENERY_LEGEND = {
  ".": "transparent",
  a: "sky, palest: just above the sea",
  b: "sky, gold",
  c: "sky, orange",
  d: "sky, ember: the top of it",
  w: "cloud, lit",
  l: "cloud, pale",
  g: "cloud, grey",
  s: "sea",
  n: "sea, deep",
  f: "sea, a glint",
  h: "sea, a bright glint",
  r: "rock",
  t: "rock, its lit top",
  k: "the near shore",
} as const;

export type SceneryPixel = keyof typeof SCENERY_LEGEND;

/** The colours, as values: the cats' own flame and volt, the tower's stone. */
export const SCENERY_COLORS: Record<SceneryPixel, string | null> = {
  ".": null,
  a: "#fff2a8",
  b: "#f5c84c",
  c: "#f07b4d",
  d: "#b7492d",
  w: "#fff8e7",
  l: "#d0dae2",
  g: "#9aa9b7",
  s: "#1557d8",
  n: "#0d3c9d",
  f: "#a9ddf5",
  h: "#e7f7fd",
  r: "#17212b",
  t: "#3a4857",
  k: "#0b1118",
};

/** The order a 4x4 block of pixels fills in, for a dither. */
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const;

export function bayer(x: number, y: number): number {
  return BAYER[y % 4]?.[x % 4] ?? 0;
}

/**
 * `rows` rows going from `from` at the top to `to` at the bottom: the share
 * of `to` grows by a sixteenth at a time.
 */
export function dither(
  from: string,
  to: string,
  rows: number,
  width: number,
  top: number,
): string[] {
  return Array.from({ length: rows }, (_, row) => {
    const share = ((row + 1) * 16) / (rows + 1);
    return Array.from({ length: width }, (_, x) =>
      bayer(x, top + row) < share ? to : from,
    ).join("");
  });
}

export function flat(pixel: string, rows: number, width: number): string[] {
  return Array.from({ length: rows }, () => pixel.repeat(width));
}

/** The sky repeats every four pixels: one block of the dither. */
export const SKY_WIDTH = 4;
/** Each colour of the sky, top first: how many rows of it, then of the dither into the next. */
const SKY_BANDS: readonly (readonly [string, number, number])[] = [
  ["d", 20, 28],
  ["c", 56, 28],
  ["b", 34, 20],
  ["a", 22, 0],
];

/** The sky from its ember top down to the sea. Above it, the sky is ember. */
export const SKY: readonly string[] = SKY_BANDS.reduce<string[]>(
  (rows, [pixel, solid, blend], index) => {
    rows.push(...flat(pixel, solid, SKY_WIDTH));
    const next = SKY_BANDS[index + 1]?.[0];
    if (next) rows.push(...dither(pixel, next, blend, SKY_WIDTH, rows.length));
    return rows;
  },
  [],
);

/** A heap of cloud: where its middle is, how wide it swells, how high it starts. */
export type Heap = readonly [centre: number, radius: number, base: number];

/**
 * A bank of cloud as a tile that repeats sideways: heaps along its top, lit
 * on their upper edge, and solid from there down. The sea covers its foot.
 */
export function cloudBank(
  width: number,
  height: number,
  heaps: readonly Heap[],
  body: string,
  lit: string,
): string[] {
  const top = Array.from({ length: width }, (_, x) => {
    const rise = heaps.reduce((best, [centre, radius, base]) => {
      // The tile repeats, so a heap near one end shows at the other.
      const across = Math.min(
        Math.abs(x - centre),
        width - Math.abs(x - centre),
      );
      if (across >= radius) return best;
      return Math.max(best, base + Math.sqrt(radius ** 2 - across ** 2));
      // Between two heaps the bank is still a third of its height deep, so
      // no gap in the near one shows the far one through it.
    }, height * 0.3);
    return height - Math.round(rise);
  });
  return Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => {
      const depth = y - (top[x] ?? height);
      return depth < 0 ? "." : depth < 2 ? lit : body;
    }).join(""),
  );
}

/** The far bank: grey, tall, slow. */
export const CLOUDS_FAR: readonly string[] = cloudBank(
  168,
  56,
  [
    [18, 24, 16],
    [50, 17, 26],
    [86, 30, 18],
    [124, 20, 24],
    [152, 15, 14],
    // Smaller heaps on the shoulders of the large ones.
    [6, 8, 28],
    [34, 9, 30],
    [66, 10, 33],
    [104, 11, 35],
    [138, 8, 33],
    [160, 9, 21],
  ],
  "g",
  "l",
);

/** The near bank: pale, lower, a little quicker. */
export const CLOUDS_NEAR: readonly string[] = cloudBank(
  120,
  34,
  [
    [12, 13, 8],
    [38, 18, 6],
    [70, 12, 12],
    [98, 16, 7],
    [26, 6, 16],
    [52, 7, 16],
    [84, 6, 17],
    [110, 6, 13],
  ],
  "l",
  "w",
);

/** A number from 0 to 1 that is always the same for the same pixel. */
export function speck(x: number, y: number): number {
  const mixed = Math.imul(x * 73 + 11, y * 151 + 7) ^ (x * 31 + y * 17);
  return ((((mixed >>> 0) % 997) + (y % 3) * 37) % 100) / 100;
}

export const SEA_WIDTH = 32;
const SEA_ROWS = 52;
/** How far down the sea turns from bright to deep. */
const SEA_SHELF = 18;

/**
 * The top of the sea, as a tile that repeats sideways: thick with glints
 * under the horizon and fewer further down, the water deepening under them.
 * Below it the sea is deep and still.
 */
export const SEA: readonly string[] = Array.from(
  { length: SEA_ROWS },
  (_, y) => {
    const glints = 0.62 * Math.exp(-y / 11);
    const deep = ((y - SEA_SHELF) * 16) / (SEA_ROWS - SEA_SHELF);
    return Array.from({ length: SEA_WIDTH }, (_, x) => {
      // A glint is a dash two pixels long.
      const lit = speck(Math.floor(x / 2), y);
      if (lit < glints) return lit < glints / 2.5 && y < 9 ? "h" : "f";
      return bayer(x, y) < deep ? "n" : "s";
    }).join("");
  },
);

/** One run of pixels in a row of a shape that is not a tile. */
export interface Span {
  y: number;
  /** Counted from the tower's own left edge; negative is to the left of it. */
  left: number;
  right: number;
  pixel: SceneryPixel;
}

/** How far the rock goes down under the tower's foot. */
export const ROCK_DEPTH = 150;

/**
 * The rock the tower stands on, row by row from the ground down: as wide as
 * the tower and its ledges at the top, stepping outward as it goes under the
 * water. Its top is lit.
 */
export function rock(towerWidth: number): Span[] {
  return Array.from({ length: ROCK_DEPTH }, (_, y) => {
    const step = (y % 5 === 4 ? 1 : 0) + (speck(3, y) < 0.3 ? 1 : 0);
    return {
      y,
      left: -3 - Math.round(y * 1.1) - step,
      right: towerWidth + 3 + Math.round(y * 0.7) + step,
      pixel: y < 2 ? "t" : "r",
    } as const;
  });
}

/** How far to the left the near shore is drawn. */
export const SHORE_REACH = 1400;
/** The shore's height above the tower's ground at its far end. */
const SHORE_RISE = 58;
/** Where it runs out into the sea, left of the tower, and how far under the ground line. */
const SHORE_END = -34;
const SHORE_DIP = 16;

/**
 * The near shore: dark, rising to the left, running out into the sea short
 * of the rock. Each row is one run from the far left to where the slope is.
 * `y` is counted from the tower's ground, upward negative.
 */
export function shore(): Span[] {
  const rows: Span[] = [];
  for (let y = -SHORE_RISE + 1; y <= ROCK_DEPTH; y++) {
    const drop = (SHORE_DIP - y) / (SHORE_RISE + SHORE_DIP);
    // The slope eases off as it climbs, so the top is nearly level.
    const back =
      y >= SHORE_DIP ? 0 : -110 * Math.log(1 - Math.min(drop, 0.985));
    const ragged = speck(7, y + SHORE_RISE) < 0.35 ? 1 : 0;
    rows.push({
      y,
      left: -SHORE_REACH,
      right: SHORE_END - Math.round(back) - ragged,
      pixel: "k",
    });
  }
  return rows;
}
