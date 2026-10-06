---
name: HaduMon
description: Die-cut cardboard pieces and pixel cats on one woven cream cloth, on every page and in every dialog, with a grey pixel tower standing behind the app on a rock in an evening sea.
colors:
  cream: "#fff8e7"
  sky-surface: "#a9ddf5"
  sky-soft: "#e7f7fd"
  cobalt: "#1557d8"
  cobalt-dark: "#0d3c9d"
  lime: "#d8ff4f"
  lime-deep: "#a3d900"
  coral: "#ff7163"
  ink: "#17212b"
  ink-soft: "#5b6c7d"
  white: "#ffffff"
  chipboard: "#b9a47e"
  sky-deep: "#73bde4"
  cloth: "#f4ead4"
  stone: "#9aa9b7"
  stone-light: "#d0dae2"
  stone-rib: "#6e7f90"
  stone-deep: "#3a4857"
  flame: "#f07b4d"
  mist: "#8acbe7"
  volt: "#f5c84c"
  thorn: "#77bd70"
  shade: "#8275c6"
  sprite-outline: "#1a1120"
  rarity-common: "#9aa9b7"
  rarity-uncommon: "#5cbf89"
typography:
  card-title:
    fontFamily: "ui-rounded, 'Avenir Next', 'Trebuchet MS', system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  body:
    fontFamily: "ui-rounded, 'Avenir Next', 'Trebuchet MS', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.45
  body-sm:
    fontFamily: "ui-rounded, 'Avenir Next', 'Trebuchet MS', system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.375
  caption:
    fontFamily: "ui-rounded, 'Avenir Next', 'Trebuchet MS', system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.375
  label:
    fontFamily: "ui-rounded, 'Avenir Next', 'Trebuchet MS', system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.33
  piece-label:
    fontFamily: "ui-rounded, 'Avenir Next', 'Trebuchet MS', system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.25
  piece-label-sm:
    fontFamily: "ui-rounded, 'Avenir Next', 'Trebuchet MS', system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 700
    lineHeight: 1.25
  print:
    fontFamily: "'Jersey 20', ui-rounded, 'Avenir Next', 'Trebuchet MS', system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.01em"
  print-lg:
    fontFamily: "'Jersey 20', ui-rounded, 'Avenir Next', 'Trebuchet MS', system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.01em"
  print-xl:
    fontFamily: "'Jersey 20', ui-rounded, 'Avenir Next', 'Trebuchet MS', system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.01em"
  wordmark:
    fontFamily: "ui-rounded, 'Avenir Next', 'Trebuchet MS', system-ui, sans-serif"
    fontSize: "96px"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.035em"
  lid-wordmark:
    fontFamily: "ui-rounded, 'Avenir Next', 'Trebuchet MS', system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.33
    letterSpacing: "-0.025em"
rounded:
  none: "0"
spacing:
  piece-gap: "6px"
  sm: "8px"
  table-gap: "10px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  page: "20px"
  board-gap: "28px"
components:
  cat-card:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "8px"
  info-button:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.piece-label}"
    rounded: "{rounded.none}"
    padding: "0 6px"
    height: "24px"
  board-row:
    backgroundColor: "{colors.sky-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "8px"
  board-slot:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    typography: "{typography.piece-label-sm}"
    rounded: "{rounded.none}"
    padding: "4px"
    height: "96px"
  board-slot-firing:
    backgroundColor: "{colors.lime}"
  die:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.piece-label-sm}"
    rounded: "{rounded.none}"
    padding: "6px 4px"
    height: "48px"
  die-selected:
    backgroundColor: "{colors.lime}"
  food-icon:
    backgroundColor: "{colors.flame}"
    rounded: "{rounded.none}"
    size: "16px"
  points-tag:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    typography: "{typography.card-title}"
    rounded: "{rounded.none}"
    padding: "0 6px"
    height: "24px"
  table-button:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 10px"
    height: "40px"
  table-button-hover:
    backgroundColor: "{colors.cobalt-dark}"
  table-button-secondary:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 10px"
    height: "40px"
  table-button-secondary-hover:
    backgroundColor: "{colors.sky-soft}"
  table-button-md:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.white}"
    typography: "{typography.card-title}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "48px"
  table-button-lg:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.white}"
    rounded: "{rounded.none}"
    padding: "0 24px"
    height: "56px"
  table-button-icon:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0"
    height: "40px"
    width: "40px"
  table-button-chosen:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 10px"
    height: "40px"
  table-button-danger:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.cream}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 10px"
    height: "40px"
  mat:
    backgroundColor: "{colors.sky-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
  mat-cost-tab:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    typography: "{typography.piece-label}"
    rounded: "{rounded.none}"
    padding: "0 6px"
    height: "24px"
  tray-well:
    backgroundColor: "{colors.cloth}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "6px 8px 10px"
  table-rail:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "10px 12px"
  lane-tile:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.white}"
    typography: "{typography.print}"
    rounded: "{rounded.none}"
    padding: "6px 10px"
    height: "60px"
  lane-tile-active:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
  lane-banner:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.cream}"
    typography: "{typography.piece-label}"
    rounded: "{rounded.none}"
    padding: "4px 6px"
  lane-space-empty:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "2px"
    height: "60px"
  trade-mark:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    typography: "{typography.card-title}"
    rounded: "{rounded.none}"
    padding: "0 2px"
    height: "24px"
  lane-space-placed:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    typography: "{typography.piece-label}"
    rounded: "{rounded.none}"
    padding: "4px 6px"
    height: "60px"
  lane-space-play:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "4px"
    height: "60px"
  reward-step-here:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    typography: "{typography.card-title}"
    rounded: "{rounded.none}"
    padding: "0 4px"
    height: "24px"
  round-tile:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "6px 8px"
  round-tile-current:
    backgroundColor: "{colors.white}"
  nameplate:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.ink}"
    typography: "{typography.print}"
    rounded: "{rounded.none}"
    padding: "4px 10px"
  score-token:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    typography: "{typography.print-lg}"
    rounded: "{rounded.none}"
    padding: "2px 8px"
  score-token-rival:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.ink}"
  pile:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.white}"
    rounded: "{rounded.none}"
    width: "36px"
    height: "48px"
  pile-rival:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.ink}"
  pile-face-up:
    backgroundColor: "{colors.cream}"
  turn-cube:
    backgroundColor: "{colors.lime}"
    rounded: "{rounded.none}"
    size: "12px"
  relic-tile:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.none}"
    padding: "4px 8px"
  relic-icon:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.none}"
    size: "32px"
  scorepad:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.none}"
    padding: "10px"
  gauntlet-marker:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.ink}"
    typography: "{typography.print}"
    rounded: "{rounded.none}"
    size: "28px"
  gauntlet-marker-won:
    backgroundColor: "{colors.lime}"
  key-hint:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.piece-label-sm}"
    rounded: "{rounded.none}"
    padding: "0 2px"
    height: "16px"
  lid-strip:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.cream}"
    rounded: "{rounded.none}"
    padding: "4px 20px 8px"
    height: "52px"
  dock:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "10px 8px 14px"
    height: "76px"
  title-plaque:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    typography: "{typography.wordmark}"
    rounded: "{rounded.none}"
    padding: "10px 36px 24px"
  title-ribbon:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    typography: "{typography.print-xl}"
    rounded: "{rounded.none}"
    padding: "10px 24px"
  stage-frame:
    backgroundColor: "{colors.cobalt}"
    rounded: "{rounded.none}"
    padding: "10px"
  board:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "20px"
  board-fold:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "56px 40px"
  dialog-board:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "20px"
    width: "448px"
  dialog-board-wide:
    width: "720px"
  pack:
    backgroundColor: "{colors.flame}"
    textColor: "{colors.ink}"
    typography: "{typography.print}"
    rounded: "{rounded.none}"
    width: "128px"
    height: "184px"
  pack-centre:
    typography: "{typography.print-lg}"
    width: "192px"
    height: "276px"
  pack-plate:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
  card-stack:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    typography: "{typography.piece-label}"
    rounded: "{rounded.none}"
    width: "96px"
    height: "128px"
  price-tag:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.print}"
    rounded: "{rounded.none}"
    padding: "0 6px"
    height: "28px"
  coin-chip:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    typography: "{typography.card-title}"
    rounded: "{rounded.none}"
    padding: "0 8px"
    height: "40px"
  card-back:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.white}"
    rounded: "{rounded.none}"
    padding: "8px"
    height: "216px"
  wardrobe-tile:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.piece-label}"
    rounded: "{rounded.none}"
    padding: "8px 4px 6px"
  wardrobe-tile-worn:
    backgroundColor: "{colors.lime}"
  deck-tile:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "2px 8px 2px 2px"
    height: "40px"
  deck-tile-stolen:
    backgroundColor: "{colors.coral}"
  book-page:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "20px"
    width: "480px"
  book-cover:
    backgroundColor: "{colors.cobalt-dark}"
    textColor: "{colors.white}"
    typography: "{typography.print-lg}"
    rounded: "{rounded.none}"
    padding: "10px"
  field:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "48px"
  filter-token:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "44px"
  filter-token-set:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
  toast:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
  toast-error:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.cream}"
  demo-slot:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    typography: "{typography.piece-label}"
    rounded: "{rounded.none}"
    padding: "4px 0 6px"
    height: "112px"
  demo-slot-firing:
    backgroundColor: "{colors.lime}"
  rival-fan-plate:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.ink}"
    typography: "{typography.print}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
---

# Design System: HaduMon

## Overview

**Creative North Star: "Pieces on a Cream Table"**

HaduMon is a board game laid out on a warm cream table, and the whole app is that table. There is one material: die-cut cardboard on a woven cream cloth. Everything a player can see or press is a piece of it: square corners, a 2px near-black border, a flat fill, a chipboard edge straight down, and an unblurred cast shadow. A cat card, a button, a text field, a dialog, a notice, and the navigation are all cut from the same card. There is no page chrome. Nothing is rounded, nothing has a hairline border, and nothing has a blurred shadow.

The scope is one class, `.tabletop`, and it is on the `body` (`src/app/layout.tsx`) together with the pixel face, so every page is cardboard and a dialog or a notice drawn on the body is cardboard like the rest. A run's table (`TableSurface`, on `/run`) is a tabletop of its own inside it, because it carries the fit and the layer its effects are drawn on. Outside a run a page is laid out at page scale from a few large things: an ink lid across the top, cream boards on the cloth, a sky mat, a cobalt stage frame. A board (`src/components/ui/Board.tsx`) is the page-sized cream sheet that everything else is set out on. It has a card's edge and cast but it is not a piece, so the buttons, cards and tiles on it keep their own edge.

The tower a run climbs is the app's backdrop. It stands behind every signed-in page that is not the table, showing the run as it stands, and each of those pages is a place at it: home is outside, with the whole tower in view; Play is the door, close on wherever the run has got to; the codex, the deck, the shop and the profile are rooms inside, reached through The Archivist's window. Going from one page to another moves a camera on the tower, and the page arrived at is set down when the camera stops. The tower stands on a rock in the sea under an evening sky, drawn in the same pixels, so home and the 404 are not on the cloth: they are pieces laid over that scene, as a title screen is. Nothing readable is set straight on the scene; it is always on a piece, a mat or a board. The cloth is still the ground of the landing page, of a run's table and inside a stage frame. The landing page, login and signup have no tower.

The match is a table you sit at, not a dashboard you read, and nothing of the app stands around it: a white rail down the left holds the rival and the rounds and, under an ink line, the player's turn (scores, food, prompt, confirm); the shared supply and the player's sky mat with three printed lanes lie on the cloth in the centre; a score sheet, the relics and the log stand in a slim column to the right; and the hand is held as a fan along the bottom edge. There are no panels, on the table or off it. Counts are tokens, piles, and cubes; what the board says about itself is printed on it in a pixel face.

