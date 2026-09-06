import type { Metadata } from "next";

import { Panel } from "~/components/ui";

export const metadata: Metadata = { title: "Battle — HaduMon" };

export default function BattlePage() {
  return (
    <Panel title="Battle">
      <p className="text-lg text-ink-dim">Coming in Sprint 04 — Async PvP & Ranked Ladder.</p>
    </Panel>
  );
}
