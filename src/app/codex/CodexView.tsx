"use client";

import type { ReactNode } from "react";

import { CatsSection } from "~/components/codex/CatsSection";
import { progressText } from "~/components/codex/entries";
import { ClanList, RelicList } from "~/components/codex/PieceList";
import { RivalList } from "~/components/codex/RivalList";
import {
  Board,
  BoardSkeleton,
  CardGridSkeleton,
  TableButton,
} from "~/components/ui";
import { GAUNTLET } from "~/server/game/rival";
import { api } from "~/trpc/react";

const SECTIONS = [
  { id: "cats", label: "Cats" },
  { id: "relics", label: "Relics" },
  { id: "clans", label: "Clans" },
  { id: "rivals", label: "Rivals" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

/** A codex section: an anchor target with a count on the right of its title. */
function Section({
  id,
  count,
  children,
}: {
  id: SectionId;
  count?: string;
  children: ReactNode;
}) {
  const label = SECTIONS.find((section) => section.id === id)?.label ?? id;
  return (
    <div id={id} className="scroll-mt-20">
      <Board
        title={label}
        action={
          count ? (
            <p className="text-ink-soft text-sm font-bold tabular-nums">
              {count}
            </p>
          ) : undefined
        }
      >
        {children}
      </Board>
    </div>
  );
}

/** Everything in the game by id, with what this account has unlocked. */
export function CodexView() {
  const codex = api.codex.get.useQuery();

  return (
    <div className="page-wrap space-y-4">
      <header className="space-y-3">
        <h1 className="text-ink text-3xl sm:text-4xl">Codex</h1>
        <p className="text-ink-soft max-w-prose">
          Everything on file. Locked entries say what they want from you.
        </p>
        <nav aria-label="Codex sections" className="flex flex-wrap gap-1.5">
          {SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="border-ink/15 text-ink hover:bg-sky-soft inline-flex min-h-11 items-center rounded-full border bg-white px-4 text-sm font-bold"
            >
              {section.label}
            </a>
          ))}
        </nav>
      </header>

      {codex.data ? (
        <>
          <Section id="cats" count={progressText(codex.data.cats)}>
            <CatsSection entries={codex.data.cats} />
          </Section>
          <Section id="relics" count={progressText(codex.data.relics)}>
            <RelicList entries={codex.data.relics} />
          </Section>
          <Section id="clans" count={progressText(codex.data.clans)}>
            <ClanList entries={codex.data.clans} />
          </Section>
        </>
      ) : codex.error ? (
        <Section id="cats">
          <div role="alert" className="flex flex-col items-start gap-3">
            <p className="text-ink">
              The cats, relics and clans did not load. The rivals are below
              regardless; they never needed permission.
            </p>
            <p className="text-ink-soft text-sm">{codex.error.message}</p>
            <TableButton
              size="md"
              variant="secondary"
              disabled={codex.isFetching}
              onClick={() => void codex.refetch()}
            >
              {codex.isFetching ? "Trying…" : "Try again"}
            </TableButton>
          </div>
        </Section>
      ) : (
        <>
          <Section id="cats">
            <CardGridSkeleton count={6} />
          </Section>
          <div id="relics" className="scroll-mt-20">
            <BoardSkeleton title="Relics" lines={3} />
          </div>
          <div id="clans" className="scroll-mt-20">
            <BoardSkeleton title="Clans" lines={2} />
          </div>
        </>
      )}

      <Section id="rivals" count={`${GAUNTLET.length} matches`}>
        <RivalList />
      </Section>
    </div>
  );
}
