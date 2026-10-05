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

## Phase 2 — Seats (done)

A refactor of `match.ts` with no change in behaviour: the same seeds play the same 800 simulated runs to the same results, and no test changed.

- `Side` is everything one seat owns: board, hand, deck, discard, tray, setup, food, relics, mods and turns left. `Table` is what seats share: phase, round, feeder, goals, goal results, the power queue and the pending choice.
- The match against the scripted rival is still one flat object. `MatchState extends Side, Table`, so it is its own seat and its own table, and every stored run reads as before.
- The turn pieces (`keep`, `play`, `hunt`, `den`, `prowl`, `resolve`, `firePower`, `drain`, `fireAuras`, `drawCard`, `refillTray`) take a context of one table and one seat and send their events through it. None of them knows who else is sitting at the table.
- The queries take a seat: `rowReward(side, row)`, `canPlay(side, hand, row)`, `prowlPickCount(side)`, `autoYarnTargets(side, n)`, `spareFood(side)`, and a goal's `count(side)`. `tradeOffered(side, feeder, row)` is the trade test without the phase; `canTrade(state, row)` adds it. `seatActions(table, side)` lists a seat's actions and `legalActions(state)` calls it.

## Phase 3 — Two seats (done)

The two-seat game is built beside the scripted rival and nothing plays it yet but tests. Its names carry `Duel` until phase 7, when it takes over `MatchState`, `createMatch` and `applyAction`.

- `DuelState` is a `Table` plus `v: 2`, `seed`, `step`, `rivalId`, `level`, `sides: { player, rival }`, `active` (whose action is awaited), `lead` (who opens the round) and `last` (each seat's last whole turn). `createDuel(config)` deals each seat from its own RNG stream, so one deck never moves the other's deal.
- `applyDuel(state, action)` applies one action for `state.active` and knows nothing of who chose it. `stepDuel(state, action, events)` is the same thing in place, for a caller that owns the state. `duelActions(state)`, `duelStanding(state)` and `duelScore(state, who)` are the queries.
- Setup: the rival keeps first, then the player, so it cannot answer what the player keeps.
- Turns: the seats alternate, the round's leader first, 5, 4 and 3 turns each, 24 in a match. The lead changes hands every round and the player leads the first. A seat with a turn to spare (Early Riser) takes it once the other is done. A free reroll and a pending choice do not pass the turn.
- The feeder and the goals are shared. Each seat has its own deck, tray, hand, food and board.
- Reactions: once a seat's turn is finished, the other seat's "between turns" cats answer the kind of turn it was. Brumefang answers a Hunt, Gloomtail the Den, Shadewhisker a Prowl, Nyxaroth any turn, a played cat included. The cards still say raid, bank and burn; `reactsTo` maps them until phase 7 rewrites the cards.
- Goals compare both sides' real counts. A side with nothing towards a goal scores nothing, whichever side it is; a tie splits. The Lucky Collar counts for its holder.
- End of round: end-of-round powers fire on both boards, the leader's first.
- Score: both boards are scored by `scoreBoard`, which now takes whose share of the goal points to count. For now the player wins on strictly more; the tie rule is decided at Gate A.
- Relics belong to a seat. Hadu's treat follows his own seat's turns. The Loud Bell's new effect is the mod `refillTreat`: 1 Treat whenever the feeder is rolled again, whoever emptied it. Against the scripted rival the bell still does what it did.
- Events carry `side`. A new `move` event says what a seat did as far as the other may see: cats drawn from the deck and a cat tucked from hand stay face down. `refill` is the bell paying out.
- `duel.ts` is the driver: `openMatch(config, policy)` deals and has the rival keep; `advance(state, action, policy)` applies the player's action and then every rival action until the player is to act, so one request is still one list of events.

Tests: `symmetry.test.ts` plays 30 random matches and checks at every step that swapping the seats mirrors the next state and its events; `duel.test.ts` covers the rules above and finishes 72 random matches across the six rivals, every listed action accepted.
