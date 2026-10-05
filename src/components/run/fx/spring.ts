/**
 * Springs, worked out ahead of time. A spring's path is sampled into a row
 * of numbers and handed to the Web Animations API as plain keyframes with
 * nothing between them but straight lines, so the motion is the same in
 * every browser and needs no `linear()` easing, which older Safari rejects.
 * Pure, so the curves are tested as numbers.
 */

export interface Spring {
  stiffness: number;
  damping: number;
  mass?: number;
}

export interface Curve {
  /** The spring's position at evenly spaced moments, first to last. */
  values: number[];
  /** How long the curve runs, in milliseconds. */
  duration: number;
}

/** How close to rest counts as arrived, as a share of the distance. */
const REST = 0.004;
const MAX_MS = 900;

interface Motion {
  /** Natural frequency, in radians a second. */
  w0: number;
  /** Damping ratio: under 1 overshoots, 1 and over does not. */
  zeta: number;
}

function motion({ stiffness, damping, mass = 1 }: Spring): Motion {
  return {
    w0: Math.sqrt(stiffness / mass),
    zeta: damping / (2 * Math.sqrt(stiffness * mass)),
  };
}

/** When the spring's swing has died down to `REST`, in seconds. */
function settleSeconds({ w0, zeta }: Motion): number {
  // An overdamped spring creeps in on its slower root.
  const rate =
    zeta < 1 ? zeta * w0 : w0 * (zeta - Math.sqrt(zeta * zeta - 1) || 1);
  return Math.min(MAX_MS / 1000, Math.log(1 / REST) / rate);
}

function sample(
  spring: Spring,
  samples: number,
  at: (t: number, m: Motion) => number,
): Curve {
  const m = motion(spring);
  const seconds = settleSeconds(m);
  const count = Math.max(2, Math.floor(samples));
  const values = Array.from({ length: count }, (_, i) =>
    at((seconds * i) / (count - 1), m),
  );
  return { values, duration: Math.round(seconds * 1000) };
}

/**
 * A spring let go at 0 and pulled to 1: it runs there, overshoots if it is
 * loose enough, and settles. The last value is exactly 1.
 */
export function springTo(spring: Spring, samples = 24): Curve {
  const curve = sample(spring, samples, (t, { w0, zeta }) => {
    if (zeta < 1) {
      const wd = w0 * Math.sqrt(1 - zeta * zeta);
      return (
        1 -
        Math.exp(-zeta * w0 * t) *
          (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t))
      );
    }
    return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  });
  curve.values[curve.values.length - 1] = 1;
  return curve;
}

/**
 * A spring at rest that is struck: it leaves 0, peaks at 1, swings back
 * past 0 if it is loose enough, and comes to rest at 0 again. The first and
 * last values are exactly 0.
 */
export function springKick(spring: Spring, samples = 24): Curve {
  const { w0, zeta } = motion(spring);
  const raw = (t: number): number => {
    if (zeta < 1) {
      const wd = w0 * Math.sqrt(1 - zeta * zeta);
      return Math.exp(-zeta * w0 * t) * Math.sin(wd * t);
    }
    return t * Math.exp(-w0 * t);
  };
  // The peak comes where the velocity first crosses zero.
  const peakAt =
    zeta < 1
      ? Math.atan2(Math.sqrt(1 - zeta * zeta), zeta) /
        (w0 * Math.sqrt(1 - zeta * zeta))
      : 1 / w0;
  const peak = raw(peakAt) || 1;
  const curve = sample(
    { stiffness: w0 * w0, damping: 2 * zeta * w0 },
    samples,
    (t) => raw(t) / peak,
  );
  curve.values[0] = 0;
  curve.values[curve.values.length - 1] = 0;
  return curve;
}

/** A curve as keyframes: one for each value, evenly spaced. */
export function keyframes<T>(
  curve: Curve,
  frame: (value: number) => T,
): (T & { offset: number })[] {
  const last = curve.values.length - 1;
  return curve.values.map((value, i) => ({
    ...frame(value),
    offset: i / last,
  }));
}

/*
 * With a mass of 1 a spring has died down after about 11 / damping seconds,
 * so the damping sets how long a preset runs and the stiffness how loose it
 * is inside that time.
 */
/** A struck piece: quick, with one clear swing back. About 400ms. */
export const POP: Spring = { stiffness: 960, damping: 28 };
/** A token taking a hit: tighter and shorter than a pop. About 240ms. */
export const PUNCH: Spring = { stiffness: 1750, damping: 46 };
/** Something arriving: it runs in, goes a little past, and settles. */
export const ARRIVE: Spring = { stiffness: 950, damping: 37 };
/** A shake: loose, so it swings both ways a few times. About 400ms. */
export const SHAKE: Spring = { stiffness: 4900, damping: 28 };
