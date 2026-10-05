import { describe, expect, it } from "vitest";

import {
  ARRIVE,
  keyframes,
  POP,
  PUNCH,
  SHAKE,
  springKick,
  springTo,
} from "./spring";

const PRESETS = { POP, PUNCH, ARRIVE, SHAKE };

describe("springTo", () => {
  it("starts at 0 and ends exactly at 1", () => {
    for (const spring of Object.values(PRESETS)) {
      const { values } = springTo(spring);
      expect(values[0]).toBeCloseTo(0, 6);
      expect(values.at(-1)).toBe(1);
    }
  });

  it("overshoots when loose, and not when critically damped", () => {
    const loose = springTo({ stiffness: 400, damping: 12 }, 60).values;
    expect(Math.max(...loose)).toBeGreaterThan(1.05);
    const stiff = springTo({ stiffness: 400, damping: 40 }, 60).values;
    expect(Math.max(...stiff)).toBeLessThanOrEqual(1);
    const over = springTo({ stiffness: 400, damping: 90 }, 60).values;
    expect(Math.max(...over)).toBeLessThanOrEqual(1);
    for (let i = 1; i < over.length; i++) {
      expect(over[i]).toBeGreaterThanOrEqual(over[i - 1]!);
    }
  });

  it("never runs away", () => {
    for (const spring of Object.values(PRESETS)) {
      for (const value of springTo(spring, 80).values) {
        expect(value).toBeGreaterThan(-0.01);
        expect(value).toBeLessThan(1.6);
      }
    }
  });

  it("has all but settled by the frame before the last", () => {
    for (const spring of Object.values(PRESETS)) {
      const { values } = springTo(spring, 40);
      expect(Math.abs(values.at(-2)! - 1)).toBeLessThan(0.02);
    }
  });
});

describe("springKick", () => {
  it("leaves 0, peaks at 1 and comes back to rest at 0", () => {
    for (const spring of Object.values(PRESETS)) {
      const { values } = springKick(spring, 120);
      expect(values[0]).toBe(0);
      expect(values.at(-1)).toBe(0);
      expect(Math.max(...values)).toBeGreaterThan(0.97);
      expect(Math.max(...values)).toBeLessThanOrEqual(1.0001);
      expect(Math.abs(values.at(-2)!)).toBeLessThan(0.03);
    }
  });

  it("swings back past rest when loose", () => {
    expect(Math.min(...springKick(SHAKE, 120).values)).toBeLessThan(-0.3);
    expect(Math.min(...springKick(POP, 120).values)).toBeLessThan(-0.05);
  });

  it("peaks early: a kick is felt at once", () => {
    for (const spring of [POP, PUNCH]) {
      const { values } = springKick(spring, 120);
      const peak = values.indexOf(Math.max(...values));
      expect(peak / values.length).toBeLessThan(0.3);
    }
  });
});

describe("timing", () => {
  it("keeps every preset short enough to sit inside a step", () => {
    expect(springKick(POP).duration).toBeLessThanOrEqual(420);
    expect(springKick(PUNCH).duration).toBeLessThanOrEqual(260);
    expect(springTo(ARRIVE).duration).toBeLessThanOrEqual(320);
    expect(springKick(SHAKE).duration).toBeLessThanOrEqual(420);
    for (const spring of Object.values(PRESETS)) {
      expect(springKick(spring).duration).toBeGreaterThanOrEqual(120);
    }
  });

  it("caps a spring that would take for ever", () => {
    expect(springTo({ stiffness: 2, damping: 0.1 }).duration).toBe(900);
    expect(springTo({ stiffness: 5, damping: 400 }).duration).toBe(900);
  });

  it("is the same curve every time", () => {
    expect(springKick(POP)).toEqual(springKick(POP));
  });
});

describe("keyframes", () => {
  it("spaces a frame for each value evenly from 0 to 1", () => {
    const curve = springKick(POP, 9);
    const frames = keyframes(curve, (value) => ({
      transform: `scale(${1 + value / 10})`,
    }));
    expect(frames).toHaveLength(9);
    expect(frames[0]).toEqual({ transform: "scale(1)", offset: 0 });
    expect(frames.at(-1)).toEqual({ transform: "scale(1)", offset: 1 });
    expect(frames[4]?.offset).toBe(0.5);
    const offsets = frames.map((frame) => frame.offset);
    expect(offsets).toEqual([...offsets].sort((a, b) => a - b));
  });

  it("asks for at least two samples", () => {
    expect(springTo(POP, 1).values).toHaveLength(2);
  });
});
