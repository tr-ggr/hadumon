"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";

import { useShellMoving } from "~/components/AppShell";
import { CatCard } from "~/components/cats/CatCard";
import { PixelIcon } from "~/components/PixelIcon";
import { playCat, playSound } from "~/components/run/sfx/engine";
import { useReducedMotion } from "~/components/run/useStepper";
import {
  Board,
  KeyHint,
  Modal,
  TableButton,
  tableButtonClass,
} from "~/components/ui";
import { getCat } from "~/server/game/cats";
import {
  anchorOf,
  buildBook,
  CHAPTERS,
  chapterLabel,
  filterCats,
  isChapterId,
  NO_FILTERS,
  pageAt,
  readout,
  spreadOf,
  step,
  type Anchor,
  type ChapterId,
  type Filters,
  type Shelf,
  type Up,
} from "./book";
import { BookPage } from "./BookPage";
import { CatFilters } from "./CatFilters";
import {
  BEAT_MS,
  bookReducer,
  COVER_PACE,
  ENTER_MS,
  LEAF_MS,
  leafPlan,
  SHUT_BOOK,
  turnMs,
} from "./turn";
import { useRoomy, useTwoUp } from "./useTwoUp";

/** A swipe: this far across, in this long at most, and clearly sideways. */
const SWIPE_MIN_PX = 48;
const SWIPE_MAX_MS = 600;
const SWIPE_SLOPE = 1.5;
/** A touch that starts this near the screen's edge is the browser's own. */
const SWIPE_EDGE_PX = 24;

export interface CodexBookProps {
  shelf: Shelf;
  /** Asks for the cats and relics again after they did not load. */
  onRetry: () => void;
  retrying: boolean;
  /** What went wrong, in the server's words. */
  problem: string | null;
}

/**
 * The codex as a book. It comes up shut out of the dark once the camera has
 * stopped, and opens by itself a beat later; then the chapters are tabs on
 * its edge, and a page is turned by a tab, the two buttons under it, the
 * arrow keys or a swipe. A cat that is unlocked comes out of its pocket to be
 * read whole.
 *
 * `turn.ts` holds the state and says what each page does while a leaf turns;
 * this holds the timers, the focus and the scroll.
 */
