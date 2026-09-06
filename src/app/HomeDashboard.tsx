"use client";

import Link from "next/link";

import { PixelSprite } from "~/components/PixelSprite";
import { Panel, Stat } from "~/components/ui";
import { ELEMENTS, MATERIAL_LABELS } from "~/server/game/elements";
import { api } from "~/trpc/react";

/**
 * Placeholder Home. Sprint 06 replaces this with the full dashboard
 * (active expedition, latest pulls, ladder rank, pending trades).
 */
export function HomeDashboard() {
  const me = api.auth.me.useQuery(undefined, { retry: false });
  const creatures = api.creatures.list.useQuery(undefined, { retry: false });

  if (me.isLoading) {
    return (
      <Panel title="Loading">
        <p className="text-lg text-ink-dim">Waking the cats…</p>
      </Panel>
    );
  }

  if (!me.data) {
    return (
      <Panel title="Not signed in">
        <p className="text-lg text-ink-dim">
          <Link href="/login" className="text-mint underline">
            Sign in
          </Link>{" "}
          to start collecting.
        </p>
      </Panel>
    );
  }

  const { user, wallet, creatureCount } = me.data;
  const roster = creatures.data ?? [];
  const strongest = [...roster].sort((a, b) => b.power - a.power).slice(0, 4);

  return (
    <div className="space-y-4">
      <Panel title={`Welcome back, ${user.displayName}`}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Gold" value={wallet.gold.toLocaleString()} tone="gold" />
          <Stat label="Gems" value={wallet.gems.toLocaleString()} tone="mint" />
          <Stat label="Cats" value={creatureCount} tone="pink" />
          <Stat label="Rating" value={user.rating} tone="sky" />
        </div>
      </Panel>

      <Panel title="Materials">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {ELEMENTS.map((element) => (
            <Stat
              key={element}
              label={MATERIAL_LABELS[element]}
              value={wallet.materials[element]}
            />
          ))}
        </div>
      </Panel>

      <Panel
        title="Top squad"
        action={
          <Link href="/collection" className="text-pixel text-[8px] text-mint underline">
            Collection
          </Link>
        }
      >
        {strongest.length === 0 ? (
          <p className="text-lg text-ink-dim">
            No cats yet.{" "}
            <Link href="/summon" className="text-mint underline">
              Summon your first cat!
            </Link>
          </p>
        ) : (
          <ul className="flex flex-wrap gap-3">
            {strongest.map((creature) => (
              <li key={creature.id} className="flex flex-col items-center">
                <PixelSprite speciesId={creature.speciesId} size={64} />
                <span className="text-pixel text-[8px] text-ink">{creature.name}</span>
                <span className="text-base text-ink-dim">
                  Lv {creature.level} · {creature.power} PWR
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="What's next">
        <ul className="space-y-1 text-lg text-ink-dim">
          <li>
            <Link href="/summon" className="text-mint underline">
              Summon
            </Link>{" "}
            — spend gems on banners (Sprint 02).
          </li>
          <li>
            <Link href="/adventure" className="text-mint underline">
              Adventure
            </Link>{" "}
            — idle expeditions for gold, XP and materials (Sprint 03).
          </li>
          <li>
            <Link href="/battle" className="text-mint underline">
              Battle
            </Link>{" "}
            — async ranked ladder (Sprint 04).
          </li>
          <li>
            <Link href="/market" className="text-mint underline">
              Market
            </Link>{" "}
            — buy, sell and trade cats (Sprint 05).
          </li>
        </ul>
      </Panel>
    </div>
  );
}
