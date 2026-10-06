/**
 * What moves when a pack is opened and is not a change of phase: the pack
 * coming forward, the embers off its wrapper, its cards flying out, and what
 * a card throws as it turns. Played with the Web Animations API on the
 * springs the match uses, moving `transform`, its own parts (`scale`) and
 * `opacity` and nothing else, and followed by the match's registry, so a
 * skip ends all of it at once.
 *
 * Nothing here is called with reduced motion: a calm reveal has no wrapper,
 * and its cards are up from the start.
 */

import {
  fxLayer,
  isCompact,
  placed,
  prefersCalm,
} from "~/components/run/fx/dom";
import { track } from "~/components/run/fx/registry";
import { ARRIVE, keyframes, POP, springTo } from "~/components/run/fx/spring";
import { RARITY_PALETTES } from "~/components/sprites/palettes";
import type { Rarity } from "~/server/game/cats";

import { DEAL_MS } from "./reveal";

const ARRIVE_CURVE = springTo(ARRIVE, 20);
const POP_CURVE = springTo(POP, 14);

/** How far forward the pack stands while its top is cut. */
export const RAISED = 1.25;
/** How long the pack takes to settle back before it burns. */
const SETTLE_MS = 260;

/** How far a card comes forward as it turns, if it is epic or better. */
const POP_SCALE = 0.18;
/** How long such a card is forward, start to settled. */
const POP_MS: Partial<Record<Rarity, number>> = { epic: 560, legendary: 820 };
/** What a card throws as it turns, by rarity. No card throws more. */
const SPARKS: Partial<Record<Rarity, number>> = {
  rare: 4,
  epic: 8,
  legendary: 12,
};
const MAX_SPARKS = 12;
/** When a turning card is edge-on, which is when it throws them. */
const EDGE_ON_MS = 190;

/** The layer the shop draws its sparks and embers in. */
function layerOf(el: Element): HTMLElement | null {
  return fxLayer(el.closest<HTMLElement>("[data-shop]"));
}

/** A fraction that looks random and is the same every time. */
function scatter(i: number, salt: number): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** A phone throws half as many of anything. */
function few(count: number): number {
  const most = Math.min(count, MAX_SPARKS);
  return isCompact() ? Math.ceil(most / 2) : most;
}

/**
 * A pixel in the overlay, placed by its centre on the screen. It is not seen
 * until its animation starts, so one that waits its turn waits unseen.
 */
function pixel(layer: HTMLElement, x: number, y: number, color: string) {
  const node = document.createElement("span");
  node.className = "fx-spark";
  node.setAttribute("aria-hidden", "true");
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  node.style.background = color;
  node.style.opacity = "0";
  layer.appendChild(node);
  return node;
}

/**
 * Where `el` stands once it is back at its own size. It is scaled about the
 * middle of its foot, which is the one point of it that does not move.
 */
function atRest(el: HTMLElement): DOMRect {
  const now = placed(el);
  return new DOMRect(
    now.left + (now.width - el.offsetWidth) / 2,
    now.bottom - el.offsetHeight,
    el.offsetWidth,
    el.offsetHeight,
  );
}

/** The animation an element is in, by kind, so a second one replaces it. */
const inMotion = new WeakMap<Element, Map<string, Animation>>();

