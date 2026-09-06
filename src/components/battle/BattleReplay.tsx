"use client";

import { useEffect, useMemo, useState } from "react";

import { PixelSprite } from "~/components/PixelSprite";
import { Button } from "~/components/ui";
import type { BattleDetailView } from "~/server/api/routers/battle";
import type { Combatant } from "~/server/game/battle";

/** Longest a full replay may take before it starts fast-forwarding itself. */
const MAX_REPLAY_MS = 12_000;
const STEP_MS = 400;

export interface BattleReplayProps {
  battle: BattleDetailView;
  onClose: () => void;
}

/**
 * Plays a stored `BattleResult` back event by event. It never calls the battle
 * engine — every HP value comes from `targetHpAfter` in the persisted log, so
 * a replay is identical every time it is opened.
 */
export function BattleReplay({ battle, onClose }: BattleReplayProps) {
  const events = battle.log.log;
  const [step, setStep] = useState(0);
  const finished = step >= events.length;

  const stepMs = Math.max(
    90,
    Math.min(STEP_MS, MAX_REPLAY_MS / Math.max(1, events.length)),
  );

  useEffect(() => {
    setStep(0);
  }, [battle.id]);

  useEffect(() => {
    if (finished) return;
    const timer = setTimeout(() => setStep((value) => value + 1), stepMs);
    return () => clearTimeout(timer);
  }, [finished, step, stepMs]);

  const hp = useMemo(() => hpAfter(battle, step), [battle, step]);
  const names = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of [...battle.attackerTeam, ...battle.defenderTeam])
      map.set(c.id, c.name);
    return map;
  }, [battle]);

  const current = step > 0 ? events[step - 1] : undefined;
  const youAreAttacker = battle.role === "attacker";
  const yourTeam = youAreAttacker ? battle.attackerTeam : battle.defenderTeam;
  const theirTeam = youAreAttacker ? battle.defenderTeam : battle.attackerTeam;

  return (
    <div className="bg-navy-deep/85 fixed inset-0 z-40 flex items-end justify-center p-2 sm:items-center">
      <div className="panel max-h-[92dvh] w-full max-w-md overflow-y-auto">
        <header className="border-edge bg-panel-hi flex items-center justify-between gap-2 border-b-2 px-3 py-2">
          <h2 className="text-pixel text-gold text-[10px]">
            vs {battle.opponent.displayName}
          </h2>
          <span className="text-pixel text-ink-dim text-[8px]">
            Round {current?.round ?? (finished ? battle.log.rounds : 1)}/
            {battle.log.rounds}
          </span>
        </header>

        <div className="space-y-3 p-3">
          <Side
            label={battle.opponent.displayName}
            team={theirTeam}
            hp={hp}
            tone="pink"
            activeId={current?.actorId}
            targetId={current?.targetId}
          />

          <div className="panel-flat min-h-[3.5rem] px-2 py-1">
            {current ? (
              <p className="text-ink text-lg leading-tight">
                <span className="text-mint">
                  {names.get(current.actorId) ?? "?"}
                </span>{" "}
                hits{" "}
                <span className="text-pink">
                  {names.get(current.targetId) ?? "?"}
                </span>{" "}
                for{" "}
                <span className="text-gold tabular-nums">{current.damage}</span>
                {current.crit ? (
                  <span className="text-gold"> CRIT!</span>
                ) : null}
                {current.ko ? <span className="text-pink"> — KO!</span> : null}
              </p>
            ) : (
              <p className="text-ink-dim text-lg">
                The cats size each other up…
              </p>
            )}
          </div>

          <Side
            label="Your squad"
            team={yourTeam}
            hp={hp}
            tone="mint"
            activeId={current?.actorId}
            targetId={current?.targetId}
          />

          {finished ? (
            <ResultCard battle={battle} onClose={onClose} />
          ) : (
            <div className="flex items-center justify-between gap-2">
              <span className="text-pixel text-ink-dim text-[8px]">
                {step}/{events.length} turns
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStep(events.length)}
              >
                Skip ▶▶
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultCard({
  battle,
  onClose,
}: {
  battle: BattleDetailView;
  onClose: () => void;
}) {
  const delta = battle.ratingDelta;

  return (
    <div
      className="panel-flat space-y-2 p-3 text-center"
      style={{
        borderColor: battle.won ? "var(--color-mint)" : "var(--color-pink)",
      }}
    >
      <p
        className={`text-pixel text-sm ${battle.won ? "text-mint" : "text-pink"}`}
      >
        {battle.won ? "VICTORY" : "DEFEAT"}
      </p>
      <p className="text-ink-dim text-lg">
        Rating{" "}
        <span className="text-ink tabular-nums">{battle.ratingBefore}</span> →{" "}
        <span className="text-ink tabular-nums">{battle.ratingAfter}</span>{" "}
        <span className={delta >= 0 ? "text-mint" : "text-pink"}>
          ({delta >= 0 ? "+" : ""}
          {delta})
        </span>
      </p>
      {battle.reward.gold > 0 || battle.reward.gems > 0 ? (
        <p className="text-ink-dim text-lg">
          Spoils: <span className="text-gold">{battle.reward.gold} gold</span> ·{" "}
          <span className="text-mint">{battle.reward.gems} gems</span>
        </p>
      ) : null}
      <Button onClick={onClose} className="w-full">
        Close
      </Button>
    </div>
  );
}

function Side({
  label,
  team,
  hp,
  tone,
  activeId,
  targetId,
}: {
  label: string;
  team: readonly Combatant[];
  hp: Map<string, number>;
  tone: "mint" | "pink";
  activeId?: string;
  targetId?: string;
}) {
  return (
    <section className="space-y-1">
      <h3 className="text-pixel text-ink-dim text-[8px] uppercase">{label}</h3>
      <ul className="space-y-1">
        {team.map((fighter) => {
          const max = Math.max(1, fighter.stats.hp);
          const current = hp.get(fighter.id) ?? max;
          const pct = Math.round((current / max) * 100);
          const dead = current <= 0;

          return (
            <li
              key={fighter.id}
              className={`flex items-center gap-2 ${dead ? "opacity-35 grayscale" : ""} ${
                fighter.id === activeId ? "translate-x-0.5" : ""
              }`}
            >
              <PixelSprite speciesId={fighter.speciesId} size={32} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-pixel text-ink truncate text-[7px]">
                    {fighter.name}
                  </span>
                  <span className="text-ink-dim text-sm tabular-nums">
                    {current}/{max}
                  </span>
                </div>
                <div
                  className={`border-edge bg-navy-deep h-2 w-full border ${
                    fighter.id === targetId
                      ? "outline-gold outline outline-1"
                      : ""
                  }`}
                >
                  <div
                    className={`h-full ${tone === "mint" ? "bg-mint" : "bg-pink"}`}
                    style={{
                      width: `${pct}%`,
                      transition: "width 120ms steps(4)",
                    }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** HP of every fighter after `step` logged events have been applied. */
function hpAfter(battle: BattleDetailView, step: number): Map<string, number> {
  const hp = new Map<string, number>();
  for (const fighter of [...battle.attackerTeam, ...battle.defenderTeam]) {
    hp.set(fighter.id, Math.max(1, fighter.stats.hp));
  }

  const events = battle.log.log;
  for (let i = 0; i < step && i < events.length; i++) {
    const event = events[i];
    if (event) hp.set(event.targetId, event.targetHpAfter);
  }

  return hp;
}
