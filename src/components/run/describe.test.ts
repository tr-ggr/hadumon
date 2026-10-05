import { describe, expect, it } from "vitest";

import { rivalPolicy } from "~/server/game/bot";
import { advance } from "~/server/game/duel";
import { ROUND_TURNS, type Action, type MatchState } from "~/server/game/match";
import { startRun } from "~/server/game/run";
import { poolFromUnlocks, STARTING_UNLOCKS } from "~/server/game/unlocks";
import { toMatchView } from "~/server/game/view";

import {
  describeAction,
  describeEvents,
  findGoal,
  goalText,
  latestRivalText,
  listWords,
  plural,
  moveText,
  tiebreakText,
} from "./describe";
import {
  boardYarnRoom,
  canSwapMore,
  essenceSpent,
  fillYarn,
  handSwap,
  huntTake,
  shortWords,
  swapOwed,
  toggleDie,
  whyUnplayable,
  yarnRoom,
} from "./turn";

const lowered = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

function newMatch(): MatchState {
  const run = startRun({
    seed: "describe-test",
    clanId: "flame",
    difficulty: "kitten",
    pool: poolFromUnlocks(STARTING_UNLOCKS),
  });
  if (!run.match) throw new Error("no match");
  return run.match;
}

/** Applies an action and returns everything the UI would have to hand. */
function step(state: MatchState, action: Action) {
  const before = toMatchView(state);
  // The rival answers, as it does when the action comes from the table.
  const result = advance(state, action, rivalPolicy);
  const after = toMatchView(result.state);
  return { before, after, events: result.events, state: result.state };
}

const kept = step(newMatch(), {
  type: "keep",
  cats: [0, 1],
  essence: ["flame", "mist", "volt"],
});

describe("words", () => {
  it("counts and joins", () => {
    expect(plural(1, "die", "dice")).toBe("1 die");
    expect(plural(2, "die", "dice")).toBe("2 dice");
    expect(plural(0, "cat")).toBe("0 cats");
    expect(listWords([])).toBe("");
    expect(listWords(["A"])).toBe("A");
    expect(listWords(["A", "B"])).toBe("A and B");
    expect(listWords(["A", "B", "C"])).toBe("A, B and C");
  });
});

describe("moveText", () => {
  it("says what a seat did, with no subject", () => {
    expect(
      moveText({ type: "play", catId: "bramblepaw", row: "den", col: 0 }),
    ).toBe("Played Bramblepaw into the Den");
    expect(
      moveText({ type: "hunt", faces: ["flame", "wild"], discarded: null }),
    ).toBe("Hunted and took Beef and Treat");
    expect(
      moveText({
        type: "den",
        targets: [
          { row: "den", col: 0 },
          { row: "den", col: 0 },
        ],
        spent: null,
      }),
    ).toBe("Went to the Den and laid 2 yarn");
    expect(moveText({ type: "reroll" })).toBe("Rerolled the feeder");
  });

  it("names what it took from its tray and only counts its deck", () => {
    expect(
      moveText({ type: "prowl", tray: ["mistpaw"], deck: 2, payer: null }),
    ).toBe("Prowled and drew Mistpaw from the tray and 2 from the deck");
    expect(moveText({ type: "prowl", tray: [], deck: 0, payer: null })).toBe(
      "Prowled and drew nothing",
    );
  });

  it("says what a trade was paid with", () => {
    expect(
      moveText({
        type: "hunt",
        faces: ["mist", "mist"],
        discarded: "emberkit",
      }),
    ).toBe("Hunted and took Fish and Fish, discarding Emberkit for 1 more die");
    expect(
      moveText({
        type: "den",
        targets: [{ row: "hunt", col: 0 }],
        spent: "volt",
      }),
    ).toBe("Went to the Den and laid 1 yarn, spending 1 Chicken for 1 more");
    expect(
      moveText({
        type: "prowl",
        tray: [],
        deck: 2,
        payer: { row: "den", col: 1 },
      }),
    ).toBe("Prowled and drew 2 from the deck, spending 1 yarn for 1 more");
  });

  it("keeps a tucked cat face down", () => {
    const slot = { row: "prowl" as const, col: 0 };
    expect(
      moveText({ type: "resolve", kind: "tuckHand", slot, took: true }),
    ).toBe("Tucked a cat from its hand");
    expect(
      moveText({ type: "resolve", kind: "trade", slot, took: false }),
    ).toBe("Kept its yarn");
  });
});

describe("tiebreakText", () => {
  it("says what settled a level match, and nothing for one that was not", () => {
    expect(tiebreakText(null)).toBeNull();
    expect(tiebreakText("food")).toContain("more food left");
    expect(tiebreakText("cats")).toContain("more cats");
    expect(tiebreakText("seat")).toContain("goes to you");
  });
});

