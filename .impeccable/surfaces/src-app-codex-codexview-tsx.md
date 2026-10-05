---
version: 1
slug: "src-app-codex-codexview-tsx"
primary_target: "src/app/codex/CodexView.tsx"
related_targets: ["src/app/codex/page.tsx","src/components/codex/CodexBook.tsx","src/components/codex/BookPage.tsx","src/components/codex/book.ts","src/components/codex/turn.ts","src/components/codex/useTwoUp.ts","src/components/codex/CatFilters.tsx","src/components/codex/FilterChips.tsx","src/components/codex/PieceList.tsx","src/components/codex/RivalList.tsx","src/components/ui/Modal.tsx","src/components/ui/pop.ts","src/components/AppShell.tsx","src/components/tower/TowerBackdrop.tsx","src/components/sprites/tower.ts"]
---

# Codex — surface brief

Scope: signed-in `/codex`. Visitor mode: Operate. Audience: a player between runs, or one who stepped off the table to look something up. Job: find a cat, a relic, a clan or a rival, read what it does, and see what is still locked and what unlocks it. Every entry comes from `src/server/game/*` and the account's unlocks; rivals are never locked.

## Direction contract

THESIS: The codex is a book in a room inside the tower, kept by The Archivist: it has the whole page, comes up shut out of the dark the camera came in through, opens by itself, and is read a page at a time. It refuses the long scrolling column of boards it replaces.

OWN-WORLD: Pieces on a Cream Table (DESIGN.md). The pages are cream boards with a print head; the cover is pressed cobalt; the chapters are table buttons tucked under the book's edge; cats are cards in pockets, relics and clans white tiles, a rival a white card with a coral plate. Behind it the inside of the tower, in the tower's own four greys. No gradients, no raster art, no emoji; the one thing here that turns in depth is a leaf.

STORY: Come in through The Archivist's window; the wall and the shut book come up out of the window's dark and its cover opens; pick a chapter from the tabs; turn through the cats four to a page and take one out of its pocket to read its whole card; filter them by element and rarity; read the relics, the clans, and the six rivals in the order a run meets them.

FIRST VIEWPORT: The ink lid (Codex in lime and pressed, Play in cobalt). Under it the stone wall and, a beat after it has come up out of the dark, the open book, filling the window: at 1440x900 a spread of the first eight cats with their whole cards printed (compact cards under 1280 by 848px), "Cats" at the head of the left page and "19 of 26" at the head of the right, with "Codex" on a cream plate and the four chapter tabs down the book's left edge, Cats in lime; under the book the pager ("Previous", "Pages 1 and 2 of 20", "Next") at the foot of the screen, and the filter board just under the fold. On a 375x667 phone: the plate, the four tabs in a row, and the first page down to the top of its second row of cats.

FORM: Not recorded in the build. The book was planned with the user on 2026-10-05 (four cats to a page, a card that comes out of its pocket, an opening on every visit with no press, both filters kept); no seed key, pin or comp was handed to the documenter.

FINISH: built and documented in DESIGN.md on 2026-10-05. Checked in Chromium at 375x667, 768x1024, 1024x768 and 1280x800; not checked in Safari or on an iOS device. No finish review is recorded here.

## Layout by width

- Under 768px: one page at a time, 480px wide at most. Above it the name plate, then the tabs in one row, 8px apart, 12px in from the book's corners.
- From 768px: a spread of two pages the width of the window, 1600px at most; the tabs still along the top, 128px wide at most. The book and its pager are one screen: the spread takes the height the lid, the tabs and the pager leave.
- From 1024px: the plate and the tabs stand in a column down the book's left edge, 12px apart.
- Every page is in one grid cell, so the book is as tall as its tallest page on every spread and under every filter.
- Per page: cats 4 (two by two) at every width; relics 4 on a single page and 6 on a page of a spread; clans 5 and 3; rivals 1. Two-up, a chapter with an odd number of pages ends on a blank page.
- The pager is a board the width of the book, 20px under it; the filter board is 20px under that, while Cats is open.
- Nothing is kept clear for the tower: the wall is behind the whole page. The room clips sideways at the column's outer edge.

