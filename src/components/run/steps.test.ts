import { describe, expect, it } from "vitest";

import { GAUNTLET } from "~/server/game/rival";
import type { RewardOffer } from "~/server/game/run";
import type { Unlock } from "~/server/game/unlocks";
import type { MatchView, RunView } from "~/server/game/view";

import { rewardSteps, SETUP_STEPS, summarySteps } from "./steps";

function offer(change: Partial<RewardOffer> = {}): RewardOffer {
  return {
    reclaim: ["flameclaw", "mistpaw", "voltwhisk"],
    relics: [],
    canTrim: false,
    ...change,
  };
}

/** A run that has ended, with its last match scored unless told otherwise. */
function ended(change: Partial<RunView> & { scored?: boolean } = {}): RunView {
  const { scored = true, ...rest } = change;
  return {
    difficulty: "kitten",
    deck: [],
    stolen: [],
    relics: [],
    chest: null,
    matchIndex: 0,
    gauntlet: GAUNTLET,
    phase: "over",
    match: { result: scored ? {} : null } as MatchView,
    reward: null,
    results: [],
    outcome: "lost",
    ...rest,
  };
}

const UNLOCKS: readonly Unlock[] = [{ kind: "cat", key: "nimbustail" }];

describe("SETUP_STEPS", () => {
  it("meets the rival, reads the table, keeps a hand, then recaps", () => {
    expect(SETUP_STEPS).toEqual(["rival", "table", "keep", "recap"]);
  });

  it("ends on the recap, which holds the confirm", () => {
    expect(SETUP_STEPS.at(-1)).toBe("recap");
  });
});

describe("rewardSteps", () => {
  it("shows every step when everything is on offer", () => {
    expect(
      rewardSteps(offer({ relics: ["lucky-bell"], canTrim: true }), true),
    ).toEqual(["result", "reclaim", "relic", "trim", "recap"]);
  });

  it("has a relic step only when a relic is due", () => {
    expect(rewardSteps(offer(), true)).not.toContain("relic");
    expect(rewardSteps(offer({ relics: ["lucky-bell"] }), true)).toContain(
      "relic",
    );
  });

  it("has a trim step only when the deck can lose a card", () => {
    expect(rewardSteps(offer(), true)).not.toContain("trim");
    expect(rewardSteps(offer({ canTrim: true }), true)).toContain("trim");
  });

  it("has no cat step when no cat is on offer", () => {
    expect(rewardSteps(offer({ reclaim: [] }), true)).toEqual([
      "result",
      "recap",
    ]);
  });

  it("opens on the result only when there is one", () => {
    expect(rewardSteps(offer(), true)[0]).toBe("result");
    expect(rewardSteps(offer(), false)).toEqual(["reclaim", "recap"]);
  });

  it("always ends on the recap, which holds the confirm", () => {
    const offers = [
      offer(),
      offer({ reclaim: [] }),
      offer({ relics: ["lucky-bell"], canTrim: true }),
    ];
    for (const each of offers) {
      for (const hasResult of [true, false]) {
        expect(rewardSteps(each, hasResult).at(-1)).toBe("recap");
      }
    }
  });
});

describe("summarySteps", () => {
  it("walks the result, the unlocks and the summary", () => {
    expect(summarySteps(ended(), UNLOCKS)).toEqual([
      "result",
      "unlocks",
      "summary",
    ]);
  });

  it("counts the coins after the unlocks, when the run paid any", () => {
    expect(summarySteps(ended(), UNLOCKS, 40)).toEqual([
      "result",
      "unlocks",
      "coins",
      "summary",
    ]);
    expect(summarySteps(ended({ outcome: "abandoned" }), [], 12)).toEqual([
      "coins",
      "summary",
    ]);
    expect(summarySteps(ended(), [], 0)).toEqual(["result", "summary"]);
  });

  it("shows the achievements after the unlocks and before the coins", () => {
    expect(summarySteps(ended(), UNLOCKS, 40, 2)).toEqual([
      "result",
      "unlocks",
      "achievements",
      "coins",
      "summary",
    ]);
    expect(summarySteps(ended(), [], 0, 1)).toEqual([
      "result",
      "achievements",
      "summary",
    ]);
  });

  it("has no unlocks step when nothing was unlocked", () => {
    expect(summarySteps(ended(), [])).toEqual(["result", "summary"]);
  });

  it("has no result step for an abandoned run", () => {
    expect(summarySteps(ended({ outcome: "abandoned" }), UNLOCKS)).toEqual([
      "unlocks",
      "summary",
    ]);
    expect(summarySteps(ended({ outcome: "abandoned" }), [])).toEqual([
      "summary",
    ]);
  });

  it("has no result step when no match was finished", () => {
    expect(summarySteps(ended({ scored: false }), [])).toEqual(["summary"]);
    expect(summarySteps(ended({ match: null }), [])).toEqual(["summary"]);
  });

  it("always ends on the summary, which holds the way out", () => {
    for (const outcome of ["won", "lost", "abandoned"] as const) {
      for (const unlocked of [UNLOCKS, []]) {
        expect(summarySteps(ended({ outcome }), unlocked).at(-1)).toBe(
          "summary",
        );
      }
    }
  });
});
