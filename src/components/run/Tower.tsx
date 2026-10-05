import { OUTLINE_COLOR } from "~/components/sprites/palettes";
import {
  STONE,
  STONE_LIGHT,
  STONE_RIB,
  stackRuns,
  type Tower as TowerGrid,
} from "~/components/sprites/tower";

const COLORS = {
  ".": null,
  o: OUTLINE_COLOR,
  "1": STONE,
  "2": STONE_LIGHT,
  "3": STONE_RIB,
};

/**
 * The front of the tower as crisp inline SVG, drawn the way the cats are.
 * Its windows are holes: whatever is behind one shows through, cut to its
 * shape. It fills the box it is put in.
 */
export function Tower({
  tower,
  className = "",
}: {
  tower: TowerGrid;
  className?: string;
}) {
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${tower.width} ${tower.height}`}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      className={className}
      style={{ imageRendering: "pixelated" }}
    >
      {stackRuns(tower.rows, COLORS).map((block) => (
        <rect
          key={`${block.x}-${block.y}`}
          x={block.x}
          y={block.y}
          width={block.width}
          height={block.height}
          fill={block.fill}
        />
      ))}
    </svg>
  );
}
