"use client";

import type { ReactNode } from "react";

import { Button } from "~/components/ui";
import { getCat, ROW_LABELS, ROWS, type Row } from "~/server/game/cats";
import { getRival } from "~/server/game/rival";
import type { MatchView } from "~/server/game/view";

import { yarnCostLabel } from "./BoardRow";
import { essenceLabel, listWords, plural, type RivalNews } from "./describe";
import { Dock } from "./Dock";
import { rivalLastText, useFlash } from "./MatchPanels";
import { boardYarnRoom, essenceSpent, whyUnplayable, type Mode } from "./turn";

export interface TurnControls {
  mode: Mode;
  busy: boolean;
  /** What each row's activate control says. */
  labels: Record<Row, string>;
  /** Dice a Hunt takes now. */
  take: number;
  activate: (row: Row) => void;
  playInto: (row: Row) => void;
  cancel: () => void;
  confirm: () => void;
  fillDen: () => void;
  undoDen: () => void;
  resolve: (choice: number | null) => void;
}

/**
 * The sticky bar under the board: the rival's last card, what the player is
 * choosing right now, and the way to confirm it or back out.
 */
export function ActionDock({
  match,
  news,
  turn,
}: {
  match: MatchView;
  news: RivalNews | null;
  turn: TurnControls;
}) {
  return (
    <Dock>
      <RivalTicker match={match} news={news} />
      <Prompt match={match} turn={turn} />
    </Dock>
  );
}

function RivalTicker({
  match,
  news,
}: {
  match: MatchView;
  news: RivalNews | null;
}) {
  const flash = useFlash(news?.id ?? null);
  return (
    <p
      className={`border-ink text-ink flex items-stretch border-2 text-xs leading-snug transition-colors ${flash ? "bg-coral duration-150" : "bg-cream duration-700"}`}
    >
      <span className="bg-coral border-ink shrink-0 border-r-2 px-2 py-1 font-black">
        {getRival(match.rivalId).name}
      </span>
      <span className="min-w-0 px-2 py-1 font-bold">
        {rivalLastText(match, news)}
      </span>
    </p>
  );
}

function Row2({ text, children }: { text: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p
        className="text-ink text-sm leading-snug font-semibold"
        aria-live="polite"
      >
        {text}
      </p>
      {children ? (
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function Prompt({ match, turn }: { match: MatchView; turn: TurnControls }) {
  const { mode, busy } = turn;
  const cancel = (
    <Button size="sm" variant="secondary" disabled={busy} onClick={turn.cancel}>
      Back
    </Button>
  );

  if (match.pending) {
    const placed = match.board[match.pending.slot.row][match.pending.slot.col];
    const host = placed ? getCat(placed.catId).name : "A cat";
    if (match.pending.kind === "trade") {
      return (
        <Row2 text={`${host}: spend 1 yarn for 1 wild essence?`}>
          <Button
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => turn.resolve(null)}
          >
            Skip
          </Button>
          <Button size="sm" disabled={busy} onClick={() => turn.resolve(1)}>
            Spend 1 yarn
          </Button>
        </Row2>
      );
    }
    const chosen = mode.kind === "tuck" ? mode.hand : null;
    const chosenId = chosen === null ? undefined : match.hand[chosen];
    return (
      <Row2
        text={`${host}: pick a cat in your hand to tuck under it and draw ${plural(match.pending.draw, "cat")}, or skip.`}
      >
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => turn.resolve(null)}
        >
          Skip
        </Button>
        <Button
          size="sm"
          disabled={busy || chosen === null}
          onClick={() => turn.resolve(chosen)}
        >
          {chosenId ? `Tuck ${getCat(chosenId).name}` : "Tuck"}
        </Button>
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
            `Play ${name} into a row. It spends ${listWords(spent.map(essenceLabel))} essence.`
          }
        >
          {rows.map((row) => (
            <Button
              key={row}
              size="sm"
              disabled={busy}
              onClick={() => turn.playInto(row)}
            >
              {ROW_LABELS[row]} ·{" "}
              {yarnCostLabel(match.yarnCosts[row] ?? 0).toLowerCase()}
            </Button>
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
          {cancel}
          <Button
            size="sm"
            disabled={busy || mode.dice.length !== turn.take}
            onClick={turn.confirm}
          >
            Take {plural(turn.take, "die", "dice")}
          </Button>
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
          {cancel}
          {limit > 0 ? (
            <>
              <Button
                size="sm"
                variant="secondary"
                disabled={busy || placed === 0}
                onClick={turn.undoDen}
              >
                Undo
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={busy || placed >= limit}
                onClick={turn.fillDen}
              >
                Place for me
              </Button>
            </>
          ) : null}
          <Button size="sm" disabled={busy} onClick={turn.confirm}>
            {placed > 0 ? `Lay ${placed} yarn` : "Lay none"}
          </Button>
        </Row2>
      );
    }
    case "prowl":
      return (
        <Row2
          text={`Prowl: draw ${plural(match.prowlPicks, "cat")} from the tray or the deck. ${mode.picks.length} of ${match.prowlPicks} chosen.`}
        >
          {cancel}
          <Button
            size="sm"
            disabled={busy || mode.picks.length !== match.prowlPicks}
            onClick={turn.confirm}
          >
            Draw {plural(match.prowlPicks, "cat")}
          </Button>
        </Row2>
      );
    default:
      return (
        <Row2 text="Your turn. Play a cat, or activate a row.">
          {/* The rows carry these too; down here they are a thumb away. */}
          <div className="grid w-full grid-cols-3 gap-1.5 lg:hidden">
            {ROWS.map((row) => (
              <Button
                key={row}
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() => turn.activate(row)}
                className="flex-col !gap-0 px-1 leading-tight"
              >
                <span>{ROW_LABELS[row]}</span>
                <span className="text-[10px] font-semibold">
                  {turn.labels[row]}
                </span>
              </Button>
            ))}
          </div>
        </Row2>
      );
  }
}
