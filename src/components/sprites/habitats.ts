/**
 * Where the cats live: the scenery printed along each lane of a mat. The
 * Hunt is a garden, the Den a room with a rug, the Prowl the rooftops at
 * night. Each is drawn the way the tower's sky and sea are, as rows of
 * legend characters, and is three bands and a backdrop colour, so a lane of
 * any height shows more or less of the picture and never a stretched one:
 *
 *   sky      a small tile that repeats both ways, from the horizon up
 *   horizon  a tile of fixed height that repeats sideways, on the ground
 *   ground   a tile of fixed height that repeats sideways, on the lane's
 *            bottom edge
 *
 * Where the sky changes colour toward the horizon it does so in a dither,
 * and that is a strip of its own behind the horizon (`glow`), four pixels
 * wide: one block of the dither, which a tile as wide as a row of hedges
 * would have to spell out pixel by pixel.
 *
 * A tile's width is a multiple of four, so a dither meets itself where the
 * tile repeats, and nothing here is random: the same call draws the same
 * rows.
 */

import type { Row } from "~/server/game/cats";

import { cloudBank, dither, flat, speck, type Heap } from "./scenery";

/** What each character of a habitat grid means. */
export const HABITAT_LEGEND = {
  ".": "transparent",
  // The Hunt: a garden.
  s: "garden sky",
  h: "garden sky, the pale of it over the hedge",
  g: "leaf",
  l: "leaf, lit",
  d: "leaf, in shade",
  f: "fence",
  e: "fence, its shaded side",
  y: "flower, yellow",
  r: "flower, red",
  // The Den: a room.
  w: "wallpaper: volt, paled, so a cream outline shows on it",
  m: "wallpaper, its motif",
  b: "wood",
  k: "wood, dark",
  t: "floorboard",
  u: "rug",
  v: "rug, its band",
  // The Prowl: rooftops at night.
  n: "night",
  c: "night, nearer the roofs",
  p: "night, the glow over the town",
  a: "star",
  i: "roofline",
  o: "window, lit",
  x: "roof tile",
  z: "roof tile, its lit edge",
} as const;

export type HabitatPixel = keyof typeof HABITAT_LEGEND;

/** The colours, as values: the table's own where one fits. */
export const HABITAT_COLORS: Record<HabitatPixel, string | null> = {
  ".": null,
  s: "#a9ddf5",
  h: "#e7f7fd",
  g: "#77bd70",
  l: "#b4e08c",
  d: "#4c9a58",
  f: "#fff8e7",
  e: "#b9a47e",
  y: "#f5c84c",
  r: "#ff7163",
  w: "#fbe3a5",
  m: "#f5c84c",
  b: "#b9a47e",
  k: "#8a7350",
  t: "#d9c7a0",
  u: "#f07b4d",
  v: "#b7492d",
  n: "#0b1f52",
  c: "#0d3c9d",
  p: "#8275c6",
  a: "#fff8e7",
  i: "#17212b",
  o: "#f5c84c",
  x: "#4a3f86",
  z: "#8275c6",
};

export interface HabitatScene {
  /** What is behind every band, and above the sky where the sky is clear. */
  backdrop: HabitatPixel;
  /** What a piece standing on the ground casts on it. */
  cast: HabitatPixel;
  /** Every character the scene is drawn in, the clear one aside. */
  pixels: readonly HabitatPixel[];
  sky: readonly string[];
  /** The sky's change of colour behind the horizon, as tall as it; empty for none. */
  glow: readonly string[];
  horizon: readonly string[];
  ground: readonly string[];
}

/** A dither is one block of four pixels across, however wide what is in front of it. */
const GLOW_WIDTH = 4;

/** A grid being drawn: rows of single characters, written in place. */
type Grid = string[][];

function blank(width: number, height: number, pixel = "."): Grid {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => pixel),
  );
}

function rows(grid: Grid): string[] {
  return grid.map((row) => row.join(""));
}

/** Sets one pixel, wrapping sideways as the tile does. Off the top or bottom is nothing. */
function put(grid: Grid, x: number, y: number, pixel: string): void {
  const row = grid[y];
  if (!row) return;
  row[((x % row.length) + row.length) % row.length] = pixel;
}

function fill(
  grid: Grid,
  x: number,
  y: number,
  width: number,
  height: number,
  pixel: string,
): void {
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) put(grid, x + dx, y + dy, pixel);
  }
}

/** Lays rows over a grid from `top` down; a clear pixel leaves what is there. */
function lay(grid: Grid, over: readonly string[], top: number): void {
  over.forEach((row, dy) => {
    [...row].forEach((pixel, x) => {
      if (pixel !== ".") put(grid, x, top + dy, pixel);
    });
  });
}

