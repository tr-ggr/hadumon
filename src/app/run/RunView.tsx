"use client";

import { useEffect, useRef, useState } from "react";

import { ClanPick } from "~/components/run/ClanPick";
import { MatchBoard } from "~/components/run/MatchBoard";
import { MatchResult } from "~/components/run/MatchResult";
import { RewardPick } from "~/components/run/RewardPick";
import { RunSummary } from "~/components/run/RunSummary";
import { SetupKeep } from "~/components/run/SetupKeep";
import { useRunController } from "~/components/run/useRunController";
import { Button, Modal, Panel, PanelSkeleton } from "~/components/ui";
import { CLANS } from "~/server/game/run";

/**
 * The whole game on one route. Which screen shows is decided by the run's
 * state alone, so a reload always lands where the player left off.
 */
export function RunView() {
  const run = useRunController();
  const [abandoning, setAbandoning] = useState(false);

  // A new screen starts at its top, not wherever the last one was scrolled to.
  const view = run.snapshot?.view;
  const screen = run.final
    ? "summary"
    : !view
      ? "clans"
      : view.phase === "reward"
        ? `reward:${view.matchIndex}`
        : view.match?.phase === "setup"
          ? `setup:${view.matchIndex}`
          : `board:${view.matchIndex}`;
  const lastScreen = useRef(screen);
  useEffect(() => {
    if (lastScreen.current === screen) return;
    lastScreen.current = screen;
    window.scrollTo({ top: 0 });
  }, [screen]);

  if (run.final) {
    return (
      <RunSummary
        view={run.final.view}
        unlocked={run.final.unlocked}
        onAgain={run.clearFinal}
      />
    );
  }

  if (run.loading) return <PanelSkeleton title="Play" lines={3} />;

  if (run.error) {
    return (
      <Panel title="Play" bodyClassName="space-y-3">
        <p role="alert" className="text-ink">
          The run could not be loaded: {run.error.message}
        </p>
        <Button variant="secondary" onClick={run.retry}>
          Try again
        </Button>
      </Panel>
    );
  }

  const snapshot = run.snapshot;
  if (!snapshot || !view) {
    return <ClanPick busy={run.busy} onStart={run.start} />;
  }

  const match = view.match;
  // Each match gets fresh screens, so no choice leaks from the one before.
  const matchKey = `${snapshot.id}:${view.matchIndex}`;

  return (
    <div className="space-y-3">
      {view.phase === "reward" && view.reward ? (
        <>
          {match ? <MatchResult match={match} /> : null}
          <RewardPick
            key={matchKey}
            run={view}
            offer={view.reward}
            busy={run.busy}
            onChoose={run.chooseReward}
          />
        </>
      ) : match?.phase === "setup" ? (
        <SetupKeep
          key={matchKey}
          run={view}
          match={match}
          busy={run.busy}
          onAct={run.act}
        />
      ) : match ? (
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
        />
      ) : (
        <Panel title="Play">
          <p role="alert" className="text-ink">
            This run has no match to show. Abandon it and start another.
          </p>
        </Panel>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-2 px-1 pt-2">
        <p className="text-ink-soft text-xs">
          {CLANS[view.clanId].name} · {view.deck.length} cards ·{" "}
          {view.results.length} of {view.gauntlet.length} rivals beaten
        </p>
        <button
          type="button"
          disabled={run.busy}
          onClick={() => setAbandoning(true)}
          className="text-ink-soft hover:text-ink min-h-10 text-xs font-bold underline underline-offset-2 disabled:opacity-45"
        >
          Abandon run
        </button>
      </footer>

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
    </div>
  );
}
