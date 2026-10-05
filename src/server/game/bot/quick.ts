/**
 * The move a playout makes. A bot that plays a position out to the end of a
 * round or a match has to choose for both seats hundreds of times, so this
 * weighs a turn's few kinds of move by rule of thumb, straight off the
 * table, and tries nothing. It is no level of its own and is only ever used
 * inside a fork.
 */

import { getCat, type Effect, type Row } from "../cats";
import { ELEMENTS } from "../elements";
import {
  auraTotal,
  autoYarnTargets,
  boardYarnRoom,
  canPlay,
  defaultSwap,
  rowReward,
  SETUP_KEEP,
  type Action,
  type MatchState,
  type Essence,
  type Side,
} from "../match";
import { turnsAhead, wantedFood } from "./eval";

/** What one firing of a power is worth, in points, with `later` turns to come. */
function powerWorth(
  side: Side,
  row: Row,
  col: number,
  effect: Effect,
  later: boolean,
): number {
  const placed = side.board[row][col];
  if (!placed) return 0;
  const room = getCat(placed.catId).yarnCap - placed.yarn;
  switch (effect.kind) {
    case "essence":
    case "wild":
      return later ? 0.5 * effect.n : 0;
    case "yarnSelf":
      return Math.min(effect.n, room);
    case "yarnRow":
      return side.board[row].filter(
        (other) => other.yarn < getCat(other.catId).yarnCap,
      ).length;
    case "draw":
      return later ? 0.35 * effect.n : 0;
    case "cache":
    case "tuckDeck":
      return effect.n;
    case "pounce":
      return 0.6;
    case "tuckHand":
      return side.hand.length > 0 ? 0.9 : 0;
    case "trade":
      return 0;
    case "encore":
      return 0;
  }
}

/** What activating `row` sets off, besides its reward. */
function rowPowers(side: Side, row: Row, later: boolean): number {
  let worth = 0;
  let encore = false;
  side.board[row].forEach((placed, col) => {
    const power = getCat(placed.catId).power;
    if (power?.timing !== "activated") return;
    if (power.effect.kind === "encore") encore = true;
    else worth += powerWorth(side, row, col, power.effect, later);
  });
  return encore ? worth * 2 : worth;
}

/** The dice to take: a Treat, then food the hand's cats cost, then anything. */
export function pickDice(
  side: Pick<Side, "hand" | "essence">,
  feeder: readonly Essence[],
  take: number,
) {
  const wanted = wantedFood(side.hand);
  const worth = (face: Essence) =>
    face === "wild"
      ? 3
      : wanted.includes(face) && side.essence[face] === 0
        ? 2
        : wanted.includes(face)
          ? 1
          : 0;
  return feeder
    .map((face, index) => ({ index, worth: worth(face) }))
    .sort((a, b) => b.worth - a.worth || a.index - b.index)
    .slice(0, take)
    .map((die) => die.index);
}

export function quickKeep(setup: readonly string[]): Action {
  const cats = setup
    .map((catId, index) => ({ index, cost: getCat(catId).cost.length }))
    .sort((a, b) => a.cost - b.cost || a.index - b.index)
    .slice(0, 3)
    .map((cat) => cat.index);
  const wanted = wantedFood(cats.map((index) => setup[index] ?? ""));
  const essence = [...wanted, ...ELEMENTS.filter((e) => !wanted.includes(e))];
  return {
    type: "keep",
    cats,
    essence: essence.slice(0, SETUP_KEEP - cats.length),
  };
}

/** A sensible move for whoever is to act on `state`, found without trying any. */
export function quickMove(state: MatchState): Action {
  const who = state.active;
  const side = state.sides[who];
  if (state.phase === "setup") return quickKeep(side.setup);

  if (state.phase === "pending") {
    const pending = state.pending;
    if (pending?.kind !== "tuckHand" || side.hand.length === 0) {
      return { type: "resolve", choice: null };
    }
    // The cat least worth playing goes under.
    let choice = 0;
    side.hand.forEach((catId, hand) => {
      if (getCat(catId).points < getCat(side.hand[choice] ?? catId).points) {
        choice = hand;
      }
    });
    return { type: "resolve", choice };
  }

  const ahead = turnsAhead(state, who);
  const later = ahead > 1;
  let best: Action | null = null;
  let bestWorth = -Infinity;
  const weigh = (worth: number, action: () => Action) => {
    if (worth > bestWorth) {
      bestWorth = worth;
      best = action();
    }
  };

  // Play the cat worth the most, counting the turns it still has to work.
  const discount = auraTotal(side.board, "discount");
  let short = false;
  const seen = new Set<string>();
  side.hand.forEach((catId, hand) => {
    if (seen.has(catId)) return;
    seen.add(catId);
    const cat = getCat(catId);
    const row = cat.rows.find((r) => canPlay(side, hand, r));
    if (!row) {
      short = true;
      return;
    }
    const played =
      cat.power?.timing === "played"
        ? cat.power.effect.kind === "yarnSelf"
          ? Math.min(cat.power.effect.n, cat.yarnCap)
          : cat.power.effect.kind === "draw" && later
            ? 0.35 * cat.power.effect.n
            : 0
        : 0;
    weigh(cat.points + played + 0.3 * (ahead - 1), () => {
      const swap = defaultSwap(side.essence, side.hand, hand, discount);
      return swap.length > 0
        ? { type: "play", hand, row, swap }
        : { type: "play", hand, row };
    });
  });

  const yarn = Math.min(rowReward(side, "den"), boardYarnRoom(side.board));
  weigh(yarn + rowPowers(side, "den", later), () => ({
    type: "den",
    targets: autoYarnTargets(side, rowReward(side, "den")),
  }));

  const take = Math.min(rowReward(side, "hunt"), state.feeder.length);
  const hungry = later ? (short ? 0.95 : 0.3) : 0;
  weigh(hungry * take + rowPowers(side, "hunt", later), () => ({
    type: "hunt",
    dice: pickDice(side, state.feeder, take),
  }));

  const fromDeck = side.deck.length + side.discard.length;
  const want = Math.min(rowReward(side, "prowl"), side.tray.length + fromDeck);
  const bare = side.hand.length === 0 ? 1 : side.hand.length < 2 ? 0.45 : 0.12;
  weigh((later ? bare : 0) * want + rowPowers(side, "prowl", later), () => {
    // The tray's best cats first, the deck for the rest.
    const tray = side.tray
      .map((catId, index) => ({ index, points: getCat(catId).points }))
      .sort((a, b) => b.points - a.points || a.index - b.index)
      .slice(0, want)
      .map((cat) => cat.index);
    return {
      type: "prowl",
      picks: [
        ...tray,
        ...Array.from({ length: want - tray.length }, () => "deck" as const),
      ],
    };
  });

  return best ?? { type: "den", targets: [] };
}
