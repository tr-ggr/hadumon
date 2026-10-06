"use client";

import { useSyncExternalStore } from "react";

/** The width from which the book lies open as a spread. The stylesheet's too. */
const SPREAD = "(min-width: 48rem)";

function subscribeSpread(onChange: () => void): () => void {
  const query = window.matchMedia(SPREAD);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * A window with room for an upright card in each pocket, as a hand holds it:
 * the spread's pockets are tall enough for its picture and four lines of
 * power. The stylesheet has nothing to match.
 */
const ROOMY = "(min-width: 80rem) and (min-height: 53rem)";

function subscribeRoomy(onChange: () => void): () => void {
  const query = window.matchMedia(ROOMY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** True where a pocket holds an upright card. False on the server. */
export function useRoomy(): boolean {
  return useSyncExternalStore(
    subscribeRoomy,
    () => window.matchMedia(ROOMY).matches,
    () => false,
  );
}

/** True where two pages lie open at once. False on the server. */
export function useTwoUp(): boolean {
  return useSyncExternalStore(
    subscribeSpread,
    () => window.matchMedia(SPREAD).matches,
    () => false,
  );
}
