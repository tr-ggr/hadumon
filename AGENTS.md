# HaduMon

HaduMon is a web-based roguelike engine-builder about feline-inspired "Fakemon" (Flameclaw, Mistpaw, Voltwhisk and 23 more). A run is a gauntlet of six short matches against rivals who play the same game on a board of their own, each chosen for by a bot. In a match each side plays cats into three habitat rows (Hunt, Den, Prowl) and activates a row to take its reward and fire every cat's power in it from right to left, turn about over three rounds of five, four and three turns each, in the manner of base-game Wingspan. A rival gets no head start on any tier; a harder tier only has it play at a higher level. Winning a match adds a cat or a relic to the run's deck; losing one ends the run. Only unlocks (cats, relics, clans) persist between runs. There is no gacha, no idle play, no currency, and no multiplayer.

`PRODUCT.md` describes the product, `sprints/08-roguelike-overview.md` the rules, `sprints/10-engine.md` the engine and API, and `sprints/14-real-rival.md` the rival: its bot, its levels and the measurements they were set from.

## Stack

T3 stack: Next.js (App Router) + TypeScript, tRPC, Tailwind CSS, Drizzle ORM, developing against a **local Postgres** database.

Unless the stack above says otherwise, the default stack for this project is the **T3 stack**:

- Next.js (App Router) + TypeScript (strict)
- tRPC for the API layer
- Tailwind CSS for styling
- Drizzle ORM
- **Local Postgres first**: develop against a local Postgres database (`postgresql://localhost:5432/hadumon`). Do NOT set up Neon, cloud databases, or hosting yourself — production binding to Neon + Vercel is handled later by the software factory's deploy wizard.

## Conventions

- Package manager: `pnpm`. Scaffold with `pnpm create t3-app@latest` when starting from scratch.
- Strict TypeScript everywhere; avoid `any`.
- Conventional commits (`feat:`, `fix:`, `chore:`, …). Never add co-author lines to commits.
- Keep secrets in `.env` (git-ignored); maintain an up-to-date `.env.example`.
- Write a short `README.md` early: what the project is, how to run it.
- Before finishing any task: typecheck (and tests, if present) must pass.
