"use client";

import { useState, type ReactNode } from "react";

import { getCat, ROW_LABELS, type Row } from "~/server/game/cats";
import { ESSENCES } from "~/server/game/match";
import type { MatchView } from "~/server/game/view";

import { yarnCostLabel } from "./BoardRow";
import { CatPick } from "./CatPick";
import { essenceLabel, listWords, plural } from "./describe";
import { EssenceToken, KeyHint, TableButton } from "./pieces";
import { boardYarnRoom, essenceSpent, whyUnplayable, type Mode } from "./turn";

export interface TurnControls {
  mode: Mode;
  busy: boolean;
  /** Dice a Hunt takes now. */
  take: number;
  playInto: (row: Row) => void;
  cancel: () => void;
  confirm: () => void;
  fillDen: () => void;
  undoDen: () => void;
  resolve: (choice: number | null) => void;
}

export interface PlayerEdgeProps {
  match: MatchView;
  turn: TurnControls;
  /** What the table is showing while a turn plays back, else `null`. */
  playing: string | null;
  /** True on the step the rival's card turns over. */
  rivalStep: boolean;
  onSkip: () => void;
  onHandCard: (index: number) => void;
  onDetail: (catId: string) => void;
  className?: string;
}

/**
 * The player's edge of the table, docked to the bottom of the screen: what
 * is being decided and its confirm, the essence held, and the hand.
 */
export function PlayerEdge({
  match,
  turn,
  playing,
  rivalStep,
  onSkip,
  onHandCard,
  onDetail,
  className = "",
}: PlayerEdgeProps) {
  const { mode, busy } = turn;
  // On a phone the hand folds down to a peek of card tops. It opens by
  // itself for a tuck, which is answered from the hand, and the fold stays
  // the player's to work either way.
  const tucking = mode.kind === "tuck";
  const [fold, setFold] = useState({ open: false, tucking });
  if (fold.tucking !== tucking) setFold({ open: tucking, tucking });
  const shown = fold.open;
  const setOpen = (open: boolean) => setFold({ open, tucking });
  const selected = mode.kind === "play" || tucking ? mode.hand : null;

  return (
    <section
      aria-label="Your edge of the table"
      className={`rail sticky bottom-0 z-20 ${className}`}
    >
      <div className="mx-auto grid w-full max-w-[1400px] gap-x-4 gap-y-2 px-3 pt-2.5 sm:grid-cols-[17rem_minmax(0,1fr)] lg:h-[12.125rem] lg:grid-cols-[26rem_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-2 sm:pb-3">
          {playing === null ? (
            <Prompt match={match} turn={turn} />
          ) : (
            <Row2 text={playing || "Settling the table."} rival={rivalStep}>
              <TableButton variant="secondary" onClick={onSkip}>
                Skip
              </TableButton>
            </Row2>
          )}
          <div className="mt-auto flex items-center justify-between gap-3">
            <ul
              aria-label="Your essence"
              className="flex flex-wrap items-center gap-x-2.5 gap-y-2"
            >
              {ESSENCES.map((kind) => (
                <EssenceToken
                  key={kind}
                  kind={kind}
                  count={match.essence[kind]}
                />
              ))}
            </ul>
            <p
              className="piece border-ink bg-lime text-ink flex shrink-0 flex-col items-center border-2 px-2 py-0.5"
              aria-label={`Your score ${match.score.total}`}
            >
              <span aria-hidden className="text-[11px] leading-tight font-bold">
                You
              </span>
              <span aria-hidden className="text-print text-3xl tabular-nums">
                {match.score.total}
              </span>
            </p>
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2 sm:hidden">
            <p className="text-ink-soft text-xs font-bold">
              Your hand, {plural(match.hand.length, "cat")}
            </p>
            <button
              type="button"
              aria-expanded={shown}
              onClick={() => setOpen(!shown)}
              className="text-cobalt-dark min-h-10 px-2 text-xs font-bold underline underline-offset-2 disabled:opacity-45"
            >
              {shown ? "Fold the hand" : "Show the hand"}
            </button>
          </div>
          {match.hand.length === 0 ? (
            <p className="text-ink-soft pb-3 text-sm sm:pt-2">
              Your hand is empty. The Prowl draws more.
            </p>
          ) : (
            <ul
              aria-label={`Your hand, ${plural(match.hand.length, "cat")}`}
              className={`-mx-3 flex gap-3 overflow-x-auto px-3 pt-1.5 pb-4 sm:mx-0 sm:px-1 lg:h-full lg:pt-1 lg:pb-2.5 ${shown ? "" : "max-sm:max-h-16 max-sm:items-start max-sm:overflow-y-hidden"}`}
            >
              {match.hand.map((catId, index) => (
                <li
                  key={`${index}-${catId}`}
                  data-hand={index}
                  className="w-56 shrink-0 sm:min-w-44 sm:shrink"
                >
                  <CatPick
                    catId={catId}
                    verb={tucking ? "Choose" : "Play"}
                    onDetail={() => onDetail(catId)}
                    onSelect={() => {
                      // A card to play folds the hand so the lanes show; a
                      // card to tuck is chosen with the hand open.
                      setOpen(tucking);
                      onHandCard(index);
                    }}
                    selected={selected === index}
                    pickable={tucking}
                    hint={index < 9 ? String(index + 1) : undefined}
                    disabled={busy || match.phase === "over"}
                    dimmed={
                      match.phase === "turn" &&
                      whyUnplayable(match, index) !== null
                    }
                    className="h-full"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

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
    <div className="flex flex-col gap-2">
      <p
        className="text-ink flex text-sm leading-5 font-semibold lg:min-h-10"
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
      <div className="flex flex-wrap items-center gap-2 pb-1.5 lg:min-h-12 lg:flex-nowrap">
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
        <Row2 text={`${host}: spend 1 yarn for 1 wild essence?`}>
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
      const spent = essenceSpent(match, mode.hand) ?? [];
      return (
        <Row2
          text={
            reason ??
            `Play ${name} into a lane. It spends ${listWords(spent.map(essenceLabel))} essence.`
          }
        >
          {rows.map((row) => (
            <TableButton
              key={row}
              disabled={busy}
              onClick={() => turn.playInto(row)}
            >
              {ROW_LABELS[row]} ·{" "}
              {yarnCostLabel(match.yarnCosts[row] ?? 0).toLowerCase()}
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
