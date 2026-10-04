---
name: HaduMon
description: A cream table of hard-edged game pieces and pixel cats in soft white page chrome; on the run route the pieces become die-cut cardboard on a woven cloth.
colors:
  cream: "#fff8e7"
  sky-surface: "#a9ddf5"
  sky-soft: "#e7f7fd"
  cobalt: "#1557d8"
  cobalt-dark: "#0d3c9d"
  lime: "#d8ff4f"
  coral: "#ff7163"
  ink: "#17212b"
  ink-soft: "#5b6c7d"
  white: "#ffffff"
  edge: "#c8dfea"
  chipboard: "#b9a47e"
  sky-deep: "#73bde4"
  cloth: "#f4ead4"
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
  display-xl:
    fontFamily: "ui-rounded, 'Avenir Next', 'Trebuchet MS', system-ui, sans-serif"
    fontSize: "4.5rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.025em"
  display-lg:
    fontFamily: "ui-rounded, 'Avenir Next', 'Trebuchet MS', system-ui, sans-serif"
    fontSize: "3.75rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.025em"
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
  rival-piece:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "20px"
  ladder-marker:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    size: "40px"
  ladder-marker-won:
    backgroundColor: "{colors.lime}"
  ladder-marker-boss:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    size: "56px"
  gain-marker:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    size: "24px"
  deck-count-tag:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
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
---

# Design System: HaduMon

## Overview

**Creative North Star: "Pieces on a Cream Table"**

HaduMon is a board game laid out on a warm cream table. Two materials share the screen and never blend. The page chrome (navigation, panels, dialogs, pill buttons, the account form) is soft: white surfaces, rounded corners, faint borders, one diffuse shadow. The game pieces (cat cards, lanes and spaces, dice, score tags) are hard: square corners, a 2px near-black border, flat fills. A player can tell at a glance what is furniture and what is in play.

The pieces come in two states of the same material, and the route decides which. Everywhere outside a run (the landing page, home, the codex, login, signup, and every dialog) a piece is flat: border and fill, no thickness. On the run route (`/run`: clan pick, the opening hand, the match, the match result, reward pick, the run summary) the screen is a tabletop, and the same pieces are die-cut cardboard: each one has a chipboard edge straight down and an unblurred cast shadow, and it lies on a woven cream cloth. The scope is one class, `.tabletop`, opened by `TableSurface`; a piece carries the `piece` class everywhere and only gains its thickness inside it.

The match is a table you sit at, not a dashboard you read: the rival across the top, the shared supply between, the player's sky mat with three printed lanes in the centre, a scorepad to the side, and the player's own edge (prompt, food, hand) docked along the bottom. There are no white rounded panels on the table. Counts are tokens, piles, and cubes; what the board says about itself is printed on it in a pixel face.

The cats are 16x16 pixel sprites: chibi, front-facing, a near-black outline, three fur tones taken from the cat's element, and eyes tinted by rarity. They are drawn as inline SVG and scaled in whole pixels. The tabletop adds a small set of 8x8 pixel icons drawn the same way (yarn, die, paw, den, card, cached, tucked, goal, chevron), the seven food icons (beef, fish, chicken, dry food, pork, a treat, and a question mark for a cost any food pays), and the five element marks (flame, drop, bolt, leaf, crescent). Sprites and these icons are the only imagery. There are no photographs, no raster creature art, no gradients, and no emoji.

Density follows the game. The table is compact (10px between zones, 6px between pieces) because every rule the player needs has to be on the card or the board. Home, codex, and auth breathe more (16 to 36px). Copy is dry and factual, in sentence case.

The public landing page (`src/components/landing/LandingPage.tsx`, shown at `/` to a signed-out visitor) is the one Persuade surface, and it sits in the same world with flat pieces. It has no app shell and no white panel: a wordmark and two small account buttons above, a hairline footer below, and everything between laid straight on the cream table. It is built from the app's own pieces (cat cards, dice, food icons, sprites, the rival bar, a flat Hunt row run by the real match engine) and adds one structure of its own, the ladder: the six rivals of a run read top to bottom along a 2px ink track.

**Key Characteristics:**
- Warm cream canvas; sky blue for the board and the home hero.
- Two materials: rounded white chrome, square 2px-ink game pieces.
- Pieces are flat outside a run and die-cut cardboard with a straight-down edge inside the tabletop.
- Cobalt is the action, lime is the player's, coral is the rival's.
- 16x16 pixel cats and 8x8 pixel icons as inline SVG, the only imagery.
- One rounded bold type voice, plus a pixel print face on the tabletop at 20px and 30px only.
- Every state has a border, fill, or height change, never colour alone on text.

## Colors

A light, warm palette: one cream canvas, one blue family for structure and action, two loud accents with fixed owners, three cardboard shades that exist only on the tabletop, and five element hues that belong to the cats.

