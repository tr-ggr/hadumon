import Link from "next/link";

/**
 * Wordmark, one line, one link.
 *
 * Phase 1 placeholder — Agent C owns the finished footer.
 */
export function LandingFooter() {
  return (
    <footer className="border-edge bg-panel border-t-2">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-3 py-6 sm:px-4">
        <span className="text-pixel text-gold text-[10px]">
          Hadu<span className="text-pink">Mon</span>
        </span>
        <span className="text-ink-dim text-lg">Made with pixel cats.</span>
        <Link href="/login" className="text-mint ml-auto text-lg underline">
          Log in
        </Link>
      </div>
    </footer>
  );
}
