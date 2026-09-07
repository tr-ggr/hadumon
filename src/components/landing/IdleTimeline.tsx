"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { PixelSprite } from "~/components/PixelSprite";
import { Button, Panel } from "~/components/ui";
import {
  maxHpOf,
  simulateBattle,
  type BattleResult,
  type Combatant,
} from "~/server/game/battle";
import { MATERIAL_LABELS } from "~/server/game/elements";
import {
  GEM_DROP_CHANCE,
  goldPerWin,
  MATERIAL_DROP_CHANCE,
} from "~/server/game/idle";
import { getSpecies, STARTER_SPECIES_IDS } from "~/server/game/species";
import { effectiveStats } from "~/server/game/stats";
import {
  MAX_OFFLINE_SECONDS,
  ZONES,
  generateEnemies,
  type EnemyCombatant,
  type Zone,
} from "~/server/game/zones";
import { LandingSection, SectionHeading } from "./LandingSection";
import { useLoopWhileSeen } from "./useLoopWhileSeen";

/** One log line per second, the pace the real expedition resolves at. */
const LINE_MS = 1000;
/** Beat between the result and the next encounter. */
const NEXT_ENCOUNTER_MS = 2000;
/** Log lines kept on screen, so the panel never changes height. */
const VISIBLE_LINES = 4;
/** The level three starters reach in an evening of idling. */
const DEMO_LEVEL = 5;

function firstZone(): Zone {
  const zone = ZONES[0];
  // ZONES is a non-empty literal; this only guards a future edit.
  if (!zone) throw new Error("ZONES is empty");
  return zone;
}

const ZONE = firstZone();

/** The three cats every new account is given, at demo level. */
const SQUAD: Combatant[] = STARTER_SPECIES_IDS.map((speciesId) => {
  const species = getSpecies(speciesId);
  return {
    id: `landing-${species.id}`,
    name: species.name,
    speciesId: species.id,
    element: species.element,
    stats: effectiveStats(species, DEMO_LEVEL),
  };
});

/**
 * The zone's own cadence, worded.
 *
 * Reads `ZONE.encounterIntervalSec` rather than the `ENCOUNTER_INTERVAL_SEC`
 * module constant: `export const ENCOUNTER_INTERVAL_SEC = 60` has the literal
 * type `60`, so comparing it against `60` narrows the other branch to `never`
 * and the seconds wording stops being live code. `Zone.encounterIntervalSec`
 * is typed `number`, and it is the value this stop is describing anyway.
 */
const INTERVAL_SECONDS = ZONE.encounterIntervalSec;
const INTERVAL_LABEL =
  INTERVAL_SECONDS === 60 ? "minute" : `${INTERVAL_SECONDS} seconds`;

/** The idle cap, in hours — the width of the working day below. */
const OFFLINE_HOURS = MAX_OFFLINE_SECONDS / 3600;
const START_HOUR = 9;
const CLAIM_TIME = `${String(START_HOUR + OFFLINE_HOURS).padStart(2, "0")}:00`;

/** The same function the idle engine pays out with. */
const GOLD_PER_WIN = goldPerWin(ZONE);

interface Encounter {
  index: number;
  enemies: EnemyCombatant[];
  result: BattleResult;
}

/**
 * Encounter `index`, fought for real by the battle engine.
 *
 * `nonce` is 0 for the encounter rendered on the server, so the markup the
 * browser receives matches what it hydrates; every later encounter gets
 * `Date.now()` and so a genuinely fresh fight.
 */
function buildEncounter(index: number, nonce: number): Encounter {
  const enemies = generateEnemies(ZONE, "landing", index);
  return {
    index,
    enemies,
    result: simulateBattle(SQUAD, enemies, `landing:${index}:${nonce}`),
  };
}

interface TickerState {
  encounter: Encounter;
  /** Log events printed so far. */
  step: number;
}

/**
 * The four stops between a summon and a claim, with the third one running the
 * real auto-battler: same `generateEnemies`, same `simulateBattle`, same log
 * the adventure screen prints after a claim.
 */
