"use client";

import Link from "next/link";
import { useState } from "react";

import { BrowseTab, MyListingsTab, TradesTab } from "~/components/market";
import { Panel, PanelSkeleton } from "~/components/ui";
import { api } from "~/trpc/react";

const TABS = [
  ["browse", "Browse"],
  ["listings", "My Listings"],
  ["trades", "Trades"],
] as const;

type Tab = (typeof TABS)[number][0];

export function MarketView() {
  const [tab, setTab] = useState<Tab>("browse");
  const me = api.auth.me.useQuery(undefined, { retry: false });
  const incoming = api.market.incomingTrades.useQuery(undefined, {
    retry: false,
  });

  if (me.isLoading) {
    return <PanelSkeleton title="Market" lines={4} />;
  }

  if (!me.data) {
    return (
      <Panel title="Not signed in">
        <p className="text-ink-dim text-lg">
          <Link href="/login" className="text-mint underline">
            Sign in
          </Link>{" "}
          to buy, sell and trade cats.
        </p>
      </Panel>
    );
  }

  const pending = incoming.data?.length ?? 0;

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="Market sections"
        className="grid grid-cols-3 gap-1 sm:inline-flex"
      >
        {TABS.map(([value, label]) => (
          <button
            key={value}
            role="tab"
            type="button"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`text-pixel border-2 px-2 py-2 text-[9px] ${
              tab === value
                ? "border-gold bg-panel-hi text-gold"
                : "border-edge bg-panel text-ink-dim hover:text-ink"
            }`}
          >
            {label}
            {value === "trades" && pending > 0 ? (
              <span className="text-pink ml-1">({pending})</span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === "browse" ? <BrowseTab /> : null}
      {tab === "listings" ? <MyListingsTab /> : null}
      {tab === "trades" ? <TradesTab /> : null}
    </div>
  );
}
