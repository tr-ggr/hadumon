"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { ChestScene } from "~/components/run/ChestScene";
import { Climb } from "~/components/run/Climb";
import { MatchBoard } from "~/components/run/MatchBoard";
import { trackFor, type MusicScreen } from "~/components/run/music/tracks";
import { useMusic } from "~/components/run/music/useMusic";
import { RewardPick } from "~/components/run/RewardPick";
import { RunStart } from "~/components/run/RunStart";
import { RunStrip } from "~/components/run/RunStrip";
import { RunSummary } from "~/components/run/RunSummary";
import { SetupKeep } from "~/components/run/SetupKeep";
import { TableArea, TableSurface } from "~/components/run/TableSurface";
import { useClimb, useOpening } from "~/components/run/useClimb";
import { useRunController } from "~/components/run/useRunController";
import { TableButton } from "~/components/run/pieces";
import { Modal, Skeleton } from "~/components/ui";

const NO_FLOORS: readonly string[] = [];

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

  // The way up the tower comes before the screen the run is now on. It is
  // stepped from here, not from its own screen, so the press that skips it
  // is still caught after that screen has gone.
  const climb = landing ? null : run.climb;
  const climbing = useClimb(
    climb,
    view?.gauntlet ?? NO_FLOORS,
    run.finishClimb,
  );
  // So is the way up to it, which a run opens on.
  const opening = useOpening(
    view?.phase === "chest" ? run.opening : null,
    view?.gauntlet ?? NO_FLOORS,
    view?.stolen.length ?? 0,
    run.finishOpening,
  );

  // A new screen starts at its top, not wherever the last one was scrolled to.
  const screen =
    climb && climbing.frame
      ? `climb:${climb.id}`
      : run.final && !landing
        ? "summary"
        : !view
          ? "start"
          : view.phase === "chest"
            ? "chest"
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

  // Every screen has its own tune, and every rival its own theme. A table
  // still loading, or one that failed to, has none.
  const rivalId = view?.gauntlet[view.matchIndex];
  const scene: MusicScreen | null =
    climb && climbing.frame
      ? { on: "climb", summit: climb.kind === "summit" }
      : run.final && !landing
        ? { on: "summary", won: run.final.view.outcome === "won" }
        : run.loading || run.error
          ? null
          : !view
            ? { on: "start" }
            : view.phase === "chest"
              ? { on: "chest" }
              : !landing && view.phase === "reward"
                ? { on: "reward" }
                : !landing && match?.phase === "setup"
                  ? { on: "setup", rivalId }
                  : { on: "match", rivalId };
  useMusic(scene ? trackFor(scene) : null);

  if (climb && climbing.frame && view) {
    return (
      <TableSurface nav={false}>
        <Climb
          key={climb.id}
          climb={climb}
          frame={climbing.frame}
          beat={climbing.beat}
          gauntlet={view.gauntlet}
          onSkip={climbing.skip}
        />
      </TableSurface>
    );
  }

  if (run.final && !landing) {
    return (
      <TableSurface fit>
        <RunSummary
          key={run.final.id}
          view={run.final.view}
          runId={run.final.id}
          unlocked={run.final.unlocked}
          achievements={run.final.achievements}
          coins={run.final.coins ?? 0}
          onAgain={run.clearFinal}
        />
      </TableSurface>
    );
  }

  if (run.loading) {
    return (
      <TableSurface fit>
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
      <TableSurface fit>
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
      <TableSurface fit>
        <RunStart busy={run.busy} onStart={run.start} />
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
  const abandonModal = (
    <AbandonModal
      open={abandoning}
      busy={run.busy}
      onClose={() => setAbandoning(false)}
      onAbandon={() => {
        setAbandoning(false);
        run.abandon();
      }}
    />
  );

  // The opening has the whole screen, as the climb it gives way to does.
  if (view.phase === "chest" && view.chest && opening.frame) {
    return (
      <TableSurface nav={false}>
        <ChestScene
          key={(run.snapshot ?? run.final)?.id}
          run={view}
          chest={view.chest}
          busy={run.busy}
          onOpen={run.openChest}
          opening={{ ...opening, frame: opening.frame }}
          runStrip={<RunStrip {...stripProps} compact />}
        />
        {abandonModal}
      </TableSurface>
    );
  }

  // The match lays itself out to the window; every other screen is a column.
  const onBoard =
    landing ||
    (match !== null && match.phase !== "setup" && view.phase === "match");

  return (
    <TableSurface fit={!onBoard}>
      {onBoard ? (
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

      {abandonModal}
    </TableSurface>
  );
}

/** A plain sheet on the cloth, for the states that have no table to show. */
function Sheet({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="piece piece-card border-ink text-ink fitted:my-auto space-y-3 border-2 bg-white p-4">
      <h1 className="text-print text-3xl">{title}</h1>
      {children}
    </section>
  );
}

/** The question before a run is given up. */
function AbandonModal({
  open,
  busy,
  onClose,
  onAbandon,
}: {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onAbandon: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Abandon this run?"
      footer={
        <>
          <TableButton
            size="md"
            variant="secondary"
            data-autofocus
            disabled={busy}
            onClick={onClose}
          >
            Keep playing
          </TableButton>
          <TableButton
            size="md"
            variant="danger"
            disabled={busy}
            onClick={onAbandon}
          >
            Abandon run
          </TableButton>
        </>
      }
    >
      <p>
        The run ends here and cannot be resumed. Anything it has already earned
        still unlocks.
      </p>
    </Modal>
  );
}
