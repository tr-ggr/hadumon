"use client";

import { Panel } from "~/components/ui";
import { api } from "~/trpc/react";

const STATUS_TONE: Record<string, string> = {
  completed: "text-mint",
  retreated: "text-pink",
};

/** The last 20 finished expeditions, newest first. */
export function ExpeditionHistory() {
  const history = api.adventure.history.useQuery({ limit: 20 }, { retry: false });
  const rows = history.data ?? [];

  return (
    <Panel title="Expedition log">
      {history.isLoading ? (
        <p className="text-lg text-ink-dim">Reading the journal…</p>
      ) : rows.length === 0 ? (
        <p className="text-lg text-ink-dim">
          No finished expeditions yet. Recall a run to file it here.
        </p>
      ) : (
        <ul className="space-y-1">
          {rows.map((row) => (
            <li
              key={row.id}
              className="panel-flat flex flex-wrap items-baseline gap-x-2 gap-y-1 p-2"
            >
              <span className="text-pixel min-w-0 flex-1 truncate text-[8px] text-ink">
                {row.zoneName}
              </span>
              <span
                className={`text-pixel text-[7px] uppercase ${STATUS_TONE[row.status] ?? "text-ink-dim"}`}
              >
                {row.status}
              </span>
              <span className="text-base tabular-nums text-ink-dim">
                <span className="text-mint">{row.winCount}W</span>
                <span className="mx-1 text-edge">/</span>
                <span className="text-pink">{row.lossCount}L</span>
              </span>
              <span className="text-base tabular-nums text-gold">{row.totalGold} G</span>
              <span className="text-base tabular-nums text-ink-dim">
                {formatDuration(row.durationSec)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  if (mins > 0) return `${mins}m`;
  return `${total}s`;
}
