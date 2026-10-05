/**
 * A turn as the frames the table plays back. The server answers one action
 * with the finished match and an ordered list of events; this rebuilds what
 * the table looked like after each event, so powers can be shown firing one
 * at a time. Pure, so it is tested without a browser.
 *
 * Only what the client can know is rebuilt (essence, yarn, the hand, the
 * feeder, and the score they add up to). Anything else waits for the last
 * frame, which is always the server's own view.
 *
 * Each frame also carries a cue: what kind of moment it is and what it
 * changed. Sound and effects are worked out from the cue alone, so neither
 * has to read the table.
 */

import {
  getCat,
  ROWS,
  type Effect,
  type RivalAction,
} from "~/server/game/cats";
import {
  auraTotal,
  columnYarnCost,
  ESSENCES,
  playPayment,
  scoreBoard,
  type Action,
  type Essence,
  type MatchEvent,
  type PlacedCat,
  type SlotRef,
} from "~/server/game/match";
import type { MatchView } from "~/server/game/view";

import { describeAction, describeEvents, type LogTone } from "./describe";

/** What one cat on the mat gained or lost in a frame. */
export interface SlotDelta extends SlotRef {
  yarn: number;
  cached: number;
  tucked: number;
}

/** What a frame changed, against the frame before it. */
export interface Delta {
  food: Record<Essence, number>;
  yarn: number;
  cached: number;
  tucked: number;
  hand: number;
  /** The player's total. */
  score: number;
  /** The rival's total. */
  rival: number;
  /** The cats whose yarn, cache or tucked cards changed. */
  slots: SlotDelta[];
}

export type CueKind =
  /** The opening frame: the player's own move. */
  | Exclude<Action["type"], "keep">
  | "power"
  | "aura"
  | "feeder"
  | "rival"
  | "goal"
  | "over"
  /** The closing frame. It is the table itself and sets nothing off. */
  | "settle";

export interface Cue {
  kind: CueKind;
  /** What a power does. */
  effect: Effect["kind"] | null;
  /** The slot a power fired from, or a played cat landed in. */
  slot: SlotRef | null;
  /**
   * How many powers of this activation had landed before this frame. It
   * carries on across a choice, which is answered as an action of its own.
   */
  chain: number;
  /** A power that fired and changed nothing: a full cat, an empty deck. */
  fizzled: boolean;
  /** The card the rival turned over. */
  rivalAction: RivalAction | null;
  /** Who a goal or the match went to; `null` for a split goal. */
  won: boolean | null;
  delta: Delta;
}

export interface Frame {
  /** The table as it stands once this frame has landed. */
  view: MatchView;
  cue: Cue;
  /** The slot whose power is firing. */
  firing: SlotRef | null;
  /** True on the frame the rival flips its card. */
  flipping: boolean;
  /** True from the frame the rival flips its card onwards. */
  flipped: boolean;
  /** True on the frame the feeder is rolled again. */
  rolling: boolean;
  /** How many lines of the turn's log entry have landed. */
  lines: number;
  /** What this frame shows, in a sentence; empty on the closing frame. */
  text: string;
  tone: LogTone;
}

function noDelta(): Delta {
  return {
    food: { flame: 0, mist: 0, volt: 0, thorn: 0, shade: 0, wild: 0 },
    yarn: 0,
    cached: 0,
    tucked: 0,
    hand: 0,
    score: 0,
    rival: 0,
    slots: [],
  };
}

function diff(prev: MatchView, now: MatchView): Delta {
  const delta = noDelta();
  for (const kind of ESSENCES) {
    delta.food[kind] = now.essence[kind] - prev.essence[kind];
  }
  for (const row of ROWS) {
    now.board[row].forEach((placed, col) => {
      const was = prev.board[row][col];
      const slot: SlotDelta = {
        row,
        col,
        yarn: placed.yarn - (was?.yarn ?? 0),
        cached: placed.cached - (was?.cached ?? 0),
        tucked: placed.tucked - (was?.tucked ?? 0),
      };
      if (slot.yarn === 0 && slot.cached === 0 && slot.tucked === 0) return;
      delta.slots.push(slot);
      delta.yarn += slot.yarn;
      delta.cached += slot.cached;
      delta.tucked += slot.tucked;
    });
  }
  delta.hand = now.hand.length - prev.hand.length;
  delta.score = now.score.total - prev.score.total;
  delta.rival = now.rival.score - prev.rival.score;
  return delta;
}