### Primary
- **Action Cobalt** (`cobalt`): primary buttons, the active nav destination, selected filter chips, text links, and the focus outline. On the tabletop: the one confirm, a lane's activate tile, the back of the player's deck, and the frame of any piece that is open to pick, chosen, or due. Also the rare rarity colour.
- **Pressed Cobalt** (`cobalt-dark`): hover on cobalt buttons and tiles, and link text that sits on a white surface.

### Secondary
- **Chosen Lime** (`lime`): the player's colour. The points tag on a cat card, a selected die, a kept food, food given up in a swap, the "Play here" space, the marker on a lane's current reward step, turns still to play, the player's score token and yarn, the player's goal marker, a cat while its power fires, a lane's activate tile while that lane resolves, won matches on the gauntlet track, new unlocks. On the landing page also the gain markers and a rival's marker once its round is won. Also the text selection colour. Always carries ink text.
- **Rival Coral** (`coral`): the rival's colour. The rival's nameplate, score token, deck back, yarn and goal marks, its goal marker, its lines in the event log, the last-card piece while a card has just turned over, the prompt line on the step the rival acts, and the rival currently across the table on the gauntlet track. On the landing ladder a rival's marker is coral while that rival stands, and so is the Boss tag. Outside the table it is also the destructive button, the "Mon" in the wordmark, and the epic rarity colour.

### Tertiary
- **Element hues** (`flame`, `mist`, `volt`, `thorn`, `shade`): the primary fur tone of each element and the fill of its food icon and its element mark. They appear only on sprites, food icons, element marks, and dice faces, never as page surfaces or text colours.
- **Rarity marks** (`rarity-common`, `rarity-uncommon`, then `cobalt` for rare, `coral` for epic, `volt` for legendary): the 3px band across the top of a cat card.

Each element has two further fur tones used only inside sprites (`src/components/sprites/palettes.ts`): flame `#ffd36b` and `#b7492d`; mist `#e7f7fd` and `#3c83a8`; volt `#fff2a8` and `#1557d8`; thorn `#c9ec9b` and `#39734a`; shade `#c9c1f2` and `#40336d`. Rarity eye tints: common and uncommon `#5cbf89`, rare `#9ac4ff`, epic `#ffd7d2`, legendary `#fff0a8`.

### Neutral
- **Table Cream** (`cream`): the page canvas, the sticky top bar, the ground of the cloth, and the face of every card, placed tile, relic tile, and cream table button.
- **Board Sky** (`sky-surface`): the mat, the landing demo's row, the home hero surface, the auth page backdrop, and hover on secondary buttons.
- **Soft Sky** (`sky-soft`): hover fill for quiet controls and pieces, secondary buttons, the active link in the mobile navigation, inline notes, skeleton bars.
- **White** (`white`): panels, dialogs, inputs, chips, dice, the scorepad, the event log, the current round tile, the docked edge, and small tags and key hints.
- **Ink** (`ink`): all primary text, and the 2px border of every game piece. At 40% it is the dialog scrim; at 8 to 20% it is the hairline on chrome and the divider inside cards. As a fill it is the small inverse tag (Boss, Trim 1) with cream text.
- **Soft Ink** (`ink-soft`): secondary copy, labels, flavor text, inactive nav.
- **Edge** (`edge`): the 1px border of text inputs and skeleton bars.
- **Sprite Outline** (`sprite-outline`): the outline pixel of every cat and pixel icon. Slightly warmer and darker than ink; used nowhere else.

Tabletop only:
- **Chipboard** (`chipboard`): the cut edge under every piece, the outline of an empty yarn space, and the paw on a face-up pile. Mixed into cream (42%) or white (34%) it is the cast shadow on the cloth and on the docked edge.
- **Deep Sky** (`sky-deep`): the cast shadow of a piece lying on the mat, the printed lines between lanes, the outline of a printed empty space, and a spent turn cube.
- **Cloth** (`cloth`): the weave of the tabletop (a 16x8px brick of 4x2px marks on cream), the floor of a tray well, and the rival's card space before any card has turned.

### Named Rules
**The Lime Is Yours Rule.** Lime marks something the player chose, holds, or won. It is never decoration and never the rival's.

**The Coral Is Theirs Rule.** Coral marks the rival and what the rival does; outside the table it also marks a destructive act. It never marks a decision the player owes, and never a piece the player owns. Text sitting on a coral fill is ink.

**The Waiting Piece Rule.** A piece of the player's that is waiting on an answer takes a cobalt frame with a lime inner line. A card marked for trimming takes the cobalt chosen frame and an ink tag. Neither takes coral.

**The Ink On Colour Rule.** Text on lime, coral, sky, cream, or an element hue is ink. White text appears only on cobalt. The one inverse is the small ink tag, which carries cream text.

**The Element Stays On The Cat Rule.** Element hues colour sprites, food icons, element marks, and dice. Panels, buttons, and headings never take an element colour.

## Typography

**Display Font:** the platform rounded face (`ui-rounded`, then Avenir Next, Trebuchet MS, system-ui)
**Body Font:** the same stack
**Print Font:** Jersey 20 (loaded with `next/font` in `src/styles/fonts.ts`, falling back to the display stack), on the tabletop only

