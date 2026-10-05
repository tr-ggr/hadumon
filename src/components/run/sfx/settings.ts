/**
 * How loud the table is: full, quiet or muted. Kept in `localStorage`, so it
 * holds across reloads and across runs.
 */

import { stored, useStored } from "../stored";

export const VOLUMES = ["full", "quiet", "muted"] as const;
export type Volume = (typeof VOLUMES)[number];

/** The master gain each setting plays at. */
export const VOLUME_GAIN: Record<Volume, number> = {
  full: 0.8,
  quiet: 0.28,
  muted: 0,
};

/** What the control says the sound is now. */
export const VOLUME_LABELS: Record<Volume, string> = {
  full: "Sound on",
  quiet: "Sound quiet",
  muted: "Sound off",
};

/** Whatever is stored, or nothing, as a setting. Sound is on by default. */
export function parseVolume(raw: string | null): Volume {
  return (VOLUMES as readonly string[]).includes(raw ?? "")
    ? (raw as Volume)
    : "full";
}

/** The setting one press of the control moves to: full, quiet, muted, full. */
export function nextVolume(volume: Volume): Volume {
  return VOLUMES[(VOLUMES.indexOf(volume) + 1) % VOLUMES.length] ?? "full";
}

export const volumeSetting = stored<Volume>("hadumon:sound", parseVolume);

export function useVolume(): Volume {
  return useStored(volumeSetting);
}
