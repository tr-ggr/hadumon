/**
 * Whether the run has music under it. Kept in `localStorage` beside the
 * sound setting, which is still the master: a quiet table has quiet music,
 * and a muted one has none whatever this says.
 */

import { stored, useStored } from "../stored";

export const MUSIC_SETTINGS = ["on", "off"] as const;
export type MusicSetting = (typeof MUSIC_SETTINGS)[number];

/** What the control says the music is now. */
export const MUSIC_LABELS: Record<MusicSetting, string> = {
  on: "Music on",
  off: "Music off",
};

/** Whatever is stored, or nothing, as a setting. Music is on by default. */
export function parseMusic(raw: string | null): MusicSetting {
  return raw === "off" ? "off" : "on";
}

/** The setting one press of the control moves to. */
export function nextMusic(setting: MusicSetting): MusicSetting {
  return setting === "on" ? "off" : "on";
}

export const musicSetting = stored<MusicSetting>("hadumon:music", parseMusic);

export function useMusicSetting(): MusicSetting {
  return useStored(musicSetting);
}
