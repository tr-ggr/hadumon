"use client";

import { useMemo, useState } from "react";

import { PixelSprite } from "~/components/PixelSprite";
import type { LatestFight } from "~/server/game/idle";

export interface FightLogProps {
  fight: LatestFight;
  /** Start expanded (the claim modal starts collapsed). */
  defaultOpen?: boolean;
  className?: string;
}

/** Collapsible "watch last fight" turn-by-turn replay of the final encounter. */
export function FightLog({
  fight,
  defaultOpen = false,
  className = "",
}: FightLogProps) {
  const [open, setOpen] = useState(defaultOpen);

  const names = useMemo(() => {
    const map = new Map<string, { name: string; ally: boolean }>();
    for (const cat of fight.squad)
      map.set(cat.id, { name: cat.name, ally: true });
    for (const foe of fight.enemies) {
      map.set(foe.id, { name: `${foe.name} Lv${foe.level}`, ally: false });
    }
    return map;
  }, [fight]);

  return (
    <div className={`panel-flat ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="text-pixel bg-panel-hi text-gold flex w-full items-center justify-between gap-2 px-2 py-2 text-[9px]"
      >
        <span>{open ? "▾" : "▸"} Watch last fight</span>
        <span className={fight.won ? "text-mint" : "text-pink"}>
          {fight.won ? "WIN" : "LOSS"} · {fight.rounds}R
        </span>
      </button>

      {open ? (
        <div className="space-y-2 p-2">
          <div className="flex flex-wrap items-center gap-2">
            <Side label="Your squad" members={fight.squad} tone="text-mint" />
            <span className="text-pixel text-ink-dim text-[8px]">VS</span>
            <Side label="Wild cats" members={fight.enemies} tone="text-pink" />
          </div>

          <ol className="border-edge bg-navy-deep max-h-64 space-y-0.5 overflow-y-auto border-2 p-2">
            {fight.events.map((event, i) => {
              const actor = names.get(event.actorId);
              const target = names.get(event.targetId);
              return (
                <li key={i} className="text-ink-dim text-base leading-tight">
                  <span className="text-pixel text-edge mr-1 text-[7px]">
                    R{event.round}
                  </span>
                  <span className={actor?.ally ? "text-mint" : "text-pink"}>
                    {actor?.name ?? event.actorId}
                  </span>{" "}
                  hits{" "}
                  <span className={target?.ally ? "text-mint" : "text-pink"}>
                    {target?.name ?? event.targetId}
                  </span>{" "}
                  for{" "}
                  <span className="text-gold tabular-nums">{event.damage}</span>
                  {event.crit ? (
                    <span className="text-gold"> CRIT!</span>
                  ) : null}
                  {event.ko ? <span className="text-pink"> — KO</span> : null}
                </li>
              );
            })}
            {fight.events.length === 0 ? (
              <li className="text-ink-dim text-base">No blows landed.</li>
            ) : null}
          </ol>
        </div>
      ) : null}
    </div>
  );
}

function Side({
  label,
  members,
  tone,
}: {
  label: string;
  members: { id: string; name: string; speciesId: string }[];
  tone: string;
}) {
  return (
    <div className="min-w-0">
      <p className={`text-pixel text-[7px] uppercase ${tone}`}>{label}</p>
      <ul className="flex flex-wrap items-center gap-1">
        {members.map((member) => (
          <li key={member.id} title={member.name}>
            <PixelSprite speciesId={member.speciesId} size={28} />
          </li>
        ))}
      </ul>
    </div>
  );
}
