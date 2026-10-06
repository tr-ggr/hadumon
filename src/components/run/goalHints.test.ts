import { describe, expect, it } from "vitest";

import { keepHints } from "./goalHints";

describe("keepHints", () => {
  it("says how each kept cat counts towards a row's goal, and leaves out the rest", () => {
    // Flameclaw lives in the Hunt; Pyrelynx in the Den and the Prowl.
    expect(
      keepHints(["hunting-party", "full-den"], ["flameclaw", "pyrelynx"], []),
    ).toEqual([
      ["Flameclaw: can live in the Hunt"],
      ["Pyrelynx: can live in the Den"],
    ]);
  });

  it("puts cats that count the same way on one line", () => {
    expect(keepHints(["crowd"], ["flameclaw", "emberkit"], [])).toEqual([
      ["Flameclaw and Emberkit: one more cat on the board"],
    ]);
  });

  it("counts kept food only towards a goal that counts food", () => {
    expect(keepHints(["pantry", "crowd"], [], ["flame", "mist"])).toEqual([
      ["2 food kept"],
      [],
    ]);
  });

  it("knows a cat by its power", () => {
    // Flameclaw fetches food; Pyrelynx caches it.
    expect(
      keepHints(["pantry", "stash"], ["flameclaw", "pyrelynx"], []),
    ).toEqual([["Flameclaw: fetches food"], ["Pyrelynx: caches or tucks"]]);
  });
});
