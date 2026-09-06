import type { Metadata } from "next";

import { Panel } from "~/components/ui";

export const metadata: Metadata = { title: "Summon — HaduMon" };

export default function SummonPage() {
  return (
    <Panel title="Summon">
      <p className="text-lg text-ink-dim">Coming in Sprint 02 — Gacha Summoning Hub.</p>
    </Panel>
  );
}
