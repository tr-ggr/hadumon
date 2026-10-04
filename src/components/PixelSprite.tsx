import { getCat } from "~/server/game/cats";
import { SPRITE_SIZE, catSprite } from "./sprites/cats";
import { spriteColors } from "./sprites/palettes";

export interface PixelSpriteProps {
  catId: string;
  /** Rendered edge length in CSS pixels. Defaults to 64. */
  size?: number;
  className?: string;
  /** Overrides the generated accessible name. */
  label?: string;
  /** Hides the sprite from assistive tech when it only repeats nearby text. */
  decorative?: boolean;
}

export interface Run {
  x: number;
  y: number;
  width: number;
  fill: string;
}

/**
 * Crisp inline-SVG renderer for a cat's pixel sprite, tinted by its element
 * and rarity. Pure and hook-free, so it works in server components.
 */
export function PixelSprite({
  catId,
  size = 64,
  className,
  label,
  decorative = false,
}: PixelSpriteProps) {
  const cat = getCat(catId);
  const colors = spriteColors(cat.element, cat.rarity);
  const runs = buildRuns(catSprite(catId), colors);

  return (
    <svg
      role={decorative ? undefined : "img"}
      aria-label={
        decorative ? undefined : (label ?? `${cat.name} pixel sprite`)
      }
      aria-hidden={decorative ? true : undefined}
      viewBox={`0 0 ${SPRITE_SIZE} ${SPRITE_SIZE}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={className}
      style={{ imageRendering: "pixelated" }}
    >
      {decorative ? null : <title>{label ?? cat.name}</title>}
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

/** Merges horizontal runs of the same colour so the DOM stays small. */
export function buildRuns(
  rows: readonly string[],
  colors: Record<string, string | null>,
): Run[] {
  const runs: Run[] = [];

  rows.forEach((row, y) => {
    let start = 0;
    let current: string | null = null;

    const flush = (endExclusive: number) => {
      if (current !== null && endExclusive > start) {
        runs.push({ x: start, y, width: endExclusive - start, fill: current });
      }
    };

    for (let x = 0; x < row.length; x++) {
      const fill = colors[row[x] ?? "."] ?? null;
      if (fill !== current) {
        flush(x);
        current = fill;
        start = x;
      }
    }
    flush(row.length);
  });

  return runs;
}
