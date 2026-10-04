"use client";

import { useEffect, useRef, useState } from "react";

import { EssencePip } from "~/components/cats/CatCard";
import { Button } from "~/components/ui";
import { ROWS, type Row } from "~/server/game/cats";
import { ESSENCES, type Action, type SlotRef } from "~/server/game/match";
import { getRival } from "~/server/game/rival";
import type { MatchView, RunView } from "~/server/game/view";

import { ActionDock, type TurnControls } from "./ActionDock";
import { BoardRow } from "./BoardRow";
import { CatDetail, CatPick } from "./CatPick";
import {
  essenceLabel,
  plural,
  type GoalEvent,
  type LogEntry,
  type RivalNews,
} from "./describe";
import {
  EventLog,
  GoalNotice,
  GoalPanel,
  RivalPanel,
  StatusStrip,
} from "./MatchPanels";
import { Die, Label, RelicList } from "./pieces";
import {
  deckPicks,
  fillYarn,
  huntTake,
  IDLE,
  toggleDie,
  whyUnplayable,
  yarnRoom,
  type Mode,
} from "./turn";

/** Scrolls a section into the clear space between the top bar and the dock. */
function reveal(element: HTMLElement | null): void {
  if (!element) return;
  const rect = element.getBoundingClientRect();
  if (rect.top >= 64 && rect.bottom <= window.innerHeight - 220) return;
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  element.scrollIntoView({
    block: "center",
    behavior: calm ? "auto" : "smooth",
  });
}

export interface MatchBoardProps {
  run: RunView;
  match: MatchView;
  busy: boolean;
  onAct: (action: Action) => void;
  log: readonly LogEntry[];
  news: RivalNews | null;
  goal: GoalEvent | null;
  onDismissGoal: () => void;
}

