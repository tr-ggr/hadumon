# Sprint 01 — Foundation

**Mode:** sequential (blocks all other sprints). Read `00-overview.md` first.

## Goal

A running T3 app with auth, the complete DB schema, the species catalog, pixel sprites, the shared battle engine, a retro app shell, the Collection page, and stubs for every later feature so Sprints 02–05 can run in parallel without touching shared files.

## Tasks

### 1. Scaffold
- From the repo root (which already contains `CLAUDE.md`, `README.md`, `sprints/`), run:
  `pnpm create t3-app@latest . --CI --trpc --drizzle --tailwind --dbProvider postgres --appRouter --noGit --noInstall`
  If it refuses a non-empty directory, scaffold into a temp dir and move files in (preserve existing `CLAUDE.md`, `README.md`, `sprints/`, `.git`).
- `pnpm install`. Add `vitest` (+ `@vitest/coverage-v8` not needed) and `tsx`. Scripts: `"test": "vitest run"`, `"test:watch": "vitest"`, `"db:seed": "tsx src/server/db/seed.ts"`, keep `check`, `typecheck`, `db:push`.
- `vitest.config.ts` with `@/` alias matching tsconfig paths (`~/*` is the T3 default — keep whatever the scaffold uses and be consistent).
- `.env`: `DATABASE_URL="postgresql://postgres@localhost:5432/hadumon"`, `SESSION_SECRET="dev-only-change-me"`. Mirror into `.env.example`. Add both to `src/env.js`.
- `createdb -h localhost -U postgres hadumon` (ignore if exists).

### 2. Schema (`src/server/db/schema/`)
Use `pgTableCreator` with prefix `hadumon_`. Files and tables:

- `auth.ts`: `users` (id uuid pk, username unique citext-ish (store lowercase + display name), passwordHash, gold int default 500, gems int default 1000, rating int default 1000, isBot bool default false, createdAt), `sessions` (id text pk (random 32 bytes hex), userId fk, expiresAt).
- `creatures.ts`: `creatures` (id uuid pk, ownerId fk users, speciesId text, nickname text nullable, level int default 1, xp int default 0, upgradeTier int default 0, status enum `idle|expedition|listed|trading` default idle, obtainedAt, obtainedVia text `starter|gacha|trade|market`), `materials` (userId fk, element enum, amount int, pk (userId, element)).
- `gacha.ts` (STUB, Sprint 02 fills): export at least `pullHistory` skeleton or an empty file with a comment — but it must exist and be re-exported.
- `adventure.ts` (STUB, Sprint 03), `battle.ts` (STUB, Sprint 04), `market.ts` (STUB, Sprint 05): same treatment. Each stub exports nothing but a comment `// Owned by Sprint 0X`. `index.ts` does `export * from "./auth"` etc. for all six. Stubs must not break `drizzle-kit push`.
- Shared enums (`elementEnum`, `rarityEnum`, `creatureStatusEnum`) live in `creatures.ts`.

### 3. Auth (`src/server/auth/`)
- `password.ts`: `hashPassword`, `verifyPassword` using `crypto.scrypt` with random salt, timing-safe compare.
- `session.ts`: `createSession(userId)`, `validateSession(token)`, `deleteSession`, cookie name `hadumon_session`, httpOnly, sameSite lax, 30 days. Read via `cookies()` from `next/headers`.
- `src/server/api/trpc.ts`: context includes `db` and `user | null`; export `publicProcedure` and `protectedProcedure` (throws UNAUTHORIZED).
- `routers/auth.ts`: `signup({username 3–20 [a-z0-9_], password ≥8})` → creates user, wallet defaults, 3 starter creatures (one each of a common flame/mist/volt species), session; `login`, `logout`, `me` (returns user without hash + wallet).
- Pages `src/app/login/page.tsx`, `src/app/signup/page.tsx` (client forms, redirect to `/` on success). `src/middleware.ts` redirects unauthenticated users from app routes to `/login` (cookie presence check only; real validation in tRPC).

### 4. Game core (`src/server/game/`)
- `elements.ts`: `ELEMENTS`, `elementMultiplier(att, def)` per overview rules, + test.
- `species.ts`: `SPECIES: Record<string, Species>`; `Species = { id, name, element, rarity, archetype, baseStats: {hp, attack, defense, speed, affinity}, flavor }`. ~24 species: 5 elements × (2 common, 1 uncommon, 1 rare) + 3 epic + 2 legendary (mix of elements). Include `flameclaw` (flame, common), `mistpaw` (mist, common), `voltwhisk` (volt, common). Names must be feline-themed. Archetypes: `rogue` (hooded rogue kitten), `bruiser` (armored feline), `familiar` (mystic multi-tailed), `scout`, `mage`, `tank`.
- `stats.ts`: `effectiveStats(species, level, upgradeTier)`, `creaturePower(stats)`, `squadPower(creatures)`, `xpForLevel(level)` (level cap 50, `xpForLevel(L) = 50 * L^1.6` rounded), `applyXp(creature, xp) → {level, xp, leveledUp}`. Tests.
- `rng.ts`: `createRng(seed: string | number)` — mulberry32 or xorshift over a string hash; `rng.next()`, `rng.int(min,max)`, `rng.pick(arr)`, `rng.chance(p)`. Test determinism.
- `battle.ts`: `simulateBattle(teamA: Combatant[], teamB: Combatant[], seed) → BattleResult`. `Combatant = { id, name, speciesId, element, stats: Stats }`. Rules: each round, all living combatants act in descending speed (ties by seeded rng); an actor attacks a random living enemy; damage = `max(1, floor((attack * 1.2 - defense * 0.6) * elementMult * critMult * rng(0.9..1.1)))`; crit chance = `min(0.35, 0.05 + affinity/400)`, crit ×1.5; cap 30 rounds → team with higher remaining HP% wins (tie → A loses). Returns `{ winner: "A"|"B", rounds, log: BattleEvent[], remainingHpA, remainingHpB }`, `BattleEvent = { round, actorId, targetId, damage, crit, targetHpAfter, ko }`. Tests: determinism, winner sanity (stronger team wins), round cap.
- `wallet.ts`: `adjustWallet(tx, userId, { gold?: number, gems?: number })` — single UPDATE with `WHERE gold + delta >= 0` guard, throws `TRPCError BAD_REQUEST "Insufficient gold/gems"` if 0 rows affected; `adjustMaterials(tx, userId, element, delta)` same idea (upsert). `getWallet(db, userId)`.

