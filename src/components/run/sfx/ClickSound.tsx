"use client";

import { useEffect } from "react";

import { armSound, playSound, soundRequests } from "./engine";
import { SFX_NAMES, type SfxName } from "./recipes";

/** What counts as a press: a button, a link, or anything dressed as one. */
const PRESSABLE = "button, a[href], [role=button]";

/** The sound of pressing `target`, or `null` when it is nothing to press. */
function pressSound(target: EventTarget | null): SfxName | null {
  if (!(target instanceof Element)) return null;
  const control = target.closest(PRESSABLE);
  if (!control || control.matches(":disabled, [aria-disabled='true']")) {
    return null;
  }
  const named = control.closest<HTMLElement>("[data-sfx]")?.dataset.sfx;
  return SFX_NAMES.find((name) => name === named) ?? "click";
}

/**
 * Gives every press on the table a sound. It is the fallback: a press whose
 * own handler has already made one is left alone, so nothing is heard twice.
 * It listens on `window`, so a dialog's buttons are covered wherever they are
 * drawn, and a click that is swallowed on the way down (the one that skips a
 * climb or a turn landing) never reaches it. It also starts the sound, for
 * the screens that have no speaker button on them.
 */
export function ClickSound() {
  useEffect(() => {
    armSound();
    let before = soundRequests();
    const onDown = () => {
      before = soundRequests();
    };
    const onUp = (event: MouseEvent) => {
      if (soundRequests() !== before) return;
      const name = pressSound(event.target);
      if (name) playSound(name);
    };
    window.addEventListener("click", onDown, true);
    window.addEventListener("click", onUp);
    return () => {
      window.removeEventListener("click", onDown, true);
      window.removeEventListener("click", onUp);
    };
  }, []);

  return null;
}
