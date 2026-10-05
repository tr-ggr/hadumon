"use client";

import { useEffect, useState } from "react";

import { ElementMark } from "~/components/cats/CatCard";
import { PixelIcon } from "~/components/PixelIcon";
import { PixelSprite } from "~/components/PixelSprite";
import { ELEMENT_PALETTES } from "~/components/sprites/palettes";
import {
  describeAction,
  describeEvents,
  goalText,
  plural,
  type LogTone,
} from "~/components/run/describe";
import {
  COBALT,
  Die,
  EssenceToken,
  INK,
  Label,
  LIME,
  Nameplate,
  SpaceCost,
  TableButton,
  TableLink,
  TurnCube,
  WHITE,
} from "~/components/run/pieces";
import { toggleDie } from "~/components/run/turn";
import { describePower, getCat, type RivalAction } from "~/server/game/cats";
import {
  applyAction,
  COLUMN_YARN_COST,
  createMatch,
  ESSENCES,
  playerScore,
  rivalScore,
  ROUND_TURNS,
  ROW_REWARD,
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
  /** The line for the log; empty for the closing step that only settles. */
  text: string;
  tone: LogTone;
  /** The Hunt slot whose power this step is, if any. */
  col: number | null;
  /** The card the rival flipped, if this step is the rival's. */
  rival: RivalAction | null;
  /** The match as it stands once this step has landed. */
  frame: MatchState;
}

/**
 * The turn as the lines the visitor reads, in the order things happened. Each
 * step carries the state to show with it, so the dice leave the feeder and
 * the tally moves as each line lands. The last frame is the engine's result.
 */
function turnSteps(
  before: MatchState,
  action: Extract<Action, { type: "hunt" }>,
): Step[] {
  const { state: after, events } = applyAction(before, action);
  const beforeView = toMatchView(before);
  const lines = describeEvents(beforeView, toMatchView(after), events);

  let frame = structuredClone(before);
  for (const index of [...action.dice].sort((a, b) => b - a)) {
    const [face] = frame.feeder.splice(index, 1);
    if (face) frame.essence[face] += 1;
  }
  const steps: Step[] = [
    {
      text: describeAction(beforeView, action),
      tone: "note",
      col: null,
      rival: null,
      frame,
    },
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

    frame = structuredClone(frame);
    if (event.type === "feeder") frame.feeder = [...event.faces];
    if (event.type === "rival") {
      frame.rival = after.rival;
      frame.feeder = after.feeder;
    }
    if (event.type === "power") {
      const effect = getCat(event.catId).power?.effect;
      const slot = frame.board.hunt[event.col];
      const settled = after.board.hunt[event.col];
      if (effect?.kind === "essence") frame.essence[effect.element] += effect.n;
      if (slot && settled) slot.tucked = settled.tucked;
    }
    steps.push({
      text: described.text,
      tone: described.tone,
      col: event.type === "power" ? event.col : null,
      rival: event.type === "rival" ? event.action : null,
      frame,
    });
  }
  steps.push({ text: "", tone: "note", col: null, rival: null, frame: after });
  return steps;
}

/**
 * One round of Hunt against Alley Tom, run by the real engine in the browser
 * and laid out as the match table is: the lane on its mat, the feeder in a
 * well, the rival's side beside it. Nothing is saved; "Deal again" starts a
 * fresh seed. The root says what is happening in data attributes, so the
 * page around it can react.
 */
