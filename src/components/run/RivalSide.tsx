"use client";

import { PixelIcon } from "~/components/PixelIcon";
import type { DifficultyId } from "~/server/game/difficulty";
import { foodLeft, placedCats } from "~/server/game/match";
import { getRival } from "~/server/game/rival";
import type { MatchView } from "~/server/game/view";

import { plural, type RivalNews } from "./describe";
import { RollingNumber } from "./fx/RollingNumber";
import { rivalLastText, useFlash } from "./MatchPanels";
import { CORAL, Nameplate, Pile, TableButton } from "./pieces";

/**
 * The far side of the table: who the rival is, the cards it holds face down,
 * what it did last, and the way in to its whole board. In the rail it
 * stacks, and leaves its score to the line both scores share.
 */
export function RivalSide({
  match,
  difficulty,
  news,
  flipping,
  onOpenMat,
  className = "",
}: {
  match: MatchView;
  difficulty: DifficultyId;
  news: RivalNews | null;
  /** True on a step the rival makes a move. */
  flipping: boolean;
  /** Opens the rival's board. */
  onOpenMat: () => void;
  className?: string;
}) {
  const rival = getRival(match.rivalId);
  const { score, handCount, deckCount, last, board, turnsLeft } = match.rival;
  const cats = placedCats(board).length;
  const food = foodLeft(match.rival);
  // Without motion the card still colours for a moment, so the move is seen.
  const flash = useFlash(news?.id ?? null);

  return (
    <section
      aria-label={`${rival.name}, the rival`}
      className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-stretch gap-x-3 gap-y-3 lg:flex lg:flex-col ${className}`}
    >
      <Nameplate
        rivalId={match.rivalId}
        difficulty={difficulty}
        className="col-span-2"
      />

      <p
        data-score="rival"
        className="piece border-ink bg-coral text-ink col-start-3 row-start-1 flex min-w-16 flex-col items-center justify-center border-2 px-2 py-1 lg:hidden"
        aria-label={`Rival score ${score.total}: ${score.cats} from cats, ${score.yarn} yarn, ${score.goals} from goals`}
      >
        <span aria-hidden className="text-[11px] leading-tight font-bold">
          Rival
        </span>
        <span aria-hidden className="text-print text-3xl tabular-nums">
          <RollingNumber value={score.total} />
        </span>
      </p>

      <div className="flex items-center gap-2.5 lg:pt-1">
        <Pile count={handCount} owner="rival" label="Rival hand" />
        <Pile count={deckCount} owner="rival" label="Rival deck" />
        <p className="text-ink flex flex-col gap-1 text-xs leading-none font-bold tabular-nums">
          <span>
            {plural(cats, "cat")} out, {plural(turnsLeft, "turn")} left
          </span>
          <span className="flex items-center gap-1">
            <PixelIcon name="yarn" size={16} fill={CORAL} />
            <span aria-hidden>{score.yarn}</span>
            <span className="sr-only">Rival yarn {score.yarn}</span>
            <PixelIcon name="goal" size={16} fill={CORAL} className="ml-1" />
            <span aria-hidden>{score.goals}</span>
            <span className="sr-only">Rival goal points {score.goals}</span>
            <span className="ml-1">{food} food</span>
          </span>
        </p>
      </div>

      <div
        className={`piece piece-card border-ink text-ink col-span-2 flex min-w-0 flex-col justify-center gap-1.5 border-2 px-2.5 py-1.5 ${flash ? "bg-coral" : last ? "bg-cream" : "bg-cloth"} ${flipping ? "anim-flip" : ""}`}
      >
        <p className="text-sm leading-snug font-black" aria-live="polite">
          {rivalLastText(match, news)}
        </p>
        <TableButton
          variant="secondary"
          onClick={onOpenMat}
          className="self-start bg-white!"
        >
          See its board
        </TableButton>
      </div>
    </section>
  );
}
