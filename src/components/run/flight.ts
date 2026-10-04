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

export function launchFrom(
  root: HTMLElement | null,
  source: string,
  target: string,
  hideTarget = true,
): Launch | null {
  const el = root?.querySelector<HTMLElement>(source);
  if (!el) return null;
  return {
    node: el.cloneNode(true) as HTMLElement,
    from: el.getBoundingClientRect(),
    target,
    hideTarget,
  };
}

/** Sends each copy to its landing place inside `root`. */
export function fly(root: HTMLElement | null, launches: readonly Launch[]) {
  if (!root) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  for (const { node, from, target, hideTarget } of launches) {
    const landing = root.querySelector<HTMLElement>(target);
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
