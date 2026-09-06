"use client";

import { useState } from "react";

import {
  ArenaTab,
  BattleReplay,
  HistoryTab,
  LadderTab,
} from "~/components/battle";
import type { BattleDetailView } from "~/server/api/routers/battle";

const TABS = [
  { id: "arena", label: "Arena" },
  { id: "ladder", label: "Ladder" },
  { id: "history", label: "History" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function BattleTabs() {
  const [tab, setTab] = useState<TabId>("arena");
  const [replay, setReplay] = useState<BattleDetailView | null>(null);

  return (
    <div className="space-y-3">
      <nav
        role="tablist"
        aria-label="Battle sections"
        className="grid grid-cols-3 gap-1 sm:inline-grid sm:auto-cols-max sm:grid-flow-col"
      >
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`text-pixel border-2 px-2 py-2 text-[9px] sm:px-4 ${
              tab === item.id
                ? "border-gold bg-panel-hi text-gold"
                : "border-edge bg-panel text-ink-dim hover:text-ink"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === "arena" ? <ArenaTab onReplay={setReplay} /> : null}
      {tab === "ladder" ? <LadderTab /> : null}
      {tab === "history" ? <HistoryTab onReplay={setReplay} /> : null}

      {replay ? (
        <BattleReplay battle={replay} onClose={() => setReplay(null)} />
      ) : null}
    </div>
  );
}
