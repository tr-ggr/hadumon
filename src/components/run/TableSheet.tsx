"use client";

import type { ReactNode } from "react";

import { Modal } from "~/components/ui";
import type { MatchView, RunView } from "~/server/game/view";

import type { LogEntry, RivalNews } from "./describe";
import { EventLog } from "./MatchPanels";
import { RelicTiles, TableButton } from "./pieces";
import { RivalSide } from "./RivalSide";
import { RoundBoard } from "./RoundBoard";
import { Scorepad } from "./Scorepad";
import { TableNav } from "./TableNav";

/**
 * Everything about the match that is not the mat, the supply or the hand,
 * held over the table: the run, the rival, the rounds, both score sheets,
 * the relics and the log. A table that fits its window with no room for
 * these keeps them here, one press away. On a phone's table the ways off it
 * are here too, since its corner has no room for them.
 */
export function TableSheet({
  open,
  onClose,
  run,
  match,
  news,
  flipping,
  log,
  landed,
  strip,
  onOpenMat,
}: {
  open: boolean;
  onClose: () => void;
  run: RunView;
  match: MatchView;
  news: RivalNews | null;
  /** True on a step the rival makes a move. */
  flipping: boolean;
  log: readonly LogEntry[];
  /** While a turn plays back, how many lines of the newest entry have landed. */
  landed?: number;
  /** The run's own strip: the gauntlet track and the way out. */
  strip: ReactNode;
  /** Opens the rival's board, over this. */
  onOpenMat: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="wide"
      title={`Round ${match.round + 1}`}
      footer={
        <TableButton size="md" data-autofocus onClick={onClose}>
          Back to the table
        </TableButton>
      }
    >
      <div className="text-ink space-y-3.5">
        <div className="fit-compact:block hidden">
          <TableNav />
        </div>
        {strip}
        <div className="grid items-start gap-3.5 sm:grid-cols-2">
          <RivalSide
            match={match}
            difficulty={run.difficulty}
            news={news}
            flipping={flipping}
            onOpenMat={onOpenMat}
            className="flex! flex-col"
            sheet
          />
          <RoundBoard match={match} className="sm:grid-cols-1" />
        </div>
        <div className="grid items-start gap-3.5 sm:grid-cols-2">
          <Scorepad match={match} />
          <div className="flex min-w-0 flex-col gap-3.5">
            <section aria-label="Your relics">
              <RelicTiles relicIds={run.relics} />
            </section>
            <EventLog log={log} landed={landed} className="max-h-72" />
          </div>
        </div>
      </div>
    </Modal>
  );
}
