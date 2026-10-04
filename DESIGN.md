---
name: HaduMon
description: A cream card table of hard-edged game pieces and pixel cats, held in soft white page chrome.
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
    fontSize: "10px"
    fontWeight: 700
    lineHeight: 1.25
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
  board-row:
    backgroundColor: "{colors.sky-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "8px"
  board-slot:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    typography: "{typography.piece-label}"
    rounded: "{rounded.none}"
    padding: "4px"
    height: "96px"
  die:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.piece-label}"
    rounded: "{rounded.none}"
    padding: "6px 4px"
    height: "48px"
  die-selected:
    backgroundColor: "{colors.lime}"
  essence-pip:
    backgroundColor: "{colors.flame}"
    rounded: "{rounded.none}"
    size: "12px"
  points-tag:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    typography: "{typography.card-title}"
    rounded: "{rounded.none}"
    padding: "0 6px"
    height: "24px"
---

# Design System: HaduMon

## Overview

**Creative North Star: "Pieces on a Cream Table"**

HaduMon is a board game laid out on a warm cream table. Two materials share the screen and never blend. The page chrome (navigation, panels, dialogs, buttons, the account form) is soft: white surfaces, rounded corners, faint borders, one diffuse shadow. The game pieces (cat cards, board rows and slots, dice, essence pips, score tags) are hard: square corners, a 2px near-black border, flat fills, no drop shadow. A player can tell at a glance what is furniture and what is in play.

The cats are 16x16 pixel sprites: chibi, front-facing, a near-black outline, three fur tones taken from the cat's element, and eyes tinted by rarity. They are drawn as inline SVG and scaled in whole pixels, so they stay crisp from a 28px deck token to a 320px mascot. The sprite is the only illustration in the product. There are no photographs, no raster creature art, no gradients, and no emoji.

Density follows the game. A match screen is compact (12px rhythm between sections, 6px between pieces) because every rule the player needs has to be on the card or the board. Home, codex, and auth breathe more (16 to 36px). Copy is dry and factual, in sentence case.

The landing page is not yet designed. `src/components/landing/LandingPage.tsx` is a one-section placeholder and is not a source for this system.

**Key Characteristics:**
- Warm cream canvas; sky blue for the board and the home hero.
- Two materials: rounded white chrome, square 2px-ink game pieces.
- Cobalt is the action, lime is what you chose or earned, coral is the rival and the warning.
- 16x16 pixel cats as inline SVG, the only imagery.
- One rounded bold type voice; sentence-case labels; tabular numbers for scores.
- Every state has a border, fill, or ring change, never colour alone on text.

## Colors

A light, warm palette: one cream canvas, one blue family for structure and action, two loud accents with fixed meanings, and five element hues that belong to the cats.

### Primary
- **Action Cobalt** (`cobalt`): primary buttons, the active nav destination, selected filter chips, text links, the focus outline, and every selection ring on a game piece. Also the rare rarity colour.
- **Pressed Cobalt** (`cobalt-dark`): hover on primary buttons, and link text that sits on a white row.

### Secondary
- **Chosen Lime** (`lime`): a piece the player has chosen or a result in the player's favour: the points tag on a cat card, a selected die, a kept card or essence, the "Play here" slot, the goal standing bar, won matches on the gauntlet track, new unlocks. Also the row's activate button while that row is being resolved, and the text selection colour. Always carries ink text.
- **Rival Coral** (`coral`): the rival and the warning. The rival's last-card bar flashes coral, rival lines in the event log take a 4px coral left rule, a slot waiting on a decision takes a coral ring, a card marked to be trimmed fills coral, destructive buttons are coral. It is also the "Mon" in the wordmark and the epic rarity colour.

### Tertiary
- **Element hues** (`flame`, `mist`, `volt`, `thorn`, `shade`): the primary fur tone of each element and the fill of its essence pip. They appear only on sprites, pips, and dice faces, never as page surfaces or text colours.
- **Rarity marks** (`rarity-common`, `rarity-uncommon`, then `cobalt` for rare, `coral` for epic, `volt` for legendary): the 3px band across the top of a cat card.

Each element has two further fur tones used only inside sprites (`src/components/sprites/palettes.ts`): flame `#ffd36b` and `#b7492d`; mist `#e7f7fd` and `#3c83a8`; volt `#fff2a8` and `#1557d8`; thorn `#c9ec9b` and `#39734a`; shade `#c9c1f2` and `#40336d`. Rarity eye tints: common and uncommon `#5cbf89`, rare `#9ac4ff`, epic `#ffd7d2`, legendary `#fff0a8`.

