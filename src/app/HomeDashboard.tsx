"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import {
  ClaimResultsModal,
  MaterialsStrip,
  UpgradeButton,
  type ClaimSummaryView,
} from "~/components/adventure";
import { PityBar, RecentPulls } from "~/components/gacha";
import { CreatureArt, MASCOT_ART } from "~/components/CreatureArt";
import { Button, Panel, PanelSkeleton, Stat, useToast } from "~/components/ui";
import { pendingEncounters, secondsToNextEncounter } from "~/server/game/idle";
import { api, type RouterOutputs } from "~/trpc/react";

type CurrentExpedition = NonNullable<RouterOutputs["adventure"]["current"]>;

/**
 * The Home dashboard: wallet, the running expedition, the latest summons, the
 * ladder standing and anything waiting on the player. Every card carries its
 * own empty state so a brand-new trainer always sees the next thing to do.
 */
export function HomeDashboard() {
  const me = api.auth.me.useQuery(undefined, { retry: false });
  const enabled = me.data !== undefined && me.data !== null;
  const options = { retry: false, enabled } as const;

  const current = api.adventure.current.useQuery(undefined, {
    ...options,
    refetchInterval: 60_000,
  });
  const history = api.gacha.history.useQuery({ limit: 5 }, options);
  const banners = api.gacha.banners.useQuery(undefined, options);
  const ladder = api.battle.ladder.useQuery(undefined, options);
  const defense = api.battle.getDefense.useQuery(undefined, options);
  const incoming = api.market.incomingTrades.useQuery(undefined, options);
  const creatures = api.creatures.list.useQuery(undefined, options);

  if (me.isLoading) {
    return <PanelSkeleton title="HaduMon" lines={4} />;
  }

  if (!me.data) {
    return (
      <Panel title="Not signed in">
        <p className="text-ink-dim text-lg">
          <Link href="/login" className="text-mint underline">
            Sign in
          </Link>{" "}
          or{" "}
          <Link href="/signup" className="text-mint underline">
            create a trainer
          </Link>{" "}
          to start collecting cats.
        </p>
      </Panel>
    );
  }

  const { user, wallet, creatureCount } = me.data;
  const roster = creatures.data ?? [];
  const strongest = [...roster].sort((a, b) => b.power - a.power).slice(0, 4);
  const standard = banners.data?.find((banner) => banner.id === "standard");
  const pendingTrades = incoming.data?.length ?? 0;

  return (
    <div className="page-wrap space-y-5">
      <section className="surface-sky relative grid overflow-hidden rounded-[28px] p-5 sm:p-7 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:p-9">
        <div className="relative z-10 max-w-xl">
          <p className="text-cobalt-dark mb-2 text-sm font-bold">
            Your cattery is open
          </p>
          <h1 className="text-ink text-4xl sm:text-5xl">
            Welcome back, {user.displayName}
          </h1>
          <p className="text-ink-soft mt-4 max-w-md text-lg">
            A small crew of elemental cats is waiting for the next good idea.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={current ? "/adventure" : "/summon"}
              className="touch-target bg-cobalt inline-flex items-center justify-center rounded-full px-6 py-3 font-extrabold text-white shadow-[0_10px_20px_rgb(21_87_216_/_0.22)]"
            >
              {current ? "Check expedition" : "Summon a cat"}
            </Link>
            <span className="pill text-ink-soft inline-flex items-center bg-white/75 px-4 py-3 text-sm font-bold">
              {creatureCount} collected
            </span>
          </div>
        </div>
        <Image
          src={MASCOT_ART}
          alt="HaduMon mascot, a mildly unimpressed tuxedo cat"
          width={520}
          height={520}
          priority
          className="relative z-10 mx-auto mt-5 -mb-8 w-full max-w-[520px] object-contain lg:mt-0"
        />
        <div className="pointer-events-none absolute -top-20 -right-16 h-64 w-64 rounded-full bg-white/35" />
      </section>

      <section className="reward-console grid gap-5 p-5 sm:p-7 lg:grid-cols-[1.15fr_1fr] lg:items-center">
        <div>
          <p className="text-sm font-bold text-white/75">Return-player loop</p>
          <h2 className="mt-2 text-3xl sm:text-4xl">
            {current.data
              ? "Keep the expedition moving"
              : "Your next pull is ready"}
          </h2>
          <p className="mt-3 max-w-lg text-base text-white/80">
            {current.data
              ? "Your squad is earning while you are away. Check the latest encounter and claim when it is ready."
              : "Start with a ten-pull or send your starter cats into Whisker Meadows."}
          </p>
        </div>
        <div className="rounded-2xl bg-white/10 p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-white/70">
                {current.data ? "Expedition status" : "Starter welcome"}
              </p>
              <p className="mt-1 text-2xl font-extrabold">
                {current.data ? current.data.zone.name : "1,000 gems"}
              </p>
            </div>
            <span className="capsule-float text-5xl" aria-hidden="true">
              ◉
            </span>
          </div>
          <Link
            href={current.data ? "/adventure" : "/summon"}
            className="bg-lime text-ink mt-4 block min-h-12 rounded-full px-5 py-3 text-center font-extrabold shadow-[0_10px_20px_rgb(216_255_79_/_0.24)]"
          >
            {current.data ? "Open adventure" : "Visit the summoning hub"}
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Gold" value={wallet.gold.toLocaleString()} tone="gold" />
        <Stat label="Gems" value={wallet.gems.toLocaleString()} tone="mint" />
        <Stat label="Rating" value={user.rating} tone="sky" />
        <Stat
          label="Rank"
          value={ladder.data ? `#${ladder.data.me.rank}` : "—"}
          tone="pink"
        />
      </section>
      <MaterialsStrip materials={wallet.materials} />

      <nav aria-label="Game modes" className="grid gap-3 sm:grid-cols-3">
        <ModeLink
          href="/adventure"
          title="Adventure"
          text="Explore new places"
          className="bg-sky-surface"
        />
        <ModeLink
          href="/summon"
          title="Summon"
          text="Meet a new HaduMon"
          className="bg-coral text-white"
        />
        <ModeLink
          href="/battle"
          title="Battle"
          text="Test your squad"
          className="bg-lime"
        />
      </nav>

      {creatureCount === 0 ? (
        <Panel title="Start here">
          <p className="text-ink text-lg">
            Your cattery is empty. Spend some gems and meet your first cat.
          </p>
          <Link href="/summon" className="mt-3 inline-block">
            <Button>Summon your first cat!</Button>
          </Link>
        </Panel>
      ) : null}

      <ExpeditionCard loading={current.isLoading} current={current.data} />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <RecentPulls
            entries={history.data ?? []}
            loading={history.isLoading}
            limit={5}
          />
          {standard ? (
            <Panel
              title="Summoning"
              action={
                <Link
                  href="/summon"
                  className="text-pixel text-mint text-[8px] underline"
                >
                  Summon
                </Link>
              }
            >
              <PityBar
                count={standard.pityCount}
                threshold={standard.pityThreshold}
              />
            </Panel>
          ) : null}
        </div>

        <div className="space-y-4">
          <LadderCard
            loading={ladder.isLoading || defense.isLoading}
            rank={ladder.data?.me.rank}
            rating={ladder.data?.me.rating}
            tier={ladder.data?.me.tier}
            quota={defense.data?.quota}
            hasDefense={(defense.data?.team.length ?? 0) > 0}
          />

          <Panel
            title="Trading post"
            action={
              <Link
                href="/market"
                className="text-pixel text-mint text-[8px] underline"
              >
                Market
              </Link>
            }
          >
            {incoming.isLoading ? (
              <p className="text-ink-dim text-lg">Checking the mailbox…</p>
            ) : pendingTrades > 0 ? (
              <p className="text-ink text-lg">
                <span className="text-pink tabular-nums">{pendingTrades}</span>{" "}
                trade offer{pendingTrades === 1 ? "" : "s"} waiting for your
                answer.{" "}
                <Link href="/market" className="text-mint underline">
                  Review
                </Link>
                .
              </p>
            ) : (
              <p className="text-ink-dim text-lg">
                No pending trades.{" "}
                <Link href="/market" className="text-mint underline">
                  Browse the board
                </Link>{" "}
                for cats on sale.
              </p>
            )}
          </Panel>
        </div>
      </div>

      <Panel
        title="Top squad"
        action={
          <Link
            href="/collection"
            className="text-pixel text-mint text-[8px] underline"
          >
            Collection
          </Link>
        }
      >
        {creatures.isLoading ? (
          <p className="text-ink-dim text-lg">Rounding up the cats…</p>
        ) : strongest.length === 0 ? (
          <p className="text-ink-dim text-lg">
            No cats yet.{" "}
            <Link href="/summon" className="text-mint underline">
              Summon your first cat!
            </Link>
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {strongest.map((creature) => (
              <li
                key={creature.id}
                className="panel-flat flex flex-col items-center gap-1 p-2"
              >
                <Link
                  href={`/collection/${creature.id}`}
                  className="flex flex-col items-center gap-1"
                >
                  <CreatureArt speciesId={creature.speciesId} size={88} />
                  <span className="text-pixel text-ink text-[8px]">
                    {creature.name}
                  </span>
                  <span className="text-ink-dim text-base">
                    Lv {creature.level} · {creature.power} PWR
                  </span>
                </Link>
                <UpgradeButton creature={creature} hideCost />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function ModeLink({
  href,
  title,
  text,
  className,
}: {
  href: string;
  title: string;
  text: string;
  className: string;
}) {
  return (
    <Link
      href={href}
      className={`mode-tile text-ink flex flex-col justify-end p-5 shadow-sm ${className}`}
    >
      <span className="text-2xl font-extrabold">{title}</span>
      <span className="mt-1 text-sm font-semibold opacity-75">{text}</span>
    </Link>
  );
}

/** The running expedition, with a live timer and a one-tap claim. */
function ExpeditionCard({
  loading,
  current,
}: {
  loading: boolean;
  current: CurrentExpedition | null | undefined;
}) {
  const utils = api.useUtils();
  const notify = useToast();
  const [summary, setSummary] = useState<ClaimSummaryView | null>(null);

  const claim = api.adventure.claim.useMutation({
    onSuccess: async (result) => {
      setSummary(result);
      await Promise.all([
        utils.adventure.invalidate(),
        utils.creatures.invalidate(),
        utils.auth.me.invalidate(),
      ]);
    },
    onError: (error) => notify(error.message, "error"),
  });

  const now = useLiveClock(current?.serverNow);

  const pending = current
    ? pendingEncounters(current.expedition.lastClaimedAt, now, current.zone)
    : 0;

  if (loading) {
    return <PanelSkeleton title="Expedition" lines={2} />;
  }

  if (!current) {
    return (
      <Panel
        title="Expedition"
        action={
          <Link
            href="/adventure"
            className="text-pixel text-mint text-[8px] underline"
          >
            Adventure
          </Link>
        }
      >
        <p className="text-ink-dim text-lg">
          No expedition running.{" "}
          <Link href="/adventure" className="text-mint underline">
            Send a squad out
          </Link>{" "}
          to earn gold, XP and shards while you are away.
        </p>
      </Panel>
    );
  }

  const nextIn = secondsToNextEncounter(
    current.expedition.lastClaimedAt,
    now,
    current.zone,
  );

  return (
    <>
      <Panel
        title={`Expedition · ${current.zone.name}`}
        action={
          <Link
            href="/adventure"
            className="text-pixel text-mint text-[8px] underline"
          >
            Adventure
          </Link>
        }
        bodyClassName="space-y-3"
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat
            label="Ready"
            value={pending}
            tone={pending > 0 ? "mint" : "default"}
          />
          <Stat label="Next in" value={formatClock(nextIn)} />
          <Stat label="Wins" value={current.expedition.winCount} tone="gold" />
          <Stat label="Squad" value={current.squad.length} tone="sky" />
        </div>

        <ul className="flex flex-wrap gap-2">
          {current.squad.map((creature) => (
            <li key={creature.id} className="flex flex-col items-center">
              <CreatureArt speciesId={creature.speciesId} size={52} />
              <span className="text-ink-dim text-base leading-none">
                Lv {creature.level}
              </span>
            </li>
          ))}
        </ul>

        <Button
          className="w-full"
          disabled={pending === 0 || claim.isPending}
          onClick={() => claim.mutate()}
        >
          {claim.isPending
            ? "Claiming…"
            : pending > 0
              ? `Claim ${pending}`
              : "Nothing to claim yet"}
        </Button>
      </Panel>

      {summary ? (
        <ClaimResultsModal summary={summary} onClose={() => setSummary(null)} />
      ) : null}
    </>
  );
}

function LadderCard({
  loading,
  rank,
  rating,
  tier,
  quota,
  hasDefense,
}: {
  loading: boolean;
  rank: number | undefined;
  rating: number | undefined;
  tier: string | undefined;
  quota: { used: number; limit: number; remaining: number } | undefined;
  hasDefense: boolean;
}) {
  if (loading) {
    return <PanelSkeleton title="Ladder" lines={2} />;
  }

  return (
    <Panel
      title="Ladder"
      action={
        <Link
          href="/battle"
          className="text-pixel text-mint text-[8px] underline"
        >
          Battle
        </Link>
      }
      bodyClassName="space-y-3"
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Rank" value={rank ? `#${rank}` : "—"} tone="gold" />
        <Stat label="Rating" value={rating ?? "—"} tone="sky" />
        <Stat label="Tier" value={tier ?? "—"} tone="pink" />
        <Stat
          label="Attacks"
          value={quota ? `${quota.remaining}/${quota.limit}` : "—"}
          tone={quota?.remaining === 0 ? "pink" : "mint"}
        />
      </div>
      {hasDefense ? (
        <p className="text-ink-dim text-lg">
          Your defense team is holding the line.{" "}
          <Link href="/battle" className="text-mint underline">
            Find an opponent
          </Link>
          .
        </p>
      ) : (
        <p className="text-ink-dim text-lg">
          No defense team yet — other trainers can&apos;t fight you.{" "}
          <Link href="/battle" className="text-mint underline">
            Set one up
          </Link>
          .
        </p>
      )}
    </Panel>
  );
}

/**
 * Ticks once a second, anchored to the server's clock so the countdown agrees
 * with what `claim` will actually resolve.
 */
function useLiveClock(serverNow: Date | undefined): Date {
  const anchor = serverNow?.getTime();
  const [nowMs, setNowMs] = useState(() => anchor ?? Date.now());

  useEffect(() => {
    if (anchor === undefined) return;
    const offset = anchor - Date.now();
    const tick = () => setNowMs(Date.now() + offset);
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [anchor]);

  return useMemo(() => new Date(nowMs), [nowMs]);
}

function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
