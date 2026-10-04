/**
 * A turn as the frames the table plays back. The server answers one action
 * with the finished match and an ordered list of events; this rebuilds what
 * the table looked like after each event, so powers can be shown firing one
 * at a time. Pure, so it is tested without a browser.
 *
 * Only what the client can know is rebuilt (essence, yarn, the hand, the
 * feeder). Anything else waits for the last frame, which is always the
 * server's own view.
 */

import { getCat, ROWS } from "~/server/game/cats";
import {
  columnYarnCost,
  playPayment,
  type Action,
  type MatchEvent,
  type PlacedCat,
  type SlotRef,
} from "~/server/game/match";
import type { MatchView } from "~/server/game/view";

import { describeAction, describeEvents, type LogTone } from "./describe";

export interface Frame {
  /** The table as it stands once this frame has landed. */
  view: MatchView;
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
        playPayment(view.essence, view.hand, action.hand, action.swap) ??
        view.essence;
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
      break;
    case "den":
      for (const target of action.targets) {
        const placed = view.board[target.row][target.col];
        if (placed) addYarn(placed, 1);
      }
      break;
    case "prowl":
      for (const pick of [...action.picks].sort().reverse()) {
        if (pick !== "deck") view.tray.splice(pick, 1);
      }
      growHand(view, after, action.picks.length);
      break;
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
    case "pounce":
      // What the deck gave up is the server's to know; a cat fires once an
      // action, so what is settled under it is this power's doing.
      if (settled) {
        placed.tucked = settled.tucked;
        if (settled.under) placed.under = [...settled.under];
      }
      break;
    case "tuckHand":
    case "trade":
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

/**
 * The frames of one turn, in the order things happened. The first shows the
 * player's own move, then one per power, feeder roll, rival card and scored
 * goal; the last is `after` untouched.
 */
export function buildSteps(
  before: MatchView,
  after: MatchView,
  action: Action,
  events: readonly MatchEvent[],
): Frame[] {
  const lines = describeEvents(before, after, events);
  const closing: Frame = {
    view: after,
    firing: null,
    flipping: false,
    flipped: true,
    rolling: false,
    lines: lines.length,
    text: "",
    tone: "note",
  };
  // Setup is a change of screen, not a turn at the table.
  if (action.type === "keep" || before.phase === "setup") return [closing];

  let view = applyOwnAction(before, after, action);
  const frames: Frame[] = [
    {
      view,
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
  for (const event of events) {
    if (
      event.type === "kept" ||
      event.type === "played" ||
      event.type === "activated"
    ) {
      continue;
    }
    const described = lines[line++];
    view = structuredClone(view);
    if (event.type === "power") applyPower(view, after, event);
    if (event.type === "feeder") view.feeder = [...event.faces];
    if (event.type === "rival") {
      applyRival(view, after, event);
      flipped = true;
    }
    frames.push({
      view,
      firing:
        event.type === "power" ? { row: event.row, col: event.col } : null,
      flipping: event.type === "rival",
      flipped,
      rolling: event.type === "feeder",
      lines: line,
      text: described?.text ?? "",
      tone: described?.tone ?? "note",
    });
  }

  frames.push(closing);
  return frames;
}
