import { describe, expect, it } from "vitest";

import { GAUNTLET } from "~/server/game/rival";
import type { MatchView, RunView } from "~/server/game/view";

import {
  CLIMB_REST,
  buildClimb,
  climbAfter,
  climbAnnouncement,
  climbFits,
  restingFrame,
  type ClimbFrame,
  type ClimbKind,
  type ClimbRecord,
  type Spot,
} from "./climb";

const ROOF = GAUNTLET.length;

/** Every climb a run can show, bottom to top. */
const CLIMBS: readonly (readonly [ClimbKind, number])[] = [
  ["enter", 0],
  ...GAUNTLET.slice(1).map((_, index) => ["ascend", index + 1] as const),
  ["summit", ROOF],
];

/** A spot as a height, so two can be compared. */
function height(spot: Spot): number {
  if (spot === "away") return -2;
  if (spot === "ground") return -1;
  return spot === "roof" ? ROOF : spot;
}

function view(change: Partial<RunView> & { setup?: boolean }): RunView {
  const { setup = true, ...rest } = change;
  return {
    clanId: "flame",
    difficulty: "kitten",
    deck: [],
    relics: [],
    matchIndex: 0,
    gauntlet: GAUNTLET,
    phase: "match",
    match: { phase: setup ? "setup" : "turn" } as MatchView,
    reward: null,
    results: [],
    outcome: null,
    ...rest,
  };
}

function wins(count: number): RunView["results"] {
  return GAUNTLET.slice(0, count).map((rivalId) => ({
    rivalId,
    player: 30,
    rival: 20,
    won: true,
  }));
}

describe("buildClimb", () => {
  it("ends every climb on its resting frame", () => {
    for (const [kind, to] of CLIMBS) {
      const frames = buildClimb(kind, to, GAUNTLET);
      expect(frames.length, `${kind} ${to}`).toBeGreaterThan(2);
      expect(frames.at(-1), `${kind} ${to}`).toEqual(
        restingFrame(kind, to, GAUNTLET),
      );
      expect(frames.at(-1)?.ms).toBe(CLIMB_REST);
    }
  });

  it("gives every floor a window on every frame", () => {
    for (const [kind, to] of CLIMBS) {
      for (const frame of buildClimb(kind, to, GAUNTLET)) {
        expect(frame.windows).toHaveLength(GAUNTLET.length);
      }
    }
  });

  it("moves Hadu up one spot at a time, and says so", () => {
    for (const [kind, to] of CLIMBS) {
      let before: ClimbFrame | null = null;
      for (const frame of buildClimb(kind, to, GAUNTLET)) {
        if (before) {
          const rise = height(frame.hadu) - height(before.hadu);
          expect(rise, `${kind} ${to}`).toBeGreaterThanOrEqual(0);
          expect(rise, `${kind} ${to}`).toBeLessThanOrEqual(1);
          expect(frame.hop, `${kind} ${to}`).toBe(rise === 1);
        }
        before = frame;
      }
    }
  });

  it("starts an ascent on the floor just won and ends it one higher", () => {
    const frames = buildClimb("ascend", 3, GAUNTLET);
    expect(frames[0]?.hadu).toBe(2);
    expect(frames.at(-1)?.hadu).toBe(3);
  });

  it("lays the nameplate only on the last frame, and never on the roof", () => {
    for (const [kind, to] of CLIMBS) {
      const frames = buildClimb(kind, to, GAUNTLET);
      for (const frame of frames.slice(0, -1)) expect(frame.plate).toBeNull();
      expect(frames.at(-1)?.plate).toBe(kind === "summit" ? null : to);
    }
  });

  it("never shows a rival again once its floor is taken", () => {
    for (const [kind, to] of CLIMBS) {
      const taken = new Set<number>();
      for (const frame of buildClimb(kind, to, GAUNTLET)) {
        frame.windows.forEach((state, floor) => {
          if (state === "flag") taken.add(floor);
          else expect(taken.has(floor), `${kind} ${to}`).toBe(false);
        });
      }
    }
  });

  it("brings out only the rival of the floor Hadu is on", () => {
    for (const [kind, to] of CLIMBS) {
      for (const frame of buildClimb(kind, to, GAUNTLET)) {
        frame.windows.forEach((state, floor) => {
          if (state === "out") expect(frame.hadu).toBe(floor);
        });
      }
    }
  });

  it("takes every floor below the one arrived at", () => {
    expect(restingFrame("ascend", 3, GAUNTLET)?.windows).toEqual([
      "flag",
      "flag",
      "flag",
      "out",
      "peek",
      "peek",
    ]);
    expect(restingFrame("summit", ROOF, GAUNTLET)?.windows).toEqual(
      GAUNTLET.map(() => "flag"),
    );
  });

  it("opens the tower dark and lights it from the bottom up", () => {
    const frames = buildClimb("enter", 0, GAUNTLET);
    expect(frames[0]?.hadu).toBe("away");
    expect(frames[0]?.windows).toEqual(GAUNTLET.map(() => "dark"));
    const lit = frames.map(
      (frame) => frame.windows.filter((state) => state !== "dark").length,
    );
    expect(lit).toEqual([...lit].sort((a, b) => a - b));
    expect(lit.at(-1)).toBe(GAUNTLET.length);
  });

  it("raises the roof pennant only at the summit", () => {
    for (const [kind, to] of CLIMBS) {
      const frames = buildClimb(kind, to, GAUNTLET);
      expect(frames.some((frame) => frame.roofFlag)).toBe(kind === "summit");
      for (const frame of frames) {
        if (frame.roofFlag) expect(frame.hadu).toBe("roof");
      }
    }
  });

  it("is over in four seconds", () => {
    for (const [kind, to] of CLIMBS) {
      const total = buildClimb(kind, to, GAUNTLET).reduce(
        (sum, frame) => sum + frame.ms,
        0,
      );
      expect(total, `${kind} ${to}`).toBeLessThanOrEqual(4000);
    }
  });

  it("says who is met, and when it is a boss", () => {
    expect(restingFrame("ascend", 3, GAUNTLET)?.text).toBe(
      "Floor 4 of 6: The Rooftop Syndicate, at the window.",
    );
    expect(restingFrame("ascend", 2, GAUNTLET)?.text).toBe(
      "Floor 3 of 6: Madame Mittens, at the window. A boss.",
    );
    expect(buildClimb("ascend", 3, GAUNTLET)[1]?.text).toBe(
      "Floor 3 is yours. The window shuts.",
    );
  });

  it("has no frames for a climb that cannot happen", () => {
    expect(buildClimb("ascend", 0, GAUNTLET)).toEqual([]);
    expect(buildClimb("ascend", ROOF, GAUNTLET)).toEqual([]);
    expect(buildClimb("enter", 1, GAUNTLET)).toEqual([]);
    expect(buildClimb("summit", ROOF - 1, GAUNTLET)).toEqual([]);
    expect(buildClimb("enter", 0, [])).toEqual([]);
    expect(restingFrame("ascend", 1.5, GAUNTLET)).toBeNull();
  });
});

