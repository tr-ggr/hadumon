import { describe, expect, it } from "vitest";

import { applyAction, type Action, type MatchState } from "~/server/game/match";
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
  rivalActionText,
} from "./describe";
import {
  boardYarnRoom,
  fillYarn,
  huntTake,
  toggleDie,
  whyUnplayable,
  yarnRoom,
} from "./turn";

function newMatch(): MatchState {
  const run = startRun({
    seed: "describe-test",
    clanId: "flame",
    pool: poolFromUnlocks(STARTING_UNLOCKS),
  });
  if (!run.match) throw new Error("no match");
  return run.match;
}

/** Applies an action and returns everything the UI would have to hand. */
function step(state: MatchState, action: Action) {
  const before = toMatchView(state);
  const result = applyAction(state, action);
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

describe("rivalActionText", () => {
  it("names what was taken when the event says", () => {
    expect(rivalActionText("alley-tom", "raid", ["flame", "wild"], 2)).toBe(
      "Raided 2 dice: Flame and Wild",
    );
    expect(rivalActionText("alley-tom", "burn", ["bramblepaw"], 2)).toBe(
      "Burned Bramblepaw",
    );
    expect(rivalActionText("alley-tom", "burn", [], 2)).toBe(
      "Found nothing in the tray to burn",
    );
  });

  it("stays general when only the card is known", () => {
    expect(rivalActionText("madame-mittens", "raid", null, 3)).toBe(
      "Raided 2 dice",
    );
    expect(rivalActionText("rooftop-syndicate", "burn", null, 3)).toBe(
      "Burned 2 tray cards",
    );
    expect(rivalActionText("alley-tom", "bank", null, 2)).toBe(
      "Banked a cat, worth 2",
    );
    expect(rivalActionText("dockside-twins", "stash", null, 2)).toBe(
      "Stashed 2 yarn",
    );
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
    ).toBe("You kept 2 cats and 1 essence.");
  });

  it("names the dice a hunt took", () => {
    const view = kept.after;
    const text = describeAction(view, { type: "hunt", dice: [0] });
    expect(text).toMatch(
      /^You hunted and took (Flame|Mist|Volt|Thorn|Shade|Wild)\.$/,
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

  it("names the cat and the row of a play", () => {
    const view = { ...kept.after, hand: ["voltwhisk"] };
    expect(describeAction(view, { type: "play", hand: 0, row: "prowl" })).toBe(
      "You played Voltwhisk into the Prowl.",
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
    expect(rival).toHaveLength(1);
    expect(rival[0]?.text).toMatch(/^Alley Tom .+\.$/);
    expect(latestRivalText(hunted.after, hunted.events)).not.toBeNull();
  });

  it("reports nothing for the keep itself", () => {
    expect(describeEvents(kept.before, kept.after, kept.events)).toEqual([]);
    expect(latestRivalText(kept.after, kept.events)).toBeNull();
  });

  it("reports a scored goal at the end of a round", () => {
    let state = kept.state;
    let last = step(state, { type: "den", targets: [] });
    for (let turn = 1; turn < 5; turn++) {
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
        { ...base, essence: { ...view.essence, flame: 0, wild: 0 } },
        1,
      ),
    ).toBe("Not enough essence for Flameclaw.");
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
});