describe("describeAction", () => {
  it("says what was kept", () => {
    expect(
      describeAction(kept.before, {
        type: "keep",
        cats: [0, 1],
        essence: ["flame"],
      }),
    ).toBe("You kept 2 cats and 1 food.");
  });

  it("names the dice a hunt took", () => {
    const view = kept.after;
    const text = describeAction(view, { type: "hunt", dice: [0] });
    expect(text).toMatch(
      /^You hunted and took (Beef|Fish|Chicken|Dry food|Pork|Treat)\.$/,
    );
  });

  it("splits a prowl between the tray and the deck", () => {
    const view = { ...kept.after, tray: ["mistpaw", "voltwhisk", "duskmew"] };
    expect(
      describeAction(view, { type: "prowl", picks: [0, "deck", "deck"] }),
    ).toBe("You prowled and drew Mistpaw from the tray and 2 from the deck.");
    expect(describeAction(view, { type: "den", targets: [] })).toBe(
      "You went to the Den and laid no yarn.",
    );
  });

  it("says what a lane's trade was paid with", () => {
    const view = {
      ...kept.after,
      hand: ["voltwhisk"],
      tray: ["mistpaw", "duskmew", "emberkit"],
      feeder: ["flame" as const, "mist" as const],
      board: {
        hunt: [],
        den: [{ catId: "bramblepaw", yarn: 2, cached: 0, tucked: 0 }],
        prowl: [],
      },
    };
    expect(describeAction(view, { type: "hunt", dice: [0, 1], trade: 0 })).toBe(
      "You hunted and took Beef and Fish, discarding Voltwhisk for 1 more die.",
    );
    const slot = { row: "den" as const, col: 0 };
    expect(
      describeAction(view, {
        type: "den",
        targets: [slot, slot, slot],
        trade: "mist",
      }),
    ).toBe("You went to the Den and laid 3 yarn, spending 1 Fish for 1 more.");
    expect(
      describeAction(view, { type: "prowl", picks: [0, "deck"], trade: slot }),
    ).toBe(
      "You prowled and drew Mistpaw from the tray and 1 from the deck, spending 1 yarn from Bramblepaw for 1 more.",
    );
  });

  it("names the cat and the row of a play", () => {
    const view = { ...kept.after, hand: ["voltwhisk"] };
    expect(describeAction(view, { type: "play", hand: 0, row: "prowl" })).toBe(
      "You played Voltwhisk into the Prowl.",
    );
  });

  it("says what a short play gave up, and for what", () => {
    const view = {
      ...kept.after,
      hand: ["flameclaw"],
      essence: { flame: 0, mist: 1, volt: 1, thorn: 0, shade: 0, wild: 0 },
    };
    expect(
      describeAction(view, {
        type: "play",
        hand: 0,
        row: "hunt",
        swap: ["mist", "volt"],
      }),
    ).toBe(
      "You played Flameclaw into the Hunt, giving up Fish and Chicken in place of Beef.",
    );
  });

  it("answers a pending tuck by name", () => {
    const view = {
      ...kept.after,
      hand: ["mistpaw"],
      board: {
        hunt: [],
        den: [],
        prowl: [{ catId: "voltwhisk", yarn: 0, cached: 0, tucked: 0 }],
      },
      pending: {
        kind: "tuckHand" as const,
        slot: { row: "prowl" as const, col: 0 },
        draw: 1,
      },
    };
    expect(describeAction(view, { type: "resolve", choice: 0 })).toBe(
      "You tucked Mistpaw under Voltwhisk.",
    );
    expect(describeAction(view, { type: "resolve", choice: null })).toBe(
      "You tucked nothing under Voltwhisk.",
    );
  });
});

describe("describeEvents", () => {
  it("always reports the rival after a turn, by name", () => {
    const hunted = step(kept.state, { type: "hunt", dice: [0] });
    const lines = describeEvents(hunted.before, hunted.after, hunted.events);
    const rival = lines.filter((line) => line.tone === "rival");
    expect(rival.length).toBeGreaterThanOrEqual(1);
    expect(rival[0]?.text).toMatch(/^Alley Tom .+\.$/);
    expect(rival[0]?.text).toBe(
      `Alley Tom ${lowered(latestRivalText(hunted.events) ?? "")}.`,
    );
    expect(hunted.after.rival.last).not.toBeNull();
  });

  it("reports nothing for the keep itself", () => {
    expect(describeEvents(kept.before, kept.after, kept.events)).toEqual([]);
    expect(latestRivalText(kept.events)).toBeNull();
  });

  it("reports a scored goal at the end of a round", () => {
    let state = kept.state;
    let last = step(state, { type: "den", targets: [] });
    for (let turn = 1; turn < ROUND_TURNS[0]; turn++) {
      state = last.state;
      last = step(state, { type: "den", targets: [] });
    }
    const goal = findGoal(last.events);
    expect(goal?.round).toBe(0);
    const lines = describeEvents(last.before, last.after, last.events);
    const line = lines.find((l) => l.tone === "goal");
    expect(line?.text).toContain("Round 1 goal");
    expect(line?.text).toContain(goalText("alley-tom", goal!));
  });
});

