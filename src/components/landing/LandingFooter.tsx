import Link from "next/link";

import { SECTION_SHELL } from "./LandingSection";

/**
 * Wordmark, one line, one link. There is nothing else to say and nothing else
 * to link to: no social accounts, no policies that do not exist yet.
 */
export function LandingFooter() {
  return (
    <footer className="border-edge bg-panel border-t-2">
      <div
        className={`${SECTION_SHELL} flex flex-wrap items-center gap-x-4 gap-y-2 py-6`}
      >
        {/* Same lettering as `LandingHeader`, one mark for the whole page. */}
        <span className="text-pixel text-gold shrink-0 text-xs">
          Hadu<span className="text-pink">Mon</span>
        </span>

        <p className="text-ink-dim text-lg">Made with pixel cats.</p>

        <Link
          href="/login"
          className="text-mint focus-visible:outline-gold ml-auto inline-flex min-h-11 items-center text-lg underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Log in
        </Link>
      </div>
    </footer>
  );
}
