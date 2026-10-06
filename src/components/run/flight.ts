/**
 * Pieces in flight. A piece that changes zone (a card from the hand to its
 * space, a die from the feeder to the essence tokens) is copied where it
 * stood before the action, and the copy travels to where the piece lands.
 * It leaves quickly, rides a slight arc, slows in, and the piece it lands as
 * gives under it. What the rival takes off the shared feeder flies too, in
 * its coral, to its side of the table. Web Animations only; nothing here
 * touches React's tree.
 */

import { fxLayer, prefersCalm, shown } from "./fx/dom";
import { squash } from "./fx/effects";
import { track } from "./fx/registry";

export const FLIGHT_MS = 300;

/** A copy of a piece and where it stood. */
export interface Launch {
  node: HTMLElement;
  from: DOMRect;
  /** Finds where the piece lands, once the table has re-rendered. */
  target: string;
  /** Keeps the landing place empty until the copy arrives. */
  hideTarget: boolean;
  /** The piece is the rival's now: it flies in coral and shrinks away. */
  rival?: boolean;
}

/** How small a piece the rival takes has become by the time it gets there. */
const RIVAL_SCALE = 0.6;

/**
 * Where the rival is on the table: its nameplate, or its score on a table
 * that keeps the plate in the sheet.
 */
export const RIVAL_PLACE = '[data-rival-plate], [data-score="rival"]';

/** A die as it stood in the feeder, kept in case the rival takes it. */
export interface DieSeen {
  face: string;
  node: HTMLElement;
  from: DOMRect;
}

/** Copies every die in the feeder where it stands. */
export function seeDice(root: HTMLElement | null): DieSeen[] {
  const seen: DieSeen[] = [];
  for (const el of root?.querySelectorAll<HTMLElement>("[data-die]") ?? []) {
    const from = el.getBoundingClientRect();
    if (from.width <= 0 || from.height <= 0) continue;
    seen.push({
      face: el.dataset.face ?? "",
      node: el.cloneNode(true) as HTMLElement,
      from,
    });
  }
  return seen;
}

/**
 * Which of the dice last seen in the feeder are gone from it. The engine
 * takes the first die of a face, so of two alike it is the later that stays.
 */
export function diceTaken<T extends { face: string }>(
  seen: readonly T[],
  feeder: readonly string[],
): T[] {
  const left = [...feeder];
  const taken: T[] = [];
  for (const die of [...seen].reverse()) {
    const at = left.indexOf(die.face);
    if (at >= 0) left.splice(at, 1);
    else taken.unshift(die);
  }
  return taken;
}

/** The dice the rival has just taken, each sent to its side of the table. */
export function rivalTakes(
  seen: readonly DieSeen[],
  feeder: readonly string[],
): Launch[] {
  return diceTaken(seen, feeder).map(({ node, from }) => ({
    node,
    from,
    target: RIVAL_PLACE,
    hideTarget: false,
    rival: true,
  }));
}

export function launchFrom(
  root: HTMLElement | null,
  source: string,
  target: string,
  hideTarget = true,
): Launch | null {
  const el = shown(root, source);
  if (!el) return null;
  // A card leaning in the fan has a box wider than the card. The copy takes
  // the card's own size about the same centre, so it is not stretched.
  const box = el.getBoundingClientRect();
  const width = el.offsetWidth;
  const height = el.offsetHeight;
  return {
    node: el.cloneNode(true) as HTMLElement,
    from: new DOMRect(
      box.left + (box.width - width) / 2,
      box.top + (box.height - height) / 2,
      width,
      height,
    ),
    target,
    hideTarget,
  };
}

/** How many straight pieces the arc is drawn in. */
const ARC_STEPS = 10;

/**
 * The path of a flight: out fast and slowing in, lifted off the straight
 * line in the middle the further it has to go.
 */
export function flightPath(
  dx: number,
  dy: number,
  scale: number,
): { offset: number; transform: string }[] {
  const lift = Math.min(36, Math.hypot(dx, dy) * 0.14);
  return Array.from({ length: ARC_STEPS + 1 }, (_, i) => {
    const offset = i / ARC_STEPS;
    const p = 1 - (1 - offset) ** 3;
    const arc = Math.sin(Math.PI * p) * lift;
    return {
      offset,
      transform: `translate(${dx * p}px, ${dy * p - arc}px) scale(${1 + (scale - 1) * p})`,
    };
  });
}

/** Sends each copy to its landing place inside `root`. */
export function fly(root: HTMLElement | null, launches: readonly Launch[]) {
  if (!root) return;
  if (prefersCalm()) return;
  const layer = fxLayer(root) ?? root;
  for (const { node, from, target, hideTarget, rival } of launches) {
    const landing = shown(root, target);
    if (!landing) continue;
    const to = landing.getBoundingClientRect();
    const scale = rival
      ? RIVAL_SCALE
      : Math.max(
          0.35,
          Math.min(1.1, to.width / from.width, to.height / from.height),
        );
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);

    node.setAttribute("aria-hidden", "true");
    node.removeAttribute("data-hand");
    node.removeAttribute("data-die");
    node.removeAttribute("data-tray");
    node.removeAttribute("data-pile");
    if (rival) node.classList.add("is-rivals");
    Object.assign(node.style, {
      position: "fixed",
      left: `${from.left}px`,
      top: `${from.top}px`,
      width: `${from.width}px`,
      height: `${from.height}px`,
      margin: "0",
      zIndex: "60",
      pointerEvents: "none",
    });
    layer.appendChild(node);

    if (hideTarget) {
      track(
        landing.animate([{ opacity: 0 }, { opacity: 0 }], {
          duration: FLIGHT_MS,
        }),
      );
      // The piece gives as the copy comes down on it.
      squash(landing, FLIGHT_MS);
    }
    // The rival's plate gives as what it took arrives.
    if (rival) squash(landing, FLIGHT_MS);
    track(
      node.animate(flightPath(dx, dy, scale), {
        duration: FLIGHT_MS,
        fill: "forwards",
      }),
      () => node.remove(),
    );
  }
}
