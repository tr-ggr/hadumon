import { describe, expect, it } from "vitest";

import type { Cue, Delta } from "../playback";
import {
  ladder,
  LADDER_TOP,
  LIMITS,
  MAX_TICKS,
  recipe,
  SFX_NAMES,
  soundsFor,
  voiceSeconds,
} from "./recipes";

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
  slot: null,
  chain: 0,
  fizzled: false,
  rivalMove: null,
  won: null,
  delta: delta(),
  ...extra,
});

const names = (c: Cue) => soundsFor(c).map((sound) => sound.name);

describe("recipes", () => {
  it("has a voice for every sound, at every step of a chain", () => {
    for (const name of SFX_NAMES) {
      for (const step of [0, 3, LADDER_TOP, 60]) {
        const voice = recipe(name, step);
        expect(voice.length, name).toBeGreaterThan(0);
        expect(voice.length, name).toBeLessThanOrEqual(8);
      }
    }
  });

  it("keeps every note inside its bounds", () => {
    for (const name of SFX_NAMES) {
      for (const step of [0, 5, LADDER_TOP, 60]) {
        for (const note of recipe(name, step)) {
          const where = `${name} at step ${step}`;
          expect(note.gain, where).toBeGreaterThan(0);
          expect(note.gain, where).toBeLessThanOrEqual(LIMITS.gain);
          for (const hz of [note.from, note.to, note.filter?.freq]) {
            if (hz === undefined) continue;
            expect(hz, where).toBeGreaterThanOrEqual(LIMITS.minHz);
            expect(hz, where).toBeLessThanOrEqual(LIMITS.maxHz);
          }
          expect(note.at, where).toBeGreaterThanOrEqual(0);
          expect(note.attack, where).toBeGreaterThan(0);
          expect(note.decay, where).toBeGreaterThan(0);
          // Noise is never let out without a filter.
          if (note.wave === "noise") expect(note.filter, where).toBeDefined();
        }
        expect(voiceSeconds(recipe(name, step)), name).toBeLessThanOrEqual(
          LIMITS.seconds,
        );
      }
    }
  });

  it("keeps the sounds of a turn short, and only the end of a match long", () => {
    const long = new Set(["win", "loss"]);
    for (const name of SFX_NAMES) {
      const seconds = voiceSeconds(recipe(name));
      if (long.has(name)) expect(seconds, name).toBeGreaterThan(0.6);
      else expect(seconds, name).toBeLessThanOrEqual(0.5);
    }
    expect(voiceSeconds(recipe("hover"))).toBeLessThan(0.05);
    expect(voiceSeconds(recipe("tick"))).toBeLessThan(0.05);
  });

  it("knocks on the cloth shorter and quieter than a press on a button", () => {
    const loudest = (name: "tap" | "click") =>
      Math.max(...recipe(name).map((note) => note.gain));
    expect(voiceSeconds(recipe("tap"))).toBeLessThan(0.08);
    expect(loudest("tap")).toBeLessThan(loudest("click"));
  });

  it("lands a played card's thud when its flight ends", () => {
    const thud = recipe("play").find((note) => note.wave === "sine");
    expect(thud?.at).toBeCloseTo(0.3, 2);
  });

  it("turns a page as paper: noise alone, and quieter than a played card", () => {
    const loudest = (name: "page" | "play") =>
      Math.max(...recipe(name).map((note) => note.gain));
    expect(recipe("page").every((note) => note.wave === "noise")).toBe(true);
    expect(loudest("page")).toBeLessThan(loudest("play"));
    // The cover is a board: it has a body under the paper, and no thud of its
    // own, which is the `settle` played as it lands.
    expect(recipe("cover").some((note) => note.wave === "sine")).toBe(true);
    expect(voiceSeconds(recipe("cover"))).toBeLessThan(0.3);
  });

  it("burns a wrapper as noise alone, and lets its cards out on a thump and a note", () => {
    expect(recipe("flare").every((note) => note.wave === "noise")).toBe(true);
    const burst = recipe("burst");
    expect(burst.some((note) => note.wave === "noise")).toBe(true);
    expect(burst.some((note) => note.wave === "sine" && note.to < 100)).toBe(
      true,
    );
    // The burst is the louder of the two, and neither outlasts its phase.
    const loudest = (name: "flare" | "burst") =>
      Math.max(...recipe(name).map((note) => note.gain));
    expect(loudest("flare")).toBeLessThan(loudest("burst"));
    expect(voiceSeconds(recipe("flare"))).toBeLessThanOrEqual(0.42);
    expect(voiceSeconds(recipe("burst"))).toBeLessThanOrEqual(0.36);
  });

  it("gives the rival a lower voice of another timbre than a power", () => {
    const power = recipe("power", 0)[0]!;
    const rival = recipe("rivalFlip")[0]!;
    expect(rival.wave).not.toBe(power.wave);
    expect(rival.from).toBeLessThan(power.from);
  });
});

