/**
 * Every tune of the game, written down as data, the way the sounds are. A track
 * is a few bars; a bar is up to four parts of sixteen steps each; a step is
 * a degree of the track's scale, a hold, a rest or a drum. Nothing here
 * touches the Web Audio API: `notesFor` turns one bar into the same `Note`
 * the effects are made of, and the player only has to schedule them.
 *
 * Every screen of a run has its own tune and every rival its own theme; the
 * pages around a run share one. The
 * opening hand plays the theme of the rival about to be met with its lead
 * and drums left out, so the match drops in on top of what was playing.
 */

import { LIMITS, type Note } from "../sfx/recipes";

/** Steps in a bar: sixteenths, four to a beat. */
export const STEPS = 16;

/** Semitones above the root of each degree of a scale. */
const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
} as const;
export type Scale = keyof typeof SCALES;

/**
 * One bar. `lead`, `arp` and `bass` are sixteen characters: a degree of the
 * scale (`0` to `9`, then `a` to `e` for the tenth to the fourteenth), `-`
 * to hold the note before it, `.` to rest. `drums` is `k` for a kick, `s`
 * for a snare, `h` for a hat.
 */
export interface Bar {
  lead?: string;
  arp?: string;
  bass?: string;
  drums?: string;
}

export const PARTS = ["lead", "arp", "bass", "drums"] as const;
export type Part = (typeof PARTS)[number];

export interface Track {
  /** Beats a minute, four steps to the beat. */
  bpm: number;
  /** Hz of the scale's first degree. The bass plays two octaves under it. */
  root: number;
  scale: Scale;
  /** The lead's wave: square, or triangle for a soft tune. */
  lead?: "square" | "triangle";
  bars: readonly Bar[];
}

/** No note of the music is louder than this, so an effect always sits on top. */
export const MUSIC_LIMITS = {
  gain: 0.14,
  minHz: LIMITS.minHz,
  maxHz: LIMITS.maxHz,
  /** The highest degree a pattern may name: two octaves up a seven-note scale. */
  degree: 14,
} as const;

/** How long one bar of a track lasts, in seconds. */
export function barSeconds(track: Track): number {
  return (60 / track.bpm) * 4;
}

function pitch(track: Track, degree: number, octaves: number): number {
  const scale = SCALES[track.scale];
  const semitones =
    12 * Math.floor(degree / scale.length) +
    (scale[degree % scale.length] ?? 0);
  return track.root * 2 ** (semitones / 12 + octaves);
}

/** A part's pattern as notes: where each starts, in steps, and how long it is held. */
function held(
  pattern: string,
): { degree: number; step: number; steps: number }[] {
  const notes: { degree: number; step: number; steps: number }[] = [];
  let open: (typeof notes)[number] | null = null;
  [...pattern].forEach((mark, step) => {
    if (mark === "-") {
      if (open) open.steps += 1;
      return;
    }
    open = null;
    if (mark === ".") return;
    open = { degree: parseInt(mark, 36), step, steps: 1 };
    notes.push(open);
  });
  return notes;
}

const ATTACK = 0.006;

function voiced(track: Track, part: Exclude<Part, "drums">, bar: Bar): Note[] {
  const step = barSeconds(track) / STEPS;
  return held(bar[part] ?? "").map(({ degree, step: at, steps }) => {
    const seconds = step * steps;
    const base = { at: at * step, attack: ATTACK };
    if (part === "bass") {
      const hz = pitch(track, degree, -2);
      return {
        ...base,
        wave: "triangle",
        from: hz,
        to: hz,
        decay: seconds * 0.94 - ATTACK,
        gain: 0.13,
      };
    }
    const hz = pitch(track, degree, 0);
    if (part === "arp") {
      return {
        ...base,
        wave: "triangle",
        from: hz,
        to: hz,
        // Plucked: an arpeggio rings no longer than a beat, however it is held.
        decay: Math.min(seconds, step * 4) * 0.9 - ATTACK,
        gain: 0.07,
      };
    }
    const soft = track.lead === "triangle";
    return {
      ...base,
      wave: soft ? "triangle" : "square",
      from: hz,
      to: hz,
      decay: seconds * 0.94 - ATTACK,
      gain: soft ? 0.1 : 0.055,
      // A bare square is all edge; this takes the top off it.
      ...(soft ? {} : { filter: { type: "lowpass" as const, freq: 2600 } }),
    };
  });
}

