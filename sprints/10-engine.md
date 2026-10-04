# Sprint 10 — Engine and API (done)

The match and run engine and its API are built. This file is the reference the UI sprints code against. The source files are the truth; read them when a signature here is not enough.

## Engine: `src/server/game/`

Everything is pure, deterministic, and safe to import in client components.

| File | What it gives you |
|------|-------------------|
| `cats.ts` | `CATS`, `CAT_LIST`, `getCat(id)`, `Cat`, `Row`, `ROWS`, `ROW_LABELS`, `CostPip`, `RARITY_LABELS`, `describePower(power)` (the rules text for a card) |
| `elements.ts` | `ELEMENTS`, `Element`, `ELEMENT_LABELS` |
| `match.ts` | `Action`, `MatchEvent`, `Essence`, `PlacedCat`, `SlotRef`, `Pending`, `GoalResult`, `ScoreBreakdown`; constants `SLOTS` (4), `ROUND_TURNS` ([5,4,3]), `SETUP_KEEP` (5), `COLUMN_YARN_COST`, `GOAL_WIN_POINTS`, `GOAL_LOSE_POINTS` |
| `goals.ts` | `getGoal(id)` → `{ name, text, par }` |
| `relics.ts` | `getRelic(id)` → `{ name, text }`, `RELIC_LIST` |
| `rival.ts` | `getRival(id)` → `{ name, boss, trait, flavor, bankPoints, stashYarn, raidDice, burnCards, deck }`, `GAUNTLET` |
| `run.ts` | `CLANS`, `CLAN_LIST` (`{ id, name, relicId, text }`), `starterDeck(clanId)`, `RewardOffer`, `MatchRecord`, `MIN_DECK` |
| `unlocks.ts` | `Unlock` (`{ kind: "cat" | "relic" | "clan", key }`), `UNLOCK_RULES` |
| `view.ts` | `RunView`, `MatchView`, `RivalView`: the only shapes the client ever receives |

### Actions (`Action` in `match.ts`)

| Action | When | Meaning |
|--------|------|---------|
| `{ type: "keep", cats: number[], essence: Element[] }` | phase `setup` | Indices into `view.setup` to keep, plus essence to keep (at most one of each element). Exactly 5 in total. Not a turn. |
| `{ type: "play", hand: number, row: Row }` | phase `turn` | Play `view.hand[hand]`. Legal rows are in `view.playable[hand]`. Essence and yarn are paid automatically. |
| `{ type: "hunt", dice: number[] }` | phase `turn` | Indices into `view.feeder`. Exactly `min(view.rewards.hunt, view.feeder.length)` dice. |
| `{ type: "den", targets: SlotRef[] }` | phase `turn` | One `{ row, col }` per yarn, at most `view.rewards.den`; a slot may repeat up to the cat's `yarnCap`. Fewer is allowed. |
| `{ type: "prowl", picks: ("deck" \| number)[] }` | phase `turn` | Tray indices or `"deck"`. Exactly `view.prowlPicks` picks; at most `view.deckCount + view.discardCount` of them from the deck. |
| `{ type: "reroll" }` | phase `turn`, `view.canReroll` | Free. Rerolls the feeder. |
| `{ type: "resolve", choice: number \| null }` | phase `pending` | `view.pending.kind === "tuckHand"`: a hand index, or `null` to decline. `"trade"`: `1` to spend 1 yarn for 1 wild, or `null`. |

Every player turn is followed by one rival action and, after the last turn of a round, the goal. All of it comes back as `events` from the same call.

### Events (`MatchEvent`)

`kept`, `played { catId, row, col }`, `activated { row, reward }`, `power { catId, row, col, effect }`, `feeder { faces }` (rerolled), `rival { action, removed }` (`removed` lists raided dice faces or burned cat ids), `goal { round, goalId, player, rival, playerPoints, rivalPoints }`, `over { won, player, rival }`.

### `MatchView` fields worth knowing

`phase` (`setup` / `turn` / `pending` / `over`), `round` (0–2), `turnsLeft`, `board` (`Record<Row, PlacedCat[]>`, each `{ catId, yarn, cached, tucked }`), `hand`, `tray`, `setup`, `essence` (five elements plus `wild`), `feeder`, `goals` (one id per round), `goalResults`, `standing` (this round's goal as it would score now), `pending`, `result`, `score` (`ScoreBreakdown`), `rival` (`banked`, `bankValue`, `yarn`, `pushes`, `goalPoints`, `score`, `last`, `seen`, `deckCount`), `rewards`, `yarnCosts` (per row, `null` when full), `playable`, `canReroll`, `prowlPicks`, `deckCount`, `discardCount`, `mods`.

### `RunView`

`clanId`, `deck` (sorted cat ids), `relics`, `matchIndex` (0–5), `gauntlet` (six rival ids), `phase` (`match` / `reward` / `over`), `match`, `reward` (`{ cats, relics, canTrim }`), `results` (`{ rivalId, player, rival, won }[]`), `outcome` (`won` / `lost` / `abandoned` / `null`).

## API: `src/server/api/routers/`

| Procedure | Input | Returns |
|-----------|-------|---------|
| `run.current` (query) | — | `RunSnapshot \| null`: `{ id, version, view }` |
| `run.clans` (query) | — | ids of unlocked clans |
| `run.start` | `{ clanId }` | `RunSnapshot` |
| `run.act` | `{ version, action }` | `RunUpdate`: `{ id, version, view, events, unlocked }` |
| `run.chooseReward` | `{ version, cat, relic, trim }` (each an id or `null`) | `RunUpdate` |
| `run.abandon` | `{ version }` | `RunUpdate` |
| `run.history` (query) | `{ limit }` | finished runs: `{ id, clanId, status, matchesWon, score, startedAt, endedAt }[]` |
| `codex.get` (query) | — | `{ cats, relics, clans }`, each `{ id, unlocked, hint }[]` |

- Always send the `version` from the latest snapshot. A stale one returns `CONFLICT`; refetch `run.current` and carry on.
- A rules violation returns `BAD_REQUEST` with a sentence written for the player; show it as is.
- When a run ends (`view.phase === "over"`), `run.current` is `null` from then on. The final `RunUpdate` is the only place `unlocked` appears, so keep it in component state to show the summary.

## Shared components

- `<PixelSprite catId size decorative />` in `src/components/PixelSprite.tsx`.
- `<CatCard catId variant="compact" | "full" lockedHint />` and `<EssencePip kind />` in `src/components/cats/CatCard.tsx`.
- `Button`, `ButtonLink`, `Panel`, `Stat`, `Modal`, `RarityBadge`, `ElementBadge`, `Skeleton`, `useToast` in `src/components/ui`.
