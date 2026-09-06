"use client";

import { useEffect, useMemo, useState } from "react";

import {
  ElementBadge,
  Button,
  CreatureCard,
  Panel,
  Stat,
} from "~/components/ui";
import {
  creditedSeconds,
  pendingEncounters,
  secondsToNextEncounter,
} from "~/server/game/idle";
import { api, type RouterOutputs } from "~/trpc/react";
import type { ClaimSummaryView } from "./ClaimResultsModal";
import { FightLog } from "./FightLog";
import { UpgradeButton } from "./UpgradeButton";

type CurrentExpedition = NonNullable<RouterOutputs["adventure"]["current"]>;

export interface ExpeditionPanelProps {
  current: CurrentExpedition;
  onSettled: (summary: ClaimSummaryView) => void;
}

/** The active expedition: live timer, squad, claim/recall, latest fight replay. */
export function ExpeditionPanel({ current, onSettled }: ExpeditionPanelProps) {
  const utils = api.useUtils();
  const { zone, expedition, squad } = current;

  const nowDate = useLiveClock(current.serverNow);
  const pending = pendingEncounters(expedition.lastClaimedAt, nowDate, zone);
  const nextIn = secondsToNextEncounter(
    expedition.lastClaimedAt,
    nowDate,
    zone,
  );
  const banked = creditedSeconds(expedition.lastClaimedAt, nowDate);
  const cappedPct = Math.min(100, (banked / current.maxOfflineSeconds) * 100);
  const atCap = banked >= current.maxOfflineSeconds;

  async function refresh() {
    await Promise.all([
      utils.adventure.invalidate(),
      utils.creatures.invalidate(),
      utils.auth.me.invalidate(),
    ]);
  }

  const claim = api.adventure.claim.useMutation({
    onSuccess: async (summary) => {
      onSettled(summary);
      await refresh();
    },
  });

  const recall = api.adventure.recall.useMutation({
    onSuccess: async (summary) => {
      onSettled(summary);
      await refresh();
    },
  });

  const busy = claim.isPending || recall.isPending;
  const error = claim.error ?? recall.error;

  return (
    <div className="space-y-4">
      <Panel
        title={zone.name}
        action={<ElementBadge element={zone.element} />}
        bodyClassName="space-y-3"
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat
            label="Ready"
            value={pending}
            tone={pending > 0 ? "mint" : "default"}
          />
          <Stat label="Next in" value={formatClock(nextIn)} />
          <Stat label="Wins" value={expedition.winCount} tone="gold" />
          <Stat label="Losses" value={expedition.lossCount} tone="pink" />
        </div>

        <p className="text-ink text-lg" aria-live="polite">
          {atCap ? (
            <span className="text-pink">
              Idle rewards are capped — claim now or you stop earning.
            </span>
          ) : pending > 0 ? (
            <>
              <span className="text-mint tabular-nums">{pending}</span>{" "}
              encounter
              {pending === 1 ? "" : "s"} ready · next in{" "}
              <span className="text-gold tabular-nums">
                {formatClock(nextIn)}
              </span>
            </>
          ) : (
            <>
              Next encounter in{" "}
              <span className="text-gold tabular-nums">
                {formatClock(nextIn)}
              </span>
            </>
          )}
        </p>

        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-pixel text-ink-dim text-[7px] uppercase">
              Offline bank
            </span>
            <span className="text-ink-dim text-base tabular-nums">
              {formatDuration(banked)} /{" "}
              {formatDuration(current.maxOfflineSeconds)}
            </span>
          </div>
          <div className="border-edge bg-navy-deep mt-1 h-3 w-full border-2">
            <div
              className={atCap ? "bg-pink h-full" : "bg-mint h-full"}
              style={{ width: `${cappedPct}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Squad power" value={current.squadPower} tone="sky" />
          <Stat label="Rec. power" value={zone.recommendedPower} />
          <Stat label="Gold earned" value={expedition.totalGold} tone="gold" />
          <Stat label="XP earned" value={expedition.totalXp} tone="mint" />
        </div>

        {error ? <p className="text-pink text-base">{error.message}</p> : null}

        <div className="flex flex-wrap gap-2">
          <Button
            className="flex-1"
            disabled={busy || pending === 0}
            onClick={() => claim.mutate()}
          >
            {claim.isPending
              ? "Claiming…"
              : pending > 0
                ? `Claim ${pending}`
                : "Nothing yet"}
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            disabled={busy}
            onClick={() => recall.mutate()}
          >
            {recall.isPending ? "Recalling…" : "Recall"}
          </Button>
        </div>
      </Panel>

      <Panel title="Squad">
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {squad.map((creature) => (
            <li key={creature.id}>
              <CreatureCard
                creature={creature}
                spriteSize={56}
                footer={
                  <div className="mt-1 w-full space-y-1">
                    <p className="text-pixel text-ink-dim text-[7px] uppercase">
                      Tier {creature.upgradeTier}
                    </p>
                    <UpgradeButton creature={creature} />
                  </div>
                }
              />
            </li>
          ))}
        </ul>
      </Panel>

      {current.lastBattleLog ? (
        <FightLog fight={current.lastBattleLog} />
      ) : (
        <p className="text-ink-dim text-base">
          No fight has been resolved yet — claim once the first encounter is
          ready.
        </p>
      )}
    </div>
  );
}

/**
 * A once-a-second clock aligned to the server's `now`, so the countdown never
 * disagrees with what `claim` will actually resolve.
 */
function useLiveClock(serverNow: Date): Date {
  const offset = useMemo(() => serverNow.getTime() - Date.now(), [serverNow]);
  // Start from the server timestamp so SSR and the first client render agree.
  const [nowMs, setNowMs] = useState(() => serverNow.getTime());

  useEffect(() => {
    const tick = () => setNowMs(Date.now() + offset);
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [offset]);

  return useMemo(() => new Date(nowMs), [nowMs]);
}

function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}
