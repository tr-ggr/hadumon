import Link from "next/link";
import type { ReactNode } from "react";

import { TableLink } from "~/components/ui";

/**
 * A shared page opened by someone who is not signed in has no lid and no
 * dock, so it brings a strip of its own: the wordmark and the way in. A
 * signed-in player gets the page as it is.
 */
export function VisitorFrame({
  signedIn,
  children,
}: {
  signedIn: boolean;
  children: ReactNode;
}) {
  if (signedIn) return <>{children}</>;
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="rail flex items-center justify-between gap-3 px-3 py-2 sm:px-5">
        <Link
          href="/"
          aria-label="HaduMon home"
          className="text-pixel text-xl sm:text-2xl"
        >
          Hadu<span className="text-coral">Mon</span>
        </Link>
        <TableLink href="/signup" variant="primary" size="sm">
          Play free
        </TableLink>
      </header>
      <main className="mx-auto w-full max-w-[1180px] min-w-0 flex-1 px-3 pt-5 pb-12 sm:px-5">
        {children}
      </main>
    </div>
  );
}