**Character:** one bold, rounded, tightly tracked voice for names and numbers, the same face at regular weight for rules text, and on the tabletop a pixel face for what is printed on the board. The rounded stack is a system stack, so that face differs by platform; see the note at the end of this section.

### Hierarchy
- **Landing display** (800, 2.25rem rising to 4.5rem from 640px, line-height 1 at the large size, tracking -0.025em, balanced wrap): the landing headline only. The two boss names on the ladder take the step below it (2.25rem rising to 3.75rem). These are the only sizes above 3rem and they appear on the landing page alone; an app screen stops at Display.
- **Display** (800, 1.875rem rising to 3rem from 640px, line-height 1.05, tracking -0.035em): the one headline of a page outside a run: the next step on home, the auth heading, "Codex" (which stops at 2.25rem).
- **Headline** (800, 1.25rem rising to 1.5rem from 640px, tracking -0.025em): dialog titles, the wordmark, and the gain headings on the landing ladder. A rival's name on the ladder is one step up (1.5rem rising to 1.875rem).
- **Title** (800, 1.125rem, line-height 1.25): panel titles and the row name in the landing demo.
- **Print large** (Jersey 20, 400, 30px, line-height 1, tracking 0.01em): on the tabletop, the heading of a run screen ("Pick a clan", "Keep 3", "Add a cat", "You beat Alley Tom") and the two score tokens.
- **Print** (Jersey 20, 400, 20px, line-height 1, tracking 0.01em): on the tabletop, a lane's name on its activate tile, "Round 1", the rival's name on the nameplate, a clan's name, the numerals on the gauntlet track, the event log's heading, and score totals.
- **Card title** (800, 0.875rem, line-height 1.25): a cat's or relic's name on its piece, the points tag, token counts, and the numerals of a reward step.
- **Body** (400, 1rem, line-height 1.45): page copy and dialog copy. Introductory paragraphs are capped near 65ch.
- **Body small** (400, 0.875rem, line-height 1.375): most in-game prose: the prompt on the docked edge (600), the rival's last card (900), result lines, table rows. The event log sets its lines one pixel down (13px, line-height 1.3).
- **Caption** (400, 0.75rem, line-height 1.375): rules text on a card, a goal on a round tile, relic text, score sheet lines, flavor text (italic).
- **Label** (700, 0.75rem, sentence case): the small heading above a group of pieces ("Feeder"), the second line of a lane's activate tile ("Take 2 dice"), and the text of a small table button (900).
- **Piece label** (700 or 900, 11px, ink): text that lives on a piece: the cat's name on a lane tile from 640px, the cost of an empty space, "You" and "Rival" above a score, the Boss tag, the Info button, a card's footer line.
- **Piece label small** (700 or 900, 10px, ink): the floor. A cat's name on a lane tile on a phone, the element's name on a die, a key hint, and the "Fires 1st" mark in the landing demo. Nothing readable is smaller.

### Named Rules
**The Two Sizes Of Print Rule.** The pixel face is drawn on a 20px grid, so it is set at 20px and 30px and nowhere between. It is for what is printed on the board (names, numerals, totals, screen headings on the table), never for rules text, and never outside the tabletop.

**The Numbers Line Up Rule.** Every score, count, and cost that can change uses tabular figures.

**The Sentence Case Rule.** Headings, buttons, and labels are sentence case. Uppercase is reserved for two small marks: the filter group label and the Boss tag in the codex.

**The Rules Are On The Piece Rule.** A card states its own cost, points, and power in words. Type on a piece may get small, but it stays ink and stays bold enough to read on a phone: 11px on a piece, 10px only for a lane-tile name on a phone, a die's name, and a key hint.

Note: the rounded stack is a system stack and has not been chosen as a brand face. Treat the weights, sizes, and tracking above as the system and the family as open. The print face is chosen: Jersey 20.

## Layout

Mobile-first, and it must hold at 375px.

