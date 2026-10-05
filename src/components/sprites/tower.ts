/**
 * The tower a run climbs: a grey, ribbed cat condo with a rival's window on
 * every floor. It is drawn the way the cats are, as rows of legend
 * characters at the cats' own pixel size, so a 16x16 sprite sits in a window
 * or on a ledge without being scaled.
 */

/** What each grid character means. */
export const TOWER_LEGEND = {
  ".": "transparent",
  o: "outline",
  "1": "stone",
  "2": "lit stone",
  "3": "rib and shade",
} as const;

/** The stone greys as values. `globals.css` names the same four as tokens. */
export const STONE = "#9aa9b7";
export const STONE_LIGHT = "#d0dae2";
export const STONE_RIB = "#6e7f90";
export const STONE_DEEP = "#3a4857";

/** The strip left of the tower that the ledges reach into; a cat wide. */
export const LANE = 16;
const BODY = 60;
/** How far the roof and the foot stand out past the body on each side. */
const EAVE = 2;
export const TOWER_WIDTH = LANE + BODY + EAVE;

const TIER_HEIGHT = 28;
const BOSS_TIER_HEIGHT = 36;
/** A ledge's top edge, counted up from the bottom of its floor. */
const LEDGE_RISE = 3;

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A window: where it is cut, and how far each row's corners are cut in. */
interface Cut extends Box {
  top: readonly number[];
  bottom: readonly number[];
}

/** A round window, stepped. */
const WINDOW: Cut = {
  x: 19,
  y: 3,
  width: 22,
  height: 20,
  top: [4, 2, 1, 1],
  bottom: [1, 1, 2, 4],
};
/** A boss's window: square, larger, and hung under a lintel. */
const BOSS_WINDOW: Cut = {
  x: 17,
  y: 4,
  width: 26,
  height: 27,
  top: [],
  bottom: [1],
};
const LINTEL: Box = { x: 14, y: 2, width: 32, height: 3 };

function fill(pixel: string, count: number): string {
  return pixel.repeat(Math.max(0, count));
}

function framed(pixel: string, width: number): string {
  return `o${fill(pixel, width - 2)}o`;
}

/**
 * One row across the cylinder: lit down the left, shaded down the right,
 * and a rib every fourth pixel between.
 */
const PROFILE = Array.from({ length: BODY }, (_, x) => {
  if (x === 0 || x === BODY - 1) return "o";
  if (x <= 4) return "2";
  if (x >= BODY - 7) return "3";
  return (x - 7) % 4 === 0 ? "3" : "1";
}).join("");

function inside(cut: Cut, x: number, y: number): boolean {
  if (y < 0 || y >= cut.height) return false;
  const inset = cut.top[y] ?? cut.bottom[cut.bottom.length - cut.height + y];
  return x >= (inset ?? 0) && x < cut.width - (inset ?? 0);
}

/** Cuts a window through a floor: an outline one pixel wide round a hole. */
function cutWindow(rows: string[], cut: Cut): string[] {
  return rows.map((row, y) => {
    const pixels = [...row];
    for (let x = 0; x < cut.width; x++) {
      const at = (dx: number, dy: number) =>
        inside(cut, x + dx, y - cut.y + dy);
      if (!at(0, 0)) continue;
      const open = at(-1, 0) && at(1, 0) && at(0, -1) && at(0, 1);
      pixels[cut.x + x] = open ? "." : "o";
    }
    return pixels.join("");
  });
}

function tier(boss: boolean): string[] {
  const height = boss ? BOSS_TIER_HEIGHT : TIER_HEIGHT;
  let body = Array.from({ length: height }, (_, y) => {
    if (y === height - 1) return fill("o", BODY);
    if (y === height - 2) return framed("3", BODY);
    return y === 0 ? framed("2", BODY) : PROFILE;
  });
  if (boss) {
    body = body.map((row, y) => {
      const at = y - LINTEL.y;
      if (at < 0 || at >= LINTEL.height) return row;
      const band =
        at === 0 || at === LINTEL.height - 1
          ? fill("o", LINTEL.width)
          : framed("2", LINTEL.width);
      return row.slice(0, LINTEL.x) + band + row.slice(LINTEL.x + LINTEL.width);
    });
  }
  body = cutWindow(body, boss ? BOSS_WINDOW : WINDOW);

  const ledge = height - LEDGE_RISE;
  return body.map((row, y) => {
    const lane =
      y === ledge || y === height - 1
        ? fill(".", 2) + fill("o", LANE - 2)
        : y > ledge
          ? `${fill(".", 2)}o${fill("2", LANE - 3)}`
          : fill(".", LANE);
    return lane + row + fill(".", EAVE);
  });
}

function slab(shades: readonly string[]): string[] {
  const width = BODY + 2 * EAVE;
  return [
    fill("o", width),
    ...shades.map((shade) => framed(shade, width)),
    fill("o", width),
  ].map((row) => fill(".", LANE - EAVE) + row);
}

