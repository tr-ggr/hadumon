# HaduMon

A web-based **roguelike engine-builder** about feline "Fakemon".

A run is a gauntlet of **six short matches** against rivals who play the same
game across the table. In a match you play pixel-art cats into three habitat
rows and activate a row to take its reward and fire every cat's power in it,
right to left, in the manner of base-game Wingspan. Win a match and a cat or a relic joins your deck. Lose one
and the run is over. Only unlocks carry between runs. Between matches the run
is shown as a grey tower of six floors: Hadu climbs one for every win, past a
rival at each window, to the roof, full screen, with a camera that follows him
up and a title card for whoever he meets.

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
- **Trade spots.** A lane holding exactly one cat or three offers a trade when
  you activate it: a cat from your hand for one more die, a food for one more
  yarn, a yarn for one more cat.
- **Three rounds** of 5, 4 and 3 turns each. Each round ends with a goal,
  scored on what each side really has.
- **The rival** sits across the table with its own deck, hand, food and three
  lanes, and takes a real turn after each of yours under the same rules. It
  shares your feeder, so the dice it takes are gone. You can open its board at
  any time; its hand stays face down. A bot plays it, and the bot is shown only
  what its seat can see.
- **You win** by outscoring it after the twelfth turn. Level on points, the
  match goes to the side with more food left, then more cats, then to you.

## How a run plays

- Pick a **clan**: a 16-card starter deck built around one element, plus that
  clan's relic.
- Pick how hard: **Kitten**, **Stray** or **Apex**. No tier gives a rival a
  point, a card or a food. A rival plays at one of eight levels, its place in
  the gauntlet plus the tier's rank, so on a harder tier the same six rivals
  only think further ahead, and the level is printed on the nameplate.
- Six rivals in a fixed order, with **bosses at 3 and 6**.
- After each win, add one of three offered cats (or skip) and optionally trim a
  card. After matches 1, 3 and 5, also choose a **relic**, a run-long passive.
- The board resets every match; the deck and relics carry through.
- Finished runs unlock new cats, relics and clans. Nothing makes a later run
  stronger from the start. Every tier earns unlocks; three of them ask for a
  harder one: the Loud Bell (beat Madame Mittens on Stray or harder), the
  Quiet Corner (win a run on Stray or harder) and Hadu (win a run on Apex).

## At the table

The match fills the screen, with no app shell around it: five small buttons in
the top right corner set the sound and the music and go Home, to the Codex, and
to Log out. It is laid out as a
table. A rail down the left holds the rival, the three rounds and your turn
(scores, food, the prompt and its confirm); the shared supply (feeder, tray,
deck) and your mat of three lanes are in the centre; the score sheet, relics
and log stand to the right; and your hand is a fan along the bottom edge. Hover
a card, or pick it, and it stands upright with its whole face showing. On a
narrow screen it is one column with the turn and the hand docked at the bottom.
The screens around a match (clan pick, opening hand, reward, summary) are one
1120px column; on a window of 1680x930 or more they are magnified whole, in
half steps from 1.5x, to the largest size the window has room for.
After each action the turn is played back one step
at a time: the lane's cats fire from right to left, then the rival takes its
own turn. Each cat pops as it fires, the points it scored rise off it, and the
score rolls up; a chain speeds up as it runs, and each power sounds one note
higher than the last. Any click or key skips to the end, and reduced motion
lands it at once.

The table has sound and music, made in the browser with the Web Audio API
(there are no audio files). Every screen of a run has its own chiptune and
every rival its own theme. Every press on the table is heard, a press on nothing is a dull knock on the
cloth, a mouse coming onto a button or a card is a short tick, and each of the
26 cats has a voice of its own, played when it is chosen or turned over to
read. The speaker button in the corner cycles full, quiet and off for both; the note button beside it turns the music alone off. Both
choices are kept in the browser. Nothing plays in a background tab.

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

## Accounts

