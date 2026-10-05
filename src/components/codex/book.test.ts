import { describe, expect, it } from "vitest";

import { CAT_LIST, getCat } from "~/server/game/cats";
import { RELIC_LIST } from "~/server/game/relics";
import { GAUNTLET } from "~/server/game/rival";
import {
  anchorOf,
  buildBook,
  CHAPTERS,
  filterCats,
  NO_FILTERS,
  pageAt,
  PER_PAGE,
  readout,
  spreadOf,
  step,
  type Book,
  type Shelf,
  type Up,
} from "./book";
import type { CodexEntry } from "./entries";

const entry = (id: string, unlocked = true): CodexEntry => ({
  id,
  unlocked,
  hint: unlocked ? null : "Win a run.",
  copies: null,
  cap: null,
});

const shelf = (status: Shelf["status"] = "ready"): Shelf => ({
  status,
  cats: status === "ready" ? CAT_LIST.map((cat) => entry(cat.id)) : [],
  relics: status === "ready" ? RELIC_LIST.map((relic) => entry(relic.id)) : [],
  rivals: GAUNTLET,
});

const pagesOf = (book: Book, chapter: string) =>
  book.pages.filter((page) => page.chapter === chapter);

const UPS: Up[] = [1, 2];

describe("buildBook", () => {
  it("deals every cat out once, four to a page", () => {
    for (const up of UPS) {
      const cats = pagesOf(buildBook(shelf(), NO_FILTERS, up), "cats");
      const printed = cats.filter((page) => page.body.kind === "cats");
      expect(printed).toHaveLength(Math.ceil(CAT_LIST.length / 4));
      const ids = printed.flatMap((page) =>
        page.body.kind === "cats" ? page.body.entries.map((e) => e.id) : [],
      );
      expect(ids).toEqual(CAT_LIST.map((cat) => cat.id));
    }
  });

  it("holds no more on a page than a page has room for", () => {
    for (const up of UPS) {
      for (const page of buildBook(shelf(), NO_FILTERS, up).pages) {
        if (page.body.kind !== "cats" && page.body.kind !== "relics") continue;
        expect(page.body.entries.length).toBeGreaterThan(0);
        expect(page.body.entries.length).toBeLessThanOrEqual(
          PER_PAGE[up][page.body.kind],
        );
      }
    }
  });

  it("starts every chapter on a left page when two are open", () => {
    const book = buildBook(shelf(), NO_FILTERS, 2);
    expect(book.pages.length % 2).toBe(0);
    for (const { id } of CHAPTERS) {
      expect(book.first[id] % 2, id).toBe(0);
      expect(book.pages[book.first[id]]?.chapter).toBe(id);
    }
    // 102 cats are 26 pages, four to a page: a whole number of spreads, so
    // the chapter ends on a printed page. An odd count ends on a blank back.
    const printed = Math.ceil(CAT_LIST.length / PER_PAGE[2].cats);
    expect(pagesOf(book, "cats")).toHaveLength(printed + (printed % 2));
    expect(pagesOf(book, "cats").at(-1)?.body.kind).toBe(
      printed % 2 === 1 ? "blank" : "cats",
    );
  });

  it("pads nothing when one page is open", () => {
    const book = buildBook(shelf(), NO_FILTERS, 1);
    expect(book.pages.some((page) => page.body.kind === "blank")).toBe(false);
  });

  it("numbers the pages from 1 and keys each one once", () => {
    for (const up of UPS) {
      const book = buildBook(shelf(), NO_FILTERS, up);
      expect(book.pages.map((page) => page.folio)).toEqual(
        book.pages.map((_, i) => i + 1),
      );
      expect(new Set(book.pages.map((page) => page.key)).size).toBe(
        book.pages.length,
      );
    }
  });

  it("gives every rival a page of its own, whatever has loaded", () => {
    for (const status of ["ready", "loading", "error"] as const) {
      for (const up of UPS) {
        const rivals = pagesOf(
          buildBook(shelf(status), NO_FILTERS, up),
          "rivals",
        );
        expect(rivals.map((page) => page.body)).toEqual(
          GAUNTLET.map((rivalId, i) => ({
            kind: "rival",
            rivalId,
            match: i + 1,
          })),
        );
      }
    }
  });

  it("stands a page in for a chapter that is loading or did not load", () => {
    for (const up of UPS) {
      const loading = buildBook(shelf("loading"), NO_FILTERS, up);
      const failed = buildBook(shelf("error"), NO_FILTERS, up);
      for (const id of ["cats", "relics"] as const) {
        expect(pagesOf(loading, id)[0]?.body.kind).toBe("loading");
        expect(pagesOf(loading, id)).toHaveLength(up);
        expect(pagesOf(failed, id)[0]?.body.kind).toBe("error");
        expect(pagesOf(loading, id)[0]?.count).toBe("");
      }
    }
  });

  it("prints one page saying so when no cat matches", () => {
    const none = { ...shelf(), cats: [] };
    const cats = pagesOf(buildBook(none, NO_FILTERS, 1), "cats");
    expect(cats.map((page) => page.body.kind)).toEqual(["empty"]);
    const spread = pagesOf(buildBook(none, NO_FILTERS, 2), "cats");
    expect(spread.map((page) => page.body.kind)).toEqual(["empty", "blank"]);
  });

  it("counts what is unlocked, or what matches once a filter is set", () => {
    const some = {
      ...shelf(),
      cats: CAT_LIST.map((cat, i) => entry(cat.id, i < 15)),
    };
    const all = buildBook(some, NO_FILTERS, 1);
    expect(pagesOf(all, "cats")[0]?.count).toBe(`15 of ${CAT_LIST.length}`);

    const filters = { element: "flame" as const, rarity: null };
    const flame = CAT_LIST.filter((cat) => cat.element === "flame").length;
    const filtered = buildBook(some, filters, 1);
    expect(pagesOf(filtered, "cats")[0]?.count).toBe(
      `${flame} of ${CAT_LIST.length} match`,
    );
    expect(pagesOf(filtered, "rivals")[0]?.count).toBe(
      `${GAUNTLET.length} matches`,
    );
    // Only the cats are dealt again by a filter.
    expect(pagesOf(filtered, "cats")[0]?.deal).not.toBe(
      pagesOf(all, "cats")[0]?.deal,
    );
    expect(pagesOf(filtered, "relics")[0]?.deal).toBe(
      pagesOf(all, "relics")[0]?.deal,
    );
  });
});