export function IdleTimeline() {
  const [state, setState] = useState<TickerState>(() => {
    const first = buildEncounter(0, 0);
    // Starts finished: a visitor without JavaScript still gets a whole fight.
    return { encounter: first, step: first.result.log.length };
  });
  const [autoplay, setAutoplay] = useState(false);
  const [replaying, setReplaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  // The loop stops the moment the ticker leaves the viewport or the tab hides.
  const seen = useLoopWhileSeen<HTMLDivElement>();

  // Autoplay is a motion choice, so it is decided after mount, not in markup.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
      return;
    }
    setAutoplay(true);
    setState((current) => ({ ...current, step: 0 }));
  }, []);

  const events = state.encounter.result.log;
  const finished = state.step >= events.length;
  const running = (autoplay || replaying) && seen.active;

  useEffect(() => {
    if (!running) return;

    if (!finished) {
      const timer = setTimeout(
        () => setState((current) => ({ ...current, step: current.step + 1 })),
        LINE_MS,
      );
      return () => clearTimeout(timer);
    }

    if (replaying) {
      // A replay is one fight, asked for by hand. It does not roll on.
      const timer = setTimeout(() => setReplaying(false), NEXT_ENCOUNTER_MS);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setState((current) => ({
        encounter: buildEncounter(current.encounter.index + 1, Date.now()),
        step: 0,
      }));
    }, NEXT_ENCOUNTER_MS);
    return () => clearTimeout(timer);
  }, [running, finished, replaying, state.step, state.encounter.index]);

  const hp = useMemo(() => {
    const map = new Map<string, number>();
    for (const fighter of SQUAD) map.set(fighter.id, maxHpOf(fighter));
    for (const foe of state.encounter.enemies) map.set(foe.id, maxHpOf(foe));
    for (let i = 0; i < state.step && i < events.length; i++) {
      const event = events[i];
      if (event) map.set(event.targetId, event.targetHpAfter);
    }
    return map;
  }, [state.encounter.enemies, state.step, events]);

  const names = useMemo(() => {
    const map = new Map<string, { name: string; ally: boolean }>();
    for (const cat of SQUAD) map.set(cat.id, { name: cat.name, ally: true });
    for (const foe of state.encounter.enemies) {
      map.set(foe.id, { name: `${foe.name} Lv${foe.level}`, ally: false });
    }
    return map;
  }, [state.encounter.enemies]);

  const shown = events.slice(
    Math.max(0, state.step - VISIBLE_LINES),
    state.step,
  );
  const won = state.encounter.result.winner === "A";

  const ticker = (
    <div ref={seen.ref} className="w-full">
      <Panel
        title="Fight log"
        action={
          <span className="text-pixel text-ink-dim text-[8px] tracking-wide uppercase">
            Encounter {state.encounter.index + 1}
          </span>
        }
        bodyClassName="space-y-3"
      >
        <TickerSide label="Your squad" fighters={SQUAD} hp={hp} tone="mint" />
        <TickerSide
          label="Wild cats"
          fighters={state.encounter.enemies}
          hp={hp}
          tone="pink"
        />

        <ol
          aria-label="Turn-by-turn fight log"
          className="border-edge bg-navy-deep flex min-h-[6.5rem] flex-col justify-end gap-0.5 border-2 p-2"
        >
          {shown.length === 0 ? (
            <li className="text-ink-dim text-base leading-tight">
              The cats size each other up…
            </li>
          ) : (
            shown.map((event, i) => {
              const actor = names.get(event.actorId);
              const target = names.get(event.targetId);
              return (
                <li
                  key={`${state.encounter.index}-${state.step - shown.length + i}`}
                  className="text-ink-dim text-base leading-tight"
                >
                  <span className="text-pixel text-edge mr-1 text-[7px]">
                    R{event.round}
                  </span>
                  <span className={actor?.ally ? "text-mint" : "text-pink"}>
                    {actor?.name ?? event.actorId}
                  </span>{" "}
                  hits{" "}
                  <span className={target?.ally ? "text-mint" : "text-pink"}>
                    {target?.name ?? event.targetId}
                  </span>{" "}
                  for{" "}
                  <span className="text-gold tabular-nums">{event.damage}</span>
                  {event.crit ? (
                    <span className="text-gold"> CRIT!</span>
                  ) : null}
                  {event.ko ? <span className="text-pink"> — KO</span> : null}
                </li>
              );
            })
          )}
        </ol>

        <div className="flex min-h-[2.25rem] flex-wrap items-center justify-between gap-2">
          <p
            className={`text-pixel text-[10px] ${finished ? (won ? "text-gold" : "text-pink") : "text-edge"}`}
          >
            {finished
              ? won
                ? "Won"
                : "Lost"
              : `Round ${events[state.step]?.round ?? 1}`}
          </p>
          {reduced ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setState((current) => ({ ...current, step: 0 }));
                setReplaying(true);
              }}
              disabled={replaying}
            >
              Replay
            </Button>
          ) : null}
        </div>
      </Panel>
    </div>
  );

  const claim = (
    <div className="space-y-2">
      <ul className="text-ink-dim space-y-1 text-lg leading-snug">
        <li>
          <span className="text-gold tabular-nums">{GOLD_PER_WIN}</span> gold a
          win
        </li>
        <li>
          A gem on{" "}
          <span className="text-mint tabular-nums">
            {percent(GEM_DROP_CHANCE)}%
          </span>{" "}
          of wins
        </li>
        <li>
          A {MATERIAL_LABELS[ZONE.element]} on{" "}
          <span className="text-mint tabular-nums">
            {percent(MATERIAL_DROP_CHANCE)}%
          </span>{" "}
          of wins
        </li>
      </ul>
      <p className="text-ink text-lg leading-snug">
        Up to {OFFLINE_HOURS} hours of progress banks while you&apos;re away.
      </p>
    </div>
  );

  const stops: { time: string; label: ReactNode; body?: ReactNode }[] = [
    { time: "09:00", label: "Summon" },
    { time: "09:05", label: `Send the squad to ${ZONE.name}` },
    {
      time: `09:06 → ${CLAIM_TIME}`,
      label: `One encounter a ${INTERVAL_LABEL}`,
      body: ticker,
    },
    { time: CLAIM_TIME, label: "Claim", body: claim },
  ];

  return (
    <LandingSection labelledBy="idle-heading">
      <SectionHeading
        titleId="idle-heading"
        title="Send them out. Come back to the loot."
        intro={`Pick a zone, send the squad, close the tab. The server resolves one fight a ${INTERVAL_LABEL} whether you are watching or not, and the log below is that engine running.`}
      />

      <ol className="grid lg:grid-cols-[1fr_1.3fr_3fr_1.5fr]">
        {stops.map((stop) => (
          <li
            key={stop.time}
            className="border-edge relative border-l-2 pb-8 pl-6 last:pb-0 lg:border-t-2 lg:border-l-0 lg:pt-7 lg:pr-6 lg:pb-0 lg:pl-0"
          >
            <span
              aria-hidden="true"
              className="text-gold bg-navy absolute top-0 left-0 -translate-x-1/2 px-0 py-1 text-[10px] leading-none lg:translate-x-0 lg:-translate-y-1/2 lg:px-1 lg:py-0"
            >
              ◆
            </span>
            <p className="text-pixel text-gold text-[8px] tracking-wide">
              {stop.time}
            </p>
            <p className="text-ink mt-1 text-lg leading-snug">{stop.label}</p>
            {stop.body ? <div className="mt-3">{stop.body}</div> : null}
          </li>
        ))}
      </ol>
    </LandingSection>
  );
}