### Neutral
- **Table Cream** (`cream`): the page canvas, the sticky top bar, and the face of every card and placed piece.
- **Board Sky** (`sky-surface`): the board rows, the home hero surface, the auth page backdrop, and hover on secondary buttons.
- **Soft Sky** (`sky-soft`): hover fill for quiet controls and pieces, secondary buttons, the active tab in the mobile bar, inline notes, skeleton bars.
- **White** (`white`): panels, dialogs, inputs, chips, dice, and stepper buttons.
- **Ink** (`ink`): all primary text, and the 2px border of every game piece. At 40% it is the dialog scrim; at 8 to 20% it is the hairline on chrome and the divider inside cards.
- **Soft Ink** (`ink-soft`): secondary copy, labels, flavor text, inactive nav.
- **Edge** (`edge`): the 1px border of text inputs and skeleton bars.
- **Sprite Outline** (`sprite-outline`): the outline pixel of every cat. Slightly warmer and darker than ink; used nowhere else.

### Named Rules
**The Lime Is Yours Rule.** Lime marks something the player chose, holds, or won. It is never decoration and never the rival's.

**The Coral Is Theirs Rule.** Coral marks the rival's move, a pending obligation, or a destructive act. Text sitting on a coral fill is ink.

**The Ink On Colour Rule.** Text on lime, coral, sky, cream, or an element hue is ink. White text appears only on cobalt.

**The Element Stays On The Cat Rule.** Element hues colour sprites, pips, and dice. Panels, buttons, and headings never take an element colour.

## Typography

**Display Font:** the platform rounded face (`ui-rounded`, then Avenir Next, Trebuchet MS, system-ui)
**Body Font:** the same stack

**Character:** one bold, rounded, tightly tracked voice for names and numbers, and the same face at regular weight for rules text. No webfont is loaded, so the face differs by platform; see the note at the end of this section.

### Hierarchy
- **Display** (800, 1.875rem rising to 3rem from 640px, line-height 1.05, tracking -0.035em): the one headline of a page: the next step on home, the auth heading, "Codex" (which stops at 2.25rem).
- **Headline** (800, 1.25rem rising to 1.5rem from 640px, tracking -0.025em): the match title, a rival's name, dialog titles, the wordmark.
- **Title** (800, 1.125rem, line-height 1.25): panel titles, side-panel headings, row names on the board (1rem), status-strip numbers.
- **Card title** (800, 0.875rem, line-height 1.25): a cat's or relic's name on its piece, and the points tag.
- **Body** (400, 1rem, line-height 1.45): page copy and dialog copy. Introductory paragraphs are capped near 65ch.
- **Body small** (400, 0.875rem, line-height 1.375): most in-game prose: rival traits, goals, the event log, table rows. Bold (700) for the lead-in of a line.
- **Caption** (400, 0.75rem, line-height 1.375): rules text on a card, secondary notes, flavor text (italic, soft ink).
- **Label** (700, 0.75rem, soft ink, sentence case): the small heading above a group of pieces ("Feeder", "Your hand", "Round 2 goal").
- **Piece label** (700 or 900, 10 to 11px, ink): text that lives on a board slot or die: cat name, yarn count, slot cost. This is the floor; nothing in play is smaller.

### Named Rules
**The Numbers Line Up Rule.** Every score, count, and cost that can change uses tabular figures.

**The Sentence Case Rule.** Headings, buttons, and labels are sentence case. Uppercase is reserved for two small marks: the filter group label and the Boss tag in the codex.

**The Rules Are On The Piece Rule.** A card states its own cost, points, and power in words. Type on a piece may get small, but it stays ink and stays bold enough to read on a phone.

Note: the type stack is a system stack and has not been chosen as a brand face. Treat the weights, sizes, and tracking above as the system and the family as open.

## Layout

Mobile-first, and it must hold at 375px.

- **Shell.** From 768px a white rail (192px wide, full height, 1px right hairline) carries the wordmark and three destinations: Home, Play, Codex. Below 768px the rail is replaced by a floating three-item bar (12px from the screen edges, 16px radius, white at 95% with blur). A sticky cream top bar at every width shows the signed-in name and Log out; on mobile it also carries the wordmark. Login and signup render without the shell.
- **Content column.** Centered, maximum 1180px, with 12px side padding rising to 20px at 640px and 24px at 1024px. Bottom padding clears the mobile bar.
- **Rhythm.** A 4px base. Sections on a game screen stack at 12px; groups inside a panel at 8 to 12px; pieces in a grid at 6px (dice, slots, chips) or 8px (cards). Home and codex stack at 16px. Panel padding is 16px; compact in-match panels use 12px; the hero surface uses 24px rising to 36px.
- **Match screen.** One column on a phone, in this order: status strip, the three board rows, hand, supply, rival, goal, relics, event log. From 1024px it becomes two columns: the board, hand, and supply in a flexible column, and a fixed 304px side column for rival, goal, relics, and log. A board row puts its name and activate button above its four slots on a phone and to the left (144px) from 640px. The hand scrolls sideways on a phone as 208px cards and wraps from 640px.
- **The dock.** The current decision and its confirm sit in a bar that sticks to the bottom of the viewport (above the mobile bar on a phone, 12px from the bottom from 768px). Clan pick, setup, the match, and reward pick all end in one.
- **Grids.** Card grids are one column, two from 640px, three from 1024px, with a 12px gap. In-run choice grids are three columns from 640px with an 8px gap. The feeder is always five dice across.
- **Targets.** Buttons are 40, 48, or 56px tall; chips 44px; nav items 48px; dice 48px; board slots at least 96px tall.

