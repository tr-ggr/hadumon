"use client";

import { useEffect, useState } from "react";

import { playMusic } from "./player";
import type { TrackId } from "./tracks";

/**
 * Whoever asked for a tune last. There is one player and more than one page
 * that sets it, and a page that is leaving must not hush the one arriving.
 */
let owner: symbol | null = null;

/**
 * Plays a tune for as long as the caller is on the page, crossfading when
 * `track` changes. `null` is silence. Leaving the page fades the music out,
 * unless another caller has taken it over by then.
 */
export function useMusic(track: TrackId | null): void {
  const [me] = useState(() => Symbol("music"));
  useEffect(() => {
    owner = me;
    playMusic(track);
  }, [me, track]);
  useEffect(
    () => () => {
      if (owner !== me) return;
      owner = null;
      playMusic(null);
    },
    [me],
  );
}
