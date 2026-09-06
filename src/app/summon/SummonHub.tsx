"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import {
  BannerCard,
  GachaAnimations,
  PullReveal,
  RecentPulls,
  type PullSummary,
} from "~/components/gacha";
import { Panel, PanelSkeleton, Stat, useToast } from "~/components/ui";
import type { BannerId } from "~/server/game/gacha";
import { api } from "~/trpc/react";

export function SummonHub() {
  const utils = api.useUtils();
  const notify = useToast();
  const me = api.auth.me.useQuery(undefined, { retry: false });
  const banners = api.gacha.banners.useQuery(undefined, { retry: false });
  const history = api.gacha.history.useQuery({ limit: 20 }, { retry: false });

  const [summary, setSummary] = useState<PullSummary | null>(null);
  const [lastPull, setLastPull] = useState<{
    bannerId: BannerId;
    count: 1 | 10;
  }>({
    bannerId: "standard",
    count: 1,
  });

  const pull = api.gacha.pull.useMutation({
    onSuccess: async (result) => {
      setSummary(result);
      // Refresh the wallet chips in the top bar, plus the roster and ledger.
      await Promise.all([
        utils.auth.me.invalidate(),
        utils.gacha.banners.invalidate(),
        utils.gacha.history.invalidate(),
        utils.creatures.invalidate(),
      ]);
    },
    onError: (err) => {
      setSummary(null);
      notify(err.message, "error");
    },
  });

  const summon = useCallback(
    (bannerId: BannerId, count: 1 | 10) => {
      if (pull.isPending) return;
      setLastPull({ bannerId, count });
      setSummary(null);
      pull.mutate({ bannerId, count });
    },
    [pull],
  );

  if (me.isLoading || banners.isLoading) {
    return <PanelSkeleton title="Summon" lines={4} />;
  }

  if (!me.data) {
    return (
      <Panel title="Not signed in">
        <p className="text-ink-dim text-lg">
          <Link href="/login" className="text-mint underline">
            Sign in
          </Link>{" "}
          to summon cats.
        </p>
      </Panel>
    );
  }

  const gems = me.data.wallet.gems;
  const rows = banners.data ?? [];

  return (
    <div className="space-y-4">
      <GachaAnimations />

      <Panel
        title="Summoning Hub"
        action={
          <Link
            href="/collection"
            className="text-pixel text-mint text-[8px] underline"
          >
            Collection
          </Link>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Gems" value={gems.toLocaleString()} tone="mint" />
          <Stat label="Cats" value={me.data.creatureCount} tone="pink" />
        </div>
      </Panel>

      {summary ? (
        <PullReveal
          summary={summary}
          busy={pull.isPending}
          onSummonAgain={() => summon(lastPull.bannerId, lastPull.count)}
          onDismiss={() => setSummary(null)}
        />
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        {rows.map((banner) => (
          <BannerCard
            key={banner.id}
            banner={banner}
            gems={gems}
            busy={pull.isPending}
            onSummon={(count) => summon(banner.id, count)}
          />
        ))}
      </div>

      <RecentPulls
        entries={history.data ?? []}
        loading={history.isLoading}
        limit={20}
      />
    </div>
  );
}
