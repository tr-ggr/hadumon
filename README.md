# HaduMon

A web-based **idle creature-collector RPG** about feline "Fakemon".

Pull cats from a **Gacha Summoning Hub**, send squads on **Idle Adventures** that
resolve server-side auto-battles over elapsed time, fight other trainers'
defence teams on an **async ranked ladder**, and buy, sell and trade cats on the
**Marketplace**. The UI is a retro pixel-art, mobile-first dashboard.

Creatures come in five elements (`flame`, `mist`, `volt`, `thorn`, `shade`) and
five rarities (`common` → `legendary`), and are drawn as 32×32 pixel sprites
generated from six archetype maps tinted per element and rarity.

## Stack

- **Next.js 15** (App Router) + **TypeScript** (strict, no `any`)
- **tRPC v11** + TanStack Query + superjson
- **Drizzle ORM** with the `postgres` driver, against a **local Postgres**
- **Tailwind CSS v4** (theme tokens in `src/styles/globals.css`)
- **Vitest** for the pure game logic
- Package manager: **pnpm**

Auth is custom: `scrypt` password hashing plus an opaque session cookie
(`hadumon_session`) backed by a `sessions` table. No NextAuth.

## Running it

```bash
createdb -h localhost -U postgres hadumon   # once
cp .env.example .env
pnpm install
pnpm db:push
pnpm db:seed
pnpm dev
```

Then open <http://localhost:3000>. Sign up for a fresh account (1000 gems,
500 gold, 3 starter cats) or sign in with the seeded demo trainer:

| Account | Password |
| --- | --- |
| `demo` | `demo1234` |
| `whiskerbot_1` … `whiskerbot_5` | `botpass123` |

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Next dev server (turbo) |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm check` | `next lint` + `tsc --noEmit` |
| `pnpm typecheck` | Type check only |
| `pnpm test` | Vitest, single run |
| `pnpm test:watch` | Vitest in watch mode |
| `pnpm db:push` | Push the Drizzle schema to Postgres |
| `pnpm db:seed` | Idempotent dev seed (bots + demo account) |
| `pnpm db:studio` | Drizzle Studio |
| `pnpm format:write` | Prettier |

## Layout

```
src/
  app/                    App Router pages
    login/  signup/       Auth forms (render without the app shell)
    collection/           Collection grid + /collection/[id] detail
    summon/ adventure/    Stubs owned by Sprints 02–05
    battle/ market/
  components/
    AppShell.tsx          Top bar, desktop side nav, mobile bottom nav
    PixelSprite.tsx       Inline-SVG 32×32 sprite renderer
    sprites/              Archetype pixel maps + element/rarity palettes
    ui/                   Button, Panel, Stat, RarityBadge, ElementBadge, CreatureCard
  server/
    api/                  tRPC root, context, routers
    auth/                 scrypt hashing + session cookie helpers
    db/                   Drizzle client, schema/, seed.ts
    game/                 Pure game logic (unit tested)
      elements.ts         Element wheel and damage multipliers
      species.ts          The 25-species catalogue
      stats.ts            Effective stats, power, XP curve
      rng.ts              Seeded deterministic RNG
      battle.ts           Shared auto-battle engine
      wallet.ts           Guarded gold/gem/material mutations
  styles/globals.css      Tailwind v4 theme tokens and retro utilities
```

Server-side game rules live in `src/server/game/*` as pure functions with unit
tests; tRPC routers stay thin. Every mutation validates its input with zod and
uses `protectedProcedure`.

## Sprints

The MVP is built in six sprints — see [`sprints/`](./sprints):

| # | Sprint |
| --- | --- |
| 01 | [Foundation](./sprints/01-foundation.md) — auth, schema, species, sprites, battle engine, shell, collection |
| 02 | [Gacha Summoning Hub](./sprints/02-gacha.md) |
| 03 | [Idle Adventure Mode](./sprints/03-idle-adventure.md) |
| 04 | [Async PvP & Ranked Ladder](./sprints/04-pvp-ladder.md) |
| 05 | [Trading Post & Marketplace](./sprints/05-marketplace.md) |
| 06 | [Integration & Polish](./sprints/06-integration-polish.md) |

[`sprints/00-overview.md`](./sprints/00-overview.md) holds the shared domain
rules (element wheel, rarity multipliers, stat formulas, currencies, ownership
locks) that every sprint must respect.
