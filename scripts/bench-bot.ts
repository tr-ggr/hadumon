/**
 * Times the rival's thinking. For every level it has the bot answer the
 * positions of a set of matches and reports how many moves it tried and how
 * long it took: the middle answer, the slowest one in twenty, and the worst.
 *
 *   pnpm tsx --conditions=react-server scripts/bench-bot.ts
 *
 * The step counts are the same on every machine; the times are this one's.
 */
import { act, botAt, standIn, STEP_CAP, TOP_LEVEL } from "~/server/game/bot";
import { meter } from "~/server/game/bot/fork";
import { CAT_LIST } from "~/server/game/cats";
import { applyDuel, createDuel, type DuelState } from "~/server/game/match";
import { GAUNTLET } from "~/server/game/rival";
import { rivalDeck } from "~/server/game/rivalDecks";
import { CLANS, starterDeck } from "~/server/game/run";
import { styleOf } from "~/server/game/bot/styles";

const MATCHES = Number(process.argv[2] ?? 12);
const POOL = CAT_LIST.map((cat) => cat.id);

/** Every position the rival answers in a match against a steady player. */
function rivalPositions(level: number, game: number): DuelState[] {
  const matchIndex = Math.min(level, GAUNTLET.length - 1);
  const rivalId = GAUNTLET[matchIndex] ?? "alley-tom";
  const player = standIn(4);
  const rival = botAt(level, styleOf(rivalId));
  const seen: DuelState[] = [];
  let state = createDuel({
    seed: `bench-${level}-${game}`,
    rivalId,
    level,
    player: { deck: starterDeck("flame"), relics: [CLANS.flame.relicId] },
    rival: { deck: rivalDeck(rivalId, matchIndex, POOL), relics: [] },
  });
  for (let guard = 0; guard < 600 && state.phase !== "over"; guard++) {
    if (state.active === "rival") seen.push(state);
    const bot = state.active === "rival" ? rival : player;
    state = applyDuel(state, act(state, bot)).state;
  }
  return seen;
}

const at = (sorted: number[], q: number) =>
  sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))] ?? 0;

console.log("level  answers  steps p50/p95/max (cap)     ms p50/p95/max");
for (let level = 0; level <= TOP_LEVEL; level++) {
  const bot = botAt(level, styleOf(GAUNTLET[Math.min(level, 5)] ?? ""));
  const positions = Array.from({ length: MATCHES }, (_, game) =>
    rivalPositions(level, game),
  ).flat();
  // Once through unmeasured, so the first answers are not timed cold.
  for (const state of positions.slice(0, 20)) act(state, bot);
  const steps: number[] = [];
  const times: number[] = [];
  for (const state of positions) {
    const before = meter.steps;
    const started = performance.now();
    act(state, bot);
    times.push(performance.now() - started);
    steps.push(meter.steps - before);
  }
  steps.sort((a, b) => a - b);
  times.sort((a, b) => a - b);
  const ms = (q: number) => at(times, q).toFixed(1);
  console.log(
    `${level}      ${String(positions.length).padEnd(7)}  ${at(steps, 0.5)}/${at(steps, 0.95)}/${at(steps, 1)} (${STEP_CAP[level]})`.padEnd(
      46,
    ) + `${ms(0.5)}/${ms(0.95)}/${ms(1)}`,
  );
}
