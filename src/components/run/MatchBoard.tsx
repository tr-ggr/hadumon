"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { MatHeader } from "~/components/mat/MatHeader";
import { ROWS, type Row } from "~/server/game/cats";
import {
  columnYarnCost,
  SLOTS,
  type Action,
  type Essence,
  type SlotRef,
} from "~/server/game/match";
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
import { matchFit } from "./layout";
import { markEnded } from "./fx/ended";
import { useFrameFx } from "./fx/useFrameFx";
import { EventLog, GoalNotice } from "./MatchPanels";
import { RelicTiles, TableButton } from "./pieces";
import { Hand } from "./Hand";
import { RivalMat } from "./RivalMat";
import { RivalSide } from "./RivalSide";
import { RoundBoard } from "./RoundBoard";
import { Scorepad } from "./Scorepad";
import { playCat, playSound } from "./sfx/engine";
import { Supply } from "./Supply";
import { TableSheet } from "./TableSheet";
import { TurnPanel, type TurnControls } from "./TurnPanel";
import { TurnPhone } from "./TurnPhone";
import {
  canSwapMore,
  deckPicks,
  denLimit,
  fillYarn,
  huntTake,
  IDLE,
  playBlock,
  prowlWant,
  swapOwed,
  toggleDie,
  yarnRoom,
  type Mode,
} from "./turn";
import { usePlayback } from "./usePlayback";
import type { TurnRecord } from "./useRunController";
import { useReducedMotion } from "./useStepper";

/** How many powers into a chain the player's score is as hot as it gets. */
const HEAT_STEPS = 6;

/**
 * Scrolls a zone into the clear space above the player's edge, and no
 * further than it takes. When that space can hold the whole of `within`,
 * all of it is brought in, so a lane comes with the rest of its mat.
 */