describe("turn helpers", () => {
  const board = {
    hunt: [{ catId: "flameclaw", yarn: 2, cached: 0, tucked: 0 }],
    den: [{ catId: "bramblepaw", yarn: 0, cached: 0, tucked: 0 }],
    prowl: [],
  };

  it("fills yarn in board order, to capacity, keeping earlier choices", () => {
    // Flameclaw holds 3 and has 2; Bramblepaw holds 5.
    expect(boardYarnRoom(board)).toBe(6);
    expect(fillYarn(board, [], 3)).toEqual([
      { row: "hunt", col: 0 },
      { row: "den", col: 0 },
      { row: "den", col: 0 },
    ]);
    const chosen = [{ row: "den" as const, col: 0 }];
    expect(fillYarn(board, chosen, 2)).toEqual([
      { row: "den", col: 0 },
      { row: "hunt", col: 0 },
    ]);
    expect(
      yarnRoom(board, [{ row: "hunt", col: 0 }], { row: "hunt", col: 0 }),
    ).toBe(0);
  });

  it("keeps a hunt at the size of its take", () => {
    expect(toggleDie([], 2, 1)).toEqual([2]);
    expect(toggleDie([2], 4, 1)).toEqual([4]);
    expect(toggleDie([2], 2, 1)).toEqual([]);
    expect(toggleDie([0, 1], 3, 2)).toEqual([1, 3]);
    expect(huntTake(kept.after)).toBe(1);
  });

  it("says why a card cannot be played", () => {
    const view = kept.after;
    const base = {
      ...view,
      hand: ["stormsabre", "flameclaw"],
      playable: [[], []],
    };
    expect(
      whyUnplayable(
        { ...base, essence: { ...view.essence, flame: 0, mist: 0, wild: 0 } },
        1,
      ),
    ).toBe("Not enough food for Flameclaw.");
    expect(
      whyUnplayable(
        { ...base, yarnCosts: { hunt: null, den: 0, prowl: 0 } },
        1,
      ),
    ).toBe("No room: the Hunt is full.");
    expect(
      whyUnplayable({ ...base, yarnCosts: { hunt: 1, den: 0, prowl: 0 } }, 1),
    ).toBe("Not enough yarn: the next slot costs 1 and your cats hold 0.");
    expect(whyUnplayable({ ...base, playable: [[], ["hunt"]] }, 1)).toBeNull();
  });

  it("works out what a short play has to give up", () => {
    const essence = { flame: 0, mist: 1, volt: 2, thorn: 0, shade: 0, wild: 0 };
    const view = { ...kept.after, hand: ["flameclaw", "mistpaw"], essence };
    expect(handSwap(view, 0)?.short).toEqual(["flame"]);
    expect(swapOwed(view, 0)).toBe(2);
    expect(swapOwed(view, 1)).toBe(0);
    expect(shortWords(["flame"])).toBe("1 Beef");
    expect(shortWords(["shade", "flame", "flame"])).toBe("2 Beef and 1 Pork");
    // Volt can go in twice, Mist once, and nothing once two are chosen.
    expect(canSwapMore(view, 0, [], "volt")).toBe(true);
    expect(canSwapMore(view, 0, ["volt"], "volt")).toBe(true);
    expect(canSwapMore(view, 0, ["mist"], "mist")).toBe(false);
    expect(canSwapMore(view, 0, [], "flame")).toBe(false);
    expect(canSwapMore(view, 0, ["volt", "volt"], "mist")).toBe(false);
    // Until the swap is whole there is nothing to spend.
    expect(essenceSpent(view, 0)).toBeNull();
    expect(essenceSpent(view, 0, ["volt"])).toBeNull();
    expect(essenceSpent(view, 0, ["mist", "volt"])).toEqual(["mist", "volt"]);
  });

  it("says which essence a play spends, as the engine will pay it", () => {
    const essence = { flame: 1, mist: 0, volt: 0, thorn: 0, shade: 1, wild: 1 };
    const view = { ...kept.after, hand: ["sparkmew", "burrfang"], essence };
    // An "any" pip takes from the fullest element; a tie goes to the first.
    expect(essenceSpent(view, 0)).toEqual(["flame"]);
    // Thorn is paid with wild, then "any" takes an element before wild.
    expect(essenceSpent(view, 1)).toEqual(["flame", "wild"]);
    expect(
      essenceSpent({ ...view, essence: { ...essence, flame: 0, shade: 0 } }, 1),
    ).toBeNull();
  });
});
