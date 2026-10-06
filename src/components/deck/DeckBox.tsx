"use client";

import { useShellMoving } from "~/components/AppShell";
import { PixelIcon } from "~/components/PixelIcon";

import type { UnboxPhase } from "./unbox";

/** The paw on the box, in cream: a pixel icon takes colours, not classes. */
const CREAM = "#fff8e7";
const WHITE = "#ffffff";

/**
 * The player's deck in its box, alone in the middle of the room as the Deck
 * page arrives: shut, then its lid off, then the cobalt back of a card up
 * out of its mouth, and then it makes way for the boards. A picture: nothing
 * on it is read out or takes a press. The stylesheet plays every move off
 * `data-phase`. The card lies wholly behind the box's front until it rises,
 * so nothing here is hidden and shown: the shell can put it all away.
 */
export function DeckBox({ phase }: { phase: UnboxPhase }) {
  // The box lands once the camera has stopped, as the page would have.
  const moving = useShellMoving();
  return (
    <div
      aria-hidden
      className="deck-box-stage"
      data-phase={phase}
      data-entered={!moving}
    >
      <div className="deck-box">
        <span className="deck-box-card piece piece-card border-ink bg-cobalt border-2 p-1.5">
          {/* The paw near its top, where it shows once the card is up. */}
          <span className="border-cobalt-dark flex h-full justify-center border-2 pt-3">
            <PixelIcon name="paw" size={32} ink={WHITE} />
          </span>
        </span>
        <span className="deck-box-body piece piece-card border-ink bg-ink border-2 p-1.5">
          <span className="border-cream/40 grid h-full place-items-center border-2">
            <PixelIcon name="paw" size={48} ink={CREAM} />
          </span>
        </span>
        <span className="deck-box-lid piece border-ink bg-ink border-2 p-1.5">
          <span className="border-cream/40 block h-full border-2" />
        </span>
      </div>
    </div>
  );
}
