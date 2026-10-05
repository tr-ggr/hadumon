/**
 * Plain words for what just happened in a match. The server returns bare
 * events; this turns one action and its events into a log entry that names
 * the cats and the rival. Pure, so it is tested without a browser.
 */

import {
  getCat,
  playCost,
  ROW_LABELS,
  type Effect,
  type Row,
} from "~/server/game/cats";
import { FOOD_LABELS, TREAT_LABEL } from "~/server/game/elements";
import { getGoal } from "~/server/game/goals";
import {
  auraTotal,
  swapOffer,
  type Action,
  type Essence,
  type GoalResult,
  type MatchEvent,
  type Move,
  type Tiebreak,
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

/** What the rival last did, in words. */
export interface RivalNews {
  /** Changes every time the rival takes a turn. */
  id: number;
  text: string;
}

/** The food's name on the table: Beef, Fish and so on, or a Treat. */
export function essenceLabel(kind: Essence): string {
  return kind === "wild" ? TREAT_LABEL : FOOD_LABELS[kind];
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** What a lane space costs to seat a cat in, in words. */
export function yarnCostLabel(cost: number): string {
  return cost === 0 ? "Free" : `${cost} yarn`;
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
 * What a seat did on its turn in a few words, with no subject, e.g. "Hunted
 * and took Beef and a Treat". It reads the same for either seat; cats drawn
 * from a deck and a cat tucked from a hand are counted and not named.
 */
export function moveText(move: Move): string {
  switch (move.type) {
    case "play":
      return `Played ${getCat(move.catId).name} into ${rowName(move.row)}`;
    case "hunt": {
      const took =
        move.faces.length > 0
          ? `Hunted and took ${listWords(move.faces.map(essenceLabel))}`
          : "Hunted and took nothing";
      return move.discarded
        ? `${took}, discarding ${getCat(move.discarded).name} for 1 more die`
        : took;
    }
    case "den": {
      const laid =
        move.targets.length > 0
          ? `Went to the Den and laid ${move.targets.length} yarn`
          : "Went to the Den and laid no yarn";
      return move.spent
        ? `${laid}, spending 1 ${essenceLabel(move.spent)} for 1 more`
        : laid;
    }
    case "prowl": {
      const parts = [
        ...(move.tray.length > 0
          ? [
              `${listWords(move.tray.map((id) => getCat(id).name))} from the tray`,
            ]
          : []),
        ...(move.deck > 0 ? [`${move.deck} from the deck`] : []),
      ];
      const drew =
        parts.length > 0
          ? `Prowled and drew ${listWords(parts)}`
          : "Prowled and drew nothing";
      return move.payer ? `${drew}, spending 1 yarn for 1 more` : drew;
    }
    case "reroll":
      return "Rerolled the feeder";
    case "resolve":
      if (move.kind === "trade") {
        return move.took ? "Traded 1 yarn for 1 Treat" : "Kept its yarn";
      }
      return move.took ? "Tucked a cat from its hand" : "Tucked nothing";
  }
}

/** A power of the rival's firing, as much of it as shows across the table. */
function rivalPowerText(catId: string, effect: Effect["kind"]): string {
  const cat = getCat(catId);
  const power = cat.power?.effect;
  const name = `Their ${cat.name}`;
  if (power?.kind !== effect) return `${name} fired.`;
  switch (power.kind) {
    case "essence":
      return `${name} fetched ${power.n} ${FOOD_LABELS[power.element]}.`;
    case "wild":
      return `${name} fetched ${plural(power.n, TREAT_LABEL)}.`;
    case "yarnSelf":
      return `${name} laid ${power.n} yarn on itself.`;
    case "yarnRow":
      return `${name} laid ${power.n} yarn on each cat in its row.`;
    case "draw":
      return `${name} drew ${plural(power.n, "cat")}.`;
    case "cache":
      return `${name} cached ${power.n} food.`;
    case "tuckDeck":
      return `${name} tucked ${plural(power.n, "cat")} from its deck.`;
    case "pounce":
      return `${name} pounced.`;
    case "tuckHand":
      return `${name} may tuck a cat from its hand.`;
    case "trade":
      return `${name} may trade 1 yarn for 1 ${TREAT_LABEL}.`;
    case "encore":
      return `${name} set the rest of its row off again.`;
  }
}

const TIEBREAK_TEXT: Record<Tiebreak, string> = {
  food: "Level on points: it goes to the side with more food left.",
  cats: "Level on points and on food: it goes to the side with more cats.",
  seat: "Level on points, food and cats: it goes to you.",
};

/** How a match that ended level was settled, or `null` if it was not level. */
export function tiebreakText(tiebreak: Tiebreak | null): string | null {
  return tiebreak ? TIEBREAK_TEXT[tiebreak] : null;
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
      return `You kept ${plural(action.cats.length, "cat")} and ${action.essence.length} food.`;
    case "play": {
      const catId = before.hand[action.hand];
      const name = catId ? getCat(catId).name : "a cat";
      const swap = action.swap ?? [];
      const short = catId
        ? (swapOffer(
            before.essence,
            playCost(catId, auraTotal(before.board, "discount")),
          )?.short ?? [])
        : [];
      return swap.length > 0 && short.length > 0
        ? `You played ${name} into ${rowName(action.row)}, giving up ${listWords(swap.map(essenceLabel))} in place of ${listWords(short.map(essenceLabel))}.`
        : `You played ${name} into ${rowName(action.row)}.`;
    }
    case "hunt": {
      const faces = action.dice.flatMap((i) => before.feeder[i] ?? []);
      const paid =
        action.trade === undefined ? undefined : before.hand[action.trade];
      const trade = paid
        ? `, discarding ${getCat(paid).name} for 1 more die`
        : "";
      return faces.length > 0
        ? `You hunted and took ${listWords(faces.map(essenceLabel))}${trade}.`
        : "You hunted and took nothing.";
    }
    case "den": {
      const trade = action.trade
        ? `, spending 1 ${essenceLabel(action.trade)} for 1 more`
        : "";
      return action.targets.length > 0
        ? `You went to the Den and laid ${action.targets.length} yarn${trade}.`
        : "You went to the Den and laid no yarn.";
    }
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
      const payer = action.trade
        ? before.board[action.trade.row][action.trade.col]
        : undefined;
      const trade = payer
        ? `, spending 1 yarn from ${getCat(payer.catId).name} for 1 more`
        : "";
      return parts.length > 0
        ? `You prowled and drew ${listWords(parts)}${trade}.`
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
          : `You traded 1 yarn from ${host} for 1 ${TREAT_LABEL}.`;
      }
      if (action.choice === null) return `You tucked nothing under ${host}.`;
      const tucked = before.hand[action.choice];
      return `You tucked ${tucked ? getCat(tucked).name : "a cat"} under ${host}.`;
    }
  }
}

