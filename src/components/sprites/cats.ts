/**
 * Per-cat pixel grids. Every cat starts from one shared 16x16 chibi base and
 * layers patches on top of it. Some cats are drawn by hand, patch by patch.
 * The rest are put together from a library of parts, one part to a zone of
 * the grid, by a recipe. A cat with neither still renders, as the base.
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
  emberkit: [
    [2, 1, "33"],
    [2, 13, "33"],
    [4, 10, "3333"],
    [5, 11, "333"],
    [11, 13, ".."],
    [12, 13, "o.."],
    [13, 12, "23o."],
    [14, 5, "33"],
    [14, 9, "33"],
    [14, 14, "."],
  ],
  cinderpounce: [
    [6, 1, "33"],
    [6, 5, "333333"],
    [6, 13, "33"],
    [7, 1, "33"],
    [7, 5, "33"],
    [7, 9, "33"],
    [7, 13, "33"],
    [9, 15, "3"],
    [10, 14, "3"],
    [12, 13, "33"],
    [13, 13, "33"],
  ],
  pyrelynx: [
    [0, 0, "o"],
    [0, 15, "o"],
    [1, 0, "o"],
    [1, 15, "o"],
    [4, 6, "2"],
    [4, 9, "2"],
    [5, 7, "22"],
    [8, 1, "22"],
    [8, 13, "22"],
    [9, 2, "22"],
    [9, 12, "22"],
    [12, 7, "33"],
    [12, 13, "23"],
    [13, 13, "23"],
  ],
  mistpaw: [
    [4, 7, "22"],
    [5, 6, "2222"],
    [14, 5, "ww"],
    [14, 9, "ww"],
    [12, 13, "ww"],
  ],
  dewhisker: [
    [0, 7, "oo"],
    [1, 6, "ow2o"],
    [2, 6, "o22o"],
    [8, 1, "w33"],
    [8, 12, "33w"],
    [9, 2, "w"],
    [9, 13, "w"],
    [13, 13, "33"],
  ],
  brumefang: [
    [10, 6, "w"],
    [10, 9, "w"],
    [11, 6, "o"],
    [11, 9, "o"],
    [12, 1, "oo"],
    [13, 0, "o2wo"],
    [14, 0, "o222w22ww22w222o"],
    [15, 1, "oooo"],
    [15, 7, "oo"],
    [15, 11, "oooo"],
  ],
  nimbustail: [
    [2, 1, "33"],
    [2, 13, "33"],
    [11, 1, "oo"],
    [12, 0, "owwo"],
    [12, 13, "ww"],
    [13, 0, "ow2w"],
    [13, 12, "w2w"],
    [14, 1, "ooo"],
    [15, 1, "3.3"],
    [15, 12, "3.3"],
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
  sparkmew: [
    [0, 7, "33"],
    [1, 7, "oo"],
    [2, 7, "oo"],
    [4, 4, "31333313"],
    [12, 6, "3233"],
    [13, 11, "313"],
  ],
  joltpad: [
    [10, 3, "3333333333ooo"],
    [11, 1, "o33"],
    [11, 14, "1o"],
    [12, 1, "o3o"],
    [12, 13, "o"],
    [13, 2, "o"],
    [14, 5, "33"],
    [14, 9, "33"],
  ],
  arcpurr: [
    [4, 5, "313313"],
    [5, 7, "33"],
    [11, 2, "o11"],
    [11, 11, "11o."],
    [12, 1, "o311"],
    [12, 11, "113o."],
    [13, 1, "o31112"],
    [13, 9, "2"],
    [13, 13, "3o."],
    [14, 1, "o1111o"],
    [14, 9, "o1111"],
    [15, 2, "oooo."],
    [15, 9, ".oooo"],
  ],
  thornkit: [
    [0, 8, "oo"],
    [1, 7, "o33o"],
    [2, 6, "o32o"],
    [5, 2, "2"],
    [5, 13, "2"],
    [12, 13, "22"],
  ],
  bramblepaw: [
    [0, 5, "o.oo.o"],
    [1, 4, "o3o33o3o"],
    [2, 1, "33o33333333o33"],
    [3, 1, "323"],
    [3, 12, "323"],
    [11, 3, "o1"],
    [12, 3, "o1"],
    [12, 13, "33"],
    [13, 3, "o1"],
    [13, 13, "33"],
    [14, 3, "o22o"],
    [14, 9, "22"],
    [15, 4, "oo."],
  ],
  burrfang: [
    [4, 2, "33"],
    [4, 12, "33"],
    [5, 4, "33"],
    [5, 10, "33"],
    [10, 6, "w"],
    [10, 9, "w"],
    [10, 14, "o"],
    [11, 6, "o"],
    [11, 9, "o"],
    [12, 13, "33"],
    [13, 12, "33"],
  ],
  verdantmane: [
    [2, 5, "oooooo"],
    [3, 5, "322223"],
    [5, 3, "oo"],
    [5, 11, "oo"],
    [10, 1, "o"],
    [10, 14, "o"],
    [11, 0, "o323"],
    [11, 12, "323o"],
    [12, 0, "o232"],
    [12, 12, "232"],
    [13, 1, "ooo1"],
    [13, 12, "ooo."],
    [14, 3, "o1"],
    [14, 7, "11"],
    [14, 11, "1o.."],
    [15, 4, "o"],
    [15, 7, "oo"],
    [15, 11, "o"],
  ],
  shadewhisker: [
    [4, 1, "33"],
    [4, 13, "33"],
    [8, 1, "w"],
    [8, 14, "w"],
    [9, 2, "www"],
    [9, 11, "www"],
    [13, 4, "1."],
    [13, 10, ".1.1.1"],
    [14, 4, ".1.1.1.1.1."],
    [15, 5, ".."],
    [15, 9, ".."],
  ],
  duskmew: [
    [2, 1, "33"],
    [2, 13, "33"],
    [3, 1, "323"],
    [3, 12, "323"],
    [4, 1, "33333322333w33"],
    [5, 1, "33332222223333"],
    [12, 13, "22"],
  ],
  gloomtail: [
    [1, 1, ".."],
    [1, 13, ".."],
    [2, 1, "oo"],
    [2, 13, "oo"],
    [3, 1, "33o"],
    [3, 12, "o33"],
    [11, 1, "oo"],
    [12, 0, "o33o"],
    [13, 0, "o3333"],
    [14, 1, "ooo"],
  ],
  umbralynx: [
    [0, 0, "o"],
    [0, 15, "o"],
    [1, 0, "o"],
    [1, 15, "o"],
    [2, 1, "33"],
    [3, 1, "323"],
    [4, 1, "3333333"],
    [5, 1, "3333333"],
    [6, 1, "33"],
    [6, 5, "333"],
    [7, 1, "33"],
    [7, 5, "333"],
    [8, 1, "3333"],
    [9, 2, "333"],
    [10, 6, "33"],
    [11, 5, "3"],
    [12, 5, "3"],
    [12, 13, "33"],
    [13, 5, "33"],
    [14, 5, "33"],
  ],
  infernomane: [
    [0, 5, "o"],
    [0, 10, "o"],
    [1, 4, "o3o"],
    [1, 9, "o3o"],
    [2, 1, "33oo32oo23oo33"],
    [3, 1, "323o322223o323"],
    [4, 1, "33312222221333"],
    [5, 1, "3"],
    [5, 14, "3"],
    [6, 1, "3"],
    [6, 14, "3"],
    [7, 1, "3"],
    [7, 14, "3"],
    [8, 1, "33"],
    [8, 13, "33"],
    [9, 2, "33"],
    [9, 12, "33"],
    [10, 1, "o3233"],
    [10, 10, "3323o"],
    [11, 2, "o323"],
    [11, 10, "323"],
    [12, 3, "o"],
    [12, 13, "33"],
    [13, 13, "23"],
  ],
  stormsabre: [
    [0, 1, "oo"],
    [0, 13, "oo"],
    [1, 0, "o33o"],
    [1, 12, "o33o"],
    [10, 5, "wo"],
    [10, 9, "ow"],
    [10, 14, "oo"],
    [11, 5, "wo"],
    [11, 9, "ow"],
    [11, 14, "3o"],
    [12, 5, "o"],
    [12, 10, "o"],
    [12, 13, "33"],
    [13, 14, "3"],
  ],
  oraclemew: [
    [2, 1, "33"],
    [2, 13, "33"],
    [3, 1, "323"],
    [3, 12, "323"],
    [4, 1, "333332we233333"],
    [5, 1, "33"],
    [5, 6, "2ee2"],
    [5, 13, "33"],
    [6, 1, "3"],
    [6, 14, "3"],
    [11, 7, "oo"],
    [12, 6, "oweo"],
    [13, 6, "oeeo"],
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
  aurelynx: [
    [0, 0, "o"],
    [0, 7, "oo"],
    [0, 15, "o"],
    [1, 0, "o"],
    [1, 6, "o22o"],
    [1, 15, "o"],
    [2, 6, "o33o"],
    [4, 1, "32222222222223"],
    [5, 2, "322222222223"],
    [6, 6, "3223"],
    [7, 7, "33"],
    [11, 5, "2"],
    [11, 10, "2"],
    [12, 5, "223322"],
    [13, 6, "2"],
    [13, 9, "2"],
    [13, 13, "23"],
    [14, 5, "22"],
    [14, 9, "22"],
  ],
  // A tuxedo in his own palette: black mask, white blaze and chest, pink
  // ears and nose, and the bell on his collar in the eye's gold.
  hadu: [
    [3, 1, "131"],
    [3, 12, "131"],
    [4, 7, "22"],
    [5, 6, "2222"],
    [6, 6, "2222"],
    [7, 6, "2222"],
    [8, 3, "22"],
    [8, 11, "22"],
    [9, 2, "222"],
    [9, 11, "222"],
    [11, 5, "22ee22"],
    [12, 5, "22222"],
    [13, 5, "2222"],
    [14, 5, "22"],
    [14, 9, "22"],
  ],
};

/** `[row, from, to)`: the cells of one row from column `from` up to `to`. */
export type SpriteSpan = readonly [row: number, from: number, to: number];

