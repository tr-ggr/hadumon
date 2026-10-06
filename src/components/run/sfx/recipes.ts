/**
 * Every sound on the table, written down as data. A sound is a voice: a few
 * notes, each an oscillator or a burst of noise with an envelope. Nothing
 * here touches the Web Audio API, so the recipes are tested as numbers and
 * the engine only has to play what it is handed.
 *
 * The table's own pieces (yours) are bright and short: triangle and sine.
 * The rival's are lower and sawn, so its card never sounds like one of your
 * powers. A chain of powers climbs a pentatonic ladder, one step a power.
 */

import type { Cue } from "../playback";

export type Wave = "sine" | "triangle" | "square" | "sawtooth" | "noise";

export interface Note {
  wave: Wave;
  /** Hz when the note starts and when it ends; it glides between them. */
  from: number;
  to: number;
  /** Seconds after the voice starts. */
  at: number;
  /** Seconds from silence to the peak. */
  attack: number;
  /** Seconds from the peak back to silence. */
  decay: number;
  /** Peak gain, 0 to 1, before the master volume. */
  gain: number;
  /** A filter over the note. Noise is always given one. */
  filter?: { type: "lowpass" | "bandpass" | "highpass"; freq: number };
}

export type Voice = readonly Note[];

export const SFX_NAMES = [
  "hover",
  "pick",
  "click",
  "tap",
  "confirm",
  "illegal",
  "play",
  "dice",
  "reroll",
  "yarn",
  "power",
  "fizzle",
  "food",
  "draw",
  "cache",
  "tuck",
  "rivalFlip",
  "raid",
  "burn",
  "goalWon",
  "goalLost",
  "tick",
  "win",
  "loss",
  "settle",
  "slam",
  "page",
  "cover",
  "flare",
  "burst",
] as const;
export type SfxName = (typeof SFX_NAMES)[number];

/** No note is louder, lower, higher or later than these. */
export const LIMITS = {
  gain: 0.5,
  minHz: 40,
  maxHz: 6000,
  /** The longest a voice may run, in seconds: the fanfare's. */
  seconds: 1.6,
} as const;

/** Semitones above the root of each step of a major pentatonic scale. */
const PENTATONIC = [0, 2, 4, 7, 9] as const;
/** The root of the ladder: E4. */
const LADDER_ROOT_HZ = 329.63;
/** The ladder stops here, two octaves and a third up, however long the chain. */
export const LADDER_TOP = 12;

/** The pitch of step `n` of a chain. Steps past the top stay on it. */
export function ladder(step: number): number {
  const n = Math.max(0, Math.min(LADDER_TOP, Math.floor(step)));
  const semitones =
    12 * Math.floor(n / PENTATONIC.length) +
    (PENTATONIC[n % PENTATONIC.length] ?? 0);
  return LADDER_ROOT_HZ * 2 ** (semitones / 12);
}

/** One oscillator note, gliding from one pitch to another. */
export function tone(
  wave: Exclude<Wave, "noise">,
  from: number,
  to: number,
  gain: number,
  decay: number,
  at = 0,
  attack = 0.004,
): Note {
  return { wave, from, to, at, attack, decay, gain };
}

function noise(
  type: NonNullable<Note["filter"]>["type"],
  from: number,
  to: number,
  gain: number,
  decay: number,
  at = 0,
): Note {
  return {
    wave: "noise",
    from,
    to,
    at,
    attack: 0.002,
    decay,
    gain,
    filter: { type, freq: from },
  };
}

/** Notes of one pitch each, one after another. */
function run(
  wave: Exclude<Wave, "noise">,
  pitches: readonly number[],
  gap: number,
  gain: number,
  decay: number,
): Note[] {
  return pitches.map((hz, i) => tone(wave, hz, hz, gain, decay, i * gap));
}

const C4 = 261.63;
const E4 = 329.63;
const G4 = 392.0;
const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;
const C6 = 1046.5;

/**
 * The voice for a sound. `step` is how far up a chain it is: it sets the
 * pitch of a power, and nudges the score tick up as a number rolls.
 */
