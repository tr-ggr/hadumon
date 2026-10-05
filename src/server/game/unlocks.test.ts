import { describe, expect, it } from "vitest";

import { CAT_LIST, CATS } from "./cats";
import { RELIC_LIST, RELICS } from "./relics";
import { CLAN_LIST, CLANS, isClanId, type RunSummary } from "./run";
import {
  earnedUnlocks,
  poolFromUnlocks,
  STARTING_UNLOCKS,
  UNLOCK_RULES,
  unlockId,
} from "./unlocks";

const summary = (extra: Partial<RunSummary> = {}): RunSummary => ({
  clanId: "flame",
  difficulty: "kitten",
  matchesWon: 0,
  won: false,
  bestMatchScore: 0,
  totalScore: 0,
  ...extra,
});

describe("unlocks", () => {
  it("starts an account with one clan, 15 cats and 10 relics", () => {
    const of = (kind: string) =>
      STARTING_UNLOCKS.filter((u) => u.kind === kind);
    expect(of("clan").map((u) => u.key)).toEqual(["flame"]);
    expect(of("cat")).toHaveLength(15);
    expect(of("relic")).toHaveLength(10);
  });

  it("makes everything in the catalogue reachable exactly once", () => {
    const all = [...STARTING_UNLOCKS, ...UNLOCK_RULES].map(unlockId).sort();
    expect(new Set(all).size).toBe(all.length);
    const catalogue = [
      ...CAT_LIST.map((c) => `cat:${c.id}`),
      ...RELIC_LIST.map((r) => `relic:${r.id}`),
      ...CLAN_LIST.map((c) => `clan:${c.id}`),
    ].sort();
    expect(all).toEqual(catalogue);
  });

  it("only names things that exist", () => {
    for (const { kind, key } of [...STARTING_UNLOCKS, ...UNLOCK_RULES]) {
      if (kind === "cat") expect(CATS[key]).toBeDefined();
      if (kind === "relic") expect(RELICS[key]).toBeDefined();
      if (kind === "clan") expect(isClanId(key)).toBe(true);
    }
  });

  it("lets every clan start with a relic that is open from the start", () => {
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
      "clan:mist",
      "relic:early-riser",
    ]);
    expect(
      earnedUnlocks(summary({ matchesWon: 1 }), [
        ...STARTING_UNLOCKS,
        ...first,
      ]),
    ).toEqual([]);

    const high = earnedUnlocks(
      summary({ bestMatchScore: 35 }),
      STARTING_UNLOCKS,
    );
    expect(high.map(unlockId)).toContain("cat:verdantmane");
    expect(high.map(unlockId)).not.toContain("cat:infernomane");
  });

  it("ties the legendaries to winning with their clan", () => {
    const won = (clanId: RunSummary["clanId"]) =>
      earnedUnlocks(
        summary({ clanId, matchesWon: 6, won: true }),
        STARTING_UNLOCKS,
      ).map(unlockId);
    expect(won("flame")).toContain("cat:stormsabre");
    expect(won("flame")).not.toContain("cat:nyxaroth");
    expect(won("shade")).toContain("cat:nyxaroth");
    expect(won("volt")).toContain("cat:aurelynx");
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
        earned({ matchesWon: 5, bestMatchScore: 42, difficulty }).filter(
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

  it("builds the reward pool from what is held", () => {
    const pool = poolFromUnlocks(STARTING_UNLOCKS);
    expect(pool.cats).toHaveLength(15);
    expect(pool.relics).toHaveLength(10);
    expect(pool.cats).not.toContain("flame");
  });
});
