/**
 * A pack being opened, as a value: what came out of it, how far the wrapper
 * has got, and which cards are face up. Pure, so the reveal is whatever this
 * says it is however often the page is rendered or its queries refetched.
 */

import { getCat, RARITY_LABELS, type Rarity } from "~/server/game/cats";
import { copyCap, type Owned } from "~/server/game/collection";
import { getCosmetic, SLOT_LABELS } from "~/server/game/cosmetics";
import type { PackResult } from "~/server/game/packs";

import { coins } from "./copy";

/**
 * How far the wrapper has got. The pack comes forward, waits to be cut, has
 * its top cut off, burns away, goes up in a flash, and then its cards lie on
 * the board face down.
 */
export const PHASES = [
  "raised",
  "ready",
  "cut",
  "burnt",
  "flash",
  "dealt",
] as const;
export type Phase = (typeof PHASES)[number];

/**
 * How a pack is opened: in full the first time of a visit, cut short for
 * every one after, and with reduced motion (`calm`) not at all.
 */
export type Pace = "full" | "short" | "calm";
type Played = Exclude<Pace, "calm">;

/**
 * How long each phase is held before the next, in milliseconds. A phase with
 * no time waits for a press (`ready`, which the short opening leaves out) or
 * is where the wrapper ends (`dealt`).
 */
export const PHASE_MS: Record<Played, Partial<Record<Phase, number>>> = {
  full: { raised: 450, cut: 360, burnt: 900, flash: 520 },
  short: { raised: 220, cut: 220, burnt: 420, flash: 260 },
};

/**
 * How the cards leave the pack once it is open: each `gap` after the one
 * before, and `fly` on its way.
 */
export const DEAL_MS: Record<Played, { gap: number; fly: number }> = {
  full: { gap: 70, fly: 520 },
  short: { gap: 30, fly: 300 },
};

/** How long the shelf's other packs are given to drop away before the cut. */
export const PICK_MS = 340;

/** The gap between two cards when the rest are turned one after another. */
export const TURN_GAP_MS = 170;
/** How much longer the next card waits after one of these. */
const HOLD_MS: Partial<Record<Rarity, number>> = { epic: 250, legendary: 450 };

/** The rarities a card gives away while it is still face down. */
const TOLD: readonly Rarity[] = ["rare", "epic", "legendary"];

export interface Reveal {
  /** The request that opened the pack: one reveal to a press. */
  id: string;
  result: PackResult;
  phase: Phase;
  pace: Pace;
  /**
   * True once the wrapper has played to its end, so the cards fly out of it.
   * A reveal that was skipped, or shown calm, has them simply there.
   */
  flown: boolean;
  /** Whether each thing that came out is face up, in the pack's order. */
  up: readonly boolean[];
  /** The card turned last, for the rail to speak of; `null` before any. */
  last: number | null;
  /** False if that card was turned as one of the rest, all at once. */
  byHand: boolean;
  /** True while the rest are being turned one after another. */
  turningAll: boolean;
  /**
   * What the account held before the pack, if the page knew: a kept cat is
   * then said to be new, or which copy it is. `null` says only that it was
   * kept.
   */
  before: Owned | null;
}

/** How many things came out of a pack. */
export function pulled(result: PackResult): number {
  return result.kind === "cats" ? result.cats.length : result.pieces.length;
}

/**
 * A reveal as it starts. With `calm` (reduced motion) nothing is cut and
 * nothing is turned: everything is face up from the first frame.
 */
export function beginReveal(
  id: string,
  result: PackResult,
  before: Owned | null,
  pace: Pace,
): Reveal {
  const calm = pace === "calm";
  return {
    id,
    result,
    phase: calm ? "dealt" : "raised",
    pace,
    flown: false,
    up: Array.from({ length: pulled(result) }, () => calm),
    last: null,
    byHand: false,
    turningAll: false,
    before,
  };
}

/** How long the phase a reveal is in is held; `null` if nothing times it. */
export function phaseMs(reveal: Reveal): number | null {
  if (reveal.pace === "calm") return null;
  return PHASE_MS[reveal.pace][reveal.phase] ?? null;
}

