"use client";

import { PixelSprite } from "~/components/PixelSprite";
import { Panel } from "~/components/ui";
import type { LadderRowView } from "~/server/api/routers/battle";
import { api } from "~/trpc/react";

export function LadderTab() {
  const ladder = api.battle.ladder.useQuery(undefined, { retry: false });

  return (
    <Panel
      title="Ranked ladder"
      action={
        ladder.data ? (
          <span className="text-pixel text-ink-dim text-[8px]">
            You: #{ladder.data.me.rank}
          </span>
        ) : null
      }
      bodyClassName="p-0"
    >
      {ladder.isLoading ? (
        <p className="text-ink-dim p-3 text-lg">Counting whiskers…</p>
      ) : (
        <>
          <ul>
            {ladder.data?.rows.map((row) => (
              <LadderRow key={row.id} row={row} />
            ))}
          </ul>
          {ladder.data && !ladder.data.inTop ? (
            <div className="border-edge bg-panel sticky bottom-0 border-t-2">
              <LadderRow row={ladder.data.me} />
            </div>
          ) : null}
        </>
      )}
    </Panel>
  );
}

function LadderRow({ row }: { row: LadderRowView }) {
  return (
    <div
      className={`border-edge flex items-center gap-2 border-b px-2 py-1.5 last:border-b-0 ${
        row.isMe ? "bg-panel-hi" : ""
      }`}
      style={
        row.isMe ? { boxShadow: "inset 3px 0 0 var(--color-gold)" } : undefined
      }
    >
      <span
        className={`text-pixel w-8 shrink-0 text-right text-[9px] tabular-nums ${
          row.rank <= 3 ? "text-gold" : "text-ink-dim"
        }`}
      >
        {row.rank}
      </span>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center">
        {row.sprite ? (
          <PixelSprite speciesId={row.sprite} size={32} />
        ) : (
          <span className="text-ink-dim">·</span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-pixel text-ink block truncate text-[9px]">
          {row.displayName}
          {row.isMe ? <span className="text-gold ml-1">(you)</span> : null}
        </span>
        <span className="text-ink-dim text-sm">
          {row.tier}
          {row.isBot ? " · bot" : ""}
        </span>
      </span>
      <span className="text-sky text-lg tabular-nums">{row.rating}</span>
    </div>
  );
}
