---
version: 1
slug: "src-components-shop-shop-tsx"
primary_target: "src/components/shop/Shop.tsx"
related_targets: ["src/app/shop/page.tsx","src/app/shop/ShopView.tsx","src/components/shop/PackShelf.tsx","src/components/shop/PackWrapper.tsx","src/components/shop/PackReveal.tsx","src/components/shop/PackContents.tsx","src/components/shop/PieceTile.tsx","src/components/shop/packs.ts","src/components/shop/copy.ts","src/components/shop/reveal.ts","src/components/shop/useReveal.ts","src/components/shop/useOpenPack.ts","src/styles/globals.css"]
---

# Shop — surface brief

Scope: signed-in `/shop`. Visitor mode: Operate. Audience: a player between runs with coins a run paid. Job: see what each pack holds and costs, open one, turn its cards over, and go on to the deck or the profile with what came out. Every price, count and chance comes from `src/server/game/packs.ts` and the account's own shelf (`api.shop.packs`); the sentences are in `src/components/shop/copy.ts`.

## Direction contract

THESIS: The shop is a room in the tower with one board on its wall: a shelf of sealed packs, and when one is bought, its opening on the same board. It refuses a storefront: no money, no payment control, no badge, no countdown. Coins are earned at the table and nowhere else, and the board says so.

OWN-WORLD: Pieces on a Cream Table (DESIGN.md). Packs are crimped boosters in the colour of what is in them (an element's tone for a cat pack, Hadu's pink for Wardrobe, tower stone for Table and Tower), standing on a shelf drawn edge-on, each with a white price tag in print hung on the lip. A card face down is the player's own cobalt deck back with a white paw. The room's wall is the tower's stone, in the look the player wears.

STORY: Come in through The Archivist's window; read the name of the pack in the middle and what it holds; turn the row; look at what is in a pack; read in the rail what it costs and what you have; open it; watch its top come off and its cards dealt; turn them one at a time or all at once; read under each what became of it; go build the deck or try the pieces on, or open another.

FIRST VIEWPORT: The ink lid (Shop in lime and pressed, Play in cobalt, the coin chip, the player's hadu). On the stone wall: "Shop" in print on a cream plate, then the board: the shown pack's name in print at 30px with its one line, the row of packs on the shelf with the larger one in the middle and the price tags under them, the two chevrons with the packs' marks between, one line on what the pack holds for this account with "What is in it", the 12px line "Coins are won at the table and nowhere else. Nothing here is sold for money.", and the board's rail with its sentence and the cobalt "Open pack".

FORM: Not recorded in the build as a seed key, pin or comp. The builder's notes handed to the documenter named the room, the shelf drawn edge-on, the price tags on the lip, the wrappers' colours, the reveal's timings and the card back.

FINISH: documented from the build (commit `2dfa1c0`, tidied in `ef0da59`) in DESIGN.md on 2026-10-06. No finish review is recorded here.

## Layout by width

- The page is `in-room`: the plate, then one board 20px under it, in the 1180px content column.
- The pack stage is 312px tall and answers to its own width: packs 16px apart, 24px from 480px of stage, 40px from 900px, and from 1088px 20px apart with all seven whole. Below that the row is cut at the stage's edges; a 375px phone shows the pack in the middle and part of each neighbour. On a phone the stage runs out to the board's border.
- The rail is the board's own foot, stuck at `bottom: var(--dock-h)`: its sentence over its buttons on a phone, side by side from 640px.
- Dealt cards wrap in a centred row, each 130px to 168px wide, 12px apart, in a space at least 332px tall.

## Pieces

- Name plate, board head, pack, shelf and price tag, the panel under the row, the rail, card back, pull tag, piece tile, pack contents: see "Shop" in DESIGN.md.
- The pack in the middle is 192 by 276px and the others 128 by 184px. A pack with nothing left to find is printed dull under a white "Empty" strap.

## States

- Loading: the plate, and a board with blanks for the head, five dashed pack spaces on the shelf, and a rail holding blanks.
- The shelf did not load: a board titled "The shop is shut" with the reason and a cobalt "Try again".
- On the shelf, can open: "Open the Cinder Pack for 100 coins. You have 240." and "Open pack".
- Short of coins: the rail says by how many, and "Open pack" is held. With no coins at all, a dashed outline under the row says where coins come from, with "Play a run".
- Nothing left to find (a cosmetic pack): the pack is spent, the rail says "You have everything in this pack.", and "Open pack" is held.
- Opening: sealed, torn, drawn; the rail holds "Skip".
- Dealt: face-down cards; the rail holds "Turn them all" and "Turn a card" or "Turn a piece". A refund for a card not yet turned is held back from the balance, on the board and on the lid, until its card is up.
- All up: "Build your deck" or "Try them on", and "Open another".
- A pack already opened by the same request: a notice says nothing more was spent.
- Reduced motion: everything is face up at once.

## Motion and sound

- See "The packs" and "Opening a pack" under Motion in DESIGN.md: 460ms sealed, the strip off in 300ms and held 340ms, the card back up and held 380ms, then dealt; a turn is the 380ms flip; "Turn them all" goes 170ms apart.
- Turning the row is the rising blip; each cat turned up is heard in its own voice; a refusal is the buzz.

## Accessibility

- The row is a carousel whose packs are tabs with one tab stop; the panel under it is the tab panel. Each pack is named with its price and its state. The copies in shadow are inert and hidden.
- The board's heading takes the focus when a pack opens, and the focus is back on "Open pack" when the opening is put away. A card turned by its own press leaves the focus on what it became.
- Enter or Space turns the next card from anywhere that is not a control. The rail's sentence is read out when it changes.

## Carried, not canonized

- The loading shelf shows five pack spaces where the shelf holds seven packs.
