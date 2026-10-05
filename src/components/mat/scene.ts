import type { CSSProperties } from "react";

import {
  HABITAT_COLORS,
  HABITAT_SCENES,
  type HabitatScene,
} from "~/components/sprites/habitats";
import { tileImage } from "~/components/tower/tile";
import type { Row } from "~/server/game/cats";

/** The character most of a band is drawn in, if the band has no clear pixel. */
function ground(rows: readonly string[]): string | null {
  const counts = new Map<string, number>();
  for (const pixel of rows.join("")) {
    if (pixel === ".") return null;
    counts.set(pixel, (counts.get(pixel) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

/**
 * One band as an image. A band with nothing clear in it is its commonest
 * colour laid whole, and the rest drawn on that.
 */
function bandImage(rows: readonly string[]): string {
  if (rows.length === 0) return "none";
  const base = ground(rows);
  if (base === null) return tileImage(rows, HABITAT_COLORS);
  return tileImage(
    rows,
    { ...HABITAT_COLORS, [base]: null },
    HABITAT_COLORS[base as keyof typeof HABITAT_COLORS],
  );
}

/** What `.lane-scene` reads: each band's image and its size in scene pixels. */
function sceneStyle(scene: HabitatScene): CSSProperties {
  return {
    "--scene-backdrop": HABITAT_COLORS[scene.backdrop],
    "--cast": HABITAT_COLORS[scene.cast],
    "--scene-sky": bandImage(scene.sky),
    "--scene-sky-w": scene.sky[0]?.length ?? 0,
    "--scene-sky-h": scene.sky.length,
    "--scene-glow": bandImage(scene.glow),
    "--scene-horizon": bandImage(scene.horizon),
    "--scene-horizon-w": scene.horizon[0]?.length ?? 0,
    "--scene-horizon-h": scene.horizon.length,
    "--scene-ground": bandImage(scene.ground),
    "--scene-ground-w": scene.ground[0]?.length ?? 0,
    "--scene-ground-h": scene.ground.length,
  } as CSSProperties;
}

// Drawn once: an image is a long string, and every mat on the page shares it.
const SCENES: Record<Row, CSSProperties> = {
  hunt: sceneStyle(HABITAT_SCENES.hunt),
  den: sceneStyle(HABITAT_SCENES.den),
  prowl: sceneStyle(HABITAT_SCENES.prowl),
};

/**
 * The scenery of a lane, as the custom properties `.lane-scene` lays out:
 * the garden for the Hunt, the room for the Den, the rooftops for the Prowl.
 * It also says what a piece standing in that lane casts.
 */
export function laneScene(row: Row): CSSProperties {
  return SCENES[row];
}
