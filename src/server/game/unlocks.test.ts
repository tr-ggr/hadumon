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

  it("builds the reward pool from what is held", () => {
    const pool = poolFromUnlocks(STARTING_UNLOCKS);
    expect(pool.cats).toHaveLength(15);
    expect(pool.relics).toHaveLength(10);
    expect(pool.cats).not.toContain("flame");
  });
});