/**
 * The face of the base, which no part may draw on: both eyes on rows 6 and
 * 7, the muzzle on rows 8 and 9.
 */
export const SPRITE_FACE: readonly SpriteSpan[] = [
  [6, 3, 5],
  [6, 11, 13],
  [7, 3, 5],
  [7, 11, 13],
  [8, 5, 11],
  [9, 5, 11],
];

/** The zones a part can belong to, in the order a recipe applies them. */
export const SPRITE_ZONES = [
  "ears",
  "crown",
  "brow",
  "cheeks",
  "body",
  "tail",
  "side",
  "paws",
] as const;

export type SpriteZone = (typeof SPRITE_ZONES)[number];

/**
 * The cells each zone owns. No two zones share a cell and none holds a cell
 * of the face, so one part from each zone can be laid on the base in any
 * order without one drawing over another.
 */
export const SPRITE_ZONE_CELLS: Record<SpriteZone, readonly SpriteSpan[]> = {
  // Both ears, and the corners above them for a tuft or a taller ear.
  ears: [
    [0, 0, 4],
    [0, 12, 16],
    [1, 0, 4],
    [1, 12, 16],
    [2, 0, 4],
    [2, 12, 16],
    [3, 0, 4],
    [3, 12, 16],
  ],
  // The top of the head between the ears, and the air above it.
  crown: [
    [0, 4, 12],
    [1, 4, 12],
    [2, 4, 12],
    [3, 4, 12],
  ],
  // The forehead, and the bridge of the nose between the eyes.
  brow: [
    [4, 1, 15],
    [5, 1, 15],
    [6, 5, 11],
    [7, 5, 11],
  ],
  // The sides of the face: outside the eyes, and either side of the muzzle.
  cheeks: [
    [6, 0, 3],
    [6, 13, 16],
    [7, 0, 3],
    [7, 13, 16],
    [8, 0, 5],
    [8, 11, 16],
    [9, 0, 5],
    [9, 11, 16],
  ],
  // The neck, the chest and the belly.
  body: [
    [10, 2, 14],
    [11, 4, 12],
    [12, 4, 12],
    [13, 4, 12],
  ],
  // The tail on the right, and room above and below it.
  tail: [
    [10, 14, 16],
    [11, 12, 16],
    [12, 12, 16],
    [13, 12, 16],
    [14, 12, 16],
    [15, 12, 16],
  ],
  // The empty ground on the left, for whatever the cat has beside it.
  side: [
    [10, 0, 2],
    [11, 0, 4],
    [12, 0, 4],
    [13, 0, 4],
    [14, 0, 4],
    [15, 0, 4],
  ],
  // Both front paws.
  paws: [
    [14, 4, 12],
    [15, 4, 12],
  ],
};

