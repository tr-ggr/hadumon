/**
 * The rival's mind. `rivalPolicy` is what the driver in `duel.ts` is given:
 * it narrows the match to what the rival's seat can see, hands that to the
 * bot for the match's rival and level, and returns the bot's answer.
 */

import type { Policy } from "../duel";
import type { Action, DuelState } from "../match";
import { createRng } from "../rng";
import { botAt, type Bot } from "./levels";
import { observe } from "./observe";
import { PLAIN, styleOf } from "./styles";

export { botAt, STEP_CAP, TOP_LEVEL, type Bot } from "./levels";
export { imagine, observe, type Observation } from "./observe";
export { PLAIN, STYLES, styleOf, type Style } from "./styles";

/**
 * Has `bot` choose for whoever is to act. The bot's RNG is seeded from the
 * match and the step, so the same position always gets the same answer.
 */
export function act(state: DuelState, bot: Bot): Action {
  return bot(
    observe(state, state.active),
    createRng(`${state.seed}:${state.step}:bot`),
  );
}

/** The rival of a match, playing at the match's level in its own style. */
export const rivalPolicy: Policy = (state) =>
  act(state, botAt(state.level, styleOf(state.rivalId)));

/** A stand-in for a player of a given level, with no style. */
export function standIn(level: number): Bot {
  return botAt(level, PLAIN);
}
