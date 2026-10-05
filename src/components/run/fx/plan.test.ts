import { describe, expect, it } from "vitest";

import type { Cue, Delta } from "../playback";
import {
  LANDING_MS,
  MAX_FLOATS,
  MAX_SPARKS,
  planFx,
  popStrength,
  type Intent,
} from "./plan";

const delta = (extra: Partial<Delta> = {}): Delta => ({
  food: { flame: 0, mist: 0, volt: 0, thorn: 0, shade: 0, wild: 0 },
  yarn: 0,
  cached: 0,
  tucked: 0,
  hand: 0,
  score: 0,
  rival: 0,
  slots: [],
  ...extra,
});

const cue = (extra: Partial<Cue> = {}): Cue => ({
  kind: "power",
  effect: null,
  slot: { row: "den", col: 2 },
  chain: 0,
  fizzled: false,
  rivalAction: null,
  won: null,
  delta: delta(),
  ...extra,
});

const kinds = (intents: Intent[]) => intents.map((intent) => intent.kind);
const of = <K extends Intent["kind"]>(intents: Intent[], kind: K) =>
  intents.filter(
    (intent): intent is Extract<Intent, { kind: K }> => intent.kind === kind,
  );
const sparkCount = (intents: Intent[]) =>
  of(intents, "sparks").reduce((sum, intent) => sum + intent.count, 0);

