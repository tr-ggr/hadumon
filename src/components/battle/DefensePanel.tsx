"use client";

import { useEffect, useState } from "react";

import { PixelSprite } from "~/components/PixelSprite";
import { Button, Panel, useToast } from "~/components/ui";
import type { QuotaView, TeamMemberView } from "~/server/api/routers/battle";
import { MAX_TEAM_SIZE } from "~/server/game/rating";
import { api } from "~/trpc/react";
import { TeamPicker, type PickableCreature } from "./TeamPicker";

export interface DefensePanelProps {
  team: readonly TeamMemberView[];
  power: number;
  quota: QuotaView;
  roster: readonly PickableCreature[];
  loading?: boolean;
}

/** Your defense team: what other trainers fight while you're away. */
export function DefensePanel({
  team,
  power,
  quota,
  roster,
  loading = false,
}: DefensePanelProps) {
  const utils = api.useUtils();
  const notify = useToast();
  const [editing, setEditing] = useState(false);
  const [picked, setPicked] = useState<string[]>(() => team.map((c) => c.id));

  useEffect(() => {
    if (!editing) setPicked(team.map((c) => c.id));
  }, [editing, team]);

  const save = api.battle.setDefense.useMutation({
    onSuccess: async () => {
      setEditing(false);
      await Promise.all([
        utils.battle.getDefense.invalidate(),
        utils.battle.ladder.invalidate(),
        utils.auth.me.invalidate(),
      ]);
      notify("Defense team saved.");
    },
    onError: (error) => notify(error.message, "error"),
  });

  return (
    <Panel
      title="Your defense"
      action={
        <span className="text-pixel text-ink-dim text-[8px]">
          <span className={quota.remaining === 0 ? "text-pink" : "text-mint"}>
            {quota.used}/{quota.limit}
          </span>{" "}
          attacks today
        </span>
      }
    >
      <div className="space-y-3">
        {loading ? (
          <p className="text-ink-dim text-lg">Rousing the guards…</p>
        ) : team.length === 0 ? (
          <p className="text-ink-dim text-lg">
            No defense team yet — pick up to {MAX_TEAM_SIZE} cats so other
            trainers can challenge you.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {team.map((member) => (
              <span
                key={member.id}
                className="flex w-16 flex-col items-center text-center"
              >
                <PixelSprite speciesId={member.speciesId} size={48} />
                <span className="text-pixel text-ink w-full truncate text-[7px]">
                  {member.name}
                </span>
                <span className="text-ink-dim text-sm leading-none">
                  Lv {member.level}
                </span>
              </span>
            ))}
            <span className="text-ink-dim ml-auto text-lg">
              <span className="text-gold tabular-nums">{power}</span> PWR
            </span>
          </div>
        )}

        {editing ? (
          <div className="space-y-2">
            <p className="text-pixel text-ink-dim text-[8px]">
              {picked.length}/{MAX_TEAM_SIZE} picked — tap to add or remove
            </p>
            <TeamPicker
              creatures={roster}
              selected={picked}
              onChange={setPicked}
              max={MAX_TEAM_SIZE}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => save.mutate({ creatureIds: picked })}
                disabled={picked.length === 0 || save.isPending}
                className="flex-1"
              >
                {save.isPending ? "Saving…" : "Save team"}
              </Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditing(true)}
          >
            {team.length === 0 ? "Set defense team" : "Edit defense"}
          </Button>
        )}
      </div>
    </Panel>
  );
}