export function HuntDemo() {
  const [deals, setDeals] = useState(0);
  const [state, setState] = useState(() => deal(0));
  const [dice, setDice] = useState(() => firstDice(state));
  const [steps, setSteps] = useState<Step[]>([]);
  const [shown, setShown] = useState(0);
  /** True while a turn's steps are still landing. */
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!busy) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setTimeout(
      () => {
        if (shown < steps.length) {
          setShown(shown + 1);
          return;
        }
        const settled = steps[steps.length - 1]?.frame;
        if (settled) {
          setState(settled);
          setDice(firstDice(settled));
        }
        setBusy(false);
      },
      still ? 0 : STEP_MS,
    );
    return () => window.clearTimeout(id);
  }, [busy, shown, steps]);

  const rival = getRival(RIVAL_ID);
  const current = busy ? steps[shown - 1] : undefined;
  /** What the board shows: mid-turn, the state as of the latest step. */
  const view = current?.frame ?? state;
  const done = !busy && state.round > 0;
  const take = takeCount(state);
  const firing = current?.col ?? null;
  const visible = steps.slice(0, shown).filter((step) => step.text !== "");
  const rivalLine = [...visible]
    .reverse()
    .find((step) => step.tone === "rival");
  const rivalFlash = current?.tone === "rival";
  const goal = state.goalResults[0];
  const cats = view.board.hunt;
  const score = playerScore(view).total;
  const rivalTotal = rivalScore(view);

  const hunt = () => {
    setSteps(turnSteps(state, { type: "hunt", dice }));
    setShown(1);
    setBusy(true);
  };

  const dealAgain = () => {
    const fresh = deal(deals + 1);
    setDeals(deals + 1);
    setState(fresh);
    setDice(firstDice(fresh));
    setSteps([]);
    setShown(0);
  };

  const turnsLeft = done ? 0 : view.turnsLeft;
  const takeLabel = `Take ${plural(take, "die", "dice")}`;

  return (
    <div
      data-won={done && score > rivalTotal}
      data-busy={busy}
      data-firing={firing ?? undefined}
      className="text-ink px-2 pt-7 pb-3 sm:px-3 lg:pt-6 lg:pb-3.5"
    >
      <div className="grid gap-x-4 gap-y-3.5 md:grid-cols-[minmax(0,1fr)_16rem] lg:grid-cols-[minmax(0,1fr)_18.5rem]">
        <div className="flex min-w-0 flex-col gap-3.5">
          <section
            aria-label="Hunt row"
            className="mat flex flex-col gap-2.5 p-2 pb-3 sm:p-2.5 sm:pb-3.5"
          >
            <div className="flex items-stretch justify-between gap-3">
              <div
                className={`piece border-ink flex min-h-12 items-center gap-2.5 border-2 py-1.5 pr-4 pl-2.5 ${done ? "bg-cloth" : "bg-lime is-pressed"}`}
              >
                <PixelIcon name="paw" size={24} fill={WHITE} ink={INK} />
                <div className="flex min-w-0 flex-col gap-1">
                  <h2 className="text-print text-xl">Hunt</h2>
                  <p className="text-xs leading-none font-bold">
                    {done ? "Round over" : takeLabel}
                  </p>
                </div>
              </div>
              <p className="flex flex-col items-end justify-center gap-1.5">
                <span className="text-print text-xl">Round 1</span>
                <span className="flex items-center gap-1" aria-hidden>
                  {Array.from({ length: ROUND_TURNS[0] }, (_, i) => (
                    <TurnCube key={i} spent={i >= turnsLeft} />
                  ))}
                </span>
                <span className="sr-only">
                  {done
                    ? "is over."
                    : `${turnsLeft} of ${ROUND_TURNS[0]} turns left.`}
                </span>
              </p>
            </div>

            <div className="grid min-w-0 grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,0.6fr)_1.25rem] gap-x-1 sm:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,0.6fr)_2.75rem] sm:gap-x-1.5 lg:grid-cols-[repeat(4,minmax(0,1fr))_2.75rem]">
              <ol className="contents">
                {Array.from({ length: SLOTS }, (_, col) => {
                  const placed = cats[col];
                  if (!placed) {
                    const cost = COLUMN_YARN_COST[col] ?? 0;
                    const next = col === cats.length;
                    return (
                      <li
                        key={col}
                        className={`flex min-h-28 flex-col items-center justify-center gap-1.5 border-2 p-1 text-center text-[11px] leading-tight font-bold ${next ? "border-ink/55 border-dashed bg-white/45" : "border-sky-deep"}`}
                      >
                        <span className="sr-only">Empty space {col + 1}. </span>
                        <SpaceCost cost={cost} className="flex-col gap-1.5" />
                      </li>
                    );
                  }
                  const cat = getCat(placed.catId);
                  return (
                    <li key={col} className="min-w-0">
                      <div
                        // Cats tucked underneath show as a thicker edge. The
                        // left edge is the cat's element, as on its card.
                        style={{
                          ["--e" as string]: `${2 + 2 * Math.min(placed.tucked, 2)}px`,
                          ["--element" as string]:
                            ELEMENT_PALETTES[cat.element]["1"],
                        }}
                        className={`piece cat-tile border-ink bg-cream flex h-full min-h-28 flex-col items-center gap-1 border-2 pt-1 pb-1.5 text-center ${firing === col ? "anim-fire" : ""}`}
                      >
                        <span className="border-ink ml-1.5 self-start border bg-white px-1 text-[10px] leading-4 font-bold sm:text-[11px]">
                          Fires {ORDINALS[cats.length - 1 - col]}
                        </span>
                        <span className="relative">
                          <PixelSprite
                            catId={cat.id}
                            size={48}
                            decorative
                            className="sm:h-16 sm:w-16"
                          />
                          {/* The firing tag has the tile's corner here, so the
                              element hangs off the sprite's, clear of the ear. */}
                          <span className="mark-rim absolute top-0 -left-2.5 flex">
                            <ElementMark element={cat.element} label />
                          </span>
                          {placed.tucked > 0 ? (
                            <span className="border-ink absolute -bottom-0.5 -left-1 flex items-center border bg-white pr-0.5 text-[11px] leading-none font-bold tabular-nums">
                              <PixelIcon name="tucked" size={16} fill={LIME} />
                              <span aria-hidden>{placed.tucked}</span>
                              <span className="sr-only">
                                Tucked {placed.tucked}
                              </span>
                            </span>
                          ) : null}
                        </span>
                        <span
                          lang="en"
                          className="w-full text-[10px] leading-tight font-black tracking-tighter [overflow-wrap:anywhere] hyphens-auto sm:text-[11px] sm:tracking-tight"
                        >
                          {cat.name}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
              <p className="flex flex-col items-center justify-center gap-1.5">
                <PixelIcon name="chevron" size={16} ink={COBALT} />
                <span className="sr-only">Powers fire from right to left.</span>
                <span
                  className="text-pixel flex flex-col items-center gap-0.5 text-sm leading-none tabular-nums sm:flex-row"
                  aria-hidden
                >
                  {ROW_REWARD.hunt[SLOTS]}
                  <PixelIcon name="die" size={16} />
                </span>
              </p>
            </div>

            <ol className="text-xs leading-snug">
              {[...cats].reverse().map((placed, i) => {
                const col = cats.length - 1 - i;
                const cat = getCat(placed.catId);
                return (
                  <li
                    key={col}
                    className={`px-1 py-px ${firing === col ? "bg-lime shadow-[inset_0_0_0_2px_var(--color-ink)]" : ""}`}
                  >
                    <span className="font-black">{cat.name}.</span>{" "}
                    {cat.power ? describePower(cat.power) : "No power."}
                  </li>
                );
              })}
            </ol>
          </section>

          <div className="tray-well flex flex-col gap-2.5 px-2 pt-1.5 pb-2.5 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            {done ? (
              <>
                <p className="max-w-[46ch] self-center text-sm leading-snug">
                  That was one row for one round. A match has three rows and
                  three rounds, and you build the rows yourself.
                </p>
                <div className="flex shrink-0 gap-2.5">
                  <TableLink href="/signup" variant="primary">
                    Start a run
                  </TableLink>
                  <TableButton
                    variant="secondary"
                    size="md"
                    onClick={dealAgain}
                    className="bg-white!"
                  >
                    Deal again
                  </TableButton>
                </div>
              </>
            ) : (
              <>
                <div className="min-w-0 flex-1">
                  <Label>
                    {busy
                      ? "Feeder"
                      : `Feeder. Pick ${plural(take, "die", "dice")}.`}
                  </Label>
                  <div className="mt-1 grid max-w-sm grid-cols-5 gap-1.5">
                    {view.feeder.map((face, index) => (
                      <Die
                        key={`${view.step}-${view.feeder.length}-${index}`}
                        face={face}
                        selected={!busy && dice.includes(index)}
                        disabled={busy}
                        onClick={() => setDice(toggleDie(dice, index, take))}
                      />
                    ))}
                  </div>
                </div>
                <TableButton
                  size="md"
                  disabled={busy || dice.length !== take}
                  onClick={hunt}
                  className={`shrink-0 sm:min-w-32 ${busy ? "bg-lime! text-ink! is-pressed disabled:opacity-100" : ""}`}
                >
                  {busy ? "Hunting" : takeLabel}
                </TableButton>
              </>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3.5">
          <Nameplate rivalId={RIVAL_ID} />

          <div
            className={`piece piece-card border-ink border-2 px-2.5 py-1.5 ${rivalFlash ? "bg-coral anim-flip" : rivalLine ? "bg-cream" : "bg-cloth"}`}
          >
            <p className="text-sm leading-snug font-black" aria-live="polite">
              {rivalLine ? rivalLine.text : "Has not flipped a card yet"}
            </p>
            <p className="text-[11px] leading-snug font-semibold">
              {rivalLine?.rival === "burn"
                ? "Burned from the tray, not from your row."
                : "Flips one card after each of your turns."}
            </p>
          </div>

          <div className="piece border-ink flex min-h-40 flex-1 flex-col border-2 bg-white px-2.5 py-2">
            <h3 className="text-print text-xl">What just happened</h3>
            <div
              aria-live="polite"
              className="mt-1.5 space-y-1 text-[13px] leading-[1.3]"
            >
              {visible.length === 0 ? (
                <p className="text-ink-soft">
                  Take the dice. The row pays, then each cat fires, starting
                  from the right. This is the real engine; nothing is saved.
                </p>
              ) : (
                visible
                  .filter((step) => step.tone !== "rival")
                  .map((step, i) => (
                    <p
                      key={i}
                      className={
                        step.tone === "note" && i > 0
                          ? "text-ink-soft"
                          : i === 0
                            ? "font-bold"
                            : undefined
                      }
                    >
                      {step.text}
                    </p>
                  ))
              )}
              {done && goal ? (
                <p className="border-ink bg-lime border-2 px-1.5 py-0.5 font-bold">
                  Round 1 goal, {goalText(RIVAL_ID, goal)}
                </p>
              ) : null}
            </div>
          </div>

          <div>
            <Label>Your food</Label>
            <ul className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              {ESSENCES.map((kind) => (
                <EssenceToken
                  key={kind}
                  kind={kind}
                  count={view.essence[kind]}
                />
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Docked on the frame's right edge where there is a margin to dock in. */}
      <div className="mt-3.5 flex gap-3 pb-1 lg:absolute lg:top-6 lg:left-full lg:mt-0 lg:flex-col lg:gap-4 lg:[--cast:var(--color-sky-deep)]">
        <p className="piece border-ink bg-lime flex min-w-16 flex-col items-center border-2 px-2 py-1">
          <span className="text-[11px] leading-tight font-bold">You</span>
          <span className="text-print text-3xl tabular-nums">{score}</span>
        </p>
        <p className="piece border-ink bg-coral flex min-w-16 flex-col items-center border-2 px-2 py-1">
          <span className="text-[11px] leading-tight font-bold whitespace-nowrap">
            {rival.name}
          </span>
          <span className="text-print text-3xl tabular-nums">{rivalTotal}</span>
        </p>
      </div>
    </div>
  );
}