/**
 * The parts a recipe can pick from, by zone. Every part is a set of patches
 * that stays inside its zone. A zone a recipe leaves out keeps the base.
 */
export const SPRITE_PARTS = {
  ears: {
    // Accent on the tips.
    tipped: [
      [2, 1, "33"],
      [2, 13, "33"],
    ],
    // Accent all the way down.
    dipped: [
      [2, 1, "33"],
      [3, 1, "323"],
      [2, 13, "33"],
      [3, 12, "323"],
    ],
    // The belly's light fur inside the ears.
    pale: [
      [2, 1, "22"],
      [3, 1, "222"],
      [2, 13, "22"],
      [3, 12, "222"],
    ],
    // A lynx's tufts at the outer corners.
    tufted: [
      [0, 0, "o"],
      [1, 0, "o"],
      [0, 15, "o"],
      [1, 15, "o"],
    ],
    // Tufts and accent tips together.
    lynx: [
      [0, 0, "o"],
      [1, 0, "o"],
      [2, 1, "33"],
      [0, 15, "o"],
      [1, 15, "o"],
      [2, 13, "33"],
    ],
    // A row taller.
    tall: [
      [0, 1, "oo"],
      [1, 0, "o11o"],
      [0, 13, "oo"],
      [1, 12, "o11o"],
    ],
    // A row taller and accent to the tip.
    spire: [
      [0, 1, "oo"],
      [1, 0, "o33o"],
      [2, 1, "33"],
      [0, 13, "oo"],
      [1, 12, "o33o"],
      [2, 13, "33"],
    ],
    // Both ears folded flat.
    folded: [
      [1, 1, ".."],
      [2, 0, "ooo."],
      [3, 0, "o22o"],
      [1, 13, ".."],
      [2, 12, ".ooo"],
      [3, 12, "o22o"],
    ],
    // One ear up, the other folded.
    flop: [
      [1, 13, ".."],
      [2, 12, ".ooo"],
      [3, 12, "o22o"],
    ],
    // One ear in the accent, the other left alone.
    odd: [
      [2, 1, "33"],
      [3, 1, "323"],
    ],
  },
  crown: {
    flame: [
      [0, 7, "oo"],
      [1, 6, "o32o"],
      [2, 5, "o3223o"],
      [3, 6, "3333"],
    ],
    drop: [
      [0, 7, "oo"],
      [1, 6, "o2wo"],
      [2, 6, "o22o"],
    ],
    leaf: [
      [0, 6, "oo"],
      [1, 5, "o33o"],
      [2, 6, "o23o"],
    ],
    // A bolt standing on the head.
    bolt: [
      [0, 8, "33"],
      [1, 7, "33"],
      [2, 8, "33"],
      [3, 7, "33"],
    ],
    // Two feelers with an accent bulb each.
    antennae: [
      [0, 5, "3"],
      [0, 10, "3"],
      [1, 5, "o"],
      [1, 10, "o"],
      [2, 6, "o"],
      [2, 9, "o"],
    ],
    // Three points and two jewels.
    crown: [
      [0, 5, "o.oo.o"],
      [1, 4, "o3o33o3o"],
      [2, 4, "o3e33e3o"],
    ],
    // Two white horns.
    horns: [
      [0, 5, "o"],
      [0, 10, "o"],
      [1, 4, "owo"],
      [1, 9, "owo"],
      [2, 4, "owo"],
      [2, 9, "owo"],
      [3, 5, "w"],
      [3, 10, "w"],
    ],
    // Horns that have only just come through.
    nubs: [
      [1, 5, "o"],
      [1, 10, "o"],
      [2, 4, "owo"],
      [2, 9, "owo"],
      [3, 5, "w"],
      [3, 10, "w"],
    ],
    // A tuft of light fur.
    tuft: [
      [1, 7, "oo"],
      [2, 6, "o22o"],
      [3, 7, "22"],
    ],
    cap: [
      [1, 6, "oooo"],
      [2, 5, "o3333o"],
      [3, 5, "322223"],
    ],
    // A ring in the eye's colour, floating.
    halo: [
      [0, 6, "oooo"],
      [1, 5, "oeeeeo"],
      [2, 6, "oooo"],
    ],
    bow: [
      [1, 5, "oo"],
      [1, 9, "oo"],
      [2, 4, "o33oo33o"],
      [3, 5, "332233"],
    ],
    // One feather, leaning right.
    plume: [
      [0, 9, "oo"],
      [1, 8, "o22o"],
      [2, 7, "o23o"],
      [3, 8, "3"],
    ],
    // A spark hanging over the head.
    spark: [
      [0, 7, "33"],
      [1, 6, "3ww3"],
      [2, 7, "33"],
    ],
    // A tall hat with a light band.
    hat: [
      [0, 6, "oooo"],
      [1, 6, "o33o"],
      [2, 6, "o22o"],
    ],
  },
  brow: {
    // A light stripe down the nose.
    blaze: [
      [4, 7, "22"],
      [5, 7, "22"],
      [6, 7, "22"],
      [7, 7, "22"],
    ],
    diamond: [
      [4, 7, "33"],
      [5, 6, "3333"],
      [6, 7, "33"],
    ],
    // A tabby's three bars.
    tabby: [
      [4, 5, "3"],
      [4, 7, "33"],
      [4, 10, "3"],
      [5, 5, "3"],
      [5, 10, "3"],
    ],
    // Slanted brows over the eyes.
    brows: [
      [4, 2, "33"],
      [4, 12, "33"],
      [5, 3, "33"],
      [5, 11, "33"],
    ],
    // A headband.
    band: [[4, 1, "33333333333333"]],
    // A hood that comes down either side of the face.
    hood: [
      [4, 1, "33333333333333"],
      [5, 1, "33"],
      [5, 13, "33"],
    ],
    // A jewel in the eye's colour.
    gem: [
      [4, 7, "oo"],
      [5, 6, "oeeo"],
      [6, 7, "oo"],
    ],
    // A patch over the left eye.
    spot: [
      [4, 2, "333"],
      [5, 1, "3333"],
    ],
    chevron: [
      [4, 5, "3"],
      [4, 10, "3"],
      [5, 6, "3"],
      [5, 9, "3"],
      [6, 7, "33"],
    ],
    spots: [
      [4, 3, "33"],
      [4, 9, "33"],
      [5, 6, "33"],
      [5, 12, "33"],
    ],
    // A dark bridge between the eyes.
    bridge: [
      [5, 7, "33"],
      [6, 6, "3333"],
      [7, 6, "3333"],
    ],
    // A light forehead.
    dome: [
      [4, 3, "2222222222"],
      [5, 4, "22222222"],
    ],
  },
  cheeks: {
    blush: [
      [8, 2, "33"],
      [8, 12, "33"],
    ],
    // Light fur either side of the muzzle.
    jowls: [
      [8, 1, "2222"],
      [8, 11, "2222"],
      [9, 2, "222"],
      [9, 11, "222"],
    ],
    // Accent outside the eyes.
    mask: [
      [6, 1, "33"],
      [6, 13, "33"],
      [7, 1, "33"],
      [7, 13, "33"],
    ],
    // Two bars a side.
    stripes: [
      [6, 1, "33"],
      [6, 13, "33"],
      [8, 1, "33"],
      [8, 13, "33"],
    ],
    // A line from each eye toward the muzzle.
    tears: [
      [8, 3, "3"],
      [8, 12, "3"],
      [9, 4, "3"],
      [9, 11, "3"],
    ],
    whiskers: [
      [8, 1, "ww"],
      [8, 13, "ww"],
      [9, 2, "w"],
      [9, 13, "w"],
    ],
    // Accent down both edges of the face.
    mane: [
      [6, 1, "3"],
      [6, 14, "3"],
      [7, 1, "3"],
      [7, 14, "3"],
      [8, 1, "33"],
      [8, 13, "33"],
      [9, 2, "33"],
      [9, 12, "33"],
    ],
    // The left cheek in the accent.
    patch: [
      [6, 1, "33"],
      [7, 1, "33"],
      [8, 1, "3333"],
      [9, 2, "333"],
    ],
    freckles: [
      [8, 2, "3"],
      [8, 4, "3"],
      [8, 11, "3"],
      [8, 13, "3"],
      [9, 3, "3"],
      [9, 12, "3"],
    ],
  },
  body: {
    collar: [[10, 6, "3333"]],
    // A collar with a bell in the eye's colour.
    bell: [
      [10, 6, "3333"],
      [11, 7, "ee"],
    ],
    // A scarf with one end hanging.
    scarf: [
      [10, 3, "3333333333"],
      [11, 9, "33"],
      [12, 10, "3"],
    ],
    // Two long teeth over the chest.
    fangs: [
      [10, 6, "w"],
      [10, 9, "w"],
      [11, 5, "1w11w1"],
      [12, 6, "o"],
      [12, 9, "o"],
    ],
    // Accent from the neck to a point on the chest.
    bib: [
      [10, 6, "3333"],
      [11, 6, "3333"],
      [12, 7, "33"],
    ],
    // The belly in the accent.
    belly: [
      [11, 6, "3333"],
      [12, 6, "3333"],
      [13, 7, "33"],
    ],
    belt: [[12, 5, "333333"]],
    // A band across the chest and one across the hips.
    stripes: [
      [11, 5, "333333"],
      [13, 5, "333333"],
    ],
    // A stone set in the chest, in the eye's colour.
    core: [
      [11, 6, "oeeo"],
      [12, 6, "oeeo"],
      [13, 7, "oo"],
    ],
    // Accent down both flanks, open at the front.
    vest: [
      [11, 5, "33"],
      [11, 9, "33"],
      [12, 5, "33"],
      [12, 9, "33"],
      [13, 5, "33"],
      [13, 9, "33"],
    ],
    // No light belly at all.
    plain: [
      [11, 6, "1111"],
      [12, 6, "1111"],
      [13, 7, "11"],
    ],
  },
  tail: {
    tipped: [
      [12, 13, "33"],
      [13, 14, "3"],
    ],
    // A white tip.
    snow: [
      [12, 13, "ww"],
      [13, 14, "w"],
    ],
    ringed: [
      [12, 13, "31"],
      [13, 12, "313"],
    ],
    // A row taller.
    tall: [
      [10, 14, "o"],
      [11, 14, "1o"],
    ],
    // A tip that has caught light.
    flare: [
      [10, 14, "3"],
      [11, 13, "323"],
      [12, 13, "22"],
    ],
    // A short stub of light fur.
    bob: [
      [11, 13, ".."],
      [12, 13, "o.."],
      [13, 12, "22o."],
      [14, 14, "."],
    ],
    // Twice as thick, with a light tip.
    bushy: [
      [12, 13, "22"],
      [14, 13, "11o"],
      [15, 13, "oo"],
    ],
    // Hanging down rather than held up.
    low: [
      [11, 13, ".."],
      [12, 13, "oo"],
      [14, 13, "11o"],
      [15, 13, "oo"],
    ],
    // A barb either side of an accent tip.
    barbed: [
      [11, 12, "3oo3"],
      [12, 13, "33"],
    ],
    // A zigzag of accent in place of the tail.
    bolt: [
      [10, 14, "33"],
      [11, 13, "33."],
      [12, 13, ".33"],
      [13, 12, "133."],
    ],
    // No tail to speak of.
    manx: [
      [11, 13, ".."],
      [12, 12, "...."],
      [13, 12, "o..."],
      [14, 12, "..."],
    ],
  },
  side: {
    // A bat's wing.
    wing: [
      [11, 0, "oo"],
      [12, 0, "o3o"],
      [13, 0, "o333"],
      [14, 1, "ooo"],
    ],
    // A bird's wing.
    feathers: [
      [11, 0, "ooo"],
      [12, 0, "owwo"],
      [13, 1, "o2w"],
      [14, 2, "oo"],
    ],
    // A second tail.
    twin: [
      [11, 1, "oo"],
      [12, 0, "o11o"],
      [13, 0, "o111"],
      [14, 1, "ooo"],
    ],
    // A ball of yarn.
    yarn: [
      [12, 1, "oo"],
      [13, 0, "o33o"],
      [14, 0, "o32o"],
      [15, 1, "oo"],
    ],
    flower: [
      [11, 1, "3"],
      [12, 0, "3w3"],
      [13, 1, "3"],
      [14, 1, "o"],
      [15, 1, "o"],
    ],
    // A light with nothing holding it.
    wisp: [
      [10, 0, "2"],
      [11, 1, "22"],
      [12, 0, "2ww2"],
      [13, 0, "2ww2"],
      [14, 1, "22"],
    ],
    spark: [
      [11, 2, "3"],
      [12, 1, "33"],
      [13, 2, "33"],
      [14, 2, "3"],
    ],
    // A lantern lit in the eye's colour.
    lantern: [
      [11, 1, "oo"],
      [12, 0, "oeeo"],
      [13, 0, "oeeo"],
      [14, 1, "oo"],
    ],
  },
  paws: {
    // White socks.
    socks: [
      [14, 5, "ww"],
      [14, 9, "ww"],
    ],
    // Accent socks.
    boots: [
      [14, 5, "33"],
      [14, 9, "33"],
    ],
    pale: [
      [14, 5, "22"],
      [14, 9, "22"],
    ],
    // One white sock.
    odd: [[14, 5, "ww"]],
    // Paws tucked under, as a cat sits.
    loaf: [
      [14, 7, "11"],
      [15, 7, "oo"],
    ],
    // Tucked under and in the accent.
    mitts: [
      [14, 5, "333333"],
      [15, 7, "oo"],
    ],
  },
} as const satisfies Record<SpriteZone, Record<string, readonly SpritePatch[]>>;

