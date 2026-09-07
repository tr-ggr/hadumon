---
name: HaduMon
description: Retro pixel interface for an idle feline collector — indigo ground, violet panels, hard black offsets, stepped motion.
colors:
  navy: "#0f0b1e"
  navy-deep: "#090616"
  panel: "#1e1633"
  panel-hi: "#2a2047"
  edge: "#4a3b7a"
  gold: "#f5c542"
  mint: "#5ef2b2"
  pink: "#ff6fb5"
  sky: "#4fa8ff"
  ink: "#efe9ff"
  ink-dim: "#a294c9"
  flame: "#f2762e"
  mist: "#7fc7e8"
  volt: "#f5d33a"
  thorn: "#5cc46a"
  shade: "#8b6ecb"
typography:
  display:
    fontFamily: "'Press Start 2P', 'Courier New', monospace"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0.02em"
  headline:
    fontFamily: "'Press Start 2P', 'Courier New', monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0.02em"
  title:
    fontFamily: "'Press Start 2P', 'Courier New', monospace"
    fontSize: "10px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0.02em"
  body:
    fontFamily: "VT323, 'Courier New', monospace"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: "normal"
  label:
    fontFamily: "'Press Start 2P', 'Courier New', monospace"
    fontSize: "8px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0.025em"
rounded:
  none: "0px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  section: "64px"
components:
  button-primary:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.navy}"
    typography: "{typography.headline}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
  button-primary-hover:
    backgroundColor: "#ffd968"
    textColor: "{colors.navy}"
  button-secondary:
    backgroundColor: "{colors.panel-hi}"
    textColor: "{colors.ink}"
    typography: "{typography.headline}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
  button-secondary-hover:
    backgroundColor: "{colors.edge}"
    textColor: "{colors.ink}"
  button-danger:
    backgroundColor: "{colors.pink}"
    textColor: "{colors.navy}"
    typography: "{typography.headline}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
  button-sm:
    typography: "{typography.title}"
    padding: "4px 8px"
  panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "12px"
  panel-header:
    backgroundColor: "{colors.panel-hi}"
    textColor: "{colors.gold}"
    typography: "{typography.title}"
    padding: "8px 12px"
  badge:
    backgroundColor: "{colors.navy-deep}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "2px 4px"
---

# Design System: HaduMon

## Overview

**Creative North Star: "The Handheld That Never Sleeps"**

HaduMon looks like a game that runs on a small, dark, backlit handheld: a near-black indigo screen, violet card panels with two-pixel edges, hard black drop shadows that sit exactly four pixels down and right, and every letter set in a bitmap face. Nothing is rounded, nothing is blurred, nothing tweens. Motion happens in frames (`steps(n)`), the way a sprite sheet animates, and colour is used as signal: gold means value and headings, mint means gain, pink means warning or a new thing, and each of the five elements and five rarities owns a colour the whole interface honours.

The system is dense but legible. The pixel display face (Press Start 2P) is tiny by design, six to twelve pixels for chrome and eighteen to twenty-four for a page headline, and it is always paired with a tall, narrow terminal face (VT323) for anything a player has to read at length. Depth comes from edges and offsets, not from light: a panel is a panel because it has a border and a shadow, not because it floats.

The public landing page inherits this world unchanged and adds one register the game itself does not use: full-bleed bands drenched in an element's own fur palette, one per element.

**Key Characteristics:**
- Near-black indigo ground with violet panels and 2px violet edges.
- Zero border radius everywhere, including the Open Graph card.
- Hard black offset shadows (4px panels, 3px buttons) plus coloured rarity glows.
- Press Start 2P for headings and labels, VT323 for body; both bitmap-flavoured.
- Stepped motion only, with a reduced-motion path for every animation.
- Inline-SVG pixel sprites for every creature; no raster art of cats exists.

## Colors

A dark, saturated palette: one indigo ground, one violet panel family, four signal accents, and ten element and rarity colours that carry meaning across every screen.

