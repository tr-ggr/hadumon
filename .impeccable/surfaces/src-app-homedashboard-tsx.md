---
version: 1
slug: "src-app-homedashboard-tsx"
primary_target: "src/app/HomeDashboard.tsx"
related_targets: ["src/app/page.tsx","src/components/AppShell.tsx","src/components/tower/TowerBackdrop.tsx","src/components/tower/places.ts","src/components/ui/Board.tsx","src/app/not-found.tsx"]
---

# Home — surface brief

Scope: signed-in `/`. Visitor mode: Operate. Audience: a player between runs, or coming back to one. Job: see where the run stands, take the one next step (start a run, or continue it), and from there reach the record of past runs and the codex. Every name and number comes from `src/server/game/*` and the run's own view. The 404 (`src/app/not-found.tsx`) is laid out the same way, beside the tower, and has no brief of its own.

## Direction contract

THESIS: Home is the game's main menu, a title screen: pieces laid beside the tower the run climbs and over the evening sea it stands in. It refuses the dashboard it replaces: no white panels, no side rail, no stat tiles, and nothing a player has to read before the one button.

OWN-WORLD: Pieces on a Cream Table (DESIGN.md), now the whole app: die-cut cardboard on the woven cloth, an ink lid, a cream title plaque with a lime ribbon, a sky mat, cream boards, and the grey pixel tower standing behind the page with the run on it, on a rock in the sea under a dithered evening sky with two banks of cloud. Home is not on the cloth: its pieces lie over that scene and cast a darker ink (`#0b1118`). No gradients (the sky is a 4x4 ordered dither), no raster art, no emoji.

STORY: See the tower and how far up it the run is; read the ribbon, which says where things stand; meet the rival who is next across the table; press the one cobalt button; under that, the record book and the codex.

FIRST VIEWPORT: The ink lid (wordmark, Home in lime and pressed, Play in cobalt, Codex in cream, the name, the speaker, the notes, Log out). Under it, over the sky and the sea, at the left: the cream plaque with the wordmark and the lime ribbon carrying the h1 ("Six rivals are waiting", "Up against Alley Tom", "A reward is waiting"); a sky mat with the clan's cat, "Welcome back, name", one sentence, the coming rival's coral nameplate, the gauntlet track and one large cobalt "Start a run" or "Continue run". At the right, clear of all of it, the whole tower: pennants on the floors taken, rivals at the windows still to come, Hadu where the run has got to. Around it the scene: ember sky dithering down to pale gold, clouds along the horizon, a glinting cobalt sea, the ink rock under the tower's foot and the dark near shore at the left.

FORM: Not recorded in the build. This brief was written after the fact from the shipped code (commits `e86d9f3..4c973de`); no seed key, pin or comp was handed to the documenter.

FINISH: documented from the build in DESIGN.md on 2026-10-05. The finish review and its verdict are not recorded here.

## Layout by width

- From 1024px: the menu (plaque, ribbon, mat) in the column's left part, then the record book and the codex board side by side (1.5fr and 1fr), 28px under it. All of it stops short of the column's right edge by the tower's width plus 40px. The tower is parked with its right side 20px in from the column's right edge and its foot 14 tower pixels above the bottom of the stage, so the rock and the sea show under it.
- 640px to 1023px: the same, with the two boards stacked.
- Below 640px: the plaque is left out (the lid carries the name) and the ribbon alone heads the page, running the full width above the tower's roof on a phone at least 660px tall. The first screen is the menu beside the tower and is at least the height between the lid and the dock less 36px; the gauntlet track is left out, since the tower beside the menu is the track. The two boards start under the first screen and run the full width, over the tower as the page scrolls. Navigation is the dock.
- The tower's pixel is 2px on a phone, 3px from 640 by 720, 4px from 1280 by 940, 5px from 1680 by 1160, 6px from 2000 by 1370. The clear side of the page reads the same number.

## The five states

All the same shape: masthead, mat, one way forward.

- Loading: a blank in the ribbon, blanks on the mat, Flameclaw on the mat.
- The run did not answer: "Your run did not answer", one sentence, a large cobalt "Try again" beside a large cream "Go to Play".
- No run: "Six rivals are waiting", "None of them are in a hurry.", the first rival's nameplate under "First across the table", six dashed markers on the track, "Start a run".
- A match in progress: "Up against <rival>", the clan, the tier and the match number, the rival's flavor line, its nameplate under "Across the table", "Continue run".
- A reward waiting: "A reward is waiting", then the next rival's nameplate under "Next across the table", "Continue run".

## Signature interaction

Leaving and arriving. A press on Play or Codex puts the menu away at once and moves the camera on the tower: in on Hadu for Play (360ms), through The Archivist's window for the codex (480ms, starting slowly). Coming home, the camera pulls back to the whole tower and the plaque, the ribbon, the mat and the boards land together with one soft thud. Back and forward move the camera under the page already showing; reduced motion cuts.

## Materials

The plaque stands 5px; the mat and the boards are 3px boards; the ribbon, the nameplate, the track's markers and the buttons are tiles. A board is not a piece, so the button on the codex board keeps its own edge. The record book rules its rows with 2px dashed lines of ink at 15%. An outcome tag is lime for a run that was won, coral for one a rival ended ("Lost to Madame Mittens"), white for one abandoned. The two codex counts are print at 30px.

## The scene

Drawn in the tower's own pixels (`src/components/sprites/scenery.ts`, `src/components/tower/TowerScenery.tsx`) inside the tower's picture, so the camera magnifies it with the tower. The horizon is 34 tower pixels above the tower's ground. The clouds drift left a whole pixel at a time (the far bank every 2 seconds, the near every 1.25) and are still under reduced motion. Nothing readable is set straight on it: every word on home is on the plaque, the ribbon, the mat or a board.

## Sound

The app's press, knock and hover tick, and the `menu` tune from the shell, which carries on into the codex and crossfades with the table's music.

## Unresolved

- The menu and the boards lie over the brightest part of the scene on some windows; legibility holds because all text is on a piece, but how the scene reads behind the boards at each width has not been reviewed here.

- The home ribbon stands 2px (a plain `piece`) where the landing page's stands 3px. DESIGN.md records it as carried, not as a rule.
- The lime ribbon carries a status line, not something the player chose, holds or won. DESIGN.md extends the landing ribbon's named exception to the Lime Is Yours Rule to cover it.
- The wordmark's die-cut treatment sits on the system rounded stack, as on the landing page; the display face is still open.
- The track is left out on a phone on the strength of the tower standing beside the menu. On a phone under 660px tall the tower is small (2px a pixel) and the heading does not run above it.
