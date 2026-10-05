import { describe, expect, it } from "vitest";

import type { Anchor } from "./book";
import {
  bookReducer,
  LEAF_MS,
  leafPlan,
  SHUT_BOOK,
  turnMs,
  type BookState,
  type Leaf,
} from "./turn";

const cats = (item: number): Anchor => ({ chapter: "cats", item });
const OPEN: BookState = { ...SHUT_BOOK, phase: "open" };
const go = (state: BookState, to: Anchor, calm = false) =>
  bookReducer(state, { type: "go", to, calm });

describe("bookReducer", () => {
  it("opens from shut, through opening, and never shuts again", () => {
    const opening = bookReducer(SHUT_BOOK, { type: "open" });
    expect(opening.phase).toBe("opening");
    const open = bookReducer(opening, { type: "opened" });
    expect(open.phase).toBe("open");
    expect(bookReducer(open, { type: "open" })).toBe(open);
    expect(bookReducer(open, { type: "opened" })).toBe(open);
    // Reduced motion skips the cover altogether.
    expect(bookReducer(SHUT_BOOK, { type: "opened" }).phase).toBe("open");
  });

  it("takes the chapter to open at only while it is shut", () => {
    const shut = bookReducer(SHUT_BOOK, { type: "start", chapter: "rivals" });
    expect(shut.at).toEqual({ chapter: "rivals", item: 0 });
    expect(bookReducer(OPEN, { type: "start", chapter: "rivals" })).toBe(OPEN);
  });

  it("turns no page until the book is open", () => {
    expect(go(SHUT_BOOK, cats(4))).toBe(SHUT_BOOK);
    const opening = bookReducer(SHUT_BOOK, { type: "open" });
    expect(go(opening, cats(4))).toBe(opening);
  });

  it("puts a leaf in the air and lays it down when it lands", () => {
    const turning = go(OPEN, cats(4));
    expect(turning.at).toEqual(cats(0));
    expect(turning.turn?.to).toEqual(cats(4));
    const landed = bookReducer(turning, {
      type: "landed",
      id: turning.turn!.id,
    });
    expect(landed.at).toEqual(cats(4));
    expect(landed.turn).toBeNull();
  });

  it("lets the latest request win, laying the leaf in the air down first", () => {
    const first = go(OPEN, cats(4));
    const second = go(first, cats(8));
    expect(second.at).toEqual(cats(4));
    expect(second.turn?.to).toEqual(cats(8));
    expect(second.turn?.id).not.toBe(first.turn?.id);
    // The first leaf's timer still fires; it is no longer the one in the air.
    expect(bookReducer(second, { type: "landed", id: first.turn!.id })).toBe(
      second,
    );
  });

  it("starts no leaf towards where it already is", () => {
    const turning = go(OPEN, cats(4));
    const again = go(turning, cats(4));
    expect(again.at).toEqual(cats(4));
    expect(again.turn).toBeNull();
  });

  it("cuts to the page under reduced motion", () => {
    const calm = go(OPEN, cats(8), true);
    expect(calm.at).toEqual(cats(8));
    expect(calm.turn).toBeNull();
    expect(go(go(OPEN, cats(4)), cats(8), true).turn).toBeNull();
  });

  it("settles a leaf in the air at once", () => {
    const settled = bookReducer(go(OPEN, cats(4)), { type: "settle" });
    expect(settled.at).toEqual(cats(4));
    expect(settled.turn).toBeNull();
    expect(bookReducer(OPEN, { type: "settle" })).toBe(OPEN);
  });

  it("goes back to the first cats once a filter is set", () => {
    const deep = go({ ...OPEN, at: cats(12) }, cats(16));
    const filters = { element: "volt" as const, rarity: null };
    const filtered = bookReducer(deep, { type: "filter", filters });
    expect(filtered.filters).toBe(filters);
    expect(filtered.at).toEqual(cats(0));
    expect(filtered.turn).toBeNull();
  });
});

const roles = (plan: ReadonlyMap<number | "cover", Leaf>) =>
  Object.fromEntries([...plan].map(([key, leaf]) => [key, leaf.role]));
const moving = (plan: ReadonlyMap<number | "cover", Leaf>) =>
  [...plan].filter(([, leaf]) => leaf.role === "lift" || leaf.role === "lay");

describe("leafPlan", () => {
  const ms = LEAF_MS[2];

  it("turns a spread on by lifting its right page and laying the new left", () => {
    const plan = leafPlan(2, [2, 3], [4, 5], ms);
    expect(roles(plan)).toEqual({
      2: "under",
      3: "lift",
      4: "lay",
      5: "under",
    });
    expect(plan.get(3)?.waitMs).toBe(0);
    // The second half waits edge-on for the first.
    expect(plan.get(4)?.waitMs).toBe(ms);
    expect(plan.get(5)?.shade).toBe("clear");
    expect(plan.get(2)).toEqual({ role: "under", shade: "dim", waitMs: ms });
  });

  it("turns a spread back by lifting its left page and laying the old right", () => {
    const plan = leafPlan(2, [4, 5], [2, 3], ms);
    expect(roles(plan)).toEqual({
      2: "under",
      3: "lay",
      4: "lift",
      5: "under",
    });
    expect(plan.get(3)?.waitMs).toBe(ms);
    expect(plan.get(2)?.shade).toBe("clear");
    expect(plan.get(5)?.shade).toBe("dim");
  });

  it("is one leaf whatever the distance", () => {
    const near = leafPlan(2, [0, 1], [2, 3], ms);
    const far = leafPlan(2, [0, 1], [12, 13], ms);
    expect(moving(far)).toHaveLength(moving(near).length);
    expect(roles(far)).toEqual({
      0: "under",
      1: "lift",
      12: "lay",
      13: "under",
    });
  });

  it("never moves two pages on one side of the spine", () => {
    for (const [from, to] of [
      [
        [0, 1],
        [2, 3],
      ],
      [
        [6, 7],
        [0, 1],
      ],
    ] as const) {
      const sides = moving(leafPlan(2, from, to, ms)).map(
        ([key]) => (key as number) % 2,
      );
      expect(new Set(sides).size).toBe(sides.length);
      expect(sides).toHaveLength(2);
    }
  });

  it("moves one page on a phone: off the next, or down over the last", () => {
    const on = leafPlan(1, [2], [3], LEAF_MS[1]);
    expect(roles(on)).toEqual({ 2: "lift", 3: "under" });
    expect(on.get(3)?.shade).toBe("clear");
    const back = leafPlan(1, [3], [2], LEAF_MS[1]);
    expect(roles(back)).toEqual({ 2: "lay", 3: "under" });
    expect(back.get(2)?.waitMs).toBe(0);
    expect(back.get(3)?.shade).toBe("dim");
  });

  it("opens the cover as the lifting leaf", () => {
    const wide = leafPlan(2, "cover", [0, 1], ms);
    expect(roles(wide)).toEqual({ cover: "lift", 0: "lay", 1: "under" });
    expect(wide.get(0)?.waitMs).toBe(ms);
    const narrow = leafPlan(1, "cover", [0], LEAF_MS[1]);
    expect(roles(narrow)).toEqual({ cover: "lift", 0: "under" });
  });

  it("leaves a spread at rest when there is nowhere to turn", () => {
    expect(roles(leafPlan(2, [2, 3], [2, 3], ms))).toEqual({
      2: "rest",
      3: "rest",
    });
  });
});

describe("turnMs", () => {
  it("is two half-turns for a spread and one for a single page", () => {
    expect(turnMs(2, 220)).toBe(440);
    expect(turnMs(1, 300)).toBe(300);
  });
});