export function recipe(name: SfxName, step = 0): Voice {
  switch (name) {
    case "hover":
      return [tone("sine", 1250, 1000, 0.05, 0.03)];
    case "pick":
      return [tone("triangle", 620, 880, 0.2, 0.07)];
    case "click":
      return [tone("sine", 760, 560, 0.14, 0.045)];
    case "tap":
      // A press on nothing: a knuckle on the cloth, duller and quieter than a click.
      return [
        noise("lowpass", 500, 260, 0.07, 0.03),
        tone("sine", 210, 160, 0.06, 0.03),
      ];
    case "confirm":
      // The one way forward, pressed: two notes going up, brighter than a pick.
      return [
        tone("triangle", G5, G5, 0.2, 0.06, 0, 0.003),
        tone("triangle", C6, C6, 0.2, 0.1, 0.06, 0.003),
        tone("sine", C6 * 2, C6 * 2, 0.05, 0.06, 0.06, 0.003),
      ];
    case "illegal":
      return [
        tone("square", 150, 140, 0.11, 0.07),
        tone("square", 118, 110, 0.11, 0.1, 0.09),
      ];
    case "play":
      // The card leaves the hand, and lands when its flight does.
      return [
        noise("bandpass", 2600, 700, 0.2, 0.09),
        tone("sine", 150, 62, 0.42, 0.14, 0.3),
        noise("lowpass", 900, 300, 0.14, 0.06, 0.3),
      ];
    case "dice":
      return [
        noise("bandpass", 3200, 2600, 0.2, 0.025),
        noise("bandpass", 2400, 2000, 0.17, 0.025, 0.055),
        tone("triangle", 480, 620, 0.14, 0.08, 0.1),
      ];
    case "reroll":
      return [0, 0.04, 0.09, 0.13, 0.19, 0.26].map((at, i) =>
        noise("bandpass", 2200 + ((i * 370) % 1100), 1800, 0.17, 0.03, at),
      );
    case "yarn":
      return [
        tone("triangle", 494, 470, 0.24, 0.16, 0, 0.002),
        tone("sine", 988, 960, 0.07, 0.09, 0, 0.002),
      ];
    case "power": {
      const hz = ladder(step);
      return [
        tone("triangle", hz, hz, 0.26, 0.13, 0, 0.003),
        tone("sine", hz * 2, hz * 2, 0.08, 0.09, 0, 0.003),
      ];
    }
    case "fizzle":
      return [
        {
          ...tone("triangle", 185, 140, 0.13, 0.1),
          filter: { type: "lowpass", freq: 520 },
        },
      ];
    case "food":
      return [tone("sine", 700, 1040, 0.16, 0.085)];
    case "draw":
      return [
        noise("highpass", 2800, 4200, 0.12, 0.06),
        tone("sine", 880, 1180, 0.1, 0.06, 0.02),
      ];
    case "cache":
      return [
        tone("sine", 520, 780, 0.17, 0.08),
        noise("bandpass", 3600, 3000, 0.08, 0.02, 0.06),
      ];
    case "tuck":
      return [tone("sine", 440, 250, 0.2, 0.11)];
    case "rivalFlip":
      return [
        {
          ...tone("sawtooth", 196, 147, 0.2, 0.2, 0, 0.006),
          filter: { type: "lowpass", freq: 900 },
        },
        noise("lowpass", 600, 220, 0.2, 0.08),
      ];
    case "raid":
      return [
        noise("bandpass", 1500, 420, 0.22, 0.2),
        {
          ...tone("sawtooth", 123, 98, 0.16, 0.22),
          filter: { type: "lowpass", freq: 700 },
        },
      ];
    case "burn":
      return [
        noise("highpass", 3400, 1600, 0.16, 0.26),
        noise("bandpass", 900, 500, 0.12, 0.2, 0.05),
      ];
    case "goalWon":
      return run("triangle", [C5, E5, G5], 0.085, 0.24, 0.16);
    case "goalLost":
      return run("triangle", [E4, C4], 0.16, 0.2, 0.24).map((note) => ({
        ...note,
        filter: { type: "lowpass" as const, freq: 1100 },
      }));
    case "tick": {
      const hz = 1180 * 2 ** (Math.max(0, Math.min(12, step)) / 24);
      return [tone("sine", hz, hz, 0.06, 0.022, 0, 0.001)];
    }
    case "win":
      return [
        ...run("triangle", [C5, E5, G5, C6], 0.11, 0.24, 0.2),
        // The chord the run lands on, held.
        ...[C5, E5, G5].map((hz) => tone("sine", hz, hz, 0.12, 0.7, 0.46)),
        tone("triangle", C6, C6, 0.2, 0.75, 0.46),
      ];
    case "loss":
      return [G4, 311.13, C4].map((hz, i) => ({
        ...tone("sawtooth", hz, hz * 0.97, 0.17, 0.34, i * 0.24, 0.01),
        filter: { type: "lowpass" as const, freq: 800 },
      }));
    case "settle":
      return [
        tone("sine", 210, 120, 0.22, 0.09),
        tone("sine", 900, 820, 0.05, 0.03, 0.01),
      ];
    case "slam":
      // A title card coming down on the tower: the thud, and the board under it.
      return [
        tone("sine", 170, 46, 0.46, 0.22),
        noise("lowpass", 1400, 260, 0.22, 0.12),
        tone("square", 92, 80, 0.08, 0.1, 0.012),
      ];
    case "page":
      // A leaf of the codex: paper through the air, and its pat as it lies down.
      return [
        noise("bandpass", 1400, 3800, 0.11, 0.16),
        noise("lowpass", 900, 320, 0.1, 0.05, 0.35),
      ];
    case "cover":
      // The codex's cover lifted. A board, so its thud is `settle`, played
      // when it has come down: no voice here is long enough to hold both.
      return [
        noise("lowpass", 520, 1100, 0.14, 0.24),
        tone("sine", 190, 150, 0.06, 0.2),
      ];
    case "flare":
      // A wrapper catching: the hiss going up, and paper cracking under it.
      return [
        noise("highpass", 2400, 5200, 0.13, 0.38),
        noise("bandpass", 700, 1600, 0.1, 0.32, 0.03),
        noise("bandpass", 3100, 2700, 0.12, 0.02, 0.13),
        noise("bandpass", 3600, 3200, 0.1, 0.02, 0.27),
      ];
    case "burst":
      // What was in the pack let out at once: a thump, the air, and a chime.
      return [
        noise("bandpass", 1200, 4200, 0.2, 0.14),
        tone("sine", 190, 70, 0.34, 0.18),
        tone("triangle", E5, G5, 0.16, 0.2, 0.02),
        tone("sine", C6, C6, 0.07, 0.26, 0.05),
      ];
  }
}

