"use client";

import { ButtonLink, Panel, PanelSkeleton } from "~/components/ui";
import { api } from "~/trpc/react";

/** Placeholder for the run screen. Sprint 11 replaces it. */
export function RunView() {
  const current = api.run.current.useQuery(undefined, { retry: false });

  if (current.isLoading) return <PanelSkeleton title="Play" lines={2} />;

  return (
    <div className="page-wrap">
      <Panel title="Play" bodyClassName="space-y-4">
        {current.error ? (
          <p role="alert" className="text-ink">
            The run could not be loaded: {current.error.message}
          </p>
        ) : (
          <>
            <p className="text-ink text-lg">
              Coming soon. The six rivals are still shuffling their decks.
            </p>
            <p className="text-ink-soft">
              {current.data
                ? "You have a run in progress. It is safe."
                : "You have no run in progress."}
            </p>
          </>
        )}
        <ButtonLink href="/codex" variant="secondary">
          Open the codex
        </ButtonLink>
      </Panel>
    </div>
  );
}