The cats are 16x16 pixel sprites: chibi, front-facing, a near-black outline, three fur tones taken from the cat's element, and eyes tinted by rarity. Two are drawn from life and wear their own colours: Hadu, a black-and-white tuxedo with a pink nose, and Stussy, a ginger. Of the 102 cats, 75 are put together from a library of parts, one part to a zone of the grid, in one of their element's four coats (`src/components/sprites/cats.ts`, `palettes.ts`). They are drawn as inline SVG and scaled in whole pixels. The tabletop adds a small set of 8x8 pixel icons drawn the same way (yarn, a coin, a pack, die, paw, den, card, cached, tucked, goal, chevron, and for the lid and the table's corner buttons a speaker at full, quiet and off, two beamed notes and one note crossed out, home, play, book and exit), the seven food icons (beef, fish, chicken, dry food, pork, a treat, and a question mark for a cost any food pays), and the five element marks (flame, drop, bolt, leaf, crescent). The fifteen relics have a drawing each, on the cats' 16x16 grid in the icons' outline and one fill: the five charms are one pendant on a cord holding their element's mark, and the other ten are the thing they are named for (a steaming saucer, a ball of twine with a loose end, a whisker pad with a kinked whisker, a folded map, a buttoned cushion, a sun on the horizon, a collar and its tag, a ringing bell, a basket of yarn, a bed in a room's corner). The six rivals are sprites too, on the cats' grid and all in the rival coral, each told apart by what it wears; they are met at the windows of the tower a run climbs, which is drawn in the same pixels in four stone greys and stands behind the rest of the app. The player's own hadu is Hadu's sprite in what the player has him wear (`src/components/HaduAvatar.tsx`), and it stands wherever Hadu stood for them: on the lid, on home's mat, at the chest, on the tower. A chest, shut and open, is drawn on the larger 16x16 grid for the start of a run. The favicon is Hadu's face alone on a clear ground, built from his sprite by `pnpm favicon` (`scripts/favicon.ts`). Sprites, these icons, the tower and the scene it stands in are the only imagery. There are no photographs, no raster creature art, no gradients, and no emoji.

Density follows the game. The table is compact (10px between zones, 6px between pieces) because every rule the player needs has to be on the card or the board. Home, the codex, and sign-in breathe more: boards 28px apart, 16 to 20px of padding inside one. Copy is dry and factual, in sentence case.

There are coins, packs and looks, and none of them is for sale. A finished run pays coins; coins open packs in the shop; packs fill the collection a deck is built from and dress the player's hadu, board, cloth, tower and sky. Coins are only ever earned by playing and the game takes no money, and every surface that shows a coin or a pack says so in a plain sentence: the shop's board, the Coins step of a run's summary, the landing page's close. A coin is one pixel icon in gold beside a numeral, and there is no other money on any page: no price in a currency, no payment control, no premium finish. A look changes colours and a weave; it never changes a rule or how a piece is built.

The public landing page (`src/components/landing/LandingPage.tsx`, shown at `/` to a signed-out visitor) is the one Persuade surface. It is the tabletop at page scale, laid out as the front of the game's box, with no shell and no tower. From the top: an ink lid strip with the two account buttons; a full-bleed sky mat printed with paws and yarn; on it a cream title plaque with the wordmark and Hadu perched on top, a lime ribbon carrying the h1, and a thick cobalt stage frame holding one playable Hunt round run by the real match engine; a crowd of cats standing around the frame; then one cream board on the cloth, folded into four panels (the lead, the cats, the rows, the rivals); a sky closing band; and an ink footer. It is built from the table's own pieces (cat cards, dice, food tokens, the mat, tray wells, nameplates, turn cubes, score tokens, table buttons). It was the first page laid out at page scale, and the furniture it brought (the lid strip, the plaque and ribbon, the stage frame, the board, the crowd) is now the whole app's.

**Key Characteristics:**
- Warm cream cloth under the table and the landing page; sky blue for mats and bands; an evening sky and sea behind home.
- One material: square 2px-ink cardboard pieces with a straight-down edge and an unblurred cast, on every page and in every dialog.
- A board is the page-sized cream sheet that pieces are set out on. It is not a piece.
- The grey pixel tower stands behind every signed-in page but the table, and those pages are places at it: outside, the door, a room.
- Cobalt is the action, lime is the player's, coral is the rival's, ink is the act that cannot be undone.
- 16x16 pixel cats, rivals and relics, 8x8 pixel icons and one grey pixel tower on its rock in a pixel sea, as inline SVG, the only imagery.
- One rounded bold type voice, plus a pixel print face at 20px and 30px, and at 40px for a page's one heading.
- The landing page is the front of the box: lid strip, sky mat, title plaque, lime ribbon, cobalt stage frame, a crowd of cats, one folded cream board.
- Every state has a border, fill, or height change, never colour alone on text.
- Coins are earned at the table and nowhere else, and nothing is sold for money: wherever coins or packs are shown, a sentence says so.
- A player's look repaints the board, the cloth, the tower's stone and its sky, and never how anything is built.

## Colors

A light, warm palette: one cream cloth, one blue family for structure and action, two loud accents with fixed owners, three cardboard shades, four stone greys that belong to the tower and its scene, and five element hues that belong to the cats.

### Primary
- **Action Cobalt** (`cobalt`): the one way forward of a page or a dialog ("Start a run", "Continue run", "Sign in", "Back home"), Play on the lid and the dock, and the focus outline. At the table: the one confirm, a lane's activate tile, the back of the player's deck, and the frame of any piece that is open to pick, chosen, or due. On the landing page: the band of the stage frame, the demo's confirm, Sign up, and every "Start a run". Also the rare rarity colour.
- **Pressed Cobalt** (`cobalt-dark`): hover on cobalt buttons and tiles.

### Secondary
- **Chosen Lime** (`lime`): the player's colour. The points tag on a cat card, a selected die, a kept food, food given up in a swap, the "Play here" space, the marker on a lane's current reward step, turns still to play, the player's score token and yarn, the player's goal marker, a cat while its power fires, a lane's activate tile while that lane resolves, won matches on the gauntlet track, new unlocks, the relic taken from the chest. Off the table it is the same idea: the page you are on in the lid and the dock, a filter that is set in the codex or the deck builder, the piece in force on the profile and the player's name on its plate there, the "New" tag under a card out of a pack, the "Yours" tag in a pack's contents, the copies tag on a cat owned in the codex, a pennant on the tower, and the tag of a run that was won in the record book. On the landing page it is the same things at the demo's scale (the player's score token, chosen dice, the firing slot and its power line, turn cubes, the goal result), what the visitor has picked in a showcase (the chosen cat, its element, the chosen lane), and once something that is none of these: the ribbon under the wordmark, on the landing page and on home. Also the text selection colour. Always carries ink text.
- **Rival Coral** (`coral`): the rival's colour. The rival's nameplate, score token, deck back, yarn and goal marks, its goal marker, its lines in the event log, the last-move piece while the rival has just moved, the lane marks and yarn on its own board, the prompt line on the step the rival acts, and the rival currently across the table on the gauntlet track. As a run opens it is the tiles of the cards the rivals hold. On the landing page it is the six nameplates of the rival fan, the demo's nameplate, rival score token and just-made last move, and the nameplate in the close. Off the table it is the coming rival's nameplate on home, each rival's plate in the codex, and the "Lost to" tag in the record book, which names the rival that ended the run. It is also the "Mon" in the wordmark and the epic rarity colour. It is not the destructive colour.

### Tertiary
- **Element hues** (`flame`, `mist`, `volt`, `thorn`, `shade`): the primary fur tone of each element and the fill of its food icon and its element mark. The same tone is the 4px band down the left edge of a cat's card and of its tile on the board, and the fill of the mark on that element's charm. They appear only on sprites, food icons, element marks, dice faces, a cat piece's left edge, and a charm's drawing, never as page surfaces or text colours. Two exceptions are named: the evening sky behind the tower, which is the flame and volt families used as a ground, and a cat pack in the shop, whose wrapper is its element's tone all over with its print and its sealed bands in the element's lighter fur tone. Volt's value has one more use under a name of its own: it is the gold a coin is struck in (`COIN_COLOR` in `palettes.ts`), the fill of the coin icon and of nothing else.
- **Rarity marks** (`rarity-common`, `rarity-uncommon`, then `cobalt` for rare, `coral` for epic, `volt` for legendary): the 3px band across the top of a cat card.

Each element has two further fur tones used only inside sprites (`src/components/sprites/palettes.ts`): flame `#ffd36b` and `#b7492d`; mist `#e7f7fd` and `#3c83a8`; volt `#fff2a8` and `#1557d8`; thorn `#c9ec9b` and `#39734a`; shade `#c9c1f2` and `#40336d`. Rarity eye tints: common and uncommon `#5cbf89`, rare `#9ac4ff`, epic `#ffd7d2`, legendary `#fff0a8`. One cat is the exception: Hadu, drawn from the real cat the game is named after, has a palette of his own (`CAT_PALETTES`), because a black-and-white tuxedo is not an element's colours. Black fur `#2f2838`, white fur `#ffffff`, pink ears and nose `#f4a6b7`; the bell on his collar is the legendary eye tint. Stussy, the second cat drawn from life, has one too: ginger `#ec8a34`, cream `#ffe9c7` and the same pink. Every other cat wears one of its element's coats (`ELEMENT_COATS`); a cat built from parts wears the coat its recipe names, and one without wears the first, which is the element's three tones above.

### Neutral
- **Table Cream** (`cream`): the ground of the cloth, and the face of every board, dialog, card, placed tile, relic tile, title plaque, and cream table button. On ink it is the text colour.
- **Board Sky** (`sky-surface`): the mat (the match's, the menu mat on home, the hadu's mat on the profile, the chest's, and the mat a pack's cats are laid out on), the landing page's hero mat, closing band and the ground inside the cast frame, and the band behind the sign-in board.
- **Soft Sky** (`sky-soft`): hover fill for cream buttons and white pieces (a die, a filter token).
- **White** (`white`): text fields, filter tokens, dice, the scorepad, the event log, the current round tile, the relic and rival tiles in the codex, an owned piece on the profile, a pack's price tag, the coin token, the card rails of the deck builder and the profile, a notice, the match's rail and docked edge, the phone's nav dock, and small tags and key hints.
- **Ink** (`ink`): all primary text, and the 2px border of every piece. At 50% it is the dialog scrim; at 15 to 20% it is the dashed or faint rule inside a board or a card. As a fill it carries cream text: the lid on every page, the landing footer, the small inverse tag (Boss, Trim 1, 404), the destructive button (Log out, Abandon run), and a notice that reports an error.
- **Soft Ink** (`ink-soft`): secondary copy, labels, flavor text.
- **Sprite Outline** (`sprite-outline`): the outline pixel of every cat and pixel icon. Slightly warmer and darker than ink; used nowhere else.

Cardboard and stone:
- **Deep Lime** (`lime-deep`): the light behind the player's score while a chain of powers runs, and nothing else. Lime itself is lost on white and cream; this is the same hue taken down far enough to read as light there. It is never a fill and never text.
- **Chipboard** (`chipboard`): the cut edge under every piece and board, the outline of an empty yarn space, the paw on a face-up pile, the edge under the wordmark's letters, and some of the index cards on the wall inside the tower. Mixed into cream (42%) or white (34%) it is the cast shadow on the cloth and on a white rail; at 34% in cream it is the blank where something is still loading.
- **Deep Sky** (`sky-deep`): the cast shadow of a piece lying on the mat, the printed lines between lanes, the outline of a printed empty space, and a spent turn cube. It is also the paws and yarn printed on a sky band, and what the sign-in board casts on one.
- **Cloth** (`cloth`): the weave of the tabletop (a 16x8px brick of 4x2px marks on cream), the floor of a tray well, and the rival's last-move piece before it has moved.
- **Stone** (`stone`, `stone-light`, `stone-rib`, `stone-deep`): the tower, outside and in, the scene it stands in, and one piece that is the tower's own: the wrapper of the Table and Tower pack. A tower look repaints all four at once (see Looks). Stone is its body, light stone the lit left side, the ledges and the roof, rib the grooves and the shaded right side, deep stone the dark inside a window. Inside, deep stone is the wall of the room, rib its mortar, stone its shelf and light stone the shelf's lit edge. A board laid in the room casts ink mixed 60% into deep stone. In the scene the far bank of cloud is stone lit with light stone, the near bank is light stone lit with cream, and the top of the rock is deep stone. They are the only greys in the system; the first two are the common rarity's pair.

- **The scene's colours** (`src/components/sprites/scenery.ts`): no tokens of their own. The sky is ember (`#b7492d`, the Flame's dark fur tone) at the top, then flame, volt, and pale gold (`#fff2a8`, the Volt's light fur tone) over the sea. The sea is cobalt, deepening to pressed cobalt, with glints in board sky and soft sky. The rock is ink under a deep-stone top, and the near shore is the darker ink (`#0b1118`) that a piece casts on the lid.
- **Looks** (`src/components/skins/skins.ts`): no tokens of their own. A look the player wears sets custom properties on the `body` (`skinVars`: `src/app/layout.tsx` sets them for the first paint and `SkinProvider` after, so a dialog drawn on the body is dressed too). A board sets `--mat-fill`, `--mat-line` and `--mat-print`; a cloth sets `--cloth-fill`, `--cloth-shade`, `--cloth-weave` and `--cloth-size`; a tower sets the four `--color-stone*` tokens. `.tabletop`, `.cloth`, `.mat` and `.sky-band` read them with the values above as fallbacks, so the free look is the palette as it is written here, and a property is only set where the look differs from it. A sky is not a property: the scenery tiles are drawn in it. There are seven boards (sky, clay, moss, slate, rose, lilac, gilt), seven cloths, each with a weave tile of its own, seven towers and seven skies; the free ones are the sky board, the cream cloth, the stone tower and the evening sky. A board other than the sky one goes without the band's print of paws and yarn, which is in the sky board's own blue. Every colour of a look is a flat fill.

### Named Rules
**The Lime Is Yours Rule.** Lime marks something the player chose, holds, or won, and where the player is: the page you are on, a filter you set. It is never decoration and never the rival's. One exception is named: the ribbon under the wordmark, on the landing page and on home, which carries the page's h1 and is lime although it is nothing the player chose, holds, or won. No other surface takes it.

**The Coral Is Theirs Rule.** Coral marks the rival and what the rival does, at the table and off it: a nameplate, a plate in the codex, the tag of a run a rival ended. It never marks a decision the player owes, never a piece the player owns, and never a destructive act: Log out and Abandon run are ink. Text sitting on a coral fill is ink.

**The Waiting Piece Rule.** A piece of the player's that is waiting on an answer takes a cobalt frame with a lime inner line. A card marked for trimming takes the cobalt chosen frame and an ink tag. Neither takes coral.

**The Ink On Colour Rule.** Text on lime, coral, sky, cream, white, or an element hue is ink. White text appears only on cobalt. Cream text appears only on ink: the lid, the landing footer, the small ink tag, the destructive button, and an error notice.

**The Element Stays On The Cat Rule.** Element hues colour sprites, food icons, element marks, and dice, the left edge of a cat's own card and tile, and the mark a charm holds. Boards, buttons, and headings never take an element colour. The sky behind the tower is the one place an element's colours are a ground, and a cat pack's wrapper is the one piece whose face they are. A lane of a mat is printed with its habitat (a garden, a room, the rooftops at night), which is scenery in its own colours and not an element's: no lane is tinted to match a cat.

**The Coin Is Earned Rule.** A coin is the pixel coin icon in gold beside a numeral in tabular figures, on a white or a cream piece. It is never a price in money. A surface that shows coins or packs says in one sentence where coins come from, as the shop does: "Coins are won at the table and nowhere else. Nothing here is sold for money."

**The Printable Look Rule.** A look changes colour and weave and never construction. Every board and every cloth is light enough to print on in ink (7:1), the inside of every tower is dark and its stone runs in four steps, and every sky runs one way from its palest at the sea to its top. `src/components/skins/skins.test.ts` holds it.

## Typography

**Display Font:** the platform rounded face (`ui-rounded`, then Avenir Next, Trebuchet MS, system-ui)
**Body Font:** the same stack
**Print Font:** Jersey 20 (loaded with `next/font` in `src/styles/fonts.ts`, falling back to the display stack), on every page

**Character:** one bold, rounded, tightly tracked voice for names and numbers on a piece, the same face at regular weight for rules text and page copy, and a pixel face for what is printed: headings, names, numerals, totals. The rounded stack is a system stack, so that face differs by platform; see the note at the end of this section.

### Hierarchy
- **Wordmark** (800, 56px rising to 76px from 640px and 96px from 1024px, line-height 0.9, tracking -0.035em): the wordmark on the landing page's title plaque, cut like a piece: a 3px ink stroke painted under the fill, then a 3px chipboard edge and a 2px ink line as a straight-down text shadow. "Mon" is coral. On home's plaque it is the same cut at 48px, 64px from 1024px, and it is left out below 640px, where the lid carries the name. It appears once on a page.
- **Lid wordmark** (800, 1.25rem rising to 1.5rem from 640px, tracking -0.025em): the wordmark on the lid of every signed-in page and of login and signup, cream with "Mon" in coral, not cut. The pull quote in the landing page's cast panel takes the same two sizes at 700 in italics, balanced.
- **Print heading** (Jersey 20, 400, 40px from 640px, line-height 1, tracking 0.01em): the one h1 of a page outside a run: the ribbon on the landing page and on home, "Codex", "Shop" and "Profile" on their plates, the sign-in heading, the 404. On the landing page each panel's h2 too, the close included. Below 640px these are set at Print large.
- **Print large** (Jersey 20, 400, 30px, line-height 1, tracking 0.01em): the title of a board and of a dialog ("Record book", "Log out?"), a chapter's name at the head of a page of the codex and "Codex" on its cover, the two counts on home's codex board, the heading of a run screen ("Start a run", "They took eight", "Keep 5", "Take a card back", "Coins", "You beat Alley Tom"), the name of the pack shown at the head of the shop's board, the count of cards still to add in the deck builder, and the two score tokens. On the landing page: a heading on a phone, a boss's name and numeral in the rival fan, and the demo's two score tokens. At sign-in: the line in the picture from 1024px.
- **Print** (Jersey 20, 400, 20px, line-height 1, tracking 0.01em): on the tabletop, a lane's name on its activate tile, "Round 1", the rival's name on the nameplate, a tier's name, the numerals on the gauntlet track, the event log's heading, and score totals. In the codex, a chapter's count at the head of a page and the name of a relic and a rival. In the shop, a pack's price on its tag, the word on a wrapper's plate and a piece's name. In the deck builder, the deck's count. On the profile, the player's name on its plate, a board's owned count and a slot's name. On the landing page the same things, plus a rival's name and numeral in the rival fan and the lane's name in the lane showcase's readout.
- **Card title** (800, 0.875rem, line-height 1.25): a cat's or relic's name on its piece, the points tag, token counts, and the numerals of a reward step.
- **Body** (400, 1rem, line-height 1.45): page copy and dialog copy. Introductory paragraphs are capped near 65ch. On the landing page the lead is 1rem rising to 1.25rem from 640px, capped at 62ch, and panel copy is 1rem rising to 1.125rem, capped at 58ch.
- **Body small** (400, 0.875rem, line-height 1.375): most in-game prose: the prompt in the turn block (600), the rival's last card (900), result lines, table rows. The event log sets its lines one pixel down (13px, line-height 1.3).
- **Caption** (400, 0.75rem, line-height 1.375): rules text on a card, a goal on a round tile, relic text, score sheet lines, flavor text (italic).
- **Label** (700, 0.75rem, sentence case): the small heading above a group of pieces ("Feeder"), the second line of a lane's activate tile ("Take 2 dice"), the label beside a row of filter tokens (soft ink), and the text of a small table button (900).
- **Piece label** (700 or 900, 11px, ink): text that lives on a piece: the cat's name on a lane tile from 640px, the cost of an empty space, "You" and "Rival" above a score, the Boss tag, the Info button, a card's footer line.
- **Piece label small** (700 or 900, 10px, ink): the floor. A cat's name on a lane tile on a phone, the element's name on a die, a key hint, and below 640px the "Fires 1st" mark and the cat's name in the landing demo. Nothing readable is smaller.

### Named Rules
**The Two Sizes Of Print Rule.** The pixel face is drawn on a 20px grid, so it is set at 20px and 30px and nowhere between. One step is added, for a heading only: 30px on a phone and 40px from 640px, on the one h1 of a page outside a run and on each panel's h2 on the landing page. Print is for what is printed (names, numerals, totals, headings), never for a sentence of rules text or copy, and never for anything typed: a field's text and its label are the rounded face. These are sizes at the table's own scale: a fitted run screen (see Layout) magnifies them with everything else on it.

**The Numbers Line Up Rule.** Every score, count, and cost that can change uses tabular figures.

**The Sentence Case Rule.** Headings, buttons, labels, and tags are sentence case. Nothing in the build is set in uppercase: the filter group label and the Boss tag in the codex, once the two exceptions, are sentence case too.

**The Rules Are On The Piece Rule.** A card states its own cost, points, and power in words. Type on a piece may get small, but it stays ink and stays bold enough to read on a phone: 11px on a piece, 10px only for a lane-tile name on a phone, a die's name, and a key hint.

Note: the rounded stack is a system stack and has not been chosen as a brand face. Treat the weights, sizes, and tracking above as the system and the family as open. The print face is chosen: Jersey 20. Until a display face is chosen, the wordmark's die-cut treatment sits on whatever the platform supplies, which is a plain sans where no rounded face is installed; that is carried, not a rule.

## Layout

Mobile-first, and it must hold at 375px.

- **Shell.** Every signed-in page but the table has an ink lid stuck to the top, 52px tall, its content capped at 1400px with 8px side padding (20px from 640px): the wordmark, then from 768px the five ways about the app (Home, Play, Deck, Shop, Codex) as small table buttons 10px apart, then at the right the coin chip, the player's hadu, the speaker, the notes and Log out. The wordmark is left out between 768px and 1023px, where the five buttons need its room, and under 380px. Below 768px the five ways are medium table buttons in five equal columns, the icon over the label, in a white rail docked to the bottom edge, 76px tall plus the safe area. There is no side rail, no second bar and nothing floating. Login and signup have a lid of their own with no navigation, and the landing page has its lid strip.
- **The codex.** A book that has the page to itself: in the room the content column is the whole window, and the book with its pager is one screen of it, between the lid and the dock with 20px above and below (a phone's page is as tall as its cats need, which is more than a screen). The spread takes whatever height the tabs and the pager leave. Under 768px it lies open at one page, 480px wide at most, with its name on a plate above it and the three chapter tabs in a row along its top edge, 8px apart and 12px in from its corners. From 768px it is a spread of two pages the width of the window, 1600px at most, the tabs still along the top and 128px wide at most. From 1024px the plate and the tabs stand in a column down the book's left edge, 12px apart, each tab tucked 2px under the edge, and a row 42px tall is kept above the book for the cats' filters, which stand along its top edge as flags: the elements over the left page and the rarities over the right, 6px apart and 12px in from the page's corners (4px and 6px under 1280px), each tucked 2px under the edge. The row is kept whatever chapter is open, so the book never moves. The pager is a board the width of the book, 20px under it. Under 1024px, where the tabs have the top edge, the filters are a board 20px under the pager while the Cats chapter is open, which is the first thing under the fold. The room clips sideways at the column's outer edge, which leaves a turning leaf the gutter to swell into.
- **The deck.** In the room, in the content column: two boards and a rail (see Deck Builder). Below 1024px the deck board is first and its stacks are one tray that scrolls sideways, so the collection under it is never far. From 1024px the collection is the left column and the deck board a 392px column to its right, stuck 80px from the top of the window, its tray wrapping and scrolling in place (as tall as the window less 384px at most). The collection's cards are two across, three from 640px and four from 1280px, 12px between columns and 16px between rows. A white card rail sticks 92px above the bottom edge on a phone, clear of the dock, and 16px above it from 768px.
- **The shop.** In the room: the h1 on its plate, then one board, 20px under it. The pack row's stage is 312px tall and on a phone runs out to the board's border; it is clipped at its sides. The shelf's edge is under the packs, and under that the row's two chevrons with the packs' marks between them. The stage answers to its own width, never the window's: packs stand 16px apart, 24px from 480px of stage and 40px from 900px; from 1088px they stand 20px apart and all seven are on the shelf whole. Below that the row is cut at the stage's edges. The board's rail is the board's own foot, stuck to the bottom of the window above the dock (`bottom: var(--dock-h)`). Dealt cards wrap in a centred row, each 130px to 168px wide and 12px apart, in a space at least 332px tall, so the board is about as tall with the cards on it as with the shelf.
- **The profile.** In the room, capped at 1180px. From 1024px an 18rem column (the plate, the hadu's mat, the status card) is stuck 20px under the lid beside the two boards, which are 28px apart. Below that the three stack above the boards, and a white card rail carrying a 32px hadu and the sentence sticks above the dock as the deck's does. A slot's row is three tiles across, five from 640px and nine from 1280px, 8px between columns and 12px between rows.
- **Shell on the run route.** There is none: no lid and no dock, except while the camera is on its way to or from the table. The cloth runs edge to edge and top to bottom. Three 40px square cream pieces sit 8px from the top right corner of every run screen (the run's start, the chest, the opening hand, the match, reward pick, the run summary, and the loading and error states): Home, Codex, and Log out, which opens the same confirm dialog as the lid. On a fitted screen the corner is magnified with the rest of the table.
- **Landing page.** Full-bleed bands stacked in a column at least the viewport tall; the page clips sideways overflow, so cats may hang off its edges. In order:
  - *Lid strip.* Ink, its content capped at 1400px with 12px side padding (20px from 640px), 4px above and 8px below: one line of 12px bold cream text (14px from 640px) on the left, Log in and Sign up as small table buttons on the right.
  - *Hero mat.* A sky band with 8px side padding (16px from 640px), 80px above (84px from 1024px) and none below. Its contents are centred in one column: the plaque and ribbon, then the stage. The stage is the full width below 1024px, 800px from 1024px, 920px from 1280px, and 960px from 1536px (`--half` is half of that, so the crowd can stand against the stage's edges). The ribbon overlaps the plaque's foot by 12px, and the plaque and ribbon together overlap the stage's top by 24px and lie over it. The stage hangs 48px below the mat's bottom edge, over the board.
  - *The demo in the stage.* 8px side padding (12px from 640px), 28px above (24px from 1024px) to clear the ribbon. One column on a phone; from 768px two columns 16px apart, the row and feeder beside a 256px rival column (296px from 1024px), with 14px between pieces down a column. The two score tokens sit in a row under the columns; from 1024px they are docked on the outside of the frame's right edge, 24px down, one above the other.
  - *Board column.* On the cloth, 8px side padding (16px from 640px), 20px above, 64px below (96px from 640px), and one cream board capped at 1040px. The board is four folds. The lead plank has 64px above (to clear the stage) and 20px below (24px from 640px): the lead paragraph and a large "Start a run", stacked on a phone and side by side from 768px. Each panel fold has 16px side padding and 40px above and below (40px and 56px from 640px).
  - *Panels.* A panel is a heading and copy beside a picture in a stage frame. From 1024px it is two columns 40px apart, 1.15fr for the picture and 0.85fr for the text, and the picture alternates sides: left for the cats, right for the rows, left for the rivals. Below 1024px the text comes first and the picture follows 28px under it, with 40px more above the frame for the cat perched on it.
  - *Closing band.* A sky band under a 2px ink line, 16px side padding, 56px above and 160px below on a phone (the corner cats stand in that space), 80px and 96px from 640px. One cream board, capped at 576px and centred, with 20px by 32px padding (40px from 640px).
  - *Footer.* Ink, capped at 1400px like the lid, 16px above and below, 14px cream text.
  At 1440x900 the first viewport ends with the lead plank and its "Start a run".
- **Content column (home, the codex, the deck, the shop, the profile, the 404).** Centered, maximum 1180px, with 12px side padding rising to 20px at 640px, 20px above, and 112px below to clear the dock (48px from 768px).
- **The tower behind the page.** The tower's stage is fixed between the lid and the dock, under the page, the full width of the window. A page that is outside (home, the 404) keeps the tower's side of itself clear: its content stops short of the column's right edge by the tower's width (78 tower pixels) plus 16px, or plus 40px from 640px. The tower's pixel is 2px, then 3px from 640 by 720, 4px from 1280 by 940, 5px from 1680 by 1160 and 6px from 2000 by 1370, so the clear side is 172px on a phone and 274px at the first desktop step. On a phone only the first screen keeps clear: it is at least the height between the lid and the dock less 36px, so the menu beside the tower is the first screen, and what follows starts under it and runs the full width, over the tower as the page scrolls. On a phone at least 660px tall the page's heading runs the full width, above the roof. A page in the room (the codex, the deck, the shop, the profile) has the wall behind all of it and keeps nothing clear.
- **Login and signup.** A lid, then a sky band filling the rest of the window with its contents centred: one column capped at 920px, 12px side padding and 32px above and below (24px and 48px from 640px). Below 1024px the board is first and the picture follows 56px under it, 220px wide at most; from 1024px they sit side by side 48px apart, 1fr for the board and 0.8fr for the picture. On a window at least 700px wide and at most 560px tall the board starts at the top and the picture is left out.
- **Rhythm.** A 4px base. On the tabletop zones stack at 10px and sit 12 to 16px apart side by side; pieces in a grid sit at 6px (dice, lane spaces) or 12px (cards, which need room for their edge and cast). Home stacks its boards 28px apart, and its menu stacks its pieces 20px apart. The codex is one book: its pager and its filter board follow it 20px apart. A board's padding is 16px, 20px from 640px; the menu mat's is 12px, 20px from 640px.
- **The match table.** From 1024px the screen is a rail and a table. The rail is 312px wide, full height, white, with a 2px ink line on its right and no shade (nothing on the table is offset sideways). At its top: the gauntlet track with "Abandon run" on the same line, the rival stacked in three rows (nameplate; deck and bank piles with counts; last card), then the round tiles stacked. Under a 2px ink line at its bottom: the turn block, which reads both score tokens side by side, the food with the swap rule, the prompt, and its actions. Theirs is above the line, yours below. The table beside it has 12px side padding: the supply (a 256px column holding the feeder well and the player's deck and discard piles, beside the tray of three face-up cats), the mat, then the hand. From 1280px a 256px column to the right holds, under the corner buttons, the score sheet, the relic tiles, and the event log, which fills what is left and scrolls in place.
- **The match fits its window.** From 1024px wide and 600px tall (`fit-wide`) the whole match is one screen and the page does not scroll: `[data-match]` is the window's height, the rival's side of the rail scrolls in place over the turn block, the supply is 176px tall with a tray card's rules cut to the lines it has room for, the hand keeps only the strip its cards show, and the mat takes all the height that is left, up to 544px. That is a mat 388px tall at 1024x768, 390px at 1280x720, 402px at 1440x900, 544px at 1920x1080 and 220px at the floor, 1024x600. From 1024px to 1279px there is no room for the right column: a 40px bar over the mat holds a "Scores and log" button and the newest line of the log, with the corner buttons at its right end, and the button opens the table's sheet (see Table sheet). The window's size alone picks the layout (`run/layout.ts` says the same in numbers), so a short desktop window gets the phone's table.
- **The turn block.** In the rail the prompt keeps three lines (60px) and the actions keep two rows (94px) whether or not they are filled, so the block does not jump as the choice changes; on a screen under 848px tall only one action row is kept and a second pushes the block up. The block is rendered twice (in the rail and in the dock) and shown once.
- **The hand.** A fan along the bottom edge. Each card is placed about the middle one, a step apart: the step is 82% of a card's width when there is room, and shrinks so the fan always fits its width. A card leans up to 9 degrees and hangs up to 28px below the middle one, and later cards lie over earlier ones. Cards are 184 by 272px with 200px showing; the rest is under the edge of the screen. Beside the rail the hand has no dock: it is over the cloth and keeps only the strip its cards show. Where the mat is next to the hand, the mat's column leaves 88px under the mat, so a raised card never covers a lane. The card sizes are set on `[data-match]`, since the table reads them too.
- **A short screen beside the rail.** Full-size cards and the supply-above-mat order need the height to hold them: 848px from 1280px wide, 912px from 1024px. Under that the hand takes the phone's card (152 by 216px, 120px showing) and the mat stands above the supply, so the lanes are always clear of a raised card and it is the supply that a raised card stands over. In the rail every round that is not being played becomes one line: its number beside its goal's name, or beside the two markers once it is scored.
- **The match on a phone, turned.** A window on its side at least 720px wide and from 280px to 599px tall (`fit-compact`) is one screen too: three columns over a strip, 6px apart and 6px in from the edges and the safe areas. The supply is a 136px column: the feeder's dice as five 24px marks, which become 40px buttons while a Hunt chooses, the two piles, and each tray cat as a chip (32px sprite, name, points tag, Info). The mat has all the width left, never under 420px, with a 104px label column and a 32px end. The turn is a white card 140 to 208px wide: both scores, the food, the prompt, which takes the height left and scrolls, and the actions at its foot. Under them the hand is a strip 56px tall showing the top of each card, and beside it a cream "Round N, More" button that opens the table's sheet, which here also holds the corner buttons. Nothing rises out of the strip: the chosen card is stood up whole (136 by 208px) over the supply's column, where it covers neither the mat nor the turn, and a tap on it puts it back. 844x390 gives a mat 476 by 322px; 750x342, a phone with its browser's bars, 420 by 274px.
- **The match on a phone, upright.** A touch screen held upright, under 600px wide, whose longer side is at least 720px is shown a board on the cloth in place of the table (`TurnPhone`): "Turn your phone sideways", one sentence, and two buttons. "Go full screen and turn" is there only where the browser can do it (not on an iPhone); "Play upright anyway" is remembered (`hadumon:upright`) and gives the page that scrolls. The corner buttons stay over it. A phone too small to fit the table on its side (667x375, 568x320) is never asked.
- **The match that scrolls.** Any other window (a tablet upright, a narrow desktop window, a small phone, a phone played upright) is one column under 1024px: the gauntlet strip beside the corner buttons, the rival (nameplate and score token on one row, piles and last card on the next), the round tiles (only the current one below 640px), the mat, the supply, then the score sheet, relics, and log (capped at 320px). When a choice or a firing chain happens off screen, the zone it happens in is brought just clear of the docked edge in one cut, not a glide, and a lane comes with the whole mat when the gap can hold it. A fitted match has nothing out of view and does none of this.
- **A lane.** The mat is one grid and every lane, and the strip along its top, is a row of it that takes its columns (`subgrid`), so a cost tab is over its column at every width. From 640px the columns are the label (152px; 104px on a phone's table), four spaces and the lane's end (44px), 6px apart. Below 640px there is no label column: the tile and the banner lie side by side across the lane above its spaces, which are at least 96px tall, and the end is 28px. Where the page scrolls a lane is as tall as it needs and all three are as tall as the tallest; where the match fits its window the lanes share the mat's height out and each part of a lane is a measured container that prints what it has room for.
- **The docked edge.** Under 1024px the player's edge of the table sticks to the bottom of the viewport as a dock: white, a 2px ink line along its top. It holds the turn block (prompt, actions, then the food beside the lime score token) and under it the fan; from 640px the turn block is a 272px column beside the fan. Below 640px cards are 152 by 216px with 120px showing, and a strip of a card is never thinner than 44px: a hand too big to fit runs off the side and is panned. The dock grows to hold a chosen card whole.
- **Other run screens.** A centered column, maximum 1120px, 12px side padding rising to 20px at 640px, 56px above (clear of the corner buttons) and 32px below. The run's start ends in a rail docked to the bottom the same way: one sentence saying what will happen, and one cobalt confirm, stacked on a phone and side by side from 640px. The chest, the opening hand, reward pick and the run summary are walked one screen at a time, and each of their screens ends in the stepped rail: "Step 2 of 5" in 12px soft ink above the sentence, then a cream "Back" (absent on the first step) beside the cobalt button. On a phone the two buttons share one line under the sentence and the cobalt one takes the spare width. The climb is the one screen of a run with no column and no rail: it has the whole window (see Tower and Climb). A new step starts at the top of the page with focus on its heading.
- **The fit.** The column is 1120px wide however big the window is, so on a large one a column screen (the run's start, the chest, the opening hand, reward pick, the run summary, and the loading and error states) is magnified whole, as one piece: cards, print, borders, cast shadows, the corner buttons and the rail together. The step is the largest of 1.5, 2, 2.5 and 3 that the window has room for, where a step needs 1120px of width and 620px of height, both times itself: 1680x930, 2240x1240, 2800x1550, 3360x1860. Below the first the screen is as it always was. It is one CSS `zoom` on the table (`--fit` on the root, `table-fit` on `TableSurface`), so no component knows about it, breakpoints still read the window, and container queries still read the table's own lengths. The steps are halves so that a 2px line and a 16px icon land on whole pixels. On a fitted window the run strip stays at the top and a step shorter than the window sits in the middle of the space under it (the `fitted` variant); the run's start is not centred and starts at the top. The steps of the opening hand and reward pick fit a 1680x930 window, the fullest recap with almost nothing to spare; a first run's unlocks and a six-match summary scroll a little. The match and the climb fill the window their own way and take no magnification: the match fits its window by laying itself out to it (see "The match fits its window"). Every size in this document is at the table's own scale, before the fit.
- **Grids.** A page of the codex holds four cats two by two, 12px between columns and 16px between rows, which a card's edge and cast need; relics are one column on a single page and two on a page of a spread, and a rival has a page to itself (see Codex). Home's two boards sit side by side from 1024px, 1.5fr and 1fr. On the table, offers are three across from 640px, the opening hand five across from 1024px. The shop's packs are a row and not a grid (see Shop), and the stacks of a pack's cats are three across on a phone and six from 640px. On a run's start and at the chest, the tiers and the relics are three across from 640px. The feeder is always five dice across.
- **Targets.** Table buttons are 40, 48, or 56px tall; filter tokens 44px; a text field 48px; the lid's navigation 40px, and 48px in the dock; the lid's and the corner's icon buttons 40px square; dice 64px; a hand card's strip the height of the card and at least 44px wide on a phone; a lane's activate tile 48px (60px from 640px); lane spaces 60px (96px on a phone). On a fitted match a lane is as short as 60px and its tile and spaces with it; on a phone's table a die being chosen is 40px and a tray chip 44px. The Info control on a card is 24px tall with its hit area extended 8px on every side. A fitted run screen only makes these larger.
- **Keys.** On the match table the keys do what the pieces do: 1 to 9 pick a hand card (or a die, a tray card, or a placed cat while one of those is being chosen; 0 takes one more from the deck), H, D, and P activate a lane or play the chosen card into it, Enter confirms, Esc goes back. Each key is shown as a small hint on its piece, and only where the pointer is fine and can hover.

## Elevation & Depth

One model, on every page. A piece has thickness: a chipboard edge straight down, closed by a 2px ink line, and below it an unblurred cast shadow in a darker tint of whatever the piece lies on. Nothing blurs and nothing is offset sideways, at the table, on a page, or in a dialog.

### Shadow Vocabulary
- **Rarity band** (`box-shadow: inset 0 3px 0 <rarity colour>`): the strip across the top of a cat card. An inset band, not a shadow.
- **Element edge** (`box-shadow: inset 4px 0 0 <element hue>`): the band down the left side of a cat card and of a placed cat. On a card it is listed after the rarity band, so the top strip runs whole and the edge starts under it. Both bands sit under the chosen and due frames in the piece's shadow, so a cobalt frame is drawn over them on all four sides; the lime of a due frame covers the edge entirely, and the element mark still says it.
- **Piece** (`box-shadow: 0 calc(E + 2px) 0 -2px chipboard, 0 calc(E + 2px) 0 0 ink, 0 calc(E + L + 7px) 0 -2px cast`, where E is the piece's height and L its lift): the edge, the ink line under it, and a cast shadow that shows 3px at rest.
- **Pack edge** (no box shadow: five flat strips under one sawtooth mask, moved by `translateY`): a pack in the shop is cut along a crimp, which a box shadow cannot follow. Its top and bottom are fins of strips cut out by one tile of teeth, 16px across and 8px deep in 2px steps: the cut line, and the wrapper 2px inside it; under the bottom fin the chipboard edge moved down by E, the ink line by E + 2px and the cast by E + L + 5px, the last two 2px in from the sides, so the cast shows 3px at rest as a piece's does. They read the piece's own `--e`, `--lift` and `--sink` and move in the two steps a piece's shadow takes.
- **Mat** (`box-shadow: 0 5px 0 -2px chipboard, 0 5px 0 0 ink, 0 10px 0 -2px cloth cast`): the sky mat, a 3px board.
- **Tray well** (`box-shadow: inset 0 3px 0 0 cloth cast`): a recess, shaded along its top inner edge.
- **Rail** (`box-shadow: 0 -3px 0 0 cloth cast`): the docked edge of a match and the phone's nav dock, shading the cloth just above its ink line. The rail down the side of a match has an ink line and no shade.
- **Stage** (`box-shadow: 0 7px 0 -2px chipboard, 0 7px 0 0 ink, 0 14px 0 -2px cast`): the stage frame, on the landing page and around the sign-in picture: a 5px board with a 5px cast in the colour of what it stands on.
- **Board** (`box-shadow: 0 5px 0 -2px chipboard, 0 5px 0 0 ink, 0 10px 0 -2px cast`): every board: a page's, a dialog's, the landing page's folded board and the board in its close, and every page of the codex and its cover. The mat's shadow. The cast is cloth cast on the cloth, the darker ink over the tower's scene (home, the 404), deep sky on a sky band (the sign-in board, the landing close), a darker ink (`#0b1118`) under a dialog, and in the tower's room ink mixed 60% into deep stone.
- **Field** (`box-shadow: inset 0 3px 0 0 cloth cast`): a text field, a slot cut into the board and shaded along its top inner edge as a tray well is.
- **Hero mat edge** (`box-shadow: 0 3px 0 0 chipboard, 0 5px 0 0 ink, 0 10px 0 0 cloth cast`, under a 2px ink bottom border): the lower edge of the landing page's full-bleed sky mat where it lies on the cloth.
- **Fold** (`box-shadow: inset 0 3px 0 0` chipboard at 26% in cream, under a 2px ink top border): the seam between two panels of the landing board, shaded on its far side.
- **Crowd cast** (a flat bar, not a box shadow): under a standing crowd cat or oversized icon, and under the player's hadu on home's menu mat and on the profile's, one sprite pixel deep and ten wide (6.25% of the sprite's height, inset 18.75% from each side), in the cast colour of the ground.

- **Shelf edge** (not a shadow: one strip 14px deep, chipboard between two 2px ink lines, behind the packs' feet): the shop's shelf, a board seen edge-on. The price tags hang on its lip.
### Heights
- **Print (0).** Anything printed on the mat or on another piece: lane dividers, empty spaces, reward steps, markers on a round tile, a tag on a card. A piece nested inside a piece has no height of its own.
- **Token or tile (2px).** The codex's name plate and its chapter tabs, dice, a food token while it can be given up, turn cubes, lane tiles, placed cats, round tiles, relic tiles, table buttons, score tokens, gauntlet markers, the scorepad, the event log, filter tokens, a notice, the relic tiles in the codex, a deck spread's tile, an owned piece on the profile, the lid's coin chip and hadu, and the nameplate and coin token on the profile.
- **Card (3px).** Cat cards, the rival's last card, the match result sheet, the run summary sheet, the sheet that holds a run's coins, a rival's card in the codex, a card face down out of a pack and what it turns over to, and the card rails of the deck builder and the profile.
- **Stacks.** A pile's edge grows with its count (2px plus 1px per three cards, to 9px). A pack stands as tall as the pile of what comes out of it, by the pile's own rule. In a pack's contents a cat stands as tall as the copies the account holds, and one it holds none of lies flat. A stack of the copies of one cat stands a card's 3px and 1px more for every copy under the top one: 4px for two, 5px for three. A placed cat with cats tucked under it stands 4px, then 6px.
- **Page furniture.** The title plaque stands 5px and its ribbon 3px. The stage frame is a 5px board; every board is a 3px board like the mat, a page of the codex and its cover included. The codex's two open pages lap by their borders, so the spine is one 2px ink line with no shade: a shade there would be a sideways one. A board's height is not a piece's: nothing on it loses its own edge.
- **Cast colour.** On the cloth and on a board, chipboard at 42% in cream. On the mat, deep sky. On the docked edge, the side rail and the phone's nav dock, chipboard at 34% in white. On a sky band, deep sky; on the lid and the landing footer, a darker ink (`#0b1118`), which is also what a dialog casts on the dimmed page. In the tower's room a board casts ink mixed 60% into deep stone. On a page laid over the tower's scene (home, the 404) a piece, a board and a mat all cast the darker ink, whatever part of the sky or the sea they lie on.

### States of height
- **Liftable** (hover, fine pointers only): the piece rises 2px and its cast shadow grows by 2px.
- **Lifted** (chosen): the piece rises 4px and its cast shadow grows by 4px.
- **Raised** (a hand card that is hovered, focused, or chosen): the card loses its lean, stands clear of the bottom edge by 12px with its whole face showing, and lies over the rest of the hand. The cards beside it do not move.
- **Pressed** (active, or a lane tile while its lane is being chosen or resolved): the piece sinks 2px and its edge shortens by 2px.

### Named Rules
**The One Thickness Rule.** Every piece on every page has its edge and its cast, straight down and unblurred: on home, in the codex, at sign-in, in a dialog and in a notice as at the table. A piece printed on a piece has none of its own. A board is not a piece: it has a board's edge and cast, and the pieces on it keep theirs. No piece anywhere takes a blurred shadow or a sideways offset. One piece's outline is not four straight lines: a pack in the shop, crimped in a sawtooth along its top and bottom. Its edge and its cast follow the cut, and are still straight down and unblurred.

**The Frame Means State Rule.** A piece's state is its border: cobalt border for open to pick, cobalt border with a 2px cobalt inner line for chosen, cobalt border with a 2px cobalt and a 2px lime inner line for waiting on the player. A chosen piece is also lifted. No ring is drawn outside a piece's border. A pack is never chosen: the pack shown is the one in the middle of the row, and the marks under the row say which. A thing the account does not have is not a piece yet and has no frame: it is a dashed outline (see Shapes).

**The Three Heights Rule.** A thing on the table is print (0), a token or tile (2px), or a card (3px). Only a stack is taller, and its height is its count. The title plaque and the stage frame are the box's furniture, not things in play, and stand 5px.

## Shapes

One corner language: square. Nothing in the build has a radius; no stylesheet rule and no component sets one.

- **No hairlines.** Nothing has a 1px border around it but a small mark on a piece. A rule inside a board or a card is a 2px dashed line of ink at 15% (the rows of the record book, a rival's deck table) or a faint line of ink at 20% (inside a card).
- **Everything is square.** Cat cards, the mat, lanes, spaces, dice, tags, table buttons, text fields, filter tokens, boards, dialogs, notices, the lid's buttons, the plaque, the ribbon, and the stage frame have no radius and a solid 2px ink border. Small marks on a piece (a key hint, the cached and tucked tag, the Boss tag, the 404 tag) use a 1px ink border.
- **One edge is cut in teeth.** A pack in the shop is crimped along its top and bottom: a sawtooth 16px across and 8px deep, stepped in 2px squares, so it is still drawn in right angles and has no curve and no slant. Its sides are straight 2px ink, and nothing else in the build is cut this way. An empty pack space, while the shelf loads, is a 2px dashed ink outline at 35% with square corners.
- **Printed and empty spaces are outlines.** On the mat an empty space is a 2px deep-sky outline; the next free space is a 2px dashed ink outline (55%) over white at 45%. An empty pile and a rival yet to come on the gauntlet track are 2px dashed ink outlines (35 to 40%). A food the player holds none of is its own icon at 35%, so its place still says which food it is. The landing demo and the lane showcase print their empty spaces the same way. Off the table an empty state is a 2px dashed ink outline at 40%, and a card space still loading one at 30%. A piece of the wardrobe the account does not have is the same outline at 40% with its picture at 45%; the space in the deck's tray for the cards still to add is a dashed ink outline at 55% over white at 45%, as the next free space of a lane is.
- **Sprites are pixels.** A 16x16 grid drawn with crisp edges. Sizes in use in the app: 32, 40, 44, 48, 64, 72, 96, 144, and up to 320px. The landing page uses 32, 48, 64, 80, 96, 112, 128, 144, 160, 176, 192, 256, 288, and 320px, each a whole multiple of 16. The player's hadu is drawn at the largest whole multiple of 16 that fits its box: 32px on the lid, 64px at the chest, 64px and 96px on home, 128px and 160px on the profile. Its aura stands on a 24x24 grid behind it and reaches a quarter of the cat's edge past it on every side, so a box either leaves that much air or cuts the aura off.
- **Icons.** Every icon is drawn as pixels: an 8x8 grid shown at 16px (24px on a lane's activate tile), with an outline colour and one fill. A relic's drawing is the larger kind: a 16x16 grid shown at 32px, the size of a deck chip's cat, in the same outline and one fill. The lid, the dock and the corner buttons use them (a house, a triangle for Play, a card for Deck, a pack for Shop, a book, a coin, a door, the speaker, the notes). The chest is the larger kind, shown at 64px in a wood of its own (`#b98d55`), which is used nowhere else. A look's swatch is a third kind: a 12x12 picture of what the look dresses (a board's lanes, a cloth's weave, a tower's wall, a sky) in the look's three flat colours, shown at 48px in a 2px ink border, and at 36px in a pack's contents. There are no line icons; the password toggle is the word "Show" or "Hide". On the landing page three icons stand on the cloth as oversized members of the crowd, a die at 64px and yarn and a fish at 96px.

## Components

### Table Button
The app's one button (`TableButton`, `TableLink` and `tableButtonClass` in `src/components/ui/table.tsx`). An action is a piece, cut from the same card as everything else, at the table and on every page around it.
- **Shape:** square, 2px ink border, a 2px edge that sinks when pressed.
- **Sizes:** small 40px tall, 12px text, 10px side padding (the default); medium 48px, 14px text, 16px side padding; large 56px, 16px text, 24px side padding. Weight 900. The large size is the one way forward of a page: "Start a run" on the landing page, "Start a run" or "Continue run" on home, the submit at sign-in.
- **Primary:** cobalt with white text, hover to pressed cobalt. The one confirm of a decision: "Take 2 dice", "Start the match", "On to Madame Mittens". In a stepped rail it is also the one way forward: "Next", or "Skip" on a pick step with nothing chosen, or held and counting ("Keep 5 (3 chosen)") on a step that has to be settled before the next. The button in a rail is the medium size. Off the table it is the one way forward of a page or a dialog, and Play on the lid and the dock.
- **Secondary:** cream with ink text, hover to soft sky. Everything else: Back, Skip, Undo, "Place for me". On a cloth-coloured well it is white.
- **Chosen:** lime with ink text, and no change on hover. The one of a set that is in force: the page you are on, in the lid and the dock, where it is also held pressed in and marked as the current page.
- **Danger:** ink with cream text, hover to ink at 85%. Something is taken away for good: Log out and Abandon run, always inside a confirm dialog and always beside a cream way back that holds the focus. It is not coral, which is the rival's.
- **Disabled:** 45% opacity, not-allowed cursor.
- **Focus:** 3px cobalt outline, 3px offset. This is the global focus treatment for every focusable element, text fields included. On ink (the lid, the landing footer) the outline is lime, because the cobalt one is lost there.
- **Key hint:** a confirm carries "Enter" and a back carries "Esc" as a hint inside the button.
- **Link:** a link dressed as a table action is the same piece on a real anchor, in either variant and any size; it defaults to the medium cream button, which is what a link that leaves the table ("Open the codex") uses. On the landing page Log in is the small cream button, Sign up the small cobalt one, and "Start a run" the large cobalt one (medium inside the demo). On the lid the five ways are the small size with a 16px pixel icon before the label; in the dock they are the medium size with the icon over the label, which is 11px there.
- **Stepper:** a 40px white square piece for one more or one fewer.
- A way out of the run that is not a move in the game ("Abandon run") is an underlined 12px bold text link, not a piece. The ways off the table are the corner buttons.
- **Icon:** a 40px cream square holding one 16px pixel icon, with the action as its accessible name and tooltip. The corner buttons, and on the lid the speaker, the notes and Log out.

### Filter Tokens
A filter in the codex is a token, one row to a group, there only while the Cats chapter is open. The deck builder's collection has the same two rows on its board, and under them a switch cut the same way: a white tile 44px tall, "Show cats you do not own", lime with the chosen frame while it is on. From 1024px the two groups are flags along the book's top edge, one over each page; under that they are two rows on a board of their own under the book's pager.
- **Style:** a white tile, 44px tall, 12px side padding, 2px ink border, 14px bold ink text; it may lead with an element mark. Hover is soft sky. An "All" token leads each row.
- **Set:** lime with the chosen frame (a cobalt border and a 2px cobalt inner line), and reported as pressed. Setting one is heard as a pick.
- **Group label:** on the board, the 12px bold soft-ink label, sentence case, in a 56px column to the left of its row from 640px and on a line of its own above it on a phone. A row of flags prints none: the group is named for a screen reader only.
- **As flags:** the same tokens side by side with 6px side padding, sharing out the width of their page, centred; 12px text under 1280px. Their feet, edge and cast are behind the book.

### Board, Dialog, Notice, Blank
- **Board** (`Board`): cream, 2px ink border, a 3px board's edge and cast, 16px padding (20px from 640px). An optional title is an h2 in print at 30px across its top, with a count or one small control at its right end. It is the only container outside a run. It is not a piece, so the pieces on it keep their edge, and a board is never laid on a board.
- **Dialog** (`Modal`): a board, 448px maximum, or 720px for a pack's cards (`size="wide"`), over a 50% ink scrim, casting a darker ink; its title is print at 30px. Bottom-anchored on a phone, centered from 640px. Its buttons are medium table buttons: stacked on a phone with the confirm on top, right-aligned from 640px with the way back first. Dialogs opened from the table (a cat's full card, a scored round, abandon run) are the same board, and the card inside one is a piece with its edge like any other. Given a place it came from (`origin`), a dialog comes up from there and goes back to it: the codex's does, from a cat's pocket (see Motion). A pack's dialog has no row of buttons at its foot: a bar under its title holds what it needs and stays at the top of the sheet as the cards scroll under it, so the way out is in reach on a phone (see Shop). It is set down as a piece is when it opens. A button that is one of a roving set (`tabindex="-1"`) is not one of the stops the dialog keeps Tab between. One opened from a fitted run screen takes the same fit, so it matches the screen behind it, and still stops 12px short of the window's edges. A placed cat's dialog adds, under its card, a 14px bold line naming the cat and how many are tucked under it, then those cats as compact cards two across (one on a phone), oldest first.
- **Notice** (`Toast`): a tile that lands at the bottom of the screen, centred, 384px wide at most, 20px up and clear of the phone's dock. White with ink text, or ink with cream text for an error. One 14px semibold line and "Ok" in 12px bold underlined text. At most three, 12px apart; each leaves after 4 seconds.
- **Blank** (`Skeleton`): a block of chipboard at 34% in cream where something is still to be printed, with no border, dimming to 45% and back in 3 steps over 900ms. A loading board keeps its title and holds blank lines; cards still to come are card spaces in 2px dashed ink outlines (30%), each holding blanks.
- **Empty state:** a 2px dashed ink outline (40%) holding one line of copy and a small cream table button. Where there is nothing to do about it, one soft-ink sentence on the board.

### Inputs / Fields
- **Style:** a white slot cut into the board (`Field`): 48px tall, square, 2px ink border, a 3px shade along its top inner edge, 16px text, 12px side padding. The label sits above in 14px extra-bold ink. What is typed is the rounded face, never print.
- **Focus:** the global 3px cobalt outline. The border does not change.
- **Trailing control:** a field may hold one control at its right end. The password's is the word "Show" or "Hide" in 12px bold underlined text, with a target at least 48 by 40px. Where a password is typed twice, the first field has the control and it uncovers both.
- **Error:** a message below the fields as a white marker with a 2px ink border and 14px bold ink text. 44px is kept for it so the form does not jump. A form has one, for whichever thing is wrong first (a bad username, two passwords that differ, what the server said); a field does not carry a message of its own.
- **Strength meter** (`PasswordStrength`): under a new password's field, 8px down. Four segments in a row, 4px apart, each 12px tall and square with a 2px ink border, white until filled; then a word at the right end in 12px weight 900 ink, in a 64px column so the segments do not move when it changes. Too short (under 8 characters) fills none; Weak fills one in coral, Fair two in volt, Good three and Strong four in lime. The count and the word carry it, the colour only agrees. It is advice and stops nothing. The row is there before anything is typed, and the word is read out once when it changes.
- **Disabled:** 60% opacity.

### Navigation
- **Lid (every signed-in page but the table):** Home, Play, Deck, Shop and Codex as small table buttons with a 16px pixel icon each (a house, a triangle, a card, a pack, a book), from 768px. The page you are on is lime and pressed in; Play, when you are not on it, is cobalt; the others are cream. The lid follows where you are going, so its button answers the press before the page arrives. See Lid Strip and Footer for the rest of the lid.
- **Dock (below 768px):** the same five as medium table buttons in five equal columns 6px apart, each with its icon over its label in 11px, in a white rail fixed to the bottom edge with 8px side padding, 10px above and 14px plus the safe area below.
- **Corner buttons (run route only):** five cream icon table buttons 6px apart in the top right corner, in a `nav` named "Table": a speaker (the sound), two beamed notes (the music), a house (Home), a book (Codex), a door with an arrow (Log out). The run route has no other navigation, and the climb, which fills the window, leaves the corner out for as long as it plays. They are 40px at the table's scale and grow with the fit. The first two are not ways off the table. Each press of the speaker moves the sound on from full (two waves) to quiet (one wave) to off (crossed out) and back; each press of the notes turns the music off (one note, crossed out) or on again. In a match under 640px the corner holds the other three, the gauntlet track beside them needing the room, and the speaker and the notes sit side by side at the top right of the turn dock.
- **Wordmark:** "Hadu" in cream, "Mon" in coral, bold rounded, 20px and 24px from 640px, at the left of the lid. It goes home. It is left out between 768px and 1023px and under 380px.
- **Coin chip:** on the lid, a 40px cream piece holding the coin icon at 16px in gold and the balance in 14px at weight 900, tabular. It is a link to the shop, named for a screen reader ("240 coins. Open the shop."); hover is soft sky. It is there once the profile has loaded.
- **Hadu:** beside the chip, a 40px cream piece holding the player's hadu at 32px, its aura cut off by the piece, and from 1024px the player's name in 14px at weight 900, cut short at 112px. It goes to the profile, and on the profile it is lime and pressed in, as the page you are on.


### Cat Card
The signature piece. Cream face, 2px ink border, square, 8px padding, with the rarity band across the top and the element edge down the left. First line: the sprite (44px compact, 72px full), the name in the card-title style led by the cat's 16px element mark (read out and on hover as the element's name; the mark is no taller than the name's line, so it adds no height), the cost as a row of 16px food icons beneath it, and at the right the points in a lime tag with the capacity mark under it. The capacity mark is how much yarn the cat can hold: a 16px yarn icon, white with an ink outline because it is room for yarn and not yarn held, then the number in the card-title style, read out as "Holds 3 yarn". The tag and the mark together are as tall as the compact sprite, so the mark adds no height to a card. A compact card under 196px wide gives the name and cost a line of their own under the sprite and the points, so a name is never cut to a letter or two. Then, under a faint ink rule, the power written out in 12px text. A legendary adds its relic as a second 12px line under the power, starting "Relic: from now on". In a match, a hand card shows its cost with any discount from a legendary's relic already taken off. The full variant adds a soft-ink line for rarity, element, rows, and yarn capacity in words ("holds 3 yarn"), and the flavor text in italics; each row on that line is led by its lane's 16px mark, so the dialog is where the lane marks and the capacity mark are learned. A locked card drops to 60% opacity, greys its sprite, and shows the unlock hint in place of the power; it keeps its points, its capacity mark, its element mark and its element edge, which are printed facts. It stands at card height. A cat that lives in every row prints "lives in Hunt or Den or Prowl" on that line; that is carried, not a rule.

When a card is a choice (tray, offer, opening hand) the whole card is the select control, and its footer carries the lanes it can go in, the key that picks it, and a small white "Info" piece that opens the full card in a dialog and never selects. A lane is shown as the mark on its own tile (`ROW_ICONS` in `src/components/sprites/icons.ts`: a paw for the Hunt, a den for the Den, a card for the Prowl) at 16px, lime-filled with an ink outline (the paw is ink alone), with its name beside it in 11px bold soft ink. Where the names will not fit (measured against the footer's own width, by how many lanes there are) the marks stand alone, so three lanes on a narrow card never push Info or get cut short. The group is read out as one sentence ("Lives in the Hunt or the Prowl"). Open to pick: cobalt border. Chosen: cobalt border and inner line, lifted 4px, and the footer reads "Chosen" in cobalt.

The hand face is the card held in the fan: portrait, 184 by 272px (152 by 216px on a phone). The three numbers a player compares stand in the first 32px, which the thinnest strip of the fan still shows: the lime points tag at the top left, the cost under it as 16px food icons two across, and the capacity mark under the cost. The sprite (64px; 48px on the narrow card) stands beside them and the name runs under both, led by the element mark, which stands inside the strip with the element edge beside it, so a neighbour may cut the sprite and the name but never the numbers or the element. Under a faint ink rule the power and a legendary's relic are written out in 12px (11px and clamped on the narrow card: four lines of power, or three where the cost is over two food and so takes a second row of icons; a legendary gets two lines of power and two of relic, or one and two. Info has the rest). The key that picks the card is a hint standing on its top edge, above the points tag. The footer puts Info at the bottom left, inside the strip, and the lanes at the right, as the same marks (with their names where the card is wide enough). Only the strip takes the pointer or a tap, so sweeping along the fan raises one card after another; a chosen card on a touch screen is put back by tapping anywhere on its face. Open to pick (a tuck): cobalt border. Chosen: cobalt border and inner line, raised, and the footer reads "Chosen". A card that cannot be played now is washed with cream at 34%, which keeps its text above 4.5:1 (a see-through card would show the one under it) and its footer says what it lacks ("Not enough food", "No room", "Not enough yarn"); it stays selectable, so the prompt can say why, and the wash lifts while the card is raised. Keyboard focus is a 3px cobalt outline around the whole card.

### Food Icon, Element Mark and Food Token
Cats cost cat food, and each food is its own 8x8 pixel shape with an ink outline, filled with the primary fur tone of the element that eats it: Beef (Flame, a steak), Fish (Mist), Chicken (Volt, a drumstick), Dry food (Thorn, a full bowl), Pork (Shade, a rasher). A Treat pays for anything and is a white spark; a cost that any food pays is a white question mark. No square is drawn around a food. It is shown at 16px on cards and in lists and at 24px on a die or as a token, always a whole multiple of the grid. The code still calls food essence and keys it by element.

An element named on its own (a codex filter, a cat pack, a count in the deck) leads with its element mark instead: a flame, a drop, a bolt, a leaf, or a crescent, drawn and filled the same way at 16px. Every cat piece carries the mark of its cat's element: leading the name on a card, in the top left corner of a placed cat, and between the sprite and the count on a deck chip. Where no text beside it names the element, the mark is read out as the element's name or the piece's own label says it ("Flameclaw, Flame, details").

In the turn block the food the player holds is a row of 24px icons each followed by its count in the card-title style, with the rule "Any 2 food pay for 1 you lack." printed under the row in 11px soft ink. A food the player holds none of is its icon at 35% with a soft-ink 0. While a cat that is short is selected, each food that can be given up becomes a token-height button with the cobalt open frame; a food already given up fills lime with the chosen frame and its count shows what would be left. Tapping an open food gives one up; tapping one that can give no more takes it back.

### Die
A white square piece, 64px tall, holding a 24px food icon above the food's name in 10px bold. The name always keeps two lines of room ("Dry food" needs them), so every die in a row is the same width and the same height whatever it shows. Selected fills lime and lifts 4px; hover is soft sky. It is a button only while dice are being chosen. On the table the feeder's dice sit in a tray well.

### Mat, Tray Well, Rail
The three surfaces of the tabletop under the pieces.
- **Mat:** board sky, 2px ink border, a 3px board. Pieces on it cast deep sky. On the opening-hand screen it holds the round tiles, on home the menu, on the profile the hadu, at the chest the scene, and in a pack's contents the cats.
- **Player mat** (`mat mat-grid`, pieces in `src/components/mat/`): the mat laid out as the player's board, after the mat of base-game Wingspan. A strip of board sky along the top reads "Play a cat" in print at 20px over an 11px line, "Pay its food, plus the yarn over its column.", and carries a cost tab over each column: a cream plate 24px tall with a 2px ink border on three sides, standing on the line under the strip, holding one 16px yarn icon per yarn or the word "Free". Under it the three lanes, each printed with its habitat and divided by 2px ink lines. The same mat, from the same pieces, is the match's, the landing page's lane showcase and Hunt demo, and (with no strip, no rewards and coral marks) the rival's board. On a fitted match under 704px tall the strip drops its second line.
- **Tray well:** cloth, 2px ink border, a 3px inner shade along the top. It holds the feeder, an empty tray's message, and the strips of cats to pick from: the cast on the landing page, the cats in a pack, and the deck's stacks in the deck builder.
- **Rail:** white, a 2px ink line along its top, a 3px shade on the cloth above. The docked edge of a narrow match and the confirm rail of the other run screens. The shop's board ends in one: the board's own foot, stuck above the dock.
- **Card rail:** a white card-height piece with a 2px ink border that sticks above the dock on a page in the room and carries one sentence, read out when it changes: the deck builder's, with its one save, and under 1024px the profile's, with a 32px hadu. It is a piece, where a rail is an edge.
- **Stepped rail** (`StepRail`): the same rail for a screen that is one of several. Left: the step count as a label (left out when there is only one step) over the sentence. Right: a medium cream "Back" and the medium cobalt button. A step that is not settled yet holds the cobalt button alone, so "Back" still works (`nextDisabled`). Both are held while the last step's confirm is being sent.
- **Side rail:** white, a 2px ink line down its right, no shade. The left of a match from 1024px.

### Table sheet
Everything about the match that is not the mat, the supply or the hand, in the wide dialog (`TableSheet`): the gauntlet strip, the rival, the rounds, both score sheets, the relics and the log, under the round's number in print. A fitted table with no room for these keeps them here: behind "Scores and log" from 1024px to 1279px, and behind "Round N, More" on a phone's table, where it also holds the corner buttons. The rival's board opens over it, and Escape closes only the dialog on top.

### Lane
One of three lanes printed on the mat.
- **Habitat:** the scenery behind a lane (`src/components/sprites/habitats.ts`): a garden for the Hunt (pale sky with flat clouds, hedges behind a picket fence, a lawn with flowers), a room for the Den (pale volt wallpaper with a small motif, a shelf rail and a skirting board, floorboards with a rug), the rooftops at night for the Prowl (stars, the town's roofline with a few lit windows against its glow, scalloped roof tiles under a ridge). It is rows of legend characters drawn as crisp SVG tiles, as the tower's scene is, in bands: the ground along the lane's bottom edge, the horizon standing on it with the sky's change of colour behind as a dither, and the sky repeating upward over a backdrop colour. A taller lane shows more sky and a shorter one less; nothing is stretched. One scenery pixel is 2px, and 3px on a mat 960px wide (`--mat-px`), always a whole pixel. Each scene has its own colours, shares none with another, and says what a piece on its ground casts (shaded leaf, dark wood, ink). The Den's wall is volt paled, not cream, so a cream outline shows on it.
- **Nothing is written on scenery.** Every word and numeral in a lane is on a plate or a piece; an icon may stand on scenery alone, since it has both a fill and an outline.
- **Activate tile:** a cobalt tile with the lane's pixel icon (24px; 16px on a phone's table), its name in print at 20px, what activating gives now in 12px bold ("Take 2 dice"), white text, and under that in 11px where the lane has the height, where the reward comes from ("from the feeder", "on your cats", "into your hand"). While its lane is being chosen or resolved it is lime with ink text and pressed. The other tiles dim to 55% while a turn plays back.
- **Banner:** an ink strip with a 2px ink border under the tile, cream 11px bold: "Then fire this row's powers, right to left". It is for the eye; the lane's end says it aloud. On a fitted match it shows from a label 88px tall, and gives its room to the tile's trade line while a trade is open.
- **Placed cat:** a cream tile with the element edge down its left, the sprite (40px on a phone, 48px from 640px), the cat's name, and a yarn track. The cat's element mark stands in the tile's top left corner, unboxed and clear of the sprite; a phone's tile is too narrow for that, so the mark carries a 2px rim of the tile's cream (`.mark-rim`) and reads as a mark laid over the ear, not as part of the cat. The tile lays out by its own width: the sprite stands over the name, centred, until the tile is 168px wide, and only then are they set side by side, so a name is printed whole. In a fitted space under 88px tall the sprite is 32px, beside the name from 96px of width and over it under that; under 64px tall the yarn is a count ("2/3" after one yarn icon) and a narrow tile drops the name. The yarn track is one 16px yarn icon per space of capacity, lime with an ink outline when held, lime with a cobalt outline when chosen in a Den but not yet laid, a chipboard outline when empty. What the cat holds besides yarn (cached, tucked) is a small white tag on the sprite's corner. Tapping it opens the cat's card, which lists the cats tucked under it, or lays yarn during a Den (cobalt border while it can take one). Waiting on the player: the cobalt and lime frame. Firing: lime, pressed.
- **Empty space:** a 2px cream outline with the habitat showing through it. Stacked in its middle (side by side from 168px of width): the lane's mark at 16px on a small cream plate, the reward step, and the trade mark if the space has one. It prints no cost: that is on the tab over its column, and is still read out here ("Empty space 2. A cat costs 1 yarn here."). A fitted space under 84px tall drops the lane's mark.
- **Next free space:** the same, with a 2px dashed ink outline on a wash of white at 50%, and its reward step on the lime plate. When the chosen card can go there the space becomes a lime "Play here" piece with "Cat costs 1 yarn" or "Free" under it.
- **Reward step:** what the lane gives while that space is the next one. Up to four it is drawn out, one 16px icon of what is counted (die, yarn, card) for each; past four, in a space under 80px wide or in a fitted space under 72px tall it is a numeral in the card-title style and one icon on a cream plate. 24px tall. The step the lane is on has a lime fill and a 2px ink border. Only its sentence is read out ("With 2 cats here the lane gives 2 dice.").
- **Trade mark:** the second and fourth spaces of every lane are trade spots, and each prints what is paid, an arrow, and what it buys as three 16px icons on a 24px plate with a 2px ink border (a card for a die in the Hunt, any food for a yarn in the Den, a yarn for a card in the Prowl): cream and dashed while the trade is only printed there, solid lime once that space is the next one and the trade can be paid for. In a space under 68px wide it is "+1" and the icon of what it buys. While the trade can be made, the activate tile adds an 11px line under what it gives ("or 2 by trade"). The trade itself is made by tapping what pays for it while the lane is being chosen: a hand card for the Hunt, a food for the Den, a cat on the mat for the Prowl, each of which turns lime and pressed, and the prompt says what was paid.
- **Lane end:** a narrow strip at the lane's right edge holding one cream plate, stood on end: a cobalt pixel chevron pointing left (powers fire right to left), "Full" in 11px bold, the reward of a full lane as a numeral, and the icon of what is counted. Lime with an ink border once the lane is full.

### Round Tile and Turn Cube
Four tiles, one per round of eight, seven, six and five turns: stacked in the match's rail, and two across from 640px everywhere else (on the cloth above the mat from 640px to 1023px, and on a mat on the opening-hand screen). Each prints "Round n" at 20px, the round's turns as 12px cubes (lime piece for a turn still to play, a deep-sky outline once spent), the goal with its pixel icon and what it pays, and how the goal stands or went as a lime marker for the player and a coral marker for the rival. The current round's tile is white; the others are cream; a scored round drops to 80% opacity. In the rail a round that is not being played is cut down: 11px goal text, and a scored round keeps only its goal's name beside the two markers. On a short screen each of them is one line (see Layout).

### Rival Side
- **Nameplate:** a coral tile with the rival's name in print at 20px, an ink Boss tag (cream text, 11px) for a boss, and its trait in 12px bold. On the opening-hand screen it also prints the flavor line in italics. Across the table in a run it carries the tier and the level the rival plays at there as a white tag (ink border, 11px at weight 900) beside the name ("Stray, level 4 of 8"), which is all a tier changes. Off the table (the landing page, home) the plate has no tag.
- **Pile:** a 36 by 48px card back with a pixel paw and a white count tag on its top corner: cobalt for the player's deck, coral for the rival's hand and deck, cream for a face-up discard. Empty is a dashed outline.
- **Counts:** beside the two piles, two lines in 12px bold: cats out and turns left, then its yarn and goal points behind their coral marks and its food.
- **Last move:** a card-height piece saying what the rival did on its last turn in 14px at weight 900 ("Played Bramblepaw into the Den"), over a white secondary button, "See its board". Cloth before it has moved, cream after, coral for a moment when it has just moved. While a turn plays back it reads the step being shown.
- **The rival's board:** a wide dialog titled with the rival's name. A line with a coral "Level n of 8" marker and its trait; then a mat like the player's, three lanes each headed by the lane's mark in coral and its name, four spaces a lane: a cat is a cream tile with its element mark, a 40px sprite, its name, its yarn track in coral and any "Cached n · Tucked n" in 11px; an empty space is a dashed deep-sky outline. Under the mat, two columns: its hand, deck and discard as piles with the counts in a sentence and its tray as small cream pieces (a 24px sprite and a name), then its food as tokens and its relic as a relic tile. Its hand and the cats tucked under its cats are never shown. The one button, cobalt, goes back to the table.
- **Score token:** a tile with "Rival" in 11px bold over the score in print at 30px, coral. The player's, in the turn block, is the same in lime and reads "You". In the rail the two stand side by side at the top of the turn block, label left and score right, and the rival's side does not repeat its own. Both numbers roll to a new value instead of jumping to it, and the player's token has score heat behind it while a chain runs (see Motion).

### Scorepad, Relic Tile, Event Log
- **Scorepad:** a white tile holding both score sheets side by side: a lime "You" tag and a coral tag with the rival's name, the same six lines on each (cats, yarn, cached, tucked, goals, relics) in 12px divided by hairlines, the total under a 2px ink rule in print at 20px. The same sheets appear on the match result.
- **Relic tile:** a cream tile: the relic's drawing at 32px, then its name in the card-title style followed by its text in 12px. The drawing is decoration to a screen reader, since the name stands beside it. Its fill is read off the relic's own rule: a charm's mark is its element's hue, a relic that works on a lane (Ball of Twine, Bent Whisker, Night Map, Quiet Corner) is the lane marks' lime, and the rest are white.
- **Event log:** a white tile headed "What just happened" in print at 20px. The newest turn is at the top at full strength; older turns sit under a hairline at 75%. A power's line is plain ink; a note is soft ink; the rival's line is a coral marker and a scored goal a lime marker, each with a 2px ink border.

### Gauntlet Track and Run Strip
Six markers, 28px wide, numbered in print at 20px: a lime tile for a rival beaten, a coral tile for the one across the table (lifted) or the one that ended the run, a dashed outline for those to come. Bosses stand taller (36px). Beside it, the tier and the deck size in 12px soft ink ("Stray · 16 cards"), and "Abandon run" as an underlined text link that opens a confirm dialog. In the match's rail the strip is the track, the tier's name, and the link. On home the track alone lies on the menu mat from 640px, showing the run as it stands, or six dashed markers when there is no run; on a phone the tower beside the menu is the track.

### Tower and Climb
Between matches the run is shown as a tower, shot like a scene: a grey ribbed cat condo of six floors, the first match at the bottom, under a roof slab and on a foot that stands on a rock in the sea (see Where the Tower Stands). It is not a piece: it has no chipboard edge and takes no clicks. It is drawn as pixel rows in `src/components/sprites/tower.ts`, at the sprites' own pixel size, so a 16x16 sprite stands on it unscaled. That size is a whole number of screen pixels from 2 to 6, the largest the window has room for: the tower with a cat on its roof is 212 pixels tall and 78 across, the far shot has to show its whole height and the close shot, twice the size, its whole width. So a pixel is 3px from 636px tall and 468px wide, 4px from 848 by 624, 5px from 1060 by 780 and 6px from 1272 by 936; a phone held upright gets 2px.
- **Floor:** 28 pixels tall with a stepped round window; a boss's floor is 36 tall with a larger square window under a lintel, as a boss's marker stands taller on the gauntlet track. Each floor has a ledge to the left for Hadu.
- **Window:** a hole through the tower, deep stone inside. A rival still to be met looks over the sill (its top ten rows showing); the rival of the floor Hadu is on sits in it whole. A floor that has been won is dark and empty.
- **The hadu** is the climber: the player's own, in what it wears. It stands on the ledge of the current floor, at the foot before the first match, and on the roof after the last.
- **Pennant:** the 8x8 goal icon in lime, planted on the ledge of every floor won and on the roof when the run is won. It is the only lime on the tower.
- **Stage and camera:** the tower stands in a stage that is the whole window: fixed over it, edge to edge, with nothing of the table's corner showing. It has no frame, and the scene the tower stands in fills it. A climb's camera tilts up past the clouds into the sky. A camera looks at it: far back (the whole tower, as drawn) or close (twice the size, a whole multiple so a pixel at rest is still square), framing Hadu, one floor's window, or the roof. What it frames sits in the middle of the stage and 44% of the way down, which leaves the lower part to the title card. It is one transform on the tower, set from a few variables in tower pixels, and it comes to rest on a whole screen pixel. On a window narrower than the smallest close shot, the tower's left edge stops at the window's, so Hadu's ledge stays in the picture.
- **Bars:** two ink bars, each 11% of the window's height, slide in from its top and bottom edges whenever the camera is close and out again when it is far back. A jolt moves the tower and not the bars, so they never leave the edges.
- **Subtitle:** what is happening, in one sentence: 14px semibold cream on an ink chip, 448px wide at most, centred on the middle of the lower bar. With the bars in it reads as part of the bar; from far back it is a chip on the cloth. It is not shown while the title card is up, which says the same thing.
- **Skip:** one cream table button in the top right corner of the stage, where the corner buttons are on every other screen. It holds focus while the climb plays.
- **Title card:** on the last two beats a card lands over the lower bar, 448px wide at most: "Floor 3 of 6" in 12px bold, an ink "Boss" tag beside it for a boss, the rival's name in print at 30px, and its flavor line in 14px italics. It is a card-height piece in the rival's coral. At the roof it is lime, the player's, and reads "The top of the tower / The roof / All 6 floors are yours."; there it stands in front of the tower's lowest floor, after the camera has pulled back and shown all six pennants. The coral nameplate is not used on the climb.
- **Rival sprites** (`src/components/RivalSprite.tsx`, data in `src/components/sprites/rivals.ts`): Alley Tom (a bitten ear and a plaster), The Dockside Twins (two small cats, one in a striped cap), Madame Mittens (a feathered hat, pearls, white paws), The Rooftop Syndicate (a flat cap, two more heads behind), The Archivist (white spectacles and an index card), Old Nine Lives (a crown, one eye shut, white whiskers). Only a boss's sprite reaches the top row.

The tower behind the app. The same tower, scene, stage and camera (`src/components/tower/`) stand behind every signed-in page that is not the table. The climb is built from them and is as described above.
- **Standing** (`towerStanding` in `src/components/run/climb.ts`): the backdrop shows the run as it is. Until the run is known the tower is dark and nobody is on it. With no run, every rival looks over its sill and Hadu waits at the foot. In a match the floors below are flagged, that floor's rival is out in its window and Hadu is on its ledge. With a reward waiting, the floor just won is shut and flagged and he has not gone up yet. A run that was won has every pennant, the roof's too, and Hadu on the roof.
- **Backdrop stage** (`TowerBackdrop`): fixed between the lid and the dock, under the page, with no frame, filled by the scene the tower stands in. It takes no clicks and is hidden from assistive tech. Its pixel is a whole number from a ladder of its own, the largest at which the tower is seen whole beside a page: 2px, 3px from 640 by 720, 4px from 1280 by 940, 5px from 1680 by 1160, 6px from 2000 by 1370. It is not drawn while the table has the screen.
- **Outside** (home, the 404): the whole tower at life size, parked with its right side 20px in from the right edge of the 1180px column and its foot 14 tower pixels above the bottom of the stage, which leaves the rock and the sea in view. The page keeps that side of itself clear.
- **The door** (Play): a close shot, twice the size, on Hadu wherever the run stands, in the middle of the stage. It is seen while the camera is on its way to or from the table.
- **A room** (the codex, the deck, the shop, the profile): the camera goes in through The Archivist's window (the first floor's, should the Archivist not be in the gauntlet) at 32 times the size, until the window's deep stone fills the stage. The Archivist is not at the window while the camera comes in. When the camera has stopped, a wall cuts in at once and the outside is not drawn: deep stone with courses of mortar and a shelf of index cards in chipboard, cream and stone (`WALL` in `src/components/sprites/tower.ts`, a tile 32 tower pixels wide and 36 tall, repeated at the tower's pixel). On the way out the wall cuts away at the press. A board in the room casts ink mixed 60% into deep stone.
- **Zoom:** 1, 2 or 32, always a whole number, so a pixel at rest is square.
- **Looks:** the tower's front, the room's wall and the scenery tiles are drawn in the tower and the sky the player's look wears (`towerSkin`, `skySkin`): a tower is four steps of stone, and a sky is four colours with three for its clouds and four for its sea. What is written here and under Where the Tower Stands is the free look, the stone tower under the evening sky.

### Where the Tower Stands
The tower's ground, behind it on every page that shows it and in the climb: a rock in the sea under an evening sky (`src/components/sprites/scenery.ts`, drawn by `src/components/tower/TowerScenery.tsx`). It is rows of legend characters at the tower's own pixel size, as the tower is, and it is part of the tower's picture, so the camera magnifies it with the tower at whole numbers. It takes no clicks and is hidden from assistive tech.
- **Sky:** four colours, top first: ember, flame, volt, pale gold. Each turns into the next in a 4x4 ordered dither, a sixteenth more of the new colour a row, never a gradient: 20 rows of ember, 28 of dither, 56 of flame, 28 of dither, 34 of volt, 20 of dither, 22 of pale gold. Above that the sky is ember. The tile is 4 pixels wide.
- **Horizon:** 34 tower pixels above the ground the tower stands on.
- **Clouds:** two banks along the horizon, each a tile of round heaps that repeats sideways, lit along its top 2 pixels. The far bank is stone lit with light stone, 168 pixels wide and 56 tall, its foot 6 pixels under the horizon. The near bank is light stone lit with cream, 120 wide and 34 tall, its foot 2 under.
- **Sea:** a tile 32 pixels wide and 52 tall: cobalt, thick with two-pixel glints (board sky, and soft sky in the first 9 rows) just under the horizon and fewer further down, dithering to pressed cobalt from 18 rows down. Below the tile it is pressed cobalt and still.
- **Rock:** ink, with a deep-stone top 2 pixels thick. It is 3 pixels wider than the tower on each side at the top and steps outward as it goes down 150 pixels under the water. It is the tower's ground; the tower has no cast of its own.
- **Near shore:** the darker ink (`#0b1118`), rising to the left to 58 pixels above the tower's ground and running out into the sea 34 pixels short of the tower.
- **Pieces over it:** on a page that is outside, a piece, a board and a mat cast the darker ink. Text is never set straight on the scene.

### Other Run Screens
- **Tier pick:** on the run's start, under a 20px print heading "How hard": three cream tiles in a row from 640px and stacked below it, each at least 56px tall with the tier's name in print at 20px over its exact rule in 12px at weight 600 ("Rivals play at levels 2 to 7 of 8. Nobody gets a head start."). The chosen one is lime and pressed. The last tier chosen is offered again on the next visit, and the rail's sentence names it and the first rival ("Stray. First across the table: Alley Tom.").
- **Run start** (`RunStart`): the screen with no run in progress. An h1, "Start a run", in print at 30px over one paragraph; the tier pick; then "Your deck" in print at 20px over one 14px line, with a medium cream "Change the deck" link at its right, over the deck as a deck spread. The deck is changed on its own page, never here. A deck that cannot be played is said above the spread, one reason to a line, and the rail then reads "Mend the deck on its own page, then come back." The rail holds the one cobalt "Start the run", held until the deck is sound. While the deck loads, a tray well holds two blanks.
- **Deck spread** (`DeckSpread`): a list of cards as small tiles that wrap, 8px apart and 14px between rows. A tile is token height, at least 40px tall: the cat's 32px sprite, its element mark, and "2× Flameclaw" in 12px bold, tabular. Cream for the player's own cards; coral for cards a rival holds.
- **Chest** (`ChestScene`): how a run opens, three steps on the stepped rail. "They took eight": the stolen cards as a coral deck spread over the cards left as a cream one, each under a 12px bold label in soft ink. "A chest by the door": a sky mat 112px tall with the player's hadu at 64px beside the chest at 64px, and under it the three relics as cream tiles, three across from 640px (lime, framed and lifted when chosen); the step is held until one is taken. The recap, "Ready for <rival>", shows the relic as a relic tile with a small cream "Change" and one line on the deck. Only the recap carries the confirm, "Enter the tower".
- **Card stack** (`CardStack`): the copies of one cat as one stack. The top card is a small portrait face, 96 by 128px, with the card's own bands (rarity along the top, element down the left): a lime points tag, the element mark, the 64px sprite and the name at 11px. Under it is a plate for each copy beneath, to two: cream, 2px ink, the same bands, and not a piece, so a stack has one edge and its height says the rest. Each plate shows 6px more of its top edge than the one above it, and every stack keeps room for two, so singles and triples stand on one line. A stack of more than one carries the pile's white count tag on its top right corner, "×3", and the count is in its name ("Flameclaw, 3 copies. Show card."). In the deck builder a press on a stack takes one copy out instead, and a small white Info control under its bottom right corner opens the card.
- **Opening hand:** four steps under the run strip, each with a 30px print heading and one line of text. "Meet the rival": the rival's nameplate with flavor beside the round tiles on a mat. "On the table": the feeder, the deck pile, the tray and the relics as they will be on the table, to read and not to pick from. "Keep 5": the hand five across to keep from and five food tiles to keep from (white; lime, framed, and lifted when kept); the rail counts ("3 of 5 chosen: 2 cats, 1 food.", and "That is too many." past five) and its button is held, reading "Keep 5 (3 chosen)", until exactly five are chosen, when it reads "Next". Cats and food share the one step because they share the one budget. The recap, "Your opening hand", lists the cats kept as cards (Info still opens the full card) and the food kept as the same lime tiles, or "No cats." / "No food.", each with a small cream "Change" that goes back to the keep step, then a line saying the cats left behind go to the discard pile. Its rows run the width of the table (`wide` on `RecapRow`), where a reward's are capped at 320px. Only the recap carries the confirm, "Start the match". No step is ever left out.
- **Match result:** a white card-height sheet: the headline in print at 30px, the score in a lime marker for a win or a coral one for a loss, both score sheets, and the three goals in a sentence each. It is the first step after a match, alone on its screen.
- **Reward pick:** up to five steps under the run strip, each with a 30px print heading and one line of text: the match result; "Take a card back", three of the stolen cards as cards, to take one; "Take a relic", relics as cream tiles led by their 32px drawing (lime, framed, and lifted when chosen; a lime drawing on a chosen tile is carried by its outline); "Trim a card", the deck spread out as small tiles, each with its cat's element mark after the sprite (a tile marked for trimming turns white, takes the chosen frame and lift, and carries an ink "Trim 1" tag); and the recap. A step with nothing to offer is left out. The rail says what the step has settled ("No relic.") and its button reads "Next" with a pick and "Skip" without. The recap, "Ready for <rival>", lists each choice as the piece it is (a card, a relic tile, a trim tile) or as a plain line when it was skipped, each with a small cream "Change" that goes back to its step, then the deck size before and after. Only the recap carries the confirm, "On to <rival>".
- **Run summary:** up to four steps. The last match's result. "Unlocked", new unlocks as their own pieces, left out when the run unlocked nothing. "Coins", left out when the run paid none: the heading in print at 30px, one 14px sentence ("What the run paid. Coins open packs in the shop, and they are only ever earned at this table."), a white card-height sheet holding the coin icon at 32px in gold, the total and the word "coins", and a small cream "Open the shop". Only the total is shown, and nothing of how it is worked out. Then the summary: the headline in print at 30px, the gauntlet track, a white card-height sheet with the run as a table (won and lost as lime and coral markers), "Nothing new this time." when there were no unlocks, and a cream table link to the codex. The summary's rail button is "Start another run". An abandoned run has no result step. The coins total is set in print at 40px.

### Status Marks and Notices
- **Marker:** a fill with a 2px ink border, bold ink text, tabular figures; lime for the player, coral for the rival. Used for goal standings, results, and log lines.
- **Key hint:** a white 16px mark with a 1px ink border (60%) and a 10px bold letter, on the corner of the piece it works. Hidden unless the pointer is fine and can hover.

### Lid Strip and Footer
The lid of the box, top and bottom.
- **Lid strip:** an ink band with cream text, 4px above its content and 8px below, 52px tall with 40px buttons on it.
- **On the landing page:** left, one line in 12px bold (14px from 640px): "Free. Nothing to install. Nothing for sale." (the middle sentence drops below 640px). Right, Log in as a small cream table button and Sign up as a small cobalt one, 10px apart.
- **On a signed-in page:** stuck to the top. The lid wordmark, the navigation from 768px, then at the right the signed-in name in 14px bold, cut short where it will not fit, and three 40px cream icon buttons 6px apart: the speaker, the notes, and Log out, which opens its confirm dialog.
- **At login, signup, forgot password and reset password:** not stuck. The lid wordmark at the left and the other form at the right as a small cream table link ("Create one" at login, "Sign in" on the rest).
- **Footer:** on the landing page only. The same ink band, one 14px line and "Log in" as a bold underlined text link.
- **On ink:** a piece casts a darker ink (`#0b1118`), and the focus outline is lime, because the cobalt one is lost on ink.

### Title Plaque and Ribbon
The title of the box. On the landing page it lies over the top of the stage; on home it heads the menu.
- **Plaque:** a cream piece, 2px ink border, standing 5px, holding the wordmark. On the landing page: Padding 8px above, 20px below, and 20px at the sides; 10px, 24px, and 36px from 640px.
- **Hadu:** on the landing page the 64px sprite (80px from 1024px) stands on the plaque's top edge, 16px in from its right end (28px from 640px), with no cast.
- **Ribbon:** a lime piece, 2px ink border, standing 3px, overlapping the plaque's foot by 12px. It carries the page's h1 in print, 30px on a phone and 40px from 640px, centred, in two lines on a phone. Padding 8px by 16px, 10px by 24px from 640px. It is the named exception to the Lime Is Yours Rule.
- **On home:** the plaque holds the wordmark at 48px (64px from 1024px) with 20px at the sides, 8px above and 16px below, has no Hadu, and is left out below 640px. The ribbon carries the h1 (30px, 40px from 640px) left-aligned and balanced, with 8px above and below and 14px at the sides (20px from 640px); from 640px it overlaps the plaque's foot by 12px and starts 20px in from the plaque's left edge. The build stands home's ribbon 2px where the landing page's stands 3px; that is carried, not a rule.

### Stage Frame
The thick frame around the playable round, around each panel's picture on the landing page, and around the picture at sign-in.
- **Frame:** from the outside in, a 2px ink line, a cobalt band (6px, 10px from 640px), and a 2px ink line. A white square stud sits in each corner of the band, 2px in from the frame's outer line (2px square, 6px from 640px).
- **Depth:** a 5px board edge closed by a 2px ink line, and a 5px cast in the colour of the ground.
- **Ground inside:** the cloth, laid again with the `cloth` class, so pieces inside cast on cloth. The cast panel's frame holds a sky band instead, and pieces in it cast deep sky.
- **Crowd:** cats handed to a frame are placed against the frame's own box, so they keep their place at every width.

### Crowd
Cats as decoration, on the landing page and once at sign-in: they say nothing, take no clicks, and are hidden from assistive tech.
- **A crowd cat:** a sprite at a whole multiple of 16, facing either way. One that stands on the ground casts a flat bar one sprite pixel deep; one perched on an edge or cropped by one casts nothing.
- **Around the hero stage, from 1280px:** seven cats. Hadu on the plaque, two perched on the stage's top edge (128px), one standing on the mat each side of the stage (192px left, 176px right), and a far bigger one behind each of those (320px left, 288px right), placed from the page edge and cropped by it.
- **1024px to 1279px:** the two big back cats go; the side cats stand whole in the margins at 96px, and the perched cats are 112px.
- **Below 1024px:** the margins go. Hadu on the plaque, two 64px cats on the stage's top edge (a third from 640px), and one cat hanging off the stage's bottom right corner, cropped by the page edge (96px, 128px from 640px).
- **On the panels' frames:** one cat perched on the top edge of each picture's frame (96px on the cast frame, 64px on the other two).
- **Beside the board, from 1280px only:** three cats (160px, 192px, 144px) overlapping the board's edges, and three oversized pixel icons standing on the cloth clear of it: a white die at 64px, white yarn at 96px, and a fish at 96px in the Mist fur tone.
- **In the close:** one cat cropped into each bottom corner of the sky band, 160px on a phone; 320px left and 256px right from 640px.
- **At sign-in:** Mistpaw at 64px perched on the top edge of the picture's frame, 24px in from its right end, with no cast.

### Home Menu
Home is the game's main menu (`src/app/HomeDashboard.tsx`), laid beside the tower and over its scene, as a title screen is. Its pieces cast the darker ink.
- **Masthead:** the title plaque and, on the lime ribbon, the h1, which says where things stand: "Six rivals are waiting", "Up against Alley Tom", "A reward is waiting", "Your run did not answer".
- **Menu mat:** a sky mat, 672px wide at most, 12px padding (20px from 640px). The player's hadu stands on it at 64px (96px from 640px) with a flat cast, in what it wears. Beside the cat from 640px, and under it on a phone: "Welcome back, name" in 14px bold, one sentence of detail at 16px (18px from 640px), a 12px bold label ("Across the table", "Next across the table", "First across the table") over the coming rival's coral nameplate (384px wide at most), the gauntlet track from 640px, and one large cobalt table link, "Start a run" or "Continue run", the full width on a phone.
- **States:** five, all the same shape: loading (a blank in the ribbon and blanks on the mat), the run did not answer (a large cobalt "Try again" beside a large cream "Go to Play"), no run, a match in progress, a reward waiting.
- **Under the menu:** the record book and the codex board, 28px apart, side by side from 1024px. From 640px they keep the tower's side clear as the menu does; on a phone they start under the first screen and run the full width.

### Record Book and Codex Board
The two boards under home's menu.
- **Record book:** a board titled "Record book" listing the last five runs, ruled apart by 2px dashed lines (ink at 15%). A row is the tier's name in bold and an outcome tag (2px ink border, 12px at weight 900, 20px tall): lime for "Won", coral for "Lost to Madame Mittens", white for "Abandoned". Under it, one 14px soft-ink line in tabular figures: matches won, the score, the coins the run paid, how long ago. With nothing on record it is one soft-ink sentence; if it will not load, a sentence and a medium cream "Try again".
- **Codex board:** a board titled "Codex" holding two counts, cats owned and relics unlocked. Each is the number in print at 30px with its total in soft ink ("12 / 102"), tabular, over a 12px bold soft-ink label. Under them, a medium cream "Open the codex".

### Codex
The codex is a book in the tower's room (`src/app/codex/CodexView.tsx`, `src/components/codex/CodexBook.tsx`), in front of the wall. `book.ts` says what is on each page and `turn.ts` what each page does while a leaf turns.
- **Cover:** pressed cobalt with white text, a board's border, edge and cast, and a 2px ink line let into its face 10px in. On it the book icon at 96px, "Codex" in print at 30px and "Everything on file." in 12px bold. It is only seen shut for a beat, on arriving (see Motion), and is not read out; the same sentence, whole, is beside the h1 for a screen reader.
- **Name plate:** the page's one h1, "Codex" in print (30px, 40px from 640px) on a cream tile with 12px by 8px padding: above the tabs, and at the head of the tab column from 1024px.
- **Chapter tabs:** Cats, Relics and Rivals as medium table buttons in a `nav`, each tucked 2px under the book's edge. The chapter that is open is lime, pressed in and marked as current; the others are cream. A tab turns to its chapter's first page.
- **Page:** a board with 16px padding (20px from 640px). Every page is in the same cell, so the book is as tall as its tallest page whatever is open and whatever filter is set. A running head 30px tall: the chapter's name as an h2 in print at 30px, and how much of the chapter is unlocked in print at 20px, tabular ("19 of 102", "6 matches", or "5 of 102 match" once a filter is set). On a spread the name is on the left page and the count on the right; a single page carries both. The page's number is at its foot, at its outer corner, in 12px bold soft ink. Two-up, a chapter with an odd number of pages ends on a blank one, so every chapter starts on a left page; a blank page carries the book icon at 64px and 35%.
- **Cats:** four to a page, two by two, each in a pocket. The pockets share the page's height, so they are one size on every page, and a card fills its pocket. In a window of 1280 by 848px or more a pocket is large enough for the whole card, so the full variant is printed there (the 72px sprite, the line of rarity, element, lanes and capacity, and the flavor); a smaller window prints the compact one. A card that is unlocked is a button: it lifts 2px under a mouse and comes out of its pocket as the full card in a dialog, and the pocket is an empty tray well until it is put back. A locked one is at 60% with its unlock hint and is not a button. A cat the account owns carries a lime tag on its top right corner (2px ink border, 11px at weight 900, tabular) with the copies held out of the most there can be, "2 of 3". One it does not own reads "Not owned." and where it is found.
- **Relics:** white tiles, 12px padding, 16px between rows: four to a single page in one column and six to a page of a spread in two. On a tile: the name in print at 20px led by its 32px drawing, over its text in 12px. Locked, a tile is at 60%, its text is the unlock hint, and its drawing is greyed as a locked cat's sprite is.
- **Rivals:** one to a page, in the order a run meets them. A white card-height piece, 12px padding: the rival's 48px sprite beside a "Match 3" label and its name in print at 20px on a coral plate (2px ink border), with the ink Boss tag for a boss (cream, 11px at weight 900, sentence case); the flavor line in 14px italics; the trait in 14px bold; the level it plays at on each tier as a table in 12px under a 2px ink rule, each row ruled off by a 2px dashed line (ink at 15%); and one 12px line on its deck, the charm it holds, and that it has no head start.
- **Pager:** a board with 10px padding under the book: a medium cream "Previous" and "Next", each with a key hint (the chevron icon at 8px, for the arrow key), and between them where the book lies open in 14px bold, tabular ("Page 3 of 18", "Pages 3 and 4 of 20"), read out when it changes. A button is disabled at its end of the book. The arrow keys turn the page when the focus is on the page or in the book and no dialog is up; a sideways swipe does on touch (48px or more across, clearly sideways, and not started within 24px of the screen's edge).
- **Filters:** there while the Cats chapter is open. From 1024px they are flags along the book's top edge (see Filter Tokens), on the same screen as the book, and how many cats match is the count at the head of the page, read out when it changes. Under 1024px they are a board under the pager: the two rows of filter tokens and a 14px line saying how many cats match. Setting a filter deals the chapter's pages out again and cuts to its first; the filters are kept while another chapter is open.
- **No cat matches:** the page holds a 2px dashed ink outline (40%) with one sentence and a small cream "Clear filters".
- **Loading and failure:** while it loads, a cats page holds four card spaces and a relics page three blank lines. If the cats and relics do not load, each of those chapters is one page saying so, with the error's own message in soft ink and a medium cream "Try again"; the rivals have their pages regardless.
- **Address:** `/codex#cats`, `#relics` and `#rivals` open the book at that chapter, and the address follows the chapter that is open.

### Deck Builder
The deck an account brings to its next run (`src/components/deck/DeckBuilder.tsx`, at `/deck`), in a room of the tower: two boards and a rail. Nothing is kept until it is saved, and leaving with a deck changed and not saved is asked about first.
- **Deck board:** a board titled "Your deck" with the count at its right end in print at 20px, tabular ("22 of 24"). One 14px paragraph; the cats of each element as a row of element marks with counts in 12px bold; then the deck as card stacks in a tray well, each 96px wide, 12px apart. A press on a stack takes one copy out, and a small white Info control under its bottom right corner opens the card. While the deck is short, a dashed space the size of a stack holds how many are missing in print at 30px over "more to add" in 12px bold. With a run in progress, one 12px semibold line says the run keeps the deck it began with.
- **Collection board:** a board titled "Collection" with "40 of 102 cats owned" in 14px bold at its right end. Two rows of filter tokens (element, rarity), the switch for cats not owned, and a 14px line that counts the cats shown and is read out when it changes. Then the cats as cards that are their own control (`CatPick`): a press adds a copy, and the footer reads "1 of 3 in deck". A cat that can take no more is at 60% and still answers a press, so the rail can say why. A cat not owned is at 60%, is not a control, and its footer names the pack it is found in; Info still opens its card. With nothing to show, a tray well holds one sentence.
- **Rail:** a white card rail (see Mat, Tray Well, Rail). Its sentence says what stands in the way of saving, or why the last press did nothing. Beside it a medium cream "Undo changes", or with nothing changed a medium cream link to the shop, "Get more cats"; then the medium cobalt "Save deck", held until the deck can be saved.
- **Loading and failure:** the two boards with their titles and blanks in the shape of stacks and cards; or one board with a sentence and a medium cream "Try again".
- **Plate:** the page's h1, "Deck", in print (30px, 40px from 640px) on a cream piece above the boards, as the shop and the profile have.
- **Deck box:** every arrival opens with the deck in its box, alone in the middle of the room with the page put away: an ink card piece (128 by 184px, 176 by 256px from 640px) with a 2px cream line at 40% let into its face and a cream paw at 48px, closed by a lid of the same a little wider than it across its top quarter. A cobalt card back like the shop's lies behind its front. It is a picture, not read out and not pressed. See Motion.
- A deck over 24 has its count set in cream on ink, and a deck that cannot be played is said on an ink piece at a run's start. Coral is the rival's, and neither is.

### Shop
The shop (`src/components/shop/`, at `/shop`) is a room: the h1 "Shop" in print (30px, 40px from 640px) on a cream tile, as the codex has its name plate, then one board on the wall. The shelf and the opening of a pack share that board and its rail.
- **Board head:** the name of the pack shown as an h2 in print at 30px, over its one-line text at 14px ("5 Flame cats. The last is rare or better."). The same head stays through the opening of a pack, and takes the focus when one is opened.
- **Pack** (`PackWrapper`): a sealed booster. Two sizes, both 2:3 and each drawn at its own size so a 2px line is 2px on either: 128 by 184px, and 192 by 276px for the one in the middle. Its pattern unit is 4px, and 6px on the larger, which is also one pixel of its sticker (64px and 96px). The wrapper is one colour with 2px ink down its sides, crimped top and bottom (see Pack edge); inside each crimp is a sealed band in the wrapper's lighter tone, ribbed in the wrapper's own. The wrapper carries a print in the lighter tone, one tile repeated, and no two packs share one. On it are a sticker, a cream name plate with a 2px ink border holding a 16px mark and the pack's first word in print at 20px (30px on the larger), and on its top right corner a white count tag with how many things come out. A button, named by the row for a screen reader.
- **What a wrapper is printed in:** the colour of what is in it. A cat pack is its element's tone with the element's lighter fur tone: rising stripes for Flame, waves for Mist, bolts for Volt, scattered leaves for Thorn, crescents and dots for Shade, with a cat of the element as the sticker and the element mark on the plate. Wardrobe is Hadu's pink (`#f4a6b7`) printed with white bows, Hadu as the sticker and a paw on the plate. Table and Tower is tower stone printed with courses of masonry in light stone, with a 16x16 tower emblem in light stone as the sticker and a house on the plate.
- **Spent:** a pack with nothing left to find is printed dull: its two tones taken most of the way to the grey of their own lightness and then a little toward ink (`dulled` in `packs.ts`), print and bands redrawn in them, the sticker in greyscale, and a white strap with ink lines across the sticker's feet reading "Empty" in 11px at weight 900. The plate, the count tag and the strap keep their own colours, and nothing is made see-through.
- **Pack shelf** (`PackShelf`): the packs as a row with one in the middle, standing on a shelf drawn edge-on (see Shelf edge). Every pack hangs its price on the lip under it: a white tag with a 2px ink border holding the coin icon at 16px in gold and the price in print at 20px, tabular. The row is a ring, so past its two ends the packs come round again as copies in shadow (brightness 58%, saturation 60%), which are pictures: not tabs, not pressed, not read out, and with no price. The row is a carousel and the packs are its tabs: `aria-selected` is the pack shown, one tab stop, each named with its price and its state ("Cinder Pack, 100 coins", "Wardrobe, 150 coins, nothing left to find"). Left, Right, Home and End turn it, round its end; so do the two 40px chevron buttons under it, a swipe of 32px or more, and a press on a pack at the side. Between the chevrons every pack's mark stands at 16px, the shown one on a white tile. A press on the pack in the middle, or Enter, opens what is in it. While the shelf loads the row is five dashed pack spaces holding blanks.
- **Under the row:** one 14px semibold line of what the pack holds for this account ("20 Flame cats can come out of it. You have found 7.", "3 of 12 still to find.") beside a small cream "What is in it". With no coins at all, a 2px dashed ink outline (40%) holds "No coins yet. A run is where they come from." and a small cobalt "Play a run". Then, in 12px soft ink: "Coins are won at the table and nowhere else. Nothing here is sold for money."
- **Rail:** the board's own foot. On the shelf its sentence says what the pack shown costs and what the player has ("Open the Cinder Pack for 100 coins. You have 240.", or "The Cinder Pack is 100 coins. You have 60: 40 more to go."), and it holds the one medium cobalt "Open pack", held when the pack cannot be opened. While a pack opens it holds a cream "Skip"; once the cards are dealt, a cream "Turn them all" and the cobalt "Turn a card" (or "Turn a piece") with its Enter hint; once every card is up, a cream link to where the things go ("Build your deck", "Try them on") and the cobalt "Open another", after which the focus is back on "Open pack".
- **Card back:** a card face down is the player's cobalt deck back at card height: at least 216px tall, 8px padding, a 2px pressed-cobalt line let into its face and a white paw at 32px. It is the button that turns the card, named "Turn over card 2 of 5", and it lifts under a mouse.
- **Turned over:** a cat is the hand face of its card with its lanes and Info at the foot. A cosmetic is a piece tile laid out as a card.
- **Pull tag:** under each card a line 44px tall is kept, in 11px bold, so turning a card moves nothing. It holds a lime "New" tag (2px ink border, weight 900), or "Copy 2 of 3.", or "Already have 3." with a white chip beside it (2px ink border, the coin icon at 16px, "4 coins back").
- **Piece tile** (`PieceTile`): one cosmetic as a named white tile with its rarity's band along the top, as a cat card has: its picture (40px in a list, 96px on a card), its name in print at 20px, "Hat · Rare" in 11px bold soft ink, and a lime "Yours" tag when the account has it.
- **Pack contents** (`PackContents`): the wide dialog, titled with the pack's name; looking buys nothing. For a cat pack: a 14px semibold line led by the element mark ("Flame cats. 5 cats a pack, from the 20 here. A cat can come up twice. You have found 7 of 20."); the odds under a 12px label, as three lines in words ("Cards 1 to 3", "75 in 100 common, 25 in 100 uncommon."); and a bar that stays at the top of the sheet with a pair of small table buttons, "All cats" and "One at a time", the one in force lime and pressed, and a cream "Close". "All cats" is a sky mat with the cats grouped by rarity under a 12px heading at weight 900 ("Common · 8"), each a stack as tall as the copies the account holds with "2 of 3" under it in 11px bold; a cat it holds none of lies flat on cloth with its sprite grey at 45% over "None yet". A press on one opens it in the other view. "One at a time" is the full cat card, 448px at most, over two chevron buttons with a line between them ("Flameclaw, common. You hold 2 of 3. 1 of 20."), over a tray well of the pack's cats as 32px sprites, seven across on a phone and eleven from 640px: a radio group with one tab stop, the one on show on a lifted lime tile and a small white "×2" on a cat that is held. Under either, in 12px soft ink, how many of a cat can be held and what one too many pays back. For a cosmetic pack: its pieces grouped by slot under a 12px heading ("Hat · 2 of 8 yours"), as piece tiles two across from 640px.
- **Failure:** a board titled "The shop is shut" with the reason and a medium cobalt "Try again". What the account already has is a note on a pack and never a condition of the shop: if it does not load, the shelf is the shelf without it.

### Profile and the Hadu
The profile (`src/components/profile/`, at `/profile`) is a room: the player's hadu on a mat with their name and coins, then everything it can wear and every look of the table and the tower, a row to a slot.
- **The hadu** (`src/components/HaduAvatar.tsx`, drawings in `src/components/sprites/hadu.ts`): Hadu's sprite and one drawing for each slot worn on him (hat, eyes, body, tail), laid into his 16x16 grid in cells that no other slot uses, so any hat goes with any eyes, body and tail. The brow, the cheeks and the muzzle belong to no slot: the face under the hat is always Hadu's own, and his ears stay out at either side of a hat. The fifth slot, the aura, is a layer of its own behind him on a 24x24 grid: marks in the air round the cat, each carrying the sprite outline, so an aura is pixels and not a glow. The free piece of every slot draws nothing, so the look every account starts with is Hadu as he came.
- **Name plate:** the page's one h1, "Profile" in print (30px, 40px from 640px) on a cream tile, as the codex and the shop have theirs.
- **Mirror:** a sky mat holding the hadu at 128px (160px from 1024px) on a crowd cast, with 32px of air round it (40px from 1024px) for an aura; the player's name on a lime nameplate in print at 20px; and the coins on a white token at least 32px tall: the coin icon at 16px in gold, the number in 14px at weight 800, tabular, and the word "coins". The plates stand beside the hadu below 1024px and under it from 1024px. In the room the mat and the pieces on the wall cast on stone.
- **Status card:** a white card-height piece holding the one sentence, read out when it changes: what is worn, or what the last press did. From 1024px it is under the mat in the column; below that it is the card rail, with a 32px hadu.
- **Boards:** two, "Wardrobe" (Hat, Eyes, Body, Tail, Aura) and "Table and tower" (Board, Tablecloth, Tower, Sky), each with its owned count at the title's right end in print at 20px, tabular ("9 of 40"). Under the title one 14px line; while something is still to be found, a bold note saying where it is found and a small cobalt "Open the shop". The slots are rows ruled apart by 2px dashed lines (ink at 15%): the slot's name as an h3 in print at 20px with its own count in 12px bold soft ink, then its tiles, the free one first.
- **Wardrobe tile** (`WardrobeTile`): a piece the account has is a white token-height tile with its rarity's band along the top: its picture in a space 72px tall, its name in 11px at weight 900 and its rarity in 11px bold soft ink. Hover is soft sky and it lifts. The piece in force is lime with the chosen frame, lifted, reported as pressed, and carries a small ink tag on its top edge (cream, 10px at weight 900, 1px ink border): "Worn" on the hadu, "In use" on the table and tower. A piece the account does not have is not a piece yet: a 2px dashed ink outline at 40% with its picture at 45%, which takes no press and is described by the board's note.
- **Pictures** (`PieceDrawing`): something the hadu wears is seen worn, on a plain Hadu at 64px (an aura at 48px, with its air round it). A look is its swatch (see Shapes).
- **No save step:** a press puts the piece on at once and tells the server after; the first of a row takes it off again. A change the server refuses comes back off, and a notice says so.
- **Loading:** the frame with blanks in the shape of the hadu, the plates and the rows, each slot already named.

### Sign-in
Login, signup, forgot password and reset password (`src/components/auth/`): one board on a sky band, which lands once as a token does. `AuthScreen` is the page; each form is the board's contents.
- **Board:** cream, casting deep sky, 20px padding (32px from 640px). The h1 in print (30px, 40px from 640px), one line of intro, the fields 16px apart, the line kept for an error, and a large cobalt submit the full width. Under the form, a 14px line with another form as a bold underlined text link.
- **Login:** email and password. "Forgot password?" is a 14px extra-bold underlined link at the far end of the password label's line, its target extended to 40px tall; it adds no height. Under the submit, "Use demo account" as a medium cream table button the full width, which signs in.
- **Signup:** username, email, password with the strength meter under it, and "Retype password". Under the submit, a tray well holding a 14px extra-bold line ("Nothing is for sale") and one 14px sentence.
- **Forgot password:** the email alone and "Send reset link". The answer takes the form's place on the board and is the same for any address: "Check your email", one sentence, "Back to sign in" as the large cobalt link, and a 14px line to try another address.
- **Reset password:** the new password with the meter, and its retype. A link that is spent or too old gets "This link has run out" with "Send a new link" as the large cobalt link; a password saved gets "Password changed" with "Sign in". A board with no form has its one way forward 24px under the intro.
- **Picture:** a stage frame holding "Six rivals. Twenty-six turns each." in print (20px, 30px from 1024px) over Flameclaw at 160px (256px from 1024px), with Mistpaw perched on the frame. See Layout for where it stands and when it is left out.

### Not Found
A board 576px wide at most, beside the tower, since a page that is not there is outside like home: an ink "404" tag (cream, 12px at weight 900, 1px ink border), the h1 "This alley is empty." in print (30px, 40px from 640px), Flameclaw at 96px, one sentence, and a medium cobalt "Back home".

### Hunt Demo (landing page)
One round of Hunt against the first rival, run by the real engine in the browser and laid out as the match table is. Nothing is saved.
- **Lane on a mat:** the Hunt row is a player mat with one lane: the strip with its cost tabs, then the Hunt on its garden. The lane keeps its tile across the top at every width (`is-stacked`), with the banner beside it, so the cats under it have the whole width. Under the lane, across a 2px ink line, the power list on the left and "Round 1" in print at 20px over the turn cubes on the right.
- **Lane chip:** the lane's own tile, not a button: the paw icon (24px), "Hunt" in print at 20px, a 12px bold line and "from the feeder" in 11px under it. While the round is on it is lime and pressed and reads what activating gives ("Take 2 dice"); once the round is over it is cloth and reads "Round over".
- **Slots:** three cats, one empty space, and the lane's end, 6px apart, at least 112px tall; the end is 28px wide on a phone and 44px from 640px. A filled slot is a cream tile with the element edge down its left, holding a "Fires 1st" mark (white, 1px ink border, 10px bold, 11px from 640px), the sprite (48px, 64px from 640px), and the cat's name (10px, 11px from 640px, weight 900). The firing mark has the tile's corner, so the cat's element mark hangs off the sprite's top left corner instead, 10px out, with the cream rim. A cat with cats tucked under it stands 4px, then 6px, and carries a white tag with the tucked icon and the count.
- **Printed empty space:** the fourth space is the mat's own empty space (see Lane): dashed on its wash while it is the next one, printing the Hunt's mark, the reward as dice on the lime plate, and the trade mark, a card for a die. What a cat costs there is on the tab over it. The lane's end is the cream plate with the chevron and the reward of a full row.
- **Power list:** under the slots, one 12px line per cat in the order they fire, the name at weight 900. The line of the cat that is firing fills lime with a 2px ink line inside it.
- **Feeder well:** a tray well under the mat. Its label reads "Feeder. Pick 2 dice." in 12px bold soft ink; five dice across, capped at 384px; the chosen dice are lime and lifted.
- **Confirm:** a medium cobalt table button reading what it does ("Take 2 dice"), under the dice on a phone and to their right from 640px. It is disabled until the right number of dice is chosen. While the turn lands it is lime with ink text, pressed, at full opacity, reads "Hunting", and the dice are disabled.
- **Rival's side:** the rival's coral nameplate, then its last move: a card-height piece with one 14px line at weight 900 and one 11px line under it. Cloth before it has moved, cream after, coral while it has just moved. The second line reads "Plays the same game on a board of its own, turn about with you."
- **Log:** a white tile at least 160px tall, headed "What just happened" in print at 20px. Lines are 13px; the first is bold and later notes are soft ink. Before the first turn it holds one soft-ink sentence saying what to do. When the round is over the goal's result is a lime marker with a 2px ink border.
- **Food tokens:** under the log, a "Your food" label and the seven foods as 24px icons with their counts, as on the docked edge.
- **Score tokens:** two tiles at least 64px wide, a name in 11px bold over the score in print at 30px: lime "You", coral with the rival's name. Under the columns below 1024px; docked on the frame's right edge from 1024px, where they cast deep sky.
- **After the round:** the feeder well holds one 14px sentence, a medium cobalt "Start a run" link, and a white "Deal again" table button that deals a fresh round.
- **State for the page:** the demo's root carries `data-busy` while a turn lands, `data-firing` with the slot whose power is firing, and `data-won` once the round is over and won. The crowd reads them.

### Board and Folds (landing page)
One cream board lying on the cloth, folded into panels.
- **Board:** cream, 2px ink border, a 3px board like the mat. Things on it cast cloth cast.
- **Fold:** every panel after the first starts at a seam: a 2px ink line with a 3px shade under it (chipboard at 26% in cream).
- **Lead plank:** the first fold, under the stage: the lead paragraph and a large cobalt "Start a run".
- **Panel:** an h2 in print (30px, 40px from 640px), copy, and a picture in a stage frame. Bold lead-ins inside copy are weight 800.

### Cast Showcase (landing page)
Every cat, one at a time, in a stage frame whose ground is a sky band.
- **On show:** the chosen cat at 192px with its cast, beside its full cat card from 640px and above it on a phone.
- **Element buttons:** five white tiles, 40px tall, 12px at weight 900, each led by its element mark; they lift on hover. The element of the cat on show is lime and pressed. Picking one shows that element's first cat.
- **Strip:** a tray well holding every cat as a 32px sprite, seven across on a phone and thirteen from 640px, in cells 44px tall (40px from 640px). The chosen cat's cell is a lime tile, lifted; the others have no border, turn white on hover, and lift. The strip is one tab stop and the arrow keys move along it.
- **Pull quote:** beside the frame, the chosen cat's flavor line in quotation marks, bold italic, 20px rising to 24px, then a 14px bold line with the element mark, the name, the rarity, and the element.

### Lane Showcase (landing page)
The player's mat at a glance, in a stage frame on cloth.
- **Mat:** the player mat as a match prints it (see Mat, Tray Well, Rail, and Lane): the strip with its cost tabs, then the three lanes on their habitats, every space empty, with the reward ladders and trade marks from the engine's own tables.
- **Lane tile:** the lane's activate tile as a button: cobalt with white text, pressed cobalt on hover, lifting; the chosen lane's is lime with ink text and pressed. From 640px it sits in a 132px column to the left of its spaces; on a phone it sits above them.
- **Spaces:** four spaces and an end cap (28px, 36px from 640px), 6px apart, about 80px tall. Each space prints the two parts of a lane space as the match does on a phone: "Cat" over its yarn cost (16px yarn icons, or "Free"), a faint ink rule, and "Row" over the reward the lane gives with that many cats in it. The end cap reads "Full" over the reward of a full lane. The chosen lane's spaces are dashed ink outlines (55%) over white at 45%; the others are deep-sky outlines.
- **Readout:** under the mat, a white tile: the chosen lane's name in print at 20px and one 14px sentence saying what it pays.

### Rival Fan (landing page)
The six rivals of a run as coral nameplates climbing a staircase, in a stage frame on cloth. The list is in the order they are met; the first is at the foot and the last boss on top.
- **Plate:** a coral tile, 8px by 12px padding, 12px above the next. Each plate is the same width and steps right as it climbs, 6px a step on a phone and 22px from 640px.
- **On a plate:** the rival's number and name in print at 20px, an italic 14px flavor line under the name. A boss's number and name are 30px, and the name is followed by the ink Boss tag (cream text, 11px, weight 900).

### Close (landing page)
A cream board on the closing sky band, centred, casting deep sky. It holds a print heading ("Your first rival"), the first rival's nameplate with its flavor line (capped at 384px, left-aligned), a large cobalt "Start a run", and one 16px bold line. A big cat is cropped into each bottom corner of the band.

### Motion
Short and functional. Off the table the table's grammar holds: a piece lifts 2px under a mouse and sinks 2px when pressed, the sign-in board and a notice land as a token does (240ms), a blank waits in 3 steps over 900ms, and nothing fades in but the room the codex is kept in. There is no separate press for chrome, because there is no chrome. All animation and transition durations collapse under `prefers-reduced-motion`.

The landing page is a tabletop and moves like one. The demo lands a turn one step at a time, 560ms apart. The cat whose power is firing turns lime and makes one small jump (4px up and 7% larger, back in 380ms on an ease-out), and its line in the power list fills lime; the rival's last card takes the tabletop's flip (380ms) and is coral for that step. The crowd idles on a bob: 2px up and back in two steps every 1.6 seconds, each cat started at a different point so no two move together. When the row fires the crowd hops with the chain, 14px at the top in four steps over 360ms: the cluster right of the stage on the first slot to fire, the cat on the plaque on the middle one, the cluster on the left on the last. When the round is won every cat on the page hops three times. Under reduced motion the crowd is still and the steps land at once. The landing page has the app's press and hover sounds and no tune.

Cardboard moves like cardboard: smoothly, with a little spring, and it settles. Pixel sprites (the crowd, Hadu on the tower, a rival in its window) still move in whole steps. The climb's camera is neither: it moves the whole picture, and eases. Nothing fades in on load but the room the codex is kept in. Every effect moves `transform` and `opacity` only; springs are worked out ahead of time and played as plain keyframes (`src/components/run/fx/spring.ts`).
- **Lift and press:** the move takes 150ms on a curve that goes a touch past and settles (`cubic-bezier(0.2, 0.9, 0.3, 1.25)`). The edge and cast shadow under the piece change with it in 2 steps over 120ms; a shadow is never eased.
- **The fan:** a hand card stands up, or settles back, in 220ms on the same curve; the cards that are left close up the same way when one is played. Nothing else in the hand moves when a card is raised. A raised card leans up to 5 degrees toward a mouse held over it; touch and reduced motion leave it flat.
- **The packs:** the shop's row turns in 220ms on the curve with give, by `transform` alone. The pack that changes size is drawn at its new size at once and scaled from the old one about the middle of its foot, so the swap is hidden under the one move: the pack arriving in the middle grows from two thirds, the one leaving shrinks from one and a half. Every pack moves one place along and none crosses the row: the pack that goes off one end slides out under the stage's edge into shadow as its copy slides in at the other, and a turn of two places does the same over two. A pack's shadow comes on and off in two steps over the same 220ms, as a piece's shadow changes, and is the one `filter` that changes on the table. Nothing grows when the screen loads. Under a mouse the pack in the middle rises 4px, leans up to 5 degrees toward the pointer like a raised card, has one flat, slanted band of white at 50% cross its wrapper once in 520ms at one speed, and its mascot hops one pattern unit and comes back, in whole steps over 360ms; a pack at the side rises 2px. A press sinks any of them 2px. The slot a pack stands in is what is hovered, so a pack that rises cannot leave the pointer. In the viewer the stacks are dealt onto the mat as pieces landing, 24ms apart; under a mouse or on focus a stack's lower copies slide 2px further out each and turn 2 degrees each about the foot of the stack, in 220ms; and a card turned to comes in 16px from the side it was on, in 220ms.
- **Opening a pack:** the pack that was bought stands where it stood in the middle of the shelf, as a picture. It is sealed for 460ms. Then its top strip, the crimp and the band under it, comes off up and to the right, turning 16 degrees and going clear in 300ms on the ease-out, while the one flat band crosses the wrapper and the sticker hops once; that is held 340ms. Then a cobalt card back rises at the mouth in 300ms on the curve with give, held 380ms. Then the cards lie on the board face down, dealt as pieces landing. The rail's only action meanwhile is a cream "Skip". A card is turned by a press on it, by Enter or Space from anywhere that is not a control of its own, or by the rail's "Turn a card"; "Turn them all" turns them 170ms apart. A turn is the tabletop's flip (380ms): the back and the face change places when the card is edge-on, at 190ms, by `visibility` alone, and the tag under the card lands as a token does once it is up. A card turned from the rail is brought just clear of the lid, the rail and the dock in one cut. Under reduced motion everything is face up at once.
- **The chest:** plays once, the first time its step is come to. The hadu walks in 144px from the left in 9 steps over 900ms; at 900ms the shut chest gives way to the open one in one cut; then the three relics rise 16px, 320ms each on the curve with give, from 1000ms and 120ms apart. Under reduced motion the chest is open and the relics are there. A relic is not faded in: it is not there, and then it is, rising.
- **The deck box:** plays on every arrival at the deck, by a link or loaded directly, once the camera has stopped. The shut box lands as a token does (240ms) and stands 460ms; its lid comes off up and to the right, turning 16 degrees and going clear in 300ms on the ease-out, as a pack's top does, held 340ms; the card back rises half its height out of the mouth in 300ms on the curve with give, held 380ms; then the box sinks 8px and goes clear in 220ms under the page, as its plate, boards and rail land over it (240ms). Any press or key while it opens goes straight to that landing, and the press still does what it does. The page is put away until then; under reduced motion there is no box.
- **The wardrobe:** nothing plays by itself. A press changes the hadu, the board, the cloth, the tower or the sky at once, and the tile in force lifts as any chosen piece does.
- **The firing chain:** an answered turn is played back a step at a time before the table takes input again. The played card or the taken dice travel to where they land in 300ms, out fast and slowing in on a slight arc, and the piece they land as gives under them and springs back. Each cat in the lane then fires from right to left: its tile turns lime and pops (a spring of about 400ms: up 4px, 7% larger, tilted under 2 degrees, each growing a little with every power before it), its line lands in the event log, and the tile returns to cream over 520ms. A cat firing twice running pops twice.
- **What a power shows:** points scored rise off the cat as a lime chip ("+2", print at 20px, 2px ink border) that springs out, drifts up 34px and fades in 720ms, with a burst of 4px pixel sparks (lime with an ink line, and ink) thrown out and falling. A food token or a cat that changed takes a quick punch (16% larger, about 240ms). Counts and scores roll to their new value (70ms a step, between 140ms and 520ms). A power that changed nothing shrugs sideways 3px and shows nothing else.
- **Pace:** the first power holds 380ms and each one after it 12% less, down to a floor of 180ms, so a long chain speeds up. The player's own move holds 440ms (a piece in flight lands inside it), a move of the rival's 540ms, a scored goal 760ms, and the end of a match 1 second.
- **Score heat:** from the third power of a chain a soft deep-lime light grows behind the player's score, at full strength by the eighth, and fades when the turn has landed.
- **Then the rival:** its card turns edge-on and back (380ms) and stays coral for about 1.4 seconds, the prompt line in the turn block takes a coral marker for that step, and what it scored rises off its total as a coral chip. A token that arrives drops 7px into place (240ms); rerolled dice tumble in one after another (340ms each, 30ms apart).
- **Shake:** the mat and the supply jolt a few pixels and settle (about 400ms) when one power scores 4 or more, deep in a long chain, when the rival raids or burns, on a lost goal, and harder on a lost match. The climb's tower jolts the same way when Hadu lands, a pennant goes in or the title card comes down, and harder for a boss. Nothing else on the table shakes.
- **Limits:** one frame throws at most 12 sparks (6 under 640px) and floats at most 4 numbers. Everything drawn over the table lives in one layer that takes no pointer and is not read out.
- **During the chain** the prompt says what is happening in a sentence, and its only action is a cream "Skip". Any click or key skips to the end: every animation is finished and every sound cut at once, and the press does nothing else. The last frame is always the server's own view.
- **The end of a match:** on the result sheet that follows, the player's lines are counted up one at a time, 190ms apart, the total rolling up with them; on a win the total lands with a punch and a burst. This happens once, straight after the match; a reload, or coming back to the sheet, shows it as it is.
- **Light:** four things on the tabletop may glow, and nothing else. Score heat. A legendary in the hand, which has one band of light cross its face every 2.2 seconds while it stands up. And the cloth of a run, which has a wide, faint patch of white light drifting across it and back over 26 seconds, under every piece. And the pack in the middle of the shop's shelf, which one flat band of white crosses once when a mouse comes onto it, and once more as it is torn open. The landing page has none of the four.
- **Reduced motion:** the whole turn lands at once and numbers are simply set; nothing travels, pops, floats, sparks, shakes, leans, shimmers or drifts, and the result sheet is not counted up. A pack is where it stands: the row turns at once, nothing grows or shrinks, no band crosses, no mascot hops, the stacks are simply on the mat and do not fan, and a card is simply there; a pack that is opened is its cards face up at once, and the chest is open. The rival's card still colours for a moment so the flip is seen, and the turn is heard as one soft thud.
- **The climb:** plays when a run starts, after a reward is confirmed, and after the last match is won. Every move in it is written at one length and played 1.25 times slower: `CLIMB_PACE` in `climb.ts`, which the stylesheet reads as `--pace`, is the one number that sets the feel of the whole thing, and the times here are as played. Every climb opens far back on the whole tower with no bars, for 300ms. *Going up a floor* (about 3.4 seconds before the rest): the camera pushes in on Hadu on the floor just won and the bars come in (500ms); that floor's window goes dark and its pennant lands, with a jolt (500ms); he goes up the wall with the camera following (750ms) and lands, with a jolt and two white pixels of dust at his feet (300ms); the camera crosses to the window as the rival rises into it (525ms); the title card comes down (500ms). A boss's window is held dark for one more beat (450ms, so about 3.8 seconds in all) before the boss rises, and its two jolts are harder. *Walking in* (about 5.5 seconds): the camera pushes in at the foot of a dark tower, tilts up it a floor at a time (275ms each), every window lighting to a rival looking over the sill as it passes, drops back to the foot, Hadu walks in from the left and goes up to floor 1 as above. *The roof* (about 4.6 seconds): close on the last floor, its window shuts, he goes up to the roof, the pennant goes in with a hard jolt, the camera pulls back to the whole tower over 1125ms as the bars go out, and the lime card lands. The camera takes each beat's own time on `cubic-bezier(0.45, 0, 0.2, 1)`; the bars take 400ms. Hadu moves between ledges in 700ms of 8 steps, scrabbling one pixel left and right as he goes, and hops as he lands (the crowd's hop, at 450ms); at the foot he walks in 20 pixels in 5 steps over 450ms. A rival slides up into its window in 300ms of 3 steps; a pennant drops in as any token does, in 300ms; the title card drops 36px from 12% larger and settles in 425ms, and does not fade. The rests are not moves and are not slowed. The last frame rests 1.4 seconds and then gives way to the next screen by itself. Any click or key leaves at once, in one press, and that press does nothing on the screen that follows; a key still held from the confirm does not count. Under reduced motion only the last frame is shown, full screen, for 2.2 seconds, already framed, with its bars and its card in place and nothing moving. A lost match does not climb, and a reload skips the climb as it skips a turn's playback.
- **Moving between places:** a plain press on a link to a page at another place (outside, the door, the room) puts the page being left away at once and moves the tower's camera. Between outside and the door it takes 360ms on `cubic-bezier(0.45, 0, 0.2, 1)`. Into or out of the room it takes 480ms: going in starts slowly (`cubic-bezier(0.85, 0, 1, 0.3)`) and coming out ends slowly (`cubic-bezier(0, 0.7, 0.15, 1)`), because magnifying by 32 is otherwise all over in its first tenth. The lid's button turns lime at the press. The lid and the dock stay up around the table only while the camera is moving. A link between two pages at the same place moves nothing, and neither does a modified click or a link off the site.
- **A page landing:** when the camera has stopped and the new page has come, whichever is later, the page is set down: its boards, its mats and the pieces of its header land together as a token does (7px, 240ms), with one soft thud. The codex does not land: it comes up out of the dark (see the next entry), though the thud is still heard as the camera stops. Going back or forward moves the camera under the page already showing, and a page loaded directly starts framed, with nothing landing. A page that has not come after 4 seconds is given up on, and the one being left is shown again. Under reduced motion there is no hold: the page changes and the camera cuts.
- **Coming into the room:** the one place something fades in. The camera goes in through the window until the window's dark fills the screen, and the room starts as that same dark (deep stone), so there is no cut: over 640ms on the ease-out the wall comes up out of it, drifting closer (from 88% of its size), and the shut book comes up with it (from clear, and from 94%). Leaving is still a cut, since the camera is already on its way out. A codex loaded directly comes up the same way.
- **The codex opening:** the shut book lies where it came up for a beat (420ms after the 640ms it takes to come up), and then its cover opens by itself, every visit. The cover is the leaf of a turn, 1.3 times slower than a page (286ms a half on a spread, 390ms on a single page); on a spread the shut book lies in the middle and moves over by a quarter of the spread as it opens. When it lies open the cover is gone, the tabs slide out from behind the book's edge one after another (220ms each on the curve with give, 40ms apart) and the pager and the filter board are set down. It waits for the camera: nothing plays while the page is put away. Under reduced motion the book is simply open. The cats' filter flags come up from behind the book's top edge the same way, a group at a time 60ms apart, whenever the Cats chapter is turned to.
- **A page turning:** a turn is two half-turns that meet edge-on, so no page is ever seen from behind. The page being left stands up about the spine until it is edge-on (220ms, starting slowly: `cubic-bezier(0.5, 0, 0.9, 0.55)`), then the page arrived at comes down from edge-on on the other side (220ms on the curve with give, which starts at the speed the first ended at). The eye is level with the spine (`perspective` 2800px on a spread; 1800px on a single page, whose spine is its left edge), so an edge-on page is not seen at all. A single page is one half-turn of 300ms: going on, it lifts off the next page; going back, the last one comes down over it. A turn to another chapter is one leaf whatever the distance. A page is washed with flat ink as it stands up (to 24%) and the page under a moving leaf to 12%; that wash is the one opacity change here that is not a piece fading in. A new request while a leaf is in the air lays it down at once and starts the next; a held key is one turn. After a turn the book's top is cut back under the lid if it had gone above it. Under reduced motion a turn is a cut.
- **A card out of its pocket:** in the codex the dialog's board comes up from the pocket of the card pressed, at the card's own size, to where it rests (300ms on the curve with give), and goes back the same way when it closes (220ms on the ease-out), before the focus is seen back on the pocket's card. One scale both ways, `transform` only, played with the Web Animations API. The pocket is an empty tray well in between. Under reduced motion the dialog is there and gone.
- **The clouds:** the two banks drift left one tower pixel at a time and loop, by `transform` alone: the far bank a pixel every 2 seconds (its 168-pixel tile in 336 seconds), the near bank a pixel every 1.25 seconds (120 pixels in 150 seconds). They, the codex's cover and the deck box are the only things on a page that move without a press. Under reduced motion they are still.

### Sound
Every page has sound, and every signed-in page has music. All of it is made in the browser with the Web Audio API from written data; there are no audio files. The effects are recipes (`src/components/run/sfx/recipes.ts`), the music is tracks (`src/components/run/music/tracks.ts`), and both come out as the same notes: an oscillator or a burst of filtered noise with an envelope.
- **Voices:** the player's pieces are short and bright, in triangle and sine waves: a card leaving the hand and landing, dice taken, yarn laid, food gained, a cat drawn, cached or tucked. The rival's move is lower and sawn, so it is never mistaken for one of the player's powers; a Hunt of its own, which takes dice off the shared feeder, follows it as noise.
- **The chain:** each power that lands plays one step further up a major pentatonic scale from E4, stopping two octaves and a third up. With the pace it is what makes a long chain feel like one. A power that changed nothing plays a dull low note and does not climb. Each point scored adds a short tick, at most five a step.
- **Moments:** a won goal is three rising notes and a lost one two falling; winning a match is a four-note run into a held chord, losing it three low falling notes. The result sheet ticks once a line, rising.
- **Controls:** every press, on any page, is heard, once. Picking a die or a food is a rising blip, backing out a falling click, and a move the table refuses a low double buzz. A cobalt button, the one way forward, plays two rising notes (`confirm`), and so does a move sent from the keyboard. Anything else pressed (a cream button, a corner link, a dialog's buttons) plays the falling click: `sfx/ClickSound.tsx` listens on the window for a press whose own handler made no sound and gives it one, so nothing is heard twice and nothing is silent. A press on nothing (the cloth, a line of text, a held button) is a knock on the cloth (`tap`): low, dull, shorter and quieter than the click. A held button is sent no click by the browser, so its knock is taken from the pointer coming up on it. A click in a field, and the one that ends a selection of text, stay silent. The press that skips a climb or a turn's playback is swallowed before it gets there, and plays only the skip's thud.
- **Hover:** a mouse coming onto anything that can be pressed (a button, a link, a card, a dialog's buttons) is a very short high tick, the same one everywhere (`sfx/HoverSound.tsx`, one listener on the window). It is once per control, never for moving about inside one, never for a held control, never for touch or pen, and at most one every 40ms. A control that turns up under a pointer at rest (a new step, a scrolled page) makes none: the tick is the player's own move, like the knock.
- **Everywhere:** the click, the knock and the hover tick are one rig (`src/components/SoundRig.tsx`), mounted once in the root layout, so they are heard on home, in the codex, at sign-in and on the landing page as at the table. A cobalt `TableButton` or `TableLink` plays the two rising notes wherever it is, setting a filter token is the rising blip, and a page landing is the one soft thud. In the codex a page turned is paper (`page`: a short rising band of noise, and a low pat as it lies down), the cover opening is a lower swell of noise over a soft sine (`cover`) with the soft thud as it comes down, and a cat taken out of its pocket is heard in its own voice. In the shop turning the row is the rising blip, as putting a piece on is on the profile; a press the shop, the deck or the wardrobe refuses is the low double buzz, and the chest's lid going back is the soft thud. The deck box's lid coming off is the codex cover's swell (`cover`), its card rising is `draw`, and the boards landing in its place the soft thud.
- **The cats:** every HaduMon has a voice of its own (`src/components/run/sfx/voices.ts`), heard when the cat is chosen or turned over to read: raised from the hand, picked from the tray, kept from the opening hand, taken or trimmed as a reward, or opened for its card anywhere in a run, a pack's contents included, turned face up out of a pack, put into the deck, or taken out of its pocket in the codex. Putting a cat back is the falling click, and a card that cannot be played is still the buzz. A voice is made of three things. Its pitch is the cat's alone: a ladder of rungs a quarter of a semitone apart from A3, worked out from the catalogue so that no two of the 102 share one, with Hadu on E4 where the chain's ladder starts. Its shape comes from what the cat is: a rogue chirps up, a bruiser falls, a familiar mews up and back down, a scout trills, a mage rises with a fifth above it, a tank is a low flat mrrp. Its timbre comes from its element: flame a triangle with two sparks off the front, mist a sine that swells in, volt a quiet square going up in steps, thorn a triangle said twice and clipped, shade a sine with another an octave under it. A rarer cat takes longer over it; a rare one adds a glint an octave up, an epic one an echo, and a legendary signs off with three notes. No voice runs longer than 0.45 seconds, a square in one is never louder than 0.1, and none uses the rival's sawtooth or any noise.
- **The climb:** four rising ticks as Hadu goes up the wall, the soft thud as he lands and as a window shuts, a tick for each window that lights on the way in, the won goal's three notes for the pennant on the roof, and a low slam for the title card. Skipping it plays the one soft thud.
- **Music:** chiptune, one tune at a time, looping. A track is a tempo, a root, a scale and four bars or so; a bar is up to four parts of sixteen steps (a square or triangle lead, a triangle arpeggio, a triangle bass two octaves down, and a kick, snare and hat), written as scale degrees. Every screen of a run has its own: starting a run (`start`), the chest (`chest`), the tower (a march whose arpeggio only rises; the same march in a major key and quicker for the roof), taking a reward (light, pentatonic), a run won (a fanfare) and a run lost (slow, low, falling). Every rival has a theme of its own, keyed by its id; the two bosses are in minor keys and faster than the floor below them. The opening hand plays the theme of the rival about to be met with its lead and drums left out, so the match drops in on top of what was already playing. A change of screen crossfades over 400ms at once, without waiting for the loop to end. Home, the codex and the 404 share one tune of their own (`menu`: 88bpm, in F, pentatonic, a triangle lead over a rocking arpeggio and a bass, with a hat and nothing heavier). It is played from the shell (`src/components/MenuMusic.tsx`), so it carries from page to page without starting over, and it crossfades with the table's music on the way in and out. The player has one owner at a time, so a page that is leaving cannot hush the one arriving. The landing page, login and signup have no tune.
- **Limits:** no effect is louder than half scale and no note of the music louder than 0.14, so an effect always sits on top; the music has a bus of its own at 0.8 under the master; everything passes through one limiter. At most 14 effect voices sound at once. Nothing plays in a background tab: the music stops there and picks up from the same bar on return. A skip cuts every effect and plays one soft thud, and never touches the tune.
- **Control:** the speaker, in the table's corner and on the lid, is the master of both: full, quiet, off. The notes beside it turn the music alone off and on. So effects without music is a setting, and music without effects is not. Both choices are kept in the browser (`hadumon:sound`, `hadumon:music`). Sound starts on the first press or key, as browsers require; a muted table never opens an audio session.

## Do's and Don'ts

### Do:
- **Do** make every new element a piece or a board. A piece: the `piece` class, square, 2px ink border, flat fill; the tabletop adds its edge and cast. A board: `Board`, the page-sized sheet that holds pieces.
- **Do** leave the scope to the `body`, which is the tabletop. No page opens one of its own but a run's `TableSurface`, which needs the fit and the effects layer.
- **Do** pick one of the three heights for a new thing on the table: print, token or tile (2px), card (3px).
- **Do** render every cat through `src/components/PixelSprite.tsx` and every rival through `src/components/RivalSprite.tsx` at a whole-pixel multiple of 16 where the layout allows, every mark on a piece through `src/components/PixelIcon.tsx` at a multiple of 8, and every relic's drawing through `src/components/RelicIcon.tsx` at a multiple of 16.
- **Do** use ink text on lime, coral, sky, cream, and white; white text only on cobalt; cream text only on ink.
- **Do** show state on the table with the frame (cobalt border, cobalt inner line, lime inner line) and with height (lifted 4px, pressed 2px), and reinforce a chosen token with a lime fill.
- **Do** end every choice in a run in the turn block or a rail, with a sentence saying what will happen and one cobalt table button.
- **Do** give a sequence of screens a `StepRail` and keep its confirm on the last step alone; every earlier step only moves.
- **Do** keep the run route free of the lid and the dock: the corner buttons are its only navigation.
- **Do** lay a new column screen of a run in `TableArea` on a `TableSurface` with `fit`, and centre a short step with `fitted:my-auto`.
- **Do** keep what names a hand card (sprite, points, cost, name, Info) in its left strip, and tilt only a card at rest; anything being read stands upright.
- **Do** make every action from `TableButton` or `TableLink`: cobalt for the one way forward, cream for the rest, lime for the one of a set that is in force, ink for an act that cannot be undone.
- **Do** set the pixel face at 20px or 30px, or at 40px for a page's one heading, and only for what is printed: a heading, a name, a numeral, a total.
- **Do** give a page outside a run exactly one h1, in print at 30px, and 40px from 640px.
- **Do** give every key a visible hint on its piece, shown only for a fine pointer, and keep every keyed action reachable by tap.
- **Do** keep a page's controls at 44px tall or more where the layout allows; nothing interactive goes below 40px unless its hit area is extended.
- **Do** write counts and scores in tabular figures and labels in sentence case.
- **Do** give every loading surface blanks in the shape of its content, and every error a plain sentence and a retry.
- **Do** build the landing page from the tabletop's own pieces (cat cards, dice, food tokens, the mat, tray wells, nameplates, table buttons), with no shell and no tower around them.
- **Do** put a new signed-in page at a place (`placeFor` in `src/components/tower/places.ts`): the camera moves on the press, and the page lands when the camera has stopped.
- **Do** keep the tower's side of a page clear where the page is outside (`beside-tower`), and lay a page in the room with `in-room` so its boards cast on stone.
- **Do** draw scenery as rows of legend characters in tower pixels inside the tower's picture, and let the camera magnify it with the tower.
- **Do** draw a lane's habitat the same way (`sprites/habitats.ts`): bands of tiles at a whole number of pixels, anchored to the lane's bottom edge, cropped by the lane and never stretched.
- **Do** put every word and numeral in a lane on a plate or a piece, and build any mat from `src/components/mat/`, with the engine's tables for its numbers.
- **Do** let the window's size alone pick the match's layout (`fit-wide`, `fit-compact`, or the page that scrolls), and keep `run/layout.ts` saying what the media queries say.
- **Do** add to the codex as a page of its book: say what is on it in `book.ts`, and let the book turn to it.
- **Do** confirm a destructive act in a dialog, with the ink button beside a cream way back that holds the focus.
- **Do** keep a crowd cat decorative: a whole multiple of 16, no label, no clicks, a flat cast only where it stands on the ground.
- **Do** say where coins come from wherever a coin or a pack is shown, in one plain sentence: they are earned at the table and nowhere else, and nothing is sold for money.
- **Do** show a coin as the pixel coin icon in gold (`COIN_COLOR`) beside a numeral in tabular figures, on a white or a cream piece.
- **Do** render the player's hadu through `src/components/HaduAvatar.tsx` in a box that holds a whole multiple of 16, and leave its aura a quarter of the cat's edge on every side or cut it off.
- **Do** draw a new thing to wear inside its slot's own cells of Hadu's grid (`HADU_SLOT_CELLS` in `src/components/sprites/hadu.ts`), and a new look in flat fills that pass `skins.test.ts`.
- **Do** read a board's, a cloth's and the tower's colours through the properties a look sets (`--mat-fill`, `--mat-line`, `--cloth-fill`, the `--color-stone*` tokens), with the free look as the fallback.
- **Do** show a piece of the wardrobe the account does not have as a dashed outline with its picture faint, and say where it is found.
- **Do** let a change that costs nothing land at once and say so in one sentence that is read out (the wardrobe), and give a change that has to be kept one save and one sentence in a card rail (the deck).
- **Do** put a new page that is a room in the tower in `in-room`, with its one h1 in print on a cream plate, as the codex, the shop and the profile have theirs.

### Don't:
- **Don't** round a corner anywhere, or draw a pill, a 1px hairline border, or a blurred shadow. The build has none.
- **Don't** give a piece a blurred shadow, a diagonal offset shadow, or a glow. A piece has only the straight-down edge and cast. The only light on the tabletop is the four named under Motion: score heat, a raised legendary's shimmer, the drift on a run's cloth, and the one flat band that crosses a pack under a mouse or as it is torn open. An aura is drawn in pixels behind the hadu and is not a glow.
- **Don't** give a board the `piece` class or lay a board on a board. A board is not a piece, and the pieces on it keep their own edge.
- **Don't** bring back page chrome: no white panel, no side rail, no floating bar, no second kind of button.
- **Don't** draw a ring outside a piece's border to show state.
- **Don't** use coral for a decision the player owes, for a card the player is trimming, or for a destructive action. Coral is the rival's; Log out and Abandon run are ink.
- **Don't** set the pixel face at any size but 20px and 30px, or 40px for a page's one heading, or use it for rules text, a sentence of copy, or anything typed.
- **Don't** set readable text below 10px, or below 11px on a piece from 640px up.
- **Don't** move a cardboard piece in steps, or a pixel sprite smoothly: pieces ease and spring, sprites hop a whole pixel at a time. The climb's camera moves the whole picture and is the one thing that eases a sprite across the screen. Don't fade pieces in.
- **Don't** animate anything on the table but `transform` and `opacity` (the shadow on a pack past the end of its row is stepped, not animated), ease a shadow, or shake the table itself; a shake belongs to the mat, the supply and the climb's tower.
- **Don't** turn anything in depth but a leaf of the codex and its cover, or show one from behind: a turn is two half-turns that meet edge-on. A hand card's lean, and the lean of the pack in the middle of the row, is a few degrees and is not a turn. Don't set anything in the book to `visibility: visible`; it would show through a page the shell has put away.
- **Don't** put anything over the climb's picture but its bars, its subtitle, its title card and Skip, or give two cats the same pitch.
- **Don't** magnify the match or the climb with the fit, add a quarter step to the fit, or use `xl:` and wider breakpoints on a column screen: a fitted screen is 1120px wide to itself whatever the window says. The match fits its window by layout, never by `zoom`.
- **Don't** put a `transform`, a `filter`, `contain` or a `container-type` on `[data-match]` or anything above it: the effects layer is fixed to the screen. The mat itself may be a container.
- **Don't** print a cost in a lane's space, write on scenery, stretch a habitat or draw it at a fraction of a pixel, or give a lane a habitat that is a raster file or a gradient.
- **Don't** play a tune on the landing page, login or signup, mount the sound rig or the menu tune a second time, play an effect that the player's own action, a turn's playback, a beat of the climb, a page landing, the codex opening or the deck box did not cause, write a note of music louder than 0.14, or ship an audio file.
- **Don't** use gradients or emoji anywhere. Three of the four lights named under Motion are the only gradients (score heat, the legendary's shimmer, the cloth light), and each is a light, never a fill; the band that crosses a pack is flat. The sky behind the tower is a dither, not a gradient.
- **Don't** use raster or smoothed creature art; a cat is its 16x16 sprite.
- **Don't** use the stone greys for anything but the tower, the wall inside it, the scene it stands in and the wrapper of the Table and Tower pack, write a stone's hex where a `--color-stone*` token will do (a tower look repaints them), or draw a rival in any colour but coral. The clouds and the rock's top in the tower's scene are stone too. Don't zoom the tower by anything but a whole number (1, 2 and 32 are the ones in use), frame its stage, or fill it with anything but its scene.
- **Don't** put anything on the tower's side of a page that is outside, let the backdrop take a click, or show a page before the camera has stopped.
- **Don't** use an element hue for a board, a button, or a heading. A lane's habitat is scenery in its own colours, not an element's tint. The sky behind the tower is the one ground they colour and a cat pack's wrapper the one face; on a cat piece the hue is a 4px edge and never the face.
- **Don't** set text straight on the tower's scene, smooth or blur the scene, or move any part of it in anything but whole tower pixels.
- **Don't** use lime for anything the rival owns, or coral for a reward. The title ribbon, on the landing page and on home, is the only lime that is not the player's.
- **Don't** show a price in money, a payment control, a paid tier or premium styling (a gold finish, a sparkle, a "best value" badge, a countdown): coins are earned by playing, packs cost coins, and nothing is sold for money. Don't show coins or a pack without the sentence that says so, and don't show how a run's coins were worked out: only the total.
- **Don't** let a look change how anything is built, darken a board or a cloth past what ink can be read on (7:1), light the inside of a tower, or give two packs the same print.
- **Don't** add a save step to the wardrobe, or let a deck's change through without one.
