import { describe, expect, it } from "vitest";

import {
  BASE_GOLD_PER_WIN,
  BASE_XP_PER_WIN,
  creditedSeconds,
  LOSS_GOLD_FRACTION,
  nextClaimedAt,
  pendingEncounters,
  resolveExpedition,
  RETREAT_LOSS_STREAK,
  secondsToNextEncounter,
  toCombatant,
  type ExpeditionState,
  type SquadCreature,
} from "./idle";
import { getZone, MAX_OFFLINE_SECONDS } from "./zones";

const MEADOWS = getZone("whisker-meadows");
const CATACOMBS = getZone("moonlit-catacombs");

function squad(
  count: number,
  speciesId: string,
  level: number,
  upgradeTier = 0,
): SquadCreature[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `cat-${i}`,
    name: `Cat ${i}`,
    speciesId,
    level,
    xp: 0,
    upgradeTier,
  }));
}

/** Overwhelming squad — wins every encounter in the starter zone. */
const strongSquad = squad(4, "aurelynx", 50, 10);
/** Hopeless squad — loses every encounter in the end-game zone. */
const weakSquad = squad(1, "emberkit", 1);

const T0 = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));
const at = (seconds: number) => new Date(T0.getTime() + seconds * 1000);

function expedition(overrides: Partial<ExpeditionState> = {}): ExpeditionState {
  return {
    id: "exp-test",
    lastClaimedAt: T0,
    winCount: 0,
    lossCount: 0,
    ...overrides,
  };
}

describe("creditedSeconds / pendingEncounters", () => {
  it("counts whole elapsed seconds and never goes negative", () => {
    expect(creditedSeconds(T0, at(90))).toBe(90);
    expect(creditedSeconds(T0, T0)).toBe(0);
    expect(creditedSeconds(T0, at(-500))).toBe(0);
  });

  it("caps at the 8 hour offline limit", () => {
    expect(creditedSeconds(T0, at(MAX_OFFLINE_SECONDS + 10_000))).toBe(
      MAX_OFFLINE_SECONDS,
    );
    expect(pendingEncounters(T0, at(24 * 3600), MEADOWS)).toBe(
      MAX_OFFLINE_SECONDS / 60,
    );
    expect(pendingEncounters(T0, at(24 * 3600), MEADOWS)).toBe(480);
  });

  it("floors partial intervals", () => {
    expect(pendingEncounters(T0, at(59), MEADOWS)).toBe(0);
    expect(pendingEncounters(T0, at(60), MEADOWS)).toBe(1);
    expect(pendingEncounters(T0, at(179), MEADOWS)).toBe(2);
  });

  it("counts down to the next encounter, and stops once capped", () => {
    expect(secondsToNextEncounter(T0, at(0), MEADOWS)).toBe(60);
    expect(secondsToNextEncounter(T0, at(23), MEADOWS)).toBe(37);
    expect(
      secondsToNextEncounter(T0, at(MAX_OFFLINE_SECONDS + 5), MEADOWS),
    ).toBe(0);
  });
});

describe("nextClaimedAt", () => {
  it("advances by the seconds consumed, keeping the partial minute", () => {
    expect(nextClaimedAt(T0, at(5 * 60 + 45), 300)).toEqual(at(300));
    expect(nextClaimedAt(T0, at(59), 0)).toEqual(T0);
  });

  it("never rewinds further than the offline cap, so idle time cannot bank up", () => {
    const now = at(3 * 24 * 3600);
    const consumed = MAX_OFFLINE_SECONDS;
    const next = nextClaimedAt(T0, now, consumed);

    expect(next).toEqual(now);
    // A second claim right away therefore yields nothing.
    expect(pendingEncounters(next, now, MEADOWS)).toBe(0);
  });
});

