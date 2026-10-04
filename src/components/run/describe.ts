/**
 * Plain words for what just happened in a match. The server returns bare
 * events; this turns one action and its events into a log entry that names
 * the cats and the rival. Pure, so it is tested without a browser.
 */

import {
  getCat,
  ROW_LABELS,
  type RivalAction,
  type Row,
} from "~/server/game/cats";
import { ELEMENT_LABELS } from "~/server/game/elements";
import { getGoal } from "~/server/game/goals";
import type {
  Action,
  Essence,
  GoalResult,
  MatchEvent,
} from "~/server/game/match";
import { getRival } from "~/server/game/rival";
import type { MatchView } from "~/server/game/view";

export type LogTone = "power" | "rival" | "goal" | "note";

export interface LogLine {
  tone: LogTone;
  text: string;
}

export interface LogEntry {
  id: number;
  /** What the player did. */
  title: string;
  lines: LogLine[];
}

export type GoalEvent = Extract<MatchEvent, { type: "goal" }>;

/** What the rival last flipped, with details when this session saw it happen. */
export interface RivalNews {
  /** Changes every time the rival flips a card. */
  id: number;
  text: string;
}

export function essenceLabel(kind: Essence): string {
  return kind === "wild" ? "Wild" : ELEMENT_LABELS[kind];
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** "A", "A and B", "A, B and C". */
export function listWords(words: readonly string[]): string {
  if (words.length <= 1) return words[0] ?? "";
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}

function rowName(row: Row): string {
  return `the ${ROW_LABELS[row]}`;
}

/**
 * The rival's card in a few words, e.g. "Raided 2 dice: Flame and Wild".
 * `removed` is what the event carried; pass `null` when only the card is
 * known (after a reload) and the text stays general.
 */
export function rivalActionText(
  rivalId: string,
  action: RivalAction,
  removed: readonly string[] | null,
  bankValue: number,
): string {
  const rival = getRival(rivalId);
  switch (action) {
    case "bank":
      return `Banked a cat, worth ${bankValue}`;
    case "stash":
      return `Stashed ${rival.stashYarn} yarn`;
    case "push":
      return "Pushed the round goal by 1";
    case "raid":
      if (removed === null) {
        return `Raided ${plural(rival.raidDice, "die", "dice")}`;
      }
      if (removed.length === 0) return "Raided an empty feeder";
      return `Raided ${plural(removed.length, "die", "dice")}: ${listWords(
        removed.map((face) => essenceLabel(face as Essence)),
      )}`;
    case "burn":
      if (removed === null) {
        return `Burned ${plural(rival.burnCards, "tray card")}`;
      }
      if (removed.length === 0) return "Found nothing in the tray to burn";
      return `Burned ${listWords(removed.map((id) => getCat(id).name))}`;
  }
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

export function goalText(rivalId: string, result: GoalResult): string {
  const rival = getRival(rivalId).name;
  return `${getGoal(result.goalId).name}: you ${result.player}, ${rival} ${result.rival}. Points: you ${result.playerPoints}, ${rival} ${result.rivalPoints}.`;
}

/** The sentence for the player's own action. */
export function describeAction(before: MatchView, action: Action): string {
  switch (action.type) {
    case "keep":
      return `You kept ${plural(action.cats.length, "cat")} and ${action.essence.length} essence.`;
    case "play": {
      const catId = before.hand[action.hand];
      const name = catId ? getCat(catId).name : "a cat";
      return `You played ${name} into ${rowName(action.row)}.`;
    }
    case "hunt": {
      const faces = action.dice.flatMap((i) => before.feeder[i] ?? []);
      return faces.length > 0
        ? `You hunted and took ${listWords(faces.map(essenceLabel))}.`
        : "You hunted and took nothing.";
    }
    case "den":
      return action.targets.length > 0
        ? `You went to the Den and laid ${action.targets.length} yarn.`
        : "You went to the Den and laid no yarn.";
    case "prowl": {
      const names = action.picks.flatMap((pick) => {
        if (pick === "deck") return [];
        const catId = before.tray[pick];
        return catId ? [getCat(catId).name] : [];
      });
      const fromDeck = action.picks.filter((pick) => pick === "deck").length;
      const parts = [
        ...(names.length > 0 ? [`${listWords(names)} from the tray`] : []),
        ...(fromDeck > 0 ? [`${fromDeck} from the deck`] : []),
      ];
      return parts.length > 0
        ? `You prowled and drew ${listWords(parts)}.`
        : "You prowled and drew nothing.";
    }
    case "reroll":
      return "You rerolled the feeder.";
    case "resolve": {
      const pending = before.pending;
      const placed = pending
        ? before.board[pending.slot.row][pending.slot.col]
        : undefined;
      const host = placed ? getCat(placed.catId).name : "the cat";
      if (pending?.kind === "trade") {
        return action.choice === null
          ? `You kept the yarn on ${host}.`
          : `You traded 1 yarn from ${host} for 1 wild essence.`;
      }
      if (action.choice === null) return `You tucked nothing under ${host}.`;
      const tucked = before.hand[action.choice];
      return `You tucked ${tucked ? getCat(tucked).name : "a cat"} under ${host}.`;
    }
  }
}

function describePower(
  event: Extract<MatchEvent, { type: "power" }>,
  before: MatchView,
  after: MatchView,
): string {
  const cat = getCat(event.catId);
  const effect = cat.power?.effect;
  const name = cat.name;
  if (!effect) return `${name} did something.`;
  const was = before.board[event.row][event.col];
  const now = after.board[event.row][event.col];
  const waiting =
    after.pending?.slot.row === event.row &&
    after.pending?.slot.col === event.col;

  switch (effect.kind) {
    case "essence":
      return `${name} fetched ${effect.n} ${ELEMENT_LABELS[effect.element]} essence.`;
    case "wild":
      return `${name} fetched ${effect.n} wild essence.`;
    case "yarnSelf":
      return now && now.yarn >= cat.yarnCap
        ? `${name} laid yarn on itself and is full at ${cat.yarnCap}.`
        : `${name} laid ${effect.n} yarn on itself.`;
    case "yarnRow":
      return `${name} laid ${effect.n} yarn on each cat in ${rowName(event.row)}.`;
    case "draw":
      return `${name} drew ${plural(effect.n, "cat")}.`;
    case "cache":
      return `${name} cached ${effect.n} essence.`;
    case "tuckDeck":
      return `${name} tucked ${plural(effect.n, "cat")} from the deck.`;
    case "pounce":
      return (now?.tucked ?? 0) > (was?.tucked ?? 0)
        ? `${name} pounced and tucked a cat.`
        : `${name} pounced and came back with nothing.`;
    case "tuckHand":
      return waiting
        ? `${name} will tuck a cat from your hand, if you let it.`
        : `${name} found nothing in your hand to tuck.`;
    case "trade":
      return waiting
        ? `${name} offers a trade: 1 yarn for 1 wild essence.`
        : `${name} had no yarn to trade.`;
  }
}

/** One line per event that the action's own sentence does not already cover. */
export function describeEvents(
  before: MatchView,
  after: MatchView,
  events: readonly MatchEvent[],
): LogLine[] {
  const rival = getRival(after.rivalId).name;
  const lines: LogLine[] = [];
  for (const event of events) {
    switch (event.type) {
      case "kept":
      case "played":
      case "activated":
        break;
      case "power":
        lines.push({
          tone: "power",
          text: describePower(event, before, after),
        });
        break;
      case "feeder":
        lines.push({
          tone: "note",
          text: `The feeder was rolled again: ${listWords(event.faces.map(essenceLabel))}.`,
        });
        break;
      case "rival":
        lines.push({
          tone: "rival",
          text: `${rival} ${lowerFirst(
            rivalActionText(
              after.rivalId,
              event.action,
              event.removed,
              after.rival.bankValue,
            ),
          )}.`,
        });
        break;
      case "goal":
        lines.push({
          tone: "goal",
          text: `Round ${event.round + 1} goal, ${goalText(after.rivalId, event)}`,
        });
        break;
      case "over":
        lines.push({
          tone: "note",
          text: `The match is over. You ${event.player}, ${rival} ${event.rival}.`,
        });
        break;
    }
  }
  return lines;
}

/** The rival's card from this batch of events in a few words, if it flipped one. */
export function latestRivalText(
  after: MatchView,
  events: readonly MatchEvent[],
): string | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    if (event?.type === "rival") {
      return rivalActionText(
        after.rivalId,
        event.action,
        event.removed,
        after.rival.bankValue,
      );
    }
  }
  return null;
}

export function findGoal(events: readonly MatchEvent[]): GoalEvent | null {
  return (
    events.find((event): event is GoalEvent => event.type === "goal") ?? null
  );
}
