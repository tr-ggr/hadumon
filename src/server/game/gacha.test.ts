import { describe, expect, it } from "vitest";

import {
  FEATURED_POOL,
  MULTI_COST,
  MULTI_COUNT,
  PITY_THRESHOLD,
  SINGLE_COST,
  bannerRates,
  featuredSpeciesFor,
  getBanner,
  getBanners,
  isBannerId,
  isEpicPlus,
  isRarePlus,
  isoWeek,
  nextPityCount,
  pullCost,
  rollMulti,
  rollPull,
} from "./gacha";
import { createRng } from "./rng";
import { RARITIES, getSpecies, speciesByRarity, type Rarity } from "./species";

const SAMPLES = 20_000;
const TOLERANCE_PP = 2;

/** A fixed week so the featured banner is stable across runs. */
const FIXED_WEEK = new Date("2026-03-12T00:00:00Z");

function emptyTally(): Record<Rarity, number> {
  return RARITIES.reduce<Record<Rarity, number>>(
    (acc, rarity) => {
      acc[rarity] = 0;
      return acc;
    },
    {} as Record<Rarity, number>,
  );
}

describe("banners", () => {
  it("exposes both banners with weights summing to 100", () => {
    for (const banner of getBanners(FIXED_WEEK)) {
      const total = RARITIES.reduce((sum, r) => sum + banner.weights[r], 0);
      expect(total).toBeCloseTo(100, 6);
    }
  });

  it("prices summons at 100 / 900 gems", () => {
    const banner = getBanner("standard", FIXED_WEEK);
    expect(pullCost(banner, 1)).toBe(SINGLE_COST);
    expect(pullCost(banner, MULTI_COUNT)).toBe(MULTI_COST);
  });

  it("only accepts known banner ids", () => {
    expect(isBannerId("standard")).toBe(true);
    expect(isBannerId("featured")).toBe(true);
    expect(isBannerId("nope")).toBe(false);
  });

  it("rotates the featured cat weekly over the epic+legendary pool", () => {
    expect(FEATURED_POOL.length).toBeGreaterThan(1);
    for (const species of FEATURED_POOL) {
      expect(isEpicPlus(species.rarity)).toBe(true);
    }

    const week = new Date("2026-01-05T00:00:00Z"); // ISO week 2
    const nextWeek = new Date("2026-01-12T00:00:00Z"); // ISO week 3
    const sameWeek = new Date("2026-01-08T12:00:00Z"); // still ISO week 2

    expect(isoWeek(week)).toBe(2);
    expect(isoWeek(nextWeek)).toBe(3);
    expect(featuredSpeciesFor(sameWeek).id).toBe(featuredSpeciesFor(week).id);
    expect(featuredSpeciesFor(nextWeek).id).not.toBe(featuredSpeciesFor(week).id);
  });

  it("reports rates as percentages", () => {
    const rates = bannerRates(getBanner("standard", FIXED_WEEK));
    expect(rates.common).toBeCloseTo(60, 6);
    expect(rates.legendary).toBeCloseTo(1, 6);
  });
});

describe("rollPull weight distribution", () => {
  it("matches the standard banner rates within 2pp", () => {
    const banner = getBanner("standard", FIXED_WEEK);
    const rng = createRng("distribution-standard");
    const tally = emptyTally();

    for (let i = 0; i < SAMPLES; i++) {
      // Keep pity below the threshold so it never distorts the sample.
      tally[rollPull(banner, rng, 0).rarity] += 1;
    }

    for (const rarity of RARITIES) {
      const pct = (tally[rarity] / SAMPLES) * 100;
      expect(Math.abs(pct - banner.weights[rarity])).toBeLessThan(TOLERANCE_PP);
    }
  });

  it("matches the featured banner rates within 2pp", () => {
    const banner = getBanner("featured", FIXED_WEEK);
    const rng = createRng("distribution-featured");
    const tally = emptyTally();

    for (let i = 0; i < SAMPLES; i++) {
      tally[rollPull(banner, rng, 0).rarity] += 1;
    }

    for (const rarity of RARITIES) {
      const pct = (tally[rarity] / SAMPLES) * 100;
      expect(Math.abs(pct - banner.weights[rarity])).toBeLessThan(TOLERANCE_PP);
    }
  });

  it("only ever returns species of the rolled rarity", () => {
    const banner = getBanner("featured", FIXED_WEEK);
    const rng = createRng("species-match");

    for (let i = 0; i < 2_000; i++) {
      const result = rollPull(banner, rng, 0);
      expect(getSpecies(result.speciesId).rarity).toBe(result.rarity);
    }
  });
});

describe("featured rate-up", () => {
  it("gives the featured species half of its rarity's rolls", () => {
    const banner = getBanner("featured", FIXED_WEEK);
    const featured = getSpecies(banner.featuredSpeciesId!);
    const pool = speciesByRarity(featured.rarity);
    const rng = createRng("rate-up");

    let rarityHits = 0;
    let featuredHits = 0;

    // Force the featured rarity every time by rolling species directly through
    // enough pulls that the sample is meaningful.
    for (let i = 0; i < 200_000; i++) {
      const result = rollPull(banner, rng, 0);
      if (result.rarity !== featured.rarity) continue;
      rarityHits += 1;
      if (result.speciesId === featured.id) featuredHits += 1;
    }

    expect(rarityHits).toBeGreaterThan(500);
    // 50% guaranteed, plus its uniform share of the remaining 50%.
    const expected = (0.5 + 0.5 / pool.length) * 100;
    const actual = (featuredHits / rarityHits) * 100;
    expect(Math.abs(actual - expected)).toBeLessThan(5);
  });

  it("never rate-ups on the standard banner", () => {
    const banner = getBanner("standard", FIXED_WEEK);
    expect(banner.featuredSpeciesId).toBeNull();
  });
});

