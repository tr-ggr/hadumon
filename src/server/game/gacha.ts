/**
 * Gacha: banner definitions, rarity rolling, rate-up and pity.
 *
 * Everything here is pure — the only entropy comes from the injected `Rng`,
 * so a given seed always reproduces the same pulls.
 */
import type { Rng } from "./rng";
import {
  RARITIES,
  speciesByRarity,
  type Rarity,
  type Species,
} from "./species";

/* -------------------------------------------------------------------------- */
/* Constants                                                                   */
/* -------------------------------------------------------------------------- */

/** Gem cost of a single summon. */
export const SINGLE_COST = 100;
/** Gem cost of a ten-summon (a 100 gem discount). */
export const MULTI_COST = 900;
/** Pulls in a multi-summon. */
export const MULTI_COUNT = 10;

/** Misses before the next pull is forced to epic+. */
export const PITY_THRESHOLD = 50;
/** Share of pity-forced pulls that come out legendary. */
export const PITY_LEGENDARY_CHANCE = 0.25;
/** Chance that a roll landing on the featured species' rarity yields it. */
export const FEATURED_CHANCE = 0.5;

/** Rarities that satisfy the ten-summon guarantee. */
export const RARE_PLUS: readonly Rarity[] = ["rare", "epic", "legendary"];
/** Rarities that reset the pity counter. */
export const EPIC_PLUS: readonly Rarity[] = ["epic", "legendary"];

export const BANNER_IDS = ["standard", "featured"] as const;
export type BannerId = (typeof BANNER_IDS)[number];

/** Percentage weights per rarity; each banner's weights sum to 100. */
export type RarityWeights = Record<Rarity, number>;

export interface Banner {
  id: BannerId;
  name: string;
  description: string;
  weights: RarityWeights;
  /** Rate-up species, or `null` on banners without one. */
  featuredSpeciesId: string | null;
  /** Probability the featured species wins its rarity's slot. */
  featuredChance: number;
  singleCost: number;
  multiCost: number;
  multiCount: number;
  pityThreshold: number;
}

const STANDARD_WEIGHTS: RarityWeights = {
  common: 60,
  uncommon: 25,
  rare: 10,
  epic: 4,
  legendary: 1,
};

const FEATURED_WEIGHTS: RarityWeights = {
  common: 55,
  uncommon: 27,
  rare: 12,
  epic: 4.5,
  legendary: 1.5,
};

/* -------------------------------------------------------------------------- */
/* Banners                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The rotation pool: every epic and legendary species, in a stable order so
 * the weekly rotation is reproducible across deploys.
 */
export const FEATURED_POOL: Species[] = [
  ...speciesByRarity("epic"),
  ...speciesByRarity("legendary"),
].sort((a, b) => a.id.localeCompare(b.id));

/** ISO-8601 week number (1–53) of a date, in UTC. */
export function isoWeek(date: Date): number {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  // Thursday of the current ISO week decides the year the week belongs to.
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7);
}

/** Which epic/legendary cat is on rate-up for the week containing `now`. */
export function featuredSpeciesFor(now: Date = new Date()): Species {
  const index = isoWeek(now) % FEATURED_POOL.length;
  const species = FEATURED_POOL[index];
  if (!species) throw new Error("Featured pool is empty");
  return species;
}

export function getBanner(id: BannerId, now: Date = new Date()): Banner {
  const base = {
    singleCost: SINGLE_COST,
    multiCost: MULTI_COST,
    multiCount: MULTI_COUNT,
    pityThreshold: PITY_THRESHOLD,
    featuredChance: FEATURED_CHANCE,
  };

  if (id === "featured") {
    return {
      ...base,
      id: "featured",
      name: "Weekly Spotlight",
      description:
        "This week's spotlight cat is twice as likely to answer the call, with better odds across the board.",
      weights: FEATURED_WEIGHTS,
      featuredSpeciesId: featuredSpeciesFor(now).id,
    };
  }

  return {
    ...base,
    id: "standard",
    name: "Wandering Strays",
    description:
      "Every cat in the catalogue, at the standard rates. Always available.",
    weights: STANDARD_WEIGHTS,
    featuredSpeciesId: null,
  };
}

export function getBanners(now: Date = new Date()): Banner[] {
  return BANNER_IDS.map((id) => getBanner(id, now));
}

export function isBannerId(value: string): value is BannerId {
  return (BANNER_IDS as readonly string[]).includes(value);
}

/** Gem cost of pulling `count` times on `banner`. */
export function pullCost(banner: Banner, count: number): number {
  return count === banner.multiCount
    ? banner.multiCost
    : banner.singleCost * Math.max(1, count);
}

