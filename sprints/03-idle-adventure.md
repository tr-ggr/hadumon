# Sprint 03 — Idle Adventure Mode

**Mode:** parallel with 02/04/05. Read `00-overview.md` and skim `01-foundation.md` (battle engine, stats, wallet, species). Only edit files you own.

## Owned files
`src/server/db/schema/adventure.ts`, `src/server/game/{zones,idle,progression}.ts` (+ `.test.ts`), `src/server/api/routers/adventure.ts`, `src/app/adventure/**`, `src/components/adventure/**`.

## Goal
Players assign a squad of up to 4 cats to a zone; the server resolves encounters over elapsed time using the shared battle engine and pays out XP, gold, gems, and materials. Players spend materials + gold to upgrade cats.

## Design

### Zones (`game/zones.ts`)
5 code-defined zones, each `{ id, name, description, tier, element (dominant), recommendedPower, encounterIntervalSec: 60, enemyLevelRange, rewardMult, unlockRequirement }`:
1. Whisker Meadows (thorn, power 0)
2. Ember Alley (flame, unlock: 20 encounters won in zone 1)
3. Foggy Docks (mist, unlock: 20 wins in zone 2)
4. Static Rooftops (volt, unlock: 20 wins in zone 3)
5. Moonlit Catacombs (shade, unlock: 20 wins in zone 4)
Enemies are generated from the species catalog filtered by zone element (+20% off-element), levels within range, 2–4 per encounter, deterministic from `seed = expeditionId + encounterIndex`.

### Idle resolution (`game/idle.ts`)
- `resolveExpedition({ expedition, squad, zone, now }) → { encounters: EncounterSummary[], rewards, xpPerCreature, winCount, lossCount, secondsConsumed }`.
- Encounters = `floor(min(now - lastClaimedAt, 8h) / interval)`. Simulate each with `simulateBattle`; the squad's HP does **not** persist between encounters (each encounter is fresh) — keep it simple.
- Win rewards per encounter: gold `10 * tier * rewardMult`, xp `25 * tier` (split evenly among squad, ×1.0 to each), gems `1` with 10% chance, material of the zone element `1` with 35% chance (rng from encounter seed). Loss: 25% of gold, no materials, xp halved. If the squad loses 3 in a row, the expedition auto-ends ("retreated") and no further encounters are resolved.
- Return a compact summary (don't store full battle logs; store the last encounter's log for a "latest fight" replay).
- Tests: encounter count/caps, 3-loss retreat, reward math, determinism.

### Progression (`game/progression.ts`)
- `applyXp` is in Sprint 01 `stats.ts`; here: `upgradeCost(creature) → { gold, materials: { element, amount } }` = `gold 100 * (tier+1)^2`, `materials 3 * (tier+1)`, max tier 10. Test.

### Schema (`schema/adventure.ts`)
- `expeditions` (id, userId, zoneId, status `active|completed|retreated`, startedAt, lastClaimedAt, endedAt nullable, winCount, lossCount, lastBattleLog jsonb nullable, totalGold, totalXp).
- `expeditionMembers` (expeditionId, creatureId, slot 0–3, pk(expeditionId, creatureId)).
- `zoneProgress` (userId, zoneId, wins, pk(userId, zoneId)).

### Router (`routers/adventure.ts`)
- `zones()` → zones + unlock state + user's wins per zone.
- `start({ zoneId, creatureIds: 1–4 })` → tx: verify ownership + `status = 'idle'` (`FOR UPDATE`), zone unlocked, no active expedition; set creatures `expedition`; insert expedition + members.
- `current()` → active expedition with squad (sprites, levels), elapsed time, pending encounter count (computed, not persisted), zone.
- `claim()` → tx: lock expedition, resolve since `lastClaimedAt`, apply rewards via `adjustWallet`/`adjustMaterials`, apply xp/levels to creatures, update zoneProgress, set `lastClaimedAt = now` (advance by `secondsConsumed`, not to `now`, so partial minutes carry over). If retreated, set status and release creatures to `idle`. Returns the summary for a results modal.
- `recall()` → claims then ends expedition, releasing creatures.
- `history({ limit 20 })`.
- `upgrade({ creatureId })` → tx: cost check, `adjustWallet`, `adjustMaterials`, increment tier.

### UI (`src/app/adventure/`)
- Zone list as pixel "map cards" (locked ones greyed with requirement text). Selecting a zone opens a squad picker (idle creatures only, shows power vs recommended, warns if underpowered).
- Active expedition panel: zone name, squad sprites with levels, a live-ticking timer ("Next encounter in 0:37", "12 encounters ready"), buttons **Claim**, **Recall**. Claim opens a results modal: wins/losses, gold/gems/materials, per-cat XP with level-ups highlighted, "watch last fight" collapsible turn log.
- Materials inventory strip (5 elements with counts).
- Upgrade UI: from the expedition page's squad cards, and expose an `UpgradeButton` component in `src/components/adventure/` that Sprint 06 may reuse on Collection.
- Mobile-first, works at 375px.

## Acceptance
- Cannot start with non-idle or non-owned cats, or a locked zone; cannot double-claim (second call yields 0 encounters).
- Offline cap of 8h enforced; partial-minute carry-over works.
- `pnpm check` and `pnpm test` pass. Commit `feat: sprint 03 idle adventure`.
