"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { ClanPick } from "~/components/run/ClanPick";
import { MatchBoard } from "~/components/run/MatchBoard";
import { RewardPick } from "~/components/run/RewardPick";
import { RunStrip } from "~/components/run/RunStrip";
import { RunSummary } from "~/components/run/RunSummary";
import { SetupKeep } from "~/components/run/SetupKeep";
import { TableArea, TableSurface } from "~/components/run/TableSurface";
import { useRunController } from "~/components/run/useRunController";
import { TableButton } from "~/components/run/pieces";
import { Button, Modal, Skeleton } from "~/components/ui";

/**
 * The whole game on one route. Which screen shows is decided by the run's
 * state alone, so a reload always lands where the player left off.
 */
export function RunView() {
  const run = useRunController();
  const [abandoning, setAbandoning] = useState(false);

  // The turn that ends a match is still played back on the table before the
  // result takes its place, so the board outlives its own phase for a moment.
  const view = run.final?.view ?? run.snapshot?.view;
  const match = view?.match ?? null;
  const landing = run.turn !== null && match !== null;

  // A new screen starts at its top, not wherever the last one was scrolled to.
  const screen =
    run.final && !landing
      ? "summary"
      : !view
        ? "clans"
        : landing
          ? `board:${view.matchIndex}`
          : view.phase === "reward"
            ? `reward:${view.matchIndex}`
            : match?.phase === "setup"
              ? `setup:${view.matchIndex}`
              : `board:${view.matchIndex}`;
  const lastScreen = useRef(screen);
  useEffect(() => {
    if (lastScreen.current === screen) return;
    lastScreen.current = screen;
    window.scrollTo({ top: 0 });
  }, [screen]);

  if (run.final && !landing) {
    return (
      <TableSurface>
        <RunSummary
          view={run.final.view}
          unlocked={run.final.unlocked}
          onAgain={run.clearFinal}
        />
      </TableSurface>
    );
  }

  if (run.loading) {
    return (
      <TableSurface>
        <TableArea>
          <div
            className="tray-well space-y-2 p-4"
            role="status"
            aria-busy="true"
          >
            <span className="sr-only">Loading the table…</span>
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </TableArea>
      </TableSurface>
    );
  }

  if (run.error) {
    return (
      <TableSurface>
        <TableArea>
          <Sheet title="Play">
            <p role="alert">The run could not be loaded: {run.error.message}</p>
            <TableButton variant="secondary" onClick={run.retry}>
              Try again
            </TableButton>
          </Sheet>
        </TableArea>
      </TableSurface>
    );
  }

  if (!view) {
    return (
      <TableSurface>
        <ClanPick busy={run.busy} onStart={run.start} />
      </TableSurface>
    );
  }

  // Each match gets fresh screens, so no choice leaks from the one before.
  const matchKey = `${(run.snapshot ?? run.final)?.id}:${view.matchIndex}`;
  const stripProps = {
    run: view,
    busy: run.busy || run.final !== null,
    onAbandon: () => setAbandoning(true),
  };
  const strip = <RunStrip {...stripProps} />;

  return (
    <TableSurface>
      {landing ||
      (match && match.phase !== "setup" && view.phase === "match") ? (
        match ? (
          <MatchBoard
            key={matchKey}
            run={view}
            match={match}
            busy={run.busy}
            onAct={run.act}
            log={run.log}
            news={run.news}
            goal={run.goal}
            onDismissGoal={run.dismissGoal}
            turn={run.turn}
            onTurnPlayed={run.finishTurn}
            runStrip={strip}
            sideStrip={<RunStrip {...stripProps} compact />}
          />
        ) : null
      ) : view.phase === "reward" && view.reward ? (
        <RewardPick
          key={matchKey}
          run={view}
          offer={view.reward}
          match={match}
          busy={run.busy}
          onChoose={run.chooseReward}
          runStrip={strip}
        />
      ) : match?.phase === "setup" ? (
        <SetupKeep
          key={matchKey}
          run={view}
          match={match}
          busy={run.busy}
          onAct={run.act}
          runStrip={strip}
        />
      ) : (
        <TableArea>
          <Sheet title="Play">
            <p role="alert">
              This run has no match to show. Abandon it and start another.
            </p>
            {strip}
          </Sheet>
        </TableArea>
      )}

      <Modal
        open={abandoning}
        onClose={() => setAbandoning(false)}
        title="Abandon this run?"
        footer={
          <>
            <Button
              variant="secondary"
              data-autofocus
              disabled={run.busy}
              onClick={() => setAbandoning(false)}
            >
              Keep playing
            </Button>
            <Button
              variant="danger"
              disabled={run.busy}
              onClick={() => {
                setAbandoning(false);
                run.abandon();
              }}
            >
              Abandon run
            </Button>
          </>
        }
      >
        <p>
          The run ends here and cannot be resumed. Anything it has already
          earned still unlocks.
        </p>
      </Modal>
    </TableSurface>
  );
}

/** A plain sheet on the cloth, for the states that have no table to show. */
function Sheet({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="piece piece-card border-ink text-ink space-y-3 border-2 bg-white p-4">
      <h1 className="text-print text-3xl">{title}</h1>
      {children}
    </section>
  );
}
