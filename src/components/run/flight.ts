/**
 * Pieces in flight. A piece that changes zone (a card from the hand to its
 * space, a die from the feeder to the essence tokens) is copied where it
 * stood before the action, and the copy travels to where the piece lands.
 * Web Animations only; nothing here touches React's tree.
 */

export const FLIGHT_MS = 300;

/** A copy of a piece and where it stood. */
export interface Launch {
  node: HTMLElement;
  from: DOMRect;
  /** Finds where the piece lands, once the table has re-rendered. */
  target: string;
  /** Keeps the landing place empty until the copy arrives. */
  hideTarget: boolean;
}

/**
 * The first match that is laid out. A zone the table renders twice and shows
 * once (the turn panel, with the food tokens in it) has a copy with no box.
 */
function shown(root: HTMLElement | null, selector: string): HTMLElement | null {
  for (const el of root?.querySelectorAll<HTMLElement>(selector) ?? []) {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return el;
  }
  return null;
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

/** Sends each copy to its landing place inside `root`. */
export function fly(root: HTMLElement | null, launches: readonly Launch[]) {
  if (!root) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  for (const { node, from, target, hideTarget } of launches) {
    const landing = shown(root, target);
    if (!landing) continue;
    const to = landing.getBoundingClientRect();
    const scale = Math.max(
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
    root.appendChild(node);

    const timing = { duration: FLIGHT_MS, easing: "steps(6, end)" };
    if (hideTarget) {
      landing.animate([{ opacity: 0 }, { opacity: 0 }], timing);
    }
    const flight = node.animate(
      [
        { transform: "translate(0, -4px) scale(1)" },
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
      ],
      { ...timing, fill: "forwards" },
    );
    const land = () => node.remove();
    flight.finished.then(land, land);
  }
}
