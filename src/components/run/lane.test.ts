import { describe, expect, it } from "vitest";

import { getCat } from "~/server/game/cats";
import type { Board, PlacedCat } from "~/server/game/match";
import { toMatchView } from "~/server/game/view";
import { matchRun } from "~/test/runs";

import { diceTaken } from "./flight";
import { firesText } from "./LaneReadout";
import { firingOrder, laneProgress, laneReady, type Mode } from "./turn";

function view() {
  const run = matchRun("lane-test");
  if (!run.match) throw new Error("no match");
  return toMatchView(run.match);
}

const placed = (catId: string): PlacedCat => ({
  catId,
  yarn: 0,
  cached: 0,
  tucked: 0,
  under: [],
});

/** A board with these cats in the Hunt, left to right. */
const hunting = (...cats: string[]): Board => ({
  hunt: cats.map(placed),
  den: [],
  prowl: [],
});

describe("firingOrder", () => {
  const activated = ["flameclaw", "mistpaw", "voltwhisk", "duskmew"].filter(
    (id) => getCat(id).power?.timing === "activated",
  );

  it("reads a lane from its right end to its left", () => {
    const board = hunting(...activated);
    expect(firingOrder(board, "hunt").map(({ catId }) => catId)).toEqual(
      [...activated].reverse(),
    );
    expect(firingOrder(board, "hunt").map(({ col }) => col)).toEqual(
      activated.map((_, col) => col).reverse(),
    );
  });

  it("is empty for a lane with no cats in it", () => {
    expect(firingOrder(hunting(), "hunt")).toEqual([]);
    expect(firingOrder(hunting(...activated), "den")).toEqual([]);
  });

  it("leaves out a cat whose power an activation does not fire", () => {
    const every = hunting("flameclaw", "mistpaw", "voltwhisk", "duskmew");
    for (const { catId } of firingOrder(every, "hunt")) {
      expect(getCat(catId).power?.timing).toBe("activated");
    }
    expect(firingOrder(every, "hunt")).toHaveLength(activated.length);
  });
});

describe("firesText", () => {
  it("says what a power does without the words for when", () => {
    for (const id of ["flameclaw", "mistpaw", "voltwhisk", "duskmew"]) {
      const text = firesText(id);
      if (!getCat(id).power) {
        expect(text).toBe("");
        continue;
      }
      expect(text).not.toMatch(/^When /);
      expect(text).not.toContain(":");
      expect(text.charAt(0)).toBe(text.charAt(0).toUpperCase());
      expect(text.endsWith(".")).toBe(true);
    }
  });
});

describe("a lane being chosen", () => {
  const match = view();
  const take = Math.min(match.rewards.hunt, match.feeder.length);
  const dice = (n: number): Mode => ({
    kind: "hunt",
    dice: Array.from({ length: n }, (_, i) => i),
    trade: null,
  });

  it("counts what is picked against what the lane takes", () => {
    expect(laneProgress(match, dice(0))).toEqual({ done: 0, of: take });
    expect(laneProgress(match, dice(take))).toEqual({ done: take, of: take });
    expect(laneProgress(match, { kind: "idle" })).toBeNull();
    expect(
      laneProgress(match, {
        kind: "play",
        hand: 0,
        swap: [],
        row: null,
        yarnFrom: [],
      }),
    ).toBeNull();
  });

  it("is ready once a Hunt has every die it takes", () => {
    expect(take).toBeGreaterThan(0);
    expect(laneReady(match, dice(0))).toBe(false);
    if (take > 1) expect(laneReady(match, dice(take - 1))).toBe(false);
    expect(laneReady(match, dice(take))).toBe(true);
  });

  it("is ready once a Prowl has every cat it draws", () => {
    const picks = (n: number): Mode => ({
      kind: "prowl",
      picks: Array.from({ length: n }, () => "deck" as const),
      trade: null,
    });
    expect(laneReady(match, picks(0))).toBe(false);
    if (match.prowlPicks > 0) {
      expect(laneReady(match, picks(match.prowlPicks))).toBe(true);
    }
  });

  it("never offers to send a Den that lays no yarn", () => {
    expect(laneReady(match, { kind: "den", targets: [], trade: null })).toBe(
      false,
    );
    expect(
      laneReady(match, {
        kind: "den",
        targets: [{ row: "hunt", col: 0 }],
        trade: null,
      }),
    ).toBe(true);
  });

  it("holds a Den's trade until every yarn it buys is laid", () => {
    const one: Mode = {
      kind: "den",
      targets: [{ row: "hunt", col: 0 }],
      trade: "flame",
    };
    // The trade makes the Den lay one more than its reward.
    expect(laneReady(match, one)).toBe(match.rewards.den + 1 === 1);
  });

  it("is never ready when no lane is being chosen", () => {
    expect(laneReady(match, { kind: "idle" })).toBe(false);
    expect(laneReady(match, { kind: "tuck", hand: 0 })).toBe(false);
  });
});

describe("diceTaken", () => {
  const die = (face: string, at: number) => ({ face, at });

  it("finds the dice that have left the feeder", () => {
    const seen = [die("flame", 0), die("mist", 1), die("volt", 2)];
    expect(diceTaken(seen, ["flame", "volt"])).toEqual([die("mist", 1)]);
    expect(diceTaken(seen, [])).toEqual(seen);
    expect(diceTaken(seen, ["flame", "mist", "volt"])).toEqual([]);
  });

  it("takes the first of two dice alike, as the engine does", () => {
    const seen = [die("flame", 0), die("mist", 1), die("flame", 2)];
    expect(diceTaken(seen, ["mist", "flame"])).toEqual([die("flame", 0)]);
  });

  it("flies nothing it never saw", () => {
    expect(diceTaken([], ["flame"])).toEqual([]);
  });
});
