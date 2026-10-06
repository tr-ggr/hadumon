/**
 * The deck box the Deck page opens with, as a value. It stands shut in the
 * middle of the room, its lid comes off, a card comes up out of its mouth,
 * and then it makes way as the page's boards land. Pure: `useUnbox` holds
 * the timers.
 */

export const UNBOX_PHASES = ["shut", "lifted", "drawn", "out", "done"] as const;
export type UnboxPhase = (typeof UNBOX_PHASES)[number];

/**
 * How long each phase is held before the next, in milliseconds: the box
 * stands as a pack stands sealed, torn and drawn, and goes in one landing.
 */
export const UNBOX_MS: Record<Exclude<UnboxPhase, "done">, number> = {
  shut: 460,
  lifted: 340,
  drawn: 380,
  out: 240,
};

/** The box as the page arrives. With `calm` (reduced motion) there is none. */
export function beginUnbox(calm: boolean): UnboxPhase {
  return calm ? "done" : "shut";
}

/** The next phase; a box that is done stays done. */
export function advanceUnbox(phase: UnboxPhase): UnboxPhase {
  return UNBOX_PHASES[UNBOX_PHASES.indexOf(phase) + 1] ?? phase;
}

/** A press while the box is opening goes straight to the page landing. */
export function skipUnbox(phase: UnboxPhase): UnboxPhase {
  return phase === "out" || phase === "done" ? phase : "out";
}
