# Sprint 14 — A real rival

Read `sprints/08-roguelike-overview.md` and `sprints/10-engine.md` first. This file records a rebuild in nine phases and is added to as each one lands. Until phase 7 the scripted rival of sprint 10 is still the one a run plays.

## Why

The rival did not play the game. It was a shuffled deck of ten action cards and three score counters, it never looked at the player, and it got harder only by numbers: a head start on Stray and Apex, bigger bank values, a hidden edge on every goal, and goal tallies read from a `par` table. The aim is a game of pure skill: the rival gets a real board and the same rules, every free point goes, and the only thing that rises is how well it plays.

## Decisions

| Question | Decision |
|----------|----------|
| How far the AI goes | The rival plays a real board: its own cats, hand, deck, food and three rows |
| Rival stats | Flattened. No bank value, stash, raid, burn, goal edge, action deck or tier head start |
| Rival deck | Its own themed deck on the same budget as a run deck at that match; no relics |
| Escalation | Skill level = match index (0–5) + tier rank (0–2), so eight levels |
| Luck | Kept, but the feeder is shared by both sides |
| Rival board | The player can open the rival's full board during a match |
| Trade spots | Added to all three rows, for both sides (the Wingspan mat) |
| What the bot sees | Public information only: never the player's hand, either deck's order, or dice not yet rolled |
| Goals | Both sides' real counts are compared; `par` goes |

## Phase 1 — Trade spots (done)

A row that holds exactly 1 or 3 cats offers one optional trade when it is activated, on top of its reward.

| Row | Pay | Get |
|-----|-----|-----|
| Hunt | discard 1 cat from hand | 1 extra die |
| Den | spend 1 food | 1 extra yarn |
| Prowl | spend 1 yarn from a cat you pick | 1 extra cat |

- A trade rides on the row's own action as `trade` (see the actions table in `sprints/10-engine.md`); there is no separate action and no new event.
- It is refused unless the extra can be taken: the feeder must hold a die beyond the reward, the board must have room for the extra yarn, and the tray, deck and discard together must hold a cat beyond the reward. A Den trade must lay every yarn it buys.
- `canTrade(state, row)` is the one test, and the view carries it as `trades`.
- `legalActions` lists a Hunt trade for each different cat that could be discarded. The Den's and the Prowl's are listed with one way to pay (`spareFood`, `richestSlot`); any other food held, or any other cat holding yarn, is also legal.
- On the table a trade is paid by tapping what pays for it while the lane is being chosen: a hand card during a Hunt, a food during a Den, a cat on the mat during a Prowl. Tapping it again takes the trade back. These are working controls and no more; phase 8 gives the trade spots their place on the mat.

The scripted rival was re-measured with trades in the game, 200 runs of each bot on the seeds `sim.test.ts` uses. The one-step bot seldom takes a trade, so little moved and the test's bounds stand as they were.

| Bot, tier | Wins match 1, before | after | Matches won per run, before | after |
|-----------|----------------------|-------|-----------------------------|-------|
| One-step, Kitten | 93.0% | 91.0% | 2.41 | 2.27 |
| One-step, Stray | 84.5% | 86.0% | 1.76 | 1.83 |
| One-step, Apex | 74.5% | 75.0% | 1.31 | 1.33 |
| Random, Kitten | 10.0% | 6.0% | 0.10 | 0.06 |