- **Shell.** From 768px a white rail (192px wide, full height, 1px right hairline) carries the wordmark and three destinations: Home, Play, Codex. Below 768px the rail is replaced by a floating three-item bar (12px from the screen edges, 16px radius, white at 95% with blur). A sticky cream top bar at every width shows the signed-in name and Log out; on mobile it also carries the wordmark. Login, signup, and the landing page render without the shell.
- **Shell on the run route.** The main column is full width with no padding of its own; the cloth runs edge to edge under the top bar. The floating bar is gone, and below 768px its three links sit in the top bar in place of the wordmark. From 768px the top bar tightens to 2px of vertical padding.
- **Landing page.** One centered column, maximum 1080px, with 16px side padding rising to 24px at 640px and 80px below the last step. In order: a header (wordmark left, Log in and Sign up right), the headline with a lead paragraph (1rem rising to 1.25rem, capped at 62ch), the ladder as one ordered list, and a footer behind a 1px ink hairline (10%). Each step of the ladder is a two-column grid: a marker column (40px, 56px from 640px) and the content, 12px apart rising to 24px; steps are 40px apart, 56px from 640px. A rival piece splits into two columns from 768px with a 32px gap; example cat cards and relics sit three across from 640px with an 8px gap. Running copy between pieces is capped at 65ch.
- **Content column (home, codex).** Centered, maximum 1180px, with 12px side padding rising to 20px at 640px and 24px at 1024px. Bottom padding clears the mobile bar.
- **Rhythm.** A 4px base. On the tabletop zones stack at 10px and sit 12 to 16px apart side by side; pieces in a grid sit at 6px (dice, lane spaces) or 12px (cards, which need room for their edge and cast). Home and codex stack at 16px. Panel padding is 16px; the hero surface uses 24px rising to 36px.
- **The match table.** A grid capped at 1400px with 12px side padding. From 1024px it is two columns 16px apart: the table, and a 280px side column. The table column reads top to bottom as the far side to the near side: the rival (nameplate, deck and bank piles with counts, last card, score token, in one row), the supply (a 256px column holding the feeder well and the player's deck and discard piles, beside the tray of three face-up cats), then the mat (three round tiles across its top, then the three lanes divided by 2px deep-sky lines). The side column holds the gauntlet strip, the scorepad, the relic tiles, and the event log, which fills what is left; the column takes the table's height and scrolls in place, so it never makes the page longer than the table. At 1440x900 the whole page is exactly 900px tall with no scroll.
- **The match on a phone.** One column: gauntlet strip, rival (nameplate and score token on one row, piles and last card on the next), the mat, the supply, then the scorepad, relics, and log (capped at 320px). Only the current round's tile shows during play. When a choice or a firing chain happens off screen, the zone it happens in is scrolled into the clear space between the top bar and the docked edge.
- **A lane.** From 640px the activate tile sits in a 152px column to the left of four spaces and an end cap (44px), 6px apart, each at least 60px tall. Below 640px the tile sits above; the spaces are at least 96px tall and the end cap is 28px.
- **The docked edge.** The player's edge of the table sticks to the bottom of the viewport: white, a 2px ink line along its top. From 1024px it is a fixed 194px tall, in two columns: 416px for the prompt, its actions, the food tokens with the swap rule printed under them, and the score token; the rest for the hand. From 640px the first column is 272px. On a phone the prompt sits above the hand, and the hand folds to a 64px peek of card tops with a "Show the hand" control; cards are 224px wide and scroll sideways. A tuck opens the hand by itself.
- **Other run screens.** A centered column, maximum 1120px, 12px side padding rising to 20px at 640px, 12px above and 32px below. Clan pick, the opening hand, and reward pick end in a rail docked to the bottom the same way: one sentence saying what will happen, and one cobalt confirm, stacked on a phone and side by side from 640px. The run summary has no rail; its two actions sit at the end of the column.
- **Grids.** Card grids outside a run are one column, two from 640px, three from 1024px, with a 12px gap. On the table, offers are three across from 640px, the opening hand five across from 1024px, clans two across from 1024px. The feeder is always five dice across.
- **Targets.** Pill buttons are 40, 48, or 56px tall; chips 44px; nav items 48px; dice 48px; table buttons 40 or 48px; a lane's activate tile 48px (60px from 640px); lane spaces 60px (96px on a phone). The Info control on a card is 24px tall with its hit area extended 8px on every side.
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
- **Rail** (`box-shadow: 0 -3px 0 0 cloth cast`): the docked edge, shading the cloth just above its ink line.

### Heights
- **Print (0).** Anything printed on the mat or on another piece: lane dividers, empty spaces, reward steps, markers on a round tile, a tag on a card. A piece nested inside a piece has no height of its own.
- **Token or tile (2px).** Dice, a food token while it can be given up, turn cubes, lane tiles, placed cats, round tiles, relic tiles, table buttons, score tokens, gauntlet markers, the scorepad, the event log.
- **Card (3px).** Cat cards, the rival's last card, the match result sheet, the run summary sheet.
- **Stacks.** A pile's edge grows with its count (2px plus 1px per three cards, to 9px). A placed cat with cats tucked under it stands 4px, then 6px.
- **Cast colour.** On the cloth, chipboard at 42% in cream. On the mat, deep sky. On the docked edge, chipboard at 34% in white.

### States of height
- **Liftable** (hover, fine pointers only): the piece rises 2px and its cast shadow grows by 2px.
- **Lifted** (chosen): the piece rises 4px and its cast shadow grows by 4px.
- **Pressed** (active, or a lane tile while its lane is being chosen or resolved): the piece sinks 2px and its edge shortens by 2px.

### Named Rules
**The Scoped Thickness Rule.** A game piece casts no shadow outside the tabletop: on the landing page, home, the codex, auth, and in every dialog it is border and fill. Inside the tabletop every piece has an edge and a cast shadow, straight down and unblurred. No piece anywhere takes a blurred shadow or a sideways offset.

**The Frame Means State Rule.** On the tabletop a piece's state is its border: cobalt border for open to pick, cobalt border with a 2px cobalt inner line for chosen, cobalt border with a 2px cobalt and a 2px lime inner line for waiting on the player. A chosen piece is also lifted. No ring is drawn outside a piece's border.

**The Three Heights Rule.** A thing on the table is print (0), a token or tile (2px), or a card (3px). Only a stack is taller, and its height is its count.

## Shapes

Two corner languages, one per material.

- **Chrome is rounded.** Panels 20px; flat panels, the mobile bar, and the inner auth card 16px; inputs, nav items, and inline notes 12px; the home hero and the auth shell 28px; pill buttons and chips are full pills. Chrome borders are 1px hairlines of ink at 8 to 15%.
- **Pieces are square.** Cat cards, the mat, lanes, spaces, dice, tags, table buttons, the gauntlet track, the landing ladder's markers and rival pieces, and score tokens have no radius and a solid 2px ink border. Small marks on a piece (a key hint, the cached and tucked tag, the Boss tag) use a 1px ink border.
- **Printed and empty spaces are outlines.** On the mat an empty space is a 2px deep-sky outline; the next free space is a 2px dashed ink outline (55%) over white at 45%. An empty pile and a rival yet to come on the gauntlet track are 2px dashed ink outlines (35 to 40%). A food the player holds none of is its own icon at 35%, so its place still says which food it is. In the landing demo an empty slot is a 2px dashed ink outline (50%).
- **Sprites are pixels.** A 16x16 grid drawn with crisp edges. Sizes in use: 28, 40, 44, 48, 56, 64, 72, 144, and 320px.
- **Icons.** Navigation and the password toggle use 20px line icons with a 2px stroke and round caps, drawn inline. Anything that sits on a piece is drawn as pixels instead: the tabletop's icons are 8x8 grids shown at 16px (24px on a lane's activate tile), with an outline colour and one fill; the plus in a landing gain marker is a 5x5 grid shown at 10px.

