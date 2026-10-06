import { describe, expect, it } from "vitest";

import { GAUNTLET, getRival } from "~/server/game/rival";

import { duration, outcomeText, timeAgo } from "./runText";

describe("outcomeText", () => {
  it("names the rival a lost run stopped at", () => {
    expect(outcomeText({ status: "lost", matchesWon: 2 })).toBe(
      `Lost to ${getRival(GAUNTLET[2]!).name}`,
    );
  });

  it("says a won or abandoned run plainly", () => {
    expect(outcomeText({ status: "won", matchesWon: 6 })).toBe("Won");
    expect(outcomeText({ status: "abandoned", matchesWon: 1 })).toBe(
      "Abandoned",
    );
  });
});

describe("timeAgo", () => {
  it("counts in the largest whole unit", () => {
    const now = Date.UTC(2026, 0, 10);
    expect(timeAgo(now - 30_000, now)).toBe("just now");
    expect(timeAgo(now - 5 * 60_000, now)).toBe("5 minutes ago");
    expect(timeAgo(now - 86_400_000, now)).toBe("yesterday");
  });
});

describe("duration", () => {
  const start = new Date(Date.UTC(2026, 0, 10, 12));
  const after = (minutes: number) =>
    new Date(start.getTime() + minutes * 60_000);

  it("is nothing for a run that never ended", () => {
    expect(duration(start, null)).toBeNull();
  });

  it("reads in minutes, then hours and minutes", () => {
    expect(duration(start, after(0))).toBe("under a minute");
    expect(duration(start, after(42))).toBe("42 min");
    expect(duration(start, after(60))).toBe("1 h");
    expect(duration(start, after(65))).toBe("1 h 5 min");
  });
});
