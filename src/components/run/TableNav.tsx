"use client";

import Link from "next/link";
import { useState } from "react";

import { LogoutDialog } from "~/components/LogoutDialog";
import { PixelIcon } from "~/components/PixelIcon";

import { MusicButton } from "./music/MusicButton";
import { tableButtonClass } from "./pieces";
import { SoundButton } from "./sfx/SoundButton";

/**
 * The table's corner: its sound, its music, and the three ways off it. A run
 * has no app shell around it, so these stand in for the rail and the account
 * bar. On a phone a match has no room for more than three pieces beside the
 * gauntlet track, and the sound and music buttons sit in the turn dock
 * instead.
 */
export function TableNav({ className = "" }: { className?: string }) {
  const [confirming, setConfirming] = useState(false);
  const piece = tableButtonClass("secondary", "icon");

  return (
    <nav aria-label="Table" className={`flex gap-1.5 ${className}`}>
      <SoundButton className="corner-sound" />
      <MusicButton className="corner-sound" />
      <Link href="/" aria-label="Home" title="Home" className={piece}>
        <PixelIcon name="home" />
      </Link>
      <Link href="/codex" aria-label="Codex" title="Codex" className={piece}>
        <PixelIcon name="book" />
      </Link>
      <button
        type="button"
        aria-label="Log out"
        title="Log out"
        onClick={() => setConfirming(true)}
        className={piece}
      >
        <PixelIcon name="exit" />
      </button>
      <LogoutDialog open={confirming} onClose={() => setConfirming(false)} />
    </nav>
  );
}
