"use client";

import { useEffect } from "react";

import { PixelIcon } from "~/components/PixelIcon";
import type { IconName } from "~/components/sprites/icons";

import { tableButtonClass } from "../pieces";
import { armSound, playSound } from "./engine";
import {
  nextVolume,
  useVolume,
  VOLUME_LABELS,
  volumeSetting,
  type Volume,
} from "./settings";

const ICONS: Record<Volume, IconName> = {
  full: "sound",
  quiet: "quiet",
  muted: "mute",
};

/**
 * The table's sound, as one corner piece: each press moves it on from full
 * to quiet to off and back. The setting is kept for the next visit.
 */
export function SoundButton({ className = "" }: { className?: string }) {
  const volume = useVolume();
  // Sound can only start from a press or a key; this listens for the first.
  useEffect(armSound, []);
  const next = nextVolume(volume);
  const label = `${VOLUME_LABELS[volume]}. Press for ${VOLUME_LABELS[next].toLowerCase()}.`;

  return (
    <button
      type="button"
      aria-label={label}
      title={VOLUME_LABELS[volume]}
      onClick={() => {
        volumeSetting.write(next);
        // Heard at the new level, so the press says what it did.
        playSound("click");
      }}
      className={tableButtonClass("secondary", "icon", className)}
    >
      <PixelIcon name={ICONS[volume]} />
    </button>
  );
}