/* The Hunt: a garden. A pale sky with a few flat clouds, hedges behind a
   picket fence, and a lawn with flowers in it. */

const GARDEN_SKY_WIDTH = 64;
const GARDEN_SKY_HEIGHT = 32;

function gardenSky(): string[] {
  const grid = blank(GARDEN_SKY_WIDTH, GARDEN_SKY_HEIGHT, "s");
  // Two clouds a tile, one off the other, so the rows of them do not line up.
  const cloud = (x: number, y: number, width: number) => {
    fill(grid, x + 2, y, width - 5, 1, "h");
    fill(grid, x, y + 1, width, 2, "h");
    fill(grid, x + 3, y + 3, width - 4, 1, "h");
  };
  cloud(6, 5, 15);
  cloud(38, 21, 12);
  return rows(grid);
}

const HEDGE_WIDTH = 48;
/** The pale of the sky coming down onto the hedge. */
const HEDGE_HAZE = 8;
const HEDGE_HEIGHT = 20;
const HEDGE_HEAPS: readonly Heap[] = [
  [9, 11, 7],
  [30, 13, 4],
  [43, 6, 9],
  [19, 5, 11],
];
/** A picket and the gap after it. */
const PICKET = 6;
const FENCE_HEIGHT = 11;

const GARDEN_HORIZON = HEDGE_HAZE + HEDGE_HEIGHT;

/** The sky paling down to the hedge, and pale behind it. */
function gardenGlow(): string[] {
  return [
    ...dither(".", "h", HEDGE_HAZE, GLOW_WIDTH, 0),
    ...flat("h", HEDGE_HEIGHT, GLOW_WIDTH),
  ];
}

function gardenHorizon(): string[] {
  const grid = blank(HEDGE_WIDTH, GARDEN_HORIZON);
  lay(
    grid,
    cloudBank(HEDGE_WIDTH, HEDGE_HEIGHT, HEDGE_HEAPS, "g", "l"),
    HEDGE_HAZE,
  );
  // Leaves in shade, here and there, more of them toward the foot.
  for (let y = HEDGE_HAZE; y < GARDEN_HORIZON; y++) {
    for (let x = 0; x < HEDGE_WIDTH; x += 2) {
      const deep = (y - HEDGE_HAZE) / HEDGE_HEIGHT;
      if (grid[y]?.[x] === "g" && speck(x, y) < 0.02 + deep * 0.06) {
        fill(grid, x, y, 2, 1, "d");
      }
    }
  }
  // The fence: pointed pickets, each shaded down its right side, on two rails.
  const top = GARDEN_HORIZON - FENCE_HEIGHT;
  fill(grid, 0, top + 4, HEDGE_WIDTH, 1, "f");
  fill(grid, 0, top + 5, HEDGE_WIDTH, 1, "e");
  fill(grid, 0, top + 8, HEDGE_WIDTH, 1, "f");
  fill(grid, 0, top + 9, HEDGE_WIDTH, 1, "e");
  for (let x = 0; x < HEDGE_WIDTH; x += PICKET) {
    put(grid, x + 1, top, "f");
    fill(grid, x, top + 1, 3, FENCE_HEIGHT - 1, "f");
    fill(grid, x + 3, top + 2, 1, FENCE_HEIGHT - 2, "e");
  }
  return rows(grid);
}

const LAWN_WIDTH = 96;
const LAWN_HEIGHT = 12;
/** Where the flowers stand, and what colour each is. */
const FLOWERS: readonly (readonly [x: number, y: number, pixel: string])[] = [
  [9, 4, "y"],
  [30, 7, "r"],
  [51, 3, "y"],
  [66, 8, "y"],
  [83, 5, "r"],
];

function gardenGround(): string[] {
  const grid = blank(LAWN_WIDTH, LAWN_HEIGHT, "g");
  fill(grid, 0, 0, LAWN_WIDTH, 1, "d");
  fill(grid, 0, 1, LAWN_WIDTH, 1, "l");
  for (let y = 3; y < LAWN_HEIGHT - 1; y++) {
    for (let x = 0; x < LAWN_WIDTH; x++) {
      // A blade is two pixels tall: a lit tip on a shaded stem.
      const blade = speck(x, y);
      if (blade < 0.05) {
        put(grid, x, y, "l");
        put(grid, x, y + 1, "d");
      }
    }
  }
  for (const [x, y, pixel] of FLOWERS) {
    put(grid, x, y, pixel);
    put(grid, x - 1, y, "f");
    put(grid, x + 1, y, "f");
    put(grid, x, y - 1, "f");
    put(grid, x, y + 1, "f");
    put(grid, x, y + 2, "d");
  }
  return rows(grid);
}