/**
 * The next phase of the wrapper, as its timer has it. A pack waiting to be
 * cut stays waiting, since the cut is a press (`cutOpen`), and a dealt pack
 * stays dealt. The short opening has no wait: it goes from raised to cut.
 */
export function advance(reveal: Reveal): Reveal {
  if (reveal.phase === "ready") return reveal;
  const next = PHASES[PHASES.indexOf(reveal.phase) + 1];
  if (!next) return reveal;
  if (next === "ready" && reveal.pace !== "full") {
    return { ...reveal, phase: "cut" };
  }
  return next === "dealt"
    ? { ...reveal, phase: next, flown: true }
    : { ...reveal, phase: next };
}

/** The top comes off a pack that was waiting for it, and no other. */
export function cutOpen(reveal: Reveal): Reveal {
  return reveal.phase === "ready" ? { ...reveal, phase: "cut" } : reveal;
}

/** Straight to the cards on the board, for a press that will not wait. */
export function deal(reveal: Reveal): Reveal {
  return reveal.phase === "dealt" ? reveal : { ...reveal, phase: "dealt" };
}

/** How rare the thing at `index` is; `null` if nothing is there. */
export function rarityOf(reveal: Reveal, index: number): Rarity | null {
  if (reveal.result.kind === "cosmetics") {
    const id = reveal.result.pieces[index];
    return id === undefined ? null : getCosmetic(id).rarity;
  }
  const pull = reveal.result.cats[index];
  return pull ? getCat(pull.catId).rarity : null;
}

/**
 * What a card gives away while it is face down: its rarity if it is rare or
 * better, and nothing otherwise.
 */
export function tell(reveal: Reveal, index: number): Rarity | null {
  const rarity = rarityOf(reveal, index);
  return rarity !== null && TOLD.includes(rarity) ? rarity : null;
}

/**
 * How long the next card waits when the rest are turned one after another
 * and the card at `index` was the last: longer after an epic, and longer
 * still after a legendary, which are given the board to themselves.
 */
export function holdAfter(reveal: Reveal, index: number | null): number {
  const rarity = index === null ? null : rarityOf(reveal, index);
  return TURN_GAP_MS + ((rarity && HOLD_MS[rarity]) ?? 0);
}

/** The first thing still face down, or -1 when everything is up. */
export function nextDown(reveal: Reveal): number {
  return reveal.up.indexOf(false);
}

export function allUp(reveal: Reveal): boolean {
  return nextDown(reveal) < 0;
}

/** Turns one card over. Turning a card that is up, or not there, changes nothing. */
export function turn(reveal: Reveal, index: number): Reveal {
  if (reveal.up[index] !== false) return reveal;
  const up = reveal.up.map((is, at) => is || at === index);
  return {
    ...deal(reveal),
    up,
    last: index,
    byHand: !reveal.turningAll,
    turningAll: reveal.turningAll && up.includes(false),
  };
}

/** Starts turning everything that is left, one after another. */
export function turnRest(reveal: Reveal): Reveal {
  return allUp(reveal) ? reveal : { ...deal(reveal), turningAll: true };
}

/**
 * Coins the pack paid back that the reveal has not shown yet: the refund of
 * every cat still face down. The balance on show is the real one less this,
 * so a card says what it paid before the purse does.
 */
export function heldBack(reveal: Reveal): number {
  if (reveal.result.kind !== "cats") return 0;
  return reveal.result.cats.reduce(
    (sum, cat, index) => sum + (reveal.up[index] ? 0 : cat.refund),
    0,
  );
}

/** What a card says under itself once it is up. */
export interface PullNote {
  /** "New", "Copy 2 of 3", "Kept", or "Already have 3". */
  text: string;
  /** Coins it paid back; 0 for one that was kept. */
  refund: number;
  /** True for a cat the account had none of. */
  fresh: boolean;
}

/**
 * What became of the cat at `index` of a cat pack. One the account already
 * held every copy of was paid back; one it kept is new, or a further copy,
 * counted with the copies of it that came earlier in the same pack.
 */