### 5. Sprites (`src/components/PixelSprite.tsx` + `src/components/sprites/`)
- `sprites/archetypes.ts`: one 32×32 pixel map per archetype as an array of 32 strings of 32 chars. Char legend: `.` transparent, `o` outline, `1` primary fur, `2` secondary fur/pattern, `3` accent (hood/armor/tails), `e` eye, `w` white. Draw recognisable cats: rogue has a hood, bruiser has shoulder armor, familiar has 3 tails, etc. Take care with silhouettes — this is the game's face.
- `sprites/palettes.ts`: per element a palette `{ "1": hex, "2": hex, "3": hex }`, plus per rarity an outline/glow color. `w` = `#fff`, `o` = `#1a1120`, `e` = rarity-tinted.
- `PixelSprite.tsx`: props `speciesId, size?: number (default 64), className?`. Renders an inline `<svg viewBox="0 0 32 32" shape-rendering="crispEdges">` with one `<rect>` per pixel run (merge horizontal runs of the same color to keep DOM small). Add `style={{ imageRendering: "pixelated" }}`. Server-component friendly (no hooks).

### 6. App shell and theme
- `src/styles/globals.css`: Tailwind v4 `@theme` tokens for the retro palette (deep navy bg `#0f0b1e`, panel `#1e1633`, border `#4a3b7a`, accent gold `#f5c542`, mint `#5ef2b2`, pink `#ff6fb5`, text `#efe9ff`), pixel font `Press Start 2P` via `next/font/google` for headings, a body font (e.g. `VT323`) for text. A `.panel` utility: 2px solid border, hard box-shadow `4px 4px 0 #000`, no border-radius.
- `src/components/AppShell.tsx`: top bar (logo "HaduMon", wallet chips gold/gems, username/logout), desktop side nav + mobile bottom nav with 6 items: Home `/`, Summon `/summon`, Adventure `/adventure`, Battle `/battle`, Market `/market`, Collection `/collection`. Highlight active route. Used from `src/app/layout.tsx`; login/signup render without the shell.
- `src/components/ui/`: `Button`, `Panel`, `Stat`, `RarityBadge`, `ElementBadge`, `CreatureCard` (sprite + name + level + rarity + element + power). Keep them small.
- `src/app/page.tsx`: placeholder Home that greets the user and shows wallet + creature count (Sprint 06 replaces it).

### 7. Collection (`src/app/collection/`, `routers/creatures.ts`)
- `creatures.list()` (own creatures with computed stats + power), `creatures.get(id)`, `creatures.rename(id, nickname)`.
- Page: responsive grid of `CreatureCard`s, filter by element/rarity/status, sort by power/level/rarity/newest. Detail drawer/page `/collection/[id]` shows big sprite, stats, xp bar, flavor, status.

### 8. Stubs for Sprints 02–05
Create these so nothing else needs `root.ts` edits later:
- `routers/gacha.ts`, `routers/adventure.ts`, `routers/battle.ts`, `routers/market.ts`: each `createTRPCRouter({ ping: protectedProcedure.query(() => "ok") })`, registered in `root.ts` as `gacha`, `adventure`, `battle`, `market`.
- Pages `src/app/{summon,adventure,battle,market}/page.tsx`: a `Panel` saying "Coming in Sprint 0X".

### 9. Seed (`src/server/db/seed.ts`)
- Idempotent. Creates 5 bot users (`isBot=true`, usernames like `whiskerbot_1`, password `botpass123`) each with 4–6 creatures of assorted rarity/level (levels 5–25) and rating 900–1300. Bots exist so the ladder (04) and market (05) have counterparties; Sprint 04/05 seeds add defense teams/listings for these same bots by username.
- Also creates a demo human account `demo` / `demo1234` with 8 creatures.

### 10. README
Rewrite `README.md`: what HaduMon is, stack, run instructions (from overview), scripts, folder layout, link to `sprints/`.

## Acceptance criteria
- `pnpm check`, `pnpm test`, `pnpm db:push`, `pnpm db:seed`, `pnpm build` all pass.
- Signup → lands on Home with 3 starter cats; Collection shows them with sprites; login/logout work; middleware redirects.
- Battle engine tests prove determinism and sane outcomes.
- All stub routes/pages exist; `root.ts` and `schema/index.ts` will not need edits by later sprints.
- Layout is usable at 375px width (bottom nav) and desktop (side nav).

## Done when
Commit `feat: sprint 01 foundation` (no co-author line).
