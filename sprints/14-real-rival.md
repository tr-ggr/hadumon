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

## Phase 4 — The bot, levels 0 to 4 (done), and Gate A

`src/server/game/bot/` is the rival's mind. Nothing in the app calls it yet.

- `observe(state, me)` builds an `Observation` from a whitelist: the shared table, the bot's own seat in full except the order of its deck, and the other seat's board, tray, food and counts. The cats a seat cannot see are one sorted list per seat. The seed, a deck's order, the other seat's hand and cats tucked face down are never in it. A bot is a function of an `Observation` and an RNG and is never handed the match, so what it cannot see it cannot use.
- `imagine(seen, rng)` deals the unseen cats back out at random and gives the table a seed of its own, so a bot that looks ahead rolls its own dice and not the dice to come.
- A bot's RNG is `createRng(\`${seed}:${step}:bot\`)`. Thinking is capped by a count of moves tried (`STEP_CAP`), never by the clock, so a position always gets the same answer.
- `evaluate(state, me, weights)` is points on the table plus a guess at what the position turns into: the round goal as it stands, food by what it can pay for, cats in hand, the best cat it could play next, and each cat on the board for the turns it still has to work. A rival's style (`styles.ts`) tilts those weights by at most 30% and orders the habits that settle an even choice. Old Nine Lives has no tilt.
- `rivalDecks.ts` builds a rival's deck: its clan's 16 starting cards plus one pick for each match already played, the best cat in the player's unlocked pool at or under that pick's cap, its own clan's first. The caps are the rarity the best of a reward's three cats typically has, measured from `makeOffer`: uncommon, uncommon, rare, rare, rare. (The plan guessed epic for the last; with weights counted per cat the median is rare.) Themes: Alley Tom and the Archivist thorn, the Dockside Twins mist, Madame Mittens flame, the Rooftop Syndicate volt, Old Nine Lives shade.

| Level | Algorithm |
|-------|-----------|
| 0 | A fixed list: play the first cat that can be played; with an empty hand, prowl; with a cat only yarn keeps off the board, go to the Den; otherwise hunt. Declines every choice, never trades, needs no RNG |
| 1 | One step ahead, counting points only; an even choice goes the way level 0 would |
| 2 | One step ahead with the full evaluation; chooses its keep, rerolls a feeder it has no use for |
| 3 | Level 2 with more ways to lay yarn and pay for a trade, averaged over 4 re-deals |
| 4 | Level 3, then the other seat's best reply to its 8 best moves |

### Gate A

`pnpm tsx --conditions=react-server scripts/selfplay.ts` plays the bots against each other on fixed seeds and writes `sprints/data/14-ladder.json`. Every pairing is one deal played twice with the seats swapped, on plain starter decks with no relics. A tie counts as half a win.

| Pairing | Higher level wins | Matches | Mean score |
|---------|-------------------|---------|------------|
| 1 v 0 | 73.5% | 600 | 25.4 to 20.7 |
| 2 v 1 | 74.8% | 600 | 28.6 to 24.1 |
| 2 v 0 | 93.6% | 600 | 29.2 to 19.3 |
| 3 v 2 | 50.7% | 600 | 26.4 to 26.2 |
| 4 v 3 | 48.0% | 300 | 26.8 to 26.6 |
| 4 v 2 | 54.3% | 300 | 26.8 to 26.2 |

The low levels separate: 0, 1 and 2 are three clear steps. Levels 3 and 4 do not clear the 56% bar over level 2: averaging over re-deals and reading one reply buy next to nothing in a game where the seats touch only through the feeder and the goals. Unless phase 5 changes that, 2, 3 and 4 are one level and the level table says so.

The same bot in both seats, level 2 over 600 matches and level 4 over 300:

