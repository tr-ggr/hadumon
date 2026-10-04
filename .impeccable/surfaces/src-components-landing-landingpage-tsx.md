---
version: 1
slug: "src-components-landing-landingpage-tsx"
primary_target: "src/components/landing/LandingPage.tsx"
related_targets: ["src/app/page.tsx"]
---

# Landing — surface brief

Scope: signed-out `/`. Visitor mode: Persuade. Audience: roguelike and engine-builder players arriving from a shared link. Job: understand what a match is by playing one row, see what a run is, create an account. Every number comes from `src/server/game/*`; no social proof, no commercial claims. Auth (`/login`, `/signup`) is Operate and inherits DESIGN.md without a brief of its own.

## Direction contract

THESIS: The landing page is the run itself: six rivals stacked as a ladder you scroll down, the first one playable. It refuses the hero-plus-feature-cards marketing page.

OWN-WORLD: Pieces on a Cream Table (DESIGN.md): cream canvas, sky board rows, square 2px-ink pieces, lime for yours, coral for the rival, 16x16 pixel cats.

STORY: Press Hunt against Alley Tom and watch three powers fire right to left; see what a win adds; read down to Old Nine Lives; start a run.

FIRST VIEWPORT: Wordmark and account actions; the headline "Six rivals. Twelve turns each."; rung 1, Alley Tom, with a live Hunt row of three cats, the feeder, and one cobalt Hunt button.

FORM: The gauntlet, index 3 of 7 on the ordered list, seed 18d439d6. Built code-led although the project default is comp-led: the session had no image generation, so no comp could be made. The user locked the structure from text wireframes and did not downgrade the comp.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Memorable moment

The Hunt row firing: each cat lights in turn from right to left, its line lands in the log, then the rival's coral bar flips a card. The demo runs the real engine (`createMatch`, `applyAction`) in the browser for one round of five turns; nothing is saved.

## Unresolved

- The display face is the system rounded stack; DESIGN.md marks the family as open.
