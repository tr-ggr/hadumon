"use client";

import Link from "next/link";
import { useState } from "react";

import { LogoutDialog } from "~/components/LogoutDialog";
import { PixelIcon } from "~/components/PixelIcon";

import { tableButtonClass } from "./pieces";

/**
 * The ways off the table, as three small pieces in its corner. A run has no
 * app shell around it, so these stand in for the rail and the account bar.
 */
export function TableNav({ className = "" }: { className?: string }) {
  const [confirming, setConfirming] = useState(false);
  const piece = tableButtonClass("secondary", "icon");

  return (
    <nav aria-label="Leave the table" className={`flex gap-1.5 ${className}`}>
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
