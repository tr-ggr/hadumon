"use client";

import { useCallback, useEffect, useState } from "react";

import { prefersCalm } from "~/components/run/fx/dom";
import { finishAll } from "~/components/run/fx/registry";
import { playCat, playSound } from "~/components/run/sfx/engine";
import type { SfxName } from "~/components/run/sfx/recipes";
import type { Owned } from "~/server/game/collection";
import type { PackResult } from "~/server/game/packs";

import {
  advance,
  beginReveal,
  cutOpen,
  deal,
  DEAL_MS,
  holdAfter,
  nextDown,
  phaseMs,
  pulled,
  turn,
  turnRest,
  type Phase,
  type Reveal,
} from "./reveal";

/** What is heard as the wrapper reaches a phase; the others are silent. */
const PHASE_SOUND: Partial<Record<Phase, SfxName>> = {
  cut: "page",
  burnt: "flare",
  flash: "burst",
};

/** How far into its flight a card is heard to land. */
const LANDS_AT = 0.72;

/** The cards fly out one after another, and each is heard as it lands. */
function hearLanding(pace: "full" | "short", count: number): void {
  const { gap, fly } = DEAL_MS[pace];
  for (let i = 0; i < count; i++) {
    playSound("draw", 0, (i * gap + fly * LANDS_AT) / 1000);
  }
}

/** A card is heard as it turns: a cat in its own voice, a piece as a pick. */
function hear(result: PackResult, index: number): void {
  if (result.kind === "cosmetics") {
    playSound("pick");
    return;
  }
  const cat = result.cats[index];
  if (!cat) return;
  playCat(cat.catId);
  // Coins coming back are heard after the cat, not over it.
  if (cat.refund > 0) playSound("tick", 0, 0.18);
}

export interface RevealControls {
  /** The pack being opened, or `null` on the shelf. */
  reveal: Reveal | null;
  /**
   * Starts the reveal of an opened pack: in full, or cut short for a pack
   * that is not the first of the visit. The same request never starts twice.
   */
  start: (
    id: string,
    result: PackResult,
    before: Owned | null,
    pace: "full" | "short",
  ) => void;
  /** Turns one card over. */
  turnCard: (index: number) => void;
  /** The rail's one press: the cut while the pack waits, then the next card. */
  step: () => void;
  /** Past the wrapper, straight to the cards. */
  skip: () => void;
  /** Turns everything left, one after another. */
  turnAll: () => void;
  /** Puts the opened pack away and goes back to the shelf. */
  close: () => void;
}

/**
 * The reveal of an opened pack, held as one value (`reveal.ts`) so that it
 * outlives every refetch and re-render of the page around it. The wrapper is
 * opened on a timer, but for the cut, which waits for a press; the cards are
 * turned by a press. With reduced motion everything is face up at once and
 * nothing is timed.
 */
export function useReveal(): RevealControls {
  const [reveal, setReveal] = useState<Reveal | null>(null);

  const start = useCallback(
    (
      id: string,
      result: PackResult,
      before: Owned | null,
      pace: "full" | "short",
    ) => {
      const calm = prefersCalm();
      if (calm) playSound("settle");
      setReveal((now) =>
        now?.id === id
          ? now
          : beginReveal(id, result, before, calm ? "calm" : pace),
      );
    },
    [],
  );

  const id = reveal?.id ?? null;
  const phase = reveal?.phase ?? null;
  const held = reveal ? phaseMs(reveal) : null;
  // The wrapper: each phase for as long as it is held, and then the next.
  // A pack waiting to be cut is held by nothing, and waits.
  useEffect(() => {
    if (id === null || phase === null || held === null) return;
    const timer = setTimeout(() => {
      setReveal((now) =>
        now?.id === id && now.phase === phase ? advance(now) : now,
      );
    }, held);
    return () => clearTimeout(timer);
  }, [id, phase, held]);

  const pace = reveal?.pace ?? null;
  const flown = reveal?.flown ?? false;
  const count = reveal ? pulled(reveal.result) : 0;
  // What is heard as the wrapper comes to each phase, however it got there.
  useEffect(() => {
    if (phase === null || pace === null || pace === "calm") return;
    const sound = PHASE_SOUND[phase];
    if (sound) playSound(sound);
    if (phase === "dealt" && flown) hearLanding(pace, count);
  }, [id, phase, pace, flown, count]);

  const turnCard = useCallback(
    (index: number) => {
      if (reveal?.phase !== "dealt" || reveal.up[index] !== false) return;
      hear(reveal.result, index);
      setReveal((now) => (now?.id === reveal.id ? turn(now, index) : now));
    },
    [reveal],
  );

  const turningAll = reveal?.turningAll ?? false;
  const down = reveal ? nextDown(reveal) : -1;
  const gap = reveal ? holdAfter(reveal, reveal.last) : 0;
  // The rest, one after another, each in its own voice.
  useEffect(() => {
    if (!turningAll || down < 0 || phase !== "dealt") return;
    const timer = setTimeout(() => turnCard(down), gap);
    return () => clearTimeout(timer);
  }, [turningAll, down, phase, gap, turnCard]);

  const step = useCallback(() => {
    if (!reveal) return;
    if (reveal.phase === "ready") {
      setReveal((now) => (now?.id === reveal.id ? cutOpen(now) : now));
      return;
    }
    // While the wrapper plays, the one way past it is Skip.
    if (reveal.phase === "dealt") turnCard(nextDown(reveal));
  }, [reveal, turnCard]);

  const skip = useCallback(() => {
    if (!reveal || reveal.phase === "dealt") return;
    // Whatever is in flight lands at once, and the cards are simply there.
    finishAll();
    playSound("settle");
    setReveal((now) => (now?.id === reveal.id ? deal(now) : now));
  }, [reveal]);

  const turnAll = useCallback(() => {
    if (!reveal) return;
    setReveal((now) => (now?.id === reveal.id ? turnRest(now) : now));
  }, [reveal]);

  const close = useCallback(() => setReveal(null), []);

  return { reveal, start, turnCard, step, skip, turnAll, close };
}
