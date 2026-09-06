"use client";

import { useEffect, useRef, useState } from "react";

export interface RevealHandle<T extends HTMLElement = HTMLElement> {
  /** Attach to the element that should trigger the reveal when it scrolls in. */
  ref: React.RefObject<T | null>;
  /** True once the element has been seen. Never goes back to false. */
  revealed: boolean;
}

/**
 * Reveals a section once, the first time it comes within 10% of the viewport
 * bottom.
 *
 * The hidden state must be applied from `revealed`, never in the static markup,
 * so a page whose JavaScript never runs still shows everything. Under
 * `prefers-reduced-motion` the reveal fires immediately — the content is the
 * point, the movement is not.
 */
export function useReveal<
  T extends HTMLElement = HTMLElement,
>(): RevealHandle<T> {
  const ref = useRef<T | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (revealed) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const element = ref.current;
    if (reducedMotion || !element || !("IntersectionObserver" in window)) {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [revealed]);

  return { ref, revealed };
}
