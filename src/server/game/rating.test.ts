import { describe, expect, it } from "vitest";

import {
  DEFAULT_K,
  expectedScore,
  ratingDelta,
  RATING_FLOOR,
  ratingTier,
  updateRatings,
} from "./rating";

describe("expectedScore", () => {
  it("is 0.5 between equals", () => {
    expect(expectedScore(1200, 1200)).toBeCloseTo(0.5, 10);
  });

  it("sums to 1 for both sides", () => {
    expect(expectedScore(1500, 1100) + expectedScore(1100, 1500)).toBeCloseTo(
      1,
      10,
    );
  });

  it("gives a 400-point favourite roughly 10:1 odds", () => {
    expect(expectedScore(1400, 1000)).toBeCloseTo(10 / 11, 6);
  });

  it("increases with rating", () => {
    expect(expectedScore(1300, 1200)).toBeGreaterThan(
      expectedScore(1200, 1200),
    );
    expect(expectedScore(1100, 1200)).toBeLessThan(expectedScore(1200, 1200));
  });
});

describe("updateRatings", () => {
  it("moves both players by the same amount (zero-sum)", () => {
    const before = { attacker: 1240, defender: 1080 };
    const after = updateRatings(before.attacker, before.defender, true);

    expect(after.attacker - before.attacker).toBe(
      before.defender - after.defender,
    );
    expect(after.attacker + after.defender).toBe(
      before.attacker + before.defender,
    );
  });

  it("splits K evenly between equals", () => {
    const win = updateRatings(1000, 1000, true);
    expect(win.attacker).toBe(1000 + DEFAULT_K / 2);
    expect(win.defender).toBe(1000 - DEFAULT_K / 2);

    const loss = updateRatings(1000, 1000, false);
    expect(loss.attacker).toBe(1000 - DEFAULT_K / 2);
    expect(loss.defender).toBe(1000 + DEFAULT_K / 2);
  });

  it("rewards an upset more than an expected win", () => {
    const upset = updateRatings(900, 1500, true).attacker - 900;
    const expected = updateRatings(1500, 900, true).attacker - 1500;

    expect(upset).toBeGreaterThan(expected);
    expect(upset).toBeLessThanOrEqual(DEFAULT_K);
    expect(expected).toBeGreaterThanOrEqual(0);
  });

  it("punishes losing to a much weaker opponent", () => {
    const badLoss = 1500 - updateRatings(1500, 900, false).attacker;
    const okLoss = 900 - updateRatings(900, 1500, false).attacker;

    expect(badLoss).toBeGreaterThan(okLoss);
  });

  it("never drops a rating below the floor", () => {
    // A near-floor defender losing to a peer would go under 100 without clamping.
    expect(
      ratingDelta(RATING_FLOOR + 10, RATING_FLOOR + 5, true),
    ).toBeGreaterThan(10);
    expect(
      updateRatings(RATING_FLOOR + 10, RATING_FLOOR + 5, true).defender,
    ).toBe(RATING_FLOOR);

    // Repeated losses park you on the floor rather than digging a hole.
    let defender = RATING_FLOOR + 5;
    for (let i = 0; i < 20; i++) {
      defender = updateRatings(defender + 10, defender, true).defender;
      expect(defender).toBeGreaterThanOrEqual(RATING_FLOOR);
    }
    expect(defender).toBe(RATING_FLOOR);

    expect(updateRatings(RATING_FLOOR, RATING_FLOOR, false).attacker).toBe(
      RATING_FLOOR,
    );
  });

  it("honours a custom K factor", () => {
    expect(updateRatings(1000, 1000, true, 10).attacker).toBe(1005);
    expect(updateRatings(1000, 1000, true, 0).attacker).toBe(1000);
  });

  it("agrees with ratingDelta", () => {
    const delta = ratingDelta(1337, 1201, true);
    const after = updateRatings(1337, 1201, true);
    expect(after.attacker).toBe(1337 + delta);
    expect(after.defender).toBe(1201 - delta);
  });
});

describe("ratingTier", () => {
  it("maps ratings to ladder tiers", () => {
    expect(ratingTier(0)).toBe("Kitten");
    expect(ratingTier(999)).toBe("Kitten");
    expect(ratingTier(1000)).toBe("Stray");
    expect(ratingTier(1250)).toBe("Hunter");
    expect(ratingTier(1400)).toBe("Prowler");
    expect(ratingTier(9000)).toBe("Apex");
  });
});