## Components

### Buttons
Capsules with the bold display voice; they press down 2px and shrink to 99% over 140ms. They belong to chrome: dialogs, home, the codex, auth, the landing page. They are not used on the tabletop.
- **Shape:** full pill (999px), 1px border in the fill colour.
- **Sizes:** small 40px tall, 12px text, 8px by 12px padding; medium 48px, 14px text, 12px by 20px; large 56px, 16px text, 16px by 28px.
- **Primary:** cobalt with white text; hover goes to pressed cobalt. One per decision.
- **Secondary:** soft sky with ink text; hover goes to board sky. Cancel, back, retry.
- **Hero:** lime with ink text and a soft lime glow (`0 10px 20px rgb(216 255 79 / 0.24)`). The landing demo's activate button while its turn lands.
- **Danger:** coral; hover darkens 5%. Log out and abandon run, always inside a confirm dialog. The build sets this label in white, which breaks the Ink On Colour Rule and is hard to read; that is carried, not a rule.
- **Disabled:** 45% opacity, not-allowed cursor.
- **Focus:** 3px cobalt outline, 3px offset. This is the global focus treatment for every focusable element, on and off the table.
- A link that navigates but looks like a button uses the same classes on a real anchor.

### Table Button
An action on the table is a piece, cut from the same card as everything else.
- **Shape:** square, 2px ink border, a 2px edge that sinks when pressed.
- **Sizes:** small 40px tall, 12px text, 10px side padding (the default); medium 48px, 14px text, 16px side padding. Weight 900.
- **Primary:** cobalt with white text, hover to pressed cobalt. The one confirm of a decision: "Take 2 dice", "Keep these 5", "On to the next match". The confirm in a rail is the medium size.
- **Secondary:** cream with ink text, hover to soft sky. Everything else: Back, Skip, Undo, "Place for me". On a cloth-coloured well it is white.
- **Disabled:** 45% opacity.
- **Key hint:** a confirm carries "Enter" and a back carries "Esc" as a hint inside the button.
- **Link:** a link that leaves the table ("Open the codex") is the medium cream button on a real anchor.
- **Stepper:** a 40px white square piece for one more or one fewer.
- A way out that is not a move in the game ("Abandon run", "Show the hand") is an underlined 12px bold text link, not a piece.

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
- **Bar (below 768px, not on the run route):** three equal columns, icon over an 11px bold label. Active is a soft sky fill with cobalt text.
- **Top-bar links (below 768px, run route only):** the three destinations as 48px text links with a 12px radius, 12px bold; active is a soft sky fill with cobalt text.
- **Wordmark:** "Hadu" in ink, "Mon" in coral, bold rounded, 24px in the rail.

### Cat Card
The signature piece. Cream face, 2px ink border, square, 8px padding, with the rarity band across the top. First line: the sprite (44px compact, 72px full), the name in the card-title style, the cost as a row of 16px food icons beneath it, and the points in a lime tag at the right. Then, under a faint ink rule, the power written out in 12px text. The full variant adds a soft-ink line for rarity, element, rows, and yarn capacity, and the flavor text in italics. A locked card drops to 60% opacity, greys its sprite, and shows the unlock hint in place of the power. On the tabletop it stands at card height.

