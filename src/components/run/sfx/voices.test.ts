import { describe, expect, it } from "vitest";

import { CAT_LIST } from "~/server/game/cats";

import { LIMITS, recipe, voiceSeconds } from "./recipes";
import { catPitch, catVoice, SQUARE_GAIN, VOICE_SECONDS } from "./voices";

const key = (catId: string) => JSON.stringify(catVoice(catId));

describe("cat voices", () => {
  it("has a voice for every cat in the catalogue", () => {
    const pick = JSON.stringify(recipe("pick"));
    for (const cat of CAT_LIST) {
      expect(catPitch(cat.id), cat.id).not.toBeNull();
      expect(catVoice(cat.id).length, cat.id).toBeGreaterThan(0);
      expect(key(cat.id), cat.id).not.toBe(pick);
    }
  });

  it("gives no two cats the same voice, or the same pitch", () => {
    expect(new Set(CAT_LIST.map((cat) => key(cat.id))).size).toBe(
      CAT_LIST.length,
    );
    const pitches = CAT_LIST.map((cat) => catPitch(cat.id)?.toFixed(3));
    expect(new Set(pitches).size).toBe(CAT_LIST.length);
  });

  it("keeps every note inside its bounds", () => {
    for (const cat of CAT_LIST) {
      for (const note of catVoice(cat.id)) {
        expect(note.gain, cat.id).toBeGreaterThan(0);
        expect(note.gain, cat.id).toBeLessThanOrEqual(LIMITS.gain);
        for (const hz of [note.from, note.to]) {
          expect(hz, cat.id).toBeGreaterThanOrEqual(LIMITS.minHz);
          expect(hz, cat.id).toBeLessThanOrEqual(LIMITS.maxHz);
        }
        expect(note.at, cat.id).toBeGreaterThanOrEqual(0);
        expect(note.attack, cat.id).toBeGreaterThan(0);
        expect(note.decay, cat.id).toBeGreaterThan(0);
      }
    }
  });

  it("is short: a cat is heard and the table moves on", () => {
    for (const cat of CAT_LIST) {
      expect(voiceSeconds(catVoice(cat.id)), cat.id).toBeLessThanOrEqual(
        VOICE_SECONDS,
      );
    }
  });

  it("uses the player's waves only, and keeps a square quiet", () => {
    for (const cat of CAT_LIST) {
      for (const note of catVoice(cat.id)) {
        expect(["triangle", "sine", "square"], cat.id).toContain(note.wave);
        if (note.wave === "square") {
          expect(note.gain, cat.id).toBeLessThanOrEqual(SQUARE_GAIN);
        }
      }
    }
  });

  it("takes longer over a legendary than over a lesser cat of its kind", () => {
    // Both are shade familiars; only Hadu signs off.
    expect(voiceSeconds(catVoice("hadu"))).toBeGreaterThan(
      voiceSeconds(catVoice("gloomtail")),
    );
    expect(catVoice("hadu").length).toBeGreaterThan(
      catVoice("gloomtail").length,
    );
  });

  it("falls back to a pick for a cat it does not know", () => {
    expect(catVoice("nobody")).toEqual(recipe("pick"));
    expect(catVoice("constructor")).toEqual(recipe("pick"));
    expect(catPitch("nobody")).toBeNull();
  });
});
