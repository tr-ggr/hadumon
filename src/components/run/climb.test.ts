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
  towerStanding,
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
    difficulty: "kitten",
    deck: [],
    stolen: [],
    relics: [],
    chest: null,
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
    goalsWon: 2,
    goals: 4,
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

  it("puts the title card up on the last two beats only, and names nobody on the roof", () => {
    for (const [kind, to] of CLIMBS) {
      const frames = buildClimb(kind, to, GAUNTLET);
      const where = `${kind} ${to}`;
      for (const frame of frames.slice(0, -2)) {
        expect(frame.title, where).toBe(false);
        expect(frame.plate, where).toBeNull();
      }
      for (const frame of frames.slice(-2)) {
        expect(frame.title, where).toBe(true);
        expect(frame.plate, where).toBe(kind === "summit" ? null : to);
      }
    }
  });

  it("opens every climb on the whole tower, with no bars across it", () => {
    for (const [kind, to] of CLIMBS) {
      const frames = buildClimb(kind, to, GAUNTLET);
      expect(frames[0]?.shot, `${kind} ${to}`).toEqual({
        on: "tower",
        close: false,
      });
      expect(frames[0]?.bars, `${kind} ${to}`).toBe(false);
    }
  });

  it("brings the bars in for a close shot, and takes them out for a wide one", () => {
    for (const [kind, to] of CLIMBS) {
      const frames = buildClimb(kind, to, GAUNTLET);
      for (const frame of frames) {
        expect(frame.bars, `${kind} ${to}`).toBe(frame.shot.close);
      }
      expect(
        frames.some((frame) => frame.bars),
        `${kind} ${to}`,
      ).toBe(true);
    }
  });

  it("pulls back from the roof before its card comes down", () => {
    const frames = buildClimb("summit", ROOF, GAUNTLET);
    const back = frames.findIndex(
      (frame) => frame.roofFlag && !frame.shot.close,
    );
    expect(back).toBeGreaterThan(0);
    expect(frames[back]?.title).toBe(false);
    expect(frames[back - 1]?.shot).toEqual({ on: "roof", close: true });
  });

  it("rests close on the floor arrived at, and far back at the roof", () => {
    expect(restingFrame("ascend", 3, GAUNTLET)?.shot).toEqual({
      on: "floor",
      floor: 3,
      close: true,
    });
    expect(restingFrame("enter", 0, GAUNTLET)?.shot.close).toBe(true);
    expect(restingFrame("summit", ROOF, GAUNTLET)?.shot.close).toBe(false);
  });

  it("frames only floors the tower has", () => {
    for (const [kind, to] of CLIMBS) {
      for (const { shot } of buildClimb(kind, to, GAUNTLET)) {
        expect(shot.floor === undefined, `${kind} ${to}`).toBe(
          shot.on !== "floor",
        );
        if (shot.floor === undefined) continue;
        expect(shot.floor).toBeGreaterThanOrEqual(0);
        expect(shot.floor).toBeLessThan(GAUNTLET.length);
      }
    }
  });

  it("follows Hadu up the wall, and tilts up the tower before he walks in", () => {
    for (const [kind, to] of CLIMBS) {
      for (const frame of buildClimb(kind, to, GAUNTLET)) {
        if (!frame.hop) continue;
        expect(frame.shot.close, `${kind} ${to}`).toBe(true);
        expect(["hadu", "roof"], `${kind} ${to}`).toContain(frame.shot.on);
      }
    }
    const tilt = buildClimb("enter", 0, GAUNTLET)
      .filter((frame) => frame.hadu === "away" && frame.shot.on === "floor")
      .map((frame) => frame.shot.floor);
    expect(tilt).toEqual(GAUNTLET.map((_, floor) => floor));
  });

  it("holds a beat longer on a boss's dark window, and lands harder", () => {
    const plain = buildClimb("ascend", 1, GAUNTLET);
    const boss = buildClimb("ascend", 2, GAUNTLET);
    expect(boss.length).toBe(plain.length + 1);
    expect(boss.some((frame) => frame.windows[2] === "dark")).toBe(true);
    expect(plain.some((frame) => frame.windows[1] === "dark")).toBe(false);
    expect(boss.some((frame) => frame.shake === "hard")).toBe(true);
    expect(plain.some((frame) => frame.shake === "hard")).toBe(false);
  });

  it("is heard: paws on the wall, a landing, the card coming down", () => {
    for (const [kind, to] of CLIMBS) {
      const frames = buildClimb(kind, to, GAUNTLET);
      const heard = frames.flatMap((frame) =>
        frame.sounds.map((sound) => sound.name),
      );
      expect(heard, `${kind} ${to}`).toContain("tick");
      expect(heard, `${kind} ${to}`).toContain("settle");
      expect(
        heard.filter((name) => name === "slam"),
        `${kind} ${to}`,
      ).toHaveLength(1);
      expect(heard.includes("goalWon"), `${kind} ${to}`).toBe(
        kind === "summit",
      );
      // The first frame and the rest are silent, so a skip lands quietly.
      expect(frames[0]?.sounds).toEqual([]);
      expect(frames.at(-1)?.sounds).toEqual([]);
      expect(frames.at(-1)?.shake).toBe("none");
      for (const frame of frames) {
        for (const sound of frame.sounds) {
          expect(sound.delay * 1000, `${kind} ${to}`).toBeLessThan(frame.ms);
        }
      }
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

  it("is over in its time, the rest included", () => {
    const budget: Record<ClimbKind, number> = {
      ascend: 5500,
      enter: 7200,
      summit: 6200,
    };
    for (const [kind, to] of CLIMBS) {
      const total = buildClimb(kind, to, GAUNTLET).reduce(
        (sum, frame) => sum + frame.ms,
        0,
      );
      expect(total, `${kind} ${to}`).toBeLessThanOrEqual(budget[kind]);
    }
  });

  it("says who is met, and when it is a boss", () => {
    expect(restingFrame("ascend", 3, GAUNTLET)?.text).toBe(
      "Floor 4 of 6: The Rooftop Syndicate, at the window.",
    );
    expect(restingFrame("ascend", 2, GAUNTLET)?.text).toBe(
      "Floor 3 of 6: Madame Mittens, at the window. A boss.",
    );
    expect(
      buildClimb("ascend", 3, GAUNTLET).map((frame) => frame.text),
    ).toContain("Floor 3 is yours. The window shuts.");
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

describe("towerStanding", () => {
  const count = GAUNTLET.length;

  it("is dark and empty until the run is known", () => {
    const standing = towerStanding(undefined, count);
    expect(standing.hadu).toBe("away");
    expect(standing.windows).toEqual(GAUNTLET.map(() => "dark"));
    expect(standing.roofFlag).toBe(false);
  });

  it("has every rival at home and Hadu at the foot with no run", () => {
    const standing = towerStanding(null, count);
    expect(standing.hadu).toBe("ground");
    expect(standing.windows).toEqual(GAUNTLET.map(() => "peek"));
  });

  it("puts Hadu on the floor being played, its rival out, flags below", () => {
    const standing = towerStanding(view({ matchIndex: 2 }), count);
    expect(standing.hadu).toBe(2);
    expect(standing.windows).toEqual([
      "flag",
      "flag",
      "out",
      "peek",
      "peek",
      "peek",
    ]);
  });

  it("is where an ascent rests, for the same floor", () => {
    for (let floor = 1; floor < count; floor++) {
      const rest = restingFrame("ascend", floor, GAUNTLET);
      const standing = towerStanding(view({ matchIndex: floor }), count);
      expect(standing.hadu).toBe(rest?.hadu);
      expect(standing.windows).toEqual(rest?.windows);
    }
  });

  it("shuts and flags the floor just won while its reward waits", () => {
    const standing = towerStanding(
      view({ matchIndex: 1, phase: "reward" }),
      count,
    );
    expect(standing.hadu).toBe(1);
    expect(standing.windows).toEqual([
      "flag",
      "flag",
      "peek",
      "peek",
      "peek",
      "peek",
    ]);
  });

  it("flags every floor and the roof for a run that was won", () => {
    const standing = towerStanding(
      view({ matchIndex: count - 1, phase: "over", outcome: "won" }),
      count,
    );
    expect(standing.hadu).toBe("roof");
    expect(standing.roofFlag).toBe(true);
    expect(standing.windows).toEqual(GAUNTLET.map(() => "flag"));
  });
});