describe("the pitch ladder", () => {
  it("climbs with every step of a chain", () => {
    for (let step = 1; step <= LADDER_TOP; step++) {
      expect(ladder(step)).toBeGreaterThan(ladder(step - 1));
    }
  });

  it("is pentatonic: five steps to the octave, no semitone apart", () => {
    expect(ladder(5) / ladder(0)).toBeCloseTo(2, 5);
    expect(ladder(10) / ladder(5)).toBeCloseTo(2, 5);
    for (let step = 1; step <= LADDER_TOP; step++) {
      const semitones = 12 * Math.log2(ladder(step) / ladder(step - 1));
      expect(Math.round(semitones)).toBeGreaterThanOrEqual(2);
      expect(Math.round(semitones)).toBeLessThanOrEqual(3);
    }
  });

  it("stops at the top however long the chain runs", () => {
    expect(ladder(LADDER_TOP + 1)).toBe(ladder(LADDER_TOP));
    expect(ladder(500)).toBe(ladder(LADDER_TOP));
    expect(ladder(-3)).toBe(ladder(0));
    expect(ladder(500)).toBeLessThan(2000);
  });

  it("sets the pitch of a power and nothing else", () => {
    expect(recipe("power", 4)[0]?.from).toBe(ladder(4));
    expect(recipe("power", 4)[0]?.from).toBeGreaterThan(
      recipe("power", 3)[0]!.from,
    );
    expect(recipe("fizzle", 9)).toEqual(recipe("fizzle", 0));
    expect(recipe("rivalFlip", 9)).toEqual(recipe("rivalFlip", 0));
  });
});

describe("soundsFor", () => {
  it("is silent on the closing frame", () => {
    expect(soundsFor(cue({ kind: "settle" }))).toEqual([]);
  });

  it("climbs a step with each power of a chain", () => {
    const steps = [0, 1, 2, 3].map(
      (chain) => soundsFor(cue({ chain, effect: "cache" }))[0],
    );
    expect(steps.map((sound) => sound?.name)).toEqual(
      Array.from({ length: 4 }, () => "power"),
    );
    expect(steps.map((sound) => sound?.step)).toEqual([0, 1, 2, 3]);
  });

  it("plays a fizzled power dull, with nothing after it", () => {
    const sounds = soundsFor(
      cue({ chain: 6, fizzled: true, effect: "yarnSelf" }),
    );
    expect(sounds).toEqual([{ name: "fizzle", step: 0, delay: 0 }]);
  });

  it("follows a power with the sound of what it did", () => {
    expect(names(cue({ effect: "essence" }))).toEqual(["power", "food"]);
    expect(names(cue({ effect: "wild" }))).toEqual(["power", "food"]);
    expect(names(cue({ effect: "cache" }))).toEqual(["power", "cache"]);
    expect(names(cue({ effect: "tuckDeck" }))).toEqual(["power", "tuck"]);
    expect(names(cue({ effect: "encore" }))).toEqual(["power"]);
    expect(
      names(cue({ effect: "yarnRow", delta: delta({ yarn: 3, score: 3 }) })),
    ).toEqual(["power", "yarn", "yarn", "yarn", "tick", "tick", "tick"]);
    expect(names(cue({ effect: "draw", delta: delta({ hand: 2 }) }))).toEqual([
      "power",
      "draw",
      "draw",
    ]);
  });

  it("ticks once a point, rising, and never more than the cap", () => {
    const sounds = soundsFor(
      cue({ chain: 2, effect: "cache", delta: delta({ score: 40 }) }),
    ).filter((sound) => sound.name === "tick");
    expect(sounds).toHaveLength(MAX_TICKS);
    expect(sounds.map((sound) => sound.step)).toEqual([2, 3, 4, 5, 6]);
    const delays = sounds.map((sound) => sound.delay);
    expect(delays).toEqual([...delays].sort((a, b) => a - b));
    expect(new Set(delays).size).toBe(MAX_TICKS);
  });

  it("gives the player's own moves their own sounds", () => {
    expect(names(cue({ kind: "play" }))).toEqual(["play"]);
    expect(
      names(
        cue({
          kind: "hunt",
          delta: delta({ food: { ...delta().food, flame: 2 } }),
        }),
      ),
    ).toEqual(["dice", "food", "food"]);
    expect(names(cue({ kind: "den", delta: delta({ yarn: 2 }) }))).toEqual([
      "yarn",
      "yarn",
    ]);
    expect(names(cue({ kind: "den" }))).toEqual(["click"]);
    expect(names(cue({ kind: "prowl", delta: delta({ hand: 3 }) }))).toEqual([
      "draw",
      "draw",
      "draw",
    ]);
    expect(names(cue({ kind: "reroll" }))).toEqual([]);
    expect(names(cue({ kind: "feeder" }))).toEqual(["reroll"]);
    expect(
      names(cue({ kind: "resolve", delta: delta({ tucked: 1 }) })),
    ).toEqual(["tuck"]);
  });

  it("keeps the rival's move apart, and louder when it takes from the feeder", () => {
    expect(names(cue({ kind: "rival", rivalMove: "play" }))).toEqual([
      "rivalFlip",
    ]);
    expect(names(cue({ kind: "rival", rivalMove: "hunt" }))).toEqual([
      "rivalFlip",
      "raid",
    ]);
    expect(names(cue({ kind: "rival", rivalMove: "prowl" }))).toEqual([
      "rivalFlip",
    ]);
  });

  it("says who a goal and the match went to", () => {
    expect(names(cue({ kind: "goal", won: true }))[0]).toBe("goalWon");
    expect(names(cue({ kind: "goal", won: false }))).toEqual(["goalLost"]);
    expect(names(cue({ kind: "goal", won: null }))).toEqual(["cache"]);
    expect(names(cue({ kind: "over", won: true }))).toEqual(["win"]);
    expect(names(cue({ kind: "over", won: false }))).toEqual(["loss"]);
  });

  it("never asks for more than a handful of sounds at once", () => {
    const worst = soundsFor(
      cue({
        chain: 30,
        effect: "yarnRow",
        delta: delta({ yarn: 40, score: 40, hand: 40 }),
      }),
    );
    expect(worst.length).toBeLessThanOrEqual(1 + 4 + MAX_TICKS);
    for (const sound of worst) {
      expect(sound.delay).toBeGreaterThanOrEqual(0);
      expect(sound.delay).toBeLessThan(0.5);
    }
  });
});
