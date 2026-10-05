/**
 * The codex as a book: what is on each page. Everything here is worked out
 * from the shelf (what the account has), the filters and how many pages are
 * open at once, so the component only has to turn to a page and draw it.
 */

import { getCat, type Rarity } from "~/server/game/cats";
import type { Element } from "~/server/game/elements";
import { progressText, type CodexEntry } from "./entries";

export const CHAPTERS = [
  { id: "cats", label: "Cats" },
  { id: "relics", label: "Relics" },
  { id: "rivals", label: "Rivals" },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]["id"];

export function isChapterId(value: string): value is ChapterId {
  return CHAPTERS.some((chapter) => chapter.id === value);
}

export function chapterLabel(id: ChapterId): string {
  return CHAPTERS.find((chapter) => chapter.id === id)?.label ?? id;
}

/** How many pages lie open at once: one on a phone, a spread from 768px. */
export type Up = 1 | 2;

export interface Filters {
  element: Element | null;
  rarity: Rarity | null;
}

export const NO_FILTERS: Filters = { element: null, rarity: null };

export function isFiltered(filters: Filters): boolean {
  return filters.element !== null || filters.rarity !== null;
}

/** What `codex.get` answered, and whether it has. Rivals are never locked. */
export interface Shelf {
  status: "ready" | "loading" | "error";
  cats: readonly CodexEntry[];
  relics: readonly CodexEntry[];
  /** Rival ids in the order a run meets them. */
  rivals: readonly string[];
}

export type PageBody =
  | { kind: "cats" | "relics"; entries: readonly CodexEntry[] }
  | { kind: "rival"; rivalId: string; match: number }
  /** No cat matches the filters. */
  | { kind: "empty" }
  | { kind: "loading" }
  | { kind: "error" }
  /** Nothing printed: the back of a chapter's last leaf. */
  | { kind: "blank" };

export interface Page {
  key: string;
  chapter: ChapterId;
  /** The first thing on the page, counted through its chapter. */
  item: number;
  /** The page's number in the book, from 1. */
  folio: number;
  /** Printed in the page's head: how much of the chapter is unlocked. */
  count: string;
  /** Changes when the cats are dealt out again, so a re-dealt page lands. */
  deal: string;
  body: PageBody;
}

export interface Book {
  up: Up;
  pages: readonly Page[];
  /** The page each chapter starts on. */
  first: Record<ChapterId, number>;
}

/** A place in the book that outlives a re-pagination. */
export interface Anchor {
  chapter: ChapterId;
  item: number;
}

/** How many of a chapter's things one page holds, by pages open at once. */
export const PER_PAGE: Record<Up, Record<ChapterId, number>> = {
  1: { cats: 4, relics: 4, rivals: 1 },
  2: { cats: 4, relics: 6, rivals: 1 },
};

export function filterCats(
  entries: readonly CodexEntry[],
  filters: Filters,
): CodexEntry[] {
  return entries.filter((entry) => {
    const cat = getCat(entry.id);
    return (
      (filters.element === null || cat.element === filters.element) &&
      (filters.rarity === null || cat.rarity === filters.rarity)
    );
  });
}

type Draft = Pick<Page, "item" | "body">;

function deal(entries: readonly CodexEntry[], size: number): CodexEntry[][] {
  const pages: CodexEntry[][] = [];
  for (let i = 0; i < entries.length; i += size) {
    pages.push(entries.slice(i, i + size));
  }
  return pages;
}

/** A chapter of cats or relics, in whatever state the shelf is in. */
function entryChapter(
  kind: "cats" | "relics",
  entries: readonly CodexEntry[],
  status: Shelf["status"],
  up: Up,
): Draft[] {
  if (status === "loading") {
    return Array.from({ length: up }, () => ({
      item: 0,
      body: { kind: "loading" as const },
    }));
  }
  if (status === "error") return [{ item: 0, body: { kind: "error" } }];
  if (entries.length === 0) return [{ item: 0, body: { kind: "empty" } }];
  const size = PER_PAGE[up][kind];
  return deal(entries, size).map((slice, i) => ({
    item: i * size,
    body: { kind, entries: slice },
  }));
}

/**
 * Lays the book out. Two-up, every chapter starts on a left page: a chapter
 * with an odd number of pages ends on a blank one, or its last page would
 * share a spread with the next chapter's first.
 */
export function buildBook(shelf: Shelf, filters: Filters, up: Up): Book {
  const ready = shelf.status === "ready";
  const cats = filterCats(shelf.cats, filters);
  const chapters: Record<ChapterId, { count: string; pages: Draft[] }> = {
    cats: {
      count: !ready
        ? ""
        : isFiltered(filters)
          ? `${cats.length} of ${shelf.cats.length} match`
          : progressText(shelf.cats),
      pages: entryChapter("cats", cats, shelf.status, up),
    },
    relics: {
      count: ready ? progressText(shelf.relics) : "",
      pages: entryChapter("relics", shelf.relics, shelf.status, up),
    },
    rivals: {
      count: `${shelf.rivals.length} matches`,
      pages: shelf.rivals.map((rivalId, i) => ({
        item: i,
        body: { kind: "rival", rivalId, match: i + 1 },
      })),
    },
  };

  const dealt = `${filters.element ?? "all"}-${filters.rarity ?? "all"}`;
  const pages: Page[] = [];
  const first = {} as Record<ChapterId, number>;
  for (const { id } of CHAPTERS) {
    const { count, pages: drafts } = chapters[id];
    first[id] = pages.length;
    const padded: Draft[] =
      up === 2 && drafts.length % 2 === 1
        ? [...drafts, { item: drafts.length, body: { kind: "blank" } }]
        : drafts;
    padded.forEach((draft, i) => {
      pages.push({
        ...draft,
        key: `${id}-${i}`,
        chapter: id,
        folio: pages.length + 1,
        count,
        deal: id === "cats" ? dealt : "",
      });
    });
  }
  return { up, pages, first };
}

/**
 * The page an anchor is on: the last page of its chapter that starts at or
 * before it. An anchor past the end, as after a filter has shrunk the cats,
 * lands on the chapter's last printed page.
 */
export function pageAt(book: Book, at: Anchor): number {
  let found = book.first[at.chapter];
  for (let i = found; i < book.pages.length; i++) {
    const page = book.pages[i];
    if (page?.chapter !== at.chapter || page.body.kind === "blank") break;
    if (page.item > at.item) break;
    found = i;
  }
  return found;
}

export function anchorOf(book: Book, page: number): Anchor {
  const index = Math.max(0, Math.min(book.pages.length - 1, page));
  const found = book.pages[index];
  return found
    ? { chapter: found.chapter, item: found.item }
    : { chapter: "cats", item: 0 };
}

/** The pages that lie open with `page`: itself, or it and its facing page. */
export function spreadOf(book: Book, page: number): readonly number[] {
  if (book.up === 1) return [page];
  const left = page - (page % 2);
  return [left, left + 1];
}

/** The first page of the spread after or before `page`'s; `null` at an end. */
export function step(book: Book, page: number, dir: 1 | -1): number | null {
  const next = (spreadOf(book, page)[0] ?? page) + dir * book.up;
  return next < 0 || next >= book.pages.length ? null : next;
}

/** "Page 3 of 17", or "Pages 3 and 4 of 18" for a spread. */
export function readout(book: Book, page: number): string {
  const [left = page] = spreadOf(book, page);
  const total = book.pages.length;
  return book.up === 1
    ? `Page ${left + 1} of ${total}`
    : `Pages ${left + 1} and ${left + 2} of ${total}`;
}
