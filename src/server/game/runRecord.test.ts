import { describe, expect, it } from "vitest";

import { chestRun } from "~/test/runs";

import type { ScoreBreakdown } from "./match";
import { GAUNTLET } from "./rival";
import type { MatchDetail, MatchRecord, RunState } from "./run";
import { toRunRecord, type RunRow } from "./runRecord";

const NO_PRIZES = { unlocks: [], achievements: [] };

const sheet = (total: number): ScoreBreakdown => ({
  cats: total,
  yarn: 0,
  cached: 0,
  tucked: 0,
  goals: 0,
  relics: 0,
  total,
});

const detail = (player: number, rival: number): MatchDetail => ({
  level: 0,
  breakdown: { player: sheet(player), rival: sheet(rival) },
  goalResults: [],
  tiebreak: null,
  boards: {
    player: { hunt: [], den: [], prowl: [] },
    rival: { hunt: [], den: [], prowl: [] },
  },
  relics: { player: [], rival: [] },
});

/** A run that won its first match, took a card back, then lost the second. */
function lostRun(): RunState {
  const start = chestRun("record-seed");
  const back = start.stolen[0]!;
  const first: MatchRecord = {
    rivalId: GAUNTLET[0]!,
    player: 60,
    rival: 40,
    won: true,
    goalsWon: 3,
    goals: 4,
    coins: 30,
    factor: 1,
    detail: detail(60, 40),
    reward: { reclaim: back, relic: null, trim: null },
  };
  const second: MatchRecord = {
    rivalId: GAUNTLET[1]!,
    player: 50,
    rival: 55,
    won: false,
    goalsWon: 1,
    goals: 4,
    coins: 25,
    factor: 1.2,
    detail: detail(50, 55),
  };
  const stolen = [...start.stolen];
  stolen.splice(stolen.indexOf(back), 1);
  return {
    ...start,
    relics: [start.chest[1]!],
    stolen,
    deck: [...start.deck, back],
    matchIndex: 1,
    phase: "over",
    outcome: "lost",
    results: [first, second],
  };
}

function row(state: unknown): RunRow {
  return {
    id: "run-1",
    status: "lost",
    difficulty: "stray",
    score: 110,
    matchesWon: 1,
    coins: 55,
    startedAt: new Date(Date.UTC(2026, 9, 1, 12)),
    endedAt: new Date(Date.UTC(2026, 9, 1, 12, 40)),
    state,
  };
}

/** Every key anywhere in a value. */
function keys(value: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((v) => keys(v, out));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      out.add(k);
      keys(v, out);
    }
  }
  return out;
}

describe("toRunRecord", () => {
  it("lays out a run's whole story", () => {
    const state = lostRun();
    const record = toRunRecord(row(state), NO_PRIZES, true);
    const back = state.results[0]!.reward!.reclaim!;

    expect(record).toMatchObject({
      outcome: "lost",
      difficulty: "stray",
      matchesPlayed: 2,
      endedBy: GAUNTLET[1],
      chest: state.chest,
      chestPick: state.chest[1],
      relics: [state.chest[1]],
    });
    expect(record.built).toEqual([...state.built].sort());
    expect(record.stolenAtStart).toEqual([...state.stolen, back].sort());
    expect(record.stolenLeft).toEqual([...state.stolen].sort());
    expect(record.finalDeck).toEqual([...state.deck].sort());
    expect(record.matches.map((m) => m.reward)).toEqual([
      { reclaim: back, relic: null, trim: null },
      null,
    ]);
    expect(record.matches[1]!.detail?.breakdown.rival.total).toBe(55);
  });

  it("shows coins to the run's player and nobody else", () => {
    const state = lostRun();
    const mine = toRunRecord(row(state), NO_PRIZES, true);
    expect(mine.coins).toBe(55);
    expect(mine.matches.map((m) => [m.coins, m.factor])).toEqual([
      [30, 1],
      [25, 1.2],
    ]);

    const theirs = toRunRecord(row(state), NO_PRIZES, false);
    expect(theirs.coins).toBeNull();
    expect(
      theirs.matches.every((m) => m.coins === null && m.factor === null),
    ).toBe(true);
  });

  it("never lets the seed, the pool or a seat out", () => {
    const seen = keys(toRunRecord(row(lostRun()), NO_PRIZES, true));
    for (const secret of ["seed", "pool", "sides", "hand", "under", "match"]) {
      expect(seen.has(secret), secret).toBe(false);
    }
  });

  it("keeps what an older run kept, and says the rest was not", () => {
    const old = {
      v: 2,
      results: [
        {
          rivalId: GAUNTLET[0],
          player: 44,
          rival: 30,
          won: true,
          goalsWon: 2,
          goals: 4,
        },
        {
          rivalId: GAUNTLET[1],
          player: 38,
          rival: 52,
          won: false,
          goalsWon: 0,
          goals: 4,
        },
      ],
    };
    const record = toRunRecord(row(old), NO_PRIZES, true);
    expect(record.built).toBeNull();
    expect(record.relics).toBeNull();
    expect(record.endedBy).toBe(GAUNTLET[1]);
    expect(
      record.matches.map((m) => [m.player, m.rival, m.detail, m.coins]),
    ).toEqual([
      [44, 30, null, null],
      [38, 52, null, null],
    ]);
  });

  it("copes with a state it cannot read at all", () => {
    const record = toRunRecord(row(null), NO_PRIZES, false);
    expect(record.matches).toEqual([]);
    expect(record.endedBy).toBeNull();
  });
});
