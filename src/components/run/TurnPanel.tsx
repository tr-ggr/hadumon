"use client";

import type { CSSProperties, ReactNode } from "react";

import { getCat, ROW_LABELS, type Row } from "~/server/game/cats";
import { ESSENCES, type Essence } from "~/server/game/match";
import type { MatchView } from "~/server/game/view";

import {
  essenceLabel,
  listWords,
  payerWords,
  plural,
  yarnCostLabel,
} from "./describe";
import { RollingNumber } from "./fx/RollingNumber";
import { LaneReadout } from "./LaneReadout";
import { MusicButton } from "./music/MusicButton";
import { EssenceToken, KeyHint, TableButton } from "./pieces";
import { SoundButton } from "./sfx/SoundButton";
import {
  boardYarnRoom,
  canSwapMore,
  denLimit,
  essenceSpent,
  handSwap,
  playBlock,
  prowlWant,
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
  /** Plays the chosen card into a lane, or stops to ask who pays its yarn. */
  playInto: (row: Row) => void;
  /** Takes back the last cat chosen to pay a play's yarn. */
  undoPayer: () => void;
  /** Leaves the play's yarn for its lane again, to choose another. */
  backToLanes: () => void;
  /** Adds one essence to the swap a short play is choosing, or takes it back. */
  swapEssence: (kind: Essence) => void;
  undoSwap: () => void;
  cancel: () => void;
  confirm: () => void;
  fillDen: () => void;
  undoDen: () => void;
  /** Pays for the Den's trade with one food, or takes it back. */
  tradeFood: (kind: Essence) => void;
  resolve: (choice: number | null) => void;
}

export interface TurnPanelProps {
  match: MatchView;
  turn: TurnControls;
  /** What the table is showing while a turn plays back, else `null`. */
  playing: string | null;
  /** True on a step the rival makes a move. */
  rivalStep: boolean;
  /**
   * The lane being chosen. What it fires is listed under the prompt on a
   * table with nowhere else to list it.
   */
  fires: Row | null;
  /**
   * How hot the player's score runs, 0 to 1: nothing at rest, deeper with
   * every power of a chain.
   */
  heat: number;
  onSkip: () => void;
  /**
   * The panel in the rail beside the table, or as the last column of a
   * phone's table: the score leads and the prompt closes it. Without this
   * it is the dock under a narrow table. The match renders both and shows
   * one of the two.
   */
  rail?: boolean;
  className?: string;
}

/**
 * The player's turn: what is being decided and its confirm, the food held,
 * and both scores side by side. In the rail the score leads, then the food, and the prompt
 * and its confirm close it, level with the hand. In the dock under a narrow
 * table the prompt leads, since the hand is right below. As the last column
 * of a phone's table it is the rail's order in less room: the prompt takes
 * what height is left and scrolls, and its actions stay at the foot.
 */
