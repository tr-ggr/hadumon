"use client";

import { PixelIcon } from "~/components/PixelIcon";
import { RIVAL_ACTIONS, type RivalAction } from "~/server/game/cats";
import { getRival } from "~/server/game/rival";
import type { MatchView } from "~/server/game/view";

import { plural, type RivalNews } from "./describe";
import { rivalLastText, useFlash } from "./MatchPanels";
import { CORAL, Nameplate, Pile } from "./pieces";

const ACTION_NAMES: Record<RivalAction, string> = {
  bank: "Bank",
  stash: "Stash",
  raid: "Raid",
  burn: "Burn",
  push: "Push",
};

/** The cards still in the rival's deck, worked out from what it has flipped. */
function cardsLeft(match: MatchView): string {
  const left = new Map<RivalAction, number>();
  for (const card of getRival(match.rivalId).deck) {
    left.set(card, (left.get(card) ?? 0) + 1);
  }
  for (const card of match.rival.seen) {
    left.set(card, (left.get(card) ?? 0) - 1);
  }
  return RIVAL_ACTIONS.flatMap((card) => {
    const n = left.get(card) ?? 0;
    return n > 0 ? [`${n} ${ACTION_NAMES[card]}`] : [];
  }).join(", ");
}

/**
 * The far side of the table: who the rival is, the deck it flips from, the
 * card it flipped last, and what it has put away. In the rail it stacks, and
 * leaves its score to the line both scores share.
 */
export function RivalSide({
  match,
  news,
  flipping,
  className = "",
}: {
  match: MatchView;
  news: RivalNews | null;
  /** True on the step the rival's card turns over. */
  flipping: boolean;
  className?: string;
}) {
  const rival = getRival(match.rivalId);
  const { banked, bankValue, yarn, goalPoints, score, deckCount, last } =
    match.rival;
  // Without motion the card still colours for a moment, so the flip is seen.
  const flash = useFlash(news?.id ?? null);

  return (
    <section
      aria-label={`${rival.name}, the rival`}
      className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-stretch gap-x-3 gap-y-3 lg:flex lg:flex-col ${className}`}
    >
      <Nameplate rivalId={match.rivalId} className="col-span-2" />

      <p
        className="piece border-ink bg-coral text-ink col-start-3 row-start-1 flex min-w-16 flex-col items-center justify-center border-2 px-2 py-1 lg:hidden"
        aria-label={`Rival score ${score}: ${plural(banked, "banked cat")} at ${bankValue} each, ${yarn} yarn, ${goalPoints} from goals`}
      >
        <span aria-hidden className="text-[11px] leading-tight font-bold">
          Rival
        </span>
        <span aria-hidden className="text-print text-3xl tabular-nums">
          {score}
        </span>
      </p>

      <div className="flex items-center gap-2.5 lg:pt-1">
        <Pile count={deckCount} owner="rival" label="Rival deck" />
        <Pile count={banked} owner="rival" label="Cats the rival has banked" />
        <p className="text-ink flex flex-col gap-1 text-xs leading-none font-bold tabular-nums">
          <span>
            Bank {banked} × {bankValue}
          </span>
          <span className="flex items-center gap-1">
            <PixelIcon name="yarn" size={16} fill={CORAL} />
            <span aria-hidden>{yarn}</span>
            <span className="sr-only">Rival yarn {yarn}</span>
            <PixelIcon name="goal" size={16} fill={CORAL} className="ml-1" />
            <span aria-hidden>{goalPoints}</span>
            <span className="sr-only">Rival goal points {goalPoints}</span>
          </span>
        </p>
      </div>

      <div
        className={`piece piece-card border-ink text-ink col-span-2 flex min-w-0 flex-col justify-center border-2 px-2.5 py-1.5 ${flash ? "bg-coral" : last ? "bg-cream" : "bg-cloth"} ${flipping ? "anim-flip" : ""}`}
      >
        <p className="text-sm leading-snug font-black" aria-live="polite">
          {rivalLastText(match, news)}
        </p>
        <p className="text-ink-soft text-[11px] leading-snug font-semibold">
          {deckCount > 0
            ? `Still in the deck: ${cardsLeft(match)}.`
            : "The deck is empty; it is reshuffled before the next card."}
        </p>
      </div>
    </section>
  );
}
