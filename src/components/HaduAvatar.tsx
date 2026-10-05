import type { Look } from "~/server/game/cosmetics";

import { buildRuns } from "./PixelSprite";
import { SPRITE_SIZE } from "./sprites/cats";
import { AURA_INSET, haduDrawing, type SpriteLayer } from "./sprites/hadu";

export interface HaduAvatarProps {
  /**
   * What the hadu wears. A slot left out, or filled with an id that has no
   * drawing, wears the free piece, so `{}` is Hadu as he came.
   */
  look?: Partial<Look>;
  /**
   * The edge of the avatar's box in CSS pixels. The cat is drawn at the
   * largest whole multiple of its grid that fits, in the middle of the box:
   * 16px in a box of 24, 32px in one of 32 or 40, 48px in one of 48.
   */
  size?: number;
  /** Names the avatar for assistive tech. Without it the avatar is decoration. */
  label?: string;
  className?: string;
}

/**
 * A player's hadu as crisp inline SVG: Hadu in what the look has him wear,
 * with his aura behind him. Pure and hook-free, so it works in server
 * components.
 *
 * The box is the cat's. An aura is drawn in the air round him and reaches a
 * quarter of the cat's edge past it on every side, so leave it that much
 * room, or clip it with `overflow-hidden` on `className`.
 */
export function HaduAvatar({
  look,
  size = 64,
  label,
  className,
}: HaduAvatarProps) {
  const { cat, aura } = haduDrawing(look);
  // Whole pixels to a cell, and the cat set a whole pixel in from the corner.
  const scale = Math.max(1, Math.floor(size / SPRITE_SIZE));
  const cells = size / scale;
  const inset = Math.max(0, Math.floor((size - SPRITE_SIZE * scale) / 2));
  const origin = -inset / scale;

  return (
    <svg
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      viewBox={`${origin} ${origin} ${cells} ${cells}`}
      width={size}
      height={size}
      overflow="visible"
      shapeRendering="crispEdges"
      className={`shrink-0 ${className ?? ""}`}
      style={{ imageRendering: "pixelated" }}
    >
      {label ? <title>{label}</title> : null}
      {aura ? <Layer layer={aura} offset={-AURA_INSET} /> : null}
      <Layer layer={cat} offset={0} />
    </svg>
  );
}

/** One grid of the drawing, a rect to each run of a colour. */
function Layer({ layer, offset }: { layer: SpriteLayer; offset: number }) {
  return (
    <g>
      {buildRuns(layer.rows, { ...layer.colors }).map((run) => (
        <rect
          key={`${run.y}-${run.x}`}
          x={run.x + offset}
          y={run.y + offset}
          width={run.width}
          height={1}
          fill={run.fill}
        />
      ))}
    </g>
  );
}