describe("pity", () => {
  it("does not force an epic at 49 misses", () => {
    const banner = getBanner("standard", FIXED_WEEK);
    const rng = createRng("pity-49");
    let forced = 0;

    for (let i = 0; i < 5_000; i++) {
      if (rollPull(banner, rng, PITY_THRESHOLD - 1).wasPity) forced += 1;
    }

    expect(forced).toBe(0);
  });

  it("forces epic+ at exactly 50 misses", () => {
    const banner = getBanner("standard", FIXED_WEEK);
    const rng = createRng("pity-50");
    let legendaries = 0;

    for (let i = 0; i < 5_000; i++) {
      const result = rollPull(banner, rng, PITY_THRESHOLD);
      expect(result.wasPity).toBe(true);
      expect(isEpicPlus(result.rarity)).toBe(true);
      if (result.rarity === "legendary") legendaries += 1;
    }

    const pct = (legendaries / 5_000) * 100;
    expect(Math.abs(pct - 25)).toBeLessThan(TOLERANCE_PP);
  });

  it("resets the counter on epic+ and increments otherwise", () => {
    expect(nextPityCount("common", 12)).toBe(13);
    expect(nextPityCount("uncommon", 12)).toBe(13);
    expect(nextPityCount("rare", 12)).toBe(13);
    expect(nextPityCount("epic", 12)).toBe(0);
    expect(nextPityCount("legendary", 49)).toBe(0);
  });

  it("never exceeds the threshold across a long streak", () => {
    const banner = getBanner("standard", FIXED_WEEK);
    const rng = createRng("pity-streak");
    let pity = 0;

    for (let i = 0; i < 20_000; i++) {
      const result = rollPull(banner, rng, pity);
      pity = nextPityCount(result.rarity, pity);
      expect(pity).toBeLessThanOrEqual(PITY_THRESHOLD);
    }
  });
});

describe("rollMulti", () => {
  it("always contains at least one rare+ in a ten-summon", () => {
    const banner = getBanner("standard", FIXED_WEEK);

    for (let batch = 0; batch < 3_000; batch++) {
      const rng = createRng(`multi-${batch}`);
      const { results } = rollMulti(banner, rng, 0);
      expect(results).toHaveLength(MULTI_COUNT);
      expect(results.some((r) => isRarePlus(r.rarity))).toBe(true);
    }
  });

  it("marks the upgraded slot as guaranteed and puts it last", () => {
    const banner = getBanner("standard", FIXED_WEEK);
    let sawGuarantee = false;

    for (let batch = 0; batch < 3_000 && !sawGuarantee; batch++) {
      const rng = createRng(`guarantee-${batch}`);
      const { results } = rollMulti(banner, rng, 0);
      const guaranteed = results.filter((r) => r.guaranteed);
      if (guaranteed.length === 0) continue;

      sawGuarantee = true;
      expect(guaranteed).toHaveLength(1);
      expect(results[MULTI_COUNT - 1]?.guaranteed).toBe(true);
      expect(isRarePlus(results[MULTI_COUNT - 1]!.rarity)).toBe(true);
    }

    expect(sawGuarantee).toBe(true);
  });

  it("returns a pity count consistent with the results", () => {
    const banner = getBanner("featured", FIXED_WEEK);

    for (let batch = 0; batch < 500; batch++) {
      const rng = createRng(`pity-count-${batch}`);
      const start = batch % 45;
      const { results, pityCount } = rollMulti(banner, rng, start);
      const expected = results.reduce((acc, r) => nextPityCount(r.rarity, acc), start);
      expect(pityCount).toBe(expected);
    }
  });

  it("carries pity into the batch and triggers mid-batch", () => {
    const banner = getBanner("standard", FIXED_WEEK);
    const rng = createRng("multi-pity");
    const { results, pityCount } = rollMulti(banner, rng, PITY_THRESHOLD);

    expect(results[0]?.wasPity).toBe(true);
    expect(isEpicPlus(results[0]!.rarity)).toBe(true);
    expect(pityCount).toBeLessThan(MULTI_COUNT);
  });

  it("skips the guarantee for partial batches", () => {
    const banner = getBanner("standard", FIXED_WEEK);
    const rng = createRng("single-batch");
    const { results } = rollMulti(banner, rng, 0, 1);

    expect(results).toHaveLength(1);
    expect(results[0]?.guaranteed).toBe(false);
  });
});

describe("determinism", () => {
  it("reproduces the same single pull for the same seed", () => {
    const banner = getBanner("featured", FIXED_WEEK);
    const first = rollPull(banner, createRng("seed-alpha"), 3);
    const second = rollPull(banner, createRng("seed-alpha"), 3);
    expect(first).toEqual(second);
  });

  it("reproduces the same ten-summon for the same seed", () => {
    const banner = getBanner("standard", FIXED_WEEK);
    const first = rollMulti(banner, createRng("seed-beta"), 7);
    const second = rollMulti(banner, createRng("seed-beta"), 7);
    expect(first).toEqual(second);
  });

  it("produces different batches for different seeds", () => {
    const banner = getBanner("standard", FIXED_WEEK);
    const first = rollMulti(banner, createRng("seed-one"), 0);
    const second = rollMulti(banner, createRng("seed-two"), 0);
    expect(first.results).not.toEqual(second.results);
  });
});
