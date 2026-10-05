---
name: HaduMon
description: A cream table of hard-edged game pieces and pixel cats in soft white page chrome; on the run route and the landing page the pieces become die-cut cardboard on a woven cloth.
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
  edge: "#c8dfea"
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
  display:
    fontFamily: "ui-rounded, 'Avenir Next', 'Trebuchet MS', system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "ui-rounded, 'Avenir Next', 'Trebuchet MS', system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  title:
    fontFamily: "ui-rounded, 'Avenir Next', 'Trebuchet MS', system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.025em"
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
rounded:
  none: "0"
  field: "12px"
  flat: "16px"
  panel: "20px"
  hero: "28px"
  pill: "999px"
spacing:
  piece-gap: "6px"
  sm: "8px"
  table-gap: "10px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "12px 20px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.cobalt-dark}"
  button-secondary:
    backgroundColor: "{colors.sky-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "12px 20px"
    height: "48px"
  button-secondary-hover:
    backgroundColor: "{colors.sky-surface}"
  button-hero:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "12px 20px"
    height: "48px"
  button-danger:
    backgroundColor: "{colors.coral}"
    rounded: "{rounded.pill}"
    padding: "12px 20px"
    height: "48px"
  chip:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.pill}"
    padding: "0 12px"
    height: "44px"
  chip-selected:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.white}"
  panel:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "16px"
  panel-flat:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.flat}"
    padding: "12px"
  hero-surface:
    backgroundColor: "{colors.sky-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.hero}"
    padding: "24px"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "0 16px"
    height: "48px"
  nav-item:
    textColor: "{colors.ink-soft}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.field}"
    padding: "0 12px"
    height: "48px"
  nav-item-active:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.white}"
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
  mat:
    backgroundColor: "{colors.sky-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
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
  landing-board:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "56px 40px"
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

HaduMon is a board game laid out on a warm cream table. Two materials share the screen and never blend. The page chrome (navigation, panels, dialogs, pill buttons, the account form) is soft: white surfaces, rounded corners, faint borders, one diffuse shadow. The game pieces (cat cards, lanes and spaces, dice, score tags) are hard: square corners, a 2px near-black border, flat fills. A player can tell at a glance what is furniture and what is in play.

The pieces come in two states of the same material, and the scope decides which. On home, the codex, login, signup, and in every dialog a piece is flat: border and fill, no thickness. Inside the tabletop the same pieces are die-cut cardboard: each one has a chipboard edge straight down and an unblurred cast shadow, and it lies on a woven cream cloth. Two surfaces are tabletops: the run route (`/run`: clan pick, the opening hand, the match, the match result, reward pick, the climb between matches, the run summary) and the landing page. The scope is one class, `.tabletop`. On the run route it is opened by `TableSurface`; the landing page opens it on its own root, because `TableSurface` also carries the signed-in ways off a run's table. A piece carries the `piece` class everywhere and only gains its thickness inside the scope.

The match is a table you sit at, not a dashboard you read, and nothing of the app stands around it: a white rail down the left holds the rival and the rounds and, under an ink line, the player's turn (scores, food, prompt, confirm); the shared supply and the player's sky mat with three printed lanes lie on the cloth in the centre; a score sheet, the relics and the log stand in a slim column to the right; and the hand is held as a fan along the bottom edge. There are no white rounded panels on the table. Counts are tokens, piles, and cubes; what the board says about itself is printed on it in a pixel face.

The cats are 16x16 pixel sprites: chibi, front-facing, a near-black outline, three fur tones taken from the cat's element, and eyes tinted by rarity. Hadu alone wears his own colours, a black-and-white tuxedo with a pink nose. They are drawn as inline SVG and scaled in whole pixels. The tabletop adds a small set of 8x8 pixel icons drawn the same way (yarn, die, paw, den, card, cached, tucked, goal, chevron, and home, book and exit for the table's corner buttons), the seven food icons (beef, fish, chicken, dry food, pork, a treat, and a question mark for a cost any food pays), and the five element marks (flame, drop, bolt, leaf, crescent). The six rivals are sprites too, on the cats' grid and all in the rival coral, each told apart by what it wears; they are met at the windows of the tower a run climbs, which is drawn in the same pixels in four stone greys. Sprites, these icons and the tower are the only imagery. There are no photographs, no raster creature art, no gradients, and no emoji.

Density follows the game. The table is compact (10px between zones, 6px between pieces) because every rule the player needs has to be on the card or the board. Home, codex, and auth breathe more (16 to 36px). Copy is dry and factual, in sentence case.

The public landing page (`src/components/landing/LandingPage.tsx`, shown at `/` to a signed-out visitor) is the one Persuade surface. It is the tabletop at page scale, laid out as the front of the game's box, with no app shell and no white panel. From the top: an ink lid strip with the two account buttons; a full-bleed sky mat printed with paws and yarn; on it a cream title plaque with the wordmark and Hadu perched on top, a lime ribbon carrying the h1, and a thick cobalt stage frame holding one playable Hunt round run by the real match engine; a crowd of cats standing around the frame; then one cream board on the cloth, folded into four panels (the lead, the cats, the rows, the rivals); a sky closing band; and an ink footer. It is built from the table's own pieces (cat cards, dice, food tokens, the mat, tray wells, nameplates, turn cubes, score tokens, table buttons) and adds only what the match table has no use for: the lid strip, the plaque and ribbon, the stage frame, the folded board, and the crowd.

**Key Characteristics:**
- Warm cream canvas; sky blue for the board and the home hero.
- Two materials: rounded white chrome, square 2px-ink game pieces.
- Pieces are flat on home, the codex, auth, and in dialogs, and die-cut cardboard with a straight-down edge inside the tabletop (the run route and the landing page).
- Cobalt is the action, lime is the player's, coral is the rival's.
- 16x16 pixel cats and rivals, 8x8 pixel icons and one grey pixel tower as inline SVG, the only imagery.
- One rounded bold type voice, plus a pixel print face on the tabletop at 20px and 30px, and at 40px for a heading on the landing page.
- The landing page is the front of the box: lid strip, sky mat, title plaque, lime ribbon, cobalt stage frame, a crowd of cats, one folded cream board.
- Every state has a border, fill, or height change, never colour alone on text.

## Colors

A light, warm palette: one cream canvas, one blue family for structure and action, two loud accents with fixed owners, three cardboard shades that exist only on the tabletop, and five element hues that belong to the cats.

### Primary
- **Action Cobalt** (`cobalt`): primary buttons, the active nav destination, selected filter chips, text links, and the focus outline. On the tabletop: the one confirm, a lane's activate tile, the back of the player's deck, and the frame of any piece that is open to pick, chosen, or due. On the landing page: the band of the stage frame, the demo's confirm, Sign up, and every "Start a run". Also the rare rarity colour.
- **Pressed Cobalt** (`cobalt-dark`): hover on cobalt buttons and tiles, and link text that sits on a white surface.

