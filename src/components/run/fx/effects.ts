/**
 * The effects themselves: an intent from `plan.ts` played on the page with
 * the Web Animations API. Everything here moves `transform` and `opacity`
 * and nothing else, so no effect lays the table out again, and every
 * animation is followed by the registry so a skip can end it.
 */

import { anchored, fxLayer, placed, shakeable } from "./dom";
import type { Intent, Tone } from "./plan";
import { track } from "./registry";
import {
  ARRIVE,
  keyframes,
  POP,
  PUNCH,
  SHAKE,
  springKick,
  springTo,
} from "./spring";

const POP_CURVE = springKick(POP, 22);
const PUNCH_CURVE = springKick(PUNCH, 14);
const SHAKE_CURVE = springKick(SHAKE, 22);
const ARRIVE_CURVE = springTo(ARRIVE, 16);

/** The animation an element is in, by kind, so a second hit restarts it. */
const inMotion = new WeakMap<Element, Map<string, Animation>>();

/**
 * Plays `frames` on `el`. A piece hit again while it is still moving starts
 * over from rest instead of stacking a second animation on the first.
 */
function animate(
  el: Element,
  kind: string,
  frames: Keyframe[],
  options: KeyframeAnimationOptions,
  done?: () => void,
): void {
  const mine = inMotion.get(el) ?? new Map<string, Animation>();
  inMotion.set(el, mine);
  mine.get(kind)?.cancel();
  const animation = el.animate(frames, { fill: "backwards", ...options });
  mine.set(kind, animation);
  track(animation, () => {
    if (mine.get(kind) === animation) mine.delete(kind);
    done?.();
  });
}

function pop(el: HTMLElement, strength: number, delay: number): void {
  // Slots lean away from each other, so two in a row do not move as one.
  const lean = Number(el.dataset.slot?.slice(-1) ?? 0) % 2 === 0 ? -1 : 1;
  animate(
    el,
    "pop",
    keyframes(POP_CURVE, (v) => ({
      transform: `translateY(${-4 * strength * v}px) scale(${1 + 0.07 * strength * v}) rotate(${1.6 * lean * strength * v}deg)`,
    })),
    { duration: POP_CURVE.duration, delay },
  );
}

function dud(el: HTMLElement, delay: number): void {
  animate(
    el,
    "pop",
    keyframes(PUNCH_CURVE, (v) => ({ transform: `translateX(${3 * v}px)` })),
    { duration: PUNCH_CURVE.duration, delay },
  );
}

function punch(el: HTMLElement, delay: number): void {
  animate(
    el,
    "punch",
    keyframes(PUNCH_CURVE, (v) => ({
      transform: `scale(${1 + 0.16 * v})`,
    })),
    { duration: PUNCH_CURVE.duration, delay },
  );
}

/** A squash as a piece comes down on the table, then back to its shape. */
export function squash(el: HTMLElement, delay = 0): void {
  animate(
    el,
    "punch",
    keyframes(PUNCH_CURVE, (v) => ({
      transform: `scale(${1 + 0.06 * v}, ${1 - 0.09 * v})`,
      transformOrigin: "50% 100%",
    })),
    { duration: PUNCH_CURVE.duration + 40, delay },
  );
}

function shake(els: readonly HTMLElement[], strength: number): void {
  for (const [i, el] of els.entries()) {
    const sway = i % 2 === 0 ? 1 : -1;
    animate(
      el,
      "shake",
      keyframes(SHAKE_CURVE, (v) => ({
        transform: `translate(${3 * strength * sway * v}px, ${1.5 * strength * v}px)`,
      })),
      { duration: SHAKE_CURVE.duration },
    );
  }
}

/** A temporary node in the overlay, placed by its centre on the screen. */
function overlaid(
  layer: HTMLElement,
  className: string,
  x: number,
  y: number,
): HTMLElement {
  const node = document.createElement("span");
  node.className = className;
  node.setAttribute("aria-hidden", "true");
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  layer.appendChild(node);
  return node;
}

