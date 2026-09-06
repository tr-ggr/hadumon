import { getSpecies } from "~/server/game/species";
import { ARCHETYPE_SPRITES, SPRITE_SIZE } from "./sprites/archetypes";
import { spriteColors } from "./sprites/palettes";

export interface PixelSpriteProps {
  speciesId: string;
  /** Rendered edge length in CSS pixels. Defaults to 64. */
  size?: number;
  className?: string;
  /** Overrides the generated `<title>` used for accessibility. */
  label?: string;
}

interface Run {
  x: number;
  y: number;
  width: number;
  fill: string;
}

/**
 * Crisp inline-SVG renderer for a creature's archetype sprite, tinted by its
 * element and rarity. Pure and hook-free, so it works in server components.
 */
export function PixelSprite({ speciesId, size = 64, className, label }: PixelSpriteProps) {
  const species = getSpecies(speciesId);
  const rows = ARCHETYPE_SPRITES[species.archetype];
  const colors = spriteColors(species.element, species.rarity);
  const runs = buildRuns(rows, colors);

  return (
    <svg
      role="img"
      aria-label={label ?? `${species.name} pixel sprite`}
      viewBox={`0 0 ${SPRITE_SIZE} ${SPRITE_SIZE}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={className}
      style={{ imageRendering: "pixelated" }}
    >
      <title>{label ?? species.name}</title>
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
function buildRuns(rows: readonly string[], colors: Record<string, string | null>): Run[] {
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
