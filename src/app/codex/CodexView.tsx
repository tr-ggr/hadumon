"use client";

import { PixelSprite } from "~/components/PixelSprite";
import { ButtonLink, Panel, PanelSkeleton } from "~/components/ui";
import { api } from "~/trpc/react";

/** Placeholder for the codex. Sprint 12 replaces it. */
export function CodexView() {
  const codex = api.codex.get.useQuery(undefined, { retry: false });

  if (codex.isLoading) return <PanelSkeleton title="Codex" lines={2} />;

  return (
    <div className="page-wrap">
      <Panel title="Codex" bodyClassName="space-y-4">
        {codex.error ? (
          <p role="alert" className="text-ink">
            The codex could not be loaded: {codex.error.message}
          </p>
        ) : (
          <div className="flex items-center gap-4">
            <PixelSprite
              catId="flameclaw"
              size={72}
              decorative
              className="shrink-0"
            />
            <p className="text-ink text-lg">
              Coming soon. {codex.data?.cats.length ?? 0} cats are on file and
              none of them will hold still for a portrait.
            </p>
          </div>
        )}
        <ButtonLink href="/run" variant="secondary">
          Go to Play
        </ButtonLink>
      </Panel>
    </div>
  );
}
