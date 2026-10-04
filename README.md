# HaduMon

A web-based **roguelike engine-builder** about feline "Fakemon".

A run is a gauntlet of **six short matches** against scripted rivals. In a match
you play pixel-art cats into three habitat rows and activate a row to take its
reward and fire every cat's power in it, right to left, in the manner of
base-game Wingspan. Win a match and a cat or a relic joins your deck. Lose one
and the run is over. Only unlocks carry between runs.

There is no gacha, no idle play, no currency and no multiplayer.

## How a match plays

- **The board** is three rows of four slots: **Hunt** takes food dice from
  the feeder, **Den** lays yarn on your cats, **Prowl** draws cats from the tray
  or your deck.
- **A turn** is one action: play a cat from your hand, or activate a row. An
  activated row pays its base reward, which grows with the cats in it, then
  fires each "when activated" power from right to left.
- **Cats** cost cat food: Beef, Fish, Chicken, Dry food and Pork, one for each
  element, plus a Treat that pays for anything. Any 2 food pay for 1 you lack,
  and you pick the two. Later columns also cost yarn. Yarn, cached food and
  tucked cats are each worth a point, and tapping a cat on the board shows the
  cats tucked under it.
- **Three rounds** of 5, 4 and 3 turns. Each round ends with a goal, scored
  against the rival.
- **The rival** flips one card from a ten-card deck after every turn: bank a
  cat, stash yarn, raid the feeder, burn a tray card, or push the round's goal.
- **You win** by outscoring it after the twelfth turn.

## How a run plays

- Pick a **clan**: a 16-card starter deck built around one element, plus that
  clan's relic.
- Six rivals in a fixed order, with **bosses at 3 and 6**.
- After each win, add one of three offered cats (or skip) and optionally trim a
  card. After matches 1, 3 and 5, also choose a **relic**, a run-long passive.
- The board resets every match; the deck and relics carry through.
- Finished runs unlock new cats, relics and clans. Nothing makes a later run
  stronger from the start.

## At the table

The match is laid out as a table: the rival across the top, the shared supply
(feeder, tray, deck) in the middle, your mat of three lanes, and your hand
docked at the bottom edge. After each action the turn is played back one step
at a time: the lane's cats fire from right to left, then the rival's card
flips. Any click or key skips to the end, and reduced motion lands it at once.

Keys, where there is a keyboard: `1`-`9` pick a hand card (or a die, tray card
or cat while a lane is being resolved), `H` `D` `P` activate a lane or play the
picked card into it, `Enter` confirms, `Esc` backs out.

## Stack

- **Next.js 15** (App Router) + **TypeScript** (strict, no `any`)
- **tRPC v11** + TanStack Query + superjson
- **Drizzle ORM** with the `postgres` driver, against a **local Postgres**
- **Tailwind CSS v4** (theme tokens in `src/styles/globals.css`)
- **Vitest** for the game engine
- Package manager: **pnpm**

Auth is custom: `scrypt` password hashing plus an opaque session cookie
(`hadumon_session`) backed by a `sessions` table. No NextAuth.

## Running it

Requires Node 20+, pnpm and a local Postgres you can connect to as `postgres`.

```bash
createdb -h localhost -U postgres hadumon   # once
cp .env.example .env                        # DATABASE_URL
pnpm install
pnpm db:migrate                             # create the tables
pnpm db:seed                                # the demo account
pnpm dev
```

Then open <http://localhost:3000>. Sign up, or sign in as `demo` / `demo1234`.

`pnpm db:seed` is idempotent. To start over completely:

```bash
dropdb -h localhost -U postgres hadumon && createdb -h localhost -U postgres hadumon
pnpm db:migrate && pnpm db:seed
```

## Deploying

Production (Vercel + Neon) applies migrations on every deploy: the
`vercel-build` script runs `drizzle-kit migrate` before `next build` (over
`DATABASE_URL_UNPOOLED` when the Neon integration provides it). After changing
the schema:

```bash
pnpm db:generate        # writes drizzle/NNNN_*.sql + meta/
git add drizzle && git commit
```