export function CodexBook({
  shelf,
  onRetry,
  retrying,
  problem,
}: CodexBookProps) {
  const calm = useReducedMotion();
  const moving = useShellMoving();
  const up: Up = useTwoUp() ? 2 : 1;
  const roomy = useRoomy();
  const [state, dispatch] = useReducer(bookReducer, SHUT_BOOK);
  /** The cat out of its pocket, until its dialog has gone back. */
  const [out, setOut] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const spreadRef = useRef<HTMLDivElement>(null);

  const book = useMemo(
    () => buildBook(shelf, state.filters, up),
    [shelf, state.filters, up],
  );
  const leafMs = LEAF_MS[up];
  const coverMs = leafMs * COVER_PACE;
  const openMs = turnMs(up, coverMs);
  const here = pageAt(book, state.at);
  /** Where the book is going: the page it lies open at once nothing moves. */
  const goal = state.turn ? pageAt(book, state.turn.to) : here;
  const chapter = (state.turn?.to ?? state.at).chapter;
  const plan =
    state.phase === "closed"
      ? null
      : state.phase === "opening"
        ? leafPlan(up, "cover", spreadOf(book, goal), coverMs)
        : leafPlan(up, spreadOf(book, here), spreadOf(book, goal), leafMs);
  const held = state.phase !== "open" || state.turn !== null;

  // What the listeners on the document read: they outlive any one render.
  const live = useRef({ book, state, calm, reading });
  useEffect(() => {
    live.current = { book, state, calm, reading };
  });

  /** Turns to the spread a place is on, if the book is not open there. */
  const turnTo = useCallback((target: Anchor) => {
    const now = live.current;
    if (now.state.phase !== "open") return;
    const open = pageAt(now.book, now.state.turn?.to ?? now.state.at);
    const [next] = spreadOf(now.book, pageAt(now.book, target));
    if (next === undefined || next === spreadOf(now.book, open)[0]) return;

    const spread = spreadRef.current;
    if (spread) {
      // The page under the focus is about to be put away; the book keeps it.
      const active = document.activeElement;
      if (active !== spread && spread.contains(active)) {
        spread.focus({ preventScroll: true });
      }
      // A new page is read from its top: a cut, since the leaf is the motion.
      const lid = document.querySelector(".lid")?.getBoundingClientRect();
      if (spread.getBoundingClientRect().top < (lid?.bottom ?? 0)) {
        spread.scrollIntoView({ block: "start", behavior: "instant" });
      }
    }
    dispatch({ type: "go", to: anchorOf(now.book, next), calm: now.calm });
    playSound("page");
  }, []);

  const stepBy = useCallback(
    (dir: 1 | -1) => {
      const now = live.current;
      const open = pageAt(now.book, now.state.turn?.to ?? now.state.at);
      const next = step(now.book, open, dir);
      if (next !== null) turnTo(anchorOf(now.book, next));
    },
    [turnTo],
  );

  // The address names a chapter (`/codex#rivals`): the book opens there, and
  // a change of address while it is open turns to it.
  useEffect(() => {
    const read = () => {
      const id = window.location.hash.slice(1);
      if (!isChapterId(id)) return;
      if (live.current.state.phase === "closed") {
        dispatch({ type: "start", chapter: id });
      } else {
        turnTo({ chapter: id, item: 0 });
      }
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [turnTo]);

  // And the address follows the chapter, once the chapter has changed.
  const addressed = useRef<ChapterId | null>(null);
  useEffect(() => {
    if (addressed.current === null) {
      addressed.current = chapter;
      return;
    }
    if (addressed.current === chapter) return;
    addressed.current = chapter;
    window.history.replaceState(null, "", `#${chapter}`);
  }, [chapter]);

  // The shut book comes up out of the dark and lies there for a beat, counted
  // from when the page was set down, and then opens. Reduced motion has it
  // open already.
  useEffect(() => {
    if (state.phase !== "closed" || moving) return;
    if (calm) {
      dispatch({ type: "opened" });
      return;
    }
    const timer = setTimeout(() => {
      dispatch({ type: "open" });
      playSound("cover");
      playSound("settle", 0, openMs / 1000);
    }, ENTER_MS + BEAT_MS);
    return () => clearTimeout(timer);
  }, [state.phase, moving, calm, openMs]);

  useEffect(() => {
    if (state.phase !== "opening") return;
    const timer = setTimeout(() => dispatch({ type: "opened" }), openMs);
    return () => clearTimeout(timer);
  }, [state.phase, openMs]);

  const turnId = state.turn?.id ?? null;
  useEffect(() => {
    if (turnId === null) return;
    const timer = setTimeout(
      () => dispatch({ type: "landed", id: turnId }),
      turnMs(up, leafMs),
    );
    return () => clearTimeout(timer);
  }, [turnId, up, leafMs]);

  // The book is laid out again when the window crosses 768px, and a leaf in
  // the air has no place in the new one.
  useEffect(() => {
    dispatch({ type: "settle" });
  }, [up]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      // Alt and an arrow is the browser's Back; a held key is not a turn.
      if (event.repeat || event.altKey || event.ctrlKey) return;
      if (event.metaKey || event.shiftKey) return;
      if (live.current.reading) return;
      if (document.querySelector('[aria-modal="true"]')) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target !== document.body && !rootRef.current?.contains(target)) {
        return;
      }
      event.preventDefault();
      stepBy(event.key === "ArrowRight" ? 1 : -1);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [stepBy]);

  const touch = useRef<{ id: number; x: number; y: number; at: number } | null>(
    null,
  );
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    touch.current = null;
    if (event.pointerType === "mouse") return;
    const x = event.clientX;
    if (x < SWIPE_EDGE_PX || x > window.innerWidth - SWIPE_EDGE_PX) return;
    touch.current = {
      id: event.pointerId,
      x,
      y: event.clientY,
      at: event.timeStamp,
    };
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const from = touch.current;
    touch.current = null;
    if (from?.id !== event.pointerId) return;
    if (event.timeStamp - from.at > SWIPE_MAX_MS) return;
    const across = event.clientX - from.x;
    const down = event.clientY - from.y;
    if (Math.abs(across) < SWIPE_MIN_PX) return;
    if (Math.abs(across) < Math.abs(down) * SWIPE_SLOPE) return;
    stepBy(across < 0 ? 1 : -1);
  };

  const setFilters = useCallback(
    (filters: Filters) => dispatch({ type: "filter", filters }),
    [],
  );
  const clearFilters = useCallback(() => setFilters(NO_FILTERS), [setFilters]);

  const pull = useCallback((catId: string) => {
    setOut(catId);
    setReading(true);
    playCat(catId);
  }, []);
  const pocket = () =>
    (out
      ? rootRef.current
          ?.querySelector(`[data-pocket="${out}"]`)
          ?.getBoundingClientRect()
      : null) ?? null;

  const label = chapterLabel(chapter);
  const filtering =
    state.phase === "open" && chapter === "cats" && shelf.status === "ready";
  const matching = filtering ? filterCats(shelf.cats, state.filters).length : 0;

  return (
    <>
      <div
        ref={rootRef}
        className="book"
        data-phase={state.phase}
        // An animation runs whether or not its page is showing, so the book
        // only starts to come up once the camera has stopped.
        data-entered={!moving}
        style={
          {
            "--leaf": `${state.phase === "open" ? leafMs : coverMs}ms`,
            "--enter": `${ENTER_MS}ms`,
          } as CSSProperties
        }
      >
        <div className="book-rail">
          <h1 className="piece border-ink bg-cream text-print border-2 px-3 py-2 text-3xl sm:text-[40px]">
            Codex
          </h1>
          <p className="sr-only">
            Everything on file. Locked entries say what they want from you.
          </p>
          <nav className="book-tabs" aria-label="Codex chapters">
            <ul>
              {CHAPTERS.map((entry, i) => {
                const active = entry.id === chapter;
                return (
                  <li key={entry.id} style={{ "--i": i } as CSSProperties}>
                    <button
                      type="button"
                      aria-current={active ? "true" : undefined}
                      onClick={() => turnTo({ chapter: entry.id, item: 0 })}
                      className={tableButtonClass(
                        active ? "chosen" : "secondary",
                        "md",
                        active ? "is-pressed" : "",
                      )}
                    >
                      {entry.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* The filters twice, and the stylesheet shows one: flags along the
            book's top edge where the tabs are down its side, and a board
            under the pager where the tabs have the top edge. */}
        {filtering ? (
          <CatFilters
            layout="flags"
            filters={state.filters}
            onChange={setFilters}
            shown={matching}
            total={shelf.cats.length}
          />
        ) : null}

        <div
          ref={spreadRef}
          role="group"
          aria-label={`Codex, ${label}`}
          tabIndex={-1}
          className="book-spread"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (touch.current = null)}
        >
          {state.phase === "open" ? null : (
            <div aria-hidden className="book-cover">
              <div className="border-ink flex flex-col items-center justify-center gap-3 border-2 p-4 text-center">
                <PixelIcon name="book" size={96} />
                <p className="text-print text-3xl">Codex</p>
                <p className="text-xs font-bold">Everything on file.</p>
              </div>
            </div>
          )}
          {book.pages.map((page, i) => {
            const leaf = plan?.get(i);
            const holds =
              out !== null &&
              page.body.kind === "cats" &&
              page.body.entries.some((entry) => entry.id === out);
            return (
              <BookPage
                key={page.key}
                page={page}
                side={up === 2 && i % 2 === 0 ? "left" : "right"}
                solo={up === 1}
                roomy={roomy}
                leaf={leaf?.role}
                shade={leaf?.shade}
                waitMs={leaf?.waitMs}
                held={held}
                out={holds ? out : null}
                onPull={pull}
                onClearFilters={clearFilters}
                onRetry={onRetry}
                retrying={retrying}
                problem={problem}
              />
            );
          })}
        </div>

        <div className="book-pager board text-ink mt-5 flex items-center gap-3 p-2.5 pb-3">
          <TableButton
            variant="secondary"
            size="md"
            disabled={step(book, goal, -1) === null}
            onClick={() => stepBy(-1)}
          >
            <KeyHint>
              <PixelIcon name="chevron" size={8} />
            </KeyHint>
            Previous
          </TableButton>
          <p
            aria-live="polite"
            className="flex-1 text-center text-sm font-bold tabular-nums"
          >
            <span className="sr-only">{label}. </span>
            {readout(book, goal)}
          </p>
          <TableButton
            variant="secondary"
            size="md"
            disabled={step(book, goal, 1) === null}
            onClick={() => stepBy(1)}
          >
            Next
            <KeyHint>
              <PixelIcon name="chevron" size={8} className="-scale-x-100" />
            </KeyHint>
          </TableButton>
        </div>

        {filtering ? (
          <Board className="book-filters anim-land mt-5">
            <CatFilters
              filters={state.filters}
              onChange={setFilters}
              shown={matching}
              total={shelf.cats.length}
            />
          </Board>
        ) : null}
      </div>

      <Modal
        open={reading}
        onClose={() => setReading(false)}
        onClosed={() => setOut(null)}
        origin={pocket}
        title={out ? getCat(out).name : ""}
        footer={
          <TableButton
            size="md"
            variant="secondary"
            data-autofocus
            onClick={() => setReading(false)}
          >
            Close
          </TableButton>
        }
      >
        {out ? (
          <div data-pop-anchor>
            <CatCard catId={out} variant="full" />
          </div>
        ) : null}
      </Modal>
    </>
  );
}
