/**
 * Deterministic, seedable RNG (mulberry32 over an FNV-1a string hash).
 * The same seed always produces the same stream, on any machine.
 */

export interface Rng {
  /** Next float in [0, 1). */
  next(): number;
  /** Integer in [min, max], inclusive. */
  int(min: number, max: number): number;
  /** Uniform pick from a non-empty array. */
  pick<T>(items: readonly T[]): T;
  /** True with probability `p` (clamped to [0, 1]). */
  chance(p: number): boolean;
  /** Float in [min, max). */
  float(min: number, max: number): number;
  /** In-place-free shuffled copy. */
  shuffle<T>(items: readonly T[]): T[];
}

export function hashSeed(seed: string | number): number {
  const text = typeof seed === "number" ? `n:${seed}` : seed;
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function createRng(seed: string | number): Rng {
  let state = hashSeed(seed) || 0x9e3779b9;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const rng: Rng = {
    next,
    float: (min, max) => min + next() * (max - min),
    int: (min, max) => {
      const lo = Math.ceil(min);
      const hi = Math.floor(max);
      if (hi < lo) return lo;
      return lo + Math.floor(next() * (hi - lo + 1));
    },
    pick: <T,>(items: readonly T[]): T => {
      if (items.length === 0) throw new Error("rng.pick called with an empty array");
      const item = items[Math.floor(next() * items.length)];
      // `noUncheckedIndexedAccess` — the index is always in range above.
      return item as T;
    },
    chance: (p) => next() < Math.min(1, Math.max(0, p)),
    shuffle: <T,>(items: readonly T[]): T[] => {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        const a = copy[i] as T;
        const b = copy[j] as T;
        copy[i] = b;
        copy[j] = a;
      }
      return copy;
    },
  };

  return rng;
}
