import { describe, expect, it } from "vitest";

import { ACHIEVEMENTS } from "~/server/game/achievements";

import { achievementShelf } from "./shelf";

describe("achievementShelf", () => {
  it("lists every achievement once, the held ones first", () => {
    const last = ACHIEVEMENTS[ACHIEVEMENTS.length - 1]!;
    const when = new Date(Date.UTC(2026, 9, 1));
    const shelf = achievementShelf([{ key: last.key, earnedAt: when }]);

    expect(shelf).toHaveLength(ACHIEVEMENTS.length);
    expect(shelf[0]).toMatchObject({ key: last.key, earnedAt: when });
    expect(shelf.slice(1).every((a) => a.earnedAt === null)).toBe(true);
  });

  it("leaves out a key the catalogue does not have", () => {
    const shelf = achievementShelf([
      { key: "no-such-thing", earnedAt: new Date() },
    ]);
    expect(shelf.some((a) => a.key === "no-such-thing")).toBe(false);
    expect(shelf.every((a) => a.earnedAt === null)).toBe(true);
  });
});