describe("resolveExpedition — encounter counts", () => {
  it("resolves nothing before the first interval elapses", () => {
    const result = resolveExpedition({
      expedition: expedition(),
      squad: strongSquad,
      zone: MEADOWS,
      now: at(59),
    });

    expect(result.encounters).toHaveLength(0);
    expect(result.secondsConsumed).toBe(0);
    expect(result.rewards).toMatchObject({
      gold: 0,
      gems: 0,
      xp: 0,
      materials: 0,
    });
    expect(result.latestFight).toBeNull();
  });

  it("resolves one encounter per elapsed minute", () => {
    const result = resolveExpedition({
      expedition: expedition(),
      squad: strongSquad,
      zone: MEADOWS,
      now: at(12 * 60 + 45),
    });

    expect(result.encounters).toHaveLength(12);
    expect(result.winCount + result.lossCount).toBe(12);
  });

  it("consumes only whole intervals so partial minutes carry over", () => {
    const result = resolveExpedition({
      expedition: expedition(),
      squad: strongSquad,
      zone: MEADOWS,
      now: at(5 * 60 + 45),
    });

    expect(result.encounters).toHaveLength(5);
    expect(result.secondsConsumed).toBe(300);

    // Advancing the watermark by secondsConsumed leaves the 45s remainder.
    const nextClaimedAt = at(result.secondsConsumed);
    expect(pendingEncounters(nextClaimedAt, at(5 * 60 + 45), MEADOWS)).toBe(0);
    expect(pendingEncounters(nextClaimedAt, at(6 * 60 + 15), MEADOWS)).toBe(1);
  });

  it("yields nothing on an immediate second claim (no double-claim)", () => {
    const now = at(4 * 60 + 30);
    const first = resolveExpedition({
      expedition: expedition(),
      squad: strongSquad,
      zone: MEADOWS,
      now,
    });
    expect(first.encounters).toHaveLength(4);

    const second = resolveExpedition({
      expedition: {
        id: "exp-test",
        lastClaimedAt: at(first.secondsConsumed),
        winCount: first.winCount,
        lossCount: first.lossCount,
      },
      squad: strongSquad,
      zone: MEADOWS,
      now,
    });

    expect(second.encounters).toHaveLength(0);
    expect(second.rewards.gold).toBe(0);
    expect(second.secondsConsumed).toBe(0);
  });

  it("enforces the 8h offline cap however long the player is away", () => {
    const result = resolveExpedition({
      expedition: expedition(),
      squad: strongSquad,
      zone: MEADOWS,
      now: at(3 * 24 * 3600),
    });

    expect(result.encounters).toHaveLength(480);
    expect(result.secondsConsumed).toBe(MAX_OFFLINE_SECONDS);
  });
});

describe("resolveExpedition — retreat", () => {
  it("stops after three losses in a row and flags a retreat", () => {
    const result = resolveExpedition({
      expedition: expedition(),
      squad: weakSquad,
      zone: CATACOMBS,
      now: at(60 * 60),
    });

    expect(result.retreated).toBe(true);
    expect(result.lossCount).toBe(RETREAT_LOSS_STREAK);
    expect(result.winCount).toBe(0);
    expect(result.encounters).toHaveLength(RETREAT_LOSS_STREAK);
    expect(result.secondsConsumed).toBe(RETREAT_LOSS_STREAK * 60);
    expect(result.encounters.every((e) => !e.won)).toBe(true);
  });

  it("does not retreat a squad that keeps winning", () => {
    const result = resolveExpedition({
      expedition: expedition(),
      squad: strongSquad,
      zone: MEADOWS,
      now: at(40 * 60),
    });

    expect(result.retreated).toBe(false);
    expect(result.winCount).toBe(40);
    expect(result.lossCount).toBe(0);
  });
});

