/**
 * Plays the tracks. One tune at a time, a bar at a time: a timer looks a
 * little way ahead on the audio clock and schedules the next bar just before
 * its bar line, so the tune keeps time whatever the page is doing. A change
 * of tune crossfades at once. Nothing plays before the first press or key,
 * in a background tab, with the music off or with the table muted.
 */

import { schedule, soundRig, type Rig } from "../sfx/engine";
import { volumeSetting } from "../sfx/settings";
import { musicSetting } from "./settings";
import {
  TRACKS,
  barSeconds,
  notesFor,
  type Track,
  type TrackId,
} from "./tracks";

/** How often the timer looks, in milliseconds. */
const TICK_MS = 100;
/** A bar is scheduled once the clock is this close to its bar line, in seconds. */
const LOOKAHEAD = 0.2;
/** How long one tune takes to give way to the next, in seconds. */
const CROSSFADE = 0.4;

/** One tune playing: its own bus, the bar due next, and when that bar starts. */
interface Deck {
  id: TrackId;
  track: Track;
  bus: GainNode;
  bar: number;
  next: number;
  sources: Set<AudioScheduledSourceNode>;
}

let wanted: TrackId | null = null;
let deck: Deck | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let wired = false;
/** Where a tune was when the tab was left, to pick it up again from there. */
let left: { id: TrackId; bar: number } | null = null;

function fade(old: Deck, { ctx }: Rig): void {
  const now = ctx.currentTime;
  old.bus.gain.cancelScheduledValues(now);
  old.bus.gain.setValueAtTime(old.bus.gain.value, now);
  old.bus.gain.linearRampToValueAtTime(0, now + CROSSFADE);
  setTimeout(
    () => {
      for (const source of old.sources) {
        try {
          source.stop();
        } catch {
          // Already stopped.
        }
      }
      old.bus.disconnect();
    },
    CROSSFADE * 1000 + 50,
  );
}

function start(id: TrackId, rig: Rig, bar: number): Deck {
  const { ctx } = rig;
  const now = ctx.currentTime;
  const bus = ctx.createGain();
  bus.gain.setValueAtTime(0, now);
  bus.gain.linearRampToValueAtTime(1, now + CROSSFADE);
  bus.connect(rig.music);
  return {
    id,
    track: TRACKS[id],
    bus,
    bar,
    next: now + 0.05,
    sources: new Set(),
  };
}

/** Brings what is sounding into line with what is wanted, and keeps it fed. */
function sync(): void {
  const rig = soundRig();
  if (!rig) {
    // The context stopped under the tune (a phone leaving the tab). What was
    // scheduled must not be heard when it wakes, a bar late.
    if (deck) {
      left = { id: deck.id, bar: deck.bar };
      deck.bus.disconnect();
      deck = null;
    }
    return;
  }
  const playing =
    wanted !== null &&
    !document.hidden &&
    musicSetting.read() === "on" &&
    volumeSetting.read() !== "muted";
  if (!playing || wanted === null) {
    if (deck) {
      if (document.hidden) left = { id: deck.id, bar: deck.bar };
      fade(deck, rig);
      deck = null;
    }
    return;
  }
  if (deck?.id !== wanted) {
    if (deck) fade(deck, rig);
    deck = start(wanted, rig, left?.id === wanted ? left.bar : 0);
  }
  left = null;

  const { ctx } = rig;
  const length = barSeconds(deck.track);
  // A timer that slept through a bar line does not play the bar it missed.
  if (deck.next < ctx.currentTime) deck.next = ctx.currentTime + 0.05;
  while (deck.next < ctx.currentTime + LOOKAHEAD) {
    const { sources } = deck;
    for (const note of notesFor(deck.track, deck.bar)) {
      const source = schedule(rig, deck.bus, note, deck.next);
      sources.add(source);
      source.onended = () => sources.delete(source);
    }
    deck.bar += 1;
    deck.next += length;
  }
}

/**
 * Sets the tune, or `null` for none. Asking for the one already playing
 * changes nothing; asking before sound can start is remembered, and the tune
 * begins on the first press or key.
 */
export function playMusic(id: TrackId | null): void {
  if (typeof window === "undefined") return;
  wanted = id;
  if (!wired) {
    wired = true;
    document.addEventListener("visibilitychange", sync);
    musicSetting.subscribe(sync);
    volumeSetting.subscribe(sync);
  }
  if (id === null) {
    if (timer !== null) clearInterval(timer);
    timer = null;
    left = null;
  } else {
    timer ??= setInterval(sync, TICK_MS);
  }
  sync();
}
