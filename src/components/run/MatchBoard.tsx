"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { ROWS, type Row } from "~/server/game/cats";
import type { Action, Essence, SlotRef } from "~/server/game/match";
import { CLANS } from "~/server/game/run";
import type { MatchView, RunView } from "~/server/game/view";

import { BoardRow } from "./BoardRow";
import { CatDetail, type TuckedUnder } from "./CatPick";
import {
  plural,
  type GoalEvent,
  type LogEntry,
  type RivalNews,
} from "./describe";
import { fly, launchFrom, type Launch } from "./flight";
import { EventLog, GoalNotice } from "./MatchPanels";
import { RelicTiles } from "./pieces";
import { PlayerEdge, type TurnControls } from "./PlayerEdge";
import { RivalSide } from "./RivalSide";
import { RoundBoard } from "./RoundBoard";
import { Scorepad } from "./Scorepad";
import { Supply } from "./Supply";
import {
  canSwapMore,
  deckPicks,
  fillYarn,
  huntTake,
  IDLE,
  swapOwed,
  toggleDie,
  yarnRoom,
  type Mode,
} from "./turn";
import { usePlayback } from "./usePlayback";
import type { TurnRecord } from "./useRunController";

/** Scrolls a zone into the clear space between the top bar and the edge. */
function reveal(element: Element | null | undefined): void {
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const edge = document.querySelector(".rail")?.getBoundingClientRect().top;
  if (rect.top >= 64 && rect.bottom <= (edge ?? window.innerHeight)) return;
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  element.scrollIntoView({
    block: "center",
    behavior: calm ? "auto" : "smooth",
  });
}

/** The lane each key activates, or plays the chosen card into. */
const LANE_KEYS: Record<string, Row> = { h: "hunt", d: "den", p: "prowl" };

/**
 * The pieces an action moves from one zone to another, copied where they
 * stand now so they can be flown to where they land.
 */
function launchesFor(
  root: HTMLElement | null,
  match: MatchView,
  action: Action,
): Launch[] {
  const from = (source: string, target: string, hide = true): Launch[] => {
    const launch = launchFrom(root, source, target, hide);
    return launch ? [launch] : [];
  };
  switch (action.type) {
    case "play":
      return from(
        `[data-hand="${action.hand}"]`,
        `[data-slot="${action.row}-${match.board[action.row].length}"]`,
      );
    case "hunt":
      return action.dice.flatMap((die) =>
        from(
          `[data-die="${die}"]`,
          `[data-essence="${match.feeder[die]}"]`,
          false,
        ),
      );
    case "prowl": {
      // Tray picks reach the hand highest index first, then the deck's.
      const order = [
        ...action.picks
          .filter((pick): pick is number => pick !== "deck")
          .sort((a, b) => b - a),
        ...action.picks.filter((pick) => pick === "deck"),
      ];
      return order.flatMap((pick, i) =>
        from(
          pick === "deck" ? '[data-pile="deck"]' : `[data-tray="${pick}"]`,
          `[data-hand="${match.hand.length + i}"]`,
        ),
      );
    }
    case "resolve": {
      const slot = match.pending?.slot;
      return match.pending?.kind === "tuckHand" &&
        action.choice !== null &&
        slot
        ? from(
            `[data-hand="${action.choice}"]`,
            `[data-slot="${slot.row}-${slot.col}"]`,
            false,
          )
        : [];
    }
    default:
      return [];
  }
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
  /** The turn still to be played back on the table, if any. */
  turn: TurnRecord | null;
  onTurnPlayed: (id: number) => void;
  /** The run's own strip: the gauntlet track and the way out. */
  runStrip: ReactNode;
  /** The same strip cut down for the column beside the table. */
  sideStrip: ReactNode;
}

/**
 * The match as a table: the rival across, the shared supply, the player's
 * mat of three lanes, and the player's edge docked at the bottom. A turn
 * that has just been answered is played back step by step before the table
 * takes input again.
 */