/* The Den: a room. Papered wall with a shelf rail along it, a skirting
   board, and floorboards with a rug laid across them. */

const PAPER = 16;

function denWall(): string[] {
  const grid = blank(PAPER, PAPER, "w");
  // A small diamond, and another half a tile off it.
  for (const [x, y] of [
    [4, 4],
    [12, 12],
  ] as const) {
    put(grid, x, y - 1, "m");
    put(grid, x - 1, y, "m");
    put(grid, x + 1, y, "m");
    put(grid, x, y + 1, "m");
  }
  return rows(grid);
}

const SHELF_WIDTH = 32;
/** Wall between the shelf and the skirting board. */
const WALL_GAP = 12;
const SKIRTING = 6;
/** Wall over the shelf, so the plank is not the tile's first row. */
const SHELF_TOP = 2;

function denHorizon(): string[] {
  const height = SHELF_TOP + 3 + WALL_GAP + SKIRTING;
  const grid = blank(SHELF_WIDTH, height);
  // The plank, the dark of its underside, and a bracket every 32 pixels.
  fill(grid, 0, SHELF_TOP, SHELF_WIDTH, 2, "b");
  fill(grid, 0, SHELF_TOP + 2, SHELF_WIDTH, 1, "k");
  for (let x = 8; x < SHELF_WIDTH; x += 32) {
    fill(grid, x, SHELF_TOP + 3, 2, 3, "k");
    put(grid, x + 2, SHELF_TOP + 3, "k");
  }
  const board = height - SKIRTING;
  fill(grid, 0, board, SHELF_WIDTH, 1, "k");
  fill(grid, 0, board + 1, SHELF_WIDTH, 1, "t");
  fill(grid, 0, board + 2, SHELF_WIDTH, SKIRTING - 3, "b");
  fill(grid, 0, height - 1, SHELF_WIDTH, 1, "k");
  return rows(grid);
}

const FLOOR_WIDTH = 192;
const FLOOR_HEIGHT = 14;
/** Rows between two seams. */
const PLANK = 5;
const RUG_LEFT = 44;
const RUG_WIDTH = 104;
const RUG_TOP = 3;
const RUG_HEIGHT = 8;

function denGround(): string[] {
  const grid = blank(FLOOR_WIDTH, FLOOR_HEIGHT, "t");
  for (let y = PLANK - 1; y < FLOOR_HEIGHT; y += PLANK) {
    fill(grid, 0, y, FLOOR_WIDTH, 1, "b");
    // Where one board ends and the next begins, further along on each row.
    const course = Math.floor(y / PLANK);
    for (let x = (course * 28) % 48; x < FLOOR_WIDTH; x += 48) {
      fill(grid, x, y - PLANK + 1, 1, PLANK - 1, "b");
    }
  }
  fill(grid, RUG_LEFT, RUG_TOP, RUG_WIDTH, RUG_HEIGHT, "u");
  fill(grid, RUG_LEFT, RUG_TOP + 1, RUG_WIDTH, 1, "v");
  fill(grid, RUG_LEFT, RUG_TOP + RUG_HEIGHT - 2, RUG_WIDTH, 1, "v");
  for (let x = RUG_LEFT + 6; x < RUG_LEFT + RUG_WIDTH - 4; x += 8) {
    fill(grid, x, RUG_TOP + 3, 2, 2, "m");
  }
  // The fringe: every other pixel, off both ends.
  for (let y = RUG_TOP; y < RUG_TOP + RUG_HEIGHT; y += 2) {
    fill(grid, RUG_LEFT - 2, y, 2, 1, "w");
    fill(grid, RUG_LEFT + RUG_WIDTH, y, 2, 1, "w");
  }
  // What the rug casts on the boards under its near edge.
  fill(grid, RUG_LEFT, RUG_TOP + RUG_HEIGHT, RUG_WIDTH, 1, "k");
  return rows(grid);
}

/* The Prowl: rooftops at night. Stars, the town's roofline against its own
   glow with a few windows lit, and the near roof under the cats' feet. */

const NIGHT = 32;

function nightSky(): string[] {
  return Array.from({ length: NIGHT }, (_, y) =>
    Array.from({ length: NIGHT }, (_, x) => {
      const star = speck(x + 5, y + 3);
      return star < 0.012 ? "a" : star < 0.03 ? "c" : "n";
    }).join(""),
  );
}

