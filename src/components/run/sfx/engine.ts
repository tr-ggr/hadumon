/**
 * Plays the recipes. One `AudioContext` for the page, made on the first
 * press or key (a browser will not start one sooner), behind a master gain
 * and a limiter so a long chain cannot clip. Everything here is a no-op on
 * the server, in a background tab, and while the sound is muted.
 *
 * The music (`../music/player.ts`) plays through the same context, into a
 * bus of its own under the master. Its notes are not voices: the cap and
 * `stopSound` leave them alone, so a skip never chops the tune.
 */

import {
  recipe,
  voiceSeconds,
  type Note,
  type SfxName,
  type Sound,
  type Voice,
} from "./recipes";
import { VOLUME_GAIN, volumeSetting } from "./settings";
import { catVoice } from "./voices";

/** Voices sounding at once. One past this, the oldest is cut short. */
export const VOICE_CAP = 14;
/** How loud the music's bus is under the master. */
export const MUSIC_GAIN = 0.8;

interface Live {
  bus: GainNode;
  sources: AudioScheduledSourceNode[];
  ends: number;
}

export interface Rig {
  ctx: AudioContext;
  master: GainNode;
  /** Where the music goes: under the master, apart from the effects. */
  music: GainNode;
  noise: AudioBuffer;
}

let rig: Rig | null = null;
let listening = false;
const live = new Set<Live>();
let requests = 0;

/**
 * How many sounds have been asked for, heard or not. Whoever wants to know
 * if a press already made a sound reads it before and after.
 */
export function soundRequests(): number {
  return requests;
}

function build(): Rig | null {
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  const ctx = new Ctor();
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -10;
  limiter.knee.value = 8;
  limiter.ratio.value = 12;
  limiter.attack.value = 0.002;
  limiter.release.value = 0.12;
  const master = ctx.createGain();
  master.gain.value = VOLUME_GAIN[volumeSetting.read()];
  master.connect(limiter).connect(ctx.destination);
  const music = ctx.createGain();
  music.gain.value = MUSIC_GAIN;
  music.connect(master);

  const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const samples = noise.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  return { ctx, master, music, noise };
}

/** The rig, once a gesture has started it and while it is running. */
export function soundRig(): Rig | null {
  return rig?.ctx.state === "running" ? rig : null;
}

/** Starts the context, or wakes it. Only works from inside a gesture. */
function unlock(): void {
  // A muted table never opens an audio session it has no use for.
  if (volumeSetting.read() === "muted") return;
  rig ??= build();
  if (rig && rig.ctx.state !== "running") void rig.ctx.resume();
}

/**
 * Begins listening for the gesture that lets sound start. The listeners stay
 * for the life of the page: iOS suspends the context again when the tab is
 * left, and the next touch has to wake it. They sit on `window` in the
 * capture phase, ahead of anything on the page that stops an event.
 */
export function armSound(): void {
  if (listening || typeof window === "undefined") return;
  listening = true;
  for (const type of ["pointerup", "touchend", "click", "keydown"] as const) {
    window.addEventListener(type, unlock, { capture: true, passive: true });
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopSound();
  });
  volumeSetting.subscribe(() => {
    // The press that turns sound on is itself the gesture that may start it.
    unlock();
    if (!rig) return;
    const gain = VOLUME_GAIN[volumeSetting.read()];
    rig.master.gain.setTargetAtTime(gain, rig.ctx.currentTime, 0.015);
    if (gain === 0) stopSound();
  });
}

function cut(voice: Live, ctx: AudioContext): void {
  const now = ctx.currentTime;
  voice.bus.gain.cancelScheduledValues(now);
  voice.bus.gain.setTargetAtTime(0, now, 0.008);
  for (const source of voice.sources) {
    try {
      source.stop(now + 0.05);
    } catch {
      // Already stopped.
    }
  }
  live.delete(voice);
}

/** Schedules one note into `bus`, `note.at` seconds after `start`. */
export function schedule(
  { ctx, noise }: Rig,
  bus: GainNode,
  note: Note,
  start: number,
): AudioScheduledSourceNode {
  const at = start + note.at;
  const end = at + note.attack + note.decay;
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0, at);
  envelope.gain.linearRampToValueAtTime(note.gain, at + note.attack);
  envelope.gain.exponentialRampToValueAtTime(0.0001, end);

  let source: AudioScheduledSourceNode;
  let head: AudioNode;
  if (note.wave === "noise") {
    const player = ctx.createBufferSource();
    player.buffer = noise;
    player.loop = true;
    source = player;
    head = player;
  } else {
    const osc = ctx.createOscillator();
    osc.type = note.wave;
    osc.frequency.setValueAtTime(note.from, at);
    if (note.to !== note.from) {
      osc.frequency.exponentialRampToValueAtTime(note.to, end);
    }
    source = osc;
    head = osc;
  }
  if (note.filter) {
    const filter = ctx.createBiquadFilter();
    filter.type = note.filter.type;
    filter.Q.value = note.filter.type === "bandpass" ? 1.4 : 0.7;
    filter.frequency.setValueAtTime(note.filter.freq, at);
    // Noise has no pitch of its own; its filter does the gliding.
    if (note.wave === "noise" && note.to !== note.from) {
      filter.frequency.exponentialRampToValueAtTime(note.to, end);
    }
    head.connect(filter);
    head = filter;
  }
  head.connect(envelope).connect(bus);
  source.start(at);
  source.stop(end + 0.02);
  return source;
}

/** Plays one voice now, or `delay` seconds from now. */
export function playVoice(voice: Voice, delay = 0): void {
  requests += 1;
  if (typeof document === "undefined" || document.hidden) return;
  if (rig?.ctx.state !== "running") return;
  if (volumeSetting.read() === "muted") return;
  const { ctx, master } = rig;
  const now = ctx.currentTime;
  for (const voice of live) if (voice.ends <= now) live.delete(voice);
  while (live.size >= VOICE_CAP) {
    const oldest = live.values().next().value;
    if (!oldest) break;
    cut(oldest, ctx);
  }

  const bus = ctx.createGain();
  bus.connect(master);
  const start = now + Math.max(0, delay) + 0.005;
  const playing = rig;
  const sources = voice.map((note) => schedule(playing, bus, note, start));
  const entry: Live = {
    bus,
    sources,
    ends: start + voiceSeconds(voice) + 0.05,
  };
  live.add(entry);
  // The note that ends last takes the voice's wiring down with it.
  let left = sources.length;
  for (const source of sources) {
    source.onended = () => {
      left -= 1;
      if (left > 0) return;
      live.delete(entry);
      bus.disconnect();
    };
  }
}

/** Plays one of the table's sounds now, or `delay` seconds from now. */
export function playSound(name: SfxName, step = 0, delay = 0): void {
  playVoice(recipe(name, step), delay);
}

/** Plays a cat's own voice: the sound of choosing it, or of turning it over. */
export function playCat(catId: string): void {
  playVoice(catVoice(catId));
}

export function playSounds(sounds: readonly Sound[]): void {
  for (const sound of sounds) playSound(sound.name, sound.step, sound.delay);
}

/** Cuts every voice, sounding or still to come. */
export function stopSound(): void {
  if (!rig) return;
  for (const voice of [...live]) cut(voice, rig.ctx);
}
