---
version: 1
slug: "src-components-landing-landingpage-tsx"
primary_target: "src/components/landing/LandingPage.tsx"
related_targets: ["src/app/page.tsx"]
---

# Landing — surface brief

Scope: signed-out `/`. Visitor mode: Persuade. Audience: roguelike and engine-builder players arriving from a shared link. Job: play one row against the first rival, see what the cats, the rows and a run are, create an account. Every number comes from `src/server/game/*`; no social proof, no commercial claims. Auth (`/login`, `/signup`) is Operate and inherits DESIGN.md without a brief of its own.

## Direction contract

THESIS: The landing page is the front of the box: a chunky title plaque on a thick-framed stage you can play, pixel cats crowding the margins, and three folded panels saying what is inside. It refuses the quiet flat ladder it replaces, and it refuses borrowed game-promo materials (wood, parchment, gradients, review and award slots).

OWN-WORLD: Pieces on a Cream Table, turned up (DESIGN.md). The tabletop's die-cut cardboard, woven cloth and pixel print face come to the landing page: a full-bleed sky mat, a cobalt stage frame, cream boards on cloth, coral rival nameplates, and the cats' element hues at 160 to 320px. No gradients, no raster art, no emoji.

STORY: Take two dice and watch the Hunt row fire right to left while the crowd hops with it; meet the 26 cats; see what each of the three rows pays; read the six rivals up to Old Nine Lives; start a run.

FIRST VIEWPORT: An ink lid strip ("Free. Nothing to install. Nothing for sale.", Log in, Sign up); on a sky mat the cream title plaque with the HaduMon wordmark and Hadu perched on it, a lime ribbon carrying the h1 "Six rivals. Twelve turns each."; the cobalt stage frame holding the playable Hunt row, the feeder, Alley Tom's nameplate, last card and the log, with the two score tokens docked on its right edge; six to eight cats at 160 to 320px on both sides, overlapping the frame and cropped by the viewport; the lead plank and "Start a run" tucked under the frame.

FORM: Pinned by the user, so there is no seed key and no concept roll. The pin is the user's reference (the Kingdom Rush Frontiers site, "its vibes, not a copy": framed centre stage, characters spilling over the frame and the page edges, a centre column on a patterned backdrop, alternating picture-and-text blocks) and the two answers recorded in the approved plan of 2026-10-05: material, "HaduMon's own materials, turned up"; content, "a shorter page" (the ladder goes; a framed playable hero, three feature blocks and a sign-up close replace it). Built code-led although the project default is comp-led: the session had no image generation, so no comp could be made.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## The crowd by width

- From 1280px: seven cats. Hadu on the plaque, two perched on the stage's top edge (128px), one standing each side of the stage (192px and 176px), and a far bigger one behind each of those (320px and 288px), placed from the page edge and cropped by it.
- 1024px to 1279px: the two big back cats go; the side cats stand whole in the margins at 96px.
- Below 1024px: the margins go. Hadu on the plaque, two 64px cats on the stage's top edge (a third from 640px), and one cat hanging off the stage's bottom right corner, cropped by the page edge (96px, 128px from 640px).

## Memorable moment

The Hunt row firing: each cat lights lime and presses in turn from right to left, its line lands in the log, and the crowd hops with the chain, right cluster first, then the plaque, then the left. The demo runs the real engine (`createMatch`, `applyAction`) in the browser for one round of five turns; nothing is saved. Its placed cats are the match's tiles: the element's 4px edge down the left, and the element mark hung off the sprite's top left corner with a cream rim, since the firing tag has the tile's corner.

## Unresolved

- The display face is the system rounded stack; DESIGN.md marks the family as open.
- The lime ribbon under the wordmark carries the h1. It is the one lime surface that is not something the player chose, holds or won; the plan named it, and DESIGN.md records it as the exception to the Lime Is Yours Rule.
- The wordmark's die-cut treatment (ink cut line, chipboard edge) sits on the system rounded stack, which resolves to a plain sans where no rounded face is installed. Choosing and self-hosting a rounded face is the user's call; the plan ruled out a new font.
- DESIGN.md's Scoped Thickness Rule and Two Sizes Of Print Rule predate this page: the landing page is now a tabletop, and print gains 40px for its headings.
