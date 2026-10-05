---
version: 1
slug: "src-app-codex-codexview-tsx"
primary_target: "src/app/codex/CodexView.tsx"
related_targets: ["src/app/codex/page.tsx","src/components/codex/CatsSection.tsx","src/components/codex/FilterChips.tsx","src/components/codex/PieceList.tsx","src/components/codex/RivalList.tsx","src/components/tower/TowerBackdrop.tsx","src/components/sprites/tower.ts"]
---

# Codex — surface brief

Scope: signed-in `/codex`. Visitor mode: Operate. Audience: a player between runs, or one who stepped off the table to look something up. Job: find a cat, a relic, a clan or a rival, read what it does, and see what is still locked and what unlocks it. Every entry comes from `src/server/game/*` and the account's unlocks; rivals are never locked.

## Direction contract

THESIS: The codex is a room inside the tower, kept by The Archivist: everything on file, laid out on boards in front of a wall of deep stone and index cards. It refuses the list of white panels and pill filters it replaces.

OWN-WORLD: Pieces on a Cream Table (DESIGN.md), now the whole app: cream boards with a print title, white filter tokens, cat cards at card height, white relic and clan tiles, white rival cards with a coral plate. Behind them the inside of the tower, in the tower's own four greys with chipboard and cream cards on a shelf. No gradients, no raster art, no emoji.

STORY: Come in through The Archivist's window; read "Codex" and jump to a section; filter the cats by element and rarity and open one to read its whole card; read the relics and the clans; read the six rivals in the order a run meets them, each with its deck.

FIRST VIEWPORT: The ink lid (Codex in lime and pressed, Play in cobalt). Under it the stone wall, and on it a cream heading board: "Codex" in print, "Everything on file. Locked entries say what they want from you.", and Cats, Relics, Clans and Rivals as cream table buttons. Under that the Cats board: its title in print with its count ("12 of 26") at the right, a row of element tokens and a row of rarity tokens, one line of status, and the first rows of cat cards.

FORM: Not recorded in the build. This brief was written after the fact from the shipped code (commits `e86d9f3..4c973de`); no seed key, pin or comp was handed to the documenter.

FINISH: documented from the build in DESIGN.md on 2026-10-05. The finish review and its verdict are not recorded here.

## Layout by width

- One column of boards, 28px apart, in the app's 1180px column. Nothing is kept clear for the tower: the wall is behind the whole page.
- Cat cards, relic tiles and clan tiles: one across, two from 640px, three from 1024px, 12px between columns and 16px between rows.
- Rival cards: one across, two from 1024px.
- A filter group's label is in a 56px column to the left of its tokens from 640px, and on a line of its own above them on a phone.
- Below 768px navigation is the dock, and a notice lands clear of it.

## The pieces

- Heading board: the page's one h1, in print at 30px and 40px from 640px.
- Section board: a `Board` with its count in print at 20px.
- Filter token: white, 44px, 2px ink border, 14px bold; lime with the cobalt chosen frame when set. "All" leads each row. The group label is 12px bold soft ink, sentence case.
- Cat card: the card as everywhere, at card height, with its element's 4px edge down the left and the element mark leading the name; a locked card keeps both. Unlocked, it is a button that lifts under a mouse and opens the full card in a dialog (a board with a print title and a cream "Close"). Locked, it is at 60% with its unlock hint and is not a button.
- Relic and clan tile: white, the name in print at 20px (a clan's led by its element mark, a relic's by its own 32px drawing), the text in 12px; 60% and the unlock hint when locked, a relic's drawing greyed as a locked cat's sprite is.
- Rival card: white, card height: the 48px sprite, "Match N", the name in print at 20px on a coral plate with the ink Boss tag for a boss, the flavor line, the trait, the deck as a table ruled in 2px dashed lines, and a line on its head start.

## Signature interaction

Going in. A press on Codex puts the page being left away, and the camera pushes through The Archivist's window at 32 times the size, starting slowly, for 480ms. The Archivist is not at the window while it comes in. When the camera has stopped the wall cuts in at once and the boards land together with one soft thud. Leaving, the wall cuts away at the press and the camera comes out, ending slowly.

## Materials

Boards in the room cast ink mixed 60% into deep stone, not the cloth's cast. The wall is one tile, 32 tower pixels wide and 36 tall, repeated at the tower's pixel: deep stone, mortar in rib, a shelf in stone with a light-stone edge, and index cards in chipboard, cream and stone. Lime is a filter that is set; coral is a rival's plate; nothing else on the page takes either.

## States

- Loading: the Cats board holds six card spaces in dashed outlines with blanks; Relics and Clans are loading boards with blank lines. The rivals are already there.
- The cats, relics and clans did not load: one board says so, with the error's own message in soft ink and a medium cream "Try again". The rivals are shown regardless.
- No cat matches the filters: a dashed outline with one sentence and a small cream "Clear filters".

## Sound

Setting a filter token is the rising blip (`pick`). Everything else is the app's press, knock and hover tick, and the `menu` tune carried over from home.

## Unresolved

- The filter component and its inner control are still named `FilterChips` and `Chip` in code, though they are tokens now.
- A section link scrolls to its board with 80px kept above it for the lid; the scroll is the browser's own.
- The room is reached through The Archivist's window, and through the first floor's if a gauntlet ever leaves The Archivist out. No gauntlet does today.
