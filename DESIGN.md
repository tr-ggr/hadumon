---
name: HaduMon Gachapon Counter
description: A bright, tactile collectible-toy world for an idle feline RPG.
build_path: comp
colors:
  cream: "#FFF8E7"
  sky: "#A9DDF5"
  cobalt: "#1557D8"
  cobaltDark: "#0D3C9D"
  lime: "#D8FF4F"
  coral: "#FF7163"
  ink: "#17212B"
  inkSoft: "#5B6C7D"
  flameSoft: "#FFE6D8"
  mistSoft: "#DFF4FC"
  voltSoft: "#FFF3BD"
  thornSoft: "#E2F3D2"
  shadeSoft: "#E7E1FA"
typography:
  display: "ui-rounded, Avenir Next, Trebuchet MS, system-ui, sans-serif"
  body: "ui-rounded, Avenir Next, Trebuchet MS, system-ui, sans-serif"
radius:
  card: "20px"
  large: "28px"
  pill: "999px"
spacing: "4px base rhythm; 16–40px surfaces"
---

# Gachapon Counter

HaduMon is a bright collectible-toy counter: the player returns to a friendly cattery, sees what their squad earned, and gets one obvious next action. The supplied tuxedo cat is the identity anchor across the mascot, auth, public, collection, and social surfaces. Every species is a distinct elemental form rendered as a transparent soft 3D figurine in `public/creatures/`.

## System

- Warm cream is the canvas; sky blue marks structural zones and navigation context.
- Cobalt means the primary action and active destination. Acid lime means a reward that is ready to claim. Coral is reserved for notifications, battle danger, and errors.
- Near-black text carries copy and data. Muted blue-grey supports secondary copy without disappearing.
- Cards are quiet white surfaces with 16–28px radii, thin low-contrast borders, and controlled soft shadows. No pixel art, CRT scanlines, hard offset shadows, square panels, gradients, or monetization cues.
- The display and body voice is a bold rounded grotesk stack. Labels are compact and uppercase; explanations use readable sentence case.
- Buttons are capsule-like with 48–64px touch targets, a visible cobalt focus ring, a tactile press translation, and explicit disabled/loading states.

## Layout and responsive behavior

Desktop uses a 192px rounded rail and a max-width 1180px content field. Mobile collapses to a five-destination bottom bar with a raised central Summon action; More opens a focusable sheet for Market, Collection, account, and logout. The header keeps the trainer identity and gold/gem pills readable at every width.

Home leads with greeting and mascot, then one state-aware return-player console, a compact wallet/rank strip, three mode actions, top squad, and grouped updates. Gameplay pages inherit the same surfaces and action hierarchy. Empty, loading, error, and locked states use the same language.

## Motion and accessibility

The signature motion is a short capsule float and reward reveal. Landing pulls add a brief console recoil, 150ms card stagger, one-shot rarity flash, and finite legendary shimmer. Supporting sections rise no more than 16px with a limited sibling stagger. Continuous effects pause offscreen or when the tab is hidden, and all movement is removed under `prefers-reduced-motion`. All controls have visible focus, descriptive image alternatives, and at least 48px touch targets. Creature art is resolved through the typed `CreatureArt` manifest, so a missing species file fails loudly in development and in the completeness test.
