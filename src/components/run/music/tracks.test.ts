import { describe, expect, it } from "vitest";

import { GAUNTLET, RIVAL_LIST } from "~/server/game/rival";

import { LIMITS, voiceSeconds } from "../sfx/recipes";
import {
  MUSIC_LIMITS,
  PARTS,
  RIVAL_THEMES,
  STEPS,
  TRACKS,
  TRACK_IDS,
  barSeconds,
  notesFor,
  trackFor,
  type MusicScreen,
  type TrackId,
} from "./tracks";

const PITCHED = /^[0-9a-e.-]+$/;
const DRUMS = /^[ksh.]+$/;

/** A track as the notes it plays, so two can be compared. */
function score(id: TrackId): string {
  const track = TRACKS[id];
  return JSON.stringify([
    track.bpm,
    track.bars.map((_, bar) => notesFor(track, bar)),
  ]);
}

describe("tracks", () => {
  it("writes every part of every bar as sixteen steps it can read", () => {
    for (const id of TRACK_IDS) {
      const { bars } = TRACKS[id];
      expect(bars.length, id).toBeGreaterThan(0);
      expect(bars.length, id).toBeLessThanOrEqual(8);
      bars.forEach((bar, index) => {
        for (const part of PARTS) {
          const pattern = bar[part];
          if (pattern === undefined) continue;
          const where = `${id} bar ${index} ${part}`;
          expect(pattern, where).toHaveLength(STEPS);
          expect(pattern, where).toMatch(part === "drums" ? DRUMS : PITCHED);
          // A hold needs a note to hold.
          expect(pattern.startsWith("-"), where).toBe(false);
          expect(pattern.includes(".-"), where).toBe(false);
        }
      });
    }
  });

  it("plays something in every bar", () => {
    for (const id of TRACK_IDS) {
      const track = TRACKS[id];
      track.bars.forEach((_, bar) => {
        expect(notesFor(track, bar).length, `${id} bar ${bar}`).toBeGreaterThan(
          0,
        );
      });
    }
  });

  it("keeps every note inside the music's bounds, under the effects", () => {
    expect(MUSIC_LIMITS.gain).toBeLessThan(LIMITS.gain / 2);
    for (const id of TRACK_IDS) {
      const track = TRACKS[id];
      track.bars.forEach((_, bar) => {
        for (const note of notesFor(track, bar)) {
          const where = `${id} bar ${bar}`;
          expect(note.gain, where).toBeGreaterThan(0);
          expect(note.gain, where).toBeLessThanOrEqual(MUSIC_LIMITS.gain);
          for (const hz of [note.from, note.to, note.filter?.freq]) {
            if (hz === undefined) continue;
            expect(hz, where).toBeGreaterThanOrEqual(MUSIC_LIMITS.minHz);
            expect(hz, where).toBeLessThanOrEqual(MUSIC_LIMITS.maxHz);
          }
          expect(note.attack, where).toBeGreaterThan(0);
          expect(note.decay, where).toBeGreaterThan(0);
          if (note.wave === "noise") expect(note.filter, where).toBeDefined();
        }
      });
    }
  });

  it("ends every bar on its own bar line", () => {
    for (const id of TRACK_IDS) {
      const track = TRACKS[id];
      const length = barSeconds(track);
      track.bars.forEach((_, bar) => {
        const notes = notesFor(track, bar);
        for (const note of notes) {
          expect(note.at, `${id} bar ${bar}`).toBeGreaterThanOrEqual(0);
          expect(note.at, `${id} bar ${bar}`).toBeLessThan(length);
        }
        expect(voiceSeconds(notes), `${id} bar ${bar}`).toBeLessThanOrEqual(
          length,
        );
      });
    }
  });

  it("goes round: the bar after the last is the first", () => {
    for (const id of TRACK_IDS) {
      const track = TRACKS[id];
      expect(notesFor(track, track.bars.length), id).toEqual(
        notesFor(track, 0),
      );
    }
  });

  it("holds a note for as long as it is written", () => {
    const track = TRACKS.lost;
    const step = barSeconds(track) / STEPS;
    // "0---------------": one bass note, the whole bar.
    const bass = notesFor(track, 0).filter((note) => note.from < 100);
    expect(bass).toHaveLength(1);
    expect(bass[0]?.decay).toBeGreaterThan(step * 14);
  });
});

describe("trackFor", () => {
  it("has a theme for every rival, and no two the same", () => {
    expect([...RIVAL_THEMES].sort()).toEqual(
      RIVAL_LIST.map((rival) => rival.id).sort(),
    );
    const themes = GAUNTLET.map((rivalId) =>
      trackFor({ on: "match", rivalId }),
    );
    expect(themes).toEqual(GAUNTLET);
    expect(new Set(themes.map(score)).size).toBe(GAUNTLET.length);
  });

  it("plays the bosses in a minor key, faster than the floor below", () => {
    for (const rival of RIVAL_LIST.filter((r) => r.boss)) {
      const theme = TRACKS[trackFor({ on: "match", rivalId: rival.id })];
      const below =
        TRACKS[
          trackFor({
            on: "match",
            rivalId: GAUNTLET[GAUNTLET.indexOf(rival.id) - 1],
          })
        ];
      expect(["minor", "phrygian"], rival.id).toContain(theme.scale);
      expect(theme.bpm, rival.id).toBeGreaterThan(below.bpm);
    }
  });

  it("opens each match with its own theme, less the lead and the drums", () => {
    for (const rivalId of GAUNTLET) {
      const prelude = TRACKS[trackFor({ on: "setup", rivalId })];
      const theme = TRACKS[trackFor({ on: "match", rivalId })];
      expect(prelude.bpm).toBe(theme.bpm);
      expect(prelude.root).toBe(theme.root);
      prelude.bars.forEach((bar, index) => {
        expect(bar.lead).toBeUndefined();
        expect(bar.drums).toBeUndefined();
        expect(bar.bass).toBe(theme.bars[index]?.bass);
        expect(bar.arp).toBe(theme.bars[index]?.arp);
      });
    }
  });

  it("gives every screen a tune of its own", () => {
    const screens: MusicScreen[] = [
      { on: "menu" },
      { on: "clans" },
      { on: "climb", summit: false },
      { on: "climb", summit: true },
      { on: "setup", rivalId: GAUNTLET[0] },
      { on: "match", rivalId: GAUNTLET[0] },
      { on: "reward" },
      { on: "summary", won: true },
      { on: "summary", won: false },
    ];
    const ids = screens.map(trackFor);
    for (const id of ids) expect(TRACKS[id], id).toBeDefined();
    expect(new Set(ids.map(score)).size).toBe(screens.length);
  });

  it("still plays for a rival nobody wrote a theme for", () => {
    expect(trackFor({ on: "match", rivalId: "nobody" })).toBe("alley-tom");
    expect(trackFor({ on: "match", rivalId: "toString" })).toBe("alley-tom");
    expect(trackFor({ on: "setup", rivalId: undefined })).toBe(
      "prelude:alley-tom",
    );
  });
});