## Elevation & Depth

Hybrid, split by material. Chrome is lifted by one soft ambient shadow; game pieces are flat and separated by their ink border and their fill. Depth in play is shown by rings and fills, never by shadow.

### Shadow Vocabulary
- **Panel** (`box-shadow: 0 10px 30px rgb(23 33 43 / 0.08)`): the standard white panel and dialogs.
- **Dock** (`box-shadow: 0 10px 30px rgb(23 33 43 / 0.16)`): the sticky decision bar, which floats over the board.
- **Floating bar** (`box-shadow: 0 12px 36px rgb(23 33 43 / 0.18)`): the mobile navigation bar.
- **Auth shell** (`box-shadow: 0 28px 80px rgb(13 60 157 / 0.2)`): the single card on the login and signup pages.
- **Rarity band** (`box-shadow: inset 0 3px 0 <rarity colour>`): the strip across the top of a cat card. An inset band, not a shadow.

### Named Rules
**The Flat Piece Rule.** A game piece never casts a shadow. If a piece needs to stand out, give it a ring or change its fill.

**The Ring Means State Rule.** Rings are cobalt and sit outside the ink border: 4px for selected or the valid target, 2px for available to pick. A 4px coral ring means the piece is waiting on a decision.

## Shapes

Two corner languages, one per material.

- **Chrome is rounded.** Panels 20px; flat panels, the mobile bar, and the inner auth card 16px; inputs, nav items, and inline notes 12px; the home hero and the auth shell 28px; buttons and chips are full pills. Chrome borders are 1px hairlines of ink at 8 to 15%.
- **Pieces are square.** Cat cards, board rows, slots, dice, pips, tags, the gauntlet track, and score boxes have no radius and a solid 2px ink border. An empty slot uses the same 2px border, dashed, at 45% ink. Small marks inside a piece (the yarn counter) use a 1px ink border.
- **Sprites are pixels.** A 16x16 grid drawn with crisp edges. Sizes in use: 28, 44, 56, 72, 144, and 320px.
- **Icons.** Navigation and the password toggle use 20px line icons with a 2px stroke and round caps, drawn inline.

## Components

### Buttons
Capsules with the bold display voice; they press down 2px and shrink to 99% over 140ms.
- **Shape:** full pill (999px), 1px border in the fill colour.
- **Sizes:** small 40px tall, 12px text, 8px by 12px padding; medium 48px, 14px text, 12px by 20px; large 56px, 16px text, 16px by 28px.
- **Primary:** cobalt with white text; hover goes to pressed cobalt. One per decision.
- **Secondary:** soft sky with ink text; hover goes to board sky. Cancel, back, retry.
- **Hero:** lime with ink text and a soft lime glow (`0 10px 20px rgb(216 255 79 / 0.24)`). Used for the row activate button while that row is being resolved.
- **Danger:** coral; hover darkens 5%. Log out and abandon run, always behind a confirm dialog. The build sets this label in white, which breaks the Ink On Colour Rule and is hard to read; that is carried, not a rule.
- **Disabled:** 45% opacity, not-allowed cursor.
- **Focus:** 3px cobalt outline, 3px offset. This is the global focus treatment for every focusable element.
- A link that navigates but looks like a button uses the same classes on a real anchor.

### Chips
- **Style:** 44px pill, white with a 1px ink hairline (15%), 14px bold ink text; may lead with an essence pip.
- **State:** selected is cobalt fill, cobalt border, white text; hover on unselected is soft sky. Used for codex filters and codex section links.

### Cards / Containers
- **Panel:** white, 20px radius, 1px ink hairline (8%), the panel shadow, 16px padding, optional title row. A featured panel (a won match) swaps the hairline for a 2px cobalt border; a selected clan does the same.
- **Flat panel:** white, 16px radius, hairline, no shadow. The status strip, the codex link row, skeleton cards; the dock adds the dock shadow.
- **Hero surface:** board sky, 28px radius, 24 to 36px padding; holds a 144px sprite, a greeting, the display headline, and one large button.
- **Dialog:** a panel, 448px maximum, over a 40% ink scrim; bottom-anchored on a phone, centered from 640px. Buttons stack on a phone with the primary on top and sit right-aligned from 640px.
- **Skeleton:** soft sky bars with a 1px edge border and a pulse, shaped like the content they replace.