describe("resolveExpedition — rewards", () => {
  it("pays 10 * tier * rewardMult gold per win, a quarter of that per loss", () => {
    const winGold = Math.floor(
      BASE_GOLD_PER_WIN * MEADOWS.tier * MEADOWS.rewardMult,
    );
    const result = resolveExpedition({
      expedition: expedition(),
      squad: strongSquad,
      zone: MEADOWS,
      now: at(30 * 60),
    });

    const expected =
      result.winCount * winGold +
      result.lossCount * Math.floor(winGold * LOSS_GOLD_FRACTION);
    expect(result.rewards.gold).toBe(expected);
    expect(result.encounters.reduce((total, e) => total + e.gold, 0)).toBe(
      result.rewards.gold,
    );
  });

  it("scales gold with zone tier and reward multiplier", () => {
    const meadowsGold = Math.floor(
      BASE_GOLD_PER_WIN * MEADOWS.tier * MEADOWS.rewardMult,
    );
    const catacombsGold = Math.floor(
      BASE_GOLD_PER_WIN * CATACOMBS.tier * CATACOMBS.rewardMult,
    );
    expect(catacombsGold).toBeGreaterThan(meadowsGold);

    const result = resolveExpedition({
      expedition: expedition(),
      squad: strongSquad,
      zone: MEADOWS,
      now: at(60),
    });
    expect(result.encounters[0]!.gold).toBe(meadowsGold);
  });

  it("awards 25 * tier XP per win, halved on a loss, split evenly across the squad", () => {
    const win = resolveExpedition({
      expedition: expedition(),
      squad: strongSquad,
      zone: MEADOWS,
      now: at(60),
    });
    expect(win.encounters[0]!.won).toBe(true);
    expect(win.encounters[0]!.xp).toBe(BASE_XP_PER_WIN * MEADOWS.tier);
    const share = Math.floor(
      (BASE_XP_PER_WIN * MEADOWS.tier) / strongSquad.length,
    );
    for (const gain of win.xpPerCreature) expect(gain.xpGained).toBe(share);

    const loss = resolveExpedition({
      expedition: expedition(),
      squad: weakSquad,
      zone: CATACOMBS,
      now: at(60),
    });
    expect(loss.encounters[0]!.won).toBe(false);
    expect(loss.encounters[0]!.xp).toBe(
      Math.floor((BASE_XP_PER_WIN * CATACOMBS.tier) / 2),
    );
  });

  it("drops gems and zone-element shards on wins only", () => {
    const result = resolveExpedition({
      expedition: expedition(),
      squad: strongSquad,
      zone: MEADOWS,
      now: at(200 * 60),
    });

    expect(result.rewards.materialElement).toBe(MEADOWS.element);
    expect(result.rewards.gems).toBeGreaterThan(0);
    expect(result.rewards.materials).toBeGreaterThan(0);
    // ~10% gems / ~35% shards over 200 wins — generous bounds, still meaningful.
    expect(result.rewards.gems).toBeLessThan(result.encounters.length * 0.3);
    expect(result.rewards.materials).toBeLessThan(
      result.encounters.length * 0.6,
    );
    expect(result.rewards.materials).toBeGreaterThan(result.rewards.gems);

    const losses = resolveExpedition({
      expedition: expedition(),
      squad: weakSquad,
      zone: CATACOMBS,
      now: at(60 * 60),
    });
    expect(losses.rewards.gems).toBe(0);
    expect(losses.rewards.materials).toBe(0);
  });

  it("levels cats up and reports the before/after progression", () => {
    const fresh = squad(2, "aurelynx", 1);
    const result = resolveExpedition({
      expedition: expedition(),
      squad: fresh,
      zone: MEADOWS,
      now: at(120 * 60),
    });

    for (const gain of result.xpPerCreature) {
      expect(gain.levelBefore).toBe(1);
      expect(gain.levelAfter).toBeGreaterThan(1);
      expect(gain.leveledUp).toBe(true);
      expect(gain.xpGained).toBeGreaterThan(0);
    }
  });
});

describe("resolveExpedition — determinism and replay", () => {
  it("produces identical results for identical inputs", () => {
    const input = {
      expedition: expedition(),
      squad: strongSquad,
      zone: MEADOWS,
      now: at(25 * 60),
    };
    expect(resolveExpedition(input)).toEqual(resolveExpedition(input));
  });

  it("differs between expeditions with the same squad and timing", () => {
    const a = resolveExpedition({
      expedition: { ...expedition(), id: "exp-a" },
      squad: strongSquad,
      zone: MEADOWS,
      now: at(25 * 60),
    });
    const b = resolveExpedition({
      expedition: { ...expedition(), id: "exp-b" },
      squad: strongSquad,
      zone: MEADOWS,
      now: at(25 * 60),
    });
    expect(a.encounters).not.toEqual(b.encounters);
  });

  it("continues the encounter index across claims so seeds never repeat", () => {
    const later = resolveExpedition({
      expedition: { ...expedition(), winCount: 7, lossCount: 3 },
      squad: strongSquad,
      zone: MEADOWS,
      now: at(2 * 60),
    });
    expect(later.encounters.map((e) => e.index)).toEqual([10, 11]);
  });

  it("keeps only the last fight's log for replay", () => {
    const result = resolveExpedition({
      expedition: expedition(),
      squad: strongSquad,
      zone: MEADOWS,
      now: at(3 * 60),
    });

    expect(result.latestFight).not.toBeNull();
    expect(result.latestFight!.encounterIndex).toBe(2);
    expect(result.latestFight!.events.length).toBeGreaterThan(0);
    expect(result.latestFight!.squad).toHaveLength(strongSquad.length);
    expect(result.latestFight!.enemies.length).toBeGreaterThanOrEqual(2);
  });
});

describe("toCombatant", () => {
  it("mirrors the creature's species element and effective stats", () => {
    const combatant = toCombatant({
      id: "c1",
      name: "Sparky",
      speciesId: "voltwhisk",
      level: 10,
      xp: 0,
      upgradeTier: 2,
    });

    expect(combatant.element).toBe("volt");
    expect(combatant.name).toBe("Sparky");
    expect(combatant.stats.speed).toBeGreaterThan(48);
  });
});
