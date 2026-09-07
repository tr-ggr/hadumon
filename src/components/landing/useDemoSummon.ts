"use client";

import { useCallback, useState } from "react";

import type { RevealCardResult } from "~/components/gacha";
import { pullCost, rollMulti, type Banner } from "~/server/game/gacha";
import { createRng } from "~/server/game/rng";
import { getSpecies } from "~/server/game/species";
import { creaturePower, effectiveStats } from "~/server/game/stats";

/**
 * A seed nobody can predict. `crypto.randomUUID` only exists in secure
 * contexts (https, or localhost), so a plain-http preview falls back to
 * `Math.random`, which is plenty for a demo that persists nothing.
 */
function freshSeed(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}:${Math.random()}`;
}

/** Gems the preview wallet starts with: a ten-pull, then some. */
export const DEMO_GEMS = 2700;

interface DemoSummonState {
  gems: number;
  pity: number;
  results: RevealCardResult[];
  /** Species already pulled here, so "New!" means what it says. */
  seen: Set<string>;
}

export interface DemoSummon {
  /** Preview gems left. Never touches a real wallet. */
  gems: number;
  /** Misses since the last epic+, carried across preview pulls for real. */
  pity: number;
  /** The most recent batch, in pull order. */
  results: RevealCardResult[];
  /** Rolls `count` pulls. Does nothing if the preview wallet is short. */
  summon: (count: 1 | 10) => void;
  /** Gem cost of a batch of `count` on this banner. */
  costOf: (count: 1 | 10) => number;
  /** Whether the preview wallet can still afford `count` pulls. */
  canAfford: (count: 1 | 10) => boolean;
  /** The banner's pity threshold, for the bar. */
  pityThreshold: number;
}

/**
 * A summon that runs entirely in the browser on the real gacha rules: the same
 * `rollMulti`, the same weights, the same pity and ten-pull guarantee. Nothing
 * is persisted and no account exists — the wallet is a preview.
 */
export function useDemoSummon(banner: Banner): DemoSummon {
  const [state, setState] = useState<DemoSummonState>(() => ({
    gems: DEMO_GEMS,
    pity: 0,
    results: [],
    seen: new Set<string>(),
  }));

  const costOf = useCallback(
    (count: 1 | 10) => pullCost(banner, count),
    [banner],
  );

  const summon = useCallback(
    (count: 1 | 10) => {
      const cost = pullCost(banner, count);
      if (state.gems < cost) return;

      const rolled = rollMulti(
        banner,
        createRng(freshSeed()),
        state.pity,
        count,
      );

      const seen = new Set(state.seen);
      const results = rolled.results.map((result): RevealCardResult => {
        const species = getSpecies(result.speciesId);
        const isNew = !seen.has(species.id);
        seen.add(species.id);

        return {
          speciesId: result.speciesId,
          species,
          rarity: result.rarity,
          wasPity: result.wasPity,
          guaranteed: result.guaranteed,
          isNew,
          creature: {
            level: 1,
            power: creaturePower(effectiveStats(species, 1)),
          },
        };
      });

      setState({
        gems: state.gems - cost,
        pity: rolled.pityCount,
        results,
        seen,
      });
    },
    [banner, state],
  );

  return {
    gems: state.gems,
    pity: state.pity,
    results: state.results,
    summon,
    costOf,
    canAfford: (count) => state.gems >= costOf(count),
    pityThreshold: banner.pityThreshold,
  };
}
