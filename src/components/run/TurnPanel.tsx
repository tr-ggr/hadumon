"use client";

import type { CSSProperties, ReactNode } from "react";

import { getCat, ROW_LABELS, type Row } from "~/server/game/cats";
import { ESSENCES, type Essence } from "~/server/game/match";
import type { MatchView } from "~/server/game/view";

import { essenceLabel, listWords, plural, yarnCostLabel } from "./describe";
import { RollingNumber } from "./fx/RollingNumber";
import { MusicButton } from "./music/MusicButton";
import { EssenceToken, KeyHint, TableButton } from "./pieces";
import { SoundButton } from "./sfx/SoundButton";
import {
  boardYarnRoom,
  canSwapMore,
  essenceSpent,
  handSwap,
  shortWords,
  swapOwed,
  swapTaken,
  whyUnplayable,
  type Mode,
} from "./turn";

export interface TurnControls {
  mode: Mode;
  busy: boolean;
  /** Dice a Hunt takes now. */
  take: number;
  playInto: (row: Row) => void;
  /** Adds one essence to the swap a short play is choosing, or takes it back. */
  swapEssence: (kind: Essence) => void;
  undoSwap: () => void;
  cancel: () => void;
  confirm: () => void;
  fillDen: () => void;
  undoDen: () => void;
  resolve: (choice: number | null) => void;
}

export interface TurnPanelProps {
  match: MatchView;
  turn: TurnControls;
  /** What the table is showing while a turn plays back, else `null`. */
  playing: string | null;
  /** True on the step the rival's card turns over. */
  rivalStep: boolean;
  /**
   * How hot the player's score runs, 0 to 1: nothing at rest, deeper with
   * every power of a chain.
   */
  heat: number;
  onSkip: () => void;
  /**
   * Where the panel shows. The match renders it twice, in the rail beside
   * the table and in the dock under it, and shows one of the two.
   */
  className?: string;
}

/**
 * The player's turn: what is being decided and its confirm, the food held,
 * and the score. In the rail the score leads, then the food, and the prompt
 * and its confirm close it, level with the hand. In the dock under a narrow
 * table the prompt leads, since the hand is right below.
 */
export function TurnPanel({
  match,
  turn,
  playing,
  rivalStep,
  heat,
  onSkip,
  className = "",
}: TurnPanelProps) {
  const { mode, busy } = turn;
  // A play that is short turns the essence held into the thing to choose from.
  const swapping =
    mode.kind === "play" && playing === null && swapOwed(match, mode.hand) > 0
      ? mode
      : null;

  return (
    <section
      aria-label="Your turn"
      className={`min-w-0 flex-col gap-2 px-3 pt-2.5 pb-3 ${className}`}
    >
      {/* A phone's match keeps its sound and music buttons here: the corner
          has no room for them beside the gauntlet track. */}
      <div className="flex items-start gap-2 lg:contents">
        <div className="min-w-0 flex-1 lg:contents">
          {playing === null ? (
            <Prompt match={match} turn={turn} />
          ) : (
            <Row2 text={playing || "Settling the table."} rival={rivalStep}>
              <TableButton variant="secondary" onClick={onSkip}>
                Skip
              </TableButton>
            </Row2>
          )}
        </div>
        <div className="flex shrink-0 gap-1.5 sm:hidden">
          <SoundButton />
          <MusicButton />
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 lg:contents">
        <div className="flex min-w-0 flex-col gap-1">
          <ul
            aria-label="Your food"
            className="flex flex-wrap items-center gap-x-1 gap-y-2"
          >
            {ESSENCES.map((kind) => {
              const given = swapping ? swapTaken(swapping.swap, kind) : 0;
              const open =
                swapping !== null &&
                (given > 0 ||
                  canSwapMore(match, swapping.hand, swapping.swap, kind));
              return (
                <EssenceToken
                  key={kind}
                  kind={kind}
                  count={match.essence[kind]}
                  given={given}
                  onPick={open ? () => turn.swapEssence(kind) : undefined}
                  disabled={busy}
                />
              );
            })}
          </ul>
          <p className="text-ink-soft px-0.5 text-[11px] leading-none font-semibold">
            Any 2 food pay for 1 you lack.
          </p>
        </div>
        <div className="flex shrink-0 gap-2.5 lg:order-first lg:grid lg:grid-cols-2 lg:pb-1.5">
          <ScoreToken
            side="you"
            label="You"
            said={`Your score ${match.score.total}`}
            value={match.score.total}
            heat={heat}
            className="bg-lime"
          />
          <ScoreToken
            side="rival"
            label="Rival"
            said={`Rival score ${match.rival.score}`}
            value={match.rival.score}
            className="bg-coral"
            wrapClassName="max-lg:hidden"
          />
        </div>
      </div>
    </section>
  );
}

