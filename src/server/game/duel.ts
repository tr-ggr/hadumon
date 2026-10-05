/**
 * The driver of a two-seat match. The reducer in `match.ts` applies one
 * action for whoever is to act; this sits the player across from a policy
 * and plays the rival's actions until the player is to act again, so one
 * request from the client still comes back as one list of events.
 */

import {
  applyDuel,
  createDuel,
  IllegalAction,
  type Action,
  type DuelActionResult,
  type DuelConfig,
  type DuelEvent,
  type DuelState,
} from "./match";

/**
 * Chooses the rival's next action. It is handed the whole state because the
 * driver has nothing else; a bot narrows it to what its seat may see before
 * it thinks (see `bot/observe.ts`).
 */
export type Policy = (state: DuelState) => Action;

/** More rival actions in a row than any rules allow: a policy gone wrong. */
const RIVAL_LIMIT = 64;

/** Plays the rival until the player is to act, or the match is over. */
function playRival(
  start: DuelState,
  policy: Policy,
  events: DuelEvent[],
): DuelState {
  let state = start;
  for (let n = 0; state.phase !== "over" && state.active === "rival"; n++) {
    if (n >= RIVAL_LIMIT) throw new Error("The rival never finished its turn");
    const result = applyDuel(state, policy(state));
    state = result.state;
    events.push(...result.events);
  }
  return state;
}

/** Deals a match and has the rival keep its opening hand. */
export function openMatch(
  config: DuelConfig,
  policy: Policy,
): DuelActionResult {
  const events: DuelEvent[] = [];
  const state = playRival(createDuel(config), policy, events);
  return { state, events };
}

/**
 * Applies the player's action, then every rival action that follows it.
 * The state that comes back is waiting on the player, or over.
 */
export function advance(
  state: DuelState,
  action: Action,
  policy: Policy,
): DuelActionResult {
  if (state.phase !== "over" && state.active !== "player") {
    throw new IllegalAction("It is not your turn.");
  }
  const result = applyDuel(state, action);
  const events = [...result.events];
  return { state: playRival(result.state, policy, events), events };
}
