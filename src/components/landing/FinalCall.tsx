import Link from "next/link";

import { Button } from "~/components/ui";
import { RosterStats } from "./RosterStats";

/**
 * The closing panel: the offer, the two actions, and the roster counts again.
 *
 * Phase 1 placeholder — Agent C owns the finished close.
 */
export function FinalCall() {
  return (
    <section className="mx-auto w-full max-w-6xl px-3 py-10 sm:px-4">
      <div className="panel space-y-4 p-4">
        <h2 className="text-pixel text-gold text-xs leading-relaxed sm:text-base">
          Your first 1000 gems are waiting.
        </h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/signup">
            <Button variant="primary">Create account</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary">Log in</Button>
          </Link>
        </div>
        <RosterStats />
      </div>
    </section>
  );
}
