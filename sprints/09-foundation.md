# Sprint 09 — Foundation: remove the old game

Read `sprints/08-roguelike-overview.md` and `PRODUCT.md` first.

Goal: the old game is gone, the app compiles and runs with a minimal shell, and the data layer for runs exists. The match engine and the real game screens are built by other sprints.

## Do not touch

`src/server/game/{cats,match,rival,goals,relics,run,unlocks,view,sim}.ts` and their tests, `sprints/**`, `PRODUCT.md`. The main session is writing these while you work. If `pnpm check` reports errors only inside those files, ignore them and say so in your report. `src/server/game/cats.ts` and a stub `src/server/game/run.ts` (exporting `RunState`) already exist; import from them, never edit them.

## 1. Delete

- Routers: `src/server/api/routers/{gacha,adventure,battle,market,creatures}.ts`.
- Game modules and their tests: `src/server/game/{battle,economy,gacha,idle,market,progression,rating,stats,wallet,zones,species}.ts`.
- Schema files: `src/server/db/schema/{creatures,gacha,adventure,battle,market}.ts`.
- Seeds: `src/server/db/{seed-battle,seed-market}.ts` and their `package.json` scripts.
- Routes: `src/app/{summon,adventure,battle,market,collection}/`.
- Components: `src/components/{gacha,adventure,battle,market}/`, `src/components/CreatureArt.tsx` (+test), `src/components/ui/CreatureCard.tsx`.
- Assets: every file in `public/creatures/` and `public/screenshots/`.

Everything that imported `~/server/game/species` now imports from `~/server/game/cats` (`CATS`, `CAT_LIST`, `getCat`, `Cat`, `Rarity`, `RARITIES`, `RARITY_LABELS`, `Archetype`).

## 2. `src/server/game/elements.ts`

Keep `ELEMENTS`, `Element`, `ELEMENT_LABELS`, `isElement`. Remove the damage wheel and the material helpers. Update `elements.test.ts` to match.

## 3. Data

- `src/server/db/schema/auth.ts`: drop `gold`, `gems`, `rating`, `isBot` from `users` and the rating index.
- New `src/server/db/schema/runs.ts`:
  - enum `hadumon_run_status`: `active`, `won`, `lost`, `abandoned`.
  - `runs`: `id` uuid pk, `userId` uuid fk → users (cascade), `status` (default `active`), `clanId` text, `seed` text, `version` integer default 0, `state` jsonb `$type<RunState>()` not null (type from `~/server/game/run`), `matchesWon` integer default 0, `score` integer default 0, `startedAt` timestamptz default now, `endedAt` timestamptz null. Index on `(userId, startedAt)`. Partial unique index `runs_one_active_per_user` on `userId` where `status = 'active'` (copy the pattern from the old `expeditions_one_active_per_user`).
  - `unlocks`: `userId` uuid fk → users (cascade), `kind` text, `key` text, `unlockedAt` timestamptz default now. Primary key `(userId, kind, key)`.
- Migrations: `drizzle-kit generate` asks interactive rename questions when tables are dropped and created in one step. Avoid the prompt by generating twice: first with the old tables removed and no new ones (drops only), then again after adding `runs.ts` (creates only).
- Check that `DATABASE_URL` in `.env` points at `localhost` before running any database command. The local database is disposable: drop and recreate it, then `pnpm db:migrate` and `pnpm db:seed` must succeed.
- `src/server/db/seed.ts`: only the `demo` account (keep its existing username and password). No bots.

## 4. API

- `root.ts`: register `auth`, `run`, `codex`. Remove the stale "ship as stubs" comment.
- `auth.signup` creates the user and session only. `auth.me` returns `{ user }` with no wallet.
- Stub `routers/run.ts` with `current` (protected query returning `null`) and stub `routers/codex.ts` with `get` (protected query returning `{ cats: CAT_LIST }`). Sprints 11 and 12 replace these.

## 5. Pixel sprites

- Restore the renderer from git: `git show '8a9d494^:src/components/PixelSprite.tsx'`. Keep `buildRuns`. Change it to read a per-cat grid from `src/components/sprites/cats.ts` and to use `getCat`.
- `src/components/sprites/palettes.ts` already has `spriteColors`; import `Rarity` from `~/server/game/cats`.
- New `src/components/sprites/cats.ts`: `SPRITE_SIZE = 16`, the legend, `BASE_SPRITE`, `SPRITE_PATCHES`, and `catSprite(catId): readonly string[]`, which applies a cat's patches to the base and returns the base unchanged for a cat with no patches yet. Sprint 12 draws the other 20.

