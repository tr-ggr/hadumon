# Sprint 10 — Engine and API (done; brought up to date by sprint 14)

The match and run engine and its API are built. This file is the reference the UI sprints code against. The source files are the truth; read them when a signature here is not enough.

## Engine: `src/server/game/`

Everything is pure, deterministic, and safe to import in client components.

| File | What it gives you |
|------|-------------------|
| `cats.ts` | `CATS`, `CAT_LIST`, `getCat(id)`, `Cat`, `Row`, `ROWS`, `ROW_LABELS`, `CostPip`, `RARITY_LABELS`, `describePower(power)` (the rules text for a card), `Aura` and `describeAura(aura)` (a legendary's relic), `playCost(catId, discount)` (the cost with a legendary's discount taken off) |
| `elements.ts` | `ELEMENTS`, `Element`, `ELEMENT_LABELS`, `FOOD_LABELS` (the cat food each element eats; the player-facing name for essence), `TREAT_LABEL` (wild) |
| `match.ts` | The two-seat match. Types: `MatchState` (`v: 2`, a `Table` plus `sides: { player, rival }`, `active`, `lead`, `last`, `level`), `Side` (what one seat owns), `Table` (what seats share), `SideId`, `Action`, `MatchEvent`, `Move` (what a seat did, as far as the other may see), `MatchResult` (`player` and `rival` as `ScoreBreakdown`, `won`, `tiebreak`), `Essence`, `PlacedCat`, `SlotRef`, `Pending`, `GoalResult`, `ScoreBreakdown`. Reducer: `createMatch(config)`, `applyAction(state, action)` (one action for `state.active`), `stepMatch` (the same in place), `legalActions(state)`, `seatActions(table, side)`. Queries on a seat: `rowReward(side, row)`, `canPlay(side, hand, row)`, `prowlPickCount(side)`, `autoYarnTargets(side, n)`, `tradeOffered(side, feeder, row)`, `spareFood(side)`, `richestSlot(board)`, `boardYarnRoom(board)`; on a match: `goalStanding(state)`, `sideScore(state, who)`, `scoreBoard(board, goalResults, relicIds, who)`. Payment: `swapOffer(pool, cost)`, `playPayment(pool, hand, index, swap, discount)`, `defaultSwap(pool, hand, index, discount)`, `auraTotal(board, kind)`. Constants: `SLOTS` (4), `TRADE_CATS` ([1,3]), `ROUND_TURNS` ([5,4,3]), `SETUP_KEEP` (5), `COLUMN_YARN_COST`, `GOAL_WIN_POINTS`, `GOAL_LOSE_POINTS` |
| `duel.ts` | The driver. `openMatch(config, policy)` deals and has the rival keep; `advance(state, action, policy)` applies the player's action and every rival action after it, and returns `{ state, events, trail }` (`trail` is the match after each action applied) |
| `bot/` | The rival's mind: `observe(state, me)` and `imagine(seen, rng)` (`observe.ts`), `evaluate` (`eval.ts`), `LEVELS` and `botAt(level, style)` (`levels.ts`), `STYLES` (`styles.ts`), `rivalPolicy` and `standIn(level)` (`index.ts`), `playMatch`, `faceOff` and `playGauntlet` for measuring (`arena.ts`). See `sprints/14-real-rival.md` |
| `goals.ts` | `getGoal(id)` → `{ name, text, count(side) }` |
| `relics.ts` | `getRelic(id)` → `{ name, text }`, `RELIC_LIST`, `Mods`, `NO_MODS`, `combineMods(relicIds, extra)` (the relics' rule changes summed, with a tier's laid on top) |
| `difficulty.ts` | `DIFFICULTIES` (`kitten`, `stray`, `apex`), `DifficultyId`, `DIFFICULTY`, `DIFFICULTY_LIST` (`{ id, name, text, rank }`), `isDifficulty(value)`, `difficultyOf(value)` (anything that is not a tier is Kitten), `isAtLeast(value, tier)`, `rivalLevel(matchIndex, tier)` (0 to 7), `LEVEL_COUNT` (8). A tier is its rank and nothing else |
| `rival.ts` | `getRival(id)` → `{ name, boss, theme, trait, flavor }`, `RIVAL_LIST`, `GAUNTLET` |
| `rivalDecks.ts` | `rivalDeck(rivalId, matchIndex, pool)`, `rivalRelics(rivalId)` (its clan's charm), `themeOf(rivalId)`, `PICK_CAPS` |
| `clans.ts` | `CLANS`, `CLAN_LIST` (`{ id, name, relicId, text }`), `starterDeck(clanId)`; `run.ts` exports them too |
| `run.ts` | `RunState` (`v: 2`), `startRun`, `actInRun` (returns `{ run, events, trail }`), `chooseReward`, `abandonRun`, `summarizeRun`, `makeOffer`, `RewardOffer`, `MatchRecord`, `MIN_DECK`, `isCurrentRun(stored)` and `retireRun(stored)` (a run saved by an older game is closed as abandoned) |
| `unlocks.ts` | `Unlock` (`{ kind: "cat" | "relic" | "clan", key }`), `UNLOCK_RULES`, `HIGH_SCORE` (38) and `TOP_SCORE` (45), the two scores an unlock asks for |
| `view.ts` | `RunView`, `MatchView`, `RivalView`, `RivalBeat`: the only shapes the client ever receives |

### Actions (`Action` in `match.ts`)

| Action | When | Meaning |
|--------|------|---------|
| `{ type: "keep", cats: number[], essence: Element[] }` | phase `setup` | Indices into `view.setup` to keep, plus essence to keep (at most one of each element). Exactly 5 in total. Not a turn. |
| `{ type: "play", hand: number, row: Row, swap?: Essence[] }` | phase `turn` | Play `view.hand[hand]`. Legal rows are in `view.playable[hand]`, which counts a play that only a swap can pay for. Food and yarn are paid automatically. If `swapOffer(view.essence, cat.cost).short` is not empty, `swap` must name exactly two essence from `.spare` for each pip short; otherwise leave it out. |
| `{ type: "hunt", dice: number[], trade?: number }` | phase `turn` | Indices into `view.feeder`. Exactly `min(view.rewards.hunt, view.feeder.length)` dice. With `trade` (a hand index, only while `view.trades.hunt`) that cat is discarded and exactly `view.rewards.hunt + 1` dice are taken. |
| `{ type: "den", targets: SlotRef[], trade?: Essence }` | phase `turn` | One `{ row, col }` per yarn, at most `view.rewards.den`; a slot may repeat up to the cat's `yarnCap`. Fewer is allowed. With `trade` (a food held, only while `view.trades.den`) that food is spent and exactly `view.rewards.den + 1` yarn must be laid. |
| `{ type: "prowl", picks: ("deck" \| number)[], trade?: SlotRef }` | phase `turn` | Tray indices or `"deck"`. Exactly `view.prowlPicks` picks; at most `view.deckCount + view.discardCount` of them from the deck. With `trade` (a cat holding yarn, only while `view.trades.prowl`) that cat loses 1 yarn and exactly `view.prowlPicks + 1` cats are picked. |
| `{ type: "reroll" }` | phase `turn`, `view.canReroll` | Free. Rerolls the feeder. |
| `{ type: "resolve", choice: number \| null }` | phase `pending` | `view.pending.kind === "tuckHand"`: a hand index, or `null` to decline. `"trade"`: `1` to spend 1 yarn for 1 wild, or `null`. |

Every player action is followed by the rival's own turn when the turn passes to it (two of them where the rival closes one round and opens the next) and, after the last turn of a round, the goal. All of it comes back as `events` from the same call, with `beats` beside them.

### Events (`MatchEvent`)

Every event a seat causes carries `side` (`player` or `rival`): `kept { cats, essence }`, `move { move }` (what the seat did, first among its action's events: `play { catId, row, col }`, `hunt { faces, discarded }`, `den { targets, spent }`, `prowl { tray, deck, payer }`, `reroll`, `resolve { kind, slot, took }`; cats drawn from a deck and a cat tucked from hand are counted, never named), `played { catId, row, col }`, `activated { row, reward }`, `power { catId, row, col, effect }`, `aura { catId, row, col }` (a legendary's relic handing over its treats as its seat's turn ends), `refill { treats }` (the Loud Bell paying out). Shared: `feeder { faces }` (rolled again), `goal { round, goalId, player, rival, playerPoints, rivalPoints }`, `over { won, player, rival, tiebreak }`. A cat set off again by an encore (Hadu) sends a second `power` event for the same slot in the same action.

### `MatchView` fields worth knowing

The player's seat is laid flat: `phase` (`setup` / `turn` / `pending` / `over`), `round` (0–2), `turnsLeft` (the player's), `lead` (who opens this round), `board` (`Record<Row, PlacedCat[]>`, each `{ catId, yarn, cached, tucked, under }`), `hand`, `tray`, `setup`, `essence` (five elements plus `wild`), `feeder`, `goals` (one id per round), `goalResults`, `standing` (this round's goal as it would score now), `pending`, `result` (`{ player, rival, won, tiebreak }`, both scores a `ScoreBreakdown`), `score`, `rewards`, `yarnCosts` (per row, `null` when full), `playable`, `canReroll`, `prowlPicks`, `trades` (per row, true while that row's trade can be paid for and its extra taken), `deckCount`, `discardCount`, `mods`, `relics`.

`rival` is the rival's seat as it shows across the table: `level` (0–7), `board` (its cats, with `tucked` counted and no `under`), `tray`, `essence`, `relics`, `handCount`, `deckCount`, `discardCount`, `turnsLeft`, `score` (`ScoreBreakdown`), `last` (its last whole turn, a `Move`). A `RivalBeat` is `{ rival, feeder }` after one of the rival's actions.

### `RunView`

`clanId`, `difficulty` (`kitten` / `stray` / `apex`), `deck` (sorted cat ids), `relics`, `matchIndex` (0–5), `gauntlet` (six rival ids), `phase` (`match` / `reward` / `over`), `match`, `reward` (`{ cats, relics, canTrim }`), `results` (`{ rivalId, player, rival, won }[]`), `outcome` (`won` / `lost` / `abandoned` / `null`).

## API: `src/server/api/routers/`

| Procedure | Input | Returns |
|-----------|-------|---------|
| `run.current` (query) | — | `RunSnapshot \| null`: `{ id, version, view }` |
| `run.clans` (query) | — | ids of unlocked clans |
| `run.start` | `{ clanId, difficulty }` (`difficulty` defaults to `kitten`) | `RunSnapshot` |
| `run.act` | `{ version, action }` | `RunUpdate`: `{ id, version, view, events, beats, unlocked }` (`beats`: one `RivalBeat` per rival action in `events`, in order) |
| `run.chooseReward` | `{ version, cat, relic, trim }` (each an id or `null`) | `RunUpdate` |
| `run.abandon` | `{ version }` | `RunUpdate` |
| `run.history` (query) | `{ limit }` | finished runs: `{ id, clanId, difficulty, status, matchesWon, score, startedAt, endedAt }[]` |
| `codex.get` (query) | — | `{ cats, relics, clans }`, each `{ id, unlocked, hint }[]` |

- Always send the `version` from the latest snapshot. A stale one returns `CONFLICT`; refetch `run.current` and carry on.
- A rules violation returns `BAD_REQUEST` with a sentence written for the player; show it as is.
- A run saved by an older version of the game cannot be read. `run.current` closes it as abandoned and returns `null`, `run.start` closes it before starting the new one, and any other call on it answers `CONFLICT`.
- When a run ends (`view.phase === "over"`), `run.current` is `null` from then on. The final `RunUpdate` is the only place `unlocked` appears, so keep it in component state to show the summary.

## Shared components

- `<PixelSprite catId size decorative />` in `src/components/PixelSprite.tsx`.
- `<CatCard catId variant="compact" | "full" lockedHint />`, `<EssencePip kind />` (a food icon) and `<ElementMark element />` in `src/components/cats/CatCard.tsx`.
- `Button`, `ButtonLink`, `Panel`, `Stat`, `Modal`, `RarityBadge`, `ElementBadge`, `Skeleton`, `useToast` in `src/components/ui`.
