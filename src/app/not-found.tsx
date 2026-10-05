import Link from "next/link";
import type { Metadata } from "next";

import { PixelSprite } from "~/components/PixelSprite";
import { Board } from "~/components/ui";

export const metadata: Metadata = { title: "Lost — HaduMon" };

export default function NotFound() {
  return (
    <div className="page-wrap">
      <Board title="404 — nothing here">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <PixelSprite catId="flameclaw" size={96} label="A lost cat" />
          <p className="text-ink text-lg font-bold">This alley is empty.</p>
          <p className="text-ink-soft text-lg">
            The page you were looking for does not exist.
          </p>
          <Link
            href="/"
            className="text-cobalt inline-flex min-h-12 items-center text-lg font-bold underline underline-offset-4"
          >
            Back home
          </Link>
        </div>
      </Board>
    </div>
  );
}