describe("planFx", () => {
  it("does nothing on the closing frame", () => {
    expect(planFx(cue({ kind: "settle", slot: null }))).toEqual([]);
  });

  it("pops the slot a power fires from", () => {
    const [pop] = planFx(cue({ effect: "encore" }));
    expect(pop).toEqual({
      kind: "pop",
      at: { on: "slot", row: "den", col: 2 },
      strength: 1,
      delay: 0,
    });
  });

  it("pops harder as the chain grows, up to a limit", () => {
    const strengths = [0, 1, 4, 8, 30].map(popStrength);
    expect(strengths[0]).toBe(1);
    for (let i = 1; i < strengths.length; i++) {
      expect(strengths[i]).toBeGreaterThanOrEqual(strengths[i - 1]!);
    }
    expect(popStrength(30)).toBe(popStrength(8));
    expect(popStrength(30)).toBeLessThan(2.1);
    expect(popStrength(-3)).toBe(1);
    expect(of(planFx(cue({ chain: 4 })), "pop")[0]?.strength).toBe(
      popStrength(4),
    );
  });

  it("floats the points a power scored from its slot, with sparks", () => {
    const intents = planFx(
      cue({
        effect: "cache",
        delta: delta({
          cached: 2,
          score: 2,
          slots: [{ row: "den", col: 2, yarn: 0, cached: 2, tucked: 0 }],
        }),
      }),
    );
    expect(of(intents, "float")).toEqual([
      {
        kind: "float",
        at: { on: "slot", row: "den", col: 2 },
        text: "+2",
        tone: "lime",
        delay: 0,
      },
    ]);
    expect(sparkCount(intents)).toBe(8);
    expect(of(intents, "punch").map((p) => p.at)).toEqual([{ on: "score" }]);
  });

  it("gives a power that scored nothing no float, no sparks", () => {
    const intents = planFx(
      cue({
        effect: "essence",
        delta: delta({ food: { ...delta().food, mist: 1 } }),
      }),
    );
    expect(kinds(intents)).toEqual(["pop", "punch"]);
    expect(of(intents, "punch")[0]?.at).toEqual({ on: "food", kind: "mist" });
  });

  it("shrugs a fizzled power and rewards it with nothing", () => {
    const intents = planFx(
      cue({ fizzled: true, chain: 9, delta: delta({ score: 5 }) }),
    );
    expect(intents).toEqual([
      { kind: "dud", at: { on: "slot", row: "den", col: 2 }, delay: 0 },
    ]);
  });

  it("punches every other cat a row-wide power lands on", () => {
    const intents = planFx(
      cue({
        effect: "yarnRow",
        delta: delta({
          yarn: 3,
          score: 3,
          slots: [0, 1, 2].map((col) => ({
            row: "den" as const,
            col,
            yarn: 1,
            cached: 0,
            tucked: 0,
          })),
        }),
      }),
    );
    expect(
      of(intents, "punch")
        .map((p) => p.at)
        .filter((at) => at.on === "slot"),
    ).toEqual([
      { on: "slot", row: "den", col: 0 },
      { on: "slot", row: "den", col: 1 },
    ]);
  });

  it("shakes the table only for a big hit or deep in a chain", () => {
    const score = (n: number, chain = 0) =>
      kinds(planFx(cue({ chain, delta: delta({ score: n }) })));
    expect(score(1)).not.toContain("shake");
    expect(score(3)).not.toContain("shake");
    expect(score(4)).toContain("shake");
    expect(score(1, 5)).toContain("shake");
    expect(score(1, 6)).not.toContain("shake");
    expect(score(1, 8)).toContain("shake");
    expect(score(0, 5)).not.toContain("shake");
  });

  it("waits for a piece in flight to land before answering it", () => {
    const play = planFx(cue({ kind: "play", delta: delta({ score: 2 }) }));
    expect(play.every((intent) => intent.delay === LANDING_MS)).toBe(true);
    expect(kinds(play)).toEqual(["float", "punch"]);

    const hunt = planFx(
      cue({
        kind: "hunt",
        slot: null,
        delta: delta({ food: { ...delta().food, flame: 1, wild: 1 } }),
      }),
    );
    expect(hunt).toEqual([
      { kind: "punch", at: { on: "food", kind: "flame" }, delay: LANDING_MS },
      { kind: "punch", at: { on: "food", kind: "wild" }, delay: LANDING_MS },
    ]);
  });

  it("floats the yarn a Den laid from each cat it went to", () => {
    const intents = planFx(
      cue({
        kind: "den",
        slot: null,
        delta: delta({
          yarn: 3,
          score: 3,
          slots: [
            { row: "hunt", col: 0, yarn: 2, cached: 0, tucked: 0 },
            { row: "den", col: 1, yarn: 1, cached: 0, tucked: 0 },
          ],
        }),
      }),
    );
    expect(of(intents, "float").map((f) => f.text)).toEqual(["+2", "+1"]);
    expect(kinds(intents)).not.toContain("pop");
  });

  it("marks what the rival does in coral, at the rival's score", () => {
    const bank = planFx(
      cue({
        kind: "rival",
        slot: null,
        rivalAction: "bank",
        delta: delta({ rival: 3 }),
      }),
    );
    expect(bank).toEqual([
      {
        kind: "float",
        at: { on: "rival" },
        text: "+3",
        tone: "coral",
        delay: 0,
      },
      { kind: "punch", at: { on: "rival" }, delay: 0 },
    ]);
    for (const rivalAction of ["raid", "burn"] as const) {
      expect(planFx(cue({ kind: "rival", slot: null, rivalAction }))).toEqual([
        { kind: "shake", strength: 1, delay: 0 },
      ]);
    }
    expect(
      planFx(cue({ kind: "rival", slot: null, rivalAction: "push" })),
    ).toEqual([]);
  });

  it("pays a goal to both sides and celebrates only a win", () => {
    const won = planFx(
      cue({
        kind: "goal",
        slot: null,
        won: true,
        delta: delta({ score: 4, rival: 1 }),
      }),
    );
    expect(of(won, "float").map((f) => [f.text, f.tone])).toEqual([
      ["+4", "lime"],
      ["+1", "coral"],
    ]);
    expect(sparkCount(won)).toBe(MAX_SPARKS);
    expect(kinds(won)).not.toContain("shake");

    const lost = planFx(
      cue({
        kind: "goal",
        slot: null,
        won: false,
        delta: delta({ score: 1, rival: 4 }),
      }),
    );
    expect(sparkCount(lost)).toBe(0);
    expect(of(lost, "shake")[0]?.strength).toBe(1);
  });

  it("ends a match with a burst on a win and a blow on a loss", () => {
    const won = planFx(cue({ kind: "over", slot: null, won: true }));
    expect(sparkCount(won)).toBe(MAX_SPARKS);
    expect(kinds(won)).not.toContain("shake");
    const lost = planFx(cue({ kind: "over", slot: null, won: false }));
    expect(sparkCount(lost)).toBe(0);
    expect(of(lost, "shake")[0]?.strength).toBe(2);
  });

  it("leaves the moves that already travel or tumble alone", () => {
    for (const kind of ["prowl", "reroll", "feeder"] as const) {
      expect(
        planFx(cue({ kind, slot: null, delta: delta({ hand: 3 }) })),
      ).toEqual([]);
    }
  });

  it("never throws more than the cap, and half of it on a phone", () => {
    const worst = cue({
      chain: 40,
      delta: delta({
        score: 60,
        yarn: 12,
        slots: Array.from({ length: 12 }, (_, i) => ({
          row: (["hunt", "den", "prowl"] as const)[i % 3]!,
          col: i % 4,
          yarn: 1,
          cached: 0,
          tucked: 0,
        })),
      }),
    });
    expect(sparkCount(planFx(worst))).toBe(MAX_SPARKS);
    expect(sparkCount(planFx(worst, { compact: true }))).toBe(MAX_SPARKS / 2);
    const den = planFx({ ...worst, kind: "den", slot: null });
    expect(of(den, "float")).toHaveLength(MAX_FLOATS);
    expect(planFx(worst).length).toBeLessThan(24);
  });

  it("never waits longer than a step", () => {
    for (const kind of ["power", "play", "hunt", "den", "resolve"] as const) {
      for (const intent of planFx(
        cue({
          kind,
          delta: delta({ score: 2, food: { ...delta().food, wild: 1 } }),
        }),
      )) {
        expect(intent.delay).toBeGreaterThanOrEqual(0);
        expect(intent.delay).toBeLessThanOrEqual(LANDING_MS);
      }
    }
  });
});