/** When a voice has gone quiet, in seconds from its start. */
export function voiceSeconds(voice: Voice): number {
  return voice.reduce(
    (end, note) => Math.max(end, note.at + note.attack + note.decay),
    0,
  );
}

/** One sound to play: which, how far up the chain, and how long from now. */
export interface Sound {
  name: SfxName;
  step: number;
  /** Seconds to wait before it starts. */
  delay: number;
}

/** The most score ticks one frame sets off, however big the jump. */
export const MAX_TICKS = 5;
/** How many pieces of one kind are heard landing one after another. */
const MAX_REPEATS = 4;

function repeated(
  name: SfxName,
  times: number,
  gap: number,
  delay = 0,
  step = 0,
): Sound[] {
  return Array.from(
    { length: Math.min(Math.max(times, 0), MAX_REPEATS) },
    (_, i) => ({
      name,
      step,
      delay: delay + i * gap,
    }),
  );
}

function one(name: SfxName, delay = 0, step = 0): Sound[] {
  return [{ name, step, delay }];
}

/** A point or more scored: a tick for each, rising, a little after the hit. */
function ticks(points: number, delay: number, step: number): Sound[] {
  return Array.from(
    { length: Math.min(Math.max(points, 0), MAX_TICKS) },
    (_, i) => ({
      name: "tick" as const,
      step: step + i,
      delay: delay + i * 0.045,
    }),
  );
}

/** What a power sounds like once its blip has landed, by what it does. */
function effectSound(cue: Cue): Sound[] {
  const { delta } = cue;
  switch (cue.effect) {
    case "essence":
    case "wild":
      return one("food", 0.05);
    case "yarnSelf":
    case "yarnRow":
      return repeated("yarn", delta.yarn, 0.05, 0.05);
    case "draw":
      return repeated("draw", delta.hand, 0.06, 0.05);
    case "cache":
      return one("cache", 0.05);
    case "tuckDeck":
    case "pounce":
      return one("tuck", 0.05);
    default:
      return [];
  }
}

/**
 * The sounds a frame of a turn sets off. The closing frame is the table
 * itself and makes none.
 */
export function soundsFor(cue: Cue): Sound[] {
  const { delta } = cue;
  switch (cue.kind) {
    case "settle":
    case "reroll":
      // A reroll is heard on the frame the feeder is rolled.
      return [];
    case "play":
      return one("play");
    case "hunt": {
      const taken = Object.values(delta.food).reduce(
        (sum, n) => sum + Math.max(n, 0),
        0,
      );
      // The dice are heard leaving, and the food as they reach the tokens.
      return [...one("dice"), ...repeated("food", taken, 0.05, 0.3)];
    }
    case "den":
      return delta.yarn > 0
        ? [...repeated("yarn", delta.yarn, 0.06), ...ticks(delta.score, 0.1, 0)]
        : one("click");
    case "prowl":
      return delta.hand > 0 ? repeated("draw", delta.hand, 0.07) : one("click");
    case "resolve":
      if (delta.tucked > 0) {
        return [...one("tuck"), ...ticks(delta.score, 0.1, cue.chain)];
      }
      return delta.food.wild > 0 ? one("food") : one("click");
    case "power":
      if (cue.fizzled) return one("fizzle");
      return [
        ...one("power", 0, cue.chain),
        ...effectSound(cue),
        ...ticks(delta.score, 0.09, cue.chain),
      ];
    case "aura":
      return [...one("power", 0, cue.chain), ...one("food", 0.05)];
    case "feeder":
      return one("reroll");
    case "rival":
      return [
        ...one("rivalFlip"),
        ...(cue.rivalMove === "hunt" ? one("raid", 0.2) : []),
      ];
    case "goal":
      return cue.won === true
        ? [...one("goalWon"), ...ticks(delta.score, 0.3, 4)]
        : cue.won === false
          ? one("goalLost")
          : one("cache");
    case "over":
      return one(cue.won ? "win" : "loss");
  }
}