function reveal(
  zone: Element | null | undefined,
  within?: Element | null,
): void {
  // A match that fits its window has nothing out of view to bring in.
  if (matchFit(document.querySelector("[data-match]")) !== null) return;
  const edge = document.querySelector("[data-edge]")?.getBoundingClientRect();
  const top = 8;
  const bottom = (edge?.top ?? window.innerHeight) - 4;
  const whole = within?.getBoundingClientRect();
  const rect =
    whole && whole.height <= bottom - top
      ? whole
      : zone?.getBoundingClientRect();
  if (!rect || (rect.top >= top && rect.bottom <= bottom)) return;
  // A zone taller than the space shows its top. The move is a cut, like
  // every other on the table: nothing here eases.
  const fromTop = rect.top < top || rect.height > bottom - top;
  window.scrollBy({
    top: fromTop ? rect.top - top : rect.bottom - bottom,
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
  /** The same strip cut down for the rail beside the table. */
  sideStrip: ReactNode;
}

/**
 * The match as a table. Beside it, a rail down the left: the rival and the
 * rounds above the line, the player's turn below it. On the table, the
 * shared supply, the player's mat of three lanes, and the hand held as a fan
 * along the bottom edge; the score sheet, relics and log stand to the right.
 * Under 1024px it is one column with the turn and the hand docked below, and
 * on a short screen the mat stands above the supply, clear of a raised card.
 *
 * From 1024px by 600px the whole of it fits the window and nothing scrolls:
 * the mat takes whatever height the supply and the hand leave (`fit-wide`).
 * A short, wide window, which is a phone on its side, gets three columns
 * over a strip of hand (`fit-compact`), and a phone held upright is asked to
 * turn (`TurnPhone`). Any other window is the scrolling table it was.
 *
 * A turn that has just been answered is played back step by step before the
 * table takes input again, and each step sets off its own sound and effects.
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
  const { frame, index, playing, skip } = usePlayback(turn, onTurnPlayed);
  const calm = useReducedMotion();
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
  const showCard = (catId: string) => {
    playCat(catId);
    setDetail({ catId });
  };
  const [rivalMat, setRivalMat] = useState(false);
  /** The scores, the rounds and the log, where the table has no room for them. */
  const [sheet, setSheet] = useState(false);
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
  useFrameFx(tableRef, turnId, index, frame, calm);

  // The result sheet that follows a match's last turn counts its score up.
  const endedMatch = turn?.after.phase === "over" ? turn.after : null;
  useEffect(() => {
    if (endedMatch) markEnded(endedMatch);
  }, [endedMatch]);

  // The player's score warms from the third power of a chain on.
  const heat =
    playing && frame && !calm
      ? Math.min(1, Math.max(0, frame.cue.chain - 1) / HEAT_STEPS)
      : 0;

  const act = (action: Action) => {
    // A move sent sounds the same from a key as from the button for it.
    playSound("confirm");
    launches.current = launchesFor(tableRef.current, match, action);
    onAct(action);
  };

  // A lane's trade, once paid for, takes one more than its reward.
  const take = huntTake(match, mode.kind === "hunt" && mode.trade !== null);
  const yarnLimit = denLimit(match, mode);
  const want = prowlWant(match, mode);
  const deckAvailable = match.deckCount + match.discardCount;
  const labels: Record<Row, string> = {
    hunt: `Take ${plural(take, "die", "dice")}`,
    den: `Lay ${yarnLimit} yarn`,
    prowl: `Draw ${plural(want, "cat")}`,
  };

  const activate = (row: Row) => {
    if (match.phase !== "turn" || busy) return;
    if (mode.kind === row) {
      playSound("click");
      return setMode(IDLE);
    }
    if (row === "hunt") {
      // Nothing to choose when the Hunt takes every die that is left.
      if (take === match.feeder.length && !match.trades.hunt) {
        return act({ type: "hunt", dice: match.feeder.map((_, i) => i) });
      }
      playSound("click");
      setMode({ kind: "hunt", dice: [], trade: null });
      return reveal(supplyRef.current);
    }
    if (row === "den") {
      playSound("click");
      setMode({ kind: "den", targets: [], trade: null });
      return reveal(matRef.current);
    }
    if (match.prowlPicks === 0) return act({ type: "prowl", picks: [] });
    playSound("click");
    setMode({ kind: "prowl", picks: [], trade: null });
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
        playSound("pick");
        return setMode({ ...mode, swap: [...mode.swap, kind] });
      }
      // Nothing more of it can go in, so the tap takes one back.
      const last = mode.swap.lastIndexOf(kind);
      if (last >= 0) {
        playSound("click");
        setMode({ ...mode, swap: mode.swap.filter((_, i) => i !== last) });
      }
    },
    undoSwap: () => {
      if (mode.kind !== "play") return;
      playSound("click");
      setMode({ ...mode, swap: mode.swap.slice(0, -1) });
    },
    cancel: () => {
      playSound("click");
      setMode(IDLE);
    },
    confirm: () => {
      if (mode.kind === "hunt" && mode.dice.length === take) {
        act({
          type: "hunt",
          dice: mode.dice,
          ...(mode.trade === null ? {} : { trade: mode.trade }),
        });
      }
      // A Den's trade is made only when every yarn it buys is laid.
      if (
        mode.kind === "den" &&
        (mode.trade === null || mode.targets.length === yarnLimit)
      ) {
        act({
          type: "den",
          targets: mode.targets,
          ...(mode.trade === null ? {} : { trade: mode.trade }),
        });
      }
      if (mode.kind === "prowl" && mode.picks.length === want) {
        act({
          type: "prowl",
          picks: mode.picks,
          ...(mode.trade === null ? {} : { trade: mode.trade }),
        });
      }
      if (mode.kind === "tuck" && mode.hand !== null) {
        act({ type: "resolve", choice: mode.hand });
      }
      if (match.pending?.kind === "trade") act({ type: "resolve", choice: 1 });
    },
    fillDen: () => {
      if (mode.kind !== "den") return;
      playSound("yarn");
      setMode({
        ...mode,
        targets: fillYarn(match.board, mode.targets, yarnLimit),
      });
    },
    undoDen: () => {
      if (mode.kind !== "den") return;
      playSound("click");
      setMode({ ...mode, targets: mode.targets.slice(0, -1) });
    },
    tradeFood: (kind: Essence) => {
      if (mode.kind !== "den" || busy || !match.trades.den) return;
      if (mode.trade === kind) {
        // The yarn the trade bought goes back with it.
        playSound("click");
        return setMode({
          ...mode,
          trade: null,
          targets: mode.targets.slice(0, match.rewards.den),
        });
      }
      if (match.essence[kind] <= 0) return playSound("illegal");
      playSound("pick");
      setMode({ ...mode, trade: kind });
    },
    resolve: (choice) => act({ type: "resolve", choice }),
  };

  const onSlot = (slot: SlotRef) => {
    // A Prowl with its trade open is paid for with a yarn from a cat here.
    if (mode.kind === "prowl" && match.trades.prowl) {
      const paying =
        mode.trade?.row === slot.row && mode.trade.col === slot.col;
      if (paying) {
        playSound("click");
        return setMode({
          ...mode,
          trade: null,
          picks: mode.picks.slice(0, match.prowlPicks),
        });
      }
      if ((match.board[slot.row][slot.col]?.yarn ?? 0) <= 0) {
        return playSound("illegal");
      }
      playSound("pick");
      return setMode({ ...mode, trade: slot });
    }
    if (mode.kind !== "den") {
      const placed = match.board[slot.row][slot.col];
      if (placed) {
        playCat(placed.catId);
        setDetail({
          catId: placed.catId,
          tucked: { count: placed.tucked, under: placed.under ?? [] },
        });
      }
      return;
    }
    if (
      mode.targets.length < yarnLimit &&
      yarnRoom(match.board, mode.targets, slot) > 0
    ) {
      playSound("yarn");
      setMode({ ...mode, targets: [...mode.targets, slot] });
    } else {
      playSound("illegal");
    }
  };

  const onHandCard = (index: number) => {
    const catId = match.hand[index];
    if (busy || catId === undefined) return;
    if (mode.kind === "tuck") {
      if (mode.hand === index) playSound("click");
      else playCat(catId);
      return setMode({
        kind: "tuck",
        hand: mode.hand === index ? null : index,
      });
    }
    if (match.phase !== "turn") return;
    // A Hunt with its trade open is paid for with a cat from the hand.
    if (mode.kind === "hunt" && match.trades.hunt) {
      if (mode.trade === index) {
        playSound("click");
        return setMode({
          ...mode,
          trade: null,
          dice: mode.dice.slice(0, huntTake(match)),
        });
      }
      playSound("pick");
      return setMode({ ...mode, trade: index });
    }
    if (mode.kind === "play" && mode.hand === index) {
      playSound("click");
      return setMode(IDLE);
    }
    // A card that cannot be played is still raised, so the prompt can say
    // why; it sounds like the refusal it is. One that can speaks up.
    if (playBlock(match, index)) playSound("illegal");
    else playCat(catId);
    setMode({ kind: "play", hand: index, swap: [] });
  };

  const onDie = (index: number) => {
    if (mode.kind !== "hunt" || match.feeder[index] === undefined) return;
    playSound(mode.dice.includes(index) ? "click" : "pick");
    setMode({ ...mode, dice: toggleDie(mode.dice, index, take) });
  };

  const onTrayCard = (index: number) => {
    const catId = match.tray[index];
    if (mode.kind !== "prowl" || catId === undefined) return;
    if (mode.picks.includes(index)) {
      playSound("click");
      return setMode({
        ...mode,
        picks: mode.picks.filter((pick) => pick !== index),
      });
    }
    if (mode.picks.length < want) {
      playCat(catId);
      setMode({ ...mode, picks: [...mode.picks, index] });
    } else {
      playSound("illegal");
    }
  };

  const changeDeckPicks = (delta: 1 | -1) => {
    if (mode.kind !== "prowl") return;
    if (delta === 1) {
      if (mode.picks.length < want && deckPicks(mode.picks) < deckAvailable) {
        playSound("pick");
        setMode({ ...mode, picks: [...mode.picks, "deck"] });
      }
      return;
    }
    playSound("click");
    const last = mode.picks.lastIndexOf("deck");
    setMode({ ...mode, picks: mode.picks.filter((_, i) => i !== last) });
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
    reveal(
      tableRef.current?.querySelector(`[data-lane="${watched}"]`),
      matRef.current,
    );
  }, [watched, turnId]);

  // A chosen card stands up at the edge, and under a narrow table the dock
  // grows to hold it. The lane that can take the card is brought clear of
  // both once the table has been laid out again.
  const chosenHand = mode.kind === "play" ? mode.hand : null;
  const chosenLane =
    chosenHand === null
      ? null
      : ((match.playable[chosenHand] ?? [])[0] ?? "hunt");
  useEffect(() => {
    if (chosenLane === null) return;
    reveal(
      tableRef.current?.querySelector(`[data-lane="${chosenLane}"]`),
      matRef.current,
    );
  }, [chosenHand, chosenLane]);

  // Until the rival moves, what it did last turn still stands; while it is
  // moving, the step being shown is the news.
  const shownNews =
    playing && !frame?.flipped
      ? (turn?.rivalBefore ?? null)
      : playing && frame?.flipping && turn
        ? { id: turn.id, text: frame.text }
        : news;

  // The newest thing the log says, for a table that keeps the log put away.
  const landedLines = playing ? frame?.lines : undefined;
  const entry = log[0];
  const said = entry
    ? landedLines === undefined
      ? entry.lines
      : entry.lines.slice(0, landedLines)
    : [];
  const newest = entry
    ? (said[said.length - 1]?.text ?? entry.title)
    : "Nothing yet. Each move lands here.";

  const turnPanel = {
    match,
    turn: controls,
    playing: playing ? (frame?.text ?? "") : null,
    rivalStep: playing && frame?.tone === "rival",
    heat,
    onSkip: skip,
  };

  return (
    <div
      ref={tableRef}
      data-match
      className="fit:h-dvh fit:flex-none flex flex-1 flex-col [overflow:clip] lg:flex-row"
    >
      {/* Pieces in flight, floating numbers and sparks are drawn here, over
          the table and outside everything on it that shakes. */}
      <TurnPhone />
      <div aria-hidden data-fx-layer className="fx-layer" />
      <h1 className="sr-only">
        Match {run.matchIndex + 1} of {run.gauntlet.length}
      </h1>

      {/* The rail: theirs above the line, yours below it. Under `lg` its
          parts fall into the one column, and the turn is shown in the dock. */}
      <div className="lg:rail-side fit-wide:min-h-0 fit-compact:contents max-lg:contents lg:flex lg:w-[19.5rem] lg:shrink-0 lg:flex-col">
        {/* Where the match fits its window, their side scrolls in place and
            the turn under it stays where it is. A phone's table keeps their
            side in the sheet. */}
        <div className="fit-wide:min-h-0 fit-wide:flex-1 fit-wide:overflow-y-auto fit-compact:hidden flex flex-col gap-2.5 px-3 pt-2.5 lg:pb-3">
          {/* The corner buttons stand beside the track on a narrow table:
              three of them on a phone, four from 640px. */}
          <div className="max-lg:pr-36 sm:max-lg:pr-48 lg:hidden">
            {runStrip}
          </div>
          <div className="hidden lg:block">{sideStrip}</div>
          <RivalSide
            match={match}
            difficulty={run.difficulty}
            news={shownNews}
            flipping={frame?.flipping ?? false}
            onOpenMat={() => setRivalMat(true)}
          />
          <RoundBoard match={match} rail />
        </div>
        <TurnPanel
          {...turnPanel}
          rail
          className="border-ink fit-wide:static fit-wide:shrink-0 fit-compact:flex sticky bottom-0 z-20 mt-auto hidden border-t-2 bg-white lg:flex"
        />
      </div>

      <div className="fit-wide:min-h-0 fit-compact:contents flex min-w-0 flex-1 flex-col">
        <div className="fit-wide:min-h-0 fit-wide:max-xl:pt-2 fit-compact:contents flex flex-1 flex-col gap-x-4 gap-y-3 px-3 pt-2.5 pb-3 lg:pt-16 xl:flex-row xl:pt-2.5">
          {/* Between 1024px and 1280px a fitted table has no room for the
              pad beside it. A bar over the mat keeps the newest line of the
              log and the way in to the rest; the corner buttons stand at its
              right end. */}
          <div className="fit-wide:max-xl:flex hidden h-10 shrink-0 items-center gap-3 pr-60">
            <TableButton
              variant="secondary"
              onClick={() => setSheet(true)}
              className="shrink-0"
            >
              Scores and log
            </TableButton>
            <p className="text-ink min-w-0 truncate text-sm font-semibold">
              {newest}
            </p>
          </div>
          <div className="mat-column fit-wide:min-h-0 fit-wide:flex-1 fit-compact:contents flex min-w-0 flex-col gap-3 xl:flex-1">
            <section
              ref={matRef}
              data-shake
              aria-label="Your mat"
              className="mat mat-grid match-mat tall-table:order-3 fit-wide:min-h-0 fit-wide:flex-1 fit-wide:basis-0 fit-wide:max-h-[34rem] order-2"
            >
              <MatHeader
                costs={Array.from({ length: SLOTS }, (_, col) =>
                  columnYarnCost(match.mods, col),
                )}
              />
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
            </section>

            <div
              ref={supplyRef}
              data-shake
              className="match-supply tall-table:order-2 fit-wide:h-44 fit-wide:shrink-0 order-3"
            >
              <Supply
                match={match}
                mode={mode}
                busy={busy}
                take={take}
                want={want}
                rolling={frame?.rolling ?? false}
                onDie={onDie}
                onTrayCard={onTrayCard}
                onDeckPicks={changeDeckPicks}
                onReroll={() => act({ type: "reroll" })}
                onDetail={showCard}
                deckNote={`Your deck, ${plural(run.deck.length, "card")}.`}
              />
            </div>
          </div>

          {/* Beside the table the pad takes the table's height and scrolls in
              place, so it never makes the page longer than the table. Its top
              is left to the corner buttons. */}
          <div className="fit-wide:max-xl:hidden fit-compact:hidden relative min-w-0 xl:w-64 xl:shrink-0">
            <aside className="flex flex-col gap-3.5 lg:max-xl:grid lg:max-xl:grid-cols-2 lg:max-xl:items-start xl:absolute xl:inset-0 xl:top-12 xl:gap-2.5 xl:overflow-y-auto xl:pb-3">
              <Scorepad match={match} className="lg:max-xl:row-span-2" />
              <section aria-label="Your relics">
                <RelicTiles relicIds={run.relics} />
              </section>
              <EventLog
                log={log}
                landed={playing ? frame?.lines : undefined}
                className="max-h-80 xl:max-h-none xl:min-h-40 xl:flex-1"
              />
            </aside>
          </div>
        </div>

        {/* The player's edge. A white dock under a narrow table; beside the
            rail, only the hand, and the cloth shows and clicks through it. */}
        <div
          data-edge
          className="hand-zone max-lg:rail fit-wide:relative fit-wide:shrink-0 fit-compact:contents sticky bottom-0 z-20 flex flex-col sm:max-lg:grid sm:max-lg:grid-cols-[17rem_minmax(0,1fr)] lg:pointer-events-none"
        >
          <TurnPanel
            {...turnPanel}
            className="fit-compact:hidden flex lg:hidden"
          />
          <Hand
            match={match}
            mode={mode}
            busy={busy}
            onHandCard={onHandCard}
            onDetail={showCard}
            className="sm:max-lg:self-end"
          />
          {/* A phone's table has one more piece along its foot: the round,
              and the way in to everything the table has no room for. */}
          <TableButton
            variant="secondary"
            onClick={() => setSheet(true)}
            className="match-more"
          >
            Round {match.round + 1}, More
          </TableButton>
        </div>
      </div>

      <CatDetail
        catId={detail?.catId ?? null}
        tucked={detail?.tucked}
        onClose={() => setDetail(null)}
      />
      <TableSheet
        open={sheet}
        onClose={() => setSheet(false)}
        run={run}
        match={match}
        news={shownNews}
        flipping={frame?.flipping ?? false}
        log={log}
        landed={playing ? frame?.lines : undefined}
        strip={runStrip}
        onOpenMat={() => setRivalMat(true)}
      />
      <RivalMat
        match={match}
        open={rivalMat}
        onClose={() => setRivalMat(false)}
      />
      <GoalNotice
        match={served}
        goal={playing ? null : goal}
        onClose={onDismissGoal}
      />
    </div>
  );
}
