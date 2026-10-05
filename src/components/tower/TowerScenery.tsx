import type { CSSProperties } from "react";

import {
  CLOUDS_FAR,
  CLOUDS_NEAR,
  ROCK_DEPTH,
  SCENERY_COLORS,
  SEA,
  SEA_WIDTH,
  SHORE_REACH,
  SKY,
  SKY_WIDTH,
  rock,
  shore,
  type Span,
} from "~/components/sprites/scenery";
import { skySkin, type SkySkin } from "~/components/skins/skins";
import type { Tower } from "~/components/sprites/tower";

import { sceneHeight } from "./camera";
import { tileImage } from "./tile";
import { px } from "./TowerStage";

interface Tiles {
  sky: string;
  sea: string;
  far: string;
  near: string;
}

/** The four tiles of the scene in one sky's colours, built once a sky. */
const TILES = new WeakMap<SkySkin, Tiles>();

function tilesFor(skin: SkySkin): Tiles {
  const built = TILES.get(skin);
  if (built) return built;
  const [a, b, c, d] = skin.sky;
  const [w, l, g] = skin.cloud;
  const [s, n, f, h] = skin.sea;
  const colors = { ...SCENERY_COLORS, a, b, c, d, w, l, g, s, n, f, h };
  const tiles = {
    sky: tileImage(SKY, colors),
    sea: tileImage(SEA, colors),
    far: tileImage(CLOUDS_FAR, colors),
    near: tileImage(CLOUDS_NEAR, colors),
  };
  TILES.set(skin, tiles);
  return tiles;
}

const FAR_WIDTH = CLOUDS_FAR[0]?.length ?? 0;
const NEAR_WIDTH = CLOUDS_NEAR[0]?.length ?? 0;

/**
 * How far to each side of the tower the sky, the clouds and the sea are
 * laid, and how far up the sky goes, in tower pixels. More than the widest
 * and tallest window shows at the tower's largest pixel.
 */
const REACH = 800;
const HEIGHT = 800;
/** How far up the tower the sea's horizon is, from the ground it stands on. */
const HORIZON = 34;
/** How far the foot of each bank of cloud sits under the horizon. */
const FAR_SUNK = 6;
const NEAR_SUNK = 2;

/** A band of one tile repeated sideways, placed in tower pixels. */
function band(
  image: string,
  tile: readonly [width: number, height: number],
  top: number,
  height: number,
  /** Room for the band to drift one tile to the left. */
  spare = 0,
): CSSProperties {
  return {
    left: px(-REACH),
    width: px(REACH * 2 + spare),
    top: px(top),
    height: px(height),
    backgroundImage: image,
    backgroundSize: `${px(tile[0])} ${px(tile[1])}`,
  };
}

/** A shape that is not a tile, as crisp inline SVG placed in tower pixels. */
function Shape({
  spans,
  left,
  top,
  width,
  height,
}: {
  spans: readonly Span[];
  left: number;
  top: number;
  width: number;
  height: number;
}) {
  const first = spans[0]?.y ?? 0;
  return (
    <svg
      viewBox={`${left} ${first} ${width} ${height}`}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      className="absolute"
      style={{
        left: px(left),
        top: px(top + first),
        width: px(width),
        height: px(height),
        imageRendering: "pixelated",
      }}
    >
      {spans.map((span) => (
        <rect
          key={span.y}
          x={span.left}
          y={span.y}
          width={span.right - span.left}
          height={1}
          fill={SCENERY_COLORS[span.pixel] ?? undefined}
        />
      ))}
    </svg>
  );
}

/**
 * Where the tower stands, behind everything on it: a sky that dithers down
 * to its palest at the horizon (an evening one, ember to pale gold, unless
 * the player has another), two banks of cloud drifting along the horizon,
 * the sea, the rock under the tower's foot and the dark near shore.
 * It is part of the picture, so the camera magnifies it with the tower and a
 * climb goes up past the clouds.
 */
export function TowerScenery({
  tower,
  sky = skySkin(null),
}: {
  tower: Tower;
  /** The sky it stands under; the evening one if left out. */
  sky?: SkySkin;
}) {
  const tiles = tilesFor(sky);
  const ground = sceneHeight(tower);
  const horizon = ground - HORIZON;
  const stone = rock(tower.width);
  const stoneLeft = Math.min(...stone.map((span) => span.left));
  const stoneRight = Math.max(...stone.map((span) => span.right));
  const land = shore();

  return (
    <>
      <span
        className="scene-band scene-sky"
        style={{
          ...band(
            tiles.sky,
            [SKY_WIDTH, SKY.length],
            -HEIGHT,
            HEIGHT + horizon,
          ),
          backgroundPosition: "left bottom",
        }}
      />
      <span
        className="scene-band scene-drift-far"
        style={band(
          tiles.far,
          [FAR_WIDTH, CLOUDS_FAR.length],
          horizon - CLOUDS_FAR.length + FAR_SUNK,
          CLOUDS_FAR.length,
          FAR_WIDTH,
        )}
      />
      <span
        className="scene-band scene-drift-near"
        style={band(
          tiles.near,
          [NEAR_WIDTH, CLOUDS_NEAR.length],
          horizon - CLOUDS_NEAR.length + NEAR_SUNK,
          CLOUDS_NEAR.length,
          NEAR_WIDTH,
        )}
      />
      <span
        className="scene-band scene-sea"
        style={band(
          tiles.sea,
          [SEA_WIDTH, SEA.length],
          horizon,
          HORIZON + ROCK_DEPTH,
        )}
      />
      <Shape
        spans={stone}
        left={stoneLeft}
        top={ground}
        width={stoneRight - stoneLeft}
        height={ROCK_DEPTH}
      />
      <Shape
        spans={land}
        left={-SHORE_REACH}
        top={ground}
        width={SHORE_REACH}
        height={land.length}
      />
    </>
  );
}
