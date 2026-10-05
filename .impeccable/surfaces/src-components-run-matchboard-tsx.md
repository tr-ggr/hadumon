---
version: 1
slug: "src-components-run-matchboard-tsx"
primary_target: "src/components/run/MatchBoard.tsx"
related_targets: ["src/app/run/RunView.tsx","src/components/run/RunStart.tsx","src/components/run/ChestScene.tsx","src/components/run/SetupKeep.tsx","src/components/run/MatchResult.tsx","src/components/run/RewardPick.tsx","src/components/run/RunSummary.tsx"]
---

# Match table — surface brief

Scope: `/run`, every screen of a run (the run's start, the chest, opening hand, the match, match result, reward pick, the climb between matches, run summary). Visitor mode: Operate. Audience: roguelike and engine-builder players, many of whom know Wingspan. Job: read the whole table at a glance, take one action a turn, and see the engine fire. Every number printed on the board comes from `src/server/game/*`. Home, codex, login and landing are out of scope and must not change.

## Direction contract

THESIS: The match is a table you sit at, not a dashboard you read: the rival and the rounds down a rail on your left, the supply and your mat on the cloth, your hand fanned along the near edge. It refuses stacked white panels, and it refuses an app shell around the game.

OWN-WORLD: Die-cut cardboard on a woven cream cloth. Ink-outlined pieces with a chipboard edge straight down and an unblurred cast shadow; one sky mat with printed lanes; counts as tokens; pixel print face.

STORY: Read the lanes' printed rewards, play a cat, activate a lane, watch it fire, see the rival answer.

FIRST VIEWPORT: At 1440x900, and at any window from 1024x600, no scroll and no navbar: a white rail down the left with the gauntlet, the rival and the three round tiles above an ink line, and under it both scores, the food, the prompt and one confirm; the supply tray and three lanes filling the centre; the score sheet, relics and log in a slim column on the right under three corner buttons (Home, Codex, Log out); the hand fanned along the bottom edge, leaning, its lower part under the edge of the screen.

FORM: Whole table, user-pinned over the roll; seed b97818a6. Code-led by the approved plan: no image generation in this harness.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Build path

`.impeccable/config.json` records comp-led. No comp round ran. The plan the user approved before the build says so in these words: "`.impeccable/config.json` says comp-led, but this harness has no image generation, so the build is code-led, as the landing page was." That approval is the downgrade; the user was told again at hand-off. The seed is the one `concept-seed --scope surface --mode operate` printed.

## The mat

The mat is laid out after the mat of base-game Wingspan (`src/components/mat/`). A strip along its top reads "Play a cat" and carries a cost tab over each column (the yarn a cat costs there, or "Free"), so no space prints a cost. Each lane is printed with its habitat as pixel scenery (`sprites/habitats.ts`): a garden for the Hunt, a room for the Den, the rooftops at night for the Prowl. A lane is its cobalt tile with an ink banner under it ("Then fire this row's powers, right to left"), four spaces, and its end. An empty space is a cream outline with the scenery through it, printing the lane's mark, the reward as icons, and on the second and fourth spaces the trade as pay, arrow, gain. Four columns, not Wingspan's five: `SLOTS`, the column costs and the reward ladders are the engine's.

## Layout by window

The window's size alone picks one of four (`run/layout.ts`, and the `fit-wide`, `fit-compact` and `turn-phone` variants in `globals.css`).

- From 1024 by 600px (`fit-wide`): one screen, no scroll. Rail (19.5rem), table, and from 1280px the right column (16rem). The mat takes the height the supply (176px) and the hand's strip leave, up to 544px. From 1024 to 1279px a 40px bar over the mat stands in for the right column: "Scores and log" and the newest log line.
- A short screen beside the rail (under 848px tall from 1280px wide, under 912px from 1024px): the hand takes the phone's smaller card and the mat stands above the supply, so a raised card stands over the supply and never a lane.
- A window on its side, 720px wide or more and under 600px tall (`fit-compact`), which is a phone turned: supply column, mat, turn column, over a 56px strip of hand and a "Round N, More" button. The chosen card stands whole over the supply column.
- A phone held upright that would fit turned is asked to turn (`TurnPhone`), and may play upright instead.
- Anything else scrolls: one column under 1024px (run strip beside the corner buttons, rival, round, mat, supply, score sheet, relics, log) and a white dock at the bottom holding the prompt, actions, food and score, then the fan. From 640px the dock sets the turn beside the fan.

## Signature interaction

The firing chain. A played card lifts from the hand and lands in its space; taken dice travel to the food tokens; each cat in the lane fires right to left (tile presses, lights lime, its line lands in the log, its counters settle); then the rival's card flips and flashes coral. About 380ms a step, pixel-stepped easing. Any click or key skips to the end; reduced motion lands everything at once. The last frame is always the server's view.

## Motion grammar

Stepped, never eased smooth: `steps()` timing on lifts, presses, flips and die rolls. Lifted is raised 4px, pressed sinks 2px. Nothing blurs, nothing fades in on load.

## Materials

Three heights: printed (0), token or tile (2px edge), card (3px edge). Two added shades only: chipboard edge and deep sky. No diagonal offset shadow, no blur, no gradient. Lime is the player's, coral the rival's; a piece of the player's that is waiting on an answer takes a cobalt frame with a lime inner line, never coral. Actions on the table are pieces too (cobalt for the one confirm, cream for the rest), not pills.

## Decided during the build

- The pixel face is Jersey 20, set at 20px and 30px. Pixelify Sans, named in the plan, drew "5" as "S" and "C" as "O".
- A lane's reward ladder is printed inside the spaces: each space shows what the lane gives while that space is the next free one, and the lime marker sits on it. The full-lane step is in the end cap. The lane's name is on its activate tile.

- Cats cost cat food (Beef, Fish, Chicken, Dry food, Pork, and a Treat that pays for anything), each drawn as its own pixel icon with no square around it.
- Any 2 food pay for 1 a cat lacks. The player picks the two on the food tokens in the rail (the dock on a narrow table); the lanes only open for the play once the swap is whole. The rule is printed under the tokens.
- `/run` has no app shell. Three 40px cream pieces in the top right corner of every run screen go Home, to the Codex, and to Log out behind its confirm.
- The hand is a fan. `fanLayout` gives each card its place, a lean of at most 9 degrees and a drop of at most 28px; at rest the lower part of a card is under the screen edge. Hover, keyboard focus or being chosen stands a card upright and whole, over the others, in 160ms of 4 steps. Neighbours never move.
- Only the strip of a card its neighbour leaves showing takes the pointer, so sweeping along the fan raises one card after another. Info sits at the bottom left of the card, inside that strip.
- The hand face of a cat card is portrait. The points tag, the cost and the yarn capacity mark stand in its first 32px, the sprite beside them, the name under both: a neighbour may cut the sprite and the name, never the three numbers. A card that cannot be played now is washed with cream at 34% (text stays above 4.5:1), not made see-through, and its footer says what it lacks.
- On a phone a strip is never thinner than 44px: a big hand runs off the side and is panned, and the dock grows to hold the chosen card whole.
- In the rail the turn block reads score, food, prompt, confirm, so the prompt and its confirm are level with the hand. Its prompt and action rows keep reserved heights; on a screen under 848px tall only one action row is reserved. In the rail a lane button says only the lane ("Hunt"); the lane's own "Play here" space prints the cost.
- A cat's element is on every piece of it: a 4px edge in the element's hue down the left of its card and its placed tile, and its 16px element mark leading the name on a card, in the top left corner of a placed tile, and after the sprite on a deck chip. On a hand card the mark and the edge are inside the 32px strip. The chosen and due frames are drawn over the bands. On a phone the placed tile is too narrow to keep the mark clear of the sprite, so the mark has a 2px cream rim.
- A relic tile leads with the relic's own drawing: 16x16 pixels at 32px, one drawing each. A charm is a pendant holding its element's mark in the element's hue; the four relics that work on a lane are lime; the rest are white.
- A placed cat and a compact cat card lay out by their own width, so a name is never truncated to a letter or two: sprite over name on a narrow tile, name on its own line on a narrow card.
- Bringing a zone into view is a cut, not a smooth scroll.
- Every die keeps two lines for its name, so the dice in a row are one shape.
- A placed cat's dialog lists the cats tucked under it, face up, wherever they came from.
- A run is climbed. Between matches the whole run is shown as a grey ribbed tower, a floor per match, with Hadu on a ledge and a coral rival sprite at every window still to be passed. It plays at three points: walking in when a run starts, going up a floor once a reward is confirmed, and reaching the roof when the last match is won. It asks for nothing, rests 1.4 seconds on its last frame and moves on; any click or key leaves in one press. A loss does not climb.
- The climb is held on the client only (`useRunController`), beside the last turn's playback, so a reload lands on the screen the run is really on. It is stepped from `RunView`, which outlives it, so the press that skips is swallowed and never reaches the next screen.
- The tower and the three lanes' habitats are the scenery, and grey is the tower's colour alone. It is pixel rows at the sprites' own pixel size, with windows cut as holes so a rival behind one is clipped to its shape. Hadu is the climber for every clan.

## Keys

`1-9` pick a hand card, `H` `D` `P` activate a lane, `Enter` confirm, `Esc` back.

## Unresolved

- Drag-and-drop on the match table is deferred.
- The portrait prompt, the full-screen turn on Android and the usable width on iPhone Safari in landscape have been checked in an emulated phone, not on a real one.
- Rival sprites are on the tower and in the codex so far: the nameplate and the landing page's rival fan still name a rival without drawing it. The codex draws it at 48px on its card.
- The die-cut material is no longer scoped to the run. `.tabletop` is on the body, so home, the codex, sign-in, the landing page and every dialog are cardboard too; `TableSurface` is a tabletop of its own inside it, for the fit and the effects layer.