describe("filterCats", () => {
  it("keeps the cats that are both things asked for", () => {
    const entries = shelf().cats;
    expect(filterCats(entries, NO_FILTERS)).toHaveLength(CAT_LIST.length);
    const kept = filterCats(entries, { element: "mist", rarity: "common" });
    expect(kept.length).toBeGreaterThan(0);
    for (const { id } of kept) {
      expect(getCat(id).element).toBe("mist");
      expect(getCat(id).rarity).toBe("common");
    }
  });
});

describe("finding a page", () => {
  it("finds the page a thing is on, and comes back to the same anchor", () => {
    for (const up of UPS) {
      const book = buildBook(shelf(), NO_FILTERS, up);
      book.pages.forEach((page, i) => {
        if (page.body.kind === "blank") return;
        expect(pageAt(book, anchorOf(book, i))).toBe(i);
      });
      // The sixth cat is on the second page, four to a page.
      expect(pageAt(book, { chapter: "cats", item: 5 })).toBe(1);
      expect(pageAt(book, { chapter: "rivals", item: 0 })).toBe(
        book.first.rivals,
      );
    }
  });

  it("stops at the chapter's last printed page when a filter shrinks it", () => {
    const filters = { element: "flame" as const, rarity: null };
    for (const up of UPS) {
      const book = buildBook(shelf(), filters, up);
      const last = pageAt(book, { chapter: "cats", item: 24 });
      expect(book.pages[last]?.chapter).toBe("cats");
      expect(book.pages[last]?.body.kind).toBe("cats");
      expect(book.pages[last + 1]?.body.kind).not.toBe("cats");
    }
  });

  it("keeps a place when the book is laid out again for another width", () => {
    const narrow = buildBook(shelf(), NO_FILTERS, 1);
    const wide = buildBook(shelf(), NO_FILTERS, 2);
    // Relics are four to a page on a phone and six on a spread.
    const at = anchorOf(narrow, narrow.first.relics + 1);
    expect(at).toEqual({ chapter: "relics", item: 4 });
    const there = pageAt(wide, at);
    expect(wide.pages[there]?.chapter).toBe("relics");
    expect(there).toBe(wide.first.relics);
    const back = pageAt(narrow, anchorOf(wide, there));
    expect(narrow.pages[back]?.chapter).toBe("relics");
  });
});

describe("turning through the book", () => {
  it("lays one page open on a phone and two from a tablet", () => {
    const narrow = buildBook(shelf(), NO_FILTERS, 1);
    const wide = buildBook(shelf(), NO_FILTERS, 2);
    expect(spreadOf(narrow, 3)).toEqual([3]);
    expect(spreadOf(wide, 2)).toEqual([2, 3]);
    expect(spreadOf(wide, 3)).toEqual([2, 3]);
  });

  it("steps a spread at a time and stops at both ends", () => {
    for (const up of UPS) {
      const book = buildBook(shelf(), NO_FILTERS, up);
      expect(step(book, 0, -1)).toBeNull();
      expect(step(book, book.pages.length - 1, 1)).toBeNull();
      const seen: number[] = [];
      for (let at: number | null = 0; at !== null; at = step(book, at, 1)) {
        seen.push(at);
      }
      expect(seen).toHaveLength(book.pages.length / up);
      expect(step(book, seen.at(-1)!, -1)).toBe(seen.at(-2));
    }
    const wide = buildBook(shelf(), NO_FILTERS, 2);
    expect(step(wide, 1, 1)).toBe(2);
    expect(step(wide, 3, -1)).toBe(0);
  });

  it("reads out where the book lies open", () => {
    const narrow = buildBook(shelf(), NO_FILTERS, 1);
    const wide = buildBook(shelf(), NO_FILTERS, 2);
    expect(readout(narrow, 2)).toBe(`Page 3 of ${narrow.pages.length}`);
    expect(readout(wide, 2)).toBe(`Pages 3 and 4 of ${wide.pages.length}`);
    expect(readout(wide, 3)).toBe(readout(wide, 2));
  });
});
