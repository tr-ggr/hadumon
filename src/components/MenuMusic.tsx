"use client";

import { trackFor } from "~/components/run/music/tracks";
import { useMusic } from "~/components/run/music/useMusic";

/**
 * The tune of every page around a run: home, the codex, a page that is not
 * there. Mounted once in the shell, so going from one of them to another
 * does not start it over.
 */
export function MenuMusic() {
  useMusic(trackFor({ on: "menu" }));
  return null;
}
