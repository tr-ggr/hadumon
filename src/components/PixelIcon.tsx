import { buildRuns } from "./PixelSprite";
import { ICONS, type IconName } from "./sprites/icons";
import { OUTLINE_COLOR, WHITE_COLOR } from "./sprites/palettes";

export interface PixelIconProps {
  name: IconName;
  /** Rendered edge length in CSS pixels; a multiple of the grid stays crisp. */
  size?: number;
  /** The fill colour. Defaults to white. */
  fill?: string;
  /** The outline colour. Defaults to the sprites' outline. */
  ink?: string;
  /** Names the icon for assistive tech; omit when nearby text says it. */
  label?: string;
  className?: string;
}

/**
 * A tabletop icon as crisp inline SVG, drawn the way the cats are. Pure and
 * hook-free, so it works in server components.
 */
export function PixelIcon({
  name,
  size = 16,
  fill = WHITE_COLOR,
  ink = OUTLINE_COLOR,
  label,
  className,
}: PixelIconProps) {
  const rows: readonly string[] = ICONS[name];
  const runs = buildRuns(rows, {
    ".": null,
    o: ink,
    "1": fill,
    w: WHITE_COLOR,
  });

  return (
    <svg
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      viewBox={`0 0 ${rows.length} ${rows.length}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={`shrink-0 ${className ?? ""}`}
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
