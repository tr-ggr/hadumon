"use client";

import { useEffect } from "react";

import { armSound, playSound, soundRequests } from "./engine";
import { SFX_NAMES, type SfxName } from "./recipes";

/** What counts as a press: a button, a link, or anything dressed as one. */
const PRESSABLE = "button, a[href], [role=button]";

/** Where a click is the browser's own business, and makes no sound here. */
const QUIET = "input, textarea, select, label, summary";

/** The enabled control `target` is on or inside, or `null` on anything else. */
export function pressable(target: EventTarget | null): Element | null {
  if (!(target instanceof Element)) return null;
  const control = target.closest(PRESSABLE);
  if (!control || control.matches(":disabled, [aria-disabled='true']")) {
    return null;
  }
  return control;
}

/** The control `target` is on that is held and takes no click, if it is on one. */
function held(target: EventTarget | null): Element | null {
  if (!(target instanceof Element)) return null;
  const control = target.closest(PRESSABLE);
  return control?.matches(":disabled") ? control : null;
}

/**
 * The sound of pressing `target`. A press on nothing, or on a control that
 * is held, is a knock on the cloth. A field, and the click that ends a
 * selection of text, stay silent.
 */
function pressSound(target: EventTarget | null): SfxName | null {
  if (!(target instanceof Element)) return null;
  const control = pressable(target);
  if (!control) {
    if (target.closest(QUIET)) return null;
    return window.getSelection()?.isCollapsed === false ? null : "tap";
  }
  const named = control.closest<HTMLElement>("[data-sfx]")?.dataset.sfx;
  return SFX_NAMES.find((name) => name === named) ?? "click";
}

/**
 * Gives every press on the table a sound, and every press on nothing a
 * duller one. It is the fallback: a press whose own handler has already made
 * a sound is left alone, so nothing is heard twice. It listens on `window`,
 * so a dialog's buttons are covered wherever they are drawn, and a click
 * that is swallowed on the way down (the one that skips a climb or a turn
 * landing) never reaches it. It also starts the sound, for the screens that
 * have no speaker button on them.
 *
 * A held button is sent no click at all, only the pointer going down and
 * coming up, so its knock is heard from those: when the press comes up on
 * the control it went down on, that control is still held, and nothing else
 * has sounded in between (the press that skips a turn frees the table).
 */
export function ClickSound() {
  useEffect(() => {
    armSound();
    let before = soundRequests();
    let pressed: Element | null = null;
    /** When a held control was last knocked on, in case a click follows it. */
    let knocked = -Infinity;
    const onPointerDown = (event: PointerEvent) => {
      before = soundRequests();
      pressed = held(event.target);
    };
    const onPointerUp = (event: PointerEvent) => {
      const control = pressed;
      pressed = null;
      if (!control || control !== held(event.target)) return;
      if (soundRequests() !== before) return;
      knocked = event.timeStamp;
      playSound("tap");
    };
    const onDown = () => {
      before = soundRequests();
    };
    const onUp = (event: MouseEvent) => {
      if (event.timeStamp - knocked < 100 || soundRequests() !== before) return;
      const name = pressSound(event.target);
      if (name) playSound(name);
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("click", onDown, true);
    window.addEventListener("click", onUp);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("click", onDown, true);
      window.removeEventListener("click", onUp);
    };
  }, []);

  return null;
}
