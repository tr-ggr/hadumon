# HaduMon

A web-based **idle creature-collector RPG** about feline "Fakemon".

Pull cats from a **Gacha Summoning Hub**, send squads on **Idle Adventures**
that resolve server-side auto-battles over elapsed time, fight other trainers'
defense teams on an **async ranked ladder**, and buy, sell and trade cats on the
**Marketplace**. The UI is a retro pixel-art, mobile-first dashboard that works
down to 375px.

Creatures come in five elements (`flame`, `mist`, `volt`, `thorn`, `shade`) and
five rarities (`common` → `legendary`), and are drawn as 32×32 pixel sprites
generated from six archetype maps tinted per element and rarity — no image
assets, everything is inline SVG.

## Features

- **Gacha summoning** — two banners, weighted rarity tables, 10-pull discount,
  a pity counter that guarantees an Epic+ and an animated reveal.
- **Idle adventures** — five zones with unlock requirements; expeditions bank
  one encounter a minute for up to 8 hours offline, resolve as real auto-battles
  and pay out gold, XP, gems and per-element upgrade shards. Three losses in a
  row force a retreat.
- **Upgrades** — spend gold + matching shards to raise a cat's upgrade tier
  (+5% to every stat per tier), from the squad, the dashboard or the collection.
- **Async PvP ladder** — set a defense team, attack any of eight nearby
  trainers, 10 attacks a UTC day, Elo ratings with a rating floor, cosmetic
  tiers (Kitten → Apex), a top-50 ladder and a turn-by-turn battle replay.
- **Marketplace** — list idle cats for gold, browse and filter the board, buy
  with an escrowed transfer, and propose or accept 1:1 cat-for-cat trades.
  Every ownership change happens in one transaction with `FOR UPDATE` locks, so
  a cat can never be sold and traded at the same time.
- **Collection** — filter and sort your roster, rename cats, and see at a glance
  whether one is idle, on expedition, listed or reserved by a trade.
- **Dashboard** — wallet and shards, the running expedition with a live timer
  and one-tap claim, your last five summons, pity progress, ladder standing,
  attacks left today and pending trade offers, with empty states that always
  point at the next thing to do.
- **Retro shell** — pixel font headings, hard-shadow panels, rarity glows,
  element-tinted badges, and an optional CRT scanline overlay (the `CRT` button
  in the top bar; off by default, remembered per browser).

## Screenshots

<!-- Drop PNGs in `public/screenshots/` and link them here. -->

| Dashboard | Summon | Adventure | Battle | Market |
| --- | --- | --- | --- | --- |
| _todo_ | _todo_ | _todo_ | _todo_ | _todo_ |

## Stack

- **Next.js 15** (App Router) + **TypeScript** (strict, no `any`)
- **tRPC v11** + TanStack Query + superjson
- **Drizzle ORM** with the `postgres` driver, against a **local Postgres**
- **Tailwind CSS v4** (theme tokens in `src/styles/globals.css`)
- **Vitest** for the pure game logic (166 tests)
- Package manager: **pnpm**

Auth is custom: `scrypt` password hashing plus an opaque session cookie
(`hadumon_session`) backed by a `sessions` table. No NextAuth.

## Running it

Requires Node 20+, pnpm and a local Postgres you can connect to as `postgres`.

```bash
createdb -h localhost -U postgres hadumon   # once
cp .env.example .env                        # DATABASE_URL + SESSION_SECRET
pnpm install
pnpm db:push                                # create the tables
pnpm db:seed                                # bots, demo account, ladder, listings
pnpm dev
```

Then open <http://localhost:3000>. Sign up for a fresh account (1000 gems,
500 gold, 3 starter cats) or sign in with a seeded trainer:

| Account | Password |
| --- | --- |
| `demo` | `demo1234` |
| `whiskerbot_1` … `whiskerbot_5` | `botpass123` |

`pnpm db:seed` is idempotent — it tops accounts back up instead of duplicating
anything, so it is safe to re-run at any time. It creates the five bot trainers
and the demo account, gives every bot a defense team for the ladder, and puts
ten bot-owned cats up for sale on the market. To start over completely:

```bash
dropdb -h localhost -U postgres hadumon && createdb -h localhost -U postgres hadumon
pnpm db:push && pnpm db:seed
```

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Next dev server (turbo) |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm check` | `next lint` + `tsc --noEmit` — the gate before any commit |
| `pnpm typecheck` | Type check only |
| `pnpm lint` / `pnpm lint:fix` | ESLint |
| `pnpm test` | Vitest, single run |
| `pnpm test:watch` | Vitest in watch mode |
| `pnpm db:push` | Push the Drizzle schema to Postgres |
| `pnpm db:generate` / `pnpm db:migrate` | SQL migrations, if you prefer them |
| `pnpm db:seed` | Full idempotent dev seed (accounts → defense teams → listings) |
| `pnpm db:seed:battle` | Re-seed bot defense teams only |
| `pnpm db:seed:market` | Top the marketplace back up to 10 listings |
| `pnpm db:studio` | Drizzle Studio |
| `pnpm format:write` / `pnpm format:check` | Prettier |

## Layout

```
src/
  app/                    App Router pages
    page.tsx              Home dashboard (HomeDashboard.tsx)
    login/  signup/       Auth forms (render without the app shell)
    summon/               Gacha Summoning Hub
    adventure/            Zone map, squad picker, running expedition
    battle/               Arena, ladder and battle history tabs
    market/               Browse, my listings and trades tabs
    collection/           Collection grid + /collection/[id] detail
    not-found.tsx         Shared 404
  components/
    AppShell.tsx          Top bar (wallet chips, CRT toggle), side + bottom nav
    PixelSprite.tsx       Inline-SVG 32×32 sprite renderer
    sprites/              Archetype pixel maps + element/rarity palettes
    ui/                   Button, Panel, Stat, badges, CreatureCard,
                          Toast (app-wide `useToast`), Skeleton
    gacha/ adventure/     Feature components (banners, pity bar, expedition
    battle/ market/       panel, upgrade button, team picker, listings…)
  server/
    api/                  tRPC root, context, routers (auth, creatures, gacha,
                          adventure, battle, market)
    auth/                 scrypt hashing + session cookie helpers
    db/                   Drizzle client, schema/, seed.ts + seed-battle/-market
    game/                 Pure game logic (unit tested)
      elements.ts         Element wheel and damage multipliers
      species.ts          The 25-species catalogue
      stats.ts            Effective stats, power, XP curve
      rng.ts              Seeded deterministic RNG
      battle.ts           Shared auto-battle engine
      wallet.ts           Guarded gold/gem/material mutations
      gacha.ts            Banner tables and pity rolls
      zones.ts idle.ts    Zone definitions and offline expedition resolution
      progression.ts      Upgrade tiers and costs
      rating.ts           Elo, tiers, daily attack quota
      market.ts           Price validation and marketplace rules
  styles/globals.css      Tailwind v4 theme tokens and retro utilities
```

Server-side game rules live in `src/server/game/*` as pure functions with unit
tests; tRPC routers stay thin. Every mutation validates its input with zod, uses
`protectedProcedure`, and re-checks creature status inside its transaction so an
idle cat can never be spent twice.

## Sprints

The MVP was built in six sprints — see [`sprints/`](./sprints):

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
locks) that every sprint respects.
