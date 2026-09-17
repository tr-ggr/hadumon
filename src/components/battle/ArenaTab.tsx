"use client";

import Link from "next/link";
import { useState } from "react";

import { CreatureArt } from "~/components/CreatureArt";
import { Button, Panel } from "~/components/ui";
import type {
  BattleDetailView,
  OpponentView,
} from "~/server/api/routers/battle";
import { api } from "~/trpc/react";
import { AttackModal } from "./AttackModal";
import { DefensePanel } from "./DefensePanel";

export interface ArenaTabProps {
  onReplay: (battle: BattleDetailView) => void;
}

export function ArenaTab({ onReplay }: ArenaTabProps) {
  const defense = api.battle.getDefense.useQuery(undefined, { retry: false });
  const roster = api.creatures.list.useQuery(undefined, { retry: false });
  const opponents = api.battle.opponents.useQuery(undefined, { retry: false });

  const [target, setTarget] = useState<OpponentView | null>(null);

  const quota = defense.data?.quota ?? {
    used: 0,
    limit: 10,
    remaining: 10,
    day: "",
  };
  const outOfAttacks = quota.remaining <= 0;

  return (
    <div className="space-y-4">
      <DefensePanel
        team={defense.data?.team ?? []}
        power={defense.data?.power ?? 0}
        quota={quota}
        roster={roster.data ?? []}
        loading={defense.isLoading || roster.isLoading}
      />

      <Panel title="Challengers">
        {opponents.isLoading ? (
          <p className="text-ink-dim text-lg">Scouting the alleys…</p>
        ) : (opponents.data?.length ?? 0) === 0 ? (
          <p className="text-ink-dim text-lg">
            No fresh opponents right now — you&apos;ve fought everyone near your
            rating in the last hour. Check back soon, or{" "}
            <Link href="/summon" className="text-mint underline">
              summon
            </Link>{" "}
            a stronger squad.
          </p>
        ) : (
          <ul className="space-y-2">
            {opponents.data?.map((opponent) => (
              <li key={opponent.id}>
                <OpponentRow
                  opponent={opponent}
                  disabled={outOfAttacks || (roster.data?.length ?? 0) === 0}
                  onAttack={() => setTarget(opponent)}
                />
              </li>
            ))}
          </ul>
        )}
        {outOfAttacks ? (
          <p className="text-pixel text-pink mt-2 text-[8px]">
            Out of attacks — the quota resets at midnight UTC.
          </p>
        ) : null}
      </Panel>

      {target ? (
        <AttackModal
          opponent={target}
          roster={roster.data ?? []}
          defaultIds={defense.data?.team.map((c) => c.id) ?? []}
          onClose={() => setTarget(null)}
          onResult={(battle) => {
            setTarget(null);
            onReplay(battle);
          }}
        />
      ) : null}
    </div>
  );
}

function OpponentRow({
  opponent,
  disabled,
  onAttack,
}: {
  opponent: OpponentView;
  disabled: boolean;
  onAttack: () => void;
}) {
  return (
    <article className="panel-flat flex flex-col gap-2 p-2 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <h3 className="text-pixel text-ink truncate text-[9px]">
            {opponent.displayName}
          </h3>
          {opponent.isBot ? (
            <span className="text-pixel border-edge text-ink-dim border px-1 text-[7px]">
              BOT
            </span>
          ) : null}
          <span className="text-ink-dim text-base">
            <span className="text-sky tabular-nums">{opponent.rating}</span> ·{" "}
            {opponent.tier}
          </span>
        </div>
        <ul className="mt-1 flex items-end gap-1">
          {opponent.team.map((member) => (
            <li key={member.id} className="flex flex-col items-center">
              <CreatureArt speciesId={member.speciesId} size={36} />
              <span className="text-ink-dim text-sm leading-none">
                Lv {member.level}
              </span>
            </li>
          ))}
          <li className="text-ink-dim ml-auto text-base">
            <span className="text-gold tabular-nums">{opponent.power}</span> PWR
          </li>
        </ul>
      </div>
      <Button onClick={onAttack} disabled={disabled} className="sm:self-center">
        Attack
      </Button>
    </article>
  );
}
