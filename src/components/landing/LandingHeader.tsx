import Link from "next/link";

import { Button } from "~/components/ui";

/**
 * Sticky landing header: wordmark left, the two account actions right.
 *
 * Phase 1 placeholder — Agent A owns the finished header.
 */
export function LandingHeader() {
  return (
    <header className="border-edge bg-panel sticky top-0 z-20 border-b-2">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-3 py-2 sm:px-4">
        <Link href="/" className="text-pixel text-gold shrink-0 text-xs">
          Hadu<span className="text-pink">Mon</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/login">
            <Button variant="secondary" size="sm">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button variant="primary" size="sm">
              Create account
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
