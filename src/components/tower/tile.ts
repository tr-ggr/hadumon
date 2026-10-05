import { stackRuns } from "~/components/sprites/tower";

/**
 * A grid of legend rows as an image a stylesheet can repeat: an SVG of as few
 * rectangles as will draw it, one unit to a pixel, to be sized in the tower's
 * own pixels and drawn with crisp edges.
 *
 * `under` is a colour laid across the whole tile first. A tile that is
 * mostly one colour with others scattered on it is far fewer rectangles
 * drawn that way: pass that colour here and leave it out of `colors`.
 */
export function tileImage(
  rows: readonly string[],
  colors: Record<string, string | null>,
  under: string | null = null,
): string {
  const width = rows[0]?.length ?? 0;
  const base = under
    ? `<rect width='${width}' height='${rows.length}' fill='${under}'/>`
    : "";
  const blocks = stackRuns(rows, colors)
    .map(
      (block) =>
        `<rect x='${block.x}' y='${block.y}' width='${block.width}' height='${block.height}' fill='${block.fill}'/>`,
    )
    .join("");
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${rows.length}' shape-rendering='crispEdges'>${base}${blocks}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
