# Sprint 10 — Engine and API (done; brought up to date by sprints 14 and 15)

The match and run engine and its API are built. This file is the reference the UI sprints code against. The source files are the truth; read them when a signature here is not enough.

## Engine: `src/server/game/`

Everything is pure, deterministic, and safe to import in client components.

| File | What it gives you |
|------|-------------------|
| `cats.ts` | `CATS`, `CAT_LIST`, `getCat(id)`, `Cat`, `Row`, `ROWS`, `ROW_LABELS`, `CostPip`, `RARITY_LABELS`, `describePower(power)` (the rules text for a card), `Aura` and `describeAura(aura)` (a legendary's relic), `playCost(catId, discount)` (the cost with a legendary's discount taken off) |
| `elements.ts` | `ELEMENTS`, `Element`, `ELEMENT_LABELS`, `FOOD_LABELS` (the cat food each element eats; the player-facing name for essence), `TREAT_LABEL` (wild) |
| `match.ts` | The two-seat match. Types: `MatchState` (`v: 2`, a `Table` plus `sides: { player, rival }`, `active`, `lead`, `last`, `level`), `Side` (what one seat owns), `Table` (what seats share), `SideId`, `Action`, `MatchEvent`, `Move` (what a seat did, as far as the other may see), `MatchResult` (`player` and `rival` as `ScoreBreakdown`, `won`, `tiebreak`), `Essence`, `PlacedCat`, `SlotRef`, `Pending`, `GoalResult`, `ScoreBreakdown`. Reducer: `createMatch(config)`, `applyAction(state, action)` (one action for `state.active`), `stepMatch` (the same in place), `legalActions(state)`, `seatActions(table, side)`. Queries on a seat: `rowReward(side, row)`, `roundTurns(mods, round)` (its turns in a round, relics included), `canPlay(side, hand, row)`, `prowlPickCount(side)`, `autoYarnTargets(side, n)`, `tradeOffered(side, feeder, row)`, `spareFood(side)`, `richestSlot(board)`, `boardYarnRoom(board)`; on a match: `goalStanding(state)`, `sideScore(state, who)`, `scoreBoard(board, goalResults, relicIds, who)`. Payment: `swapOffer(pool, cost)`, `playPayment(pool, hand, index, swap, discount)`, `defaultSwap(pool, hand, index, discount)`, `auraTotal(board, kind)`. Constants: `SLOTS` (4), `TRADE_CATS` ([1,3]), `ROUND_TURNS` ([8,7,6,5]), `SETUP_KEEP` (5), `COLUMN_YARN_COST`, `GOAL_WIN_POINTS`, `GOAL_LOSE_POINTS`, `MAX_ACTION_ITEMS` (16: the most things one action may name) |
| `duel.ts` | The driver. `openMatch(config, policy)` deals and has the rival keep; `advance(state, action, policy)` applies the player's action and every rival action after it, and returns `{ state, events, trail }` (`trail` is the match after each action applied) |
| `bot/` | The rival's mind: `observe(state, me)` and `imagine(seen, rng)` (`observe.ts`), `evaluate` (`eval.ts`), `LEVELS` and `botAt(level, style)` (`levels.ts`), `STYLES` (`styles.ts`), `rivalPolicy` and `standIn(level)` (`index.ts`), `playMatch`, `faceOff` and `playGauntlet` for measuring (`arena.ts`). See `sprints/14-real-rival.md` |
| `goals.ts` | `getGoal(id)` → `{ name, text, count(side) }` |
| `relics.ts` | `getRelic(id)` → `{ name, text }`, `RELIC_LIST`, `Mods`, `NO_MODS`, `combineMods(relicIds, extra)` (the relics' rule changes summed, with a tier's laid on top) |
| `difficulty.ts` | `DIFFICULTIES` (`kitten`, `stray`, `apex`), `DifficultyId`, `DIFFICULTY`, `DIFFICULTY_LIST` (`{ id, name, text, rank }`), `isDifficulty(value)`, `difficultyOf(value)` (anything that is not a tier is Kitten), `isAtLeast(value, tier)`, `rivalLevel(matchIndex, tier)` (0 to 7), `LEVEL_COUNT` (8). A tier is its rank and nothing else |
| `rival.ts` | `getRival(id)` → `{ name, boss, theme, trait, flavor }`, `RIVAL_LIST`, `GAUNTLET` |
| `rivalDecks.ts` | `rivalDeck(rivalId, matchIndex, pool, built)` (the cats the player owns, and the deck the player built), `rarityMix(built, size)`, `rivalRelics(rivalId)` (its clan's charm), `themeOf(rivalId)`, `RIVAL_DECK` (16) |
| `clans.ts` | `CLANS`, `CLAN_LIST` (`{ id, name, relicId, text }`), `starterDeck(clanId)` (a frozen list). Rivals only; `run.ts` no longer exports them |
| `collection.ts` | `Owned` (copies by cat id), `STARTER_COLLECTION`, `ownedCards(gained)`, `copyCap(catId)`, `gainCards(owned, cards)`, `MAX_COPIES` (4), `MAX_LEGENDARY` (1) |
| `deck.ts` | `DECK_SIZE` (32), `STOLEN` (8), `validateDeck(deck, owned)` → `DeckProblem[]`, `describeProblem`, `defaultDeck()`, `sortDeck`, `countCards` |
| `packs.ts` | `PACK_LIST`, `CAT_PACKS`, `COSMETIC_PACKS`, `PACK_PRICE`, `SLOT_ODDS`, `openCatPack(pack, rng)`, `openCosmeticPack(pack, gained, rng)`, `settleCats(cards, owned)`, `DUPLICATE_REFUND`, `packOf(catId)`, `PackResult` |
| `cosmetics.ts` | `COSMETIC_LIST`, `COSMETIC_SLOTS` (`hat`, `eyes`, `body`, `tail`, `halo`, `mat`, `cloth`, `tower`, `sky`), `Look`, `DEFAULT_LOOK`, `lookOf(stored, gained)`, `ownsCosmetic` |
| `payout.ts` | `matchPayout(facts)` → `{ coins, factor }`: what a finished match pays, the moment it ends, by its floor (`FLOOR_FACTOR`, ×1 to ×2) and tier. Server only (`import "server-only"`); never import it from a client component |
| `run.ts` | `RunState` (`v: 5`: `built`, `stolen`, `deck`, `chest`, phase `chest` / `match` / `reward` / `over`), `startRun({ seed, ticket, deck, pool, difficulty })`, `openChest(run, relicId)`, `actInRun` (returns `{ run, events, trail }`), `chooseReward(run, { reclaim, relic, trim })`, `abandonRun`, `summarizeRun`, `makeOffer`, `RewardOffer` (`{ reclaim, relics, canTrim }`), `MatchRecord`, `MIN_DECK` (16), `isCurrentRun(stored)` and `retireRun(stored)` (a run saved by an older game is closed as abandoned). `takeChest`, `settleMatch`, `applyReward` and `matchConfig` are the same steps without a match dealt, for the measuring harness |
| `unlocks.ts` | `Unlock` (`{ kind: "cat" | "relic", key }`), `UNLOCK_RULES`, `relicsFromUnlocks(held)`, `startingPool()`, `HIGH_SCORE` (76) and `TOP_SCORE` (87), the two scores a prize asks for |
| `view.ts` | `RunView`, `MatchView`, `RivalView`, `RivalBeat`: the only shapes the client ever receives |

### Actions (`Action` in `match.ts`)

| Action | When | Meaning |
|--------|------|---------|
| `{ type: "keep", cats: number[], essence: Element[] }` | phase `setup` | Indices into `view.setup` to keep, plus essence to keep (at most one of each element). Exactly 5 in total. Not a turn. |
| `{ type: "play", hand: number, row: Row, swap?: Essence[], yarnFrom?: SlotRef[] }` | phase `turn` | Play `view.hand[hand]`. Legal rows are in `view.playable[hand]`, which counts a play that only a swap can pay for. Food is paid automatically. If `swapOffer(view.essence, cat.cost).short` is not empty, `swap` must name exactly two essence from `.spare` for each pip short; otherwise leave it out. `yarnFrom` names the cats the column's yarn (`view.yarnCosts[row]`) comes from, one entry per yarn, a slot repeating for a cat that gives more than one and never more than it holds; left out, it comes from the cats holding the most (`defaultYarnFrom`). |
| `{ type: "hunt", dice: number[], trade?: number }` | phase `turn` | Indices into `view.feeder`. Exactly `min(view.rewards.hunt, view.feeder.length)` dice. With `trade` (a hand index, only while `view.trades.hunt`) that cat is discarded and exactly `view.rewards.hunt + 1` dice are taken. |
| `{ type: "den", targets: SlotRef[], trade?: Essence }` | phase `turn` | One `{ row, col }` per yarn, at most `view.rewards.den`; a slot may repeat up to the cat's `yarnCap`. Fewer is allowed. With `trade` (a food held, only while `view.trades.den`) that food is spent and exactly `view.rewards.den + 1` yarn must be laid. |
| `{ type: "prowl", picks: ("deck" \| number)[], trade?: SlotRef }` | phase `turn` | Tray indices or `"deck"`. Exactly `view.prowlPicks` picks; at most `view.deckCount + view.discardCount` of them from the deck. With `trade` (a cat holding yarn, only while `view.trades.prowl`) that cat loses 1 yarn and exactly `view.prowlPicks + 1` cats are picked. |
| `{ type: "reroll" }` | phase `turn`, `view.canReroll` | Free. Rerolls the feeder. |
| `{ type: "resolve", choice: number \| null }` | phase `pending` | `view.pending.kind === "tuckHand"`: a hand index, or `null` to decline. `"trade"`: `1` to spend 1 yarn for 1 wild, or `null`. |

Every player action is followed by the rival's own turn when the turn passes to it (two of them where the rival closes one round and opens the next) and, after the last turn of a round, the goal. All of it comes back as `events` from the same call, with `beats` beside them.

### Events (`MatchEvent`)

Every event a seat causes carries `side` (`player` or `rival`): `kept { cats, essence }`, `move { move }` (what the seat did, first among its action's events: `play { catId, row, col }`, `hunt { faces, discarded }`, `den { targets, spent }`, `prowl { tray, deck, payer }`, `reroll`, `resolve { kind, slot, took }`; cats drawn from a deck and a cat tucked from hand are counted, never named), `played { catId, row, col }`, `activated { row, reward }`, `power { catId, row, col, effect }`, `aura { catId, row, col }` (a legendary's relic handing over its treats as its seat's turn ends), `refill { treats }` (the Loud Bell paying out). Shared: `feeder { faces }` (rolled again), `goal { round, goalId, player, rival, playerPoints, rivalPoints }`, `over { won, player, rival, tiebreak }`. A cat set off again by an encore (Hadu) sends a second `power` event for the same slot in the same action.

### `MatchView` fields worth knowing

The player's seat is laid flat: `phase` (`setup` / `turn` / `pending` / `over`), `round` (0–3), `turnsLeft` (the player's), `lead` (who opens this round), `board` (`Record<Row, PlacedCat[]>`, each `{ catId, yarn, cached, tucked, under }`), `hand`, `tray`, `setup`, `essence` (five elements plus `wild`), `feeder`, `goals` (one id per round), `goalResults`, `standing` (this round's goal as it would score now), `pending`, `result` (`{ player, rival, won, tiebreak }`, both scores a `ScoreBreakdown`), `score`, `rewards`, `yarnCosts` (per row, `null` when full), `playable`, `canReroll`, `prowlPicks`, `trades` (per row, true while that row's trade can be paid for and its extra taken), `deckCount`, `discardCount`, `mods`, `relics`.

`rival` is the rival's seat as it shows across the table: `level` (0–7), `board` (its cats, with `tucked` counted and no `under`), `tray`, `essence`, `relics`, `handCount`, `deckCount`, `discardCount`, `turnsLeft`, `score` (`ScoreBreakdown`), `last` (its last whole turn, a `Move`). A `RivalBeat` is `{ rival, feeder }` after one of the rival's actions.

### `RunView`

`difficulty` (`kitten` / `stray` / `apex`), `deck` (sorted cat ids), `stolen` (the cards the rivals still hold, sorted), `relics`, `chest` (three relic ids while the chest waits, else `null`), `matchIndex` (0–5), `gauntlet` (six rival ids), `phase` (`chest` / `match` / `reward` / `over`), `match`, `reward` (`{ reclaim, relics, canTrim }`), `results` (`{ rivalId, player, rival, won, goalsWon, goals }[]`), `outcome` (`won` / `lost` / `abandoned` / `null`). The seed, the pool and the deck as built are never sent.

## API: `src/server/api/routers/`

| Procedure | Input | Returns |
|-----------|-------|---------|
| `run.current` (query) | — | `RunSnapshot \| null`: `{ id, version, view }` |
| `run.start` | `{ difficulty }` (defaults to `kitten`) | `RunSnapshot`, in phase `chest`. Plays the saved deck; a deck that is not legal is refused |
| `run.openChest` | `{ version, relic }` | `RunUpdate`, at the first match's keep |
| `run.act` | `{ version, action }` | `RunUpdate`: `{ id, version, view, events, beats, unlocked, coins }` (`beats`: one `RivalBeat` per rival action in `events`, in order; `coins`: what the run paid, a number once it has ended and `null` until then) |
| `run.chooseReward` | `{ version, reclaim, relic, trim }` (each an id or `null`) | `RunUpdate` |
| `run.abandon` | `{ version }` | `RunUpdate` |
| `run.history` (query) | `{ limit }` | finished runs: `{ id, difficulty, status, matchesWon, score, coins, startedAt, endedAt }[]` |
| `codex.get` (query) | — | `{ cats, relics }`, each `{ id, unlocked, hint, copies, cap }[]` (`copies` and `cap` are `null` for a relic) |
| `collection.get` (query) | — | copies owned, by cat id |
| `collection.deck` (query) | — | `{ cards, built, problems }`: the saved deck (or the default), and what is wrong with it as sentences |
| `collection.saveDeck` | `{ cards }` | the same; `BAD_REQUEST` with the first problem if it is not legal |
| `shop.packs` (query) | — | `{ coins, packs: { id, price, left }[] }` (`left`: pieces still to find in a cosmetic pack) |
| `shop.open` | `{ packId, requestId }` (a UUID made up for the press) | `{ result: PackResult, coins, replayed }`; the same `requestId` again returns the first answer |
| `profile.get` (query) | — | `{ name, coins, look, cosmetics }` |
| `profile.equip` | `{ slot, cosmeticId }` | the same; `FORBIDDEN` for a piece not owned |

- Always send the `version` from the latest snapshot. A stale one returns `CONFLICT`; refetch `run.current` and carry on.
- A rules violation returns `BAD_REQUEST` with a sentence written for the player; show it as is.
- A run saved by an older version of the game cannot be read. `run.current` closes it as abandoned and returns `null`, `run.start` closes it before starting the new one, and any other call on it answers `CONFLICT`.
- When a run ends (`view.phase === "over"`), `run.current` is `null` from then on. The final `RunUpdate` is the only place `unlocked` and `coins` appear, so keep it in component state to show the summary. `run.history` keeps each run's coins.
- Of a run's coins the client is sent the total and nothing else.

## Shared components

- `<PixelSprite catId size decorative />` in `src/components/PixelSprite.tsx`.
- `<CatCard catId variant="compact" | "full" lockedHint />`, `<EssencePip kind />` (a food icon) and `<ElementMark element />` in `src/components/cats/CatCard.tsx`.
- `Button`, `ButtonLink`, `Panel`, `Stat`, `Modal`, `RarityBadge`, `ElementBadge`, `Skeleton`, `useToast` in `src/components/ui`.
