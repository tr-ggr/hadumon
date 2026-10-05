import { describe, expect, it } from "vitest";

import { popTransform, type Box } from "./pop";

/** Where a point of the panel ends up under a transform about its corner. */
function moved(transform: string, panel: Box, point: { x: number; y: number }) {
  const match =
    /^translate\((-?[\d.]+)px, (-?[\d.]+)px\) scale\((-?[\d.]+)\)$/.exec(
      transform,
    );
  if (!match) throw new Error(`not a pop transform: ${transform}`);
  const [x, y, scale] = match.slice(1).map(Number) as [number, number, number];
  return {
    x: panel.left + x + (point.x - panel.left) * scale,
    y: panel.top + y + (point.y - panel.top) * scale,
    scale,
  };
}

describe("popTransform", () => {
  const panel: Box = { left: 416, top: 160, width: 448 };
  const anchor: Box = { left: 436, top: 226, width: 408 };
  const pocket: Box = { left: 96, top: 420, width: 204 };

  it("puts the anchor's corner on the pocket's, at the pocket's width", () => {
    const at = moved(popTransform(pocket, panel, anchor), panel, {
      x: anchor.left,
      y: anchor.top,
    });
    expect(at.x).toBeCloseTo(pocket.left, 1);
    expect(at.y).toBeCloseTo(pocket.top, 1);
    expect(at.scale).toBeCloseTo(0.5, 4);
    expect(anchor.width * at.scale).toBeCloseTo(pocket.width, 1);
  });

  it("keeps the rest of the panel around the anchor, scaled the same", () => {
    const at = moved(popTransform(pocket, panel, anchor), panel, {
      x: panel.left,
      y: panel.top,
    });
    // The panel's corner is 20px left of the anchor and 66px above it.
    expect(at.x).toBeCloseTo(pocket.left - 10, 1);
    expect(at.y).toBeCloseTo(pocket.top - 33, 1);
  });

  it("moves nothing when the anchor is already on the pocket", () => {
    expect(popTransform(anchor, panel, anchor)).toBe(
      "translate(0px, 0px) scale(1)",
    );
  });

  it("uses the whole panel when it is its own anchor", () => {
    const at = moved(popTransform(pocket, panel, panel), panel, {
      x: panel.left + panel.width,
      y: panel.top,
    });
    expect(at.x).toBeCloseTo(pocket.left + pocket.width, 1);
    expect(at.y).toBeCloseTo(pocket.top, 1);
  });

  it("does not divide by an anchor with no width", () => {
    expect(popTransform(pocket, panel, { ...anchor, width: 0 })).toContain(
      "scale(1)",
    );
  });
});
