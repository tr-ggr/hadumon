---
version: 1
slug: "src-components-deck-deckbuilder-tsx"
primary_target: "src/components/deck/DeckBuilder.tsx"
related_targets: ["src/app/deck/page.tsx","src/components/deck/build.ts","src/components/run/CardStack.tsx","src/components/run/CatPick.tsx","src/components/codex/FilterChips.tsx","src/components/run/RunStart.tsx","src/components/run/DeckSpread.tsx","src/components/ui/Board.tsx"]
---

# Deck — surface brief

Scope: signed-in `/deck`. Visitor mode: Operate. Audience: a player between runs who wants to change what they bring to the next one. Job: see the 24 cards of the deck, take copies out, put copies in from the collection, and save. The rules of a deck (24 cards, at most three of a cat and one of a legendary, only cards owned) are `src/server/game/deck.ts` and `src/components/deck/build.ts`.

## Direction contract

THESIS: The deck is a room in the tower with two boards: the deck being built, as stacks in a tray, beside the collection it is built from. A press on a card of the collection puts a copy in and a press on a stack takes one out. It refuses a list editor: no drag handles, no steppers, no table of rows.

OWN-WORLD: Pieces on a Cream Table (DESIGN.md). A cat in the deck is a card stack as tall as its copies, standing in a tray well; a cat in the collection is its card, which is its own control; a filter is a token. One white card rail carries the one sentence and the one save.

STORY: Read the count; look over the stacks; filter the collection; press cats in until the dashed space is gone; read in the rail what still stands in the way; save.

FIRST VIEWPORT: The ink lid (Deck in lime and pressed, Play in cobalt). On the stone wall, from 1024px: the "Collection" board at the left with its filter tokens, the switch and the first rows of cards, and the "Your deck" board at the right with its count in print, its paragraph, the element counts and the tray of stacks; the white card rail at the foot with the sentence and "Save deck". On a phone: the "Your deck" board first, its tray scrolling sideways, then the collection, with the rail above the dock.

FORM: Not recorded in the build as a seed key, pin or comp. The builder's notes handed to the documenter named the two boards, the tray, the sticky deck board and the rail.

FINISH: documented from the build (commit `8d83093`) in DESIGN.md on 2026-10-06. No finish review is recorded here.

## Layout by width

- From 1024px: two columns 16px apart, the collection and a 392px deck board stuck 80px from the top, its tray wrapping and scrolling in place.
- Below 1024px: the deck board, then the collection; the tray is one row that scrolls sideways.
- Collection cards: two across, three from 640px, four from 1280px.
- The rail sticks 92px above the bottom edge on a phone and 16px from 768px: the sentence over its buttons on a phone, side by side from 640px.

## Pieces

- Deck board, collection board, rail: see "Deck Builder" in DESIGN.md. Card stack: see "Other Run Screens". Filter tokens and the switch: see "Filter Tokens".

## States

- Loading: two boards with their titles and blanks in the shape of stacks and cards.
- Did not load: one board with a sentence and "Try again".
- Unchanged: the rail offers "Get more cats" and a held "Save deck".
- Changed: "Undo changes" and "Save deck"; leaving the page is asked about first.
- Short of 24: a dashed space in the tray counts the cards still to add.
- Over 24: the count is on a marker and the deck cannot be saved.
- A press that does nothing (a fourth copy, a second legendary, a full deck): the buzz, and the rail says why until the next press that does something.
- No cat matches the filters: a tray well with one sentence.
- A run in progress: a line says the run keeps the deck it began with.

## Motion and sound

- Nothing plays by itself. A stack lifts under a mouse and its copies come out, as a stack does anywhere.
- A cat put in is heard in its own voice; a copy taken out is the falling click; a refusal is the buzz; a save is the two rising notes.

## Accessibility

- The tray is a list named with the deck's count. A stack's name says what a press does ("Take one out"). Info is a sibling of the card's own control, never inside it.
- The switch is a `switch`; the count of cats shown and the rail's sentence are read out when they change.

## Settled after the first pass

- The page's h1, "Deck", stands on a cream plate above the boards, as the shop's and the profile's do.
- An over-full deck's count is cream on ink. Coral is the rival's colour and is not used for the player's own problem.
