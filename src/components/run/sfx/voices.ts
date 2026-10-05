/**
 * A voice for every HaduMon, written down as data like the rest of the
 * table's sounds. A cat is heard when it is chosen or turned over to read.
 *
 * Three things make a voice. Its pitch is the cat's own: no two share one,
 * so no two cats can sound the same. Its shape comes from what the cat is (a
 * rogue chirps up, a bruiser falls, a tank barely moves), and its timbre
 * from its element. A rarer cat takes longer over it and adds an ornament.
 *
 * Cats are the player's pieces: triangle, sine and a quiet square, never the
 * rival's sawtooth, and never noise.
 */

import { CATS, type Archetype, type Rarity } from "~/server/game/cats";
import type { Element } from "~/server/game/elements";

import { recipe, tone, voiceSeconds, type Note, type Voice } from "./recipes";

/** The pitch every other is counted from: A3. */
const ROOT_HZ = 220;

/**
 * Each cat's own pitch, in semitones above the root. Tanks and the shade
 * clan sit at the bottom, volt at the top. Hadu is on E4, where a chain of
 * powers starts its ladder.
 */
const PITCH: Readonly<Record<string, number>> = {
  bramblepaw: 0,
  verdantmane: 1,
  umbralynx: 2,
  aurelynx: 3,
  gloomtail: 4,
  nyxaroth: 5,
  duskmew: 6,
  hadu: 7,
  shadewhisker: 8,
  burrfang: 9,
  infernomane: 10,
  flameclaw: 11,
  arcpurr: 12,
  thornkit: 13,
  pyrelynx: 14,
  brumefang: 15,
  cinderpounce: 16,
  nimbustail: 17,
  emberkit: 18,
  dewhisker: 19,
  oraclemew: 20,
  mistpaw: 21,
  joltpad: 22,
  sparkmew: 23,
  stormsabre: 24,
  voltwhisk: 25,
};

/**
 * The three notes a legendary signs off with, in semitones above its pitch:
 * gold goes up a major chord, the night comes down a minor one, and Hadu
 * goes home, to the fifth, and home again an octave up.
 */
const SIGNATURE: Readonly<Record<string, readonly [number, number, number]>> = {
  aurelynx: [0, 4, 7],
  nyxaroth: [7, 3, 0],
  hadu: [0, 7, 12],
};

function semitones(count: number): number {
  return 2 ** (count / 12);
}

/** A cat's pitch in Hz, or `null` for a cat that has no voice written. */
export function catPitch(catId: string): number | null {
  if (!Object.hasOwn(PITCH, catId)) return null;
  return ROOT_HZ * semitones(PITCH[catId] ?? 0);
}

/**
 * One stroke of a voice's shape. In a contour the pitches are multiples of
 * the cat's own; once the cat is known they are Hz.
 */
interface Stroke {
  from: number;
  to: number;
  /** Seconds after the voice starts. */
  at: number;
  /** Seconds it takes to die away. Only its first half is really heard. */
  len: number;
  /** How loud it is beside the voice's loudest stroke, 0 to 1. */
  level: number;
}

function stroke(
  from: number,
  to: number,
  at: number,
  len: number,
  level = 1,
): Stroke {
  return { from, to, at, len, level };
}

/** The shape of a voice, by what the cat is. */
const CONTOUR: Record<Archetype, readonly Stroke[]> = {
  // A chirp, up and gone.
  rogue: [stroke(1, 1.6, 0, 0.1)],
  // Starts above itself and falls a long way.
  bruiser: [stroke(1.12, 0.62, 0, 0.17)],
  // A mew: up, then down past where it began.
  familiar: [stroke(1, 1.33, 0, 0.11), stroke(1.3, 0.88, 0.07, 0.16, 0.9)],
  // A trill between two notes a minor third apart.
  scout: [
    stroke(1, 1, 0, 0.05),
    stroke(1.19, 1.19, 0.045, 0.05),
    stroke(1, 1, 0.09, 0.05),
    stroke(1.19, 1.19, 0.135, 0.065),
  ],
  // A slow rise, with a fifth above it.
  mage: [stroke(1, 1.12, 0, 0.18), stroke(1.5, 1.68, 0.03, 0.15, 0.45)],
  // A low, flat mrrp: one held note and the small turn that ends it.
  tank: [stroke(1, 0.97, 0, 0.12), stroke(0.97, 1.03, 0.09, 0.09, 0.8)],
};

/** How much longer a rarer cat takes. A legendary's signature is its length. */
const STRETCH: Record<Rarity, number> = {
  common: 1,
  uncommon: 1.12,
  rare: 1.25,
  epic: 1.4,
  legendary: 1,
};

/** The longest a voice may run, in seconds. */
export const VOICE_SECONDS = 0.45;
/** The loudest a square note in a voice may be: it is the harshest wave. */
export const SQUARE_GAIN = 0.1;