/** The name of a part of one zone. */
export type SpritePartId<Z extends SpriteZone> = keyof (typeof SPRITE_PARTS)[Z];

/**
 * How a cat with no patches of its own is put together: at most one part to
 * a zone, and the coat it wears. `coat` counts along its element's coats in
 * `palettes.ts`, and a recipe without one wears the first.
 */
export type SpriteRecipe = {
  readonly [Z in SpriteZone]?: SpritePartId<Z>;
} & { readonly coat?: number };

/**
 * A recipe before its part names are checked against the library, which is
 * what the generator and the tests put together.
 */
export type SpriteRecipeDraft = Readonly<
  Partial<Record<SpriteZone, string>>
> & {
  readonly coat?: number;
};

/**
 * The recipe of every cat that is not drawn by hand. `pnpm sprites:recipes`
 * writes this table, choosing recipes that sit as far apart as it can get
 * them. A cat in `SPRITE_PATCHES` has no use for one.
 */
export const SPRITE_RECIPES: Record<string, SpriteRecipe> = {};

/** Returns `rows` with one patch written over it. */
export function applyPatch(
  rows: readonly string[],
  [row, column, pixels]: SpritePatch,
): string[] {
  return rows.map((line, y) =>
    y === row
      ? line.slice(0, column) + pixels + line.slice(column + pixels.length)
      : line,
  );
}

