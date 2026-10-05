"use client";

import { useEffect } from "react";

import { playMusic } from "./player";
import type { TrackId } from "./tracks";

/**
 * Plays a tune for as long as the caller is on the page, crossfading when
 * `track` changes. `null` is silence. Leaving the page fades the music out.
 */
export function useMusic(track: TrackId | null): void {
  useEffect(() => {
    playMusic(track);
  }, [track]);
  useEffect(() => () => playMusic(null), []);
}