When a card is a choice (hand, tray, offer) the whole card is the select control, and its footer carries a soft-ink line saying which lanes it can go in, the key that picks it, and a small white "Info" piece that opens the full card in a dialog and never selects. Open to pick: cobalt border. Chosen: cobalt border and inner line, lifted 4px, and the footer reads "Chosen" in cobalt. A card that cannot be played now drops to 60% opacity but stays selectable, so the prompt can say why.

### Food Icon, Element Mark and Food Token
Cats cost cat food, and each food is its own 8x8 pixel shape with an ink outline, filled with the primary fur tone of the element that eats it: Beef (Flame, a steak), Fish (Mist), Chicken (Volt, a drumstick), Dry food (Thorn, a full bowl), Pork (Shade, a rasher). A Treat pays for anything and is a white spark; a cost that any food pays is a white question mark. No square is drawn around a food. It is shown at 16px on cards and in lists and at 24px on a die or as a token, always a whole multiple of the grid. The code still calls food essence and keys it by element.

An element named on its own (a codex filter, a clan, a past run) leads with its element mark instead: a flame, a drop, a bolt, a leaf, or a crescent, drawn and filled the same way at 16px.

On the docked edge the food the player holds is a row of 24px icons each followed by its count in the card-title style, with the rule "Any 2 food pay for 1 you lack." printed under the row in 11px soft ink. A food the player holds none of is its icon at 35% with a soft-ink 0. While a cat that is short is selected, each food that can be given up becomes a token-height button with the cobalt open frame; a food already given up fills lime with the chosen frame and its count shows what would be left. Tapping an open food gives one up; tapping one that can give no more takes it back.

### Die
A white square piece, 48px tall, holding a 24px food icon above the food's name in 10px bold. Selected fills lime and, on the tabletop, lifts 4px; hover is soft sky. It is a button only while dice are being chosen. On the table the feeder's dice sit in a tray well.

### Mat, Tray Well, Rail
The three surfaces of the tabletop under the pieces.
- **Mat:** board sky, 2px ink border, a 3px board. Pieces on it cast deep sky. It holds the round tiles and the lanes.
- **Tray well:** cloth, 2px ink border, a 3px inner shade along the top. It holds the feeder, an empty tray's message, and each clan on the clan pick screen (a chosen clan's well takes a 4px cobalt line inside its border).
- **Rail:** white, a 2px ink line along its top, a 3px shade on the cloth above. The docked edge of the match and the confirm rail of the other run screens.

### Lane
One of three lanes printed on the mat.
- **Activate tile:** a cobalt tile with the lane's pixel icon (24px), its name in print at 20px, and what activating gives now in 12px bold ("Take 2 dice"), white text. While its lane is being chosen or resolved it is lime with ink text and pressed. The other tiles dim to 55% while a turn plays back.
- **Placed cat:** a cream tile with the sprite (40px on a phone, 48px from 640px), the cat's name, and a yarn track: one 16px yarn icon per space of capacity, lime with an ink outline when held, lime with a cobalt outline when chosen in a Den but not yet laid, a chipboard outline when empty. What the cat holds besides yarn (cached, tucked) is a small white tag on the sprite's corner. Tapping it opens the cat's card, which lists the cats tucked under it, or lays yarn during a Den (cobalt border while it can take one). Waiting on the player: the cobalt and lime frame. Firing: lime, pressed.
- **Next free space:** a dashed outline printing its yarn cost and the reward the lane gives now, with the lime marker on that reward. When the chosen card can go there it becomes a lime "Play here" piece with the cost under it.
- **Later spaces:** deep-sky outlines printing their yarn cost (yarn icons, with the words from 640px) and the reward the lane will give once it reaches them.
- **End cap:** a cobalt pixel chevron pointing left (powers fire right to left) above the reward of a full lane.
- **Reward step:** a numeral in the card-title style and a 16px icon of what is counted (die, yarn, card), 24px tall; the step the lane is on has a lime fill and a 2px ink border.

### Round Tile and Turn Cube
Three tiles across the top of the mat, one per round. Each prints "Round n" at 20px, the round's turns as 12px cubes (lime piece for a turn still to play, a deep-sky outline once spent), the goal with its pixel icon and what it pays, and how the goal stands or went as a lime marker for the player and a coral marker for the rival. The current round's tile is white; the others are cream; a scored round drops to 80% opacity.

### Rival Side
- **Nameplate:** a coral tile with the rival's name in print at 20px, an ink Boss tag (cream text, 11px) for a boss, and its trait in 12px bold. On the opening-hand screen it also prints the flavor line in italics.
- **Pile:** a 36 by 48px card back with a pixel paw and a white count tag on its top corner: cobalt for the player's deck, coral for the rival's deck and bank, cream for a face-up discard. Empty is a dashed outline.
- **Last card:** a card-height piece saying what the rival flipped last in 14px at weight 900, and under it what is still in its deck in 11px soft ink. Cloth before any card, cream after, coral for a moment when a card has just turned.
- **Score token:** a tile with "Rival" in 11px bold over the score in print at 30px, coral. The player's, on the docked edge, is the same in lime and reads "You".

