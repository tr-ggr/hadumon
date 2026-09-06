import { describe, expect, it } from "vitest";

import { createRng } from "./rng";

describe("createRng", () => {
  it("is deterministic for the same seed", () => {
    const a = createRng("hadumon");
    const b = createRng("hadumon");
    const left = Array.from({ length: 32 }, () => a.next());
    const right = Array.from({ length: 32 }, () => b.next());
    expect(left).toEqual(right);
  });

  it("differs between seeds", () => {
    const first = Array.from({ length: 8 }, ((rng) => () => rng.next())(createRng("seed-a")));
    const second = Array.from({ length: 8 }, ((rng) => () => rng.next())(createRng("seed-b")));
    expect(first).not.toEqual(second);
  });

  it("produces values in [0, 1)", () => {
    const rng = createRng(42);
    for (let i = 0; i < 500; i++) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("int() stays inclusive and in range", () => {
    const rng = createRng("ints");
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const value = rng.int(3, 7);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(3);
      expect(value).toBeLessThanOrEqual(7);
      seen.add(value);
    }
    expect(seen.size).toBe(5);
  });

  it("pick() throws on an empty array and stays in the array otherwise", () => {
    const rng = createRng("pick");
    expect(() => rng.pick([])).toThrow();
    const items = ["a", "b", "c"] as const;
    for (let i = 0; i < 100; i++) {
      expect(items).toContain(rng.pick(items));
    }
  });

  it("chance() is roughly calibrated and clamps", () => {
    const rng = createRng("chance");
    let hits = 0;
    for (let i = 0; i < 10000; i++) if (rng.chance(0.25)) hits += 1;
    expect(hits / 10000).toBeGreaterThan(0.22);
    expect(hits / 10000).toBeLessThan(0.28);
    expect(createRng("x").chance(0)).toBe(false);
    expect(createRng("x").chance(1)).toBe(true);
  });

  it("shuffle() keeps every element and is deterministic", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const a = createRng("shuffle").shuffle(items);
    const b = createRng("shuffle").shuffle(items);
    expect(a).toEqual(b);
    expect([...a].sort((x, y) => x - y)).toEqual(items);
  });
});
