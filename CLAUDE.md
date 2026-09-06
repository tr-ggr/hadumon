# HaduMon

HaduMon is a web-based, idle creature-collector RPG centered on feline-inspired "Fakemon" that combines low-touch passive progression with active economy and collection loops. The core loop begins with a Gacha Summoning Hub, where players spend earned in-game currency on banners to pull feline creatures across distinct rarity tiers and elemental typings (such as Flameclaw, Mistpaw, or Voltwhisk). Once acquired, players assign their squad to an automated Idle Adventure Mode, sending their feline party through progressive zones that passively generate experience, gold, and upgrade materials over time, resolving encounters via server-calculated auto-battles based on core stats like Speed, Attack, and Affinity without requiring constant user intervention.

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