/**
 * A score as a token: whose it is, and the number in print, rolling up as
 * it changes. The player's has light behind it while a chain runs.
 */
function ScoreToken({
  side,
  label,
  said,
  value,
  heat = 0,
  className,
  wrapClassName = "",
}: {
  side: "you" | "rival";
  label: string;
  said: string;
  value: number;
  heat?: number;
  className: string;
  wrapClassName?: string;
}) {
  return (
    <div className={`relative isolate ${wrapClassName}`}>
      {side === "you" ? (
        <span
          aria-hidden
          className="score-heat"
          style={{ "--heat": heat } as CSSProperties}
        />
      ) : null}
      <p
        data-score={side}
        className={`piece border-ink text-ink flex flex-col items-center border-2 px-2 py-0.5 lg:flex-row lg:justify-between lg:px-2.5 lg:py-1 ${className}`}
        aria-label={said}
      >
        <span aria-hidden className="text-[11px] leading-tight font-bold">
          {label}
        </span>
        <span aria-hidden className="text-print text-3xl tabular-nums">
          <RollingNumber value={value} />
        </span>
      </p>
    </div>
  );
}

/**
 * A sentence and the actions under it. In the rail both keep the room their
 * longest form needs, so the panel does not jump as the choice changes. A
 * short screen keeps one row of actions and lets a second push the panel up.
 */
function Row2({
  text,
  rival = false,
  children,
}: {
  text: ReactNode;
  /** The line is the rival's doing, and is marked as theirs. */
  rival?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 lg:order-last">
      <p
        className="text-ink flex text-sm leading-5 font-semibold lg:min-h-[3.75rem]"
        aria-live="polite"
      >
        <span
          className={
            rival ? "border-ink bg-coral self-start border-2 px-1.5" : ""
          }
        >
          {text}
        </span>
      </p>
      <div className="flex flex-wrap items-center gap-2 pb-1.5 lg:min-h-12 lg:content-start lg:[@media(min-height:53rem)]:min-h-[5.875rem]">
        {children}
      </div>
    </div>
  );
}

function Enter() {
  return <KeyHint className="h-4.5! px-1!">Enter</KeyHint>;
}

