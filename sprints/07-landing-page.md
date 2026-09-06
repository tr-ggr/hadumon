# Sprint 07 — Landing page

Mode: **Phase 1 sequential (foundation) → Phase 2 parallel (agents A, B, C, same working tree) → Phase 3 sequential (integration)**. Depends on 01–06 (all shipped).

The deliverable is a public landing page at `/` for logged-out visitors, in the game's existing retro-pixel world, whose hero is a **working summon** run client-side on the real gacha rules. Logged-in players keep the dashboard at `/` exactly as it is.

Read `PRODUCT.md` and `.impeccable/surfaces/src-components-landing-landingpage-tsx.md` (the direction contract) before touching anything. Read `sprints/00-overview.md` for the shared domain rules.

## Non-negotiables

- **No fabricated claims.** No testimonials, player counts, press, ratings, "join thousands", "award-winning", or any number that is not computed from `src/server/game/*` or the seed. Roster counts are *derived* (`SPECIES_LIST.length`, `ELEMENTS.length`, `RARITIES.length`, `ZONES.length`), never typed.
- **No new dependencies.** No framer-motion, no icon packs, no component libs. CSS keyframes, `IntersectionObserver`, and `next/image` only.
- **No new palette, radius, or fonts.** Use the tokens in `src/styles/globals.css` and the palettes in `src/components/sprites/palettes.ts`. Border radius is always 0. Shadows are hard offsets (`4px 4px 0 #000` panels, `3px 3px 0 #000` buttons) plus rarity glows.
- **Motion is stepped.** Use `steps(n, end)` like `src/components/gacha/animations.tsx`; never `ease-in-out` bounce curves. Every animation has a `prefers-reduced-motion` path that keeps the meaning (opacity/state) and drops the spatial movement. Loops (bob, ticker, wheel arrow) stop when offscreen (`IntersectionObserver`) or the tab is hidden.
- **Content visible by default.** Scroll reveals start visible if JS fails: apply the hidden state via a class set from the hook, not in the static markup.
- **Strict TypeScript, no `any`.** Mobile-first: everything works at 375px. Keyboard reachable, visible focus, buttons at least 44px tall on touch.
- Copy voice: dry and wry, the register of the species flavor text. Short sentences. British spelling as in the existing copy ("catalogue", "apologising"). No hype adjectives.
- Do not add co-author lines to commits. Only the phase owner commits (see phases).

## The world, in code

| Thing | Where |
|---|---|
| Tokens (`navy`, `panel`, `panel-hi`, `edge`, `gold`, `mint`, `pink`, `sky`, `ink`, `ink-dim`, `flame`…`shade`) and utilities `panel`, `panel-flat`, `pixel-press`, `text-pixel`, `scanlines` | `src/styles/globals.css` |
| `ELEMENT_PALETTES[e]["1"|"2"|"3"]` (fur mid / light / deep), `RARITY_PALETTES[r].outline|glow|eye` | `src/components/sprites/palettes.ts` |
| `PixelSprite` (hook-free inline SVG; `speciesId`, `size`, `className`, `label`) | `src/components/PixelSprite.tsx` |
| `Button` (`primary|secondary|ghost|danger`, `sm|md`), `Panel` (`title`, `action`), `Stat`, `RarityBadge`, `ElementBadge`, `CreatureCard` | `src/components/ui` |
| `PityBar` (`count`, `threshold`), `RatesTable` (`rates`), `RevealCard` (exported in Phase 1) | `src/components/gacha` |
| Species: `SPECIES_LIST`, `speciesByElement`, `speciesByRarity`, `getSpecies`, `RARITIES`, `RARITY_LABELS`, `RARITY_MULTIPLIER`, `STARTER_SPECIES_IDS` | `src/server/game/species.ts` |
| Elements: `ELEMENTS`, `ELEMENT_LABELS`, `elementMultiplier(att, def)`, `MATERIAL_LABELS` | `src/server/game/elements.ts` |
| Gacha: `getBanner("featured"|"standard", now)`, `getBanners`, `bannerRates`, `rollMulti(banner, rng, pity, n)`, `nextPityCount`, `SINGLE_COST`, `MULTI_COST`, `MULTI_COUNT`, `PITY_THRESHOLD`, `PITY_LEGENDARY_CHANCE` | `src/server/game/gacha.ts` |
| `createRng(seed)` | `src/server/game/rng.ts` |
| Zones: `ZONES` (id, name, description, tier, element, recommendedPower, enemyLevelRange…), `ENCOUNTER_INTERVAL_SEC`, `MAX_OFFLINE_SECONDS`, `WINS_TO_UNLOCK`, `generateEnemies(zone, expeditionId, index)` | `src/server/game/zones.ts` |
| `simulateBattle(teamA, teamB, seed)` → `{ log: BattleEvent[], … }`, `Combatant` shape | `src/server/game/battle.ts` |
| `effectiveStats(species, level, tier)`, `creaturePower`, `squadPower` | `src/server/game/stats.ts` |
| `RATING_TIERS`, `STARTING_RATING`, `ATTACKS_PER_DAY`, `MAX_TEAM_SIZE` | `src/server/game/rating.ts` |
| Screenshots (`desktop-home`, `mobile-home`, `mobile-login`, `mobile-summon`, `mobile-adventure`, `mobile-battle`, `mobile-market`) | `public/screenshots/*.png` |

