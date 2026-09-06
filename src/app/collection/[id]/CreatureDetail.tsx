"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PixelSprite } from "~/components/PixelSprite";
import { RARITY_PALETTES } from "~/components/sprites/palettes";
import {
  Button,
  ElementBadge,
  Panel,
  RarityBadge,
  Stat,
} from "~/components/ui";
import { ARCHETYPE_LABELS } from "~/server/game/species";
import { api } from "~/trpc/react";

const STATUS_COPY: Record<string, { label: string; hint: string }> = {
  idle: { label: "Idle", hint: "Ready for expeditions, listings and trades." },
  expedition: {
    label: "On expedition",
    hint: "Currently away on an adventure.",
  },
  listed: { label: "Listed", hint: "For sale on the marketplace." },
  trading: { label: "In trade", hint: "Reserved by a pending trade offer." },
};

export function CreatureDetail({ id }: { id: string }) {
  const utils = api.useUtils();
  const creature = api.creatures.get.useQuery({ id }, { retry: false });
  const [nickname, setNickname] = useState("");
  const [saved, setSaved] = useState(false);

  const rename = api.creatures.rename.useMutation({
    onSuccess: async () => {
      setSaved(true);
      await utils.creatures.invalidate();
    },
  });

  useEffect(() => {
    if (creature.data) setNickname(creature.data.nickname ?? "");
  }, [creature.data]);

  if (creature.isLoading) {
    return (
      <Panel title="Loading">
        <p className="text-ink-dim text-lg">Fetching cat…</p>
      </Panel>
    );
  }

  if (creature.error ?? !creature.data) {
    return (
      <Panel title="Not found">
        <p className="text-ink-dim text-lg">
          That cat is not in your collection.{" "}
          <Link href="/collection" className="text-mint underline">
            Back to Collection
          </Link>
          .
        </p>
      </Panel>
    );
  }

  const c = creature.data;
  const palette = RARITY_PALETTES[c.species.rarity];
  const xpPct = c.xpToNext > 0 ? Math.min(100, (c.xp / c.xpToNext) * 100) : 100;
  const status = STATUS_COPY[c.status] ?? { label: c.status, hint: "" };

  return (
    <div className="space-y-4">
      <Link
        href="/collection"
        className="text-pixel text-mint text-[9px] underline"
      >
        ← Collection
      </Link>

      <Panel title={c.name}>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div
            className="bg-navy-deep mx-auto flex shrink-0 items-center justify-center border-2 p-2"
            style={{
              borderColor: palette.outline,
              boxShadow: `0 0 10px ${palette.glow}`,
            }}
          >
            <PixelSprite speciesId={c.speciesId} size={160} />
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <ElementBadge element={c.species.element} />
              <RarityBadge rarity={c.species.rarity} />
              <span className="text-pixel border-edge text-ink-dim border px-1 py-0.5 text-[8px] uppercase">
                {ARCHETYPE_LABELS[c.species.archetype]}
              </span>
            </div>

            <p className="text-ink-dim text-lg italic">{c.species.flavor}</p>

            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-pixel text-ink-dim text-[8px] uppercase">
                  Level {c.level}
                </span>
                <span className="text-ink-dim text-base tabular-nums">
                  {c.xp} / {c.xpToNext} XP
                </span>
              </div>
              <div className="border-edge bg-navy-deep mt-1 h-3 w-full border-2">
                <div
                  className="bg-mint h-full"
                  style={{ width: `${xpPct}%` }}
                />
              </div>
            </div>

            <p className="text-ink-dim text-base">
              <span className="text-pixel text-gold text-[8px] uppercase">
                {status.label}
              </span>{" "}
              — {status.hint}
            </p>
          </div>
        </div>
      </Panel>

      <Panel title="Stats">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Power" value={c.power} tone="gold" />
          <Stat label="HP" value={c.stats.hp} tone="mint" />
          <Stat label="Attack" value={c.stats.attack} tone="pink" />
          <Stat label="Defense" value={c.stats.defense} />
          <Stat label="Speed" value={c.stats.speed} />
          <Stat label="Affinity" value={c.stats.affinity} tone="sky" />
        </div>
        <p className="text-ink-dim mt-3 text-base">
          Upgrade tier {c.upgradeTier} · obtained via {c.obtainedVia}
        </p>
      </Panel>

      <Panel title="Nickname">
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setSaved(false);
            rename.mutate({ id: c.id, nickname: nickname.trim() || null });
          }}
        >
          <label className="min-w-0 flex-1 space-y-1">
            <span className="text-pixel text-ink-dim text-[8px] uppercase">
              Call it something else
            </span>
            <input
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setSaved(false);
              }}
              maxLength={20}
              placeholder={c.species.name}
              className="border-edge bg-navy-deep text-ink focus:border-gold w-full border-2 px-2 py-1.5 text-lg outline-none"
            />
          </label>
          <Button type="submit" disabled={rename.isPending}>
            {rename.isPending ? "…" : "Save"}
          </Button>
        </form>
        {saved ? <p className="text-mint mt-2 text-base">Saved.</p> : null}
        {rename.error ? (
          <p className="text-pink mt-2 text-base">{rename.error.message}</p>
        ) : null}
      </Panel>
    </div>
  );
}