/** True when a frame moved nothing a player holds. */
function unchanged(delta: Delta): boolean {
  return (
    delta.slots.length === 0 &&
    delta.hand === 0 &&
    ESSENCES.every((kind) => delta.food[kind] === 0)
  );
}

function rescore(view: MatchView): void {
  view.score = scoreBoard(view.board, view.goalResults, view.relics);
}

function addYarn(placed: PlacedCat, n: number): void {
  placed.yarn = Math.min(getCat(placed.catId).yarnCap, placed.yarn + n);
}

/** Pays a column's yarn the way the engine does: from the richest cat first. */
function spendYarn(view: MatchView, n: number): void {
  for (let i = 0; i < n; i++) {
    let richest: PlacedCat | null = null;
    for (const row of ROWS) {
      for (const placed of view.board[row]) {
        if (placed.yarn > (richest?.yarn ?? 0)) richest = placed;
      }
    }
    if (richest) richest.yarn -= 1;
  }
}

/**
 * Adds `n` drawn cats to the hand. Draws land at the end of the hand, so the
 * finished hand says which cats they were; if it does not line up, the hand
 * is left for the last frame to settle.
 */
function growHand(view: MatchView, after: MatchView, n: number): void {
  const size = Math.min(after.hand.length, view.hand.length + n);
  const lined = view.hand.every((catId, i) => after.hand[i] === catId);
  if (lined) view.hand = after.hand.slice(0, size);
}

function removeFirst<T>(list: T[], item: T): void {
  const index = list.indexOf(item);
  if (index >= 0) list.splice(index, 1);
}

/** The player's own move, before any power fires. */
function applyOwnAction(
  before: MatchView,
  after: MatchView,
  action: Action,
): MatchView {
  const view = structuredClone(before);
  view.pending = null;
  switch (action.type) {
    case "keep":
    case "reroll":
      break;
    case "play": {
      const catId = view.hand[action.hand];
      if (!catId) break;
      const line = view.board[action.row];
      view.essence =
        playPayment(
          view.essence,
          view.hand,
          action.hand,
          action.swap,
          auraTotal(view.board, "discount"),
        ) ?? view.essence;
      spendYarn(view, columnYarnCost(view.mods, line.length));
      view.hand.splice(action.hand, 1);
      line.push({ catId, yarn: 0, cached: 0, tucked: 0, under: [] });
      break;
    }
    case "hunt":
      for (const index of [...action.dice].sort((a, b) => b - a)) {
        const [face] = view.feeder.splice(index, 1);
        if (face) view.essence[face] += 1;
      }
      // The trade's cat leaves the hand for the discard pile.
      if (action.trade !== undefined && view.hand[action.trade]) {
        view.hand.splice(action.trade, 1);
        view.discardCount += 1;
      }
      break;
    case "den":
      if (action.trade && view.essence[action.trade] > 0) {
        view.essence[action.trade] -= 1;
      }
      for (const target of action.targets) {
        const placed = view.board[target.row][target.col];
        if (placed) addYarn(placed, 1);
      }
      break;
    case "prowl": {
      const payer = action.trade
        ? view.board[action.trade.row][action.trade.col]
        : undefined;
      if (payer && payer.yarn > 0) payer.yarn -= 1;
      for (const pick of [...action.picks].sort().reverse()) {
        if (pick !== "deck") view.tray.splice(pick, 1);
      }
      growHand(view, after, action.picks.length);
      break;
    }
    case "resolve": {
      const pending = before.pending;
      const placed = pending
        ? view.board[pending.slot.row][pending.slot.col]
        : undefined;
      if (!pending || !placed || action.choice === null) break;
      if (pending.kind === "tuckHand") {
        const [card] = view.hand.splice(action.choice, 1);
        placed.tucked += 1;
        if (card) (placed.under ??= []).push(card);
        growHand(view, after, pending.draw);
      } else if (placed.yarn > 0) {
        placed.yarn -= 1;
        view.essence.wild += 1;
      }
      break;
    }
  }
  return view;
}