export function TurnPanel({
  match,
  turn,
  playing,
  rivalStep,
  fires,
  heat,
  onSkip,
  rail = false,
  className = "",
}: TurnPanelProps) {
  const { mode, busy } = turn;
  // A play that is short turns the essence held into the thing to choose from.
  const swapping =
    mode.kind === "play" &&
    mode.row === null &&
    playing === null &&
    swapOwed(match, mode.hand) > 0
      ? mode
      : null;
  // The cat chosen to be played costs food the player does not hold.
  const short =
    mode.kind === "play" &&
    playing === null &&
    (swapOwed(match, mode.hand) > 0 || playBlock(match, mode.hand) === "food");
  // The Den's trade is paid for from the same row of food.
  const denTrade =
    mode.kind === "den" && playing === null && match.trades.den ? mode : null;

  return (
    <section
      aria-label="Your turn"
      data-turn={rail ? "rail" : "dock"}
      className={`turn-panel min-w-0 flex-col gap-2 px-3 pt-2.5 pb-3 ${className}`}
    >
      {/* A phone's match keeps its sound and music buttons here: the corner
          has no room for them beside the gauntlet track. */}
      <div className={rail ? "contents" : "flex items-start gap-2"}>
        <div className={rail ? "contents" : "min-w-0 flex-1"}>
          {playing === null ? (
            <Prompt match={match} turn={turn} rail={rail} fires={fires} />
          ) : (
            <Row2
              text={playing || "Settling the table."}
              rival={rivalStep}
              rail={rail}
            >
              <TableButton variant="secondary" onClick={onSkip}>
                Skip
              </TableButton>
            </Row2>
          )}
        </div>
        {rail ? null : (
          <div className="flex shrink-0 gap-1.5 sm:hidden">
            <SoundButton />
            <MusicButton />
          </div>
        )}
      </div>
      <div
        className={
          rail ? "contents" : "mt-auto flex items-center justify-between gap-3"
        }
      >
        <div className="turn-food flex min-w-0 flex-col gap-1">
          <ul
            aria-label="Your food"
            className="flex flex-wrap items-center gap-x-1 gap-y-2"
          >
            {ESSENCES.map((kind) => {
              const given = swapping
                ? swapTaken(swapping.swap, kind)
                : denTrade?.trade === kind
                  ? 1
                  : 0;
              const open = swapping
                ? given > 0 ||
                  canSwapMore(match, swapping.hand, swapping.swap, kind)
                : denTrade !== null && match.essence[kind] > 0;
              return (
                <EssenceToken
                  key={kind}
                  kind={kind}
                  count={match.essence[kind]}
                  given={given}
                  onPick={
                    !open
                      ? undefined
                      : swapping
                        ? () => turn.swapEssence(kind)
                        : () => turn.tradeFood(kind)
                  }
                  disabled={busy}
                />
              );
            })}
          </ul>
          {/* The swap is a rule for the moment a chosen cat is short. In
              the rail the line keeps its room, so nothing under it moves. */}
          <p
            aria-hidden={short ? undefined : true}
            className={`turn-note text-ink-soft px-0.5 text-[11px] leading-none font-semibold ${short ? "" : rail ? "invisible" : "hidden"}`}
          >
            Any 2 food pay for 1 you lack.
          </p>
        </div>
        <div
          className={`turn-scores shrink-0 gap-2.5 ${rail ? "order-first grid grid-cols-2 pb-1.5" : "flex"}`}
        >
          <ScoreToken
            side="you"
            label="You"
            said={`Your score ${match.score.total}`}
            value={match.score.total}
            heat={heat}
            rail={rail}
            className="bg-lime"
          />
          {/* The two numbers that are compared stand together, in the dock
              as in the rail. */}
          <ScoreToken
            side="rival"
            label="Rival"
            said={`Rival score ${match.rival.score.total}`}
            value={match.rival.score.total}
            rail={rail}
            className="bg-coral"
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
  rail,
  className,
}: {
  side: "you" | "rival";
  label: string;
  said: string;
  value: number;
  heat?: number;
  /** In the rail the label and the number share a row. */
  rail: boolean;
  className: string;
}) {
  return (
    <div className="relative isolate">
      {side === "you" ? (
        <span
          aria-hidden
          className="score-heat"
          style={{ "--heat": heat } as CSSProperties}
        />
      ) : null}
      <p
        data-score={side}
        className={`piece border-ink text-ink flex items-center border-2 ${rail ? "justify-between px-2.5 py-1" : "flex-col px-2 py-0.5"} ${className}`}
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
  rail,
  under,
  children,
}: {
  text: ReactNode;
  /** The line is the rival's doing, and is marked as theirs. */
  rival?: boolean;
  rail: boolean;
  /** Set between the sentence and its actions. */
  under?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div
      className={`turn-prompt flex flex-col gap-2 ${rail ? "order-last" : ""}`}
    >
      <p
        className={`turn-text text-ink flex text-sm leading-5 font-semibold ${rail ? "min-h-[3.75rem]" : ""}`}
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
      {under}
      <div
        className={`turn-actions flex flex-wrap items-center gap-2 pb-1.5 ${rail ? "min-h-12 content-start [@media(min-height:53rem)]:min-h-[5.875rem]" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}

function Enter() {
  return <KeyHint className="h-4.5! px-1!">Enter</KeyHint>;
}

/**
 * What a lane's prompt adds while its trade spot is open: the trade as made,
 * or how to make it. Empty when the lane has no trade to offer.
 */
function tradeNote(
  match: MatchView,
  row: Row,
  made: string | null,
  how: string,
): string {
  if (!match.trades[row]) return "";
  return made ? ` Trade: ${made}` : ` Trade spot open: ${how}.`;
}

function Prompt({
  match,
  turn,
  rail,
  fires,
}: {
  match: MatchView;
  turn: TurnControls;
  rail: boolean;
  fires: Row | null;
}) {
  const { mode, busy } = turn;
  // A table that fits its window lists what the lane fires beside the mat
  // or over it; any other has only this prompt to list it in.
  const chain = fires ? (
    <LaneReadout
      match={match}
      row={fires}
      variant="list"
      className="turn-fires fit-wide:hidden"
    />
  ) : null;
  const cancel = (
    <TableButton variant="secondary" disabled={busy} onClick={turn.cancel}>
      Back
      <KeyHint className="h-4.5! px-1!">Esc</KeyHint>
    </TableButton>
  );

  if (match.phase === "over") {
    return <Row2 rail={rail} text="The match is over." />;
  }

  if (match.pending) {
    const placed = match.board[match.pending.slot.row][match.pending.slot.col];
    const host = placed ? getCat(placed.catId).name : "A cat";
    if (match.pending.kind === "trade") {
      return (
        <Row2 rail={rail} text={`${host}: spend 1 yarn for 1 Treat?`}>
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
        rail={rail}
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
      if (mode.row !== null) {
        const cost = match.yarnCosts[mode.row] ?? 0;
        const chosen = mode.yarnFrom.length;
        const from =
          chosen > 0 ? `, from ${payerWords(match.board, mode.yarnFrom)}` : "";
        return (
          <Row2
            rail={rail}
            text={`Seat ${name} in the ${ROW_LABELS[mode.row]}: it costs ${cost} yarn${from}. ${chosen === cost ? "Tap cats on your mat to change who pays." : `Tap cats on your mat to pay: ${chosen} of ${cost} chosen.`}`}
          >
            <TableButton
              disabled={busy || chosen !== cost}
              onClick={turn.confirm}
            >
              Play {name}
              <Enter />
            </TableButton>
            <TableButton
              variant="secondary"
              disabled={busy || chosen === 0}
              onClick={turn.undoPayer}
            >
              Undo
            </TableButton>
            <TableButton
              variant="secondary"
              disabled={busy}
              onClick={turn.backToLanes}
            >
              Back
            </TableButton>
          </Row2>
        );
      }
      const rows = match.playable[mode.hand] ?? [];
      const reason = whyUnplayable(match, mode.hand);
      const owed = swapOwed(match, mode.hand);
      const short = handSwap(match, mode.hand)?.short ?? [];
      if (reason === null && mode.swap.length < owed) {
        return (
          <Row2
            rail={rail}
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
          rail={rail}
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
                {rail ? null : (
                  <>
                    {" · "}
                    {yarnCostLabel(match.yarnCosts[row] ?? 0).toLowerCase()}
                  </>
                )}
              </span>
            </TableButton>
          ))}
          {cancel}
        </Row2>
      );
    }
    case "hunt": {
      const paid = mode.trade === null ? undefined : match.hand[mode.trade];
      return (
        <Row2
          rail={rail}
          under={chain}
          text={`Hunt: choose ${plural(turn.take, "die", "dice")} from the feeder. ${mode.dice.length} of ${turn.take} chosen.${tradeNote(
            match,
            "hunt",
            paid ? `${getCat(paid).name} is discarded for 1 more die.` : null,
            "tap a cat in your hand to discard it for 1 more die",
          )}`}
        >
          {/* Beside the table the Hunt's own tile is the confirm. */}
          {rail ? null : (
            <TableButton
              disabled={busy || mode.dice.length !== turn.take}
              onClick={turn.confirm}
            >
              Take {plural(turn.take, "die", "dice")}
              <Enter />
            </TableButton>
          )}
          {cancel}
        </Row2>
      );
    }
    case "den": {
      const limit = Math.min(denLimit(match, mode), boardYarnRoom(match.board));
      const placed = mode.targets.length;
      const note = tradeNote(
        match,
        "den",
        mode.trade
          ? `1 ${essenceLabel(mode.trade)} is spent for 1 more yarn, if you lay all ${limit}.`
          : null,
        "tap one of your food to spend it for 1 more yarn",
      );
      return (
        <Row2
          rail={rail}
          under={chain}
          text={
            limit === 0
              ? "Den: no cat on the board can hold yarn. Activating still fires the Den's powers and uses the turn."
              : `Den: tap cats on the board to lay yarn. ${placed} of ${limit} placed.${note}`
          }
        >
          {/* Beside the table the Den's own tile sends the yarn laid; what
              stays here is the turn spent laying none. */}
          {rail ? (
            <TableButton
              disabled={busy || placed > 0 || mode.trade !== null}
              onClick={turn.confirm}
            >
              Lay none
              {placed === 0 && mode.trade === null ? <Enter /> : null}
            </TableButton>
          ) : (
            <TableButton
              disabled={busy || (mode.trade !== null && placed !== limit)}
              onClick={turn.confirm}
            >
              {placed > 0 ? `Lay ${placed} yarn` : "Lay none"}
              <Enter />
            </TableButton>
          )}
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
    case "prowl": {
      const want = prowlWant(match, mode);
      const payer = mode.trade
        ? match.board[mode.trade.row][mode.trade.col]
        : undefined;
      return (
        <Row2
          rail={rail}
          under={chain}
          text={`Prowl: draw ${plural(want, "cat")} from the tray or the deck. ${mode.picks.length} of ${want} chosen.${tradeNote(
            match,
            "prowl",
            payer
              ? `${getCat(payer.catId).name} spends 1 yarn for 1 more cat.`
              : null,
            "tap a cat on your mat to spend 1 of its yarn for 1 more cat",
          )}`}
        >
          {/* Beside the table the Prowl's own tile is the confirm. */}
          {rail ? null : (
            <TableButton
              disabled={busy || mode.picks.length !== want}
              onClick={turn.confirm}
            >
              Draw {plural(want, "cat")}
              <Enter />
            </TableButton>
          )}
          {cancel}
        </Row2>
      );
    }
    default:
      return (
        <Row2
          rail={rail}
          text="Your turn. Play a cat from your hand, or activate a lane on the mat. Either way it is your whole turn."
        />
      );
  }
}
