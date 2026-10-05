/**
 * The hand as a fan: where each card sits about the middle one, how far it
 * leans, and how far it hangs below the crown of the arc. Pure numbers; the
 * stylesheet turns them into a transform.
 */

/** Degrees the outermost cards lean, at most. */
export const FAN_MAX_TILT = 9;
/** Pixels the outermost cards hang below the middle one, at most. */
export const FAN_MAX_DROP = 28;

/** Degrees between neighbours while the fan is small enough to allow it. */
const TILT_STEP = 3;
/** Pixels of drop one place from the middle, before the cap. */
const DROP_STEP = 3;

export interface FanPlace {
  /** Places from the middle card: negative to its left, positive to its right. */
  t: number;
  /** Lean in degrees, clockwise. */
  tilt: number;
  /** Pixels below the crown of the arc. */
  drop: number;
}

function round(value: number): number {
  // `+ 0` turns a negative zero into zero, so it prints as "0".
  return Math.round(value * 100) / 100 + 0;
}

/** One place per card, left to right. */
export function fanLayout(count: number): FanPlace[] {
  const cards = Math.max(0, Math.floor(count));
  const reach = (cards - 1) / 2;
  const tiltStep = reach > 0 ? Math.min(TILT_STEP, FAN_MAX_TILT / reach) : 0;
  const hang = Math.min(FAN_MAX_DROP, DROP_STEP * reach * reach);
  return Array.from({ length: cards }, (_, index) => {
    const t = index - reach;
    const along = reach > 0 ? t / reach : 0;
    return {
      t,
      tilt: round(t * tiltStep),
      drop: round(hang * along * along),
    };
  });
}
