/**
 * The six rivals of a run as pixel cats, met at their windows on the way up
 * the tower. They share the cats' 16x16 grid and legend, and are tinted with
 * the rival coral in `palettes.ts`. A boss wears something that reaches the
 * top row; nobody else does.
 */

import { BASE_SPRITE, applyPatch, type SpritePatch } from "./cats";

const RIVAL_PATCHES: Record<string, readonly SpritePatch[]> = {
  // A bitten ear, a plaster, and stripes nobody has combed.
  "alley-tom": [
    [1, 1, "o."],
    [2, 2, "oo"],
    [4, 9, "www"],
    [5, 9, "w3w"],
    [4, 2, "3"],
    [4, 4, "3"],
    [5, 3, "3"],
    [12, 6, "3223"],
    [13, 12, "3"],
    [13, 14, "3"],
  ],
  // A feathered hat, pearls, and the white mittens.
  "madame-mittens": [
    [0, 5, "ooooow"],
    [1, 4, "o3333wwo"],
    [2, 4, "o222222o"],
    [10, 6, "w1w1"],
    [13, 5, "ww"],
    [13, 9, "ww"],
    [14, 5, "ww"],
    [14, 9, "ww"],
  ],
  // A flat cap pulled low, and two more of the seven close behind.
  "rooftop-syndicate": [
    [1, 5, "oo"],
    [1, 9, "oo"],
    [2, 4, "o33o"],
    [2, 8, "o33o"],
    [4, 1, "33333333333333"],
    [5, 1, "oooooooooo"],
  ],
  // Spectacles, and a card with your name on it.
  "the-archivist": [
    [5, 2, "wwww"],
    [5, 10, "wwww"],
    [6, 2, "w"],
    [6, 5, "woooow"],
    [6, 13, "w"],
    [7, 2, "w"],
    [7, 5, "w"],
    [7, 10, "w"],
    [7, 13, "w"],
    [8, 2, "www"],
    [8, 11, "www"],
    [11, 6, "wwww"],
    [12, 6, "w33w"],
  ],
  // A crown, one eye shut under a scar, and whiskers gone white.
  "old-nine-lives": [
    [0, 5, "w.ww.w"],
    [1, 5, "wwwwww"],
    [2, 5, "oooooo"],
    [4, 3, "3"],
    [5, 3, "3"],
    [6, 3, "11"],
    [7, 3, "oo"],
    [8, 1, "ww"],
    [8, 13, "ww"],
    [9, 2, "w"],
    [9, 13, "w"],
  ],
};

/** Two small cats where one would sit. The one on the right has the cap. */
const DOCKSIDE_TWINS = [
  "................",
  "................",
  "................",
  "................",
  "................",
  ".o....o...oooo..",
  "o1o..o1o.o3w3wo.",
  "o1oooo1ooooooooo",
  "o111111oo111111o",
  "o1e11e1oo1e11e1o",
  "o11ww11oo11ww11o",
  ".oooooo..oooooo.",
  ".o1221o..o1221o.",
  ".o1221o..o1221o.",
  ".o1oo1o..o1oo1o.",
  "..o..o....o..o..",
] as const;

export const RIVAL_SPRITES: Record<string, readonly string[]> = {
  ...Object.fromEntries(
    Object.entries(RIVAL_PATCHES).map(([rivalId, patches]) => [
      rivalId,
      patches.reduce<readonly string[]>(applyPatch, BASE_SPRITE),
    ]),
  ),
  "dockside-twins": DOCKSIDE_TWINS,
};

/** The 16 rows of a rival's sprite. A rival not drawn yet gets the base. */
export function rivalSprite(rivalId: string): readonly string[] {
  return RIVAL_SPRITES[rivalId] ?? BASE_SPRITE;
}
