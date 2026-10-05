import { HaduAvatar } from "~/components/HaduAvatar";
import { buildRuns } from "~/components/PixelSprite";
import { skinSwatch } from "~/components/skins/skins";
import {
  getCosmetic,
  HADU_SLOTS,
  type HaduSlot,
  type TableSlot,
} from "~/server/game/cosmetics";

import { SWATCH_GRIDS, SWATCH_SIZE } from "./swatches";

export interface PieceDrawingProps {
  cosmeticId: string;
  /**
   * The edge of the drawing in CSS pixels. A piece of the wardrobe is shown
   * on Hadu at this size, and an aura reaches a quarter of it further out on
   * every side; a skin is a swatch three quarters as wide, inside its border.
   */
  size?: number;
  className?: string;
}

function isHaduSlot(slot: string): slot is HaduSlot {
  return (HADU_SLOTS as readonly string[]).includes(slot);
}

/**
 * Any cosmetic as a picture: something a hadu wears is seen worn, on a plain
 * Hadu, and a skin of the table or the tower is a swatch in its own colours.
 * Decoration: the piece's name is always printed beside it. Pure and
 * hook-free.
 */
export function PieceDrawing({
  cosmeticId,
  size = 64,
  className,
}: PieceDrawingProps) {
  const { slot } = getCosmetic(cosmeticId);
  return isHaduSlot(slot) ? (
    <HaduAvatar
      look={{ [slot]: cosmeticId }}
      size={size}
      className={className}
    />
  ) : (
    <SkinSwatch
      slot={slot}
      cosmeticId={cosmeticId}
      size={(size * 3) / 4}
      className={className}
    />
  );
}

/** A skin as a small picture of what it dresses, in its three flat colours. */
function SkinSwatch({
  slot,
  cosmeticId,
  size,
  className = "",
}: {
  slot: TableSlot;
  cosmeticId: string;
  size: number;
  className?: string;
}) {
  const [main, second, mark] = skinSwatch(cosmeticId);
  const runs = buildRuns(SWATCH_GRIDS[slot], {
    "1": main,
    "2": second,
    "3": mark,
  });
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${SWATCH_SIZE} ${SWATCH_SIZE}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={`border-ink box-content shrink-0 border-2 ${className}`}
      style={{ imageRendering: "pixelated" }}
    >
      {runs.map((run) => (
        <rect
          key={`${run.y}-${run.x}`}
          x={run.x}
          y={run.y}
          width={run.width}
          height={1}
          fill={run.fill}
        />
      ))}
    </svg>
  );
}
