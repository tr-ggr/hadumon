import { describe, expect, it } from "vitest";

import {
  emptyPool,
  IllegalAction,
  rowReward,
  tradeOffered,
  tradeOpen,
  type Action,
  type Essence,
  type PlacedCat,
} from "./match";
import { starterDeck } from "./clans";
import {
  lift,
  soloActions as legalActions,
  soloApply as applyAction,
  soloMatch,
  type Solo as MatchState,
} from "./solo";
import { toMatchView } from "./view";

/** A trade is on offer in a turn, and never outside one. */
const canTrade = (state: MatchState, row: "hunt" | "den" | "prowl") =>
  state.phase === "turn" && tradeOffered(state, state.feeder, row);

const FACES: Essence[] = ["flame", "mist", "volt", "thorn", "shade"];

const placed = (catId: string, extra: Partial<PlacedCat> = {}): PlacedCat => ({
  catId,
  yarn: 0,
  cached: 0,
  tucked: 0,
  under: [],
  ...extra,
});

function turnState(overrides: Partial<MatchState> = {}): MatchState {
  const base = soloMatch({
    seed: "trade",
    deck: starterDeck("flame"),
    relics: [],
  });
  return {
    ...base,
    phase: "turn",
    setup: [],
    turnsLeft: 5,
    feeder: [...FACES],
    hand: ["emberkit", "flameclaw"],
    ...overrides,
  };
}

const board = (extra: Partial<MatchState["board"]>) => ({
  hunt: [],
  den: [],
  prowl: [],
  ...extra,
});

const refused = (state: MatchState, action: Action) =>
  expect(() => applyAction(state, action)).toThrow(IllegalAction);

describe("trade spots", () => {
  it("open while a row holds exactly one or three cats", () => {
    const cats = (n: number) =>
      board({ hunt: Array.from({ length: n }, () => placed("flameclaw")) });
    expect([0, 1, 2, 3, 4].map((n) => tradeOpen(cats(n), "hunt"))).toEqual([
      false,
      true,
      false,
      true,
      false,
    ]);
  });

  it("are never on offer outside a turn", () => {
    const state = turnState({
      board: board({ hunt: [placed("thornkit")] }),
      phase: "over",
    });
    expect(canTrade(state, "hunt")).toBe(false);
  });
});

describe("the Hunt's trade", () => {
  // Thornkit pounces when activated, which touches neither hand nor food.
  const state = turnState({ board: board({ hunt: [placed("thornkit")] }) });

  it("discards a cat from hand and takes one die more", () => {
    expect(rowReward(state, "hunt")).toBe(1);
    const { state: next } = applyAction(state, {
      type: "hunt",
      dice: [0, 2],
      trade: 1,
    });
    expect(next.essence).toMatchObject({ flame: 1, volt: 1 });
    expect(next.hand).toEqual(["emberkit"]);
    expect(next.discard).toContain("flameclaw");
    expect(next.feeder).toHaveLength(3);
  });

  it("is refused with the wrong number of dice or a cat not held", () => {
    refused(state, { type: "hunt", dice: [0], trade: 1 });
    refused(state, { type: "hunt", dice: [0, 1, 2], trade: 1 });
    refused(state, { type: "hunt", dice: [0, 1], trade: 2 });
    // Without the trade the Hunt takes its reward and no more.
    refused(state, { type: "hunt", dice: [0, 1] });
  });

  it("is refused when the row does not offer it", () => {
    const two = turnState({
      board: board({ hunt: [placed("thornkit"), placed("thornkit")] }),
    });
    expect(canTrade(two, "hunt")).toBe(false);
    refused(two, { type: "hunt", dice: [0, 1, 2], trade: 0 });
  });

  it("is refused when there is no extra die to take, or no cat to pay", () => {
    const bare = { ...state, feeder: ["flame" as const] };
    expect(canTrade(bare, "hunt")).toBe(false);
    refused(bare, { type: "hunt", dice: [0], trade: 0 });
    const empty = { ...state, hand: [] };
    expect(canTrade(empty, "hunt")).toBe(false);
    refused(empty, { type: "hunt", dice: [0, 1], trade: 0 });
  });
});

