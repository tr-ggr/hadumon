/**
 * The driver of a two-seat match. The reducer in `match.ts` applies one
 * action for whoever is to act; this sits the player across from a policy
 * and plays the rival's actions until the player is to act again, so one
 * request from the client still comes back as one list of events.
 */

import {
  applyAction,
  createMatch,
  IllegalAction,
  type Action,
  type ActionResult,
  type MatchConfig,
  type MatchState,
} from "./match";

/**
 * Chooses the rival's next action. It is handed the whole state because the
 * driver has nothing else; a bot narrows it to what its seat may see before
 * it thinks (see `bot/observe.ts`).
 */
export type Policy = (state: MatchState) => Action;

/** More rival actions in a row than any rules allow: a policy gone wrong. */
const RIVAL_LIMIT = 64;

export interface Advance extends ActionResult {
  /**
   * The table after each action this call applied, in order: the player's
   * own first (when there was one), then each of the rival's. An action's
   * events start with its `move` or `kept`, so the two line up.
   */
  trail: MatchState[];
}

/** Plays the rival until the player is to act, or the match is over. */
function playRival(start: MatchState, policy: Policy, out: Advance): void {
  let state = start;
  for (let n = 0; state.phase !== "over" && state.active === "rival"; n++) {
    if (n >= RIVAL_LIMIT) throw new Error("The rival never finished its turn");
    const result = applyAction(state, policy(state));
    state = result.state;
    out.events.push(...result.events);
    out.trail.push(state);
  }
  out.state = state;
}

/** Deals a match and has the rival keep its opening hand. */
export function openMatch(config: MatchConfig, policy: Policy): Advance {
  const state = createMatch(config);
  const out: Advance = { state, events: [], trail: [] };
  playRival(state, policy, out);
  return out;
}

/**
 * Applies the player's action, then every rival action that follows it.
 * The state that comes back is waiting on the player, or over.
 */
export function advance(
  state: MatchState,
  action: Action,
  policy: Policy,
): Advance {
  if (state.phase !== "over" && state.active !== "player") {
    throw new IllegalAction("It is not your turn.");
  }
  const result = applyAction(state, action);
  const out: Advance = {
    state: result.state,
    events: [...result.events],
    trail: [result.state],
  };
  playRival(result.state, policy, out);
  return out;
}
