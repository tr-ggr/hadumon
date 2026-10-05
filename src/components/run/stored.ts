"use client";

import { useSyncExternalStore } from "react";

/**
 * One small choice kept in `localStorage`: the tier of the last run, how
 * loud the table is. `parse` turns whatever is stored (or nothing) into a
 * value, so a stale or tampered entry reads as the default. Where storage
 * is closed (private mode, a blocked cookie jar) the choice still holds for
 * the visit.
 */
export interface Stored<T extends string> {
  read: () => T;
  write: (value: T) => void;
  subscribe: (onChange: () => void) => () => void;
  /** What the server renders, and the first paint after it. */
  fallback: T;
}

export function stored<T extends string>(
  key: string,
  parse: (raw: string | null) => T,
): Stored<T> {
  const listeners = new Set<() => void>();
  let held: T | null = null;
  const read = (): T => {
    if (held !== null) return held;
    try {
      return parse(window.localStorage.getItem(key));
    } catch {
      return parse(null);
    }
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== key) return;
    // Another tab chose; its word is the newer one.
    held = null;
    for (const listener of listeners) listener();
  };
  return {
    read,
    fallback: parse(null),
    write: (value) => {
      held = value;
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // Kept for the visit only.
      }
      for (const listener of listeners) listener();
    },
    subscribe: (onChange) => {
      if (listeners.size === 0) window.addEventListener("storage", onStorage);
      listeners.add(onChange);
      return () => {
        listeners.delete(onChange);
        if (listeners.size === 0) {
          window.removeEventListener("storage", onStorage);
        }
      };
    },
  };
}

export function useStored<T extends string>(store: Stored<T>): T {
  return useSyncExternalStore(
    store.subscribe,
    store.read,
    () => store.fallback,
  );
}
