"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

export interface LoopHandle<T extends HTMLElement = HTMLElement> {
  /** Attach to the element whose visibility gates the loop. */
  ref: RefObject<T | null>;
  /** True while the element is on screen and the tab is in front. */
  active: boolean;
}

/**
 * Whether a looping animation or ticker should be running: the element is on
 * screen and the document is visible. Starts `true` so the server render and
 * the first client render agree, and so a browser without
 * `IntersectionObserver` still plays. Shared by the altar's bob, the type
 * chart's arrow, and the fight-log ticker.
 */
export function useLoopWhileSeen<
  T extends HTMLElement = HTMLElement,
>(): LoopHandle<T> {
  const ref = useRef<T | null>(null);
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const element = ref.current;
    if (!element || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver((entries) =>
      setOnScreen(entries.some((entry) => entry.isIntersecting)),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sync = () => setTabVisible(!document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  return { ref, active: onScreen && tabVisible };
}