export function pullNote(reveal: Reveal, index: number): PullNote | null {
  if (reveal.result.kind !== "cats") return null;
  const cat = reveal.result.cats[index];
  if (!cat) return null;
  const cap = copyCap(cat.catId);
  if (!cat.kept) {
    return { text: `Already have ${cap}.`, refund: cat.refund, fresh: false };
  }
  if (!reveal.before) return { text: "Kept.", refund: 0, fresh: false };
  const earlier = reveal.result.cats
    .slice(0, index)
    .filter((other) => other.kept && other.catId === cat.catId).length;
  const had = (reveal.before[cat.catId] ?? 0) + earlier;
  if (had <= 0) return { text: "New.", refund: 0, fresh: true };
  return {
    text: cap > 1 ? `Copy ${Math.min(cap, had + 1)} of ${cap}.` : "Kept.",
    refund: 0,
    fresh: false,
  };
}

/** A note as one sentence: "Already have 3. 4 coins back." */
export function noteSentence(note: PullNote): string {
  return note.refund > 0
    ? `${note.text} ${coins(note.refund)} back.`
    : note.text;
}

/** One thing that came out, as it is read aloud when it is turned over. */
export function pullLine(reveal: Reveal, index: number): string {
  if (reveal.result.kind === "cosmetics") {
    const id = reveal.result.pieces[index];
    if (id === undefined) return "";
    const piece = getCosmetic(id);
    return `${piece.name}: ${SLOT_LABELS[piece.slot].toLowerCase()}, ${RARITY_LABELS[piece.rarity].toLowerCase()}.`;
  }
  const pull = reveal.result.cats[index];
  const note = pullNote(reveal, index);
  if (!pull || !note) return "";
  const cat = getCat(pull.catId);
  return `${cat.name}, ${RARITY_LABELS[cat.rarity].toLowerCase()}. ${noteSentence(note)}`;
}

/** The pack as a whole, once everything is up, with the balance it left. */
export function summary(reveal: Reveal, balance: number): string {
  const have = `You have ${coins(balance)}.`;
  if (reveal.result.kind === "cosmetics") {
    const n = reveal.result.pieces.length;
    return `${n} new ${n === 1 ? "piece" : "pieces"}. ${have}`;
  }
  const kept = reveal.result.cats.filter((cat) => cat.kept).length;
  const full = reveal.result.cats.length - kept;
  if (full === 0) return `All ${kept} kept. ${have}`;
  const back = `${full} you had no room for: ${coins(reveal.result.refund)} back.`;
  return kept === 0 ? `${back} ${have}` : `${kept} kept. ${back} ${have}`;
}

/**
 * The rail's sentence while a pack is open. Before the cards are out it says
 * what is happening, and what to do when the pack waits to be cut; after a
 * turn it names the card; and when everything is
 * up it sums the pack. A turn by hand still names its card before the sum,
 * so the last card is heard like the others; the rest turned all at once are
 * not read out one by one.
 */
export function revealSentence(reveal: Reveal, balance: number): string {
  const total = reveal.up.length;
  const down = reveal.up.filter((is) => !is).length;
  const thing = reveal.result.kind === "cats" ? "card" : "piece";
  if (down === 0) {
    const named =
      reveal.last !== null && reveal.byHand
        ? `${pullLine(reveal, reveal.last)} `
        : "";
    return `${named}${summary(reveal, balance)}`;
  }
  if (reveal.turningAll) return "Turning them all over.";
  if (reveal.last === null) {
    switch (reveal.phase) {
      case "raised":
        return "Off the shelf it comes.";
      case "ready":
        return "Cut the top off: drag across it, or press Enter.";
      case "cut":
        return "The top is off.";
      case "burnt":
        return "The wrapper burns away.";
      case "flash":
        return total === 1 ? "Out it comes." : "Out they come.";
      case "dealt":
        return total === 1
          ? `1 ${thing}, face down. Turn it over.`
          : `${total} ${thing}s, face down. Turn them over.`;
    }
  }
  return `${pullLine(reveal, reveal.last)} ${down} to go.`;
}