const FLOAT_MS = 720;
const FLOAT_RISE = 34;

function float(
  layer: HTMLElement,
  from: DOMRect,
  text: string,
  tone: Tone,
  delay: number,
): void {
  const node = overlaid(
    layer,
    `fx-float fx-${tone}`,
    from.left + from.width / 2,
    from.top + Math.min(from.height * 0.3, 18),
  );
  node.textContent = text;
  // It springs out of the piece, then drifts up and goes.
  const arrive = ARRIVE_CURVE.values;
  const last = arrive.length - 1;
  const frames: Keyframe[] = arrive.map((v, i) => {
    const p = i / last;
    return {
      offset: p * 0.45,
      opacity: Math.min(1, p * 4),
      transform: `translate(-50%, ${-50 - 40 * v}%) scale(${0.6 + 0.4 * v})`,
    };
  });
  frames.push(
    {
      offset: 0.7,
      opacity: 1,
      transform: `translate(-50%, calc(-90% - ${FLOAT_RISE * 0.6}px)) scale(1)`,
    },
    {
      offset: 1,
      opacity: 0,
      transform: `translate(-50%, calc(-90% - ${FLOAT_RISE}px)) scale(1)`,
    },
  );
  track(node.animate(frames, { duration: FLOAT_MS, delay, fill: "both" }), () =>
    node.remove(),
  );
}

/** A fraction that looks random and is the same every time. */
function scatter(i: number, salt: number): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function sparks(
  layer: HTMLElement,
  from: DOMRect,
  count: number,
  tone: Tone,
  delay: number,
): void {
  const cx = from.left + from.width / 2;
  const cy = from.top + from.height / 2;
  for (let i = 0; i < count; i++) {
    // Thrown out all round, a little more of them upward, then they fall.
    const angle = (i / count) * Math.PI * 2 + scatter(i, 1) * 0.9;
    const reach = 24 + scatter(i, 2) * 30 + Math.min(from.width, 80) * 0.3;
    const dx = Math.cos(angle) * reach;
    const dy = Math.sin(angle) * reach * 0.8 - 12;
    const fall = 22 + scatter(i, 3) * 18;
    const node = overlaid(
      layer,
      `fx-spark fx-${i % 3 === 2 ? "ink" : tone}`,
      cx,
      cy,
    );
    const at = (p: number): string => {
      const out = 1 - (1 - p) ** 2.4;
      return `translate(${dx * out}px, ${dy * out + fall * p * p}px)`;
    };
    track(
      node.animate(
        [0, 0.2, 0.4, 0.6, 0.8, 1].map((p) => ({
          offset: p,
          transform: at(p),
          opacity: p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4,
        })),
        {
          duration: 420 + Math.round(scatter(i, 4) * 180),
          delay: delay + Math.round(scatter(i, 5) * 40),
          fill: "both",
        },
      ),
      () => node.remove(),
    );
  }
}

/** Plays a frame's effects on the table under `root`. */
export function runFx(
  root: HTMLElement | null,
  intents: readonly Intent[],
): void {
  if (!root) return;
  const layer = fxLayer(root);
  for (const intent of intents) {
    if (intent.kind === "shake") {
      shake(shakeable(root), intent.strength);
      continue;
    }
    const el = anchored(root, intent.at);
    if (!el) continue;
    switch (intent.kind) {
      case "pop":
        pop(el, intent.strength, intent.delay);
        break;
      case "dud":
        dud(el, intent.delay);
        break;
      case "punch":
        punch(el, intent.delay);
        break;
      case "float":
        if (layer) {
          float(layer, placed(el), intent.text, intent.tone, intent.delay);
        }
        break;
      case "sparks":
        if (layer) {
          sparks(layer, placed(el), intent.count, intent.tone, intent.delay);
        }
        break;
    }
  }
}
