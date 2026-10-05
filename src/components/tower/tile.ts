import { stackRuns } from "~/components/sprites/tower";

/**
 * A grid of legend rows as an image a stylesheet can repeat: an SVG of as few
 * rectangles as will draw it, one unit to a pixel, to be sized in the tower's
 * own pixels and drawn with crisp edges.
 */
export function tileImage(
  rows: readonly string[],
  colors: Record<string, string | null>,
): string {
  const blocks = stackRuns(rows, colors)
    .map(
      (block) =>
        `<rect x='${block.x}' y='${block.y}' width='${block.width}' height='${block.height}' fill='${block.fill}'/>`,
    )
    .join("");
  const width = rows[0]?.length ?? 0;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${rows.length}' shape-rendering='crispEdges'>${blocks}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