/** The names of every part of a zone. */
export function spritePartIds(zone: SpriteZone): string[] {
  return Object.keys(SPRITE_PARTS[zone]);
}

/** The patches of one part, or none for a part the zone does not have. */
export function spritePart(
  zone: SpriteZone,
  part: string | undefined,
): readonly SpritePatch[] {
  if (part === undefined) return [];
  const parts: Record<string, readonly SpritePatch[]> = SPRITE_PARTS[zone];
  return parts[part] ?? [];
}

/** The 16 rows a recipe makes: its parts laid on the base, zone by zone. */
export function recipeSprite(recipe: SpriteRecipeDraft): readonly string[] {
  return SPRITE_ZONES.flatMap((zone) => spritePart(zone, recipe[zone])).reduce<
    readonly string[]
  >(applyPatch, BASE_SPRITE);
}

/**
 * The 16 rows of a cat's sprite: its own patches if it was drawn by hand,
 * else its recipe. A cat with neither gets the base sprite unchanged.
 */
export function catSprite(catId: string): readonly string[] {
  const patches = SPRITE_PATCHES[catId];
  if (patches) {
    return patches.reduce<readonly string[]>(applyPatch, BASE_SPRITE);
  }
  const recipe = SPRITE_RECIPES[catId];
  return recipe ? recipeSprite(recipe) : BASE_SPRITE;
}

