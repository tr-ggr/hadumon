import { describe, expect, it } from "vitest";

import {
  applyAction,
  createMatch,
  legalActions,
  otherSide,
  type MatchEvent,
  type MatchState,
} from "./match";
import { createRng } from "./rng";
import { starterDeck } from "./run";

/** The same table seen from the other chair. */
function mirror(state: MatchState): MatchState {
  return {
    ...state,
    sides: { player: state.sides.rival, rival: state.sides.player },
    active: otherSide(state.active),
    lead: otherSide(state.lead),
    last: { player: state.last.rival, rival: state.last.player },
    goalResults: state.goalResults.map((goal) => ({
      goalId: goal.goalId,
      player: goal.rival,
      rival: goal.player,
      playerPoints: goal.rivalPoints,
      rivalPoints: goal.playerPoints,
    })),
    // Only the last tiebreak names a seat: it goes to the player's.
    result: state.result && {
      player: state.result.rival,
      rival: state.result.player,
      won: state.result.tiebreak === "seat" ? true : !state.result.won,
      tiebreak: state.result.tiebreak,
    },
  };
}

function mirrorEvent(event: MatchEvent): MatchEvent {
  switch (event.type) {
    case "feeder":
      return event;
    case "goal":
      return {
        ...event,
        player: event.rival,
        rival: event.player,
        playerPoints: event.rivalPoints,
        rivalPoints: event.playerPoints,
      };
    case "over":
      return {
        type: "over",
        won: event.tiebreak === "seat" ? true : !event.won,
        player: event.rival,
        rival: event.player,
        tiebreak: event.tiebreak,
      };
    default:
      return { ...event, side: otherSide(event.side) };
  }
}

const RELICS = ["loud-bell", "early-riser", "lucky-collar", "ball-of-twine"];

function deal(seed: string): MatchState {
  return createMatch({
    seed,
    rivalId: "alley-tom",
    level: 0,
    player: { deck: starterDeck("flame"), relics: RELICS },
    rival: { deck: [...starterDeck("shade"), "hadu", "nyxaroth"], relics: [] },
  });
}

describe("the two seats", () => {
  it("are ruled alike: swapping them mirrors every state and event", () => {
    let steps = 0;
    for (let game = 0; game < 30; game++) {
      const rng = createRng(`mirror-${game}`);
      let state = deal(`symmetry-${game}`);
      for (let guard = 0; guard < 400 && state.phase !== "over"; guard++) {
        const action = rng.pick(legalActions(state));
        const straight = applyAction(state, action);
        const swapped = applyAction(mirror(state), action);
        expect(swapped.state).toEqual(mirror(straight.state));
        expect(swapped.events).toEqual(straight.events.map(mirrorEvent));
        state = straight.state;
        steps += 1;
      }
      expect(state.phase).toBe("over");
    }
    expect(steps).toBeGreaterThan(30 * 24);
  });

  it("list the same actions from either chair", () => {
    const rng = createRng("mirror-actions");
    let state = deal("symmetry-actions");
    for (let guard = 0; guard < 400 && state.phase !== "over"; guard++) {
      expect(legalActions(mirror(state))).toEqual(legalActions(state));
      state = applyAction(state, rng.pick(legalActions(state))).state;
    }
  });
});
