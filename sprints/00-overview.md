# HaduMon — MVP Sprint Overview

HaduMon is a web-based idle creature-collector RPG about feline "Fakemon". Players pull cats from a Gacha Summoning Hub, send squads on Idle Adventures that resolve server-side auto-battles over time, fight other trainers' defense teams on an async ranked ladder, and trade cats on a Marketplace. The UI is a retro pixel-art, mobile-first dashboard.

## Stack

- Next.js 15 App Router + TypeScript (strict, no `any`)
- tRPC v11 + TanStack Query, superjson
- Drizzle ORM + `postgres` driver, local Postgres: `postgresql://postgres@localhost:5432/hadumon`
- Tailwind CSS v4
- Vitest for pure game logic
- Package manager: `pnpm`

## Sprint order

| # | File | Mode | Depends on |
|---|------|------|-----------|
| 01 | `01-foundation.md` | sequential | — |
| 02 | `02-gacha.md` | parallel | 01 |
| 03 | `03-idle-adventure.md` | parallel | 01 |
| 04 | `04-pvp-ladder.md` | parallel | 01 |
| 05 | `05-marketplace.md` | parallel | 01 |
| 06 | `06-integration-polish.md` | sequential | 02–05 |

Sprints 02–05 run **concurrently in the same working tree**. Each sprint owns an explicit set of files (see "File ownership"). An agent must not edit files owned by another sprint. If you need something from another sprint that doesn't exist yet, write the smallest possible helper inside your own files instead of editing theirs.

## Shared domain rules (all sprints must respect these)

### Elements
`flame`, `mist`, `volt`, `thorn`, `shade`. Advantage wheel (attacker → defender = +25% dmg; reverse = −25%):
flame → thorn → volt → mist → flame; shade ↔ shade is neutral; shade deals +10% to everything else and takes +10% from everything else.

### Rarities
`common`, `uncommon`, `rare`, `epic`, `legendary`. Base-stat multipliers 1.0 / 1.15 / 1.35 / 1.6 / 2.0.

### Core stats
`hp`, `attack`, `defense`, `speed`, `affinity`. Effective stat at level L:
`floor(base * rarityMult * (1 + 0.06 * (L - 1)) * (1 + 0.05 * upgradeTier))`.
Squad power = sum over creatures of `(hp/4 + attack + defense + speed + affinity)`.

### Currencies
- `gold` — earned in adventure; spent on upgrades and the marketplace.
- `gems` — earned in adventure (slowly) and daily; spent on gacha. 1 pull = 100 gems, 10-pull = 900.
- `materials` — per-element upgrade materials (`flameShard`, `mistShard`, …), earned in adventure.

New accounts start with 1000 gems, 500 gold, and 3 common starter cats (seeded).

### Creature ownership locks
A creature has `status`: `idle` | `expedition` | `listed` | `trading`. Only `idle` creatures may be sent on expedition, listed, or offered in a trade. Defense-team membership is independent of `status` (a cat can defend while on expedition). Every mutation that changes status must check the current status inside the same DB transaction (`FOR UPDATE`) to avoid double-spend.

### Money mutations
All gold/gem changes go through `adjustWallet(tx, userId, { gold?, gems? })` in `src/server/game/wallet.ts` (Sprint 01). It must throw on insufficient funds and never let a balance go negative. Never trust client-supplied prices/amounts beyond validated input.

### Battle engine
`src/server/game/battle.ts` (Sprint 01) exports `simulateBattle(teamA, teamB, seed) => BattleResult` with a deterministic seeded RNG and a structured turn log. Idle adventure (03) and PvP (04) both use it; neither may modify it. If a feature needs an extra option, add it in your own file by wrapping.

## File ownership

| Sprint | Owns |
|--------|------|
| 01 | Everything not listed below: scaffold, `src/server/db/{index,seed}.ts`, `src/server/db/schema/{index,auth,creatures}.ts`, `src/server/auth/**`, `src/server/api/trpc.ts`, `src/server/api/root.ts`, `src/server/api/routers/{auth,creatures}.ts`, `src/server/game/{species,stats,rng,battle,wallet,elements}.ts` (+tests), `src/components/**` (shell, PixelSprite, ui primitives), `src/app/{layout,page,login,signup}`, `src/app/collection/**`, stub routers/pages for 02–05 |
| 02 | `src/server/db/schema/gacha.ts`, `src/server/game/gacha.ts` (+test), `src/server/api/routers/gacha.ts`, `src/app/summon/**`, `src/components/gacha/**` |
| 03 | `src/server/db/schema/adventure.ts`, `src/server/game/{idle,zones,progression}.ts` (+tests), `src/server/api/routers/adventure.ts`, `src/app/adventure/**`, `src/components/adventure/**` |
| 04 | `src/server/db/schema/battle.ts`, `src/server/game/rating.ts` (+test), `src/server/api/routers/battle.ts`, `src/app/battle/**`, `src/components/battle/**` |
| 05 | `src/server/db/schema/market.ts`, `src/server/game/market.ts` (+test), `src/server/api/routers/market.ts`, `src/app/market/**`, `src/components/market/**` |
| 06 | `src/app/page.tsx` (dashboard), `src/components/**` polish, README, any cross-cutting fixes |

Sprint 01 creates every schema file, router file, and page directory listed for 02–05 as **stubs** so `root.ts` and `schema/index.ts` never need to change afterwards.

## Conventions

- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`. No co-author lines.
- Every tRPC mutation validates input with zod and uses `protectedProcedure`.
- Server-side game logic lives in `src/server/game/*` as pure functions with unit tests; routers are thin.
- UI: Tailwind only; retro theme tokens defined in `src/styles/globals.css` (Sprint 01). Use `<PixelSprite>` for every cat image. Mobile-first: everything must work at 375px wide.
- Before finishing a sprint: `pnpm check` (lint + typecheck) and `pnpm test` pass. Do not leave TODOs for your own scope.

## Running

```bash
createdb -h localhost -U postgres hadumon   # once
cp .env.example .env
pnpm install
pnpm db:push
pnpm db:seed
pnpm dev
```
