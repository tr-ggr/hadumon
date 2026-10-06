"use client";

import { useLayoutEffect, useRef } from "react";

import { CatCard } from "~/components/cats/CatCard";

/** A cat on the mat being looked at, and where its tile stands. */
export interface Peeked {
  catId: string;
  /** Which space, so the card lands again when the pointer moves on. */
  slot: string;
  box: DOMRect;
}

/** Room kept between the card and its tile, and between it and the window. */
const GAP = 8;

/**
 * The card of a cat on the mat, shown by the cat's own tile for as long as a
 * mouse is over it or the keyboard is on it. It stands over the lane
 * above, or under the tile where there is no room above, so the lane being
 * read stays in view; it takes no press, and nothing waits on it. The tile's
 * tap still opens the whole card.
 */
export function SlotPeek({ peek }: { peek: Peeked | null }) {
  const node = useRef<HTMLDivElement>(null);

  // The card is laid out before it is placed: where it goes depends on how
  // tall its rules made it.
  useLayoutEffect(() => {
    const el = node.current;
    if (!el || !peek) return;
    const { box } = peek;
    const width = el.offsetWidth;
    const height = el.offsetHeight;
    const above = box.top - GAP - height;
    const top =
      above >= GAP
        ? above
        : Math.min(box.bottom + GAP, window.innerHeight - height - GAP);
    const left = Math.min(
      Math.max(GAP, box.left + box.width / 2 - width / 2),
      window.innerWidth - width - GAP,
    );
    el.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
    el.style.visibility = "visible";
  }, [peek]);

  if (!peek) return null;
  return (
    <div
      ref={node}
      aria-hidden
      className="slot-peek"
      style={{ visibility: "hidden" }}
    >
      <CatCard
        key={peek.slot}
        catId={peek.catId}
        variant="compact"
        className="anim-land"
      />
    </div>
  );
}
