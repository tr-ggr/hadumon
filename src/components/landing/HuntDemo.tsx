"use client";

import { useEffect, useState } from "react";

import { EssencePip } from "~/components/cats/CatCard";
import { PixelSprite } from "~/components/PixelSprite";
import {
  describeAction,
  describeEvents,
  goalText,
  type LogTone,
} from "~/components/run/describe";
import { Die } from "~/components/run/pieces";
import { toggleDie } from "~/components/run/turn";
import { Button, ButtonLink } from "~/components/ui";
import { describePower, getCat } from "~/server/game/cats";
import {
  applyAction,
  createMatch,
  ESSENCES,
  playerScore,
  rivalScore,
  ROUND_TURNS,
  rowReward,
  SLOTS,
  type Action,
  type MatchState,
} from "~/server/game/match";
import { GAUNTLET, getRival } from "~/server/game/rival";
import { starterDeck } from "~/server/game/run";
import { toMatchView } from "~/server/game/view";

/** The Hunt row the visitor is handed, left to right. */
const ROW = ["flameclaw", "burrfang", "cinderpounce"] as const;
const RIVAL_ID = GAUNTLET[0] ?? "alley-tom";
const STEP_MS = 560;
const ORDINALS = ["1st", "2nd", "3rd", "4th"];

/**
 * A real match against the first rival, dealt mid-round: the Hunt row is
 * already built and the round's goal is one a Hunt row can win.
 */
function deal(n: number): MatchState {
  const base = createMatch({
    seed: `landing-${n}`,
    deck: starterDeck("flame"),
    relics: [],
    rivalId: RIVAL_ID,
  });
  return {
    ...base,
    phase: "turn",
    turnsLeft: ROUND_TURNS[0],
    setup: [],
    discard: base.setup,
    goals: ["pantry", ...base.goals.filter((goal) => goal !== "pantry")],
    board: {
      hunt: ROW.map((catId) => ({ catId, yarn: 0, cached: 0, tucked: 0 })),
      den: [],
      prowl: [],
    },
  };
}

function takeCount(state: MatchState): number {
  return Math.min(rowReward(state, "hunt"), state.feeder.length);
}

function firstDice(state: MatchState): number[] {
  return Array.from({ length: takeCount(state) }, (_, i) => i);
}

interface Step {
  text: string;
  tone: LogTone;
  /** The Hunt slot whose power this step is, if any. */
  col: number | null;
}

/** The turn as the lines the visitor reads, in the order things happened. */
function turnSteps(
  before: MatchState,
  action: Action,
): {
  after: MatchState;
  steps: Step[];
} {
  const { state: after, events } = applyAction(before, action);
  const beforeView = toMatchView(before);
  const lines = describeEvents(beforeView, toMatchView(after), events);
  const steps: Step[] = [
    { text: describeAction(beforeView, action), tone: "note", col: null },
  ];
  let line = 0;
  for (const event of events) {
    if (
      event.type !== "power" &&
      event.type !== "feeder" &&
      event.type !== "rival" &&
      event.type !== "goal" &&
      event.type !== "over"
    ) {
      continue;
    }
    const described = lines[line++];
    if (!described || event.type === "goal") continue;
    steps.push({
      text: described.text,
      tone: described.tone,
      col: event.type === "power" ? event.col : null,
    });
  }
  return { after, steps };
}

/**
 * One round of Hunt against Alley Tom, run by the real engine in the browser.
 * Nothing is saved; "Deal again" starts a fresh seed.
 */
