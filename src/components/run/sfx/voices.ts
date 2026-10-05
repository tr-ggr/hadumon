/**
 * A voice for every HaduMon, written down as data like the rest of the
 * table's sounds. A cat is heard when it is chosen or turned over to read.
 *
 * Four things make a voice. Its pitch is the cat's own: no two share one,
 * so no two cats can sound the same. Its shape comes from what the cat is (a
 * rogue chirps up, a bruiser falls, a tank barely moves), and its timbre
 * from its element. A rarer cat takes longer over it and adds an ornament.
 * And each cat has one of four small turns of its own, so that two of a kind
 * a rung apart are still two cats.
 *
 * Nothing here is written out cat by cat but a legendary's signature: the
 * pitches are worked out from the catalogue, however many cats it holds.
 *
 * Cats are the player's pieces: triangle, sine and a quiet square, never the
 * rival's sawtooth, and never noise.
 */

import {
  CAT_LIST,
  CATS,
  RARITIES,
  type Archetype,
  type Cat,
  type Rarity,
} from "~/server/game/cats";
import type { Element } from "~/server/game/elements";

import { recipe, tone, voiceSeconds, type Note, type Voice } from "./recipes";

/** The pitch every other is counted from: A3. */
const ROOT_HZ = 220;

/** What a voice is made from: all of a cat that can be heard. */
export type Voiced = Pick<Cat, "id" | "element" | "archetype" | "rarity">;

/**
 * The pitches are a ladder of this many rungs, a quarter of a semitone
 * apart: A3 at the bottom and a little over two octaves to the top, 946 Hz.
 * It is a rung for every cat the catalogue is meant to hold.
 */
export const RUNGS = 102;
const RUNGS_TO_A_SEMITONE = 4;

const HADU = "hadu";
/**
 * Hadu's rung: E4, seven semitones above the root, where a chain of powers
 * starts its ladder. He is on it whatever else is in the catalogue.
 */
const HADU_RUNG = 7 * RUNGS_TO_A_SEMITONE;

/**
 * The order the cats go up the ladder in. The clans come first, the shade
 * clan at the bottom and volt at the top. Within a clan the cats go from the
 * lowest voice to the highest, tanks first and scouts last; then the
 * commoner cat is under the rarer; and the name settles what is left.
 */
const ELEMENT_RANK: Record<Element, number> = {
  shade: 0,
  thorn: 1,
  flame: 2,
  mist: 3,
  volt: 4,
};

const ARCHETYPE_RANK: Record<Archetype, number> = {
  tank: 0,
  bruiser: 1,
  familiar: 2,
  mage: 3,
  rogue: 4,
  scout: 5,
};