/* -------------------------------------------------------------------------- */
/* Rolling                                                                     */
/* -------------------------------------------------------------------------- */

export interface PullResult {
  speciesId: string;
  rarity: Rarity;
  /** The pity counter forced this pull to epic+. */
  wasPity: boolean;
  /** The ten-summon rare+ guarantee produced this pull. */
  guaranteed: boolean;
}

export interface MultiResult {
  results: PullResult[];
  /** Pity counter after the whole batch. */
  pityCount: number;
}

export function isRarePlus(rarity: Rarity): boolean {
  return RARE_PLUS.includes(rarity);
}

export function isEpicPlus(rarity: Rarity): boolean {
  return EPIC_PLUS.includes(rarity);
}

/** The pity counter after a pull of `rarity`. */
export function nextPityCount(rarity: Rarity, pityCount: number): number {
  return isEpicPlus(rarity) ? 0 : pityCount + 1;
}

/** Rate card shown in the UI: chance of each rarity as a percentage. */
export function bannerRates(banner: Banner): RarityWeights {
  const total = RARITIES.reduce((sum, r) => sum + banner.weights[r], 0);
  return RARITIES.reduce<RarityWeights>((acc, rarity) => {
    acc[rarity] = (banner.weights[rarity] / total) * 100;
    return acc;
  }, {} as RarityWeights);
}

/**
 * Rolls one summon.
 *
 * Once `pityCount` has reached the banner's threshold the result is forced to
 * epic (or legendary, {@link PITY_LEGENDARY_CHANCE} of the time).
 */
export function rollPull(
  banner: Banner,
  rng: Rng,
  pityCount: number,
): PullResult {
  if (pityCount >= banner.pityThreshold) {
    const rarity: Rarity = rng.chance(PITY_LEGENDARY_CHANCE)
      ? "legendary"
      : "epic";
    return {
      speciesId: pickSpecies(banner, rarity, rng),
      rarity,
      wasPity: true,
      guaranteed: false,
    };
  }

  const rarity = pickRarity(banner.weights, RARITIES, rng);
  return {
    speciesId: pickSpecies(banner, rarity, rng),
    rarity,
    wasPity: false,
    guaranteed: false,
  };
}

/**
 * Rolls `n` summons in sequence, carrying the pity counter through the batch.
 * A full ten-summon that produced nothing rare+ has its last slot upgraded.
 */
export function rollMulti(
  banner: Banner,
  rng: Rng,
  pityCount: number,
  n: number = MULTI_COUNT,
): MultiResult {
  const results: PullResult[] = [];
  let pity = pityCount;

  for (let i = 0; i < n; i++) {
    const result = rollPull(banner, rng, pity);
    pity = nextPityCount(result.rarity, pity);
    results.push(result);
  }

  const needsGuarantee =
    n >= banner.multiCount && !results.some((r) => isRarePlus(r.rarity));

  if (needsGuarantee) {
    const rarity = pickRarity(banner.weights, RARE_PLUS, rng);
    results[n - 1] = {
      speciesId: pickSpecies(banner, rarity, rng),
      rarity,
      wasPity: false,
      guaranteed: true,
    };
    // The upgraded slot may reset pity, so recompute the counter over the batch.
    pity = results.reduce((acc, r) => nextPityCount(r.rarity, acc), pityCount);
  }

  return { results, pityCount: pity };
}

/* -------------------------------------------------------------------------- */
/* Internals                                                                   */
/* -------------------------------------------------------------------------- */

/** Weighted pick restricted to `pool`, using the banner's rarity weights. */
function pickRarity(
  weights: RarityWeights,
  pool: readonly Rarity[],
  rng: Rng,
): Rarity {
  const total = pool.reduce((sum, rarity) => sum + weights[rarity], 0);
  let roll = rng.next() * total;

  for (const rarity of pool) {
    roll -= weights[rarity];
    if (roll < 0) return rarity;
  }

  // Floating-point slack only; `pool` is never empty.
  return pool[pool.length - 1] ?? "common";
}

/** Uniform species of `rarity`, with the featured cat taking half its slot. */
function pickSpecies(banner: Banner, rarity: Rarity, rng: Rng): string {
  const pool = speciesByRarity(rarity);
  if (pool.length === 0) throw new Error(`No species of rarity ${rarity}`);

  const featured = banner.featuredSpeciesId
    ? pool.find((sp) => sp.id === banner.featuredSpeciesId)
    : undefined;

  if (featured && rng.chance(banner.featuredChance)) return featured.id;

  return rng.pick(pool).id;
}
