"use client";

import { useState } from "react";

import { Button, Panel } from "~/components/ui";
import type {
  BattleDetailView,
  BattleSummaryView,
} from "~/server/api/routers/battle";
import { api } from "~/trpc/react";

export interface HistoryTabProps {
  onReplay: (battle: BattleDetailView) => void;
}

export function HistoryTab({ onReplay }: HistoryTabProps) {
  const history = api.battle.history.useQuery({ limit: 20 }, { retry: false });
  const utils = api.useUtils();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const replay = async (id: string) => {
    setLoadingId(id);
    try {
      onReplay(await utils.battle.battle.fetch({ id }));
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Panel title="Battle log">
      {history.isLoading ? (
        <p className="text-ink-dim text-lg">
          Digging through the scratch marks…
        </p>
      ) : (history.data?.length ?? 0) === 0 ? (
        <p className="text-ink-dim text-lg">
          No battles yet. Pick a challenger in the Arena.
        </p>
      ) : (
        <ul className="space-y-2">
          {history.data?.map((battle) => (
            <li key={battle.id}>
              <HistoryRow
                battle={battle}
                loading={loadingId === battle.id}
                onReplay={() => void replay(battle.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function HistoryRow({
  battle,
  loading,
  onReplay,
}: {
  battle: BattleSummaryView;
  loading: boolean;
  onReplay: () => void;
}) {
  return (
    <article className="panel-flat flex items-center gap-2 p-2">
      <span
        className={`text-pixel flex h-7 w-7 shrink-0 items-center justify-center border-2 text-[10px] ${
          battle.won ? "border-mint text-mint" : "border-pink text-pink"
        }`}
      >
        {battle.won ? "W" : "L"}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-pixel text-ink truncate text-[9px]">
          {battle.role === "attacker" ? "⚔ " : "🛡 "}
          {battle.opponent.displayName}
        </p>
        <p className="text-ink-dim text-sm">
          <span className={battle.ratingDelta >= 0 ? "text-mint" : "text-pink"}>
            {battle.ratingDelta >= 0 ? "+" : ""}
            {battle.ratingDelta}
          </span>{" "}
          → {battle.ratingAfter}
          {battle.reward.gold > 0 ? (
            <span className="text-gold"> · +{battle.reward.gold}g</span>
          ) : null}
          {battle.reward.gems > 0 ? (
            <span className="text-mint"> · +{battle.reward.gems}◆</span>
          ) : null}
          <span className="text-ink-dim"> · {timeAgo(battle.createdAt)}</span>
        </p>
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={onReplay}
        disabled={loading}
      >
        {loading ? "…" : "Replay"}
      </Button>
    </article>
  );
}

function timeAgo(date: Date): string {
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