/** The match in play: everything needed for a decision, and one way to make it. */
export function MatchBoard({
  run,
  match,
  busy,
  onAct,
  log,
  news,
  goal,
  onDismissGoal,
}: MatchBoardProps) {
  // A choice in progress belongs to one server step; a new step discards it.
  const [draft, setDraft] = useState<{ step: number; mode: Mode }>({
    step: match.step,
    mode: IDLE,
  });
  const [detail, setDetail] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const supplyRef = useRef<HTMLElement>(null);
  const handRef = useRef<HTMLElement>(null);

  const drafted = draft.step === match.step ? draft.mode : IDLE;
  const tucking = match.pending?.kind === "tuckHand";
  const mode: Mode = match.pending
    ? tucking && drafted.kind === "tuck"
      ? drafted
      : tucking
        ? { kind: "tuck", hand: null }
        : IDLE
    : drafted.kind === "tuck"
      ? IDLE
      : drafted;
  const setMode = (next: Mode) => setDraft({ step: match.step, mode: next });

  // A tuck is answered from the hand, which may be off screen on a phone.
  useEffect(() => {
    if (tucking) reveal(handRef.current);
  }, [tucking, match.step]);

  const take = huntTake(match);
  const deckAvailable = match.deckCount + match.discardCount;
  const labels: Record<Row, string> = {
    hunt: `Take ${plural(take, "die", "dice")}`,
    den: `Lay ${match.rewards.den} yarn`,
    prowl: `Draw ${plural(match.prowlPicks, "cat")}`,
  };

  const activate = (row: Row) => {
    if (match.phase !== "turn" || busy) return;
    if (mode.kind === row) return setMode(IDLE);
    if (row === "hunt") {
      // Nothing to choose when the Hunt takes every die that is left.
      if (take === match.feeder.length) {
        return onAct({ type: "hunt", dice: match.feeder.map((_, i) => i) });
      }
      setMode({ kind: "hunt", dice: [] });
      return reveal(supplyRef.current);
    }
    if (row === "den") {
      setMode({ kind: "den", targets: [] });
      return reveal(boardRef.current);
    }
    if (match.prowlPicks === 0) return onAct({ type: "prowl", picks: [] });
    setMode({ kind: "prowl", picks: [] });
    reveal(supplyRef.current);
  };

  const turn: TurnControls = {
    mode,
    busy,
    labels,
    take,
    activate,
    playInto: (row) => {
      if (mode.kind === "play") onAct({ type: "play", hand: mode.hand, row });
    },
    cancel: () => setMode(IDLE),
    confirm: () => {
      if (mode.kind === "hunt") onAct({ type: "hunt", dice: mode.dice });
      if (mode.kind === "den") onAct({ type: "den", targets: mode.targets });
      if (mode.kind === "prowl") onAct({ type: "prowl", picks: mode.picks });
    },
    fillDen: () => {
      if (mode.kind !== "den") return;
      setMode({
        kind: "den",
        targets: fillYarn(match.board, mode.targets, match.rewards.den),
      });
    },
    undoDen: () => {
      if (mode.kind !== "den") return;
      setMode({ kind: "den", targets: mode.targets.slice(0, -1) });
    },
    resolve: (choice) => onAct({ type: "resolve", choice }),
  };

  const onSlot = (slot: SlotRef) => {
    if (mode.kind !== "den") {
      const placed = match.board[slot.row][slot.col];
      if (placed) setDetail(placed.catId);
      return;
    }
    if (
      mode.targets.length < match.rewards.den &&
      yarnRoom(match.board, mode.targets, slot) > 0
    ) {
      setMode({ kind: "den", targets: [...mode.targets, slot] });
    }
  };

  const onHandCard = (index: number) => {
    if (mode.kind === "tuck") {
      return setMode({
        kind: "tuck",
        hand: mode.hand === index ? null : index,
      });
    }
    if (match.phase !== "turn") return;
    setMode(
      mode.kind === "play" && mode.hand === index
        ? IDLE
        : { kind: "play", hand: index },
    );
  };

  const onTrayCard = (index: number) => {
    if (mode.kind !== "prowl") return;
    if (mode.picks.includes(index)) {
      return setMode({
        kind: "prowl",
        picks: mode.picks.filter((pick) => pick !== index),
      });
    }
    if (mode.picks.length < match.prowlPicks) {
      setMode({ kind: "prowl", picks: [...mode.picks, index] });
    }
  };

  const fromDeck = mode.kind === "prowl" ? deckPicks(mode.picks) : 0;
  const changeDeckPicks = (delta: 1 | -1) => {
    if (mode.kind !== "prowl") return;
    if (delta === 1) {
      return setMode({ kind: "prowl", picks: [...mode.picks, "deck"] });
    }
    const last = mode.picks.lastIndexOf("deck");
    setMode({ kind: "prowl", picks: mode.picks.filter((_, i) => i !== last) });
  };

  const selectedHand =
    mode.kind === "play" || mode.kind === "tuck" ? mode.hand : null;
  const { score } = match;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h1 className="text-pixel text-ink text-xl sm:text-2xl">
          Match {run.matchIndex + 1} of {run.gauntlet.length}
        </h1>
        <p className="text-ink-soft text-sm font-bold">
          against {getRival(match.rivalId).name}
        </p>
      </div>
      <StatusStrip match={match} />

      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
        <div className="contents lg:block lg:space-y-3">
          <div ref={boardRef} className="order-1 space-y-2">
            {ROWS.map((row) => (
              <BoardRow
                key={row}
                row={row}
                match={match}
                mode={mode}
                busy={busy}
                activateLabel={labels[row]}
                onActivate={() => activate(row)}
                onPlayHere={() => turn.playInto(row)}
                onSlot={onSlot}
              />
            ))}
            <p className="text-ink-soft px-1 text-xs leading-snug">
              Activating a row gives its reward, then fires each power in it
              from right to left. Either way it is your whole turn.
            </p>
          </div>

          <section ref={handRef} className="panel order-2 space-y-3 p-3">
            <div>
              <Label>Your essence</Label>
              <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1.5">
                {ESSENCES.map((kind) => (
                  <li
                    key={kind}
                    className={`text-ink flex items-center gap-1 text-sm font-bold tabular-nums ${match.essence[kind] === 0 ? "opacity-45" : ""}`}
                  >
                    <EssencePip kind={kind} size={18} />
                    <span aria-hidden>{match.essence[kind]}</span>
                    <span className="sr-only">
                      {match.essence[kind]} {essenceLabel(kind)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <Label>Your hand, {plural(match.hand.length, "cat")}</Label>
              {match.hand.length === 0 ? (
                <p className="text-ink-soft mt-1 text-sm">
                  Empty. The Prowl draws more.
                </p>
              ) : (
                <ul className="-mx-1 mt-0.5 flex gap-2 overflow-x-auto p-2 sm:flex-wrap sm:overflow-visible">
                  {match.hand.map((catId, index) => (
                    <li key={`${index}-${catId}`} className="w-52 shrink-0">
                      <CatPick
                        catId={catId}
                        verb={mode.kind === "tuck" ? "Choose" : "Play"}
                        onDetail={() => setDetail(catId)}
                        onSelect={() => onHandCard(index)}
                        selected={selectedHand === index}
                        pickable={mode.kind === "tuck"}
                        disabled={busy || match.phase === "over"}
                        dimmed={
                          match.phase === "turn" &&
                          whyUnplayable(match, index) !== null
                        }
                        className="h-full"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section ref={supplyRef} className="panel order-3 space-y-3 p-3">
            <div>
              <div className="flex items-center justify-between gap-2">
                <Label>Feeder</Label>
                {match.canReroll ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => onAct({ type: "reroll" })}
                  >
                    Reroll, free
                  </Button>
                ) : null}
              </div>
              <ul className="mt-1.5 grid max-w-sm grid-cols-5 gap-1.5">
                {match.feeder.map((face, index) => (
                  <li key={index}>
                    <Die
                      face={face}
                      selected={
                        mode.kind === "hunt" && mode.dice.includes(index)
                      }
                      disabled={busy}
                      onClick={
                        mode.kind === "hunt"
                          ? () =>
                              setMode({
                                kind: "hunt",
                                dice: toggleDie(mode.dice, index, take),
                              })
                          : undefined
                      }
                    />
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-ink text-sm font-semibold">
                Deck {match.deckCount} · Discard {match.discardCount}
              </p>
              {mode.kind === "prowl" ? (
                <div className="flex items-center gap-2">
                  <StepButton
                    label="Take one fewer from the deck"
                    disabled={busy || fromDeck === 0}
                    onClick={() => changeDeckPicks(-1)}
                  >
                    −
                  </StepButton>
                  <span className="text-ink text-sm font-bold tabular-nums">
                    {fromDeck} from the deck
                  </span>
                  <StepButton
                    label="Take one more from the deck"
                    disabled={
                      busy ||
                      mode.picks.length >= match.prowlPicks ||
                      fromDeck >= deckAvailable
                    }
                    onClick={() => changeDeckPicks(1)}
                  >
                    +
                  </StepButton>
                </div>
              ) : null}
            </div>

            <div>
              <Label>Tray</Label>
              {match.tray.length === 0 ? (
                <p className="text-ink-soft mt-1 text-sm">The tray is empty.</p>
              ) : (
                <ul className="mt-1.5 grid gap-2 p-1 sm:grid-cols-3">
                  {match.tray.map((catId, index) => {
                    const picked =
                      mode.kind === "prowl" && mode.picks.includes(index);
                    return (
                      <li key={`${index}-${catId}`}>
                        <CatPick
                          catId={catId}
                          verb="Draw"
                          onDetail={() => setDetail(catId)}
                          onSelect={
                            mode.kind === "prowl"
                              ? () => onTrayCard(index)
                              : undefined
                          }
                          selected={picked}
                          pickable={mode.kind === "prowl"}
                          disabled={
                            busy ||
                            (mode.kind === "prowl" &&
                              !picked &&
                              mode.picks.length >= match.prowlPicks)
                          }
                          className="h-full"
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>

        <div className="contents lg:block lg:space-y-3">
          <RivalPanel match={match} news={news} className="order-4" />
          <GoalPanel match={match} className="order-5" />
          <EventLog log={log} className="order-7" />
          <section className="panel order-6 space-y-2 p-3">
            <h2 className="text-pixel text-ink text-lg leading-tight">
              Your relics
            </h2>
            <RelicList relicIds={run.relics} />
            <p className="text-ink-soft text-xs leading-snug">
              Your score {score.total}: cats {score.cats}, yarn {score.yarn},
              cached {score.cached}, tucked {score.tucked}, goals {score.goals},
              relics {score.relics}.
            </p>
          </section>
        </div>
      </div>

      <ActionDock match={match} news={news} turn={turn} />

      <CatDetail catId={detail} onClose={() => setDetail(null)} />
      <GoalNotice match={match} goal={goal} onClose={onDismissGoal} />
    </div>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="border-ink text-ink hover:bg-sky-soft h-10 w-10 border-2 bg-white text-lg leading-none font-black disabled:cursor-not-allowed disabled:opacity-45"
    >
      {children}
    </button>
  );
}