### Scorepad, Relic Tile, Event Log
- **Scorepad:** a white tile holding both score sheets side by side: a lime "You" tag and a coral tag with the rival's name, lines in 12px divided by hairlines, the total under a 2px ink rule in print at 20px. The same sheets appear on the match result.
- **Relic tile:** a cream tile, name in the card-title style followed by its text in 12px.
- **Event log:** a white tile headed "What just happened" in print at 20px. The newest turn is at the top at full strength; older turns sit under a hairline at 75%. A power's line is plain ink; a note is soft ink; the rival's line is a coral marker and a scored goal a lime marker, each with a 2px ink border.

### Gauntlet Track and Run Strip
Six markers, 28px wide, numbered in print at 20px: a lime tile for a rival beaten, a coral tile for the one across the table (lifted) or the one that ended the run, a dashed outline for those to come. Bosses stand taller (36px). Beside it, the clan and deck size in 12px soft ink, and "Abandon run" as an underlined text link that opens a confirm dialog.

### Other Run Screens
- **Clan pick:** each clan in a tray well: its name in print at 20px, what it does, a cobalt "Choose" tile (lime and pressed once chosen, white for a locked clan), its relic tile, and its starting deck spread out as small tiles (sprite, count, name).
- **Opening hand:** the rival's nameplate with flavor, the round tiles on a mat, the hand five across to keep from, five food tiles to keep from (white; lime, framed, and lifted when kept), then the feeder, piles, and tray as they will be on the table.
- **Match result:** a white card-height sheet: the headline in print at 30px, the score in a lime marker for a win or a coral one for a loss, both score sheets, and the three goals in a sentence each.
- **Reward pick:** cats to add as cards, relics as cream tiles (lime, framed, and lifted when chosen), and the deck spread out as small tiles to trim from. A tile marked for trimming turns white, takes the chosen frame and lift, and carries an ink "Trim 1" tag.
- **Run summary:** the headline in print at 30px, the gauntlet track, a white card-height sheet with the run as a table (won and lost as lime and coral markers), new unlocks as their own pieces (a clan unlock is a lime tile), then a medium cobalt table button and a cream table link.

### Status Marks and Notices
- **Marker:** a fill with a 2px ink border, bold ink text, tabular figures; lime for the player, coral for the rival. Used for goal standings, results, and log lines.
- **Key hint:** a white 16px mark with a 1px ink border (60%) and a 10px bold letter, on the corner of the piece it works. Hidden unless the pointer is fine and can hover.
- **Empty state (chrome):** a 2px dashed ink outline (20%) with one line of copy and a secondary button.

### Ladder (landing page)
A run read top to bottom: six rival markers and three gain markers on one track.
- **Track:** a 2px ink line down the marker column, running from under each marker to the next step; the last step has none.
- **Rival marker:** a square with a 2px ink border, coral fill, and the rival's number in the bold display voice, tabular. 32px (40px from 640px) with an 18px numeral rising to 20px; a boss is 40px (56px from 640px) with a 24px numeral rising to 36px. It turns lime once the round played inside its step is won. Only the first step holds a playable round, so only the first marker changes.
- **Gain marker:** a 24px lime square with a 2px ink border and a pixel plus in ink. It marks what a win adds: a cat, a relic, the deck that carries over. Its heading sits beside it in the headline step, with the copy and example pieces below.
- **Rival piece:** cream, 2px ink border, square, 12px padding rising to 20px from 640px. Left: the name, the Boss tag if there is one, the flavor line in soft ink (1rem rising to 1.125rem), and the trait in bold ink. Right, from 768px, the deck.
- **Deck list:** a two-column list in 14px ink, 12px between columns and 6px between rows. The left column is a white tag with a 2px ink border holding the count and the card's name ("4× Bank") in 12px at weight 900, tabular; the right column is one sentence saying what that card does.
- **Boss tag:** coral fill, 2px ink border, the word "Boss" in bold ink, sentence case, 14px rising to 16px, on its own line under the name. The codex and the tabletop nameplate set theirs as an ink tag with cream text (uppercase in the codex); all three are in the build.

### Hunt Demo (landing page)
A flat board row cut down to one round, played in place against the first rival. It does not use the tabletop's lane.
- **Row:** a board-sky band with a 2px ink border, 8px padding (12px from 640px). The row name is in the title step; the turn count sits opposite in 12px bold, tabular.
- **Slots:** four across at a 6px gap, at least 96px tall. A filled slot is a cream piece holding a "Fires 1st" mark (white, 1px ink border, 10px bold), the sprite (48px, 64px from 640px), and from 640px the cat's name and power in 12px. Below 640px the powers are listed under the slots instead. A tucked count uses the same small mark. The empty slot is a dashed 2px outline reading "Empty".
- **Feeder and button:** five dice with a 12px bold label above. The activate button is the large pill, under the dice on a phone and to their right from 640px.
- **Under the row:** the rival bar (the name in a coral cell with a 2px ink divider, then the last card in 14px bold), then the turn's lines in 14px with the first in bold, beside a tally of food icons (16px) and the score in 12px bold, tabular. The round's goal result is a lime tag with a 2px ink border.
- **After the round:** the activate button is replaced by a secondary "Deal again", and one sentence with a large primary button follows the demo.

