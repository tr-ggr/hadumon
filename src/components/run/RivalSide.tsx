"use client";

import { PixelIcon } from "~/components/PixelIcon";
import type { DifficultyId } from "~/server/game/difficulty";
import { foodLeft, placedCats } from "~/server/game/match";
import { getRival } from "~/server/game/rival";
import type { MatchView } from "~/server/game/view";

import { plural, type RivalNews } from "./describe";
import { rivalLastText, useFlash } from "./MatchPanels";
import { CORAL, Nameplate, Pile, TableButton } from "./pieces";

/**
 * The far side of the table: who the rival is, the cards it holds face down,
 * what it did last, and the way in to its whole board. In the rail it
 * stacks. Over a narrow table it folds to one line, its name and what it did
 * last, so the mat starts near the top; the rest is in the table's sheet.
 * Its score is on the line both scores share, with the player's turn.
 */
export function RivalSide({
  match,
  difficulty,
  news,
  flipping,
  onOpenMat,
  sheet = false,
  className = "",
}: {
  match: MatchView;
  difficulty: DifficultyId;
  news: RivalNews | null;
  /** True on a step the rival makes a move. */
  flipping: boolean;
  /** Opens the rival's board. */
  onOpenMat: () => void;
  /** In the table's sheet, which is not on the table: no effect lands here. */
  sheet?: boolean;
  className?: string;
}) {
  const rival = getRival(match.rivalId);
  const { score, handCount, deckCount, last, board, turnsLeft } = match.rival;
  const cats = placedCats(board).length;
  const food = foodLeft(match.rival);
  // Without motion the card still colours for a moment, so the move is seen.
  const flash = useFlash(news?.id ?? null);
  // The sheet is not on the table: it is whole at any width.
  const folds = !sheet;

  return (
    <section
      aria-label={`${rival.name}, the rival`}
      className={`flex flex-col gap-3 ${folds ? "max-lg:gap-2 sm:max-lg:flex-row sm:max-lg:items-stretch" : ""} ${className}`}
    >
      <Nameplate
        rivalId={match.rivalId}
        difficulty={difficulty}
        folds={folds}
        // Where the dice the rival takes off the feeder fly to.
        plate={folds}
        className={folds ? "sm:max-lg:shrink-0" : ""}
      />

      <div
        className={`items-center gap-2.5 lg:pt-1 ${folds ? "hidden lg:flex" : "flex"}`}
      >
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
        className={`piece piece-card border-ink text-ink flex min-w-0 flex-col justify-center gap-1.5 border-2 px-2.5 py-1.5 ${folds ? "max-lg:flex-1 max-lg:flex-row max-lg:items-center max-lg:justify-between max-lg:gap-2.5" : ""} ${flash ? "bg-coral" : last ? "bg-cream" : "bg-cloth"} ${flipping ? "anim-flip" : ""}`}
      >
        <p
          className="min-w-0 text-sm leading-snug font-black"
          aria-live="polite"
        >
          {rivalLastText(match, news)}
        </p>
        <TableButton
          variant="secondary"
          onClick={onOpenMat}
          className={`self-start bg-white! ${folds ? "max-lg:shrink-0 max-lg:self-center" : ""}`}
        >
          See its board
        </TableButton>
      </div>
    </section>
  );
}
