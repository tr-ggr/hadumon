import { describe, expect, it } from "vitest";

import { CATS } from "./cats";
import { CLANS } from "./clans";
import { STARTER_COLLECTION } from "./collection";
import { RELIC_LIST, RELICS } from "./relics";
import { deckElements, type RunSummary } from "./run";
import {
  earnedUnlocks,
  ELEMENT_DECK,
  HIGH_SCORE,
  relicsFromUnlocks,
  STARTING_UNLOCKS,
  startingPool,
  TOP_SCORE,
  UNLOCK_KINDS,
  UNLOCK_RULES,
  unlockId,
} from "./unlocks";

const summary = (extra: Partial<RunSummary> = {}): RunSummary => ({
  difficulty: "kitten",
  matchesWon: 0,
  matchesPlayed: 0,
  won: false,
  bestMatchScore: 0,
  totalScore: 0,
  deckElements: deckElements([]),
  goalsSwept: 0,
  reclaimed: 0,
  ...extra,
});

/** The trophy cats: each is handed over once, for what a run did. */
const TROPHIES = [
  "nimbustail",
  "pyrelynx",
  "arcpurr",
  "umbralynx",
  "verdantmane",
  "oraclemew",
  "infernomane",
  "stormsabre",
  "nyxaroth",
  "aurelynx",
  "hadu",
];