function drummed(track: Track, bar: Bar): Note[] {
  const step = barSeconds(track) / STEPS;
  const room = step * 0.94;
  const notes: Note[] = [];
  [...(bar.drums ?? "")].forEach((mark, index) => {
    const at = index * step;
    if (mark === "k") {
      notes.push({
        wave: "sine",
        from: 130,
        to: 48,
        at,
        attack: 0.002,
        decay: Math.min(0.11, room - 0.002),
        gain: 0.14,
      });
    } else if (mark === "s") {
      notes.push({
        wave: "noise",
        from: 1900,
        to: 1200,
        at,
        attack: 0.002,
        decay: Math.min(0.07, room - 0.002),
        gain: 0.06,
        filter: { type: "bandpass", freq: 1900 },
      });
    } else if (mark === "h") {
      notes.push({
        wave: "noise",
        from: 5200,
        to: 5200,
        at,
        attack: 0.001,
        decay: 0.028,
        gain: 0.028,
        filter: { type: "highpass", freq: 5200 },
      });
    }
  });
  return notes;
}

/**
 * The notes of one bar of a track, timed from the bar line. Bars go round:
 * the one after the last is the first.
 */
export function notesFor(track: Track, bar: number): Note[] {
  const count = track.bars.length;
  const at = track.bars[((bar % count) + count) % count];
  if (!at) return [];
  return [
    ...voiced(track, "lead", at),
    ...voiced(track, "arp", at),
    ...voiced(track, "bass", at),
    ...drummed(track, at),
  ];
}

const C4 = 261.63;
const D4 = 293.66;
const F4 = 349.23;
const G4 = 392.0;
const A3 = 220.0;
const B3 = 246.94;

