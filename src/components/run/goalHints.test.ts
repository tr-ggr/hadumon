import { describe, expect, it } from "vitest";

import { keepHints } from "./goalHints";

describe("keepHints", () => {
  it("says how each kept cat counts towards a row's goal, and leaves out the rest", () => {
    // Flameclaw lives in the Hunt; Pyrelynx in the Den and the Prowl.
    expect(
      keepHints(["hunting-party", "full-den"], ["flameclaw", "pyrelynx"], []),
    ).toEqual([
      {
        cats: [{ catId: "flameclaw", hint: "can live in the Hunt" }],
        food: [],
      },
      { cats: [{ catId: "pyrelynx", hint: "can live in the Den" }], food: [] },
    ]);
  });

  it("counts kept food only towards a goal that counts food", () => {
    expect(keepHints(["pantry", "crowd"], [], ["flame", "mist"])).toEqual([
      { cats: [], food: ["flame", "mist"] },
      { cats: [], food: [] },
    ]);
  });

  it("knows a cat by its power", () => {
    // Flameclaw fetches food; Pyrelynx caches it.
    expect(
      keepHints(["pantry", "stash"], ["flameclaw", "pyrelynx"], []),
    ).toEqual([
      { cats: [{ catId: "flameclaw", hint: "fetches food" }], food: [] },
      { cats: [{ catId: "pyrelynx", hint: "caches or tucks" }], food: [] },
    ]);
  });
});