All `src/server/game/*` modules are pure TypeScript and safe to import from client components. `src/server/auth/*`, `src/server/db/*`, and `~/trpc/server` are server-only.

## Copy anchors (use verbatim so the page reads as one voice)

- Kicker: `IDLE FELINE COLLECTOR`
- H1: `Cats answer the call.`
- Sub: `Summon feline Fakemon, send the squad out to fight while you're away, and come back to the loot. In your browser. Nothing to buy.`
- Preview label under the wallet: `Preview pulls. Nothing here is saved — your real 1000 gems arrive with your account.`
- Empty-wallet button: `Create an account for 1000 real gems`
- Fair play sentence: `Every gem is earned in-game. There is nothing to buy.`
- Final call: `Your first 1000 gems are waiting.`
- Footer line: `Made with pixel cats.`

## Page structure (top to bottom)

1. **LandingHeader** (A) — sticky, `border-edge bg-panel border-b-2`. Wordmark `Hadu` (gold) `Mon` (pink) in `text-pixel text-xs`, exactly as `src/app/login/AuthForm.tsx`. Right: `Log in` (secondary, `href="/login"`), `Create account` (primary, `href="/signup"`).
2. **SummonAltar** (A, client) — `min-h-dvh` hero. Two columns at `lg`, stacked on mobile (altar first on mobile). Copy column: kicker, H1 (`text-pixel`, ~`text-lg sm:text-2xl`, `leading-relaxed`), sub (`text-ink-dim text-xl`), then `RosterStats` (B) strip. Altar column: a `panel` framed like the Spotlight `BannerCard` (gold border, glow of the featured rarity): banner name + description, featured cat `PixelSprite` at 128px with the `land-bob` class, a 2×5 grid (5×2 on desktop) of empty slots (`panel-flat`, `?` in `text-edge`), that fill with `RevealCard`s from `useDemoSummon` at 150ms stagger; `SUMMON ×1 ◆100` (secondary) and `SUMMON ×10 ◆900` (primary, the page's primary action); wallet chip `◆ 2700 preview gems`; `PityBar`; the preview label. When gems < 100 the buttons are replaced by a primary `Link` to `/signup` with the empty-wallet copy. Legendary result: `gacha-legendary` shine on the sprite plus `land-jolt` on the altar panel. The altar panel carries the `scanlines` utility.
3. **RosterStats** (B) — four `Stat`-style tiles: cats, elements, rarity tiers, zones; values computed. Fits in the hero copy column and is reused in FinalCall.
4. **ElementBands** (B) — five full-bleed bands in order flame, mist, volt, thorn, shade. Background `ELEMENT_PALETTES[e]["3"]`, kicker/labels in `["2"]`, rules/edges in `["1"]`. Each band: element kicker (`ELEMENT_LABELS`), the zone of that element (`ZONES.find(z => z.element === e)`), the element's cats from `speciesByElement(e)` sorted by rarity descending as tiles: `PixelSprite` 72px, name in `text-pixel text-[9px]`, `RarityBadge`, flavor text in VT323. Epic/legendary tiles carry `0 0 12px glow` like `RevealCard`. `useReveal` on the tile list (stepped, ≤ 4 staggered). Section title above the bands: `The catalogue` with a one-line intro.
5. **IdleTimeline** (C, client) — title `A day in the life`. Four stops: `09:00 Summon` · `09:05 Send the squad to Whisker Meadows` · `09:06 → 17:00 One encounter a minute` · `17:00 Claim`. The third stop hosts a live ticker: build the starter trio (`STARTER_SPECIES_IDS`, `effectiveStats(species, 5)`) as `Combatant`s vs `generateEnemies(ZONES[0], "landing", n)`, run `simulateBattle` with a fresh seed per encounter, and print the `log` one event per second with stepped HP bars (`transition: width 120ms steps(4)`); loop to the next encounter; pause when offscreen or `document.hidden`; a `Replay` button under reduced motion instead of autoplay. Claim stop lists gold, gems, and `MATERIAL_LABELS[zone.element]` with the line `Up to 8 hours of progress banks while you're away` derived from `MAX_OFFLINE_SECONDS`. Horizontal rail on `lg`, vertical on mobile.
6. **ElementWheel** (B, client) + ladder — SVG wheel of flame → thorn → volt → mist → flame with `+25%` labels, reverse `−25%`, Shade outside with `+10% both ways`; all from `elementMultiplier`. An arrow highlight advances one stop every 900ms in `steps(1)`, paused offscreen. Beside it a ladder list from `RATING_TIERS` (Kitten → Apex with `min` thresholds), `Start at 1000`, `10 attacks a day`, `teams of up to 4`.
7. **FairPlayPanel** (C) — title `Printed rates`. Two `Panel`s, one per banner from `getBanners()`, each with `RatesTable(bannerRates(banner))`, cost line (`◆100 a pull · ◆900 for ten`), pity line (`Guaranteed epic or better after 50 misses; one in four of those is legendary`), ten-pull guarantee (`Every ten-pull holds at least one rare`). Then the fair play sentence, large, in `text-pixel text-gold`.
8. **ProductShots** (C) — title `The game, as it is`. `desktop-home.png` in a `panel` with a fake title bar; the six mobile shots in a horizontal `scroll-snap` row of `panel` "phones" with captions naming the screen. `next/image` with real intrinsic sizes, `sizes` set, lazy.
9. **FinalCall** (C) — `panel` with the final-call copy, `Create account` primary and `Log in` secondary, plus `RosterStats`.
10. **LandingFooter** (C) — wordmark, footer line, `Log in` link.

Also (C): `src/app/opengraph-image.tsx` (1200×630, `ImageResponse` from `next/og`, `export const runtime = "edge"`, alt/size/contentType exports) rendering navy ground, the wordmark in Press Start 2P (vendor `src/app/fonts/PressStart2P-Regular.ttf`, OFL, from the google/fonts repo; Satori needs TTF, not woff2), the tagline, and the starter trio as inline SVG rects from `ARCHETYPE_SPRITES` + `spriteColors` (`src/components/sprites`). Add `metadataBase`, `openGraph`, and `twitter` to `src/app/layout.tsx` metadata using `NEXT_PUBLIC_SITE_URL` (optional client var in `src/env.js`, documented in `.env.example`, fallback `https://hadumon.vercel.app`). Look up `next/og` specifics with Context7: `npx ctx7@latest docs /vercel/next.js/v15.1.8 "<question>"`.

## Phase 1 — foundation (sequential; owner commits)

Files: `src/middleware.ts`, `src/server/auth/session.ts`, `src/app/layout.tsx`, `src/components/AppShell.tsx`, `src/app/page.tsx`, `src/app/login/AuthForm.tsx`, `src/components/gacha/PullReveal.tsx`, `src/styles/globals.css`, `src/components/landing/{LandingPage,LandingSection,useDemoSummon}.ts(x)`, plus one placeholder export per Phase 2 file so `LandingPage` compiles.

- Middleware: `PUBLIC_ROUTES = ["/", "/opengraph-image"]`; logged-out on a public route passes through; everything else unchanged.
- `getCurrentUser` wrapped in React `cache()`.
- `layout.tsx` async: `const user = await getCurrentUser()`; `<AppShell authenticated={user !== null}>`.
- `AppShell`: new required prop `authenticated`; bare children when `!authenticated` or on a bare route.
- `page.tsx`: `if (!user) return <LandingPage now={new Date()} />` before the prefetches; `LandingPage` is a server component that computes `getBanner("featured", now)` and passes plain data down.
- `AuthForm`: signup success pushes `/summon`; login success pushes `/`.
- `PullReveal.tsx`: export `RevealCard` taking `RevealCardResult = { speciesId; species: Species; rarity: Rarity; wasPity: boolean; guaranteed: boolean; isNew: boolean; creature: { level: number; power: number } }`; keep `PullReveal`'s look and behaviour identical.
- `useDemoSummon(banner)`: state `{ gems: 2700, pity: 0, results: RevealCardResult[], seen: Set<string> }`; `summon(count: 1 | 10)` → `rollMulti(banner, createRng(crypto.randomUUID()), pity, count)`, cost via `pullCost`, `isNew` from `seen`, `creature` = `{ level: 1, power: creaturePower(effectiveStats(species, 1)) }`. Refuses when gems < cost. Nothing persisted.
- `LandingSection`: `SectionHeading({ kicker, title, intro })` primitive and `useReveal()` returning a ref + `revealed` boolean (IntersectionObserver, once, `rootMargin: "0px 0px -10% 0px"`, honours reduced motion).
- `globals.css` gets a `/* Landing */` block: keyframes `land-bob` (2-frame, `1s steps(2, end) infinite`, translateY 0/−4px), `land-jolt` (`120ms steps(2, end)`, translate 2px), `land-reveal` (`320ms steps(6, end) both`, opacity 0→1, translateY 8px→0), `land-tick` (`160ms steps(4, end)` width), classes `.land-bob`, `.land-jolt`, `.land-reveal`, `.land-hidden` (opacity 0), and a `prefers-reduced-motion` block that removes translate from all four and sets `.land-hidden { opacity: 1 }`.
- Gate: `pnpm check`, `pnpm test`; logged-out `/` renders the skeleton (header + hero copy + placeholder sections); logged-in `/`, `/login`, `/signup` behave as before. Commit `feat: route logged-out visitors to a landing page skeleton`.

## Phase 2 — sections (parallel, same tree; no commits)

| Agent | Owns |
|---|---|
| A | `src/components/landing/LandingHeader.tsx`, `src/components/landing/SummonAltar.tsx` |
| B | `src/components/landing/ElementBands.tsx`, `src/components/landing/ElementWheel.tsx`, `src/components/landing/RosterStats.tsx` |
| C | `src/components/landing/IdleTimeline.tsx`, `src/components/landing/FairPlayPanel.tsx`, `src/components/landing/ProductShots.tsx`, `src/components/landing/FinalCall.tsx`, `src/components/landing/LandingFooter.tsx`, `src/app/opengraph-image.tsx`, `src/app/fonts/PressStart2P-Regular.ttf`, `src/app/layout.tsx` (metadata only), `src/env.js`, `.env.example` |

Do not edit files outside your row. If a foundation helper is missing, write the smallest helper inside your own file. Before writing UI, read `/home/tr-ggr/.claude/skills/impeccable/reference/craft-floor.md`. Finish with `pnpm check` green.

## Phase 3 — integration (sequential; owner commits)

Wire every section into `LandingPage` in the order above; pace the scroll (dense bands → quiet timeline → printed rates → shots → close; more space above a heading than below); one spacing rhythm; 375px pass; keyboard pass; reduced-motion pass (`emulate prefers-reduced-motion`); confirm every loop pauses offscreen; README section `## Landing page`; `.env.example` complete. Gate: `pnpm check`, `pnpm test`, `pnpm build`. Commit `feat: landing page with playable summon altar, element bands, and idle timeline`.

## Running

```bash
pnpm dev            # http://localhost:3000 — log out (or use a private window) to see the landing page
pnpm check          # lint + typecheck
pnpm test           # vitest
pnpm build          # production build
```
Demo account for logged-in checks: `demo` / `demo1234` (seeded by `pnpm db:seed`).