describe("climbAnnouncement", () => {
  it("tells the whole climb in one sentence", () => {
    expect(climbAnnouncement("enter", 0, GAUNTLET)).toBe(
      "You walk into the tower. Floor 1 of 6: Alley Tom.",
    );
    expect(climbAnnouncement("ascend", 5, GAUNTLET)).toBe(
      "You climb to floor 6 of 6: Old Nine Lives, a boss.",
    );
    expect(climbAnnouncement("summit", ROOF, GAUNTLET)).toBe(
      "You climb to the roof of the tower. All 6 floors are yours.",
    );
    expect(climbAnnouncement("ascend", 0, GAUNTLET)).toBe("");
  });
});

describe("climbAfter", () => {
  it("walks in when a run starts", () => {
    expect(climbAfter("start", view({}))).toEqual({ kind: "enter", to: 0 });
  });

  it("goes up a floor once the reward is taken", () => {
    expect(
      climbAfter("reward", view({ matchIndex: 2, results: wins(2) })),
    ).toEqual({ kind: "ascend", to: 2 });
  });

  it("reaches the roof when the last match is won", () => {
    expect(
      climbAfter(
        "act",
        view({
          matchIndex: 5,
          phase: "over",
          outcome: "won",
          results: wins(6),
        }),
      ),
    ).toEqual({ kind: "summit", to: ROOF });
  });

  it("climbs nowhere on a loss, a turn, or a win with a reward to take", () => {
    expect(
      climbAfter("act", view({ phase: "over", outcome: "lost" })),
    ).toBeNull();
    expect(climbAfter("act", view({ setup: false }))).toBeNull();
    expect(
      climbAfter("act", view({ phase: "reward", results: wins(1) })),
    ).toBeNull();
  });
});

describe("climbFits", () => {
  const ascent: ClimbRecord = { id: 1, runId: "a", kind: "ascend", to: 2 };
  const there = view({ matchIndex: 2, results: wins(2) });

  it("holds while the run is where the climb was heading", () => {
    expect(climbFits(ascent, "a", there)).toBe(true);
    expect(
      climbFits({ id: 2, runId: "a", kind: "enter", to: 0 }, "a", view({})),
    ).toBe(true);
    expect(
      climbFits(
        { id: 3, runId: "a", kind: "summit", to: ROOF },
        "a",
        view({ phase: "over", outcome: "won", results: wins(6) }),
      ),
    ).toBe(true);
  });

  it("lets go of another run's climb", () => {
    expect(climbFits(ascent, "b", there)).toBe(false);
  });

  it("lets go once the run has moved on", () => {
    expect(climbFits(ascent, "a", view({ matchIndex: 3 }))).toBe(false);
    expect(climbFits(ascent, "a", view({ matchIndex: 2, setup: false }))).toBe(
      false,
    );
    expect(
      climbFits(
        { id: 3, runId: "a", kind: "summit", to: ROOF },
        "a",
        view({ phase: "over", outcome: "lost" }),
      ),
    ).toBe(false);
  });
});