function describePower(
  event: Pick<Extract<MatchEvent, { type: "power" }>, "catId" | "row" | "col">,
  before: MatchView,
  after: MatchView,
  nth: number,
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
  // The cats put under it this action, where the match has kept them. Set
  // off again by an encore, a cat fires twice; `nth` says which firing this is.
  const under = (now?.under ?? [])
    .slice(was?.under?.length ?? 0)
    .map((id) => getCat(id).name);

  switch (effect.kind) {
    case "essence":
      return `${name} fetched ${effect.n} ${FOOD_LABELS[effect.element]}.`;
    case "wild":
      return `${name} fetched ${plural(effect.n, TREAT_LABEL)}.`;
    case "yarnSelf":
      return now && now.yarn >= cat.yarnCap
        ? `${name} laid yarn on itself and is full at ${cat.yarnCap}.`
        : `${name} laid ${effect.n} yarn on itself.`;
    case "yarnRow":
      return `${name} laid ${effect.n} yarn on each cat in ${rowName(event.row)}.`;
    case "draw":
      return `${name} drew ${plural(effect.n, "cat")}.`;
    case "cache":
      return `${name} cached ${effect.n} food.`;
    case "tuckDeck": {
      const tucked = under.slice(nth * effect.n, (nth + 1) * effect.n);
      return tucked.length > 0
        ? `${name} tucked ${listWords(tucked)} from the deck.`
        : `${name} tucked ${plural(effect.n, "cat")} from the deck.`;
    }
    case "pounce":
      // Which pounce landed is the server's to know; the count is right.
      return (now?.tucked ?? 0) - (was?.tucked ?? 0) > nth
        ? `${name} pounced and tucked ${under[nth] ?? "a cat"}.`
        : `${name} pounced and came back with nothing.`;
    case "tuckHand":
      return waiting
        ? `${name} will tuck a cat from your hand, if you let it.`
        : `${name} found nothing in your hand to tuck.`;
    case "trade":
      return waiting
        ? `${name} offers a trade: 1 yarn for 1 ${TREAT_LABEL}.`
        : `${name} had no yarn to trade.`;
    case "encore":
      return `${name} set the rest of ${rowName(event.row)} off again.`;
  }
}

