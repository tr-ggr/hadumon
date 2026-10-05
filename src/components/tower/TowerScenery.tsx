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
import type { Tower } from "~/components/sprites/tower";

import { sceneHeight } from "./camera";
import { tileImage } from "./tile";
import { px } from "./TowerStage";

const SKY_IMAGE = tileImage(SKY, SCENERY_COLORS);
const SEA_IMAGE = tileImage(SEA, SCENERY_COLORS);
const FAR_IMAGE = tileImage(CLOUDS_FAR, SCENERY_COLORS);
const NEAR_IMAGE = tileImage(CLOUDS_NEAR, SCENERY_COLORS);
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
 * Where the tower stands, behind everything on it: an evening sky that
 * dithers from ember down to pale gold, two banks of cloud drifting along the
 * horizon, the sea, the rock under the tower's foot and the dark near shore.
 * It is part of the picture, so the camera magnifies it with the tower and a
 * climb goes up past the clouds.
 */
export function TowerScenery({ tower }: { tower: Tower }) {
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
            SKY_IMAGE,
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
          FAR_IMAGE,
          [FAR_WIDTH, CLOUDS_FAR.length],
          horizon - CLOUDS_FAR.length + FAR_SUNK,
          CLOUDS_FAR.length,
          FAR_WIDTH,
        )}
      />
      <span
        className="scene-band scene-drift-near"
        style={band(
          NEAR_IMAGE,
          [NEAR_WIDTH, CLOUDS_NEAR.length],
          horizon - CLOUDS_NEAR.length + NEAR_SUNK,
          CLOUDS_NEAR.length,
          NEAR_WIDTH,
        )}
      />
      <span
        className="scene-band scene-sea"
        style={band(
          SEA_IMAGE,
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