### Motion
Short and functional. Chrome: press feedback is 140ms; the auth card rises 12px and fades in once over 320ms on an ease-out curve; skeletons pulse. All animation and transition durations collapse under `prefers-reduced-motion`.

The landing demo lands a turn one step at a time, 560ms apart. The cat whose power is firing fills lime over 150ms and fades back to cream over 700ms; the rival bar flashes coral on the same 150ms in, 700ms out. While the steps land, the activate button takes the lime hero fill at full opacity, reads "Hunting", and is disabled along with the dice. When the round is won, the step's ladder marker turns from coral to lime over 700ms. Under reduced motion the steps land with no delay between them.

On the tabletop motion is stepped, never eased smooth, and nothing fades in on load.
- **Lift and press:** 120ms in 2 steps, for the move and for the edge and cast shadow together.
- **The firing chain:** an answered turn is played back one step every 380ms before the table takes input again. The played card or the taken dice travel to where they land (300ms in 6 steps). Each cat in the lane fires from right to left: its tile turns lime and presses (300ms in 3 steps), its line lands in the event log, its counters settle, and the tile returns to cream over 700ms in 6 steps. A token that arrives drops 6px into place (200ms in 3 steps); rerolled dice tumble in (280ms in 4 steps). Then the rival's card turns edge-on and back (360ms in 6 steps) and stays coral for about 1.4 seconds, and the prompt line on the docked edge takes a coral marker for that step.
- **During the chain** the prompt says what is happening in a sentence, and its only action is a cream "Skip". Any click or key skips to the end. The last frame is always the server's own view.
- **Reduced motion:** the whole turn lands at once, nothing travels, and the rival's card still colours for a moment so the flip is seen.

## Do's and Don'ts

### Do:
- **Do** decide which material a new element is before styling it. In play: square, 2px ink border, flat fill. Around play: rounded, white, hairline, soft shadow.
- **Do** decide which scope a piece is in. Inside `TableSurface` it is cardboard (give it the `piece` class and let the tabletop add the edge); anywhere else it stays flat.
- **Do** pick one of the three heights for a new thing on the table: print, token or tile (2px), card (3px).
- **Do** render every cat through `src/components/PixelSprite.tsx` at a whole-pixel multiple of 16 where the layout allows, and every mark on a piece through `src/components/PixelIcon.tsx` at a multiple of 8.
- **Do** use ink text on lime, coral, sky, and cream; white text only on cobalt.
- **Do** show state on the table with the frame (cobalt border, cobalt inner line, lime inner line) and with height (lifted 4px, pressed 2px), and reinforce a chosen token with a lime fill.
- **Do** end every choice in a run at the docked edge or rail, with a sentence saying what will happen and one cobalt table button.
- **Do** make actions on the table from `TableButton`: cobalt for the one confirm, cream for the rest.
- **Do** set the pixel face at 20px or 30px, and only for print on the board.
- **Do** give every key a visible hint on its piece, shown only for a fine pointer, and keep every keyed action reachable by tap.
- **Do** keep page copy and controls at 48px touch height or more; nothing interactive in play goes below 40px unless its hit area is extended.
- **Do** write counts and scores in tabular figures and labels in sentence case.
- **Do** give every loading surface a skeleton in the shape of its content, and every error a plain sentence and a retry.
- **Do** build the landing page from the app's own components (cat cards, dice, food icons, sprites, the rival bar) laid flat on the cream table, with no app shell around them.

### Don't:
- **Don't** round the corners of a game piece.
- **Don't** give a piece a blurred shadow, a diagonal offset shadow, or a glow. Outside the tabletop a piece has no shadow at all; inside it has only the straight-down edge and cast.
- **Don't** bring the cardboard edge, the cloth, or the pixel face to the landing page, home, the codex, auth, or a dialog.
- **Don't** put a 2px ink border or square corners on page chrome, and don't lay a white rounded panel or a pill button on the tabletop.
- **Don't** draw a ring outside a piece's border to show state.
- **Don't** use coral for a decision the player owes or for a card the player is trimming; coral is the rival's.
- **Don't** set the pixel face at any size but 20px and 30px, or use it for rules text.
- **Don't** set readable text below 10px, or below 11px on a piece from 640px up.
- **Don't** ease tabletop motion smoothly or fade pieces in; lifts, presses, flips, and rolls move in steps.
- **Don't** use gradients or emoji anywhere.
- **Don't** use raster or smoothed creature art; a cat is its 16x16 sprite.
- **Don't** use an element hue for a panel, a button, or a heading.
- **Don't** use lime for anything the rival owns, or coral for a reward.
- **Don't** introduce currency, shop, or premium styling; nothing is for sale.
