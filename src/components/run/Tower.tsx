import { towerSkin, type TowerSkin } from "~/components/skins/skins";
import { OUTLINE_COLOR } from "~/components/sprites/palettes";
import { stackRuns, type Tower as TowerGrid } from "~/components/sprites/tower";

/** The tower's legend in one skin's stone. */
function colors(skin: TowerSkin) {
  return {
    ".": null,
    o: OUTLINE_COLOR,
    "1": skin.stone,
    "2": skin.light,
    "3": skin.rib,
  };
}

/**
 * The front of the tower as crisp inline SVG, drawn the way the cats are.
 * Its windows are holes: whatever is behind one shows through, cut to its
 * shape. It fills the box it is put in.
 */
export function Tower({
  tower,
  skin = towerSkin(null),
  className = "",
}: {
  tower: TowerGrid;
  /** The stone it is built of; grey if left out. */
  skin?: TowerSkin;
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
      {stackRuns(tower.rows, colors(skin)).map((block) => (
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