export const TIER: readonly string[] = tier(false);
export const BOSS_TIER: readonly string[] = tier(true);
export const ROOF: readonly string[] = slab(["2", "2", "1", "1", "1", "3"]);
export const FOOT: readonly string[] = slab(["1", "3"]);

export interface TowerFloor {
  /** The floor's top row, counted down from the top of the roof. */
  top: number;
  height: number;
  boss: boolean;
  /** The hole in the window, inside its outline. */
  hole: Box;
  /** The row a cat on this floor's ledge stands on. */
  ledge: number;
}

export interface Tower {
  width: number;
  height: number;
  /** The whole tower, roof first. */
  rows: readonly string[];
  /** The floors by match: the first is at the bottom. */
  floors: readonly TowerFloor[];
}

/** Stacks a tower with one floor per match; a boss's floor stands taller. */
export function buildTower(bosses: readonly boolean[]): Tower {
  const rows: string[] = [...ROOF];
  const floors: TowerFloor[] = [];
  for (let index = bosses.length - 1; index >= 0; index--) {
    const boss = bosses[index] ?? false;
    const grid = boss ? BOSS_TIER : TIER;
    const cut = boss ? BOSS_WINDOW : WINDOW;
    const top = rows.length;
    floors[index] = {
      top,
      height: grid.length,
      boss,
      hole: {
        x: LANE + cut.x + 1,
        y: top + cut.y + 1,
        width: cut.width - 2,
        height: cut.height - 2,
      },
      ledge: top + grid.length - LEDGE_RISE,
    };
    rows.push(...grid);
  }
  rows.push(...FOOT);
  return { width: TOWER_WIDTH, height: rows.length, rows, floors };
}

/**
 * The inside of the tower, as one tile of wall that repeats: courses of deep
 * stone, and a shelf of index cards stood on end. It is what a camera sees
 * once it has gone in through a window.
 */
export const WALL_LEGEND = {
  ".": "deep stone",
  "3": "mortar",
  "1": "the shelf",
  "2": "the shelf's lit edge",
  c: "a card, chipboard",
  w: "a card, cream",
} as const;

export const WALL_WIDTH = 32;
/** A course of stone: a line of mortar and five rows of block. */
const COURSE = 6;
/** How far apart the upright joints of a course are. */
const BLOCK = 16;
/** Cards on the shelf: where each stands, how wide, how tall, and its stock. */
const CARDS: readonly (readonly [number, number, number, string])[] = [
  [2, 2, 7, "c"],
  [4, 2, 8, "w"],
  [6, 3, 6, "c"],
  [11, 2, 8, "1"],
  [13, 2, 5, "w"],
  [18, 3, 8, "c"],
  [21, 2, 7, "w"],
  [25, 2, 6, "c"],
  [27, 3, 8, "1"],
];
/** The rows above the shelf that cards stand in. */
const SHELF_ROOM = 10;

function course(joint: number): string[] {
  const block = Array.from({ length: WALL_WIDTH }, (_, x) =>
    x % BLOCK === joint ? "3" : ".",
  ).join("");
  return [
    fill("3", WALL_WIDTH),
    ...Array.from({ length: COURSE - 1 }, () => block),
  ];
}

function shelf(): string[] {
  const rows = Array.from({ length: SHELF_ROOM }, (_, y) =>
    Array.from({ length: WALL_WIDTH }, (_, x) => {
      const card = CARDS.find(
        ([left, width, height]) =>
          x >= left && x < left + width && y >= SHELF_ROOM - height,
      );
      return card?.[3] ?? ".";
    }).join(""),
  );
  return [...rows, fill("2", WALL_WIDTH), fill("1", WALL_WIDTH)];
}

export const WALL: readonly string[] = [
  ...course(8),
  ...course(0),
  ...course(8),
  ...shelf(),
  ...course(0),
];

export interface Block extends Box {
  fill: string;
}

/**
 * Turns rows into as few rectangles as will draw them: a run of one colour
 * along a row, grown downward while the rows below repeat it.
 */
export function stackRuns(
  rows: readonly string[],
  colors: Record<string, string | null>,
): Block[] {
  const blocks: Block[] = [];
  let open = new Map<string, Block>();

  rows.forEach((row, y) => {
    const next = new Map<string, Block>();
    let start = 0;
    for (let x = 1; x <= row.length; x++) {
      if (x < row.length && row[x] === row[start]) continue;
      const color = colors[row[start] ?? "."] ?? null;
      if (color !== null) {
        const key = `${start}:${x - start}:${color}`;
        const above = open.get(key);
        if (above) above.height += 1;
        else {
          blocks.push({
            x: start,
            y,
            width: x - start,
            height: 1,
            fill: color,
          });
        }
        const block = above ?? blocks[blocks.length - 1];
        if (block) next.set(key, block);
      }
      start = x;
    }
    open = next;
  });

  return blocks;
}