function Prompt({ match, turn }: { match: MatchView; turn: TurnControls }) {
  const { mode, busy } = turn;
  const cancel = (
    <TableButton variant="secondary" disabled={busy} onClick={turn.cancel}>
      Back
      <KeyHint className="h-4.5! px-1!">Esc</KeyHint>
    </TableButton>
  );

  if (match.phase === "over") {
    return <Row2 text="The match is over." />;
  }

  if (match.pending) {
    const placed = match.board[match.pending.slot.row][match.pending.slot.col];
    const host = placed ? getCat(placed.catId).name : "A cat";
    if (match.pending.kind === "trade") {
      return (
        <Row2 text={`${host}: spend 1 yarn for 1 Treat?`}>
          <TableButton
            variant="secondary"
            disabled={busy}
            onClick={() => turn.resolve(null)}
          >
            Skip
          </TableButton>
          <TableButton disabled={busy} onClick={() => turn.resolve(1)}>
            Spend 1 yarn
            <Enter />
          </TableButton>
        </Row2>
      );
    }
    const chosen = mode.kind === "tuck" ? mode.hand : null;
    const chosenId = chosen === null ? undefined : match.hand[chosen];
    return (
      <Row2
        text={`${host}: pick a cat in your hand to tuck under it and draw ${plural(match.pending.draw, "cat")}, or skip.`}
      >
        <TableButton
          variant="secondary"
          disabled={busy}
          onClick={() => turn.resolve(null)}
        >
          Skip
        </TableButton>
        <TableButton
          disabled={busy || chosen === null}
          onClick={() => turn.resolve(chosen)}
        >
          {chosenId ? `Tuck ${getCat(chosenId).name}` : "Tuck"}
          <Enter />
        </TableButton>
      </Row2>
    );
  }

  switch (mode.kind) {
    case "play": {
      const catId = match.hand[mode.hand];
      const name = catId ? getCat(catId).name : "this cat";
      const rows = match.playable[mode.hand] ?? [];
      const reason = whyUnplayable(match, mode.hand);
      const owed = swapOwed(match, mode.hand);
      const short = handSwap(match, mode.hand)?.short ?? [];
      if (reason === null && mode.swap.length < owed) {
        return (
          <Row2
            text={`${name} is ${shortWords(short)} short. Give up any ${owed} of your food in its place: ${mode.swap.length} of ${owed} chosen.`}
          >
            <TableButton
              variant="secondary"
              disabled={busy || mode.swap.length === 0}
              onClick={turn.undoSwap}
            >
              Undo
            </TableButton>
            {cancel}
          </Row2>
        );
      }
      const spent = essenceSpent(match, mode.hand, mode.swap) ?? [];
      return (
        <Row2
          text={
            reason ??
            `Play ${name} into a lane. It spends ${listWords(spent.map(essenceLabel))}.`
          }
        >
          {rows.map((row) => (
            <TableButton
              key={row}
              disabled={busy}
              aria-label={`Play into the ${ROW_LABELS[row]}, ${yarnCostLabel(match.yarnCosts[row] ?? 0).toLowerCase()}`}
              onClick={() => turn.playInto(row)}
            >
              {/* In the rail the lane's own "Play here" space prints the cost. */}
              <span>
                {ROW_LABELS[row]}
                <span className="lg:hidden">
                  {" · "}
                  {yarnCostLabel(match.yarnCosts[row] ?? 0).toLowerCase()}
                </span>
              </span>
            </TableButton>
          ))}
          {cancel}
        </Row2>
      );
    }
    case "hunt":
      return (
        <Row2
          text={`Hunt: choose ${plural(turn.take, "die", "dice")} from the feeder. ${mode.dice.length} of ${turn.take} chosen.`}
        >
          <TableButton
            disabled={busy || mode.dice.length !== turn.take}
            onClick={turn.confirm}
          >
            Take {plural(turn.take, "die", "dice")}
            <Enter />
          </TableButton>
          {cancel}
        </Row2>
      );
    case "den": {
      const limit = Math.min(match.rewards.den, boardYarnRoom(match.board));
      const placed = mode.targets.length;
      return (
        <Row2
          text={
            limit === 0
              ? "Den: no cat on the board can hold yarn. Activating still fires the Den's powers and uses the turn."
              : `Den: tap cats on the board to lay yarn. ${placed} of ${limit} placed.`
          }
        >
          <TableButton disabled={busy} onClick={turn.confirm}>
            {placed > 0 ? `Lay ${placed} yarn` : "Lay none"}
            <Enter />
          </TableButton>
          {limit > 0 ? (
            <>
              <TableButton
                variant="secondary"
                disabled={busy || placed >= limit}
                onClick={turn.fillDen}
              >
                Place for me
              </TableButton>
              <TableButton
                variant="secondary"
                disabled={busy || placed === 0}
                onClick={turn.undoDen}
              >
                Undo
              </TableButton>
            </>
          ) : null}
          {cancel}
        </Row2>
      );
    }
    case "prowl":
      return (
        <Row2
          text={`Prowl: draw ${plural(match.prowlPicks, "cat")} from the tray or the deck. ${mode.picks.length} of ${match.prowlPicks} chosen.`}
        >
          <TableButton
            disabled={busy || mode.picks.length !== match.prowlPicks}
            onClick={turn.confirm}
          >
            Draw {plural(match.prowlPicks, "cat")}
            <Enter />
          </TableButton>
          {cancel}
        </Row2>
      );
    default:
      return (
        <Row2 text="Your turn. Play a cat from your hand, or activate a lane on the mat. Either way it is your whole turn." />
      );
  }
}
