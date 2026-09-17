import Link from "next/link";

import { SECTION_SHELL } from "./LandingSection";

/**
 * Wordmark, one line, one link. There is nothing else to say and nothing else
 * to link to: no social accounts, no policies that do not exist yet.
 */
export function LandingFooter() {
  return (
    <footer className="bg-ink text-white">
      <div
        className={`${SECTION_SHELL} flex flex-wrap items-center gap-x-4 gap-y-2 py-6`}
      >
        {/* Same lettering as `LandingHeader`, one mark for the whole page. */}
        <span className="text-pixel shrink-0 text-xl text-white">
          Hadu<span className="text-pink">Mon</span>
        </span>

        <p className="text-sm text-white/60">Small cats. Long afternoons.</p>

        <Link
          href="/login"
          className="ml-auto inline-flex min-h-11 items-center text-sm font-bold text-white underline decoration-white/40 underline-offset-4"
        >
          Log in
        </Link>
      </div>
    </footer>
  );
}
