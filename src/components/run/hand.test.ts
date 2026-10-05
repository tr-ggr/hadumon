import { describe, expect, it } from "vitest";

import { FAN_MAX_DROP, FAN_MAX_TILT, fanLayout } from "./hand";

describe("fanLayout", () => {
  it("lays out nothing for an empty hand", () => {
    expect(fanLayout(0)).toEqual([]);
    expect(fanLayout(-2)).toEqual([]);
  });

  it("stands a single card upright in the middle", () => {
    expect(fanLayout(1)).toEqual([{ t: 0, tilt: 0, drop: 0 }]);
  });

  it("gives one place per card, a card apart, about the middle", () => {
    for (let count = 1; count <= 14; count++) {
      const fan = fanLayout(count);
      expect(fan, `${count} cards`).toHaveLength(count);
      fan.forEach((place, index) => {
        expect(place.t).toBe(index - (count - 1) / 2);
      });
    }
  });

  it("mirrors the left half in the right half", () => {
    for (let count = 2; count <= 14; count++) {
      const fan = fanLayout(count);
      fan.forEach((place, index) => {
        const twin = fan[count - 1 - index]!;
        expect(place.tilt, `${count} cards`).toBeCloseTo(-twin.tilt);
        expect(place.drop, `${count} cards`).toBeCloseTo(twin.drop);
      });
    }
  });

  it("leans left of the middle anticlockwise and right of it clockwise", () => {
    const fan = fanLayout(5);
    expect(fan.map((place) => Math.sign(place.tilt))).toEqual([
      -1, -1, 0, 1, 1,
    ]);
    expect(Object.is(fan[2]!.tilt, 0)).toBe(true);
  });

  it("hangs the cards lower the further they are from the middle", () => {
    const fan = fanLayout(7);
    expect(fan[3]!.drop).toBe(0);
    for (let index = 4; index < fan.length; index++) {
      expect(fan[index]!.drop).toBeGreaterThan(fan[index - 1]!.drop);
    }
  });

  it("never leans or hangs past its caps, however big the hand", () => {
    for (let count = 1; count <= 30; count++) {
      for (const place of fanLayout(count)) {
        expect(Math.abs(place.tilt)).toBeLessThanOrEqual(FAN_MAX_TILT);
        expect(place.drop).toBeGreaterThanOrEqual(0);
        expect(place.drop).toBeLessThanOrEqual(FAN_MAX_DROP);
      }
    }
    const big = fanLayout(12);
    expect(big[0]!.tilt).toBe(-FAN_MAX_TILT);
    expect(big[11]!.tilt).toBe(FAN_MAX_TILT);
    expect(big[0]!.drop).toBe(FAN_MAX_DROP);
  });

  it("barely fans a small hand", () => {
    const pair = fanLayout(2);
    expect(pair.map((place) => place.tilt)).toEqual([-1.5, 1.5]);
    expect(pair[0]!.drop).toBeLessThan(2);
  });
});
