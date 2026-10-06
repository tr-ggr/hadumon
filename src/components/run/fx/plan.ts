/**
 * What a frame of a turn looks like, decided before anything is drawn. A cue
 * goes in and a list of intents comes out: pop this slot, float a number
 * from it, punch that token. Pure, so the choreography is tested without a
 * browser; `effects.ts` is the only place an intent meets the page.
 */

import type { Row } from "~/server/game/cats";
import { ESSENCES, type Essence } from "~/server/game/match";

import type { Cue, SlotDelta } from "../playback";

/** A place on the table an effect happens at. */
export type Anchor =
  | { on: "slot"; row: Row; col: number }
  | { on: "food"; kind: Essence }
  /** The player's total. */
  | { on: "score" }
  /** The rival's total. */
  | { on: "rival" }
  /** The total at the foot of a finished match's score sheet. */
  | { on: "tally" }
  /** What the match paid, under that sheet's headline. */
  | { on: "coins" };

/** Lime for what the player gains, coral for what the rival does. */
export type Tone = "lime" | "coral";

interface Timed {
  /** Milliseconds to wait before it starts. */
  delay: number;
}

export type Intent =
  /** A cat firing: it jumps, a little bigger the longer the chain. */
  | ({ kind: "pop"; at: Anchor; strength: number } & Timed)
  /** A power that did nothing: a small shrug, no reward. */
  | ({ kind: "dud"; at: Anchor } & Timed)
  /** A token or tile that changed takes a hit. */
  | ({ kind: "punch"; at: Anchor } & Timed)
  /** A number rising off the table and fading. */
  | ({ kind: "float"; at: Anchor; text: string; tone: Tone } & Timed)
  | ({ kind: "sparks"; at: Anchor; count: number; tone: Tone } & Timed)
  /** The mat and the supply jolt. 1 is a knock, 2 a blow. */
  | ({ kind: "shake"; strength: 1 | 2 } & Timed);

/** The most sparks one frame throws, on a table with room for them. */
export const MAX_SPARKS = 12;
/** The most numbers one frame floats. */
export const MAX_FLOATS = 4;
/** How much a pop grows with each power before it, and where it stops. */
const POP_GROWTH = 0.12;
const POP_STEPS = 8;
/** A piece that travels is acknowledged when it lands, not when it leaves. */
export const LANDING_MS = 300;

export interface PlanOptions {
  /** A phone-sized table: half the sparks. */
  compact?: boolean;
}

const slot = ({ row, col }: { row: Row; col: number }): Anchor => ({
  on: "slot",
  row,
  col,
});

function sameSlot(a: Anchor | null, b: SlotDelta): boolean {
  return a?.on === "slot" && a.row === b.row && a.col === b.col;
}

/** How hard a firing cat pops, by how many powers landed before it. */
export function popStrength(chain: number): number {
  return 1 + Math.min(Math.max(chain, 0), POP_STEPS) * POP_GROWTH;
}

/** A hit big enough to be felt across the table. */
function isBig(cue: Cue): boolean {
  return (
    cue.delta.score >= 4 ||
    (cue.chain >= 5 && cue.chain % 3 === 2 && cue.delta.score > 0)
  );
}

export function planFx(
  cue: Cue,
  { compact = false }: PlanOptions = {},
): Intent[] {
  if (cue.kind === "settle") return [];
  const { delta } = cue;
  const out: Intent[] = [];
  const at = cue.slot ? slot(cue.slot) : null;
  let sparksLeft = compact ? MAX_SPARKS / 2 : MAX_SPARKS;
  let floatsLeft = MAX_FLOATS;

  const punch = (anchor: Anchor, delay = 0) =>
    out.push({ kind: "punch", at: anchor, delay });
  const float = (anchor: Anchor, n: number, tone: Tone, delay = 0) => {
    if (n <= 0 || floatsLeft <= 0) return;
    floatsLeft -= 1;
    out.push({ kind: "float", at: anchor, text: `+${n}`, tone, delay });
  };
  const sparks = (anchor: Anchor, want: number, tone: Tone, delay = 0) => {
    const count = Math.min(sparksLeft, Math.max(0, Math.round(want)));
    if (count <= 0) return;
    sparksLeft -= count;
    out.push({ kind: "sparks", at: anchor, count, tone, delay });
  };
  const food = (delay = 0) => {
    for (const kind of ESSENCES) {
      if (delta.food[kind] > 0) punch({ on: "food", kind }, delay);
    }
  };
  /** The player's total takes a hit whenever it moves. */
  const scored = (delay = 0) => {
    if (delta.score !== 0) punch({ on: "score" }, delay);
  };

  switch (cue.kind) {
    case "power": {
      if (!at) break;
      if (cue.fizzled) {
        out.push({ kind: "dud", at, delay: 0 });
        break;
      }
      out.push({ kind: "pop", at, strength: popStrength(cue.chain), delay: 0 });
      // A power that reaches along its row is seen landing on each cat.
      for (const changed of delta.slots) {
        if (!sameSlot(at, changed)) punch(slot(changed));
      }
      food();
      float(at, delta.score, "lime");
      if (delta.score > 0) {
        sparks(at, 4 + 2 * delta.score + Math.min(cue.chain, 4), "lime");
      }
      scored();
      if (isBig(cue)) out.push({ kind: "shake", strength: 1, delay: 0 });
      break;
    }
    case "aura":
      if (at) out.push({ kind: "pop", at, strength: 1, delay: 0 });
      food();
      break;
    case "play":
      // The card is in the air until it lands.
      if (at) float(at, delta.score, "lime", LANDING_MS);
      scored(LANDING_MS);
      break;
    case "hunt":
      food(LANDING_MS);
      break;
    case "den":
      for (const changed of delta.slots) {
        punch(slot(changed));
        float(slot(changed), changed.yarn, "lime");
      }
      scored();
      break;
    case "resolve":
      if (at && delta.slots.length > 0) punch(at, LANDING_MS);
      if (at) float(at, delta.score, "lime", LANDING_MS);
      food();
      scored(LANDING_MS);
      break;
    case "rival":
      float({ on: "rival" }, delta.rival, "coral");
      if (delta.rival !== 0) punch({ on: "rival" });
      // A rival's Hunt takes dice off the shared feeder.
      if (cue.rivalMove === "hunt") {
        out.push({ kind: "shake", strength: 1, delay: 0 });
      }
      break;
    case "goal":
      float({ on: "score" }, delta.score, "lime");
      float({ on: "rival" }, delta.rival, "coral");
      scored();
      if (delta.rival !== 0) punch({ on: "rival" });
      if (cue.won === true) sparks({ on: "score" }, MAX_SPARKS, "lime");
      if (cue.won === false) out.push({ kind: "shake", strength: 1, delay: 0 });
      break;
    case "over":
      if (cue.won) {
        punch({ on: "score" });
        sparks({ on: "score" }, MAX_SPARKS, "lime");
      } else {
        punch({ on: "rival" });
        out.push({ kind: "shake", strength: 2, delay: 0 });
      }
      break;
    case "prowl":
    case "reroll":
    case "feeder":
      // Cards and dice in flight, and dice tumbling, say it already.
      break;
  }
  return out;
}
