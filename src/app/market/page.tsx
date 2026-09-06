import type { Metadata } from "next";

import { Panel } from "~/components/ui";

export const metadata: Metadata = { title: "Market — HaduMon" };

export default function MarketPage() {
  return (
    <Panel title="Market">
      <p className="text-lg text-ink-dim">Coming in Sprint 05 — Trading Post & Marketplace.</p>
    </Panel>
  );
}
