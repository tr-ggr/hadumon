import { describe, expect, it } from "vitest";

import { advance, openMatch } from "../duel";
import {
  applyAction,
  createMatch,
  legalActions,
  type Action,
  type MatchConfig,
  type MatchState,
} from "../match";
import { GAUNTLET } from "../rival";
import { rivalDeck } from "../rivalDecks";
import { createRng } from "../rng";
import { CLANS, starterDeck } from "../clans";
import { CAT_LIST } from "../cats";
import { defaultDeck } from "../deck";
import { playMatch } from "./arena";
import { NEUTRAL, TILT_LIMIT } from "./eval";
import { meter } from "./fork";
import { act, rivalPolicy, standIn } from "./index";
import { botAt, STEP_CAP, TOP_LEVEL } from "./levels";
import { observe } from "./observe";
import { STYLES, styleOf } from "./styles";

const POOL = CAT_LIST.map((cat) => cat.id);

/** The match a run has at `matchIndex` on the tier that adds `rank`. */
function gauntletMatch(matchIndex: number, rank: number, seed: string) {
  const rivalId = GAUNTLET[matchIndex] ?? "alley-tom";
  const config: MatchConfig = {
    seed,
    rivalId,
    level: matchIndex + rank,
    player: { deck: starterDeck("flame"), relics: [CLANS.flame.relicId] },
    rival: {
      deck: rivalDeck(rivalId, matchIndex, POOL, defaultDeck()),
      relics: [],
    },
  };
  return config;
}

/** Positions from all through a match played at random. */
function positions(seed: string, every = 1): MatchState[] {
  const rng = createRng(`${seed}:walk`);
  const seen: MatchState[] = [];
  let state = createMatch(gauntletMatch(3, 0, seed));
  for (let guard = 0; guard < 400 && state.phase !== "over"; guard++) {
    if (guard % every === 0) seen.push(state);
    state = applyAction(state, rng.pick(legalActions(state))).state;
  }
  return seen;
}

describe("levels", () => {
  it("answer the same position the same way", () => {
    for (let level = 0; level <= TOP_LEVEL; level++) {
      const bot = botAt(level, styleOf("the-archivist"));
      for (const state of positions(`same-${level}`, 12)) {
        expect(act(state, bot)).toEqual(act(state, bot));
      }
    }
  });

  it("try no more moves than their cap", () => {
    for (let level = 0; level <= TOP_LEVEL; level++) {
      const bot = botAt(level, styleOf("old-nine-lives"));
      let most = 0;
      for (const state of positions(`cap-${level}`, 6)) {
        const before = meter.steps;
        act(state, bot);
        most = Math.max(most, meter.steps - before);
      }
      expect(most).toBeLessThanOrEqual(STEP_CAP[level] ?? 0);
      // Only the three fixed lists try nothing.
      expect(most > 0).toBe(level > 2);
    }
  });

  it("only ever answer with a move the table lists or accepts", () => {
    for (let level = 0; level <= TOP_LEVEL; level++) {
      const bot = botAt(level, styleOf("dockside-twins"));
      for (const state of positions(`legal-${level}`, 8)) {
        expect(() => applyAction(state, act(state, bot))).not.toThrow();
      }
    }
  });
});

describe("level 0", () => {
  const rote = botAt(0, styleOf("alley-tom"));

  it("needs no RNG and never makes a trade, and neither does level 1", () => {
    const never = {
      next: () => {
        throw new Error("level 0 rolled a die");
      },
    } as unknown as ReturnType<typeof createRng>;
    let trades = 0;
    for (const bot of [rote, botAt(1, styleOf("alley-tom"))]) {
      for (const state of positions("rote")) {
        const action: Action = bot(observe(state, state.active), never);
        if ("trade" in action && action.trade !== undefined) trades += 1;
      }
    }
    expect(trades).toBe(0);
  });

  it("plays a cat whenever it can pay for one", () => {
    for (const state of positions("rote-plays")) {
      if (state.phase !== "turn") continue;
      const playable = legalActions(state).some((a) => a.type === "play");
      const action = act(state, rote);
      expect(action.type === "play").toBe(playable);
    }
  });
});

describe("styles", () => {
  it("tilt the evaluation by no more than the limit", () => {
    for (const style of Object.values(STYLES)) {
      for (const key of [
        "goal",
        "food",
        "hand",
        "afford",
        "engine",
        "deny",
      ] as const) {
        const tilt = style.weights[key] / NEUTRAL[key];
        expect(Math.abs(tilt - 1)).toBeLessThanOrEqual(TILT_LIMIT + 1e-9);
      }
      expect(Math.abs(style.weights.yarn - NEUTRAL.yarn)).toBeLessThanOrEqual(
        TILT_LIMIT + 1e-9,
      );
      expect([...style.habits].sort()).toEqual([
        "den",
        "hunt",
        "play",
        "prowl",
      ]);
    }
  });

  it("give every rival of the gauntlet a manner, and the last one none", () => {
    for (const rivalId of GAUNTLET) expect(STYLES).toHaveProperty(rivalId);
    expect(STYLES["old-nine-lives"]?.weights).toEqual(NEUTRAL);
    const tilted = GAUNTLET.filter(
      (id) => JSON.stringify(STYLES[id]?.weights) !== JSON.stringify(NEUTRAL),
    );
    expect(tilted).toHaveLength(5);
  });
});

describe("the rival of a run", () => {
  it("finishes its match at every level a tier can ask of it", () => {
    for (const [matchIndex, rivalId] of GAUNTLET.entries()) {
      for (let rank = 0; rank <= 2; rank++) {
        if (matchIndex + rank > TOP_LEVEL) continue;
        const seed = `finish-${rivalId}-${rank}`;
        const config = gauntletMatch(matchIndex, rank, seed);
        const rng = createRng(`${seed}:player`);
        let { state } = openMatch(config, rivalPolicy);
        for (let guard = 0; guard < 400 && state.phase !== "over"; guard++) {
          const pick = legalActions(state).filter((a) => a.type !== "reroll");
          state = advance(state, rng.pick(pick), rivalPolicy).state;
        }
        expect(state.phase).toBe("over");
        expect(state.sides.rival.turnsLeft).toBe(0);
      }
    }
  }, 30_000);

  it("plays the same match twice from the same seed", () => {
    const config = gauntletMatch(2, 1, "twice");
    const bots = {
      player: standIn(1),
      rival: botAt(3, styleOf(config.rivalId)),
    };
    expect(playMatch(config, bots)).toEqual(playMatch(config, bots));
  });
});
