"use client";

import { useState } from "react";

import { CreatureArt } from "~/components/CreatureArt";
import { Button, useToast } from "~/components/ui";
import type {
  BattleDetailView,
  OpponentView,
} from "~/server/api/routers/battle";
import { MAX_TEAM_SIZE } from "~/server/game/rating";
import { api } from "~/trpc/react";
import { TeamPicker, type PickableCreature } from "./TeamPicker";

export interface AttackModalProps {
  opponent: OpponentView;
  roster: readonly PickableCreature[];
  /** Pre-selected squad — the player's own defense team by default. */
  defaultIds: readonly string[];
  onClose: () => void;
  onResult: (battle: BattleDetailView) => void;
}

/** Squad picker shown before an attack is spent. */
export function AttackModal({
  opponent,
  roster,
  defaultIds,
  onClose,
  onResult,
}: AttackModalProps) {
  const utils = api.useUtils();
  const notify = useToast();
  const [picked, setPicked] = useState<string[]>(() =>
    defaultIds.length > 0
      ? [...defaultIds].slice(0, MAX_TEAM_SIZE)
      : roster.slice(0, MAX_TEAM_SIZE).map((c) => c.id),
  );

  const attack = api.battle.attack.useMutation({
    onSuccess: async (battle) => {
      onResult(battle);
      await Promise.all([
        utils.battle.opponents.invalidate(),
        utils.battle.getDefense.invalidate(),
        utils.battle.history.invalidate(),
        utils.battle.ladder.invalidate(),
        utils.auth.me.invalidate(),
      ]);
    },
    onError: (error) => notify(error.message, "error"),
  });

  const power = roster
    .filter((c) => picked.includes(c.id))
    .reduce((total, c) => total + c.power, 0);

  return (
    <div className="bg-navy-deep/85 fixed inset-0 z-30 flex items-end justify-center p-2 sm:items-center">
      <div className="panel max-h-[92dvh] w-full max-w-md overflow-y-auto">
        <header className="border-edge bg-panel-hi flex items-center justify-between gap-2 border-b-2 px-3 py-2">
          <h2 className="text-pixel text-gold text-[10px]">
            Attack {opponent.displayName}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-pixel text-ink-dim hover:text-ink px-1 text-[10px]"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <div className="space-y-3 p-3">
          <section className="panel-flat p-2">
            <p className="text-pixel text-ink-dim mb-1 text-[8px] uppercase">
              Their defense · {opponent.power} PWR
            </p>
            <ul className="flex flex-wrap gap-2">
              {opponent.team.map((member) => (
                <li
                  key={member.id}
                  className="flex w-14 flex-col items-center text-center"
                >
                  <CreatureArt speciesId={member.speciesId} size={40} />
                  <span className="text-ink-dim text-sm leading-none">
                    Lv {member.level}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-2">
            <p className="text-pixel text-ink-dim text-[8px] uppercase">
              Your squad · {picked.length}/{MAX_TEAM_SIZE} ·{" "}
              <span className="text-gold">{power} PWR</span>
            </p>
            <TeamPicker
              creatures={roster}
              selected={picked}
              onChange={setPicked}
              max={MAX_TEAM_SIZE}
            />
          </section>

          <div className="flex gap-2">
            <Button
              onClick={() =>
                attack.mutate({ defenderId: opponent.id, creatureIds: picked })
              }
              disabled={picked.length === 0 || attack.isPending}
              className="flex-1"
            >
              {attack.isPending ? "Fighting…" : "Fight!"}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
