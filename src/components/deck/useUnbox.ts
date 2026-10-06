"use client";

import { useEffect, useState } from "react";

import { useShellMoving } from "~/components/AppShell";
import { playSound } from "~/components/run/sfx/engine";
import type { SfxName } from "~/components/run/sfx/recipes";
import { useReducedMotion } from "~/components/run/useStepper";

import {
  advanceUnbox,
  beginUnbox,
  skipUnbox,
  UNBOX_MS,
  type UnboxPhase,
} from "./unbox";

/** What is heard as the box reaches each phase. */
const PHASE_SOUND: Partial<Record<UnboxPhase, SfxName>> = {
  lifted: "cover",
  drawn: "draw",
  out: "settle",
};

/**
 * The deck box the page opens with, on every arrival. It waits for the
 * camera, since an animation runs whether or not its page is showing; any
 * press or key while it opens goes straight to the page landing. Reduced
 * motion has no box.
 */
export function useUnbox(): UnboxPhase {
  const calm = useReducedMotion();
  const moving = useShellMoving();
  const [phase, setPhase] = useState<UnboxPhase>(() => beginUnbox(false));

  useEffect(() => {
    if (calm) setPhase(beginUnbox(true));
  }, [calm]);

  useEffect(() => {
    if (moving || phase === "done") return;
    const timer = setTimeout(() => {
      const next = advanceUnbox(phase);
      const sound = PHASE_SOUND[next];
      if (sound) playSound(sound);
      setPhase(next);
    }, UNBOX_MS[phase]);
    return () => clearTimeout(timer);
  }, [moving, phase]);

  const opening = phase !== "out" && phase !== "done";
  useEffect(() => {
    if (moving || !opening) return;
    // The press is not swallowed: a link on the lid still goes where it goes.
    const skip = (event: Event) => {
      if (event instanceof KeyboardEvent && isModifier(event.key)) return;
      playSound("settle");
      setPhase(skipUnbox);
    };
    document.addEventListener("pointerdown", skip);
    document.addEventListener("keydown", skip);
    return () => {
      document.removeEventListener("pointerdown", skip);
      document.removeEventListener("keydown", skip);
    };
  }, [moving, opening]);

  return phase;
}

function isModifier(key: string): boolean {
  return key === "Shift" || key === "Control" || key === "Alt" || key === "Meta";
}