export function MatchBoard({
  run,
  match: served,
  busy: sending,
  onAct,
  log,
  news,
  goal,
  onDismissGoal,
  turn,
  onTurnPlayed,
  runStrip,
  sideStrip,
}: MatchBoardProps) {
  const { frame, playing, skip } = usePlayback(turn, onTurnPlayed);
  /** What the table shows: a step of the turn landing, else the server's view. */
  const match = frame?.view ?? served;
  const busy = sending || playing;

  // A choice in progress belongs to one server step; a new step discards it.
  const [draft, setDraft] = useState<{ step: number; mode: Mode }>({
    step: served.step,
    mode: IDLE,
  });
  const [detail, setDetail] = useState<{
    catId: string;
    tucked?: TuckedUnder;
  } | null>(null);
  const showCard = (catId: string) => setDetail({ catId });
  const tableRef = useRef<HTMLDivElement>(null);
  const matRef = useRef<HTMLElement>(null);
  const supplyRef = useRef<HTMLDivElement>(null);
  const launches = useRef<Launch[]>([]);

  const drafted = draft.step === served.step && !playing ? draft.mode : IDLE;
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
  const setMode = (next: Mode) => setDraft({ step: served.step, mode: next });

  // Pieces leave for their new zone as soon as the answered turn is drawn.
  const turnId = turn?.id ?? null;
  useLayoutEffect(() => {
    if (turnId === null) return;
    fly(tableRef.current, launches.current);
    launches.current = [];
  }, [turnId]);

  const act = (action: Action) => {
    launches.current = launchesFor(tableRef.current, match, action);
    onAct(action);
  };

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
        return act({ type: "hunt", dice: match.feeder.map((_, i) => i) });
      }
      setMode({ kind: "hunt", dice: [] });
      return reveal(supplyRef.current);
    }
    if (row === "den") {
      setMode({ kind: "den", targets: [] });
      return reveal(matRef.current);
    }
    if (match.prowlPicks === 0) return act({ type: "prowl", picks: [] });
    setMode({ kind: "prowl", picks: [] });
    reveal(supplyRef.current);
  };

  const controls: TurnControls = {
    mode,
    busy,
    take,
    playInto: (row) => {
      if (
        mode.kind === "play" &&
        (match.playable[mode.hand] ?? []).includes(row) &&
        mode.swap.length === swapOwed(match, mode.hand)
      ) {
        act(
          mode.swap.length > 0
            ? { type: "play", hand: mode.hand, row, swap: mode.swap }
            : { type: "play", hand: mode.hand, row },
        );
      }
    },
    swapEssence: (kind: Essence) => {
      if (mode.kind !== "play" || busy) return;
      if (canSwapMore(match, mode.hand, mode.swap, kind)) {
        return setMode({ ...mode, swap: [...mode.swap, kind] });
      }
      // Nothing more of it can go in, so the tap takes one back.
      const last = mode.swap.lastIndexOf(kind);
      if (last >= 0) {
        setMode({ ...mode, swap: mode.swap.filter((_, i) => i !== last) });
      }
    },
    undoSwap: () => {
      if (mode.kind !== "play") return;
      setMode({ ...mode, swap: mode.swap.slice(0, -1) });
    },
    cancel: () => setMode(IDLE),
    confirm: () => {
      if (mode.kind === "hunt" && mode.dice.length === take) {
        act({ type: "hunt", dice: mode.dice });
      }
      if (mode.kind === "den") act({ type: "den", targets: mode.targets });
      if (mode.kind === "prowl" && mode.picks.length === match.prowlPicks) {
        act({ type: "prowl", picks: mode.picks });
      }
      if (mode.kind === "tuck" && mode.hand !== null) {
        act({ type: "resolve", choice: mode.hand });
      }
      if (match.pending?.kind === "trade") act({ type: "resolve", choice: 1 });
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
    resolve: (choice) => act({ type: "resolve", choice }),
  };

  const onSlot = (slot: SlotRef) => {
    if (mode.kind !== "den") {
      const placed = match.board[slot.row][slot.col];
      if (placed) {
        setDetail({
          catId: placed.catId,
          tucked: { count: placed.tucked, under: placed.under ?? [] },
        });
      }
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
    if (busy || match.hand[index] === undefined) return;
    if (mode.kind === "tuck") {
      return setMode({
        kind: "tuck",
        hand: mode.hand === index ? null : index,
      });
    }
    if (match.phase !== "turn") return;
    if (mode.kind === "play" && mode.hand === index) return setMode(IDLE);
    setMode({ kind: "play", hand: index, swap: [] });
    // On a phone the lane that can take the card may be off screen.
    const lane = (match.playable[index] ?? [])[0];
    reveal(tableRef.current?.querySelector(`[data-lane="${lane ?? "hunt"}"]`));
  };

  const onDie = (index: number) => {
    if (mode.kind !== "hunt" || match.feeder[index] === undefined) return;
    setMode({ kind: "hunt", dice: toggleDie(mode.dice, index, take) });
  };

  const onTrayCard = (index: number) => {
    if (mode.kind !== "prowl" || match.tray[index] === undefined) return;
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

  const changeDeckPicks = (delta: 1 | -1) => {
    if (mode.kind !== "prowl") return;
    if (delta === 1) {
      if (
        mode.picks.length < match.prowlPicks &&
        deckPicks(mode.picks) < deckAvailable
      ) {
        setMode({ kind: "prowl", picks: [...mode.picks, "deck"] });
      }
      return;
    }
    const last = mode.picks.lastIndexOf("deck");
    setMode({ kind: "prowl", picks: mode.picks.filter((_, i) => i !== last) });
  };

  /** The nth cat on the mat, reading the lanes top to bottom. */
  const nthPlaced = (n: number): SlotRef | null => {
    const slots = ROWS.flatMap((row) =>
      match.board[row].map((_, col) => ({ row, col })),
    );
    return slots[n] ?? null;
  };

  // The keys do what the pieces do. They read the latest handlers through a
  // ref, so the listener is bound once.
  const onKey = (event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey || busy) return;
    if (document.querySelector('[role="dialog"]')) return;
    const target = event.target;
    const typing =
      target instanceof HTMLElement &&
      (target.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
    if (typing) return;
    const key = event.key.toLowerCase();

    if (key === "escape" && mode.kind !== "idle" && mode.kind !== "tuck") {
      event.preventDefault();
      return setMode(IDLE);
    }
    if (key === "enter") {
      // A focused control keeps its own Enter.
      if (
        target instanceof HTMLElement &&
        ["BUTTON", "A", "SUMMARY"].includes(target.tagName)
      ) {
        return;
      }
      event.preventDefault();
      return controls.confirm();
    }
    const lane = LANE_KEYS[key];
    if (lane && !match.pending) {
      event.preventDefault();
      if (mode.kind === "play") return controls.playInto(lane);
      return activate(lane);
    }
    if (/^[0-9]$/.test(key)) {
      const n = Number(key) - 1;
      event.preventDefault();
      if (mode.kind === "hunt") return onDie(n);
      if (mode.kind === "prowl") {
        return n < 0 ? changeDeckPicks(1) : onTrayCard(n);
      }
      if (mode.kind === "den") {
        const slot = nthPlaced(n);
        return slot ? onSlot(slot) : undefined;
      }
      if (n >= 0) onHandCard(n);
    }
  };
  const keyRef = useRef(onKey);
  useEffect(() => {
    keyRef.current = onKey;
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => keyRef.current(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  // The lane being resolved keeps its tile down until the chain has run.
  const resolving: Row | null = !playing
    ? null
    : turn?.action.type === "hunt" ||
        turn?.action.type === "den" ||
        turn?.action.type === "prowl"
      ? turn.action.type
      : turn?.action.type === "resolve"
        ? (turn.before.pending?.slot.row ?? null)
        : null;

  // On a phone the choice was made at the feeder or in the hand; the chain
  // fires on the mat, so the lane it runs along is brought into view.
  const firingRow = frame?.firing?.row ?? null;
  const watched = firingRow ?? resolving;
  useEffect(() => {
    if (watched === null) return;
    reveal(tableRef.current?.querySelector(`[data-lane="${watched}"]`));
  }, [watched, turnId]);

  // Until the rival's card turns over, its last one is still face up.
  const shownNews =
    playing && !frame?.flipped ? (turn?.rivalBefore ?? null) : news;

  return (
    <div ref={tableRef} className="flex flex-1 flex-col">
      <h1 className="sr-only">
        Match {run.matchIndex + 1} of {run.gauntlet.length}
      </h1>
      <div className="mx-auto grid w-full max-w-[1400px] flex-1 content-start gap-x-4 gap-y-3 px-3 pt-2.5 pb-3 lg:grid-cols-[minmax(0,1fr)_17.5rem]">
        <div className="flex min-w-0 flex-col gap-2.5">
          <div className="lg:hidden">{runStrip}</div>

          <RivalSide
            match={match}
            news={shownNews}
            flipping={frame?.flipping ?? false}
          />

          <section
            ref={matRef}
            aria-label="Your mat"
            className="mat order-2 lg:order-3"
          >
            <RoundBoard match={match} className="px-2 pt-2 pb-3.5 sm:px-3" />
            <div className="divide-sky-deep border-sky-deep divide-y-2 border-t-2">
              {ROWS.map((row) => (
                <BoardRow
                  key={row}
                  row={row}
                  match={match}
                  mode={mode}
                  busy={busy}
                  activateLabel={labels[row]}
                  firing={frame?.firing ?? null}
                  resolving={resolving === row}
                  onActivate={() => activate(row)}
                  onPlayHere={() => controls.playInto(row)}
                  onSlot={onSlot}
                />
              ))}
            </div>
          </section>

          <div ref={supplyRef} className="order-3 lg:order-2">
            <Supply
              match={match}
              mode={mode}
              busy={busy}
              take={take}
              rolling={frame?.rolling ?? false}
              onDie={onDie}
              onTrayCard={onTrayCard}
              onDeckPicks={changeDeckPicks}
              onReroll={() => act({ type: "reroll" })}
              onDetail={showCard}
              deckNote={`${CLANS[run.clanId].name} deck, ${plural(run.deck.length, "card")}.`}
            />
          </div>
        </div>

        {/* Beside the table the pad takes the table's height and scrolls in
            place, so it never makes the page longer than the table. */}
        <div className="relative min-w-0">
          <aside className="flex flex-col gap-3.5 lg:absolute lg:inset-0 lg:gap-2.5 lg:overflow-y-auto lg:pb-3">
            <div className="hidden lg:block">{sideStrip}</div>
            <Scorepad match={match} />
            <section aria-label="Your relics">
              <RelicTiles relicIds={run.relics} />
            </section>
            <EventLog
              log={log}
              landed={playing ? frame?.lines : undefined}
              className="max-h-80 lg:max-h-none lg:min-h-40 lg:flex-1"
            />
          </aside>
        </div>
      </div>

      <PlayerEdge
        match={match}
        turn={controls}
        playing={playing ? (frame?.text ?? "") : null}
        rivalStep={playing && frame?.tone === "rival"}
        onSkip={skip}
        onHandCard={onHandCard}
        onDetail={showCard}
      />

      <CatDetail
        catId={detail?.catId ?? null}
        tucked={detail?.tucked}
        onClose={() => setDetail(null)}
      />
      <GoalNotice
        match={served}
        goal={playing ? null : goal}
        onClose={onDismissGoal}
      />
    </div>
  );
}