function applyPower(
  view: MatchView,
  after: MatchView,
  event: Extract<MatchEvent, { type: "power" }>,
): void {
  const effect = getCat(event.catId).power?.effect;
  const placed = view.board[event.row][event.col];
  const settled = after.board[event.row][event.col];
  if (!effect || !placed) return;
  switch (effect.kind) {
    case "essence":
      view.essence[effect.element] += effect.n;
      break;
    case "wild":
      view.essence.wild += effect.n;
      break;
    case "yarnSelf":
      addYarn(placed, effect.n);
      break;
    case "yarnRow":
      for (const other of view.board[event.row]) addYarn(other, effect.n);
      break;
    case "draw":
      growHand(view, after, effect.n);
      break;
    case "cache":
      placed.cached += effect.n;
      break;
    case "tuckDeck":
    case "pounce": {
      // What the deck gave up is the server's to know, so the cat takes its
      // share of what is settled under it: one firing's worth at a time, for
      // an encore fires it twice.
      if (!settled) break;
      const n = effect.kind === "tuckDeck" ? effect.n : 1;
      placed.tucked = Math.min(settled.tucked, placed.tucked + n);
      if (settled.under) {
        placed.under = settled.under.slice(0, (placed.under?.length ?? 0) + n);
      }
      break;
    }
    case "tuckHand":
    case "trade":
    // The cats an encore sets off again each come as a power of their own.
    case "encore":
      break;
  }
}

function applyRival(
  view: MatchView,
  after: MatchView,
  event: Extract<MatchEvent, { type: "rival" }>,
): void {
  // A goal scored at the end of this turn is not the rival's card's doing.
  const scored = after.rival.goalPoints - view.rival.goalPoints;
  view.rival = {
    ...after.rival,
    goalPoints: view.rival.goalPoints,
    score: after.rival.score - scored,
    pushes: view.rival.pushes + (event.action === "push" ? 1 : 0),
  };
  if (event.action === "raid") {
    for (const face of event.removed) removeFirst(view.feeder, face);
    // The event names the faces taken, not which dice; when the same faces
    // are left, the finished feeder says what order they sit in.
    const left = [...view.feeder].sort().join();
    if (left === [...after.feeder].sort().join()) {
      view.feeder = [...after.feeder];
    }
  }
  view.tray = [...after.tray];
  view.deckCount = after.deckCount;
  view.discardCount = after.discardCount;
  view.turnsLeft = Math.max(0, view.turnsLeft - 1);
}

/** A goal scored at the end of a round, paid to both sides. */
function applyGoal(
  view: MatchView,
  event: Extract<MatchEvent, { type: "goal" }>,
): void {
  const { goalId, player, rival, playerPoints, rivalPoints } = event;
  view.goalResults = [
    ...view.goalResults,
    { goalId, player, rival, playerPoints, rivalPoints },
  ];
  view.rival = {
    ...view.rival,
    goalPoints: view.rival.goalPoints + rivalPoints,
    score: view.rival.score + rivalPoints,
  };
}

/**
 * The frames of one turn, in the order things happened. The first shows the
 * player's own move, then one per power, feeder roll, rival card and scored
 * goal; the last is `after` untouched. `chainStart` is how many powers the
 * activation had already landed when this action answers a choice in the
 * middle of it.
 */