Legend: `.` transparent, `o` outline, `1` fur, `2` secondary fur, `3` accent, `e` eye, `w` white. A patch is `[row, column, pixels]`.

```ts
export const BASE_SPRITE = [
  "................",
  ".oo..........oo.",
  "o11o........o11o",
  "o121oooooooo121o",
  "o11111111111111o",
  "o11111111111111o",
  "o11we111111we11o",
  "o11ee111111ee11o",
  "o1111ww33ww1111o",
  ".o111wwooww111o.",
  "..oooo1111oooo..",
  "....o122221o.oo.",
  "....o122221oo11o",
  "....o1122111111o",
  "....o11oo11oooo.",
  ".....oo..oo.....",
] as const;

export const SPRITE_PATCHES: Record<string, readonly SpritePatch[]> = {
  flameclaw: [[0,7,"oo"],[1,6,"o33o"],[2,5,"o3223o"],[3,6,"3333"],[12,13,"33"]],
  mistpaw: [[4,7,"22"],[5,6,"2222"],[14,5,"ww"],[14,9,"ww"],[12,13,"ww"]],
  voltwhisk: [[2,1,"33"],[2,13,"33"],[4,8,"3"],[5,7,"3"],[7,1,"3"],[7,14,"3"],[8,1,"33"],[8,13,"33"],[12,13,"33"]],
  thornkit: [[0,8,"oo"],[1,7,"o33o"],[2,6,"o32o"],[5,2,"2"],[5,13,"2"],[12,13,"22"]],
  nyxaroth: [[0,5,"o"],[0,10,"o"],[1,4,"owo"],[1,9,"owo"],[2,4,"owo"],[2,9,"owo"],[3,5,"w"],[3,10,"w"],[4,7,"ee"],[5,2,"3333"],[5,10,"3333"],[6,2,"3"],[6,5,"3"],[6,10,"3"],[6,13,"3"],[7,2,"3"],[7,5,"3"],[7,10,"3"],[7,13,"3"],[12,13,"33"]],
};
```

- Test `src/components/sprites/cats.test.ts`: every cat in `CAT_LIST` resolves to 16 rows of 16 legend characters, and every patch stays in bounds.
- The mascot everywhere (home, auth, OG image) is the Flameclaw sprite.

## 6. Shell and pages

- `AppShell`: `NAV_ITEMS` is Home (`/`), Play (`/run`), Codex (`/codex`). Remove the wallet chips. The mobile bar shows the three items with no More sheet; keep a reachable Log out on both desktop and mobile, behind an explicit confirm step rather than a one-click logout on the display name.
- New `src/components/ui/Modal.tsx`: one accessible dialog (`role="dialog"`, `aria-modal`, Escape and backdrop close, focus moved in and restored). Export it from `ui/index.ts`.
- `src/app/page.tsx` signed in → `HomeDashboard`: a minimal home with the mascot, one primary action linking to `/run`, and a link to `/codex`. Sprint 12 builds the real one.
- `src/app/run/page.tsx` and `src/app/codex/page.tsx`: server pages rendering a client view that calls the stub query and shows a short "coming soon" panel.
- Landing (`src/components/landing/**`): reduce to a single placeholder section with the wordmark, the Flameclaw sprite, one line ("A roguelike engine-builder about cats. Six rivals. Twelve turns each."), and Sign up / Log in. Delete the widgets that used the gacha engine. Sprint 13 builds the real landing.
- Auth: signup redirects to `/run`. Replace copy that mentions gems, gold, summoning, or starter cats.
- `layout.tsx` metadata and `opengraph-image.tsx`: describe the new game. The OG image draws the Flameclaw sprite from rects, or is text-only if `ImageResponse` cannot render it.
- `src/styles/globals.css`: remove classes that only the deleted screens used. Leave the tokens alone.

## Done when

- `rg -n "gacha|gems|gold|expedition|species|wallet|shard|pity|ladder|listing" src` returns nothing outside the engine-owned files, apart from unrelated words.
- `pnpm check` and `pnpm test` pass (outside the engine-owned files).
- `pnpm db:migrate` and `pnpm db:seed` succeed on a fresh local database.
- `pnpm dev`: signed out, `/` shows the placeholder landing; sign up lands on `/run`; `/` signed in, `/run` and `/codex` render at 375px and at desktop width with no console errors; log out works.
- Commit in small conventional commits. No co-author lines. `git add` only files this sprint owns.

Report: what you deleted, the migration file names, anything you could not verify, and any engine-file errors you ignored.