/**
 * One line per event that the action's own sentence does not already cover:
 * the player's powers, then everything the rival did in answer.
 */
export function describeEvents(
  before: MatchView,
  after: MatchView,
  events: readonly MatchEvent[],
): LogLine[] {
  const rival = getRival(after.rivalId).name;
  const lines: LogLine[] = [];
  const fired = new Map<string, number>();
  for (const event of events) {
    switch (event.type) {
      case "kept":
      case "played":
      case "activated":
        break;
      case "move":
        // The player's own move is the entry's title.
        if (event.side === "rival") {
          lines.push({
            tone: "rival",
            text: `${rival} ${lowerFirst(moveText(event.move))}.`,
          });
        }
        break;
      case "power": {
        if (event.side === "rival") {
          lines.push({
            tone: "rival",
            text: rivalPowerText(event.catId, event.effect),
          });
          break;
        }
        const slot = `${event.row}:${event.col}`;
        const nth = fired.get(slot) ?? 0;
        fired.set(slot, nth + 1);
        lines.push({
          tone: "power",
          text: describePower(event, before, after, nth),
        });
        break;
      }
      case "aura": {
        const cat = getCat(event.catId);
        const n = cat.aura?.kind === "treat" ? cat.aura.n : 0;
        lines.push(
          event.side === "rival"
            ? {
                tone: "rival",
                text: `Their ${cat.name}'s relic brought ${plural(n, TREAT_LABEL)}.`,
              }
            : {
                tone: "power",
                text: `${cat.name}'s relic brought ${plural(n, TREAT_LABEL)}.`,
              },
        );
        break;
      }
      case "refill":
        lines.push(
          event.side === "rival"
            ? {
                tone: "rival",
                text: `${rival} gained ${plural(event.treats, TREAT_LABEL)} from the refill.`,
              }
            : {
                tone: "power",
                text: `The Loud Bell rang: ${plural(event.treats, TREAT_LABEL)}.`,
              },
        );
        break;
      case "feeder":
        lines.push({
          tone: "note",
          text: `The feeder was rolled again: ${listWords(event.faces.map(essenceLabel))}.`,
        });
        break;
      case "goal":
        lines.push({
          tone: "goal",
          text: `Round ${event.round + 1} goal, ${goalText(after.rivalId, event)}`,
        });
        break;
      case "over": {
        const settled = tiebreakText(event.tiebreak);
        lines.push({
          tone: "note",
          text: `The match is over. You ${event.player}, ${rival} ${event.rival}.${settled ? ` ${settled}` : ""}`,
        });
        break;
      }
    }
  }
  return lines;
}

/** The rival's last whole turn in this batch of events, in a few words. */
export function latestRivalText(events: readonly MatchEvent[]): string | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    if (
      event?.type === "move" &&
      event.side === "rival" &&
      event.move.type !== "resolve" &&
      event.move.type !== "reroll"
    ) {
      return moveText(event.move);
    }
  }
  return null;
}

export function findGoal(events: readonly MatchEvent[]): GoalEvent | null {
  return (
    events.find((event): event is GoalEvent => event.type === "goal") ?? null
  );
}