### Inputs / Fields
- **Style:** white, 48px tall, 12px radius, 1px edge border, 16px text, 16px side padding. The label sits above in 14px extra-bold ink.
- **Focus:** the border turns cobalt. The build also removes the global focus outline from text inputs; that is carried, not a rule, and a new field keeps the outline.
- **Error:** a message below the fields on a 10% coral tint with ink text, 12px radius. Space for it is reserved so the form does not jump.
- **Disabled:** 60% opacity.

### Navigation
- **Rail (768px and up):** 48px items, 12px radius, icon plus 14px bold label. Inactive is soft ink and takes a soft sky fill on hover; active is cobalt with white text.
- **Bar (below 768px):** three equal columns, icon over an 11px bold label. Active is a soft sky fill with cobalt text.
- **Wordmark:** "Hadu" in ink, "Mon" in coral, bold rounded, 24px in the rail.

### Cat Card
The signature piece. Cream face, 2px ink border, square, 8px padding, with the rarity band across the top. First line: the sprite (44px compact, 72px full), the name in the card-title style, the cost as a row of essence pips beneath it, and the points in a lime tag at the right. Then, under a faint ink rule, the power written out in 12px text. The full variant adds a soft-ink line for rarity, element, rows, and yarn capacity, and the flavor text in italics. A locked card drops to 60% opacity, greys its sprite, and shows the unlock hint in place of the power. When a card is a choice it sits in a wrapper that adds the cobalt ring and a small square "Details" button.

Relics, clans' deck tokens, and rivals use the same piece shell (cream, 2px ink, square, 12px padding) without the sprite header.

### Essence Pip
A square of essence: 12px by default (14px in lists, 22px on a die), 2px ink border, filled with the element's primary fur tone. A cost that any essence pays, and wild essence, are white pips.

### Die
A white square piece, 48px tall, holding a 22px pip above the element's name in 10px bold. Selected fills lime; hover is soft sky. It is a button only while dice are being chosen.

### Board Row and Slots
A row is a board-sky band with a 2px ink border and 8px padding, holding its name, the cost of its next slot, its activate button, and four slots at a 6px gap. A filled slot is a cream piece with the sprite (40px on a phone, 56px from 640px), the cat's name, and a yarn counter that turns lime while yarn is queued. The next free slot becomes a lime "Play here" button when a card can go there; other empty slots are dashed outlines showing their cost. The whole row takes a 4px cobalt ring while it is a valid target.

### Status Strip, Tags, and Notices
- **Status strip:** a flat panel of four equal cells (round, turns left, you, rival) divided by hairlines; label above, number in the title style.
- **Score tag / standing bar:** lime fill, 2px ink border, bold ink text, tabular figures.
- **Rival bar:** cream piece that fills coral for an instant when the rival acts and fades back over 700ms.
- **Gauntlet track:** six 28px squares, lime for won, white for next, dimmed sky for to come.
- **Empty state:** a 2px dashed ink outline (20%) with one line of copy and a secondary button.

### Motion
Short and functional. Press feedback is 140ms. The rival bar flashes in over 150ms and fades over 700ms. The auth card rises 12px and fades in once over 320ms on an ease-out curve. Skeletons pulse. All animation and transition durations collapse under `prefers-reduced-motion`.

## Do's and Don'ts

### Do:
- **Do** decide which material a new element is before styling it. In play: square, 2px ink border, flat fill. Around play: rounded, white, hairline, soft shadow.
- **Do** render every cat through `src/components/PixelSprite.tsx` at a whole-pixel multiple of 16 where the layout allows.
- **Do** use ink text on lime, coral, sky, and cream; white text only on cobalt.
- **Do** show selection with a cobalt ring outside the piece's border (4px selected, 2px available) and reinforce a chosen piece with a lime fill.
- **Do** end every multi-step choice in the sticky dock, with a sentence saying what will happen and one primary button.
- **Do** keep page copy and controls at 48px touch height or more; nothing interactive in play goes below 40px.
- **Do** write counts and scores in tabular figures and labels in sentence case.
- **Do** give every loading surface a skeleton in the shape of its content, and every error a plain sentence and a retry.

### Don't:
- **Don't** round the corners of a game piece or give it a drop shadow.
- **Don't** put a 2px ink border or square corners on page chrome.
- **Don't** use gradients or emoji anywhere.
- **Don't** use raster or smoothed creature art; a cat is its 16x16 sprite.
- **Don't** use an element hue for a panel, a button, or a heading.
- **Don't** use lime for anything the rival owns, or coral for a reward.
- **Don't** introduce currency, shop, or premium styling; nothing is for sale.
- **Don't** treat the landing placeholder as a pattern source.
