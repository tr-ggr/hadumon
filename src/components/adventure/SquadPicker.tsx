"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button, CreatureCard, Panel, useToast } from "~/components/ui";
import { api, type RouterOutputs } from "~/trpc/react";
import type { ZoneCardZone } from "./ZoneCard";

const MAX_SQUAD = 4;

type IdleCreature = RouterOutputs["adventure"]["availableSquad"][number];

export interface SquadPickerProps {
  zone: ZoneCardZone;
  creatures: IdleCreature[];
  loading?: boolean;
  onCancel: () => void;
  onStarted: () => void;
}

/** Pick up to four idle cats, see the squad's power, and launch the expedition. */
export function SquadPicker({
  zone,
  creatures,
  loading = false,
  onCancel,
  onStarted,
}: SquadPickerProps) {
  const utils = api.useUtils();
  const notify = useToast();
  const [picked, setPicked] = useState<string[]>([]);

  const start = api.adventure.start.useMutation({
    onSuccess: async () => {
      setPicked([]);
      await Promise.all([
        utils.adventure.invalidate(),
        utils.creatures.invalidate(),
        utils.auth.me.invalidate(),
      ]);
      onStarted();
      notify(`Expedition to ${zone.name} started!`);
    },
    onError: (error) => notify(error.message, "error"),
  });

  const power = useMemo(
    () =>
      creatures
        .filter((c) => picked.includes(c.id))
        .reduce((total, c) => total + c.power, 0),
    [creatures, picked],
  );

  const underpowered = power < zone.recommendedPower;

  function toggle(id: string) {
    setPicked((current) =>
      current.includes(id)
        ? current.filter((x) => x !== id)
        : current.length >= MAX_SQUAD
          ? current
          : [...current, id],
    );
  }

  return (
    <Panel
      title={`Squad for ${zone.name}`}
      action={
        <button
          type="button"
          onClick={onCancel}
          className="text-pixel text-ink-dim hover:text-ink text-[8px] underline"
        >
          Change zone
        </button>
      }
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-ink-dim text-base">
          Squad power{" "}
          <span
            className={`tabular-nums ${underpowered ? "text-pink" : "text-mint"}`}
          >
            {power}
          </span>{" "}
          / rec.{" "}
          <span className="text-ink tabular-nums">{zone.recommendedPower}</span>
        </p>
        <p className="text-pixel text-ink-dim text-[8px] uppercase">
          {picked.length}/{MAX_SQUAD} picked
        </p>
      </div>

      {underpowered && picked.length > 0 ? (
        <p className="border-pink bg-panel-hi text-pink mb-3 border-2 p-2 text-base">
          This squad is below {zone.name}&apos;s recommended power — expect
          losses. Three losses in a row force a retreat.
        </p>
      ) : null}

      {loading ? (
        <p className="text-ink-dim text-lg">Rounding up idle cats…</p>
      ) : creatures.length === 0 ? (
        <p className="text-ink-dim text-lg">
          No idle cats.{" "}
          <Link href="/summon" className="text-mint underline">
            Summon some
          </Link>{" "}
          or recall your running expedition.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {creatures.map((creature) => {
            const selected = picked.includes(creature.id);
            return (
              <li key={creature.id}>
                <button
                  type="button"
                  onClick={() => toggle(creature.id)}
                  aria-pressed={selected}
                  disabled={!selected && picked.length >= MAX_SQUAD}
                  className="block w-full text-left disabled:opacity-40"
                >
                  <CreatureCard
                    creature={creature}
                    spriteSize={56}
                    selected={selected}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          disabled={picked.length === 0 || start.isPending}
          onClick={() => start.mutate({ zoneId: zone.id, creatureIds: picked })}
        >
          {start.isPending ? "Setting off…" : "Send expedition"}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Panel>
  );
}
