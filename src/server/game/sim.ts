/**
 * Bots that play matches and whole runs. They exist to tune the numbers and
 * to prove the engine never gets stuck; nothing in the app ships them.
 */

import { getCat, RARITIES } from "./cats";
import {
  applyAction,
  goalStanding,
  legalActions,
  payCost,
  placedCats,
  playerScore,
  rivalScore,
  ROUND_TURNS,
  emptyPool,
  type Action,
  type MatchState,
} from "./match";
import {
  actInRun,
  chooseReward,
  startRun,
  type RunConfig,
  type RunState,
} from "./run";
import { createRng, type Rng } from "./rng";

export type Bot = (state: MatchState, rng: Rng) => Action;

export const randomBot: Bot = (state, rng) => rng.pick(legalActions(state));

function turnsAhead(state: MatchState): number {
  return ROUND_TURNS.slice(state.round + 1).reduce<number>(
    (sum, turns) => sum + turns,
    state.turnsLeft,
  );
}

/** Points in hand, plus what the position is likely to turn into. */
function value(state: MatchState): number {
  const essence = Object.values(state.essence).reduce((sum, n) => sum + n, 0);
  const goal = goalStanding(state);
  return (
    playerScore(state).total -
    rivalScore(state) +
    (goal ? (goal.playerPoints - goal.rivalPoints) * 0.7 : 0) +
    Math.min(essence, 4) * 0.5 +
    Math.min(state.hand.length, 3) * 0.4 +
    placedCats(state.board).length * 0.25 * turnsAhead(state)
  );
}

/** Setup: favour cats the kept essence can actually pay for. */
function keepValue(state: MatchState, action: Action): number {
  if (action.type !== "keep") return 0;
  let pool = emptyPool();
  for (const element of action.essence) pool[element] += 1;
  const cats = action.cats
    .map((index) => getCat(state.setup[index] ?? ""))
    .sort((a, b) => a.cost.length - b.cost.length);
  let total = cats.length * 0.5;
  for (const cat of cats) {
    const paid = payCost(pool, cat.cost);
    if (!paid) continue;
    pool = paid;
    total += 3 + cat.points * 0.5;
  }
  return total;
}

/** One-step lookahead over every legal action. */
export const greedyBot: Bot = (state) => {
  const actions = legalActions(state).filter((a) => a.type !== "reroll");
  let best: Action | undefined;
  let bestValue = -Infinity;
  for (const action of actions) {
    const score =
      state.phase === "setup"
        ? keepValue(state, action)
        : value(applyAction(state, action).state);
    if (score > bestValue) {
      best = action;
      bestValue = score;
    }
  }
  if (!best) throw new Error("No legal action");
  return best;
};

/** Plays a match to its end. Throws if the engine fails to terminate. */
export function playMatch(start: MatchState, bot: Bot, rng: Rng): MatchState {
  let state = start;
  for (let guard = 0; guard < 500 && state.phase !== "over"; guard++) {
    state = applyAction(state, bot(state, rng)).state;
  }
  if (state.phase !== "over") throw new Error("Match did not terminate");
  return state;
}

/** Plays a whole run, taking the rarest offered cat and the first relic. */
export function playRun(config: RunConfig, bot: Bot): RunState {
  const rng = createRng(`${config.seed}:bot`);
  let run = startRun(config);
  for (let guard = 0; guard < 5000 && run.phase !== "over"; guard++) {
    if (run.phase === "reward" && run.reward) {
      const cat = [...run.reward.cats].sort(
        (a, b) =>
          RARITIES.indexOf(getCat(b).rarity) -
          RARITIES.indexOf(getCat(a).rarity),
      )[0];
      run = chooseReward(run, {
        cat: cat ?? null,
        relic: run.reward.relics[0] ?? null,
        trim: null,
      });
    } else if (run.match) {
      run = actInRun(run, bot(run.match, rng)).run;
    }
  }
  if (run.phase !== "over") throw new Error("Run did not terminate");
  return run;
}