/** What tells one cat from another of its element: its grid and its coat. */
export interface SpriteLook {
  readonly grid: readonly string[];
  readonly coat: number;
}

/** A cat's look. A cat drawn by hand wears its element's first coat. */
export function catLook(catId: string): SpriteLook {
  return { grid: catSprite(catId), coat: SPRITE_RECIPES[catId]?.coat ?? 0 };
}

/** What wearing another coat adds to the distance between two looks. */
export const COAT_DISTANCE = 10;

/** How many of the 256 cells differ between two grids. */
export function gridDistance(a: readonly string[], b: readonly string[]) {
  let cells = 0;
  for (let y = 0; y < SPRITE_SIZE; y++) {
    const rowA = a[y] ?? "";
    const rowB = b[y] ?? "";
    for (let x = 0; x < SPRITE_SIZE; x++) {
      if (rowA[x] !== rowB[x]) cells++;
    }
  }
  return cells;
}

/**
 * How far apart two cats of one element look: the cells that differ between
 * their grids, and `COAT_DISTANCE` more if they wear different coats.
 */
export function spriteDistance(a: SpriteLook, b: SpriteLook): number {
  const coat = a.coat === b.coat ? 0 : COAT_DISTANCE;
  return gridDistance(a.grid, b.grid) + coat;
}

/**
 * The least `spriteDistance` allowed between a cat built from a recipe and
 * any other cat of its element. `pnpm sprites:recipes --fake=75` leaves the
 * nearest two 38 apart, so the table it writes clears this with some room.
 */
export const MIN_RECIPE_DISTANCE = 32;
