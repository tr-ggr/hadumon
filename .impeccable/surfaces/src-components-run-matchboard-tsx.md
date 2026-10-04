---
version: 1
slug: "src-components-run-matchboard-tsx"
primary_target: "src/components/run/MatchBoard.tsx"
related_targets: ["src/app/run/RunView.tsx","src/components/run/ClanPick.tsx","src/components/run/SetupKeep.tsx","src/components/run/MatchResult.tsx","src/components/run/RewardPick.tsx","src/components/run/RunSummary.tsx"]
---

# Match table — surface brief

Scope: `/run`, every screen of a run (clan pick, opening hand, the match, match result, reward pick, run summary). Visitor mode: Operate. Audience: roguelike and engine-builder players, many of whom know Wingspan. Job: read the whole table at a glance, take one action a turn, and see the engine fire. Every number printed on the board comes from `src/server/game/*`. Home, codex, login and landing are out of scope and must not change.

## Direction contract

THESIS: The match is a table you sit at, not a dashboard you read: rival across, supply between, your mat near you, hand at the edge. It refuses stacked white panels.

OWN-WORLD: Die-cut cardboard on a woven cream cloth. Ink-outlined pieces with a chipboard edge straight down and an unblurred cast shadow; one sky mat with printed lanes; counts as tokens; pixel print face.

STORY: Read the lanes' printed rewards, play a cat, activate a lane, watch it fire, see the rival answer.

FIRST VIEWPORT: At 1440x900, no scroll: rival strip top, supply tray, round tiles, three lanes filling the centre, scorepad right, hand docked at the bottom with the prompt and one confirm.

FORM: Whole table, user-pinned over the roll; seed b97818a6. Code-led by the approved plan: no image generation in this harness.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Build path

`.impeccable/config.json` records comp-led. No comp round ran. The plan the user approved before the build says so in these words: "`.impeccable/config.json` says comp-led, but this harness has no image generation, so the build is code-led, as the landing page was." That approval is the downgrade; the user was told again at hand-off. The seed is the one `concept-seed --scope surface --mode operate` printed.

## Signature interaction

The firing chain. A played card lifts from the hand and lands in its space; taken dice travel to the essence tokens; each cat in the lane fires right to left (tile presses, lights lime, its line lands in the log, its counters settle); then the rival's card flips and flashes coral. About 380ms a step, pixel-stepped easing. Any click or key skips to the end; reduced motion lands everything at once. The last frame is always the server's view.

## Motion grammar

Stepped, never eased smooth: `steps()` timing on lifts, presses, flips and die rolls. Lifted is raised 4px, pressed sinks 2px. Nothing blurs, nothing fades in on load.

## Materials

Three heights: printed (0), token or tile (2px edge), card (3px edge). Two added shades only: chipboard edge and deep sky. No diagonal offset shadow, no blur, no gradient. Lime is the player's, coral the rival's; a piece of the player's that is waiting on an answer takes a cobalt frame with a lime inner line, never coral. Actions on the table are pieces too (cobalt for the one confirm, cream for the rest), not pills.

## Decided during the build

- The pixel face is Jersey 20, set at 20px and 30px. Pixelify Sans, named in the plan, drew "5" as "S" and "C" as "O".
- A lane's reward ladder is printed inside the spaces: each space shows what the lane gives while that space is the next free one, and the lime marker sits on it. The full-lane step is in the end cap. The lane's name is on its activate tile.

## Keys

`1-9` pick a hand card, `H` `D` `P` activate a lane, `Enter` confirm, `Esc` back.

## Unresolved

- Drag-and-drop and habitat scenery are deferred.
- The die-cut material is scoped to `.tabletop`; home, codex and landing keep the flat piece.