describe("the Den's trade", () => {
  const state = turnState({
    board: board({ den: [placed("bramblepaw")] }),
    essence: { ...emptyPool(), mist: 1 },
  });
  const slot = { row: "den" as const, col: 0 };

  it("spends a food and lays one yarn more", () => {
    expect(rowReward(state, "den")).toBe(2);
    const { state: next } = applyAction(state, {
      type: "den",
      targets: [slot, slot, slot],
      trade: "mist",
    });
    expect(next.board.den[0]?.yarn).toBe(3);
    expect(next.essence.mist).toBe(0);
  });

  it("is refused unless every yarn it buys is laid", () => {
    refused(state, { type: "den", targets: [slot, slot], trade: "mist" });
    refused(state, { type: "den", targets: [slot, slot, slot] });
  });

  it("is refused for a food that is not held", () => {
    refused(state, { type: "den", targets: [slot, slot, slot], trade: "volt" });
  });

  it("is refused when the board cannot hold the extra yarn", () => {
    const full = turnState({
      board: board({ den: [placed("bramblepaw", { yarn: 3 })] }),
      essence: { ...emptyPool(), mist: 1 },
    });
    expect(canTrade(full, "den")).toBe(false);
    refused(full, { type: "den", targets: [slot, slot, slot], trade: "mist" });
    expect(full.essence.mist).toBe(1);
  });

  it("is refused with no food at all", () => {
    const broke = { ...state, essence: emptyPool() };
    expect(canTrade(broke, "den")).toBe(false);
  });
});

describe("the Prowl's trade", () => {
  const state = turnState({
    board: board({
      prowl: [placed("thornkit")],
      den: [placed("bramblepaw", { yarn: 2 })],
    }),
  });
  const payer = { row: "den" as const, col: 0 };

  it("spends a yarn from the chosen cat and takes one cat more", () => {
    expect(rowReward(state, "prowl")).toBe(1);
    const { state: next } = applyAction(state, {
      type: "prowl",
      picks: [0, "deck"],
      trade: payer,
    });
    expect(next.board.den[0]?.yarn).toBe(1);
    expect(next.hand).toHaveLength(4);
  });

  it("is refused for a cat with no yarn, or the wrong number of picks", () => {
    refused(state, {
      type: "prowl",
      picks: [0, "deck"],
      trade: { row: "prowl", col: 0 },
    });
    refused(state, { type: "prowl", picks: [0], trade: payer });
    refused(state, { type: "prowl", picks: [0, "deck"] });
  });

  it("is refused when there is no extra cat to take", () => {
    const thin = { ...state, tray: ["emberkit"], deck: [], discard: [] };
    expect(canTrade(thin, "prowl")).toBe(false);
    refused(thin, { type: "prowl", picks: [0], trade: payer });
  });

  it("is refused with no yarn on the board", () => {
    const bare = turnState({ board: board({ prowl: [placed("thornkit")] }) });
    expect(canTrade(bare, "prowl")).toBe(false);
  });
});

describe("trades in the list of legal actions", () => {
  const state = turnState({
    board: board({
      hunt: [placed("thornkit")],
      den: [placed("bramblepaw", { yarn: 1 })],
      prowl: [placed("thornkit")],
    }),
    essence: { ...emptyPool(), mist: 1 },
  });
  const trades = legalActions(state).filter(
    (action) => "trade" in action && action.trade !== undefined,
  );

  it("appear for every row that offers one, and each is accepted", () => {
    expect(new Set(trades.map((action) => action.type))).toEqual(
      new Set(["hunt", "den", "prowl"]),
    );
    for (const action of trades) {
      expect(() => applyAction(state, action)).not.toThrow();
    }
  });

  it("list the Hunt's once for each different cat in hand", () => {
    const twins = { ...state, hand: ["emberkit", "emberkit", "flameclaw"] };
    const discards = new Set(
      legalActions(twins).flatMap((action) =>
        action.type === "hunt" && action.trade !== undefined
          ? [action.trade]
          : [],
      ),
    );
    expect(discards).toEqual(new Set([0, 2]));
  });

  it("are told to the client row by row", () => {
    expect(toMatchView(lift(state)).trades).toEqual({
      hunt: true,
      den: true,
      prowl: true,
    });
    const none = turnState();
    expect(toMatchView(lift(none)).trades).toEqual({
      hunt: false,
      den: false,
      prowl: false,
    });
  });
});