/** Flame: a triangle, and two sparks off the front of it. */
function flame(strokes: readonly Stroke[]): Note[] {
  const first = strokes[0];
  const sparks = first
    ? [
        tone("square", first.from * 3.2, first.from * 2.4, 0.045, 0.014, 0.012),
        tone("square", first.from * 4.1, first.from * 3, 0.035, 0.012, 0.045),
      ]
    : [];
  return [
    ...strokes.map((s) =>
      tone("triangle", s.from, s.to, 0.2 * s.level, s.len, s.at),
    ),
    ...sparks,
  ];
}

/** Mist: a sine that swells in and hangs a little. */
function mist(strokes: readonly Stroke[]): Note[] {
  return strokes.map((s) =>
    tone("sine", s.from, s.to, 0.2 * s.level, s.len * 1.15, s.at, 0.03),
  );
}

/** Volt: a quiet square that goes up its stroke in steps, every other one jumped. */
function volt(strokes: readonly Stroke[]): Note[] {
  return strokes.flatMap((s) => {
    const steps = Math.max(1, Math.round(s.len / 0.035));
    const each = s.len / steps;
    return Array.from({ length: steps }, (_, i) => {
      const along = steps === 1 ? 0 : i / (steps - 1);
      const hz = s.from * (s.to / s.from) ** along * (i % 2 === 1 ? 1.19 : 1);
      return tone(
        "square",
        hz,
        hz,
        0.085 * s.level,
        each * 1.6,
        s.at + i * each,
        0.002,
      );
    });
  });
}

/** Thorn: a triangle said twice, each half of the stroke clipped short. */
function thorn(strokes: readonly Stroke[]): Note[] {
  return strokes.flatMap((s) => {
    const middle = Math.sqrt(s.from * s.to);
    return [
      tone(
        "triangle",
        s.from,
        middle,
        0.2 * s.level,
        s.len * 0.42,
        s.at,
        0.002,
      ),
      tone(
        "triangle",
        middle,
        s.to,
        0.2 * s.level,
        s.len * 0.42,
        s.at + s.len * 0.5,
        0.002,
      ),
    ];
  });
}

/** Shade: a sine with another an octave under it. */
function shade(strokes: readonly Stroke[]): Note[] {
  return strokes.flatMap((s) => [
    tone("sine", s.from, s.to, 0.2 * s.level, s.len * 1.1, s.at),
    tone("sine", s.from / 2, s.to / 2, 0.13 * s.level, s.len * 1.1, s.at),
  ]);
}

const TIMBRE: Record<Element, (strokes: readonly Stroke[]) => Note[]> = {
  flame,
  mist,
  volt,
  thorn,
  shade,
};

/** A plain held note in an element's own wave, for a signature. */
function held(element: Element, hz: number, at: number): Note {
  return element === "volt"
    ? tone("square", hz, hz, 0.085, 0.12, at, 0.002)
    : tone(
        element === "mist" || element === "shade" ? "sine" : "triangle",
        hz,
        hz,
        0.2,
        0.12,
        at,
      );
}

/** A rare cat's ornament: a glint an octave over where its voice ends. */
function glint(strokes: readonly Stroke[]): Note[] {
  const last = strokes.at(-1);
  if (!last) return [];
  return [
    tone(
      "sine",
      last.to * 2,
      last.to * 2,
      0.07,
      0.08,
      last.at + last.len * 0.4,
      0.003,
    ),
  ];
}

/** An epic cat's: the whole call again, further off. */
function echo(notes: readonly Note[], later: number): Note[] {
  return notes.map((note) => ({
    ...note,
    at: note.at + later,
    gain: note.gain * 0.35,
  }));
}

/**
 * The voice of a cat. One the table has no voice for sounds like any other
 * piece being picked up.
 */
export function catVoice(catId: string): Voice {
  const hz = catPitch(catId);
  const cat = Object.hasOwn(CATS, catId) ? CATS[catId] : undefined;
  if (hz === null || !cat) return recipe("pick");

  const stretch = STRETCH[cat.rarity];
  const strokes = CONTOUR[cat.archetype].map((s) => ({
    ...s,
    from: s.from * hz,
    to: s.to * hz,
    at: s.at * stretch,
    len: s.len * stretch,
  }));
  const call = TIMBRE[cat.element](strokes);

  if (cat.rarity === "rare") return [...call, ...glint(strokes)];
  if (cat.rarity === "epic") {
    return [...call, ...glint(strokes), ...echo(call, 0.09)];
  }
  const signature = SIGNATURE[catId];
  if (cat.rarity === "legendary" && signature) {
    // The signature comes in over the tail of the call.
    const start = voiceSeconds(call) * 0.6;
    return [
      ...call,
      ...signature.map((step, i) =>
        held(cat.element, hz * semitones(step), start + i * 0.065),
      ),
    ];
  }
  return call;
}