function TickerSide({
  label,
  fighters,
  hp,
  tone,
}: {
  label: string;
  fighters: readonly Combatant[];
  hp: Map<string, number>;
  tone: "mint" | "pink";
}) {
  return (
    <section>
      <h3 className="text-pixel text-ink-dim text-[7px] tracking-wide uppercase">
        {label}
      </h3>
      <ul className="mt-1 space-y-1">
        {fighters.map((fighter) => {
          const max = maxHpOf(fighter);
          const current = hp.get(fighter.id) ?? max;
          const pct = Math.round((current / max) * 100);
          const down = current <= 0;

          return (
            <li
              key={fighter.id}
              className={`flex items-center gap-2 ${down ? "opacity-35 grayscale" : ""}`}
            >
              <PixelSprite speciesId={fighter.speciesId} size={24} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-pixel text-ink truncate text-[7px]">
                    {fighter.name}
                  </span>
                  <span className="text-ink-dim text-sm tabular-nums">
                    {current}/{max}
                  </span>
                </div>
                <div className="border-edge bg-navy-deep h-2 w-full border-2">
                  {/* Scaled, not resized: a transform never triggers layout,
                      and `steps(4)` keeps the bar dropping in pixel notches. */}
                  <div
                    className={`h-full w-full origin-left ${tone === "mint" ? "bg-mint" : "bg-pink"}`}
                    style={{
                      transform: `scaleX(${pct / 100})`,
                      transition: "transform 160ms steps(4, end)",
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

/** 0.35 → 35. Drop rates are stored as fractions. */
function percent(chance: number): number {
  return Math.round(chance * 100);
}
