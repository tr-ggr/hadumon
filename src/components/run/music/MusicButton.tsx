"use client";

import { PixelIcon } from "~/components/PixelIcon";

import { tableButtonClass } from "../pieces";
import { playSound } from "../sfx/engine";
import {
  MUSIC_LABELS,
  musicSetting,
  nextMusic,
  useMusicSetting,
} from "./settings";

/**
 * The run's music, as a corner piece beside the speaker: on or off, kept
 * for the next visit. The speaker is still the master of both.
 */
export function MusicButton({ className = "" }: { className?: string }) {
  const setting = useMusicSetting();
  const next = nextMusic(setting);
  const label = `${MUSIC_LABELS[setting]}. Press for ${MUSIC_LABELS[next].toLowerCase()}.`;

  return (
    <button
      type="button"
      aria-label={label}
      title={MUSIC_LABELS[setting]}
      onClick={() => {
        musicSetting.write(next);
        playSound("click");
      }}
      className={tableButtonClass("secondary", "icon", className)}
    >
      <PixelIcon name={setting === "on" ? "note" : "noteOff"} />
    </button>
  );
}
