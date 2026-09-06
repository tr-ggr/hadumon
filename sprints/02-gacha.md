# Sprint 02 — Gacha Summoning Hub

**Mode:** parallel with 03/04/05. Read `00-overview.md` and skim `01-foundation.md` (auth, wallet, species, sprites). Only edit files you own.

## Owned files
`src/server/db/schema/gacha.ts`, `src/server/game/gacha.ts`, `src/server/game/gacha.test.ts`, `src/server/api/routers/gacha.ts`, `src/app/summon/**`, `src/components/gacha/**`.

## Goal
Players spend gems on banners to pull cats of varying rarity with a pity system, and see a satisfying reveal.

## Design

### Banners (code-defined in `game/gacha.ts`)
- `standard`: all species; weights common 60 / uncommon 25 / rare 10 / epic 4 / legendary 1 (%).
- `featured`: rotates weekly by ISO week number over the epic+legendary species list; the featured species gets 50% of its rarity's roll; weights common 55 / uncommon 27 / rare 12 / epic 4.5 / legendary 1.5.
- Cost: single 100 gems, 10-pull 900 gems. 10-pull guarantees at least one `rare+`.
- Pity: per user per banner counter; at 50 pulls without epic+ the next pull is forced epic+ (legendary 25% of those) and the counter resets. Counter also resets on a natural epic+.

### Pure logic
`rollPull(banner, rng, pityCount) → { speciesId, rarity, wasPity }`, `rollMulti(banner, rng, pityCount, n=10)` applying the rare+ guarantee to slot 10 if none hit, returning new pity count. Tests: weight distribution over 20k rolls within ±2pp, pity triggers exactly at 50, 10-pull guarantee holds, featured rate-up works, determinism with seed.

### Schema (`schema/gacha.ts`)
- `pulls` (id, userId, bannerId, speciesId, rarity, wasPity, creatureId fk, createdAt).
- `pityCounters` (userId, bannerId, count, pk(userId, bannerId)).

### Router (`routers/gacha.ts`)
- `banners()` → list with cost, weights, featured species (with sprite ids), user's pity count.
- `pull({ bannerId, count: 1 | 10 })` → in one transaction: `adjustWallet` (throws if insufficient), lock+read pity row (`FOR UPDATE`), roll with `createRng(randomUUID())`, insert creatures (`obtainedVia: "gacha"`), insert `pulls`, update pity. Returns the results with full species data and `isNew` (first time owning that species).
- `history({ limit 50 })`.

### UI (`src/app/summon/`)
- Banner cards (featured highlighted with glow) showing cost, rates ("Rates" toggle), pity progress bar "37/50".
- Buttons "Summon ×1" / "Summon ×10" (disabled when gems insufficient, show needed amount).
- Reveal: results appear one by one (~150ms stagger) with a rarity-colored flash; legendary gets a special border. "NEW!" tag on first-time species. "Summon again" and "Go to Collection".
- Recent pulls list (last 20).
- Mobile: grid 2 columns at 375px, 5 columns desktop.

## Acceptance
- Gems never go negative; pulling with insufficient gems returns a clear error toast.
- Pity/guarantee behaviours covered by tests.
- `pnpm check` and `pnpm test` pass. Commit `feat: sprint 02 gacha summoning hub`.
