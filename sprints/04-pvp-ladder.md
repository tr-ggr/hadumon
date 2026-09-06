# Sprint 04 — Async PvP & Ranked Ladder

**Mode:** parallel with 02/03/05. Read `00-overview.md` and skim `01-foundation.md` (battle engine, stats). Only edit files you own.

## Owned files
`src/server/db/schema/battle.ts`, `src/server/game/rating.ts` (+ `.test.ts`), `src/server/api/routers/battle.ts`, `src/app/battle/**`, `src/components/battle/**`.

## Goal
Players set a defense team; attack other trainers' defense teams; battles resolve server-side with the shared engine; an Elo-style ladder ranks everyone.

## Design

### Rating (`game/rating.ts`)
- `updateRatings(attacker, defender, attackerWon, k=32) → { attacker, defender }` standard Elo, floor 100. Test symmetry and floor.
- Rating lives on `users.rating` (Sprint 01). Bots participate.

### Schema (`schema/battle.ts`)
- `defenseTeams` (userId pk, creatureIds uuid[] (1–4), updatedAt).
- `battles` (id, attackerId, defenderId, winner `attacker|defender`, attackerRatingBefore/After, defenderRatingBefore/After, seed, log jsonb (full `BattleResult`), attackerTeam jsonb (snapshot of combatants), defenderTeam jsonb, createdAt).
- `attackQuota` (userId, day date, count, pk(userId, day)) — 10 attacks/day.

### Router (`routers/battle.ts`)
- `getDefense()` / `setDefense({ creatureIds 1–4 })` (must own; any status allowed).
- `opponents()` → up to 8 users (excluding self) with a defense team, nearest by rating (4 above, 4 below), with username, rating, isBot, team preview (sprites + levels + power). Exclude users attacked in the last hour.
- `attack({ defenderId, creatureIds 1–4 })` → tx: check quota, lock both users' rows (`FOR UPDATE` ordered by id to avoid deadlocks), build combatants from current stats, `simulateBattle(atk, def, seed)`, update ratings, insert battle, increment quota. Reward on win: 50 gold + 10 gems. Return battle id + result.
- `battle({ id })` → full record for replay.
- `history({ limit 20 })` → both attacks and defenses with outcome and rating delta.
- `ladder()` → top 50 by rating + the caller's rank (window function or count).

### Seed helper
Export `seedDefenseTeams(db)` from `src/server/game/rating.ts`? No — put it in `src/server/db/seed-battle.ts` (you own this file too): gives every bot user a defense team from their creatures. Sprint 06 wires it into the main seed; for now add script `db:seed:battle` in `package.json` — **do not** edit `package.json` if it causes conflicts; instead document the command `pnpm tsx src/server/db/seed-battle.ts` in your sprint notes and make it runnable standalone.

### UI (`src/app/battle/`)
- Tabs: **Arena**, **Ladder**, **History**.
- Arena: your defense team editor (pick up to 4, shows power) + opponent list cards with "Attack" → attack-team picker modal (default = your defense team) → animated replay: two rows of sprites, HP bars, turn log auto-advances (~400ms/turn) with a "Skip" button, then result card with rating delta and rewards. Quota indicator "7/10 attacks today".
- Ladder: table with rank, sprite of first defender, username, rating; caller's row highlighted and pinned if outside top 50.
- History: list with W/L badge, opponent, rating delta, "Replay".
- Mobile-first at 375px (HP bars stack).

## Acceptance
- Can't exceed 10 attacks/day, attack self, or attack a user without a defense team; ratings update for both sides atomically.
- Replay is deterministic from stored log (not re-simulated).
- `pnpm check` and `pnpm test` pass. Commit `feat: sprint 04 pvp ladder`.