describe("unlocks", () => {
  it("are prizes of two kinds, a cat or a relic, and no clan", () => {
    expect([...UNLOCK_KINDS]).toEqual(["cat", "relic"]);
    for (const { kind } of [...STARTING_UNLOCKS, ...UNLOCK_RULES]) {
      expect(UNLOCK_KINDS).toContain(kind);
    }
  });

  it("start an account with ten relics; its cats are its collection", () => {
    expect(STARTING_UNLOCKS.every((u) => u.kind === "relic")).toBe(true);
    expect(STARTING_UNLOCKS).toHaveLength(10);
    const pool = startingPool();
    expect(pool.relics).toEqual(relicsFromUnlocks(STARTING_UNLOCKS));
    expect(pool.cats).toEqual(Object.keys(STARTER_COLLECTION).sort());
    expect(pool.cats).toHaveLength(15);
  });

  it("make every relic reachable exactly once", () => {
    const relics = [...STARTING_UNLOCKS, ...UNLOCK_RULES]
      .filter((u) => u.kind === "relic")
      .map((u) => u.key)
      .sort();
    expect(relics).toEqual(RELIC_LIST.map((r) => r.id).sort());
  });

  it("hand over each trophy cat once, and no cat a new account holds", () => {
    const cats = UNLOCK_RULES.filter((u) => u.kind === "cat").map((u) => u.key);
    expect([...cats].sort()).toEqual([...TROPHIES].sort());
    for (const catId of cats) {
      expect(STARTER_COLLECTION[catId]).toBeUndefined();
    }
    // Every other cat comes out of a pack and has no rule.
    const all = [...STARTING_UNLOCKS, ...UNLOCK_RULES].map(unlockId);
    expect(new Set(all).size).toBe(all.length);
  });

  it("only name things that exist", () => {
    for (const { kind, key } of [...STARTING_UNLOCKS, ...UNLOCK_RULES]) {
      if (kind === "cat") expect(CATS[key]).toBeDefined();
      if (kind === "relic") expect(RELICS[key]).toBeDefined();
    }
  });

  it("open every clan's charm from the start, for the rivals and the chest", () => {
    const open = new Set(STARTING_UNLOCKS.map(unlockId));
    for (const clan of Object.values(CLANS)) {
      expect(open.has(`relic:${clan.relicId}`)).toBe(true);
    }
  });

  it("awards what a run earned and nothing already held", () => {
    expect(earnedUnlocks(summary(), STARTING_UNLOCKS)).toEqual([]);

    const first = earnedUnlocks(summary({ matchesWon: 1 }), STARTING_UNLOCKS);
    expect(first.map(unlockId).sort()).toEqual([
      "cat:nimbustail",
      "relic:early-riser",
    ]);
    expect(
      earnedUnlocks(summary({ matchesWon: 1 }), [
        ...STARTING_UNLOCKS,
        ...first,
      ]),
    ).toEqual([]);

    const high = earnedUnlocks(
      summary({ bestMatchScore: HIGH_SCORE }),
      STARTING_UNLOCKS,
    );
    expect(high.map(unlockId)).toContain("cat:verdantmane");
    expect(high.map(unlockId)).not.toContain("cat:infernomane");
  });

  it("ties two legendaries to winning with a deck built on their element", () => {
    const won = (deck: Partial<RunSummary["deckElements"]>) =>
      earnedUnlocks(
        summary({
          matchesWon: 6,
          won: true,
          deckElements: { ...deckElements([]), ...deck },
        }),
        STARTING_UNLOCKS,
      ).map(unlockId);
    expect(won({ flame: 24 })).toContain("cat:stormsabre");
    expect(won({ flame: 24 })).not.toContain("cat:nyxaroth");
    expect(won({ shade: ELEMENT_DECK })).toContain("cat:nyxaroth");
    expect(won({ shade: ELEMENT_DECK - 1 })).not.toContain("cat:nyxaroth");
    expect(won({ volt: ELEMENT_DECK })).toContain("cat:aurelynx");
    expect(won({ volt: ELEMENT_DECK })).not.toContain("cat:nyxaroth");
    // Half a deck of each is one deck: both can be won at once.
    expect(won({ shade: 12, volt: 12 })).toEqual(
      expect.arrayContaining(["cat:nyxaroth", "cat:aurelynx"]),
    );
    // A deck built on it earns nothing for a run that was lost.
    expect(
      earnedUnlocks(
        summary({
          matchesWon: 5,
          deckElements: { ...deckElements([]), shade: 24 },
        }),
        STARTING_UNLOCKS,
      ).map(unlockId),
    ).not.toContain("cat:nyxaroth");
    const hint = UNLOCK_RULES.find((rule) => rule.key === "nyxaroth")?.hint;
    expect(hint).toBe("Win a run with 12 or more Shade cats in your deck.");
  });

  describe("by tier", () => {
    const earned = (extra: Partial<RunSummary>) =>
      earnedUnlocks(summary(extra), STARTING_UNLOCKS).map(unlockId);
    const cleared = { matchesWon: 6, won: true } as const;

    it("pays a Kitten win what a win always paid, less the tier prizes", () => {
      const kitten = earned({ ...cleared, difficulty: "kitten" });
      expect(kitten).toContain("cat:stormsabre");
      expect(kitten).toContain("cat:umbralynx");
      expect(kitten).not.toContain("relic:quiet-corner");
      expect(kitten).not.toContain("relic:loud-bell");
      expect(kitten).not.toContain("cat:hadu");
    });

    it("opens the Quiet Corner and the Loud Bell from Stray up", () => {
      const stray = earned({ ...cleared, difficulty: "stray" });
      expect(stray).toContain("cat:stormsabre");
      expect(stray).toContain("relic:quiet-corner");
      expect(stray).toContain("relic:loud-bell");
      expect(stray).not.toContain("cat:hadu");
    });

    it("keeps Hadu for a run won on Apex", () => {
      const apex = earned({ ...cleared, difficulty: "apex" });
      expect(apex).toEqual(
        expect.arrayContaining([
          "cat:stormsabre",
          "relic:quiet-corner",
          "relic:loud-bell",
          "cat:hadu",
        ]),
      );
      expect(earned({ matchesWon: 5, difficulty: "apex" })).not.toContain(
        "cat:hadu",
      );
    });

    it("gives the Loud Bell for the first boss, not the whole run", () => {
      expect(earned({ matchesWon: 3, difficulty: "stray" })).toContain(
        "relic:loud-bell",
      );
      expect(earned({ matchesWon: 2, difficulty: "apex" })).not.toContain(
        "relic:loud-bell",
      );
      expect(earned({ matchesWon: 5, difficulty: "kitten" })).not.toContain(
        "relic:loud-bell",
      );
    });

    it("pays every rule that does not name a tier on all three", () => {
      const untiered = (difficulty: RunSummary["difficulty"]) =>
        earned({ matchesWon: 5, bestMatchScore: TOP_SCORE, difficulty }).filter(
          (id) => id !== "relic:loud-bell",
        );
      expect(untiered("stray")).toEqual(untiered("kitten"));
      expect(untiered("apex")).toEqual(untiered("kitten"));
    });

    it("says in the hint which tier a rule wants", () => {
      const hint = (id: string) =>
        UNLOCK_RULES.find((rule) => unlockId(rule) === id)?.hint;
      expect(hint("cat:stormsabre")).toBe("Win a run.");
      expect(hint("relic:quiet-corner")).toBe("Win a run on Stray or harder.");
      expect(hint("cat:hadu")).toBe("Win a run on Apex.");
      expect(hint("relic:loud-bell")).toBe(
        "Beat Madame Mittens on Stray or harder.",
      );
    });
  });
});