Migration `0001_drop_old_game` removes the tables of the earlier idle game.
Deploying it deletes that game's data for every account; logins survive.

The demo account is not created on deploy; seed it once by hand:

```bash
vercel env pull .env.production.local --environment production
pnpm db:seed:prod
```

`NEXT_PUBLIC_SITE_URL` (optional, see `.env.example`) sets the origin that the
Open Graph and Twitter card URLs resolve against.

## Scripts

| Script                                    | What it does                                                    |
| ----------------------------------------- | --------------------------------------------------------------- |
| `pnpm dev`                                | Next dev server (turbo)                                         |
| `pnpm build` / `pnpm start`               | Production build / serve                                        |
| `pnpm check`                              | `next lint` + `tsc --noEmit`: the gate before any commit        |
| `pnpm typecheck`                          | Type check only                                                 |
| `pnpm lint` / `pnpm lint:fix`             | ESLint                                                          |
| `pnpm test`                               | Vitest, single run                                              |
| `pnpm test:watch`                         | Vitest in watch mode                                            |
| `pnpm db:generate`                        | Write a SQL migration in `drizzle/` from the schema (commit it) |
| `pnpm db:migrate`                         | Apply committed migrations (runs automatically on Vercel)       |
| `pnpm db:push`                            | Push the schema straight to a scratch database                  |
| `pnpm db:seed`                            | Create the demo account                                         |
| `pnpm db:seed:prod`                       | Same seed against `.env.production.local` (see Deploying)       |
| `pnpm db:studio`                          | Drizzle Studio                                                  |
| `pnpm format:write` / `pnpm format:check` | Prettier                                                        |

## Layout

```
src/
  app/
    page.tsx              Landing (signed out) or home (HomeDashboard.tsx)
    login/  signup/       Auth forms (render without the app shell)
    run/                  The game: clan pick, match, reward, summary
    codex/                Every cat, relic, clan and rival; locked or not
  components/
    AppShell.tsx          Sidebar, top bar and mobile nav
    PixelSprite.tsx       Inline-SVG renderer for the 16x16 cat sprites
    PixelIcon.tsx         The same renderer for the tabletop's 8x8 icons
    sprites/              Sprite and icon grids, element/rarity palettes
    cats/                 CatCard, the food icons (EssencePip) and ElementMark
    run/  codex/          Screen components
    ui/                   Button, Panel, Stat, Modal, badges, Toast, Skeleton
  server/
    api/                  tRPC root, context, routers (auth, run, codex)
    auth/                 scrypt hashing + session cookie helpers
    db/                   Drizzle client, schema/ (users, sessions, runs,
                          unlocks), seed.ts
    game/                 The engine: pure, seeded, unit tested
      cats.ts             The 25 cats and their powers, as data
      match.ts            One match: actions, powers, rival turn, goals, score
      rival.ts            The six rivals and their action decks
      goals.ts            Round goals
      relics.ts           Relics and the rule changes they make
      run.ts              The gauntlet: clans, rewards, match-to-match flow
      unlocks.ts          What a finished run unlocks
      view.ts             The redacted state the client is allowed to see
      sim.ts              Bots used to tune the numbers
      rng.ts              Seeded deterministic RNG
  styles/globals.css      Tailwind v4 theme tokens and utilities
```

The engine is a pair of pure state machines. `applyAction(state, action)` never
mutates its input and draws all randomness from an RNG seeded by the run seed
and a step counter, so a state and an action always give the same result. The
server is authoritative: the client receives `toRunView(state)`, which leaves
out the deck order, the rival's deck and the seed. Routers stay thin: lock the
run row, check its `version`, call the engine, persist.

## Sprints

[`sprints/08-roguelike-overview.md`](./sprints/08-roguelike-overview.md) holds
the rules and conventions of the current game, and
[`sprints/10-engine.md`](./sprints/10-engine.md) is the engine and API
reference. Sprints 00 to 07 describe the earlier idle game and are kept as
history.