function upTheLadder(a: Voiced, b: Voiced): number {
  return (
    ELEMENT_RANK[a.element] - ELEMENT_RANK[b.element] ||
    ARCHETYPE_RANK[a.archetype] - ARCHETYPE_RANK[b.archetype] ||
    RARITIES.indexOf(a.rarity) - RARITIES.indexOf(b.rarity) ||
    // Not by locale: the order must be the same on every machine.
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
}

/**
 * The rung each cat stands on. Hadu takes his own, and the rest are laid in
 * order over the rungs he left, spread from the bottom to the top: a small
 * catalogue is not packed into the low end, and a full one takes every rung.
 * One fuller than the ladder is not refused a voice. The ladder goes on up, a
 * rung for each cat over, and the pitches are still all different.
 */
export function ladderFor(
  cats: readonly Voiced[],
): ReadonlyMap<string, number> {
  const pinned = cats.some((cat) => cat.id === HADU);
  const rest = cats.filter((cat) => cat.id !== HADU).sort(upTheLadder);
  const free = Array.from(
    { length: Math.max(RUNGS, cats.length) },
    (_, rung) => rung,
  ).filter((rung) => !pinned || rung !== HADU_RUNG);

  // A stride of a rung or more, so no two cats round to the same one.
  const stride = (free.length - 1) / Math.max(1, rest.length - 1);
  const ladder = new Map<string, number>(pinned ? [[HADU, HADU_RUNG]] : []);
  rest.forEach((cat, i) => {
    ladder.set(cat.id, free[Math.round(i * stride)] ?? 0);
  });
  return ladder;
}

const LADDER = ladderFor(CAT_LIST);

/**
 * The three notes a legendary signs off with, in semitones above its pitch:
 * gold goes up a major chord, the night comes down a minor one, and Hadu
 * goes home, to the fifth, and home again an octave up.
 */
export const SIGNATURE: Readonly<
  Record<string, readonly [number, number, number]>
> = {
  aurelynx: [0, 4, 7],
  nyxaroth: [7, 3, 0],
  hadu: [0, 7, 12],
};

function semitones(count: number): number {
  return 2 ** (count / 12);
}

/** The pitch of a rung of the ladder, in Hz. */
export function rungHz(rung: number): number {
  return ROOT_HZ * semitones(rung / RUNGS_TO_A_SEMITONE);
}

/** A cat's pitch in Hz, or `null` for a cat the catalogue does not hold. */
export function catPitch(catId: string): number | null {
  const rung = LADDER.get(catId);
  return rung === undefined ? null : rungHz(rung);
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

/**
 * The small turn a cat gives its shape, so that it is not only a rung that
 * tells it from the next of its kind. The shape is still its archetype's.
 */
export const INFLECTIONS = ["plain", "grace", "wide", "dip"] as const;
export type Inflection = (typeof INFLECTIONS)[number];

/** Said as it is written. */
function plain(contour: readonly Stroke[]): readonly Stroke[] {
  return contour;
}

/** A short note a tone under the call, and then the call. */
function grace(contour: readonly Stroke[]): readonly Stroke[] {
  const first = contour[0];
  if (!first) return contour;
  const under = first.from * 0.89;
  return [
    stroke(under, under, 0, 0.04, 0.6),
    ...contour.map((s) => ({ ...s, at: s.at + 0.03 })),
  ];
}

/**
 * Every stroke reaches a quarter further from the cat's own pitch, up or
 * down. A tank moves so little that this is the faintest of the four on it.
 */
function wide(contour: readonly Stroke[]): readonly Stroke[] {
  return contour.map((s) => ({
    ...s,
    from: s.from ** 1.25,
    to: s.to ** 1.25,
  }));
}

/** The call, and a small fall off the end of it. */
function dip(contour: readonly Stroke[]): readonly Stroke[] {
  const last = contour.at(-1);
  if (!last) return contour;
  return [
    ...contour,
    stroke(last.to, last.to * 0.84, last.at + last.len * 0.5, 0.06, 0.6),
  ];
}

const INFLECT: Record<
  Inflection,
  (contour: readonly Stroke[]) => readonly Stroke[]
> = { plain, grace, wide, dip };

/** A string as a whole number, the same every time: FNV-1a, 32 bits. */
function hash(text: string): number {
  let sum = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    sum = Math.imul(sum ^ text.charCodeAt(i), 0x01000193);
  }
  return sum >>> 0;
}

/** Which turn a cat gives its shape. Its name decides, so it never changes. */
export function catInflection(catId: string): Inflection {
  return INFLECTIONS[hash(catId) % INFLECTIONS.length] ?? "plain";
}

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

/** A voice that would run over is said a little faster, to end inside the limit. */
function fit(voice: readonly Note[]): Voice {
  const seconds = voiceSeconds(voice);
  if (seconds <= VOICE_SECONDS) return voice;
  const faster = (VOICE_SECONDS * 0.999) / seconds;
  return voice.map((note) => ({
    ...note,
    at: note.at * faster,
    attack: note.attack * faster,
    decay: note.decay * faster,
  }));
}

/** A cat's call at a pitch: its shape, turned, stretched and given a timbre. */
function ornamented(cat: Voiced, hz: number, inflection: Inflection): Note[] {
  const stretch = STRETCH[cat.rarity];
  const strokes = INFLECT[inflection](CONTOUR[cat.archetype]).map((s) => ({
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
  const signature = Object.hasOwn(SIGNATURE, cat.id)
    ? SIGNATURE[cat.id]
    : undefined;
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

/**
 * The voice of anything with a cat's four parts, at a pitch. The turn is the
 * one its name gives it unless another is asked for.
 */
export function voiceFor(
  cat: Voiced,
  hz: number,
  inflection: Inflection = catInflection(cat.id),
): Voice {
  return fit(ornamented(cat, hz, inflection));
}

/**
 * The voice of a cat. One the table has no voice for sounds like any other
 * piece being picked up.
 */
export function catVoice(catId: string): Voice {
  const hz = catPitch(catId);
  const cat = Object.hasOwn(CATS, catId) ? CATS[catId] : undefined;
  if (hz === null || !cat) return recipe("pick");
  return voiceFor(cat, hz);
}