Sign-in is by email and password, through a self-hosted
[Better Auth](https://www.better-auth.com) (the library Neon Auth is built on)
mounted at `/api/auth`. Its tables (`users`, `sessions`, `accounts`,
`verifications`, `rate_limits`) live in our own Postgres under the `hadumon_`
prefix, defined in `src/server/db/schema/auth.ts`; passwords are hashed with
our `scrypt` (`src/server/auth/password.ts`). The config is
`src/server/auth/index.ts`.

- **Sign up** takes a username, an email and a password typed twice. The
  username is only the name a player is shown by: 3 to 20 letters, numbers and
  underscores, not unique and not a way to sign in. The strength meter is
  advice; the one rule is 8 characters. There is no email verification, so
  signing up with an address that is taken says so.
- **Forgot password** emails a link that works once, for an hour, through
  [Resend](https://resend.com). The page answers the same whether or not the
  address has an account. Choosing a new password signs every device out.
- **Without `RESEND_API_KEY` and `EMAIL_FROM`** no email is sent. Outside
  production the link is printed to the server console instead
  (`[auth] Password reset link for …`); in production only a warning is.
- **The demo account** (`demo@hadumon.example` / `demo1234`) is public, so it
  cannot be reset, and the endpoints that would change or delete an account
  (`/update-user`, `/change-password`, `/change-email`, `/delete-user`,
  `/revoke-*`) are switched off for everyone.
- **Rate limits** (production only) are counted in the database: 5 a minute
  per address on sign-in, sign-up and both reset steps.

Server code asks who is signed in with `getCurrentUser()`
(`src/server/auth/session.ts`), which is also what `protectedProcedure` uses;
the browser signs in, up and out with `authClient` (`src/lib/auth-client.ts`).

## Running it

Requires Node 20+, pnpm and a local Postgres you can connect to as `postgres`.

```bash
createdb -h localhost -U postgres hadumon   # once
cp .env.example .env                        # DATABASE_URL, BETTER_AUTH_SECRET
pnpm install
pnpm db:migrate                             # create the tables
pnpm db:seed                                # the demo account
pnpm dev
```

Then open <http://localhost:3000>. Sign up, or press "Use demo account" on the
sign-in page (`demo@hadumon.example` / `demo1234`).

Environment variables (all in `.env.example`, checked by `src/env.js`):

| Variable               | Needed               | What it is                                                        |
| ---------------------- | -------------------- | ----------------------------------------------------------------- |
| `DATABASE_URL`         | always               | The Postgres to use                                               |
| `BETTER_AUTH_SECRET`   | in production        | Signs session cookies; 32+ characters (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL`      | on a custom domain   | The one origin the app is served from; otherwise read per request |
| `RESEND_API_KEY`       | to send reset emails | A Resend API key                                                  |
| `EMAIL_FROM`           | to send reset emails | The sender, on a domain verified with Resend                      |
| `NEXT_PUBLIC_SITE_URL` | no                   | The origin Open Graph and Twitter card URLs resolve against       |

On Vercel the app's origin is worked out from `VERCEL_PROJECT_PRODUCTION_URL`,
`VERCEL_BRANCH_URL` and `VERCEL_URL`, which Vercel sets. Only those exact hosts
are accepted, never `*.vercel.app`: a reset link is built on that origin.

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
Deploying it deletes that game's data for every account.

Migration `0004_auth_clean_break` moves accounts to email sign-in and **deletes
every user**, with their runs and unlocks: the old accounts had a username and
no email to carry over. `0005_better_auth` then adds the new tables. Before the
deploy that carries them:

1. Set `BETTER_AUTH_SECRET`, `RESEND_API_KEY` and `EMAIL_FROM` in Vercel, for
   Production and Preview. The build fails without the secret. `EMAIL_FROM`
   must be on a domain you own and have verified with Resend
   (`hadumon.vercel.app` cannot be).
2. Check which database the Preview environment's `DATABASE_URL` points at.
   Every build migrates, so a preview build against the production database
   deletes the production users.

The demo account is not created on deploy; seed it by hand, once after the
deploy above and on any fresh database:

```bash
vercel env pull .env.production.local --environment production
pnpm db:seed:prod
```

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
| `pnpm selfplay`                           | Bots play each other; writes `sprints/data/14-ladder.json`      |
| `pnpm bench:bot`                          | How many moves each level tries, and how long it takes          |
| `pnpm format:write` / `pnpm format:check` | Prettier                                                        |

## Layout

```
src/
  app/
    page.tsx              Landing (signed out) or home (HomeDashboard.tsx)
    login/  signup/       The signed-out pages (rendered without the app
    forgot-password/      shell); their forms are components/auth/
    reset-password/
    api/auth/[...all]/    Better Auth's route handler
    run/                  The game: clan pick, match, reward, the climb, summary
    codex/                Every cat, relic, clan and rival, locked or not, as a
                          book: it opens by itself, and its pages turn
  components/
    AppShell.tsx          Sidebar, top bar and mobile nav (not on /run, which has its own corner buttons)
    PixelSprite.tsx       Inline-SVG renderer for the 16x16 cat sprites
    RivalSprite.tsx       The same renderer for the six rivals, in coral
    PixelIcon.tsx         The same renderer for the tabletop's 8x8 icons
    sprites/              Cat, rival, icon and tower grids, and their palettes
    auth/                 The sign-in, sign-up, forgot and reset forms, the
                          screen they stand on, and the strength meter
    cats/                 CatCard, the food icons (EssencePip), ElementMark and Habitats (a cat's lanes)
    landing/              The signed-out page: stage frame, crowd, a playable Hunt round
    run/                  Screen components for a run
    codex/                The book: its pages as data (book.ts), a turn as a
                          reducer and a leaf plan (turn.ts), and the components
    run/fx/               Match effects: cue to intents (plan), sampled springs, Web Animations
    run/sfx/              Sound effects: recipes and cat voices as data, the Web Audio engine, click and hover sounds, the volume setting
    run/music/            Music: tracks as data, the bar scheduler, the on/off setting
    ui/                   Button, Panel, Stat, Modal, badges, Toast, Skeleton,
                          and where a dialog comes up from (pop.ts)
  lib/
    auth-client.ts        Better Auth's browser client
    auth/                 Shared by server, middleware and browser: routes and
                          the demo login, form validation, error copy, and
                          the strength estimate (zxcvbn, loaded on demand)
  server/
    api/                  tRPC root, context, routers (auth, run, codex)
    auth/                 The Better Auth config, scrypt hashing, the current
                          user, and the reset email
    db/                   Drizzle client, schema/ (users, sessions, accounts,
                          verifications, rate limits, runs, unlocks), seed.ts
    game/                 The engine: pure, seeded, unit tested
      cats.ts             The 26 cats and their powers, as data
      match.ts            One match for two seats: actions, powers, goals, score
      duel.ts             The driver: the player's action, then the rival's
      bot/                The rival's mind: what its seat sees, eight levels,
                          a style for each rival, and bots playing each other
      rival.ts            The six rivals: a clan and a manner each
      rivalDecks.ts       The deck and the charm each rival brings to a match
      clans.ts            The five starter decks and their relics
      goals.ts            Round goals
      relics.ts           Relics and the rule changes they make
      difficulty.ts       The three tiers: the level each rival plays at
      run.ts              The gauntlet: clans, rewards, match-to-match flow
      unlocks.ts          What a finished run unlocks
      view.ts             The redacted state the client is allowed to see
      rng.ts              Seeded deterministic RNG
  styles/globals.css      Tailwind v4 theme tokens and utilities
```

The engine is a pair of pure state machines. `applyAction(state, action)` never
mutates its input and draws all randomness from an RNG seeded by the run seed
and a step counter, so a state and an action always give the same result. The
server is authoritative: the client receives `toRunView(state)`, which leaves
out both decks' order, the rival's hand and the seed. Routers stay thin: lock the
run row, check its `version`, call the engine, persist.

## Sprints

[`sprints/08-roguelike-overview.md`](./sprints/08-roguelike-overview.md) holds
the rules and conventions of the current game, and
[`sprints/10-engine.md`](./sprints/10-engine.md) is the engine and API
reference.
[`sprints/14-real-rival.md`](./sprints/14-real-rival.md) records how the rival
came to play the game for real: the bot, its eight levels, and the measurements
the gauntlet was set from. Sprints 00 to 07 describe the earlier idle game and are kept as
history.