export function buildSteps(
  before: MatchView,
  after: MatchView,
  action: Action,
  events: readonly MatchEvent[],
  chainStart = 0,
): Frame[] {
  const lines = describeEvents(before, after, events);
  const closing = (chain: number): Frame => ({
    view: after,
    cue: {
      kind: "settle",
      effect: null,
      slot: null,
      chain,
      fizzled: false,
      rivalAction: null,
      won: null,
      delta: noDelta(),
    },
    firing: null,
    flipping: false,
    flipped: true,
    rolling: false,
    lines: lines.length,
    text: "",
    tone: "note",
  });
  // Setup is a change of screen, not a turn at the table.
  if (action.type === "keep" || before.phase === "setup") {
    return [closing(chainStart)];
  }

  let view = applyOwnAction(before, after, action);
  rescore(view);
  let chain = chainStart;
  const frames: Frame[] = [
    {
      view,
      cue: {
        kind: action.type,
        effect: null,
        slot:
          action.type === "play"
            ? { row: action.row, col: before.board[action.row].length }
            : action.type === "resolve"
              ? (before.pending?.slot ?? null)
              : null,
        chain,
        fizzled: false,
        rivalAction: null,
        won: null,
        delta: diff(before, view),
      },
      firing: null,
      flipping: false,
      flipped: false,
      rolling: false,
      lines: 0,
      text: describeAction(before, action),
      tone: "note",
    },
  ];

  let line = 0;
  let flipped = false;
  events.forEach((event, at) => {
    if (
      event.type === "kept" ||
      event.type === "played" ||
      event.type === "activated"
    ) {
      return;
    }
    const described = lines[line++];
    const prev = view;
    view = structuredClone(view);
    if (event.type === "power") applyPower(view, after, event);
    if (event.type === "aura") {
      const aura = getCat(event.catId).aura;
      if (aura?.kind === "treat") view.essence.wild += aura.n;
    }
    if (event.type === "feeder") view.feeder = [...event.faces];
    if (event.type === "rival") {
      applyRival(view, after, event);
      flipped = true;
    }
    if (event.type === "goal") applyGoal(view, event);
    rescore(view);

    const delta = diff(prev, view);
    const fires = event.type === "power" || event.type === "aura";
    const slot = fires ? { row: event.row, col: event.col } : null;
    // An encore changes nothing itself, and a power that stops for a choice
    // is always the last thing to happen; neither has fizzled.
    const waits =
      event.type === "power" &&
      at === events.length - 1 &&
      after.pending?.slot.row === event.row &&
      after.pending.slot.col === event.col;
    const fizzled =
      event.type === "power" &&
      event.effect !== "encore" &&
      !waits &&
      unchanged(delta);
    frames.push({
      view,
      cue: {
        kind: event.type,
        effect: event.type === "power" ? event.effect : null,
        slot,
        chain,
        fizzled,
        rivalAction: event.type === "rival" ? event.action : null,
        won:
          event.type === "over"
            ? event.won
            : event.type === "goal" && event.playerPoints !== event.rivalPoints
              ? event.playerPoints > event.rivalPoints
              : null,
        delta,
      },
      firing: slot,
      flipping: event.type === "rival",
      flipped,
      rolling: event.type === "feeder",
      lines: line,
      text: described?.text ?? "",
      tone: described?.tone ?? "note",
    });
    if (fires && !fizzled) chain += 1;
  });

  frames.push(closing(chain));
  return frames;
}

/** How many powers an activation has landed once this action has played. */
export function chainEnd(
  before: MatchView,
  after: MatchView,
  action: Action,
  events: readonly MatchEvent[],
  chainStart = 0,
): number {
  const frames = buildSteps(before, after, action, events, chainStart);
  return frames[frames.length - 1]?.cue.chain ?? chainStart;
}

/** A step of a turn with nothing to hurry it. */
export const STEP_MS = 380;
/** The quickest a power lands, however long the chain. */
export const STEP_FLOOR_MS = 180;
/** How much of the last power's time the next one keeps. */
const CHAIN_PACE = 0.88;
/** The player's own move, which a piece in flight has to finish inside. */
export const OPENING_MS = 440;
const RIVAL_MS = 540;
const GOAL_MS = 760;
const OVER_MS = 1000;

/**
 * How long frame `index` stays up before the next lands. A chain speeds up
 * as its powers pile on, down to a floor; the rival's card and a scored goal
 * get a beat of their own, and the end of the match is held. The closing
 * frame is the table itself, so nothing waits on it.
 */
export function stepDuration(frames: readonly Frame[], index: number): number {
  const frame = frames[index];
  if (!frame || index >= frames.length - 1) return 0;
  switch (frame.cue.kind) {
    case "power":
    case "aura":
      return Math.max(
        STEP_FLOOR_MS,
        Math.round(STEP_MS * CHAIN_PACE ** frame.cue.chain),
      );
    case "rival":
      return RIVAL_MS;
    case "goal":
      return GOAL_MS;
    case "over":
      return OVER_MS;
    case "play":
    case "hunt":
    case "prowl":
    case "resolve":
      return OPENING_MS;
    default:
      return STEP_MS;
  }
}