### Secondary
- **Chosen Lime** (`lime`): the player's colour. The points tag on a cat card, a selected die, a kept food, food given up in a swap, the "Play here" space, the marker on a lane's current reward step, turns still to play, the player's score token and yarn, the player's goal marker, a cat while its power fires, a lane's activate tile while that lane resolves, won matches on the gauntlet track, new unlocks. On the landing page it is the same things at the demo's scale (the player's score token, chosen dice, the firing slot and its power line, turn cubes, the goal result), what the visitor has picked in a showcase (the chosen cat, its element, the chosen lane), and once something that is none of these: the ribbon under the wordmark. Also the text selection colour. Always carries ink text.
- **Rival Coral** (`coral`): the rival's colour. The rival's nameplate, score token, deck back, yarn and goal marks, its goal marker, its lines in the event log, the last-card piece while a card has just turned over, the prompt line on the step the rival acts, and the rival currently across the table on the gauntlet track. On the landing page it is the six nameplates of the rival fan, the demo's nameplate, rival score token and just-turned last card, and the nameplate in the close. Outside the table it is also the destructive button, the "Mon" in the wordmark, and the epic rarity colour.

### Tertiary
- **Element hues** (`flame`, `mist`, `volt`, `thorn`, `shade`): the primary fur tone of each element and the fill of its food icon and its element mark. They appear only on sprites, food icons, element marks, and dice faces, never as page surfaces or text colours.
- **Rarity marks** (`rarity-common`, `rarity-uncommon`, then `cobalt` for rare, `coral` for epic, `volt` for legendary): the 3px band across the top of a cat card.

Each element has two further fur tones used only inside sprites (`src/components/sprites/palettes.ts`): flame `#ffd36b` and `#b7492d`; mist `#e7f7fd` and `#3c83a8`; volt `#fff2a8` and `#1557d8`; thorn `#c9ec9b` and `#39734a`; shade `#c9c1f2` and `#40336d`. Rarity eye tints: common and uncommon `#5cbf89`, rare `#9ac4ff`, epic `#ffd7d2`, legendary `#fff0a8`. One cat is the exception: Hadu, drawn from the real cat the game is named after, has a palette of his own (`CAT_PALETTES`), because a black-and-white tuxedo is not an element's colours. Black fur `#2f2838`, white fur `#ffffff`, pink ears and nose `#f4a6b7`; the bell on his collar is the legendary eye tint.

### Neutral
- **Table Cream** (`cream`): the page canvas, the sticky top bar, the ground of the cloth, and the face of every card, placed tile, relic tile, and cream table button.
- **Board Sky** (`sky-surface`): the mat, the landing page's hero mat, closing band and the ground inside the cast frame, the home hero surface, the auth page backdrop, and hover on secondary buttons.
- **Soft Sky** (`sky-soft`): hover fill for quiet controls and pieces, secondary buttons, the active link in the mobile navigation, inline notes, skeleton bars.
- **White** (`white`): panels, dialogs, inputs, chips, dice, the scorepad, the event log, the current round tile, the match's rail and docked edge, and small tags and key hints.
- **Ink** (`ink`): all primary text, and the 2px border of every game piece. At 40% it is the dialog scrim; at 8 to 20% it is the hairline on chrome and the divider inside cards. As a fill it is the small inverse tag (Boss, Trim 1) with cream text, and on the landing page the lid strip and the footer, also with cream text.
- **Soft Ink** (`ink-soft`): secondary copy, labels, flavor text, inactive nav.
- **Edge** (`edge`): the 1px border of text inputs and skeleton bars.
- **Sprite Outline** (`sprite-outline`): the outline pixel of every cat and pixel icon. Slightly warmer and darker than ink; used nowhere else.

Tabletop only:
- **Deep Lime** (`lime-deep`): the light behind the player's score while a chain of powers runs, and nothing else. Lime itself is lost on white and cream; this is the same hue taken down far enough to read as light there. It is never a fill and never text.
- **Chipboard** (`chipboard`): the cut edge under every piece, the outline of an empty yarn space, the paw on a face-up pile, and the edge under the landing wordmark's letters. Mixed into cream (42%) or white (34%) it is the cast shadow on the cloth and on the docked edge.
- **Deep Sky** (`sky-deep`): the cast shadow of a piece lying on the mat, the printed lines between lanes, the outline of a printed empty space, and a spent turn cube. On the landing page it is also the paws and yarn printed on the sky bands.
- **Cloth** (`cloth`): the weave of the tabletop (a 16x8px brick of 4x2px marks on cream), the floor of a tray well, and the rival's card space before any card has turned.
- **Stone** (`stone`, `stone-light`, `stone-rib`, `stone-deep`): the tower a run climbs, and nothing else. Stone is its body, light stone the lit left side, the ledges and the roof, rib the grooves and the shaded right side, deep stone the dark inside a window. They are the only greys in the system; the first two are the common rarity's pair.

### Named Rules
**The Lime Is Yours Rule.** Lime marks something the player chose, holds, or won. It is never decoration and never the rival's. One exception is named: the ribbon under the landing wordmark, which carries the page's h1, is lime although it is nothing the player chose, holds, or won. No other surface takes it.

**The Coral Is Theirs Rule.** Coral marks the rival and what the rival does; outside the table it also marks a destructive act. It never marks a decision the player owes, and never a piece the player owns. Text sitting on a coral fill is ink.

**The Waiting Piece Rule.** A piece of the player's that is waiting on an answer takes a cobalt frame with a lime inner line. A card marked for trimming takes the cobalt chosen frame and an ink tag. Neither takes coral.

**The Ink On Colour Rule.** Text on lime, coral, sky, cream, or an element hue is ink. White text appears only on cobalt. The inverses are the small ink tag and, on the landing page, the lid strip and the footer, which carry cream text.

**The Element Stays On The Cat Rule.** Element hues colour sprites, food icons, element marks, and dice. Panels, buttons, and headings never take an element colour.

## Typography

**Display Font:** the platform rounded face (`ui-rounded`, then Avenir Next, Trebuchet MS, system-ui)
**Body Font:** the same stack
**Print Font:** Jersey 20 (loaded with `next/font` in `src/styles/fonts.ts`, falling back to the display stack), on the tabletop only

**Character:** one bold, rounded, tightly tracked voice for names and numbers, the same face at regular weight for rules text, and on the tabletop a pixel face for what is printed on the board. The rounded stack is a system stack, so that face differs by platform; see the note at the end of this section.

### Hierarchy
- **Wordmark, landing** (800, 56px rising to 76px from 640px and 96px from 1024px, line-height 0.9, tracking -0.035em): the wordmark on the landing page's title plaque, cut like a piece: a 3px ink stroke painted under the fill, then a 3px chipboard edge and a 2px ink line as a straight-down text shadow. "Mon" is coral. It is the only size above 3rem and it appears once; an app screen stops at Display.
- **Display** (800, 1.875rem rising to 3rem from 640px, line-height 1.05, tracking -0.035em): the one headline of a page outside a run: the next step on home, the auth heading, "Codex" (which stops at 2.25rem).
- **Headline** (800, 1.25rem rising to 1.5rem from 640px, tracking -0.025em): dialog titles and the wordmark in the app shell. The pull quote in the landing page's cast panel takes the same two sizes at 700 in italics, balanced.
- **Title** (800, 1.125rem, line-height 1.25): panel titles.
- **Print heading** (Jersey 20, 400, 40px from 640px, line-height 1, tracking 0.01em, balanced wrap): on the landing page only, the ribbon's h1 and each panel's h2, the close included. Below 640px these are set at Print large.
- **Print large** (Jersey 20, 400, 30px, line-height 1, tracking 0.01em): on the tabletop, the heading of a run screen ("Pick a clan", "Keep 3", "Add a cat", "You beat Alley Tom") and the two score tokens. On the landing page: a heading on a phone, a boss's name and numeral in the rival fan, and the demo's two score tokens.
- **Print** (Jersey 20, 400, 20px, line-height 1, tracking 0.01em): on the tabletop, a lane's name on its activate tile, "Round 1", the rival's name on the nameplate, a clan's name, the numerals on the gauntlet track, the event log's heading, and score totals. On the landing page the same things, plus a rival's name and numeral in the rival fan and the lane's name in the lane showcase's readout.
- **Card title** (800, 0.875rem, line-height 1.25): a cat's or relic's name on its piece, the points tag, token counts, and the numerals of a reward step.
- **Body** (400, 1rem, line-height 1.45): page copy and dialog copy. Introductory paragraphs are capped near 65ch. On the landing page the lead is 1rem rising to 1.25rem from 640px, capped at 62ch, and panel copy is 1rem rising to 1.125rem, capped at 58ch.
- **Body small** (400, 0.875rem, line-height 1.375): most in-game prose: the prompt in the turn block (600), the rival's last card (900), result lines, table rows. The event log sets its lines one pixel down (13px, line-height 1.3).
- **Caption** (400, 0.75rem, line-height 1.375): rules text on a card, a goal on a round tile, relic text, score sheet lines, flavor text (italic).
- **Label** (700, 0.75rem, sentence case): the small heading above a group of pieces ("Feeder"), the second line of a lane's activate tile ("Take 2 dice"), and the text of a small table button (900).
- **Piece label** (700 or 900, 11px, ink): text that lives on a piece: the cat's name on a lane tile from 640px, the cost of an empty space, "You" and "Rival" above a score, the Boss tag, the Info button, a card's footer line.
- **Piece label small** (700 or 900, 10px, ink): the floor. A cat's name on a lane tile on a phone, the element's name on a die, a key hint, and below 640px the "Fires 1st" mark and the cat's name in the landing demo. Nothing readable is smaller.

### Named Rules
**The Two Sizes Of Print Rule.** The pixel face is drawn on a 20px grid, so on the match table it is set at 20px and 30px and nowhere between. The landing page adds one step, for a heading only: 30px on a phone and 40px from 640px, on the ribbon's h1 and each panel's h2. Print is for what is printed on the board (names, numerals, totals, headings on the table), never for rules text, and never outside the tabletop.

**The Numbers Line Up Rule.** Every score, count, and cost that can change uses tabular figures.

**The Sentence Case Rule.** Headings, buttons, and labels are sentence case. Uppercase is reserved for two small marks: the filter group label and the Boss tag in the codex.

**The Rules Are On The Piece Rule.** A card states its own cost, points, and power in words. Type on a piece may get small, but it stays ink and stays bold enough to read on a phone: 11px on a piece, 10px only for a lane-tile name on a phone, a die's name, and a key hint.

Note: the rounded stack is a system stack and has not been chosen as a brand face. Treat the weights, sizes, and tracking above as the system and the family as open. The print face is chosen: Jersey 20. Until a display face is chosen, the landing wordmark's die-cut treatment sits on whatever the platform supplies, which is a plain sans where no rounded face is installed; that is carried, not a rule.

## Layout

Mobile-first, and it must hold at 375px.

- **Shell.** From 768px a white rail (192px wide, full height, 1px right hairline) carries the wordmark and three destinations: Home, Play, Codex. Below 768px the rail is replaced by a floating three-item bar (12px from the screen edges, 16px radius, white at 95% with blur). A sticky cream top bar at every width shows the signed-in name and Log out; on mobile it also carries the wordmark. Login, signup, and the landing page render without the shell.
- **Shell on the run route.** There is none: no rail, no top bar, no floating bar. The cloth runs edge to edge and top to bottom. Three 40px square cream pieces sit 8px from the top right corner of every run screen (clan pick, the opening hand, the match, reward pick, the run summary, and the loading and error states): Home, Codex, and Log out, which opens the same confirm dialog as the top bar.
- **Landing page.** Full-bleed bands stacked in a column at least the viewport tall; the page clips sideways overflow, so cats may hang off its edges. In order:
  - *Lid strip.* Ink, its content capped at 1400px with 12px side padding (20px from 640px), 4px above and 8px below: one line of 12px bold cream text (14px from 640px) on the left, Log in and Sign up as small table buttons on the right.
  - *Hero mat.* A sky band with 8px side padding (16px from 640px), 80px above (84px from 1024px) and none below. Its contents are centred in one column: the plaque and ribbon, then the stage. The stage is the full width below 1024px, 800px from 1024px, 920px from 1280px, and 960px from 1536px (`--half` is half of that, so the crowd can stand against the stage's edges). The ribbon overlaps the plaque's foot by 12px, and the plaque and ribbon together overlap the stage's top by 24px and lie over it. The stage hangs 48px below the mat's bottom edge, over the board.
  - *The demo in the stage.* 8px side padding (12px from 640px), 28px above (24px from 1024px) to clear the ribbon. One column on a phone; from 768px two columns 16px apart, the row and feeder beside a 256px rival column (296px from 1024px), with 14px between pieces down a column. The two score tokens sit in a row under the columns; from 1024px they are docked on the outside of the frame's right edge, 24px down, one above the other.
  - *Board column.* On the cloth, 8px side padding (16px from 640px), 20px above, 64px below (96px from 640px), and one cream board capped at 1040px. The board is four folds. The lead plank has 64px above (to clear the stage) and 20px below (24px from 640px): the lead paragraph and a large "Start a run", stacked on a phone and side by side from 768px. Each panel fold has 16px side padding and 40px above and below (40px and 56px from 640px).
  - *Panels.* A panel is a heading and copy beside a picture in a stage frame. From 1024px it is two columns 40px apart, 1.15fr for the picture and 0.85fr for the text, and the picture alternates sides: left for the cats, right for the rows, left for the rivals. Below 1024px the text comes first and the picture follows 28px under it, with 40px more above the frame for the cat perched on it.
  - *Closing band.* A sky band under a 2px ink line, 16px side padding, 56px above and 160px below on a phone (the corner cats stand in that space), 80px and 96px from 640px. One cream board, capped at 576px and centred, with 20px by 32px padding (40px from 640px).
  - *Footer.* Ink, capped at 1400px like the lid, 16px above and below, 14px cream text.
  At 1440x900 the first viewport ends with the lead plank and its "Start a run".
- **Content column (home, codex).** Centered, maximum 1180px, with 12px side padding rising to 20px at 640px and 24px at 1024px. Bottom padding clears the mobile bar.
- **Rhythm.** A 4px base. On the tabletop zones stack at 10px and sit 12 to 16px apart side by side; pieces in a grid sit at 6px (dice, lane spaces) or 12px (cards, which need room for their edge and cast). Home and codex stack at 16px. Panel padding is 16px; the hero surface uses 24px rising to 36px.
- **The match table.** From 1024px the screen is a rail and a table. The rail is 312px wide, full height, white, with a 2px ink line on its right and no shade (nothing on the table is offset sideways). In page flow at its top: the gauntlet track with "Abandon run" on the same line, the rival stacked in three rows (nameplate; deck and bank piles with counts; last card), then the three round tiles stacked. Stuck to its bottom under a 2px ink line: the turn block, which reads both score tokens side by side, the food with the swap rule, the prompt, and its actions. Theirs is above the line, yours below. The table beside it has 12px side padding: the supply (a 256px column holding the feeder well and the player's deck and discard piles, beside the tray of three face-up cats), then the mat of three lanes divided by 2px deep-sky lines, then the hand. From 1280px a 256px column to the right holds, under the corner buttons, the score sheet, the relic tiles, and the event log, which fills what is left; the column takes the table's height and scrolls in place, so it never makes the page longer than the table, and the lanes share the mat's spare height up to a mat 488px tall. At 1440x900 the whole page is exactly 900px tall with no scroll. From 1024px to 1279px the column drops under the mat (score sheet beside the relics and log) and the page scrolls; the table starts 64px down to clear the corner buttons.
- **The turn block.** In the rail the prompt keeps three lines (60px) and the actions keep two rows (94px) whether or not they are filled, so the block does not jump as the choice changes; on a screen under 848px tall only one action row is kept and a second pushes the block up. The block is rendered twice (in the rail and in the dock) and shown once.
- **The hand.** A fan along the bottom edge, stuck to the bottom of the viewport. Each card is placed about the middle one, a step apart: the step is 82% of a card's width when there is room, and shrinks so the fan always fits its width. A card leans up to 9 degrees and hangs up to 28px below the middle one, and later cards lie over earlier ones. Cards are 184 by 272px with 200px showing; the rest is under the edge of the screen. Beside the rail the hand has no dock: it is over the cloth, 84px of room is kept above it so a raised card never covers the mat, and the cloth is laid again behind the fan so nothing the page scrolls under it shows through.
- **A short screen beside the rail.** Full-size cards and the supply-above-mat order need the height to hold them: 848px from 1280px wide, 912px from 1024px. Under that the hand takes the phone's card (152 by 216px, 120px showing) and the mat stands above the supply, so the lanes are always clear of a raised card and it is the tray that a raised card may cross. In the rail a scored round becomes one line (its number and the two markers).
- **The match on a phone.** Under 1024px it is one column: the gauntlet strip beside the corner buttons, the rival (nameplate and score token on one row, piles and last card on the next), the round tiles (only the current one below 640px), the mat, the supply, then the score sheet, relics, and log (capped at 320px). When a choice or a firing chain happens off screen, the zone it happens in is brought just clear of the docked edge in one cut, not a glide, and a lane comes with the whole mat when the gap can hold it.
- **A lane.** From 640px the activate tile sits in a 152px column to the left of four spaces and an end cap (44px), 6px apart, each at least 60px tall. Below 640px the tile sits above; the spaces are at least 96px tall and the end cap is 28px.
- **The docked edge.** Under 1024px the player's edge of the table sticks to the bottom of the viewport as a dock: white, a 2px ink line along its top. It holds the turn block (prompt, actions, then the food beside the lime score token) and under it the fan; from 640px the turn block is a 272px column beside the fan. Below 640px cards are 152 by 216px with 120px showing, and a strip of a card is never thinner than 44px: a hand too big to fit runs off the side and is panned. The dock grows to hold a chosen card whole.
- **Other run screens.** A centered column, maximum 1120px, 12px side padding rising to 20px at 640px, 56px above (clear of the corner buttons) and 32px below. Clan pick and the opening hand end in a rail docked to the bottom the same way: one sentence saying what will happen, and one cobalt confirm, stacked on a phone and side by side from 640px. Reward pick and the run summary are walked one screen at a time, and each of their screens ends in the stepped rail: "Step 2 of 5" in 12px soft ink above the sentence, then a cream "Back" (absent on the first step) beside the cobalt button. On a phone the two buttons share one line under the sentence and the cobalt one takes the spare width. The climb uses the same rail for its caption and a cream "Skip", with the tower centred in the column above it and the met rival's nameplate to its right. A new step starts at the top of the page with focus on its heading.
- **Grids.** Card grids outside a run are one column, two from 640px, three from 1024px, with a 12px gap. On the table, offers are three across from 640px, the opening hand five across from 1024px, clans two across from 1024px. The feeder is always five dice across.
- **Targets.** Pill buttons are 40, 48, or 56px tall; chips 44px; nav items 48px; dice 64px; table buttons 40, 48, or 56px; the corner buttons 40px square; a hand card's strip the height of the card and at least 44px wide on a phone; a lane's activate tile 48px (60px from 640px); lane spaces 60px (96px on a phone). The Info control on a card is 24px tall with its hit area extended 8px on every side.
- **Keys.** On the match table the keys do what the pieces do: 1 to 9 pick a hand card (or a die, a tray card, or a placed cat while one of those is being chosen; 0 takes one more from the deck), H, D, and P activate a lane or play the chosen card into it, Enter confirms, Esc goes back. Each key is shown as a small hint on its piece, and only where the pointer is fine and can hover.

## Elevation & Depth

Hybrid, split by material and by scope. Chrome is lifted by one soft ambient shadow. Outside the tabletop, game pieces are flat and separated by their ink border and their fill. Inside the tabletop a piece has thickness: a chipboard edge straight down, closed by a 2px ink line, and below it an unblurred cast shadow in a darker tint of whatever the piece lies on. Nothing on the table blurs and nothing is offset sideways.

### Shadow Vocabulary
- **Panel** (`box-shadow: 0 10px 30px rgb(23 33 43 / 0.08)`): the standard white panel and dialogs.
- **Floating bar** (`box-shadow: 0 12px 36px rgb(23 33 43 / 0.18)`): the mobile navigation bar.
- **Auth shell** (`box-shadow: 0 28px 80px rgb(13 60 157 / 0.2)`): the single card on the login and signup pages.
- **Rarity band** (`box-shadow: inset 0 3px 0 <rarity colour>`): the strip across the top of a cat card. An inset band, not a shadow; on the tabletop it is kept as the first layer of the piece's shadow.
- **Piece** (`box-shadow: 0 calc(E + 2px) 0 -2px chipboard, 0 calc(E + 2px) 0 0 ink, 0 calc(E + L + 7px) 0 -2px cast`, where E is the piece's height and L its lift): the edge, the ink line under it, and a cast shadow that shows 3px at rest.
- **Mat** (`box-shadow: 0 5px 0 -2px chipboard, 0 5px 0 0 ink, 0 10px 0 -2px cloth cast`): the sky mat, a 3px board.
- **Tray well** (`box-shadow: inset 0 3px 0 0 cloth cast`): a recess, shaded along its top inner edge.
- **Rail** (`box-shadow: 0 -3px 0 0 cloth cast`): the docked edge, shading the cloth just above its ink line. The rail down the side of a match has an ink line and no shade.
- **Stage** (`box-shadow: 0 7px 0 -2px chipboard, 0 7px 0 0 ink, 0 14px 0 -2px cast`): the landing page's stage frame, a 5px board with a 5px cast in the colour of what it stands on.
- **Board** (`box-shadow: 0 5px 0 -2px chipboard, 0 5px 0 0 ink, 0 10px 0 -2px cast`): the landing page's folded board and the board in the close. The mat's shadow; the cast is cloth cast on the cloth and deep sky in the close.
- **Hero mat edge** (`box-shadow: 0 3px 0 0 chipboard, 0 5px 0 0 ink, 0 10px 0 0 cloth cast`, under a 2px ink bottom border): the lower edge of the landing page's full-bleed sky mat where it lies on the cloth.
- **Fold** (`box-shadow: inset 0 3px 0 0` chipboard at 26% in cream, under a 2px ink top border): the seam between two panels of the landing board, shaded on its far side.
- **Crowd cast** (a flat bar, not a box shadow): under a standing crowd cat or oversized icon, one sprite pixel deep and ten wide (6.25% of the sprite's height, inset 18.75% from each side), in the cast colour of the ground.

### Heights
- **Print (0).** Anything printed on the mat or on another piece: lane dividers, empty spaces, reward steps, markers on a round tile, a tag on a card. A piece nested inside a piece has no height of its own.
- **Token or tile (2px).** Dice, a food token while it can be given up, turn cubes, lane tiles, placed cats, round tiles, relic tiles, table buttons, score tokens, gauntlet markers, the scorepad, the event log.
- **Card (3px).** Cat cards, the rival's last card, the match result sheet, the run summary sheet.
- **Stacks.** A pile's edge grows with its count (2px plus 1px per three cards, to 9px). A placed cat with cats tucked under it stands 4px, then 6px.
- **Landing furniture.** The title plaque stands 5px and its ribbon 3px. The stage frame is a 5px board; the folded board and the board in the close are 3px boards like the mat.
- **Cast colour.** On the cloth, chipboard at 42% in cream. On the mat, deep sky. On the docked edge and on the side rail, chipboard at 34% in white. On the landing page's sky bands, deep sky; on its ink lid strip and footer, a darker ink (`#0b1118`).

### States of height
- **Liftable** (hover, fine pointers only): the piece rises 2px and its cast shadow grows by 2px.
- **Lifted** (chosen): the piece rises 4px and its cast shadow grows by 4px.
- **Raised** (a hand card that is hovered, focused, or chosen): the card loses its lean, stands clear of the bottom edge by 12px with its whole face showing, and lies over the rest of the hand. The cards beside it do not move.
- **Pressed** (active, or a lane tile while its lane is being chosen or resolved): the piece sinks 2px and its edge shortens by 2px.

### Named Rules
**The Scoped Thickness Rule.** A game piece casts no shadow outside the tabletop: on home, the codex, auth, and in every dialog it is border and fill. Inside the tabletop (the run route and the landing page) every piece has an edge and a cast shadow, straight down and unblurred. No piece anywhere takes a blurred shadow or a sideways offset.

**The Frame Means State Rule.** On the tabletop a piece's state is its border: cobalt border for open to pick, cobalt border with a 2px cobalt inner line for chosen, cobalt border with a 2px cobalt and a 2px lime inner line for waiting on the player. A chosen piece is also lifted. No ring is drawn outside a piece's border.

**The Three Heights Rule.** A thing on the table is print (0), a token or tile (2px), or a card (3px). Only a stack is taller, and its height is its count. The landing page's title plaque and stage frame are the box's furniture, not things in play, and stand 5px.

## Shapes

Two corner languages, one per material.

- **Chrome is rounded.** Panels 20px; flat panels, the mobile bar, and the inner auth card 16px; inputs, nav items, and inline notes 12px; the home hero and the auth shell 28px; pill buttons and chips are full pills. Chrome borders are 1px hairlines of ink at 8 to 15%.
- **Pieces are square.** Cat cards, the mat, lanes, spaces, dice, tags, table buttons, the gauntlet track, score tokens, and the landing page's lid buttons, plaque, ribbon, stage frame, and board have no radius and a solid 2px ink border. Small marks on a piece (a key hint, the cached and tucked tag, the Boss tag) use a 1px ink border.
- **Printed and empty spaces are outlines.** On the mat an empty space is a 2px deep-sky outline; the next free space is a 2px dashed ink outline (55%) over white at 45%. An empty pile and a rival yet to come on the gauntlet track are 2px dashed ink outlines (35 to 40%). A food the player holds none of is its own icon at 35%, so its place still says which food it is. The landing demo and the lane showcase print their empty spaces the same way.
- **Sprites are pixels.** A 16x16 grid drawn with crisp edges. Sizes in use in the app: 32, 40, 44, 48, 64, 72, 96, 144, and up to 320px. The landing page uses 32, 48, 64, 80, 96, 112, 128, 144, 160, 176, 192, 256, 288, and 320px, each a whole multiple of 16.
- **Icons.** Navigation and the password toggle use 20px line icons with a 2px stroke and round caps, drawn inline. Anything that sits on a piece is drawn as pixels instead: the tabletop's icons are 8x8 grids shown at 16px (24px on a lane's activate tile), with an outline colour and one fill; on the landing page three of them stand on the cloth as oversized members of the crowd, a die at 64px and yarn and a fish at 96px.

## Components

### Buttons
Capsules with the bold display voice; they press down 2px and shrink to 99% over 140ms. They belong to chrome: dialogs, home, the codex, auth. They are not used on the tabletop, the landing page included.
- **Shape:** full pill (999px), 1px border in the fill colour.
- **Sizes:** small 40px tall, 12px text, 8px by 12px padding; medium 48px, 14px text, 12px by 20px; large 56px, 16px text, 16px by 28px.
- **Primary:** cobalt with white text; hover goes to pressed cobalt. One per decision.
- **Secondary:** soft sky with ink text; hover goes to board sky. Cancel, back, retry.
- **Hero:** lime with ink text and a soft lime glow (`0 10px 20px rgb(216 255 79 / 0.24)`). Defined in the button component; no screen uses it now that the landing demo's confirm is a table button.
- **Danger:** coral; hover darkens 5%. Log out and abandon run, always inside a confirm dialog. The build sets this label in white, which breaks the Ink On Colour Rule and is hard to read; that is carried, not a rule.
- **Disabled:** 45% opacity, not-allowed cursor.
- **Focus:** 3px cobalt outline, 3px offset. This is the global focus treatment for every focusable element, on and off the table.
- A link that navigates but looks like a button uses the same classes on a real anchor.

### Table Button
An action on the table is a piece, cut from the same card as everything else.
- **Shape:** square, 2px ink border, a 2px edge that sinks when pressed.
- **Sizes:** small 40px tall, 12px text, 10px side padding (the default); medium 48px, 14px text, 16px side padding; large 56px, 16px text, 24px side padding. Weight 900. The large size is used only on the landing page.
- **Primary:** cobalt with white text, hover to pressed cobalt. The one confirm of a decision: "Take 2 dice", "Keep these 5", "On to Madame Mittens". In a stepped rail it is also the one way forward: "Next", or "Skip" on a pick step with nothing chosen. The button in a rail is the medium size.
- **Secondary:** cream with ink text, hover to soft sky. Everything else: Back, Skip, Undo, "Place for me". On a cloth-coloured well it is white.
- **Disabled:** 45% opacity.
- **Key hint:** a confirm carries "Enter" and a back carries "Esc" as a hint inside the button.
- **Link:** a link dressed as a table action is the same piece on a real anchor, in either variant and any size; it defaults to the medium cream button, which is what a link that leaves the table ("Open the codex") uses. On the landing page Log in is the small cream button, Sign up the small cobalt one, and "Start a run" the large cobalt one (medium inside the demo).
- **Stepper:** a 40px white square piece for one more or one fewer.
- A way out of the run that is not a move in the game ("Abandon run") is an underlined 12px bold text link, not a piece. The ways off the table are the corner buttons.
- **Icon:** a 40px cream square holding one 16px pixel icon, with the action as its accessible name and tooltip. The corner buttons.

### Chips
- **Style:** 44px pill, white with a 1px ink hairline (15%), 14px bold ink text; may lead with an element mark.
- **State:** selected is cobalt fill, cobalt border, white text; hover on unselected is soft sky. Used for codex filters and codex section links.

### Cards / Containers
- **Panel:** white, 20px radius, 1px ink hairline (8%), the panel shadow, 16px padding, optional title row. Chrome only.
- **Flat panel:** white, 16px radius, hairline, no shadow. The codex link row, skeleton cards.
- **Hero surface:** board sky, 28px radius, 24 to 36px padding; holds a 144px sprite, a greeting, the display headline, and one large button.
- **Dialog:** a panel, 448px maximum, over a 40% ink scrim; bottom-anchored on a phone, centered from 640px. Buttons stack on a phone with the primary on top and sit right-aligned from 640px. Dialogs opened from the table (a cat's full card, a scored round, abandon run) are chrome like any other: rounded, pill buttons, and the card inside is flat. A placed cat's dialog adds, under its card, a 14px bold line naming the cat and how many are tucked under it, then those cats as flat compact cards two across (one on a phone), oldest first.
- **Skeleton:** soft sky bars with a 1px edge border and a pulse, shaped like the content they replace.

### Inputs / Fields
- **Style:** white, 48px tall, 12px radius, 1px edge border, 16px text, 16px side padding. The label sits above in 14px extra-bold ink.
- **Focus:** the border turns cobalt. The build also removes the global focus outline from text inputs; that is carried, not a rule, and a new field keeps the outline.
- **Error:** a message below the fields on a 10% coral tint with ink text, 12px radius. Space for it is reserved so the form does not jump.
- **Disabled:** 60% opacity.

### Navigation
- **Rail (768px and up):** 48px items, 12px radius, icon plus 14px bold label. Inactive is soft ink and takes a soft sky fill on hover; active is cobalt with white text.
- **Bar (below 768px):** three equal columns, icon over an 11px bold label. Active is a soft sky fill with cobalt text.
- **Corner buttons (run route only):** four cream icon table buttons 6px apart in the top right corner, in a `nav` named "Table": a speaker (the sound), a house (Home), a book (Codex), a door with an arrow (Log out). The run route has no other navigation. The speaker is the only one that is not a way off the table: each press moves the sound on from full (two waves) to quiet (one wave) to off (crossed out) and back. In a match under 640px the corner holds the other three, the gauntlet track beside them needing the room, and the speaker sits at the top right of the turn dock.
- **Wordmark:** "Hadu" in ink, "Mon" in coral, bold rounded, 24px in the rail.

### Cat Card
The signature piece. Cream face, 2px ink border, square, 8px padding, with the rarity band across the top. First line: the sprite (44px compact, 72px full), the name in the card-title style, the cost as a row of 16px food icons beneath it, and the points in a lime tag at the right. A compact card under 196px wide gives the name and cost a line of their own under the sprite and the points, so a name is never cut to a letter or two. Then, under a faint ink rule, the power written out in 12px text. A legendary adds its relic as a second 12px line under the power, starting "Relic: from now on". In a match, a hand card shows its cost with any discount from a legendary's relic already taken off. The full variant adds a soft-ink line for rarity, element, rows, and yarn capacity, and the flavor text in italics. A locked card drops to 60% opacity, greys its sprite, and shows the unlock hint in place of the power. On the tabletop it stands at card height. A cat that lives in every row prints "lives in Hunt or Den or Prowl" on that line; that is carried, not a rule.

When a card is a choice (tray, offer, opening hand) the whole card is the select control, and its footer carries a soft-ink line saying which lanes it can go in, the key that picks it, and a small white "Info" piece that opens the full card in a dialog and never selects. Open to pick: cobalt border. Chosen: cobalt border and inner line, lifted 4px, and the footer reads "Chosen" in cobalt.

The hand face is the card held in the fan: portrait, 184 by 272px (152 by 216px on a phone). The two numbers a player compares stand in the first 32px, which the thinnest strip of the fan still shows: the lime points tag at the top left, and the cost under it as 16px food icons two across. The sprite (64px; 48px on the narrow card) stands beside them and the name runs under both, so a neighbour may cut the sprite and the name but never the numbers. Under a faint ink rule the power and a legendary's relic are written out in 12px (11px and clamped to four lines on the narrow card; Info has the rest). The key that picks the card is a hint standing on its top edge, above the points tag. The footer puts Info at the bottom left, inside the strip, and the lanes at the right. Only the strip takes the pointer or a tap, so sweeping along the fan raises one card after another; a chosen card on a touch screen is put back by tapping anywhere on its face. Open to pick (a tuck): cobalt border. Chosen: cobalt border and inner line, raised, and the footer reads "Chosen". A card that cannot be played now is washed with cream at 34%, which keeps its text above 4.5:1 (a see-through card would show the one under it) and its footer says what it lacks ("Not enough food", "No room", "Not enough yarn"); it stays selectable, so the prompt can say why, and the wash lifts while the card is raised. Keyboard focus is a 3px cobalt outline around the whole card.

### Food Icon, Element Mark and Food Token
Cats cost cat food, and each food is its own 8x8 pixel shape with an ink outline, filled with the primary fur tone of the element that eats it: Beef (Flame, a steak), Fish (Mist), Chicken (Volt, a drumstick), Dry food (Thorn, a full bowl), Pork (Shade, a rasher). A Treat pays for anything and is a white spark; a cost that any food pays is a white question mark. No square is drawn around a food. It is shown at 16px on cards and in lists and at 24px on a die or as a token, always a whole multiple of the grid. The code still calls food essence and keys it by element.

An element named on its own (a codex filter, a clan, a past run) leads with its element mark instead: a flame, a drop, a bolt, a leaf, or a crescent, drawn and filled the same way at 16px.

In the turn block the food the player holds is a row of 24px icons each followed by its count in the card-title style, with the rule "Any 2 food pay for 1 you lack." printed under the row in 11px soft ink. A food the player holds none of is its icon at 35% with a soft-ink 0. While a cat that is short is selected, each food that can be given up becomes a token-height button with the cobalt open frame; a food already given up fills lime with the chosen frame and its count shows what would be left. Tapping an open food gives one up; tapping one that can give no more takes it back.

### Die
A white square piece, 64px tall, holding a 24px food icon above the food's name in 10px bold. The name always keeps two lines of room ("Dry food" needs them), so every die in a row is the same width and the same height whatever it shows. Selected fills lime and, on the tabletop, lifts 4px; hover is soft sky. It is a button only while dice are being chosen. On the table the feeder's dice sit in a tray well.

### Mat, Tray Well, Rail
The three surfaces of the tabletop under the pieces.
- **Mat:** board sky, 2px ink border, a 3px board. Pieces on it cast deep sky. In a match it holds the three lanes; on the opening-hand screen it holds the round tiles.
- **Tray well:** cloth, 2px ink border, a 3px inner shade along the top. It holds the feeder, an empty tray's message, and each clan on the clan pick screen (a chosen clan's well takes a 4px cobalt line inside its border).
- **Rail:** white, a 2px ink line along its top, a 3px shade on the cloth above. The docked edge of a narrow match and the confirm rail of the other run screens.
- **Stepped rail** (`StepRail`): the same rail for a screen that is one of several. Left: the step count as a label (left out when there is only one step) over the sentence. Right: a medium cream "Back" and the medium cobalt button. Both are held while the last step's confirm is being sent.
- **Side rail:** white, a 2px ink line down its right, no shade. The left of a match from 1024px.

### Lane
One of three lanes printed on the mat.
- **Activate tile:** a cobalt tile with the lane's pixel icon (24px), its name in print at 20px, and what activating gives now in 12px bold ("Take 2 dice"), white text. While its lane is being chosen or resolved it is lime with ink text and pressed. The other tiles dim to 55% while a turn plays back.
- **Placed cat:** a cream tile with the sprite (40px on a phone, 48px from 640px), the cat's name, and a yarn track. The tile lays out by its own width: the sprite stands over the name, centred, until the tile is 168px wide, and only then are they set side by side, so a name is printed whole. The yarn track is one 16px yarn icon per space of capacity, lime with an ink outline when held, lime with a cobalt outline when chosen in a Den but not yet laid, a chipboard outline when empty. What the cat holds besides yarn (cached, tucked) is a small white tag on the sprite's corner. Tapping it opens the cat's card, which lists the cats tucked under it, or lays yarn during a Den (cobalt border while it can take one). Waiting on the player: the cobalt and lime frame. Firing: lime, pressed.
- **Next free space:** a dashed outline printing its yarn cost and the reward the lane gives now, with the lime marker on that reward. When the chosen card can go there it becomes a lime "Play here" piece with the cost under it.
- **Later spaces:** deep-sky outlines printing their yarn cost (yarn icons, with the words from 640px) and the reward the lane will give once it reaches them.
- **End cap:** a cobalt pixel chevron pointing left (powers fire right to left) above the reward of a full lane.
- **Reward step:** a numeral in the card-title style and a 16px icon of what is counted (die, yarn, card), 24px tall; the step the lane is on has a lime fill and a 2px ink border.

### Round Tile and Turn Cube
Three tiles, one per round: stacked in the match's rail, across the cloth above the mat from 640px to 1023px, and across a mat on the opening-hand screen. Each prints "Round n" at 20px, the round's turns as 12px cubes (lime piece for a turn still to play, a deep-sky outline once spent), the goal with its pixel icon and what it pays, and how the goal stands or went as a lime marker for the player and a coral marker for the rival. The current round's tile is white; the others are cream; a scored round drops to 80% opacity. In the rail a round that is not being played is cut down: 11px goal text, and a scored round keeps only its goal's name beside the two markers.

### Rival Side
- **Nameplate:** a coral tile with the rival's name in print at 20px, an ink Boss tag (cream text, 11px) for a boss, and its trait in 12px bold. On the opening-hand screen it also prints the flavor line in italics. In a run on Stray or Apex it carries the tier as a white tag (ink border, 11px at weight 900) beside the name, and its trait line ends with the head start the tier gave it ("Started 2 points ahead, as 2 yarn."). A Kitten run's plate has neither.
- **Pile:** a 36 by 48px card back with a pixel paw and a white count tag on its top corner: cobalt for the player's deck, coral for the rival's deck and bank, cream for a face-up discard. Empty is a dashed outline.
- **Last card:** a card-height piece saying what the rival flipped last in 14px at weight 900, and under it what is still in its deck in 11px soft ink. Cloth before any card, cream after, coral for a moment when a card has just turned.
- **Score token:** a tile with "Rival" in 11px bold over the score in print at 30px, coral. The player's, in the turn block, is the same in lime and reads "You". In the rail the two stand side by side at the top of the turn block, label left and score right, and the rival's side does not repeat its own. Both numbers roll to a new value instead of jumping to it, and the player's token has score heat behind it while a chain runs (see Motion).

### Scorepad, Relic Tile, Event Log
- **Scorepad:** a white tile holding both score sheets side by side: a lime "You" tag and a coral tag with the rival's name, lines in 12px divided by hairlines, the total under a 2px ink rule in print at 20px. The same sheets appear on the match result.
- **Relic tile:** a cream tile, name in the card-title style followed by its text in 12px.
- **Event log:** a white tile headed "What just happened" in print at 20px. The newest turn is at the top at full strength; older turns sit under a hairline at 75%. A power's line is plain ink; a note is soft ink; the rival's line is a coral marker and a scored goal a lime marker, each with a 2px ink border.

### Gauntlet Track and Run Strip
Six markers, 28px wide, numbered in print at 20px: a lime tile for a rival beaten, a coral tile for the one across the table (lifted) or the one that ended the run, a dashed outline for those to come. Bosses stand taller (36px). Beside it, the clan, the tier and the deck size in 12px soft ink ("Cinder Clan · Stray · 16 cards"), and "Abandon run" as an underlined text link that opens a confirm dialog. In the match's rail the strip is the track, the tier's name, and the link.

### Tower and Climb
Between matches the run is shown as a tower, whole, with no camera: a grey ribbed cat condo of six floors, the first match at the bottom, under a roof slab and on a foot with a flat cast on the cloth. It is not a piece: it has no chipboard edge and takes no clicks. It is drawn as pixel rows in `src/components/sprites/tower.ts`, at the sprites' own pixel size (2px, or 3px from 640px wide and 800px tall), so a 16x16 sprite stands on it unscaled.
- **Floor:** 28 pixels tall with a stepped round window; a boss's floor is 36 tall with a larger square window under a lintel, as a boss's marker stands taller on the gauntlet track. Each floor has a ledge to the left for Hadu.
- **Window:** a hole through the tower, deep stone inside. A rival still to be met looks over the sill (its top ten rows showing); the rival of the floor Hadu is on sits in it whole. A floor that has been won is dark and empty.
- **Hadu** is always the climber, whatever the clan. He stands on the ledge of the current floor, at the foot before the first match, and on the roof after the last.
- **Pennant:** the 8x8 goal icon in lime, planted on the ledge of every floor won and on the roof when the run is won. It is the only lime on the tower.
- **Nameplate:** the met rival's coral nameplate with its flavor line lands beside its floor on the last beat.
- **Rival sprites** (`src/components/RivalSprite.tsx`, data in `src/components/sprites/rivals.ts`): Alley Tom (a bitten ear and a plaster), The Dockside Twins (two small cats, one in a striped cap), Madame Mittens (a feathered hat, pearls, white paws), The Rooftop Syndicate (a flat cap, two more heads behind), The Archivist (white spectacles and an index card), Old Nine Lives (a crown, one eye shut, white whiskers). Only a boss's sprite reaches the top row.

### Other Run Screens
- **Tier pick:** on the clan pick, above the clans, under a 20px print heading "How hard": three cream tiles in a row from 640px and stacked below it, each at least 56px tall with the tier's name in print at 20px over its exact rule in 12px at weight 600 ("Every rival starts 2 points ahead, as 2 yarn."). The chosen one is lime and pressed. The last tier chosen is offered again on the next visit, and the rail's sentence names it ("Cinder Clan on Stray.").
- **Clan pick:** each clan in a tray well: its name in print at 20px, what it does, a cobalt "Choose" tile (lime and pressed once chosen, white for a locked clan), its relic tile, and its starting deck spread out as small tiles (sprite, count, name).
- **Opening hand:** the rival's nameplate with flavor, the round tiles on a mat, the hand five across to keep from, five food tiles to keep from (white; lime, framed, and lifted when kept), then the feeder, piles, and tray as they will be on the table.
- **Match result:** a white card-height sheet: the headline in print at 30px, the score in a lime marker for a win or a coral one for a loss, both score sheets, and the three goals in a sentence each. It is the first step after a match, alone on its screen.
- **Reward pick:** up to five steps under the run strip, each with a 30px print heading and one line of text: the match result; "Add a cat", cats as cards; "Take a relic", relics as cream tiles (lime, framed, and lifted when chosen); "Trim a card", the deck spread out as small tiles (a tile marked for trimming turns white, takes the chosen frame and lift, and carries an ink "Trim 1" tag); and the recap. A step with nothing to offer is left out. The rail says what the step has settled ("Adding Flameclaw.", "No relic.") and its button reads "Next" with a pick and "Skip" without. The recap, "Ready for <rival>", lists each choice as the piece it is (a card, a relic tile, a trim tile) or as a plain line when it was skipped, each with a small cream "Change" that goes back to its step, then the deck size before and after. Only the recap carries the confirm, "On to <rival>".
- **Run summary:** up to three steps. The last match's result. "Unlocked", new unlocks as their own pieces (a clan unlock is a lime tile), left out when the run unlocked nothing. Then the summary: the headline in print at 30px, the gauntlet track, a white card-height sheet with the run as a table (won and lost as lime and coral markers), "Nothing new this time." when there were no unlocks, and a cream table link to the codex. The summary's rail button is "Start another run". An abandoned run has no result step.

### Status Marks and Notices
- **Marker:** a fill with a 2px ink border, bold ink text, tabular figures; lime for the player, coral for the rival. Used for goal standings, results, and log lines.
- **Key hint:** a white 16px mark with a 1px ink border (60%) and a 10px bold letter, on the corner of the piece it works. Hidden unless the pointer is fine and can hover.
- **Empty state (chrome):** a 2px dashed ink outline (20%) with one line of copy and a secondary button.

### Lid Strip and Footer (landing page)
The lid of the box, top and bottom.
- **Lid strip:** an ink band with cream text. Left, one line in 12px bold (14px from 640px): "Free. Nothing to install. Nothing for sale." (the middle sentence drops below 640px). Right, Log in as a small cream table button and Sign up as a small cobalt one, 10px apart.
- **Footer:** the same ink band, one 14px line and "Log in" as a bold underlined text link.
- **On ink:** a piece casts a darker ink (`#0b1118`), and the focus outline is lime, because the cobalt one is lost on ink.

### Title Plaque and Ribbon (landing page)
The title of the box, lying over the top of the stage.
- **Plaque:** a cream piece, 2px ink border, standing 5px, holding the landing wordmark. Padding 8px above, 20px below, and 20px at the sides; 10px, 24px, and 36px from 640px.
- **Hadu:** the 64px sprite (80px from 1024px) stands on the plaque's top edge, 16px in from its right end (28px from 640px), with no cast.
- **Ribbon:** a lime piece, 2px ink border, standing 3px, overlapping the plaque's foot by 12px. It carries the page's h1 in print, 30px on a phone and 40px from 640px, centred, in two lines on a phone. Padding 8px by 16px, 10px by 24px from 640px. It is the named exception to the Lime Is Yours Rule.

### Stage Frame (landing page)
The thick frame around the playable round and around each panel's picture.
- **Frame:** from the outside in, a 2px ink line, a cobalt band (6px, 10px from 640px), and a 2px ink line. A white square stud sits in each corner of the band, 2px in from the frame's outer line (2px square, 6px from 640px).
- **Depth:** a 5px board edge closed by a 2px ink line, and a 5px cast in the colour of the ground.
- **Ground inside:** the cloth, laid again with the `cloth` class, so pieces inside cast on cloth. The cast panel's frame holds a sky band instead, and pieces in it cast deep sky.
- **Crowd:** cats handed to a frame are placed against the frame's own box, so they keep their place at every width.

### Crowd (landing page)
Cats as decoration: they say nothing, take no clicks, and are hidden from assistive tech.
- **A crowd cat:** a sprite at a whole multiple of 16, facing either way. One that stands on the ground casts a flat bar one sprite pixel deep; one perched on an edge or cropped by one casts nothing.
- **Around the hero stage, from 1280px:** seven cats. Hadu on the plaque, two perched on the stage's top edge (128px), one standing on the mat each side of the stage (192px left, 176px right), and a far bigger one behind each of those (320px left, 288px right), placed from the page edge and cropped by it.
- **1024px to 1279px:** the two big back cats go; the side cats stand whole in the margins at 96px, and the perched cats are 112px.
- **Below 1024px:** the margins go. Hadu on the plaque, two 64px cats on the stage's top edge (a third from 640px), and one cat hanging off the stage's bottom right corner, cropped by the page edge (96px, 128px from 640px).
- **On the panels' frames:** one cat perched on the top edge of each picture's frame (96px on the cast frame, 64px on the other two).
- **Beside the board, from 1280px only:** three cats (160px, 192px, 144px) overlapping the board's edges, and three oversized pixel icons standing on the cloth clear of it: a white die at 64px, white yarn at 96px, and a fish at 96px in the Mist fur tone.
- **In the close:** one cat cropped into each bottom corner of the sky band, 160px on a phone; 320px left and 256px right from 640px.

### Hunt Demo (landing page)
One round of Hunt against the first rival, run by the real engine in the browser and laid out as the match table is. Nothing is saved.
- **Lane on a mat:** the Hunt row is a mat (8px padding, 10px from 640px). Its top line holds the lane chip on the left and, on the right, "Round 1" in print at 20px over five turn cubes.
- **Lane chip:** a tile with the paw icon (24px), "Hunt" in print at 20px, and a 12px bold line. While the round is on it is lime and pressed and reads what activating gives ("Take 2 dice"); once the round is over it is cloth, at rest, and reads "Round over". It is not a button.
- **Slots:** three cats, one empty space, and an end cap, 4px apart (6px from 640px), at least 112px tall. Below 1024px the empty space is narrower than a cat (0.6 of one); the end cap is 20px wide on a phone and 44px from 640px. A filled slot is a cream tile holding a "Fires 1st" mark (white, 1px ink border, 10px bold, 11px from 640px), the sprite (48px, 64px from 640px), and the cat's name (10px, 11px from 640px, weight 900). A cat with cats tucked under it stands 4px, then 6px, and carries a white tag with the tucked icon and the count.
- **Printed empty space:** the next free space is the dashed ink outline (55%) over white at 45%, printing its yarn cost as 16px yarn icons over "2 yarn" in 11px bold. A later space would be a deep-sky outline. The end cap is a cobalt chevron over the reward of a full row.
- **Power list:** under the slots, one 12px line per cat in the order they fire, the name at weight 900. The line of the cat that is firing fills lime with a 2px ink line inside it.
- **Feeder well:** a tray well under the mat. Its label reads "Feeder. Pick 2 dice." in 12px bold soft ink; five dice across, capped at 384px; the chosen dice are lime and lifted.
- **Confirm:** a medium cobalt table button reading what it does ("Take 2 dice"), under the dice on a phone and to their right from 640px. It is disabled until the right number of dice is chosen. While the turn lands it is lime with ink text, pressed, at full opacity, reads "Hunting", and the dice are disabled.
- **Rival's side:** the rival's coral nameplate, then the last card: a card-height piece with one 14px line at weight 900 and one 11px line under it. Cloth before any card has turned, cream after, coral while a card has just turned. The second line reads "Flips one card after each of your turns."; after a burn it reads "Burned from the tray, not from your row."
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
- **Mat:** a 12px bold line across the top ("Every power in a row fires right to left.") with a cobalt chevron, then the three lanes divided by 2px deep-sky lines.
- **Lane tile:** the lane's activate tile as a button: cobalt with white text, pressed cobalt on hover, lifting; the chosen lane's is lime with ink text and pressed. From 640px it sits in a 132px column to the left of its spaces; on a phone it sits above them.
- **Spaces:** four spaces and an end cap (28px, 36px from 640px), 6px apart, at least 56px tall, each printing its yarn cost (16px yarn icons, or "Free") over the reward the lane gives with that many cats in it. The chosen lane's spaces are dashed ink outlines (55%) over white at 45%; the others are deep-sky outlines.
- **Readout:** under the mat, a white tile: the chosen lane's name in print at 20px and one 14px sentence saying what it pays.

### Rival Fan (landing page)
The six rivals of a run as coral nameplates climbing a staircase, in a stage frame on cloth. The list is in the order they are met; the first is at the foot and the last boss on top.
- **Plate:** a coral tile, 8px by 12px padding, 12px above the next. Each plate is the same width and steps right as it climbs, 6px a step on a phone and 22px from 640px.
- **On a plate:** the rival's number and name in print at 20px, an italic 14px flavor line under the name. A boss's number and name are 30px, and the name is followed by the ink Boss tag (cream text, 11px, weight 900).

### Close (landing page)
A cream board on the closing sky band, centred, casting deep sky. It holds a print heading ("Your first rival"), the first rival's nameplate with its flavor line (capped at 384px, left-aligned), a large cobalt "Start a run", and one 16px bold line. A big cat is cropped into each bottom corner of the band.

### Motion
Short and functional. Chrome: press feedback is 140ms; the auth card rises 12px and fades in once over 320ms on an ease-out curve; skeletons pulse. All animation and transition durations collapse under `prefers-reduced-motion`.

The landing page is a tabletop and moves like one. The demo lands a turn one step at a time, 560ms apart. The cat whose power is firing turns lime and makes one small jump (4px up and 7% larger, back in 380ms on an ease-out), and its line in the power list fills lime; the rival's last card takes the tabletop's flip (380ms) and is coral for that step. The crowd idles on a bob: 2px up and back in two steps every 1.6 seconds, each cat started at a different point so no two move together. When the row fires the crowd hops with the chain, 14px at the top in four steps over 360ms: the cluster right of the stage on the first slot to fire, the cat on the plaque on the middle one, the cluster on the left on the last. When the round is won every cat on the page hops three times. Under reduced motion the crowd is still and the steps land at once. The landing page makes no sound.

On the tabletop cardboard moves like cardboard: smoothly, with a little spring, and it settles. Pixel sprites (the crowd, Hadu on the tower, a rival in its window) still move in whole steps. Nothing fades in on load. Every effect moves `transform` and `opacity` only; springs are worked out ahead of time and played as plain keyframes (`src/components/run/fx/spring.ts`).
- **Lift and press:** the move takes 150ms on a curve that goes a touch past and settles (`cubic-bezier(0.2, 0.9, 0.3, 1.25)`). The edge and cast shadow under the piece change with it in 2 steps over 120ms; a shadow is never eased.
- **The fan:** a hand card stands up, or settles back, in 220ms on the same curve; the cards that are left close up the same way when one is played. Nothing else in the hand moves when a card is raised. A raised card leans up to 5 degrees toward a mouse held over it; touch and reduced motion leave it flat.
- **The firing chain:** an answered turn is played back a step at a time before the table takes input again. The played card or the taken dice travel to where they land in 300ms, out fast and slowing in on a slight arc, and the piece they land as gives under them and springs back. Each cat in the lane then fires from right to left: its tile turns lime and pops (a spring of about 400ms: up 4px, 7% larger, tilted under 2 degrees, each growing a little with every power before it), its line lands in the event log, and the tile returns to cream over 520ms. A cat firing twice running pops twice.
- **What a power shows:** points scored rise off the cat as a lime chip ("+2", print at 20px, 2px ink border) that springs out, drifts up 34px and fades in 720ms, with a burst of 4px pixel sparks (lime with an ink line, and ink) thrown out and falling. A food token or a cat that changed takes a quick punch (16% larger, about 240ms). Counts and scores roll to their new value (70ms a step, between 140ms and 520ms). A power that changed nothing shrugs sideways 3px and shows nothing else.
- **Pace:** the first power holds 380ms and each one after it 12% less, down to a floor of 180ms, so a long chain speeds up. The player's own move holds 440ms (a piece in flight lands inside it), the rival's card 540ms, a scored goal 760ms, and the end of a match 1 second.
- **Score heat:** from the third power of a chain a soft deep-lime light grows behind the player's score, at full strength by the eighth, and fades when the turn has landed.
- **Then the rival:** its card turns edge-on and back (380ms) and stays coral for about 1.4 seconds, the prompt line in the turn block takes a coral marker for that step, and what it scored rises off its total as a coral chip. A token that arrives drops 7px into place (240ms); rerolled dice tumble in one after another (340ms each, 30ms apart).
- **Shake:** the mat and the supply jolt a few pixels and settle (about 400ms) when one power scores 4 or more, deep in a long chain, when the rival raids or burns, on a lost goal, and harder on a lost match. Nothing else on the table shakes.
- **Limits:** one frame throws at most 12 sparks (6 under 640px) and floats at most 4 numbers. Everything drawn over the table lives in one layer that takes no pointer and is not read out.
- **During the chain** the prompt says what is happening in a sentence, and its only action is a cream "Skip". Any click or key skips to the end: every animation is finished and every sound cut at once, and the press does nothing else. The last frame is always the server's own view.
- **The end of a match:** on the result sheet that follows, the player's lines are counted up one at a time, 190ms apart, the total rolling up with them; on a win the total lands with a punch and a burst. This happens once, straight after the match; a reload, or coming back to the sheet, shows it as it is.
- **Light:** three things on the tabletop may glow, and nothing else. Score heat. A legendary in the hand, which has one band of light cross its face every 2.2 seconds while it stands up. And the cloth of a run, which has a wide, faint patch of white light drifting across it and back over 26 seconds, under every piece. The landing page has none of the three.
- **Reduced motion:** the whole turn lands at once and numbers are simply set; nothing travels, pops, floats, sparks, shakes, leans, shimmers or drifts, and the result sheet is not counted up. The rival's card still colours for a moment so the flip is seen, and the turn is heard as one soft thud.
- **The climb:** plays when a run starts (Hadu lands at the foot, the windows fill from the bottom up in pairs 160ms apart, he goes up to floor 1), after a reward is confirmed (the window of the floor won goes dark and its pennant lands, he goes up one floor, the next rival comes out), and after the last match is won (he goes up to the roof and a pennant lands there). Beats are 380ms, 480ms for a window shutting or a pennant landing. Hadu moves between ledges in 320ms of 4 steps and hops as he lands (the crowd's hop); a rival slides up into its window in 240ms of 3 steps; the nameplate and pennants drop in as any token does. The last frame rests 1.4 seconds and then gives way to the next screen by itself. Any click or key leaves at once, in one press, and that press does nothing on the screen that follows; a key still held from the confirm does not count. Under reduced motion only the last frame is shown, for 2.2 seconds. A lost match does not climb, and a reload skips the climb as it skips a turn's playback.

### Sound
The match has sound, and nothing else in the product does. Every sound is made in the browser with the Web Audio API from a written recipe (`src/components/run/sfx/recipes.ts`); there are no audio files.
- **Voices:** the player's pieces are short and bright, in triangle and sine waves: a card leaving the hand and landing, dice taken, yarn laid, food gained, a cat drawn, cached or tucked. The rival's card is lower and sawn, so it is never mistaken for one of the player's powers; a raid and a burn follow it as noise.
- **The chain:** each power that lands plays one step further up a major pentatonic scale from E4, stopping two octaves and a third up. With the pace it is what makes a long chain feel like one. A power that changed nothing plays a dull low note and does not climb. Each point scored adds a short tick, at most five a step.
- **Moments:** a won goal is three rising notes and a lost one two falling; winning a match is a four-note run into a held chord, losing it three low falling notes. The result sheet ticks once a line, rising.
- **The table's controls:** raising a card or picking a die is a rising blip, backing out a falling click, a card passing under a mouse a very short tick, and a move the table refuses a low double buzz.
- **Limits:** no note is louder than half scale; everything passes through one limiter; at most 14 voices sound at once. Nothing plays in a background tab, and a skip cuts every voice and plays one soft thud.
- **Control:** the speaker in the corner: full, quiet, off. The choice is kept in the browser. Sound starts on the first press or key, as browsers require; a muted table never opens an audio session.

## Do's and Don'ts

### Do:
- **Do** decide which material a new element is before styling it. In play: square, 2px ink border, flat fill. Around play: rounded, white, hairline, soft shadow.
- **Do** decide which scope a piece is in. Inside the tabletop (`TableSurface` on the run route, the landing page's own root) it is cardboard: give it the `piece` class and let the tabletop add the edge. Anywhere else it stays flat.
- **Do** pick one of the three heights for a new thing on the table: print, token or tile (2px), card (3px).
- **Do** render every cat through `src/components/PixelSprite.tsx` and every rival through `src/components/RivalSprite.tsx` at a whole-pixel multiple of 16 where the layout allows, and every mark on a piece through `src/components/PixelIcon.tsx` at a multiple of 8.
- **Do** use ink text on lime, coral, sky, and cream; white text only on cobalt.
- **Do** show state on the table with the frame (cobalt border, cobalt inner line, lime inner line) and with height (lifted 4px, pressed 2px), and reinforce a chosen token with a lime fill.
- **Do** end every choice in a run in the turn block or a rail, with a sentence saying what will happen and one cobalt table button.
- **Do** give a sequence of screens a `StepRail` and keep its confirm on the last step alone; every earlier step only moves.
- **Do** keep the run route free of app chrome: the corner buttons are its only navigation.
- **Do** keep what names a hand card (sprite, points, cost, name, Info) in its left strip, and tilt only a card at rest; anything being read stands upright.
- **Do** make actions on the table from `TableButton`: cobalt for the one confirm, cream for the rest.
- **Do** set the pixel face at 20px or 30px, or at 40px for a heading on the landing page, and only for print on the board.
- **Do** give every key a visible hint on its piece, shown only for a fine pointer, and keep every keyed action reachable by tap.
- **Do** keep page copy and controls at 48px touch height or more; nothing interactive in play goes below 40px unless its hit area is extended.
- **Do** write counts and scores in tabular figures and labels in sentence case.
- **Do** give every loading surface a skeleton in the shape of its content, and every error a plain sentence and a retry.
- **Do** build the landing page from the tabletop's own pieces (cat cards, dice, food tokens, the mat, tray wells, nameplates, table buttons) inside its own `.tabletop` scope, with no app shell around them.
- **Do** keep a crowd cat decorative: a whole multiple of 16, no label, no clicks, a flat cast only where it stands on the ground.

### Don't:
- **Don't** round the corners of a game piece.
- **Don't** give a piece a blurred shadow, a diagonal offset shadow, or a glow. Outside the tabletop a piece has no shadow at all; inside it has only the straight-down edge and cast. The only light on the tabletop is the three named under Motion: score heat, a raised legendary's shimmer, and the drift on a run's cloth.
- **Don't** bring the cardboard edge, the cloth, or the pixel face to home, the codex, auth, or a dialog.
- **Don't** put a 2px ink border or square corners on page chrome, and don't lay a white rounded panel or a pill button on the tabletop.
- **Don't** draw a ring outside a piece's border to show state.
- **Don't** use coral for a decision the player owes or for a card the player is trimming; coral is the rival's.
- **Don't** set the pixel face at any size but 20px and 30px, or 40px for a landing heading, or use it for rules text.
- **Don't** set readable text below 10px, or below 11px on a piece from 640px up.
- **Don't** move a cardboard piece in steps, or a pixel sprite smoothly: pieces ease and spring, sprites hop a whole pixel at a time. Don't fade pieces in.
- **Don't** animate anything on the table but `transform` and `opacity`, ease a shadow, or shake the table itself; a shake belongs to the mat and the supply.
- **Don't** add a sound outside a match, play one the player's own action or the turn's playback did not cause, or ship an audio file.
- **Don't** use gradients or emoji anywhere. The three lights named under Motion are the only gradients, and each is a light, never a fill.
- **Don't** use raster or smoothed creature art; a cat is its 16x16 sprite.
- **Don't** use the stone greys for anything but the tower, or draw a rival in any colour but coral.
- **Don't** use an element hue for a panel, a button, or a heading.
- **Don't** use lime for anything the rival owns, or coral for a reward. The landing ribbon is the only lime that is not the player's.
- **Don't** introduce currency, shop, or premium styling; nothing is for sale.
