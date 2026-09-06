"use client";

import { PixelSprite } from "~/components/PixelSprite";
import { RARITY_PALETTES } from "~/components/sprites/palettes";
import { Panel } from "~/components/ui";
import { RARITY_LABELS } from "~/server/game/species";
import type { RouterOutputs } from "~/trpc/react";

export type HistoryEntryView = RouterOutputs["gacha"]["history"][number];

export interface RecentPullsProps {
  entries: HistoryEntryView[];
  loading?: boolean;
  /** How many of the newest entries to show. */
  limit?: number;
}

/** Compact log of the trainer's last summons. */
export function RecentPulls({
  entries,
  loading = false,
  limit = 20,
}: RecentPullsProps) {
  const rows = entries.slice(0, limit);

  return (
    <Panel
      title="Recent pulls"
      action={
        <span className="text-pixel text-ink-dim text-[8px]">
          {rows.length}
        </span>
      }
    >
      {loading ? (
        <p className="text-ink-dim text-lg">Reading the summon ledger…</p>
      ) : rows.length === 0 ? (
        <p className="text-ink-dim text-lg">
          No summons yet. Pull your first cat!
        </p>
      ) : (
        <ul className="divide-edge divide-y-2">
          {rows.map((entry) => (
            <li key={entry.id} className="flex items-center gap-2 py-1.5">
              <PixelSprite speciesId={entry.speciesId} size={28} />
              <span className="text-ink min-w-0 flex-1 truncate text-lg leading-none">
                {entry.species.name}
              </span>
              <span
                className="text-pixel shrink-0 text-[7px] uppercase"
                style={{ color: RARITY_PALETTES[entry.rarity].outline }}
              >
                {RARITY_LABELS[entry.rarity]}
              </span>
              {entry.wasPity ? (
                <span className="text-pixel text-gold shrink-0 text-[7px] uppercase">
                  Pity
                </span>
              ) : null}
              <time
                className="text-ink-dim shrink-0 text-base leading-none tabular-nums"
                dateTime={entry.createdAt.toISOString()}
                suppressHydrationWarning
              >
                {timeAgo(entry.createdAt)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function timeAgo(date: Date): string {
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