| | Level 2 | Level 4 |
|-|---------|---------|
| Player's seat wins (leads rounds 1 and 3) | 44.2% | 44.3% |
| Rival's seat wins | 48.3% | 46.3% |
| Tied on points | 7.5% | 9.3% |
| Still tied after most food left | 2.3% | 3.3% |
| Still tied after food, then most cats | 1.0% | 2.0% |

Leading is worth nothing measurable; if anything the seat that moves last in rounds 1 and 3 is a point or two of win rate ahead, inside the noise of these samples.

**The tie rule.** "A tie goes to the rival" would hand it one match in eleven. The rule now in the engine, to be confirmed at Gate C: level on points, the match goes to the seat with more food left in hand (Wingspan's own tiebreak), then to the one with more cats on its board, and a match level on all three, one or two in a hundred, goes to the player. The result carries `tiebreak` (`food`, `cats`, `seat` or `null`).

What a relic is worth to the seat that holds it, level 2 against level 2 on the same 600 deals with and without it:

| Relic | Points | Win rate without | with |
|-------|--------|------------------|------|
| Ember Charm | +3.9 | 47.1% | 68.8% |
| Tide Charm | +4.1 | 53.8% | 78.3% |
| Spark Charm | +4.5 | 49.9% | 76.4% |
| Briar Charm | +3.6 | 44.7% | 66.2% |
| Dusk Charm | +3.2 | 48.0% | 66.3% |
| Warm Saucer | +1.2 | 47.7% | 54.9% |
| Ball of Twine | +1.8 | 47.7% | 60.1% |
| Bent Whisker | +2.0 | 47.7% | 65.3% |
| Night Map | +1.1 | 47.7% | 59.1% |
| Soft Landing | +1.2 | 47.7% | 55.2% |
| Early Riser | +2.0 | 47.7% | 63.2% |
| Lucky Collar | +2.4 | 47.7% | 77.9% |
| Loud Bell (new effect) | +1.0 | 47.7% | 56.2% |
| Hoarder's Basket | +2.4 | 47.7% | 63.1% |
| Quiet Corner | +3.1 | 47.7% | 64.2% |

The clan relic alone is the player's biggest edge: three to four and a half points from the first match, which at equal skill is about twenty points of win rate. The Lucky Collar moves fewer points but takes them off the rival, so it wins as many matches as a charm.

## Phase 5 — Playouts, and the level table that separates (done), and Gate B

Levels 5 to 7 play a position out. A playout deals the unseen cats afresh, makes the move being weighed, and then has `quickMove` choose for both seats to the end of the round or the match. `quickMove` (`bot/quick.ts`) weighs a turn's few kinds of move by rule of thumb straight off the table and tries nothing, so a playout is about twenty in-place steps (`stepDuel`) and no copies. Every move being weighed is played out on the same deals, so luck does not choose between them.

The eight levels as planned did not all separate. One deal played twice with the seats swapped, plain starter decks, a tie half a win:

| Planned pairing | Higher level wins | Matches | Mean score |
|-----------------|-------------------|---------|------------|
| 1 v 0 | 76.9% | 600 | 25.7 to 20.5 |
| 2 v 1 | 73.5% | 600 | 28.6 to 24.0 |
| 3 v 2 | 51.7% | 600 | 26.6 to 26.4 |
| 4 v 3 | 50.0% | 600 | 26.6 to 26.6 |
| 5 v 4 | 64.1% | 600 | 28.3 to 26.2 |
| 6 v 5 | 59.3% | 300 | 28.9 to 27.8 |
| 7 v 6 | 52.5% | 100 | 28.7 to 27.8 |

Three steps fail the 56% bar: averaging over re-deals (3), reading one reply (4), and more playouts scored on wins (7). As planned, that is five levels: 0, 1, 2 to 4, 5, and 6 to 7. The steps that do hold are wide, 74% and 77% at the bottom, which is room for a simpler algorithm in between. So the table was re-spaced with algorithms that are each simpler or stronger than a neighbour, and none is a stronger one made to blunder:

| Level | Algorithm | Moves tried, typical / most | Time, typical / slowest in 20 |
|-------|-----------|-----------------------------|-------------------------------|
| 0 | The fixed list: play the first cat that can be played; with an empty hand, prowl; with a cat only yarn keeps off the board, go to the Den; otherwise hunt. Declines every choice, never trades | 0 | under 0.1 ms |
| 1 | The same list with care: its best cat first, the dice its hand needs, the cheapest cats kept, the cat worth least tucked | 0 | under 0.1 ms |
| 2 | One step ahead, counting points only | 18 / 139 | 0.2 / 0.8 ms |
| 3 | One step ahead, counting points and the round goal | 16 / 139 | 0.2 / 1.4 ms |
| 4 | One step ahead with the full evaluation | 16 / 141 | 0.3 / 1.0 ms |
| 5 | Its 3 best moves, each played out twice to the end of the round | 70 / 278 | 0.9 / 2.2 ms |
| 6 | Its 6 best moves, each played out 6 times to the end of the match | 442 / 993 | 4.4 / 7.6 ms |
| 7 | Its 8 best moves and 256 playouts to the end of the match, the worse half dropped twice | 3100 / 6832 | 28 / 51 ms |

| Pairing | Higher level wins | Matches | Mean score |
|---------|-------------------|---------|------------|
| 1 v 0 | 64.7% | 600 | 22.3 to 19.8 |
| 2 v 1 | 66.2% | 600 | 25.1 to 22.4 |
| 3 v 2 | 63.8% | 600 | 27.2 to 24.5 |
| 4 v 3 | 60.8% | 600 | 26.8 to 25.0 |
| 5 v 4 | 61.8% | 600 | 27.6 to 26.0 |
| 6 v 5 | 60.5% | 300 | 28.7 to 26.9 |
| 7 v 6 | 52.5% | 100 | 29.0 to 28.5 |
| 2 v 0 | 73.3% | 600 | 25.1 to 20.5 |
| 3 v 1 | 80.6% | 600 | 27.4 to 21.8 |
| 4 v 2 | 74.0% | 600 | 28.6 to 23.9 |
| 5 v 3 | 70.2% | 600 | 27.7 to 24.5 |
| 6 v 4 | 66.0% | 300 | 28.8 to 25.9 |
| 7 v 5 | 66.5% | 100 | 28.9 to 26.9 |

Levels 0 to 6 are seven clear steps, each winning 60 to 66 matches in 100 against the one below. Level 7 over 6 is the weak one: 52.5% in this run of 100 and 56.2% in an earlier one of 300, about 55% over the 400 together, a hair under the bar. More playouts, scoring on wins, and a sharper first reply inside the playout were each tried and none moved it; with this rule of thumb inside the playout, level 6 is close to the ceiling. `LEVELS` in `bot/levels.ts` is the table in use; `PLANNED` is kept beside it so the first table can be measured again.

**Gate B.** `pnpm tsx --conditions=react-server scripts/bench-bot.ts` answers every position of twelve matches at each level. The slowest level answers in 28 ms typically, 51 ms for the slowest answer in twenty and 56 ms at worst on this machine, inside the 60 ms budget. No level reached its cap of moves, so no answer was cut short. A player's action comes back with one rival turn and sometimes two (the rival closes one round and opens the next), so the worst request thinks for about a tenth of a second.

## Phase 6 — The gauntlet, measured, and Gate C

`playGauntlet` (`bot/arena.ts`) is a whole run with a bot in the player's seat: the six rivals in order, each on its own deck with no relics, at the level `match index + tier rank`; the stand-in holds its clan's relic, and after a win takes the rarest cat offered and the first relic. `bot/gauntlet.test.ts` holds the bounds the old `sim.test.ts` held for the scripted rival.

Each cell is: wins the first match / matches won per run / runs won. 150 runs a cell (100 for level 6, 38 for level 7), an account with everything unlocked:

| Stand-in player | Kitten | Stray | Apex |
|-----------------|--------|-------|------|
| 0 fixed list | 73% / 1.7 / 1% | 59% / 1.0 / 0% | 49% / 0.8 / 0% |
| 1 careful list | 88% / 2.7 / 15% | 75% / 1.7 / 3% | 62% / 1.3 / 3% |
| 2 points | 80% / 2.7 / 13% | 73% / 1.9 / 6% | 67% / 1.6 / 3% |
| 3 points and goal | 96% / 3.9 / 33% | 89% / 3.0 / 18% | 81% / 2.6 / 13% |
| 4 full evaluation | 97% / 4.8 / 58% | 95% / 4.2 / 47% | 91% / 3.8 / 41% |
| 5 playouts, round | 99% / 5.5 / 82% | 97% / 4.9 / 63% | 96% / 4.5 / 52% |
| 6 playouts, match | 100% / 5.7 / 89% | 99% / 5.5 / 85% | 97% / 5.3 / 81% |
| 7 more playouts | 100% / 5.9 / 95% | 100% / 5.7 / 87% | 100% / 5.7 / 90% |

A new account (starting cats and relics only):

| Stand-in player | Kitten | Stray | Apex |
|-----------------|--------|-------|------|
| 0 fixed list | 73% / 1.7 / 2% | 59% / 1.0 / 1% | 49% / 0.8 / 0% |
| 2 points | 80% / 2.5 / 10% | 73% / 1.9 / 5% | 67% / 1.6 / 4% |
| 4 full evaluation | 97% / 4.6 / 53% | 95% / 4.0 / 39% | 91% / 3.5 / 33% |
| 6 playouts, match | 100% / 5.7 / 89% | 99% / 5.8 / 92% | 97% / 5.0 / 73% |

What this says:

- The tiers work on the rival's play alone: every stand-in wins fewer runs on each harder tier, and the first match of a tier is a level table's step harder, not a head start.
- Thinking is rewarded steeply. On Kitten a fixed list wins 1 run in 100, counting points 13, the full evaluation 58, playouts 89.
- It is a much easier game than the one it replaces. Against the scripted rival the one-step bot of `sim.ts`, which plays about like level 4, wins 2% of Kitten runs and none on Apex. Here level 4 wins 58% and 41%.
- The reason is the relics. A stand-in that reaches the last match holds four of them, worth about ten points, and the best rival there is, on its 21 cards and no relics, is two or three points better than a level 4 player. Skill within the thinking budget cannot buy those points back.

The same runs under rules the game does not have, runs won on Kitten / Stray / Apex:

| Stand-in player | As built | Every rival two levels up | Rival holds its clan's charm | Rival holds relics on the player's budget |
|-----------------|----------|---------------------------|------------------------------|-------------------------------------------|
| 2 points | 13% / 6% / 3% | 3% / 2% / 0% | 2% / 1% / 1% | 0% / 0% / 0% |
| 4 full evaluation | 58% / 47% / 41% | 42% / 21% / 21% | 18% / 11% / 8% | 2% / 0% / 0% |
| 6 playouts, match | 89% / 85% / 81% | 84% / 63% / 52% | 61% / 53% / 44% | 24% / 4% / 5% |

Two levels up squeezes the tiers together, because the table has no levels above 7 to give. A rival with relics on the player's whole budget is about as hard as the scripted rival was. A rival with only its clan's charm sits between: each side starts with one relic, and the three more the player picks up are the reward for winning.

The two unlocks that ask for a score (35 for Verdantmane and the Hoarder's Basket, 42 for Infernomane) were set for the old game, where the one-step bot reached 35 in 38% of Kitten runs and 42 in 2%. A run's best match, new account on Kitten:

| Stand-in player | Median best | Reaches 35 | 40 | 42 | 45 |
|-----------------|-------------|------------|----|----|----|
| 2 points | 34 | 41% | 4% | 2% | 0% |
| 4 full evaluation | 38 | 89% | 31% | 15% | 2% |
| 6 playouts, match | 41 | 99% | 75% | 43% | 10% |

To ask of a level 4 player what 35 and 42 asked of the one-step bot, the thresholds would be 40 and 45. They are left alone until the difficulty is settled, since that moves the scores.

How long a turn takes to watch, with the rival's turn played back as a real one at today's pacing (440 ms for a move, 380 ms a power and quickening, 760 ms for a goal): 1.3 s for the middle answer and 2.8 s for the slowest in ten, of which the rival's part is 0.4 s and 1.3 s. That is inside the 2.5 s line set for the median.

**Open at Gate C**, for the user to decide before phase 7 switches the game over:

1. The level table: the re-spaced eight (seven clear steps and a marginal eighth), or the planned one (five steps).
2. The difficulty: as built, or with the rival holding its clan's charm, or relics on the player's budget.
3. The tie rule: food left, then cats, then the player.
4. The score unlocks: 40 and 45 in place of 35 and 42, once the difficulty is fixed.

## Gate C — decided

1. **The level table** is the re-spaced eight.
2. **The rival holds its clan's charm**, as the player holds theirs, and no other relic. Each side starts with one; the three more a player picks up are the reward for winning. This replaces "no relics" in the decisions at the top.
3. **A tie** goes to the seat with more food left, then to the one with more cats, then to the player.
4. **The score unlocks** were measured again under these rules (below) and are 38 and 45.

## Phase 7 — The switch (done)

The two-seat game is the game. `MatchState`, `createMatch`, `applyAction`, `stepMatch`, `legalActions`, `goalStanding`, `sideScore` and `MatchEvent` are the names the `Duel` ones took; the scripted rival is gone.

Deleted: `rivalTurn`, `RivalState`, `rivalScore`, `rivalBankValue`, the flat `MatchState`, the `rival` event, `RivalAction`, every goal's `par`, the rival's `bankPoints`, `stashYarn`, `raidDice`, `burnCards`, `goalEdge` and action deck, the mods `rivalBankDelta` and `rivalStartYarn`, a tier's `mods`, and `sim.ts` with its test.

- **Cards.** A "between turns" power names the turn of the rival's it answers: `on: "hunt" | "den" | "prowl" | "any"`. Brumefang answers a Hunt, Gloomtail the Den, Shadewhisker a Prowl, Nyxaroth every turn. The card text says so ("when the rival hunts", "after each of the rival's turns").
- **The Loud Bell** keeps its id: "Whenever the feeder is refilled, gain 1 Treat."
- **Tiers** (`difficulty.ts`) are a rank and a line of text and nothing else. `rivalLevel(matchIndex, tier)` is the level a rival plays at; the text prints it counted from 1 ("Rivals play at levels 3 to 8 of 8. Nobody gets a head start.").
- **Rivals** (`rival.ts`) are a name, a boss mark, a clan (`theme`), a manner (`trait`) and a line of flavor. `rivalDecks.ts` builds the deck and `rivalRelics` hands it its charm.
- **A run** (`run.ts`) deals each match with `openMatch`, so the rival has kept by the time the player sees the table, and answers every action with `advance`. Clans moved to `clans.ts`; `run.ts` still exports them.
- **A stored run carries `v: 2`.** One saved by an older game cannot be read. `run.current` and `run.start` close it as abandoned (`retireRun`), with the unlocks its won matches earned, which is what abandoning it did; the account lands on a clean start. No migration.
- **The view** (`view.ts`) lays the player's seat flat, as before, and adds `lead`. `rival` is the rival's seat as it shows across the table: `level`, `board` (tucked cats counted, not named), `tray`, `essence`, `relics`, `handCount`, `deckCount`, `discardCount`, `turnsLeft`, `score` (a full `ScoreBreakdown`) and `last` (its last whole turn). `result.rival` is a `ScoreBreakdown` too, and `result.tiebreak` says what settled a level match.
- **`run.act`** returns `beats` beside `events`: the rival's seat and the feeder after each of the rival's actions, in order. An action's events start with its `move`, so the two line up.
- **Playback.** The player's own move is rebuilt frame by frame as before. Each action of the rival's is one frame: its seat from the beat, the dice it took gone from the feeder, its move in words, and the lines for whatever its cats did landing with it. A goal's points reach both sides on the goal's own frame.
- **The table.** The rival's panel shows its hand and deck as piles, cats out, turns left, yarn, goal points, food and its last move, and opens `RivalMat`: its three lanes with every cat and what each holds, its tray, food and relic, its hand face down. The scorepad and the result sheet print both sides line for line. The nameplate prints the tier and the level. The codex's rival cards print the level on each tier, the deck and the charm.

`src/server/game/solo.ts` is a test helper: one seat laid flat at a table whose other seat never has a turn. The rules of a single turn are tested there (`match.test.ts`, `trade.test.ts`) and what two seats do to each other in `duel.test.ts`.

### The gauntlet as it ships

Wins the first match / matches won per run / runs won. 200 runs a cell (133 for level 6, 50 for level 7), everything unlocked:

| Stand-in player | Kitten | Stray | Apex |
|-----------------|--------|-------|------|
| 0 fixed list | 42% / 0.8 / 0% | 40% / 0.5 / 0% | 34% / 0.4 / 0% |
| 1 careful list | 61% / 1.2 / 2% | 46% / 0.8 / 2% | 38% / 0.5 / 0% |
| 2 points | 61% / 1.4 / 2% | 55% / 1.0 / 1% | 52% / 0.8 / 1% |
| 3 points and goal | 78% / 2.2 / 8% | 72% / 1.6 / 3% | 67% / 1.4 / 0% |
| 4 full evaluation | 89% / 2.9 / 14% | 87% / 2.4 / 10% | 73% / 2.0 / 7% |
| 5 playouts, round | 95% / 4.2 / 44% | 88% / 3.4 / 31% | 89% / 2.9 / 14% |
| 6 playouts, match | 92% / 4.5 / 61% | 96% / 4.5 / 52% | 90% / 4.2 / 46% |
| 7 more playouts | 100% / 5.4 / 73% | 100% / 5.1 / 63% | 100% / 4.1 / 40% |

A new account:

| Stand-in player | Kitten | Stray | Apex |
|-----------------|--------|-------|------|
| 0 fixed list | 42% / 0.7 / 0% | 40% / 0.5 / 0% | 34% / 0.4 / 0% |
| 2 points | 61% / 1.4 / 0% | 55% / 1.0 / 1% | 52% / 0.9 / 0% |
| 4 full evaluation | 89% / 2.9 / 15% | 87% / 2.5 / 11% | 73% / 1.8 / 5% |
| 6 playouts, match | 92% / 4.5 / 57% | 96% / 4.4 / 51% | 90% / 3.5 / 33% |

A run's best match, new account on Kitten, which is what the score unlocks were set from. The old one-step bot reached the old 35 in 38% of runs and the old 42 in 2%; a level 4 player now reaches 38 in 39% and 45 in 2%.

| Stand-in player | Median best | Reaches 35 | 38 | 40 | 42 | 45 |
|-----------------|-------------|------------|----|----|----|----|
| 2 points | 31 | 33% | 12% | 1% | 1% | 0% |
| 4 full evaluation | 37 | 71% | 39% | 15% | 8% | 2% |
| 6 playouts, match | 41 | 91% | 84% | 66% | 49% | 8% |

Checked in the browser on a new account: a run starts on the tier text above, the rival has kept before the keep screen, a played cat is answered by the rival's own turn in the log and on its panel, the Hunt's trade arms from a hand card and takes one die more, the rival's board opens and shows its cats, tray, food and charm, and a match runs to its result sheet with both score sheets.
