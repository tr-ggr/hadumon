"use client";

import { useCallback, useEffect, useState } from "react";

import { prefersCalm } from "~/components/run/fx/dom";
import { playCat, playSound } from "~/components/run/sfx/engine";
import type { SfxName } from "~/components/run/sfx/recipes";
import type { Owned } from "~/server/game/collection";
import type { PackResult } from "~/server/game/packs";

import {
  advance,
  beginReveal,
  deal,
  nextDown,
  PHASE_MS,
  PHASES,
  turn,
  turnRest,
  type Phase,
  type Reveal,
} from "./reveal";

/** What is heard as the wrapper reaches each phase. */
const PHASE_SOUND: Record<Exclude<Phase, "sealed">, SfxName> = {
  torn: "page",
  drawn: "draw",
  dealt: "settle",
};

/** The gap between two cards when the rest are turned one after another. */
const TURN_GAP_MS = 170;

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
  /** Starts the reveal of an opened pack. The same request never starts twice. */
  start: (id: string, result: PackResult, before: Owned | null) => void;
  /** Turns one card over. */
  turnCard: (index: number) => void;
  /** The rail's one press: past the tearing, or the next card over. */
  step: () => void;
  /** Turns everything left, one after another. */
  turnAll: () => void;
  /** Puts the opened pack away and goes back to the shelf. */
  close: () => void;
}

/**
 * The reveal of an opened pack, held as one value (`reveal.ts`) so that it
 * outlives every refetch and re-render of the page around it. The wrapper is
 * torn on a timer and the cards are turned by a press; with reduced motion
 * everything is face up at once and nothing is timed.
 */
export function useReveal(): RevealControls {
  const [reveal, setReveal] = useState<Reveal | null>(null);

  const start = useCallback(
    (id: string, result: PackResult, before: Owned | null) => {
      const calm = prefersCalm();
      if (calm) playSound("settle");
      setReveal((now) =>
        now?.id === id ? now : beginReveal(id, result, before, calm),
      );
    },
    [],
  );

  const id = reveal?.id ?? null;
  const phase = reveal?.phase ?? null;
  // The wrapper: sealed, torn, its cards drawn, and then dealt.
  useEffect(() => {
    if (id === null || phase === null || phase === "dealt") return;
    const next = PHASES[PHASES.indexOf(phase) + 1];
    const timer = setTimeout(() => {
      if (next && next !== "sealed") playSound(PHASE_SOUND[next]);
      setReveal((now) =>
        now?.id === id && now.phase === phase ? advance(now) : now,
      );
    }, PHASE_MS[phase]);
    return () => clearTimeout(timer);
  }, [id, phase]);

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
  // The rest, one after another, each in its own voice.
  useEffect(() => {
    if (!turningAll || down < 0 || phase !== "dealt") return;
    const timer = setTimeout(() => turnCard(down), TURN_GAP_MS);
    return () => clearTimeout(timer);
  }, [turningAll, down, phase, turnCard]);

  const step = useCallback(() => {
    if (!reveal) return;
    if (reveal.phase !== "dealt") {
      playSound("settle");
      setReveal((now) => (now?.id === reveal.id ? deal(now) : now));
      return;
    }
    turnCard(nextDown(reveal));
  }, [reveal, turnCard]);

  const turnAll = useCallback(() => {
    if (!reveal) return;
    setReveal((now) => (now?.id === reveal.id ? turnRest(now) : now));
  }, [reveal]);

  const close = useCallback(() => setReveal(null), []);

  return { reveal, start, turnCard, step, turnAll, close };
}