/** The theme of each rival, by the rival's id. The two bosses are minor and faster. */
const THEMES = {
  /** Scrappy and sure of itself: a strut over a walking bass. */
  "alley-tom": {
    bpm: 116,
    root: A3,
    scale: "major",
    bars: [
      {
        lead: "7.7.9.7.5.4.5...",
        arp: "0.4.0.4.0.4.0.4.",
        bass: "0..0..0.4..4..4.",
        drums: "k.h.s.h.k.h.s.h.",
      },
      {
        lead: "7.7.9.7.b.9.7...",
        arp: "3.7.3.7.3.7.3.7.",
        bass: "3..3..3.7..7..7.",
        drums: "k.h.s.h.k.h.s.h.",
      },
      {
        lead: "9.9.b.9.7.5.7...",
        arp: "0.4.0.4.0.4.0.4.",
        bass: "0..0..0.4..4..4.",
        drums: "k.h.s.h.k.h.s.h.",
      },
      {
        lead: "8.7.6.4.7-------",
        arp: "4.8.4.8.4.8.4.8.",
        bass: "4..4..4.4.4.6.6.",
        drums: "k.h.s.h.k.k.s.s.",
      },
    ],
  },
  /** Two voices: one says it, the other says it back. */
  "dockside-twins": {
    bpm: 126,
    root: D4,
    scale: "pentatonic",
    bars: [
      {
        lead: "5.4.3...........",
        arp: "........5.4.3...",
        bass: "0...0...0...0...",
        drums: "k...s...k.k.s...",
      },
      {
        lead: "3.4.5.7.........",
        arp: "........3.4.5.7.",
        bass: "3...3...3...3...",
        drums: "k...s...k.k.s...",
      },
      {
        lead: "8.7.5...8.7.5...",
        arp: "....5.7.....5.7.",
        bass: "4...4...4...4...",
        drums: "k...s...k.k.s...",
      },
      {
        lead: "5.4.3.4.5-------",
        arp: "0.3.5.3.0.3.5.3.",
        bass: "0...0...3...3...",
        drums: "k.h.s.h.k.h.s.s.",
      },
    ],
  },
  /** A boss, and she knows it: a long haughty note over a running arpeggio. */
  "madame-mittens": {
    bpm: 138,
    root: B3,
    scale: "minor",
    bars: [
      {
        lead: "7---6.4.7---6.4.",
        arp: "0247024702470247",
        bass: "0.0.0.0.0.0.0.0.",
        drums: "k.h.s.h.k.h.s.h.",
      },
      {
        lead: "9---7.5.9---7.5.",
        arp: "579c579c579c579c",
        bass: "5.5.5.5.5.5.5.5.",
        drums: "k.h.s.h.k.h.s.h.",
      },
      {
        lead: "a---9.7.a---9.7.",
        arp: "357a357a357a357a",
        bass: "3.3.3.3.3.3.3.3.",
        drums: "k.h.s.h.k.h.s.h.",
      },
      {
        lead: "8-------b.a.8.6.",
        arp: "468b468b468b468b",
        bass: "4.4.4.4.4.4.6.6.",
        drums: "k.h.s.h.k.k.s.s.",
      },
    ],
  },
  /** Seven cats, one opinion: the lead and the bass play the same riff. */
  "rooftop-syndicate": {
    bpm: 124,
    root: C4,
    scale: "dorian",
    bars: [
      {
        lead: "0..0..2.3..4....",
        bass: "0..0..2.3..4....",
        drums: "k..k..s.k..s..h.",
      },
      {
        lead: "4..4..3.2..0....",
        bass: "4..4..3.2..0....",
        drums: "k..k..s.k..s..h.",
      },
      {
        lead: "0..0..2.3..4..6.",
        arp: "....7.......7...",
        bass: "0..0..2.3..4..6.",
        drums: "k..k..s.k..s..h.",
      },
      {
        lead: "7..6..4.3.2.0---",
        arp: "....9.......b...",
        bass: "3..3..3.4.4.4...",
        drums: "k..k..s.k.s.s.s.",
      },
    ],
  },
  /** Filed and ticking: clockwork hats, nothing out of place. */
  "the-archivist": {
    bpm: 108,
    root: F4,
    scale: "major",
    lead: "triangle",
    bars: [
      {
        lead: "7-------9---7---",
        arp: "0.4.2.4.0.4.2.4.",
        bass: "0-------4-------",
        drums: "h.h.h.h.h.h.h.h.",
      },
      {
        lead: "9-------8---7---",
        arp: "5.9.7.9.5.9.7.9.",
        bass: "5-------5---4---",
        drums: "h.h.h.h.h.h.h.h.",
      },
      {
        lead: "a-------9---7---",
        arp: "3.7.5.7.3.7.5.7.",
        bass: "3-------3-------",
        drums: "h.h.h.h.h.h.h.h.",
      },
      {
        lead: "8---6---4---6---",
        arp: "4.8.6.8.4.8.6.8.",
        bass: "4-------4---6---",
        drums: "h.h.h.h.h.hhs.s.",
      },
    ],
  },
  /** The last floor: slow heavy notes a semitone apart, over a bass that does not stop. */
  "old-nine-lives": {
    bpm: 144,
    root: A3,
    scale: "phrygian",
    bars: [
      {
        lead: "0-------1---0---",
        arp: "7.4.7.4.7.4.7.4.",
        bass: "0.00.0.00.0.0.0.",
        drums: "k.h.s.hkk.h.s.h.",
      },
      {
        lead: "2-------1---0---",
        arp: "8.5.8.5.8.5.8.5.",
        bass: "1.11.1.11.1.1.1.",
        drums: "k.h.s.hkk.h.s.h.",
      },
      {
        lead: "4-------5---4---",
        arp: "b.7.b.7.b.7.b.7.",
        bass: "0.00.0.00.0.0.0.",
        drums: "k.h.s.hkk.h.s.h.",
      },
      {
        lead: "6---5---4---1---",
        arp: "a.6.a.6.8.5.8.5.",
        bass: "6.66.6.61.1.1.1.",
        drums: "k.h.s.hkk.k.s.ss",
      },
    ],
  },
} as const satisfies Record<string, Track>;