function animate(
  el: HTMLElement,
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

/**
 * The pack comes forward to be cut, on a spring, over `ms`. Where it comes
 * to rest is the stylesheet's to say; this is only how it gets there.
 */
export function raise(pack: HTMLElement, ms: number): void {
  animate(
    pack,
    "stand",
    keyframes(ARRIVE_CURVE, (v) => ({ scale: `${1 + (RAISED - 1) * v}` })),
    { duration: ms },
  );
}

/** The pack goes back to its own size, to burn. */
export function settleBack(pack: HTMLElement): void {
  animate(
    pack,
    "stand",
    keyframes(ARRIVE_CURVE, (v) => ({ scale: `${RAISED - (RAISED - 1) * v}` })),
    { duration: SETTLE_MS },
  );
}

/**
 * Embers off a wrapper as it burns down over `ms`: each leaves the burnt
 * edge where the edge is when it leaves, rises, and goes out.
 */
export function embers(
  pack: HTMLElement,
  tones: readonly [string, string],
  ms: number,
): void {
  const layer = layerOf(pack);
  if (!layer) return;
  const from = atRest(pack);
  const count = few(MAX_SPARKS);
  for (let i = 0; i < count; i++) {
    /** How far down the wrapper the edge is when this one leaves it. */
    const down = (i + 0.5) / count;
    const node = pixel(
      layer,
      from.left + from.width * (0.08 + 0.84 * scatter(i, 1)),
      from.top + from.height * (0.08 + 0.84 * down),
      tones[i % 2] ?? tones[0],
    );
    const rise = 40 + scatter(i, 2) * 44;
    const drift = (scatter(i, 3) - 0.5) * 36;
    track(
      node.animate(
        [0, 0.25, 0.5, 0.75, 1].map((p) => ({
          offset: p,
          transform: `translate(${drift * p}px, ${-rise * (1 - (1 - p) ** 2)}px)`,
          opacity: p < 0.5 ? 1 : 2 - 2 * p,
        })),
        {
          duration: 420 + Math.round(scatter(i, 4) * 220),
          delay: Math.round(ms * down * 0.9),
          fill: "forwards",
        },
      ),
      () => node.remove(),
    );
  }
}

/**
 * The cards fly out of the pack to where they lie: from `from`, a point in
 * the lengths of their own table (`placed`), each after the one before,
 * turning over on its way.
 */
export function flyOut(
  cards: readonly (HTMLElement | null)[],
  from: { x: number; y: number },
  pace: "full" | "short",
): void {
  const { gap, fly } = DEAL_MS[pace];
  for (const [i, card] of cards.entries()) {
    if (!card) continue;
    const to = placed(card);
    const dx = from.x - (to.left + to.width / 2);
    const dy = from.y - (to.top + to.height / 2);
    const spin = (i % 2 === 0 ? -1 : 1) * (150 + 30 * scatter(i, 6));
    animate(
      card,
      "fly",
      keyframes(ARRIVE_CURVE, (v) => ({
        transform: `translate(${dx * (1 - v)}px, ${dy * (1 - v)}px) rotate(${spin * (1 - v)}deg) scale(${0.72 + 0.28 * v})`,
      })),
      { duration: fly, delay: i * gap },
    );
  }
}

/** What a card throws when it turns: more of them the rarer it is. */
function sparks(card: HTMLElement, rarity: Rarity): void {
  const layer = layerOf(card);
  const wanted = SPARKS[rarity];
  if (!layer || !wanted) return;
  const from = placed(card);
  const cx = from.left + from.width / 2;
  const cy = from.top + from.height * 0.4;
  const { outline, glow } = RARITY_PALETTES[rarity];
  const count = few(wanted);
  for (let i = 0; i < count; i++) {
    // Thrown out all round, a little more of them upward, then they fall.
    const angle = (i / count) * Math.PI * 2 + scatter(i, 1) * 0.9;
    const reach = 46 + scatter(i, 2) * 40;
    const dx = Math.cos(angle) * reach * 1.15;
    const dy = Math.sin(angle) * reach - 18;
    const fall = 26 + scatter(i, 3) * 20;
    const node = pixel(layer, cx, cy, i % 2 === 0 ? outline : glow);
    track(
      node.animate(
        [0, 0.2, 0.4, 0.6, 0.8, 1].map((p) => {
          const out = 1 - (1 - p) ** 2.4;
          return {
            offset: p,
            transform: `translate(${dx * out}px, ${dy * out + fall * p * p}px)`,
            opacity: p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4,
          };
        }),
        {
          duration: 460 + Math.round(scatter(i, 4) * 200),
          delay: EDGE_ON_MS + Math.round(scatter(i, 5) * 40),
          fill: "forwards",
        },
      ),
      () => node.remove(),
    );
  }
}

/**
 * An epic or a legendary comes forward as it turns, is held there, and
 * settles: out on a spring, back on a slower one.
 */
function pop(card: HTMLElement, rarity: Rarity): void {
  const ms = POP_MS[rarity];
  if (!ms) return;
  const out = POP_CURVE.values;
  const back = ARRIVE_CURVE.values;
  // A third of the time to come forward, and a quarter to go back.
  const frames: Keyframe[] = [
    ...out.map((v, i) => ({
      offset: (i / (out.length - 1)) * 0.34,
      scale: `${1 + POP_SCALE * v}`,
    })),
    ...back.map((v, i) => ({
      offset: 0.74 + (i / (back.length - 1)) * 0.26,
      scale: `${1 + POP_SCALE * (1 - v)}`,
    })),
  ];
  // Over its neighbours while it is forward.
  card.style.zIndex = "5";
  animate(card, "pop", frames, { duration: ms, delay: EDGE_ON_MS }, () => {
    card.style.zIndex = "";
  });
}

/** A card has been turned over: what it throws, and whether it comes forward. */
export function turnedOver(card: HTMLElement, rarity: Rarity): void {
  if (prefersCalm()) return;
  sparks(card, rarity);
  pop(card, rarity);
}
