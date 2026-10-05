import { memo, type CSSProperties } from "react";

import { CatCard } from "~/components/cats/CatCard";
import { PixelIcon } from "~/components/PixelIcon";
import { CardGridSkeleton, Skeleton, TableButton } from "~/components/ui";
import { getCat } from "~/server/game/cats";
import { chapterLabel, type Page } from "./book";
import { copiesText, lockedText, type CodexEntry } from "./entries";
import { RelicList } from "./PieceList";
import { RivalCard } from "./RivalList";
import type { Leaf } from "./turn";

/**
 * Four cats to a page, two by two, each in a pocket of its own. The pockets
 * share out the page's height, so they are one size on every page, as a
 * binder's are, whatever the cards in them have to say.
 */
const CAT_GRID = "grid flex-1 grid-cols-2 grid-rows-2 gap-x-3 gap-y-4";
/** Relics two across where a page is one of a spread. */
const RELIC_GRID = "grid grid-cols-1 gap-x-3 gap-y-4 md:grid-cols-2";

export interface BookPageProps {
  page: Page;
  /** Which side of the spine it lies on. A single page is a right page. */
  side: "left" | "right";
  /** One page open at a time: it carries the whole head, title and count. */
  solo: boolean;
  /** The pockets are large enough to print a cat's whole card in. */
  roomy: boolean;
  /** What it is doing, when it is on show. Absent, it is put away. */
  leaf?: Leaf["role"];
  shade?: Leaf["shade"];
  waitMs?: number;
  /** A leaf is turning: nothing on any page takes a press until it lands. */
  held: boolean;
  /** The cat out of its pocket on this page, if one is. */
  out: string | null;
  onPull: (catId: string) => void;
  onClearFilters: () => void;
  /** The error page's way out, and what went wrong. */
  onRetry: () => void;
  retrying: boolean;
  problem: string | null;
}

/**
 * One page of the codex: a board with a running head, whatever its chapter
 * prints on it, and its number at the foot. Every page of the book is
 * mounted the whole time, so this renders again only when its own props do.
 */
export const BookPage = memo(function BookPage({
  page,
  side,
  solo,
  roomy,
  leaf,
  shade,
  waitMs = 0,
  held,
  out,
  onPull,
  onClearFilters,
  onRetry,
  retrying,
  problem,
}: BookPageProps) {
  const shown = leaf !== undefined;
  const label = chapterLabel(page.chapter);
  // A spread reads as one head across both pages: the chapter on the left,
  // how much of it is unlocked on the right.
  const titled = solo || side === "left";
  const counted = solo || side === "right";

  return (
    <section
      aria-label={`${label}, page ${page.folio}`}
      aria-hidden={shown ? undefined : true}
      inert={!shown || held}
      data-side={side}
      data-leaf={leaf}
      data-shade={shade ?? undefined}
      style={
        waitMs > 0
          ? ({ "--leaf-wait": `${waitMs}ms` } as CSSProperties)
          : undefined
      }
      className="board book-page text-ink flex flex-col p-4 sm:p-5"
    >
      <header className="mb-4 flex min-h-[30px] items-end justify-between gap-x-4">
        {titled ? <h2 className="text-print text-3xl">{label}</h2> : null}
        {counted && page.count ? (
          <p className="text-print ml-auto text-xl tabular-nums">
            {page.count}
          </p>
        ) : null}
      </header>

      <PageBody
        page={page}
        roomy={roomy}
        out={out}
        onPull={onPull}
        onClearFilters={onClearFilters}
        onRetry={onRetry}
        retrying={retrying}
        problem={problem}
      />

      <p
        aria-hidden
        className={`text-ink-soft mt-auto pt-4 text-xs font-bold tabular-nums ${side === "right" ? "text-right" : ""}`}
      >
        {page.folio}
      </p>
      <span aria-hidden className="book-shade" />
    </section>
  );
});

function PageBody({
  page,
  roomy,
  out,
  onPull,
  onClearFilters,
  onRetry,
  retrying,
  problem,
}: Pick<
  BookPageProps,
  | "page"
  | "roomy"
  | "out"
  | "onPull"
  | "onClearFilters"
  | "onRetry"
  | "retrying"
  | "problem"
>) {
  const { body } = page;
  switch (body.kind) {
    case "cats":
      return (
        // Keyed by the filters, so cats dealt out again land as new pieces.
        <ul key={page.deal} className={CAT_GRID}>
          {body.entries.map((entry) => (
            <Pocket
              key={entry.id}
              entry={entry}
              roomy={roomy}
              out={out === entry.id}
              onPull={onPull}
            />
          ))}
        </ul>
      );
    case "relics":
      return <RelicList entries={body.entries} className={RELIC_GRID} />;
    case "rival":
      return <RivalCard rivalId={body.rivalId} match={body.match} />;
    case "empty":
      return (
        <div className="border-ink/40 flex flex-col items-start gap-3 border-2 border-dashed p-4">
          <p>No cat is both of those things. Several have tried.</p>
          <TableButton variant="secondary" size="sm" onClick={onClearFilters}>
            Clear filters
          </TableButton>
        </div>
      );
    case "loading":
      return page.chapter === "cats" ? (
        <CardGridSkeleton count={4} className={CAT_GRID} />
      ) : (
        <div role="status" aria-busy="true" className="grid gap-2">
          <span className="sr-only">Loading…</span>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      );
    case "error":
      return (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p>
            The cats and relics did not load. The rivals are in their chapter
            regardless; they never needed permission.
          </p>
          {problem ? <p className="text-ink-soft text-sm">{problem}</p> : null}
          <TableButton
            size="md"
            variant="secondary"
            disabled={retrying}
            onClick={onRetry}
          >
            {retrying ? "Trying…" : "Try again"}
          </TableButton>
        </div>
      );
    case "blank":
      // The back of a chapter's last leaf. Left empty on purpose, and marked
      // so it does not look like a page that failed to print.
      return (
        <div className="grid flex-1 place-items-center py-8 opacity-35">
          <PixelIcon name="book" size={64} />
        </div>
      );
  }
}

/**
 * A cat in its pocket. Unlocked, the card is a button that takes it out to
 * be read; while it is out the pocket shows empty, and the button stays
 * where it was so the dialog has somewhere to hand the focus back to.
 */
function Pocket({
  entry,
  roomy,
  out,
  onPull,
}: {
  entry: CodexEntry;
  roomy: boolean;
  out: boolean;
  onPull: (catId: string) => void;
}) {
  const variant = roomy ? "full" : "compact";
  return (
    <li className="anim-land relative flex">
      {entry.unlocked ? (
        <button
          type="button"
          data-pocket={entry.id}
          aria-haspopup="dialog"
          aria-label={`${getCat(entry.id).name}: read the whole card`}
          onClick={() => onPull(entry.id)}
          className="liftable flex w-full cursor-pointer text-left"
        >
          <CatCard
            catId={entry.id}
            variant={variant}
            className={`w-full ${out ? "invisible" : ""}`}
          />
        </button>
      ) : (
        <CatCard
          catId={entry.id}
          variant={variant}
          lockedHint={lockedText(entry)}
          className="w-full"
        />
      )}
      {entry.unlocked && !out ? (
        <span className="border-ink bg-lime text-ink pointer-events-none absolute -top-1.5 -right-1 z-10 border-2 px-1 text-[11px] leading-4 font-black tabular-nums">
          <span className="sr-only">Owned: </span>
          {copiesText(entry)}
        </span>
      ) : null}
      {out ? <span aria-hidden className="tray-well absolute inset-0" /> : null}
    </li>
  );
}