export function HuntDemo() {
  const [deals, setDeals] = useState(0);
  const [state, setState] = useState(() => deal(0));
  const [dice, setDice] = useState(() => firstDice(state));
  const [steps, setSteps] = useState<Step[]>([]);
  const [shown, setShown] = useState(0);
  /** The state the turn in progress resolves to, while its steps play out. */
  const [pending, setPending] = useState<MatchState | null>(null);

  useEffect(() => {
    if (!pending) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setTimeout(
      () => {
        if (shown < steps.length) {
          setShown(shown + 1);
          return;
        }
        setState(pending);
        setDice(firstDice(pending));
        setPending(null);
      },
      still ? 0 : STEP_MS,
    );
    return () => window.clearTimeout(id);
  }, [pending, shown, steps.length]);

  const rival = getRival(RIVAL_ID);
  const busy = pending !== null;
  const done = !busy && state.round > 0;
  const take = takeCount(state);
  const firing = busy ? (steps[shown - 1]?.col ?? null) : null;
  const visible = steps.slice(0, shown);
  const rivalLine = [...visible]
    .reverse()
    .find((step) => step.tone === "rival");
  const goal = state.goalResults[0];
  const cats = state.board.hunt;

  const hunt = () => {
    const turn = turnSteps(state, { type: "hunt", dice });
    setSteps(turn.steps);
    setShown(1);
    setPending(turn.after);
  };

  const dealAgain = () => {
    const fresh = deal(deals + 1);
    setDeals(deals + 1);
    setState(fresh);
    setDice(firstDice(fresh));
    setSteps([]);
    setShown(0);
  };

  return (
    <div className="space-y-2">
      <section
        aria-label="Hunt row"
        className="border-ink bg-sky-surface border-2 p-2 sm:p-3"
      >
        <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="text-pixel text-ink text-lg leading-tight">Hunt</h3>
          <p className="text-ink text-xs font-bold tabular-nums">
            {done
              ? "Round 1 is over"
              : `Round 1 · ${state.turnsLeft} of ${ROUND_TURNS[0]} turns left`}
          </p>
        </header>

        <ol className="mt-2 grid grid-cols-4 gap-1.5">
          {Array.from({ length: SLOTS }, (_, col) => {
            const placed = cats[col];
            if (!placed) {
              return (
                <li
                  key={col}
                  className="border-ink/50 text-ink flex min-h-24 items-center justify-center border-2 border-dashed p-1 text-center text-xs leading-tight font-bold"
                >
                  Empty
                </li>
              );
            }
            const cat = getCat(placed.catId);
            return (
              <li
                key={col}
                className={`border-ink text-ink flex min-h-24 flex-col items-center gap-0.5 border-2 p-1 text-center transition-colors duration-200 ${firing === col ? "bg-lime" : "bg-cream"}`}
              >
                <span className="border-ink self-start border bg-white px-1 text-[10px] leading-4 font-bold">
                  Fires {ORDINALS[cats.length - 1 - col]}
                </span>
                <PixelSprite
                  catId={cat.id}
                  size={48}
                  decorative
                  className="sm:h-16 sm:w-16"
                />
                <span className="hidden w-full truncate text-xs leading-tight font-black sm:block">
                  {cat.name}
                </span>
                {cat.power ? (
                  <span className="hidden text-xs leading-snug sm:block">
                    {describePower(cat.power)}
                  </span>
                ) : null}
                {placed.tucked > 0 ? (
                  <span className="border-ink border bg-white px-1 text-[10px] leading-4 font-bold tabular-nums">
                    Tucked {placed.tucked}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>

        <ul className="text-ink mt-2 space-y-0.5 text-xs leading-snug sm:hidden">
          {[...cats].reverse().map((placed, i) => {
            const cat = getCat(placed.catId);
            return (
              <li key={i}>
                <span className="font-black">{cat.name}.</span>{" "}
                {cat.power ? describePower(cat.power) : "No power."}
              </li>
            );
          })}
        </ul>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-ink text-xs font-bold">
              {done
                ? "The feeder"
                : `The feeder. Pick ${take} ${take === 1 ? "die" : "dice"}.`}
            </p>
            <div className="mt-1 grid max-w-sm grid-cols-5 gap-1.5">
              {state.feeder.map((face, index) => (
                <Die
                  key={`${state.step}-${index}`}
                  face={face}
                  selected={!done && dice.includes(index)}
                  disabled={busy}
                  onClick={
                    done
                      ? undefined
                      : () => setDice(toggleDie(dice, index, take))
                  }
                />
              ))}
            </div>
          </div>
          {done ? (
            <Button
              variant="secondary"
              onClick={dealAgain}
              className="bg-white"
            >
              Deal again
            </Button>
          ) : (
            <Button
              size="lg"
              disabled={busy || dice.length !== take}
              onClick={hunt}
            >
              Take {take} {take === 1 ? "die" : "dice"}
            </Button>
          )}
        </div>
      </section>

      <div className="border-ink text-ink flex items-stretch border-2 text-sm font-bold">
        <span className="bg-coral border-ink border-r-2 px-2 py-1.5">
          {rival.name}
        </span>
        <span
          className={`min-w-0 flex-1 px-2 py-1.5 transition-colors duration-300 ${rivalLine ? "bg-coral" : "bg-cream"}`}
        >
          {rivalLine
            ? rivalLine.text
            : "Flips one card after each of your turns."}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-start">
        <div
          aria-live="polite"
          className="text-ink min-h-24 space-y-0.5 text-sm leading-snug"
        >
          {visible.length === 0 ? (
            <p className="text-ink-soft">
              Take the dice. The row pays, then each cat fires, starting from
              the right. This is the real engine; nothing is saved.
            </p>
          ) : (
            visible
              .filter((step) => step.tone !== "rival")
              .map((step, i) => (
                <p key={i} className={i === 0 ? "font-bold" : undefined}>
                  {step.text}
                </p>
              ))
          )}
          {done && goal ? (
            <p className="border-ink bg-lime mt-2 border-2 px-2 py-1 font-bold">
              Round 1 goal, {goalText(RIVAL_ID, goal)}
            </p>
          ) : null}
        </div>

        <dl className="text-ink grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 text-xs font-bold sm:min-w-52">
          <dt>Your essence</dt>
          <dd className="flex flex-wrap items-center gap-x-2 gap-y-1 tabular-nums">
            {ESSENCES.map((kind) => (
              <span
                key={kind}
                className={`flex items-center gap-1 ${state.essence[kind] === 0 ? "opacity-40" : ""}`}
              >
                <EssencePip kind={kind} size={14} />
                {state.essence[kind]}
              </span>
            ))}
          </dd>
          <dt>Score</dt>
          <dd className="tabular-nums">
            You {playerScore(state).total} · {rival.name} {rivalScore(state)}
          </dd>
        </dl>
      </div>

      {done ? (
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-ink max-w-prose text-base">
            That was one row for one round. A match has three rows and three
            rounds, and you build the rows yourself.
          </p>
          <ButtonLink href="/signup" size="lg" className="shrink-0">
            Start a run
          </ButtonLink>
        </div>
      ) : null}
    </div>
  );
}