## The pieces

- Cover: pressed cobalt, white text, an ink line let into its face, the book icon at 96px, "Codex" in print at 30px, "Everything on file." in 12px bold. Decorative.
- Name plate: the page's one h1 on a cream tile, print at 30px and 40px from 640px.
- Chapter tab: a medium table button; the open chapter lime, pressed in and current.
- Page: a board. Head: the chapter as an h2 in print at 30px (left page, or a single page) and its count in print at 20px (right page, or a single page). Foot: the page number in 12px bold soft ink at the outer corner.
- Pocket: a cat card that fills its share of the page. Unlocked, it is a button that lifts under a mouse and comes out as the full card in a dialog; its pocket is an empty tray well meanwhile. Locked, it is at 60% with its unlock hint and is not a button.
- Relic and clan tile, rival card: as they were (white; a relic led by its drawing, a clan by its element mark; the rival's sprite, "Match N", its coral plate, flavor, trait, deck table and head start).
- Pager: a board holding a cream "Previous" and "Next" with chevron key hints, and the readout between them in 14px bold.
- Filter token: white, 44px; lime with the cobalt chosen frame when set. "All" leads each row.

## Signature interaction

The book opening, then a page turning. Arriving, the camera goes in through The Archivist's window with the page put away; when it stops, on the window's dark, the wall and the shut book come up out of that dark together over 640ms, drifting closer, with one soft thud; the book lies for a beat, and its cover swings open onto the chapter asked for; the tabs slide out from behind it. After that a turn is two half-turns that meet edge-on: the page being left stands up about the spine, the page arrived at comes down on the other side. A tab, a button, an arrow key or a swipe turns one leaf, whatever the distance. Reduced motion has the book open and cuts between pages.

## Materials

Pages and the cover cast ink mixed 60% into deep stone, and so do the plate and the tabs, which stand on the wall and not on a board. A turning leaf is washed with flat ink, to 24%, and the page under it to 12%. Lime is the open chapter and a filter that is set; coral is a rival's plate; cobalt is the cover, and nothing else on the page takes it but the focus outline.

## States

- Loading: a cats page holds four card spaces in dashed outlines with blanks; a relics or clans page three blank lines. The rivals are already there.
- The cats, relics and clans did not load: each of those chapters is one page saying so, with the error's own message in soft ink and a medium cream "Try again". The rivals have their pages regardless.
- No cat matches the filters: the page holds a dashed outline with one sentence and a small cream "Clear filters"; the head reads "0 of 26 match".
- A cat is out of its pocket: the pocket is an empty tray well, and the focus comes back to it.
- First or last page: "Previous" or "Next" is disabled.

## Sound

A page turned is paper (`page`); the cover opening is `cover`, with the soft thud as it comes down; a cat taken out of its pocket is heard in its own voice, and putting it back is the falling click. Setting a filter token is the rising blip (`pick`). Everything else is the app's press, knock and hover tick, and the `menu` tune carried over from home.

## Unresolved

- The filter component and its inner control are still named `FilterChips` and `Chip` in code, though they are tokens now.
- The filters are under the book, not over it: over it they would push the cover off a phone's first screen and move the book whenever Cats is entered or left. On a phone that puts them a screen below the page they change.
- The book is as tall as its tallest page, which is a relics or clans page; at 1280px a cat card has spare room under its text.
- A turn to a far chapter is one leaf, not a riffle.
- Not checked in Safari or on an iOS device: the turn uses `perspective` with no `preserve-3d` or hidden backface to stay clear of the known trouble there.
- The room is reached through The Archivist's window, and through the first floor's if a gauntlet ever leaves The Archivist out. No gauntlet does today.