export type RivalTheme = keyof typeof THEMES;
export const RIVAL_THEMES = Object.keys(THEMES) as RivalTheme[];

/** Marching up: an arpeggio that only ever rises. */
const TOWER: Track = {
  bpm: 112,
  root: D4,
  scale: "dorian",
  bars: [
    {
      lead: "........7---9---",
      arp: "0.2.4.7.2.4.7.9.",
      bass: "0...0...4...0...",
      drums: "k.h.s.h.k.k.s.h.",
    },
    {
      arp: "6.8.a.d.8.a.d.a.",
      bass: "6...6...a...6...",
      drums: "k.h.s.h.k.k.s.h.",
    },
    {
      lead: "a---9---7---5---",
      arp: "3.5.7.a.5.7.a.c.",
      bass: "3...3...7...3...",
      drums: "k.h.s.h.k.k.s.h.",
    },
    {
      lead: "8-------b-------",
      arp: "4.6.8.b.6.8.b.d.",
      bass: "4...4...4.4.4.4.",
      drums: "k.h.s.h.k.k.s.s.",
    },
  ],
};

const SCREENS = {
  /**
   * Outside the tower and in its rooms, between runs: soft and unhurried, a
   * triangle over a rocking arpeggio, with a hat and nothing heavier.
   */
  menu: {
    bpm: 88,
    root: F4,
    scale: "pentatonic",
    lead: "triangle",
    bars: [
      {
        lead: "4-----2-3-------",
        arp: "0.2.4.2.0.2.4.2.",
        bass: "0-------0-------",
      },
      {
        lead: "....2-3-4---5---",
        arp: "0.2.4.2.0.2.4.2.",
        bass: "3-------3-------",
      },
      {
        lead: "7-----5-4-------",
        arp: "1.3.5.3.1.3.5.3.",
        bass: "1-------1-------",
        drums: "........h.......",
      },
      {
        lead: "3---2---0-------",
        arp: "0.2.4.2.0.2.4...",
        bass: "4-------0-------",
        drums: "........h...h...",
      },
    ],
  },
  /** Before a run: slow and open, an arpeggio and a bass and nothing else. */
  start: {
    bpm: 84,
    root: C4,
    scale: "major",
    bars: [
      { arp: "0.2.4.7.4.2.4.2.", bass: "0-------0---4---" },
      { arp: "5.7.9.c.9.7.9.7.", bass: "5-------5---9---" },
      { arp: "3.5.7.a.7.5.7.5.", bass: "3-------3---7---" },
      { arp: "4.6.8.b.8.6.8.6.", bass: "4-------4---6---" },
    ],
  },
  /**
   * The chest at the tower's foot: the same open arpeggio a fourth up, with
   * a triangle picking out what might be inside.
   */
  chest: {
    bpm: 84,
    root: F4,
    scale: "major",
    lead: "triangle",
    bars: [
      {
        lead: "........4---7---",
        arp: "0.2.4.7.4.2.4.2.",
        bass: "0-------0---4---",
      },
      {
        lead: "9-------7---5---",
        arp: "5.7.9.c.9.7.9.7.",
        bass: "5-------5---9---",
      },
      {
        lead: "........5---7---",
        arp: "3.5.7.a.7.5.7.5.",
        bass: "3-------3---7---",
        drums: "............h...",
      },
      {
        lead: "8-------b-------",
        arp: "4.6.8.b.8.6.8.6.",
        bass: "4-------4---6---",
        drums: "........h...h...",
      },
    ],
  },
  tower: TOWER,
  /** The same march in a major key, a step up and a little quicker: the roof. */
  summit: { ...TOWER, bpm: 120, root: F4, scale: "major" },
  /** Taking a reward: light, in no hurry. */
  reward: {
    bpm: 96,
    root: G4,
    scale: "pentatonic",
    lead: "triangle",
    bars: [
      {
        lead: "2...3.4.5---....",
        bass: "0-------0-------",
        drums: "....h.......h...",
      },
      {
        lead: "4...3.2.3---....",
        bass: "3-------3-------",
        drums: "....h.......h...",
      },
      {
        lead: "2...3.4.5...7...",
        bass: "4-------4-------",
        drums: "....h.......h...",
      },
      {
        lead: "6.5.4.3.2-------",
        bass: "3-------0-------",
        drums: "....h.......h.h.",
      },
    ],
  },
  /** A run won: a fanfare that keeps going. */
  won: {
    bpm: 132,
    root: C4,
    scale: "major",
    bars: [
      {
        lead: "0.0.2.4.7---4---",
        arp: "0.4.7.4.0.4.7.4.",
        bass: "0...0...0...0...",
        drums: "k.h.s.h.k.h.s.h.",
      },
      {
        lead: "3.3.5.7.a---7---",
        arp: "3.7.a.7.3.7.a.7.",
        bass: "3...3...3...3...",
        drums: "k.h.s.h.k.h.s.h.",
      },
      {
        lead: "4.4.6.8.b---8---",
        arp: "4.8.b.8.4.8.b.8.",
        bass: "4...4...4...4...",
        drums: "k.h.s.h.k.h.s.h.",
      },
      {
        lead: "9.8.7.4.7-------",
        arp: "0.4.7.4.0.4.7.9.",
        bass: "0...0...4...0...",
        drums: "k.h.s.h.k.k.s.s.",
      },
    ],
  },
  /** A run lost: slow, low, falling. */
  lost: {
    bpm: 66,
    root: A3,
    scale: "minor",
    lead: "triangle",
    bars: [
      { lead: "7-----6-4-------", bass: "0---------------" },
      { lead: "5-----4-2-------", bass: "5---------------" },
      { lead: "4-----3-2-------", bass: "3---------------" },
      { lead: "1-----2-0-------", bass: "4-------4-------" },
    ],
  },
} as const satisfies Record<string, Track>;