### Primary
- **Gold** (#f5c542): headings, panel titles, primary buttons, the wallet's gold figure, legendary outlines. The colour of value and of "look here".

### Secondary
- **Pink** (#ff6fb5): the second half of the wordmark, danger buttons, "New!" tags, errors, the enemy side of a fight, the locked chip. Warning and novelty.
- **Mint** (#5ef2b2): links, positive numbers, the pity bar's fill, the player's side of a fight, uncommon outlines. Gain.
- **Sky** (#4fa8ff): rare outlines and the occasional stat tone. Used sparingly.

### Neutral
- **Navy** (#0f0b1e): the page ground. Sampled to the byte on the landing page; never lightened toward slate.
- **Navy Deep** (#090616): inset wells: progress-bar tracks, fight logs, scrollbar tracks, the close of the landing page.
- **Panel** (#1e1633): every card, panel, header bar and footer.
- **Panel Hi** (#2a2047): panel header bars, secondary buttons, active nav items.
- **Edge** (#4a3b7a): all 2px borders, dividers, the dashed ring of the type chart, the wheel's inactive state.
- **Ink** (#efe9ff): body text, headline text, card names.
- **Ink Dim** (#a294c9): secondary copy, labels, captions.

### Element colours
- **Flame** (#f2762e), **Mist** (#7fc7e8), **Volt** (#f5d33a), **Thorn** (#5cc46a), **Shade** (#8b6ecb). Each element also has a three-stop fur palette (`ELEMENT_PALETTES[e]["1" | "2" | "3"]`: mid, light, deep) that tints sprites and, on the landing page, drenches a whole band: deep stop as the band ground, light stop for its text, mid stop for its rules and stripe.

### Rarity colours
- **Common** outline #7b8ba6, **Uncommon** #5ef2b2, **Rare** #4fa8ff, **Epic** #ff6fb5, **Legendary** #f5c542, each with a lighter glow (`RARITY_PALETTES[r].glow`) used only as a `0 0 Npx` halo on epic and legendary cards and badges.

### Named Rules
**The Signal Rule.** Gold, mint and pink are meanings before they are decoration: value, gain, warning. A gold border is reserved for the thing on the page that pays out (the altar, the close, a selected card); a second gold-bordered element on the same screen dilutes the first.

**The Ground Rule.** The page ground is Navy (#0f0b1e) and inset wells are Navy Deep; panels are the only lighter surfaces. Nothing sits on white.

## Typography

**Display Font:** Press Start 2P (with Courier New, monospace)
**Body Font:** VT323 (with Courier New, monospace)

**Character:** A bitmap arcade face for everything that names or labels, and a tall terminal face for everything that explains. Press Start 2P is set deliberately small; VT323 is set large to compensate, so a 20px body line sits comfortably beside a 10px title.

### Hierarchy
- **Display** (Press Start 2P, 18px on mobile and at ≥1024px, 24px at 640–1023px, line-height 1.6): the landing page's one H1. Always a single line.
- **Headline** (Press Start 2P, 12px, and 16px at ≥640px for landing section titles): section titles, the wordmark, panel titles on wide screens.
- **Title** (Press Start 2P, 10px): panel header titles, button text, small headings.
- **Card name** (Press Start 2P, 9px; 8px in the dense reveal card): a creature's name under its sprite.
- **Label** (Press Start 2P, 8px, uppercase, tracking 0.025em): data labels inside panels: GOLD, GEMS, PITY, RATE-UP, COST. Also badges at 7px and the mobile bottom-nav captions at 6px.
- **Body** (VT323, 20px root, 16–20px in components, line-height 1.35): descriptions, flavor text, log lines, hints. Tabular numerals on every figure.

### Named Rules
**The Two-Voice Rule.** Press Start 2P names and labels; VT323 explains. Never set a paragraph in the pixel face, and never set a label in VT323.

**The Label-Not-Eyebrow Rule.** The gold 8px uppercase label lives inside panels beside a value. It is not placed above a section heading as a kicker; a heading carries itself.

**The One-Line Headline Rule.** Headline sizes are chosen so the text does not wrap in its column (the landing H1 steps 18 → 24 → 18px across breakpoints for exactly this reason).

## Layout

A single centred column, `max-width: 72rem` (1152px), with 12px gutters on mobile and 16px from 640px. The signed-in app adds a 160px side navigation from 768px and a fixed six-column bottom navigation below it, so content gets 80px of bottom padding on phones.

Spacing steps are 4, 8, 12, 16 and 24px. Panels pad 12px; panel headers pad 8px 12px; grids gap 8–12px. The landing page runs one vertical rhythm for every section: 64px above and 48px below on mobile, 96px above and 64px below from 640px, with 24–32px between a section's heading and its body. More space above a heading than below it, always.

Responsive rules observed: card grids are 2 columns on phones, 3 from 640px, 4–5 from 1024px; the landing hero is one column in reading order below 1024px and a 2fr/3fr two-column grid above it with the altar spanning both rows; the day-timeline rail is vertical on phones and horizontal from 1024px. Everything must work at 375px wide with no horizontal scroll.

## Elevation & Depth

Depth is drawn, not lit. There are no blurred shadows and no tonal elevation ramps: a raised surface has a 2px Edge border and a hard black offset; an inset surface is Navy Deep with the same 2px border. Glows exist only as rarity halos and never as ambient light.

### Shadow Vocabulary
- **Panel offset** (`box-shadow: 4px 4px 0 #000`): every `panel`, card, toast, and the Open Graph card at 12px.
- **Control offset** (`box-shadow: 3px 3px 0 #000`): buttons, action links, stat tiles, zone cards.
- **Pressed** (`transform: translate(2px, 2px); box-shadow: 2px 2px 0 #000`): the `pixel-press` active state, 60ms in two steps.
- **Rarity halo** (`box-shadow: 0 0 12px <glow>, 4px 4px 0 #000`): epic and legendary cards; 6px on badges; 16px gold on the landing page's close.
- **Selected ring** (`box-shadow: 0 0 0 2px var(--color-gold), 3px 3px 0 #000`): a selected zone or creature card.

### Named Rules
**The Hard Offset Rule.** A shadow is a solid black rectangle offset down-right. No blur radius, no spread, no colour other than black, except a rarity halo, which is always paired with the offset.

## Shapes

Every corner is square: `border-radius: 0` on panels, buttons, badges, inputs, images, progress bars and the share card. Borders are 2px in Edge (1px on badges, 3px on a legendary card). Pixel art is rendered with `shape-rendering: crispEdges` and `image-rendering: pixelated`, and the 45° terrain stripe (`repeating-linear-gradient(135deg, deep 0 6px, mid 6px 12px)`) is the one decorative pattern, used on zone cards and as a 16px strip above each landing band. An optional `scanlines` overlay (1px black at 16% every 3px) marks CRT surfaces: the app shell when the player toggles it, the landing altar and close always.

## Components

### Buttons
- **Shape:** square (0px), 2px border, hard 3px offset, `text-pixel`.
- **Primary:** Gold on Navy text with a Navy border; hover lightens to #ffd968. Padding 8px 12px at 12px type (`md`), 4px 8px at 10px type (`sm`).
- **Secondary:** Panel Hi with Ink text and an Edge border; hover fills Edge.
- **Ghost:** transparent with Ink Dim text; hover brightens to Ink. **Danger:** Pink on Navy.
- **Press / Disabled:** `pixel-press` shifts the button 2px and shrinks the offset for 60ms in two steps; disabled drops to 40% opacity with no shadow.
- **Links that look like buttons** use `buttonClassName()` on a real anchor (`ActionLink`), with a 44px minimum height.
- **Focus:** on the landing page every focusable element gets a 2px Gold outline offset 2px (`.landing-root :focus-visible`).

### Panels / Cards
- **Corner Style:** square.
- **Background:** Panel; header bar Panel Hi with a 2px Edge bottom border and a Gold 10–12px title, optional mint underlined action link on the right.
- **Shadow Strategy:** panel offset; `panel-flat` drops the shadow for nested tiles.
- **Border:** 2px Edge.
- **Internal Padding:** 12px body, 8px 12px header.

### Creature cards
A `panel-flat` tile whose border colour is the rarity outline (3px for legendary), a 72px `PixelSprite` (64px in the dense variant), the name in 9px pixel type, element and rarity badges, and a VT323 `Lv N | PWR` line with a Gold power figure. Epic and legendary add the rarity halo; a reveal adds `gacha-pop`, a rarity-coloured `gacha-flash` overlay, and, for legendary, the `gacha-shine` brightness pulse. Cards never truncate names.

### Badges
1px-bordered uppercase 7px pixel chips coloured from the element or rarity palette on a Navy Deep ground; legendary badges carry a 6px halo. Corner tags ("New!", "Pity", "Gtd") are the same chip in Pink, Gold or Mint with Navy text.

### Stat tiles
`panel-flat` with a 3px offset, an 8px uppercase Ink Dim label and a tabular Gold value (12–14px pixel type). Used for wallets, roster counts, ratings.

### Progress bars
An 8px-tall Navy Deep track with a 2px Edge border and a Mint fill (Gold once a guarantee is ready). Fills move in four steps over 120–160ms via `transform: scaleX` from the left edge.

### Inputs / Fields
`panel`-styled text fields on Navy Deep with a 2px Edge border and VT323 text; error messages in Pink with `role="alert"`.

### Navigation
- **App top bar:** sticky, Panel with a 2px Edge bottom border; the wordmark `Hadu` in Gold and `Mon` in Pink at 12px pixel type; wallet chips as `panel-flat` tabular figures; CRT toggle and logout as small buttons.
- **Side nav (≥768px):** 160px column of bordered items; active is Gold text on Panel Hi with a Gold border, inactive Ink Dim on Panel with an Edge border.
- **Bottom nav (<768px):** fixed six-column bar, a Unicode glyph over a 6px pixel caption.
- **Landing header:** the same wordmark left, a secondary "Log in" and primary "Create account" anchor right, sticky, 62px tall.

### Element bands (landing signature)
Five full-bleed sections in flame, mist, volt, thorn, shade order. Ground is the element's deep fur stop, text its light stop, the top and bottom rules and the 16px 45° stripe strip its mid stop. Inside: the element name in 12–14px uppercase pixel type, the element's zone in a bordered box, and its cats as creature cards on a Navy Deep pocket (`color-mix` 84%) so sprites keep their contrast. Tiles reveal on scroll in four staggered steps.

### Motion vocabulary
- `pixel-press`: 60ms, `steps(2)`, translate 2px.
- `gacha-pop`: 260ms, `steps(6)`, scale 0.82 → 1.08 → 1; cards stagger 150ms apart.
- `gacha-flash`: 420ms ease-out fade of a rarity-coloured overlay (the one eased curve in the system).
- `gacha-shine`: 1.4s, `steps(8)`, infinite brightness pulse on a legendary sprite.
- `land-bob`: 1s, `steps(2)`, a two-frame 4px idle bob on the featured cat; runs only while on screen and the tab is visible.
- `land-jolt`: 120ms, `steps(2)`, a 2px shake of the altar when a legendary lands.
- `land-reveal`: 320ms, `steps(6)`, opacity and 8px rise for scroll reveals; `land-hidden` is applied only after mount so content is visible without JavaScript.
- Type-chart arrow: one stop every 900ms, `steps(1)` opacity between 1 and 0.28.
- Reduced motion: bob, jolt and translation are removed; reveals become opacity-only; loops do not autoplay (the fight log offers a Replay button); the stagger of a reveal stays because it is state, not movement.

## Do's and Don'ts

### Do:
- **Do** set every corner to 0px and every border to 2px Edge (1px on badges, 3px on legendary).
- **Do** use `4px 4px 0 #000` on panels and `3px 3px 0 #000` on controls, and pair any glow with that offset.
- **Do** draw creatures with `PixelSprite` (inline SVG runs) at 24, 32, 56, 64, 72 or 128px.
- **Do** derive every number shown to players from `src/server/game/*`; the landing page has no hand-typed counts, rates or rewards.
- **Do** animate with `steps(n)` and transform/opacity, stop loops when their element is off screen or the tab is hidden, and provide a `prefers-reduced-motion` path that keeps the state change.
- **Do** keep the gold 8px uppercase label as an in-panel data label beside a value.
- **Do** give every focusable element a visible 2px Gold outline on the landing page, and keep touch targets at 44px.

### Don't:
- **Don't** introduce border radius, blurred shadows, gradients other than the 45° stripe, or a lighter ground.
- **Don't** place an eyebrow kicker above a heading; the heading and its VT323 intro carry the section.
- **Don't** set body copy in Press Start 2P or labels in VT323, and don't let a pixel-type heading wrap where a smaller step would keep it to one line.
- **Don't** truncate a creature's name; use the dense card variant or a wider column instead.
- **Don't** put a second gold-bordered surface on a screen that already has one.
- **Don't** add icon packs, animation libraries or a second display face; the world is complete with two fonts, Unicode glyphs in the app shell, and inline SVG.
