import Link from "next/link";
import type { Metadata } from "next";

import { CreatureArt } from "~/components/CreatureArt";
import { Panel } from "~/components/ui";

export const metadata: Metadata = { title: "Lost — HaduMon" };

export default function NotFound() {
  return (
    <Panel title="404 — nothing here">
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CreatureArt speciesId="duskmew" size={96} label="A lost cat" />
        <p className="text-pixel text-gold text-xs">This alley is empty.</p>
        <p className="text-ink-dim text-lg">
          The page, cat or listing you were looking for does not exist any more.
        </p>
        <Link href="/" className="text-mint text-lg underline">
          Back to the dashboard
        </Link>
      </div>
    </Panel>
  );
}