type ScreenTrack = keyof typeof SCREENS;
export type Prelude = `prelude:${RivalTheme}`;
export type TrackId = ScreenTrack | RivalTheme | Prelude;

/** A theme with only its arpeggio and its bass: what plays over the opening hand. */
function prelude(track: Track): Track {
  return {
    ...track,
    bars: track.bars.map(({ arp, bass }) => ({ arp, bass })),
  };
}

export const TRACKS: Record<TrackId, Track> = {
  ...SCREENS,
  ...THEMES,
  ...(Object.fromEntries(
    RIVAL_THEMES.map((id) => [`prelude:${id}`, prelude(THEMES[id])]),
  ) as Record<Prelude, Track>),
};

export const TRACK_IDS = Object.keys(TRACKS) as TrackId[];

/** Where the player is, as far as the music cares. */
export type MusicScreen =
  | { on: "menu" | "start" | "chest" | "reward" }
  | { on: "climb"; summit: boolean }
  | { on: "setup" | "match"; rivalId: string | undefined }
  | { on: "summary"; won: boolean };

function isTheme(id: string | undefined): id is RivalTheme {
  return id !== undefined && Object.hasOwn(THEMES, id);
}

/** The tune a screen plays. A rival nobody wrote a theme for gets the first one. */
export function trackFor(screen: MusicScreen): TrackId {
  switch (screen.on) {
    case "menu":
    case "start":
    case "chest":
    case "reward":
      return screen.on;
    case "climb":
      return screen.summit ? "summit" : "tower";
    case "summary":
      return screen.won ? "won" : "lost";
    case "setup":
    case "match": {
      const theme = isTheme(screen.rivalId) ? screen.rivalId : "alley-tom";
      return screen.on === "setup" ? `prelude:${theme}` : theme;
    }
  }
}
