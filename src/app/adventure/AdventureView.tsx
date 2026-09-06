"use client";

import Link from "next/link";
import { useState } from "react";

import {
  ClaimResultsModal,
  ExpeditionPanel,
  MaterialsStrip,
  SquadPicker,
  ZoneCard,
  type ClaimSummaryView,
} from "~/components/adventure";
import { Panel } from "~/components/ui";
import { api } from "~/trpc/react";
import { ExpeditionHistory } from "./ExpeditionHistory";

/**
 * The Adventure page: zone map → squad picker → running expedition.
 * Mobile-first; every panel stacks to a single column at 375px.
 */
export function AdventureView() {
  const me = api.auth.me.useQuery(undefined, { retry: false });
  const current = api.adventure.current.useQuery(undefined, {
    retry: false,
    // Keeps the pending-encounter count honest if the tab sits open for hours.
    refetchInterval: 60_000,
  });
  const zones = api.adventure.zones.useQuery(undefined, { retry: false });
  const idleCats = api.adventure.availableSquad.useQuery(undefined, {
    retry: false,
  });

  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [summary, setSummary] = useState<ClaimSummaryView | null>(null);

  const active = current.data ?? null;
  const selectedZone =
    zones.data?.zones.find((zone) => zone.id === selectedZoneId) ?? null;
  const idlePower = (idleCats.data ?? [])
    .slice(0, 4)
    .reduce((total, creature) => total + creature.power, 0);

  if (!me.isLoading && !me.data) {
    return (
      <Panel title="Adventure">
        <p className="text-ink-dim text-lg">
          <Link href="/login" className="text-mint underline">
            Sign in
          </Link>{" "}
          to send cats on expeditions.
        </p>
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      <Panel
        title="Materials"
        action={
          <span className="text-pixel text-ink-dim text-[8px]">
            {me.data?.wallet.gold.toLocaleString() ?? "—"} G
          </span>
        }
      >
        <MaterialsStrip
          materials={me.data?.wallet.materials}
          highlight={active?.zone.element ?? selectedZone?.element}
        />
      </Panel>

      {current.isLoading ? (
        <Panel title="Adventure">
          <p className="text-ink-dim text-lg">Checking the trail…</p>
        </Panel>
      ) : active ? (
        <ExpeditionPanel current={active} onSettled={setSummary} />
      ) : selectedZone ? (
        <SquadPicker
          zone={selectedZone}
          creatures={idleCats.data ?? []}
          loading={idleCats.isLoading}
          onCancel={() => setSelectedZoneId(null)}
          onStarted={() => setSelectedZoneId(null)}
        />
      ) : (
        <Panel
          title="Choose a zone"
          action={
            <span className="text-pixel text-ink-dim text-[8px]">
              {idleCats.data?.length ?? 0} idle cats
            </span>
          }
        >
          {zones.isLoading ? (
            <p className="text-ink-dim text-lg">Unrolling the map…</p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(zones.data?.zones ?? []).map((zone) => (
                <li key={zone.id}>
                  <ZoneCard
                    zone={zone}
                    power={idlePower}
                    onSelect={setSelectedZoneId}
                  />
                </li>
              ))}
            </ul>
          )}
          <p className="text-ink-dim mt-3 text-base">
            Expeditions resolve one encounter a minute and bank up to 8 hours
            while you are away. Three losses in a row force a retreat.
          </p>
        </Panel>
      )}

      <ExpeditionHistory />

      {summary ? (
        <ClaimResultsModal summary={summary} onClose={() => setSummary(null)} />
      ) : null}
    </div>
  );
}
