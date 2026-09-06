import type { Metadata } from "next";

import { Panel } from "~/components/ui";

export const metadata: Metadata = { title: "Adventure — HaduMon" };

export default function AdventurePage() {
  return (
    <Panel title="Adventure">
      <p className="text-lg text-ink-dim">Coming in Sprint 03 — Idle Adventure Mode.</p>
    </Panel>
  );
}