const TOWN_WIDTH = 128;
/**
 * Rows of each change of the sky, top first: night to nearer, then the first
 * of the glow, which is never more than half of what is behind the roofs.
 */
const GLOW_ROWS = [16, 10] as const;
/** The buildings: where each stands, how wide it is and how tall. */
const TOWN: readonly (readonly [x: number, width: number, height: number])[] = [
  [0, 13, 9],
  [13, 9, 15],
  [22, 16, 7],
  [38, 7, 18],
  [45, 14, 11],
  [59, 10, 6],
  [69, 12, 14],
  [81, 8, 9],
  [89, 15, 12],
  [104, 9, 17],
  [113, 15, 8],
];

const TOWN_HEIGHT = GLOW_ROWS[0] + GLOW_ROWS[1];

/** The night lightening toward the town, and the town's own glow under that. */
function nightGlow(): string[] {
  return [
    ...dither(".", "c", GLOW_ROWS[0], GLOW_WIDTH, 0),
    ...dither("c", "p", GLOW_ROWS[1] * 2, GLOW_WIDTH, GLOW_ROWS[0]).slice(
      0,
      GLOW_ROWS[1],
    ),
  ];
}

function nightHorizon(): string[] {
  const grid = blank(TOWN_WIDTH, TOWN_HEIGHT);
  TOWN.forEach(([x, width, tall], index) => {
    const top = TOWN_HEIGHT - tall;
    fill(grid, x, top, width, tall, "i");
    // A chimney or an aerial on every other roof.
    if (index % 2 === 1) fill(grid, x + 2, top - 2, 2, 2, "i");
    // Windows two pixels tall, in columns three apart, and few of them lit.
    for (let wy = top + 2; wy < TOWN_HEIGHT - 3; wy += 4) {
      for (let wx = x + 2; wx < x + width - 2; wx += 3) {
        if (speck(wx, wy + index) < 0.3) fill(grid, wx, wy, 1, 2, "o");
      }
    }
  });
  return rows(grid);
}

const ROOF_WIDTH = 32;
/** A roof tile, and a row of them. */
const SCALE = 8;
const COURSE = 4;
const ROOF_COURSES = 3;
const RIDGE = 3;

function nightGround(): string[] {
  const grid = blank(ROOF_WIDTH, RIDGE + ROOF_COURSES * COURSE, "x");
  fill(grid, 0, 0, ROOF_WIDTH, 1, "i");
  fill(grid, 0, 1, ROOF_WIDTH, 1, "z");
  fill(grid, 0, 2, ROOF_WIDTH, 1, "i");
  for (let course = 0; course < ROOF_COURSES; course++) {
    const top = RIDGE + course * COURSE;
    // Every other row is half a tile along, as tiles are laid.
    const shift = course % 2 === 0 ? 0 : SCALE / 2;
    for (let x = shift; x < ROOF_WIDTH + shift; x += SCALE) {
      // The rounded foot of a tile: lit along it, dark where two tiles part.
      fill(grid, x + 1, top + COURSE - 2, SCALE - 2, 1, "z");
      put(grid, x, top + COURSE - 3, "z");
      put(grid, x + SCALE - 1, top + COURSE - 3, "z");
      put(grid, x, top + COURSE - 2, "i");
      put(grid, x + SCALE - 1, top + COURSE - 2, "i");
      fill(grid, x, top + COURSE - 1, SCALE, 1, "i");
      fill(grid, x + 2, top + COURSE - 1, SCALE - 4, 1, "x");
    }
  }
  return rows(grid);
}

/** Draws the three scenes from nothing; the same every time. */
export function drawHabitats(): Record<Row, HabitatScene> {
  return {
    hunt: {
      backdrop: "s",
      cast: "d",
      pixels: ["s", "h", "g", "l", "d", "f", "e", "y", "r"],
      sky: gardenSky(),
      glow: gardenGlow(),
      horizon: gardenHorizon(),
      ground: gardenGround(),
    },
    den: {
      backdrop: "w",
      cast: "k",
      pixels: ["w", "m", "b", "k", "t", "u", "v"],
      sky: denWall(),
      glow: [],
      horizon: denHorizon(),
      ground: denGround(),
    },
    prowl: {
      backdrop: "n",
      cast: "i",
      pixels: ["n", "c", "p", "a", "i", "o", "x", "z"],
      sky: nightSky(),
      glow: nightGlow(),
      horizon: nightHorizon(),
      ground: nightGround(),
    },
  };
}

export const HABITAT_SCENES: Record<Row, HabitatScene> = drawHabitats();
