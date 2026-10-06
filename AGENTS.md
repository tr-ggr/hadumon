# HaduMon

HaduMon is a web-based roguelike engine-builder about feline-inspired "Fakemon" (Flameclaw, Mistpaw, Voltwhisk and 99 more). The player builds a deck of 32 cats from a collection, and a run is a gauntlet of six matches to take that deck back: the rivals steal eight of its cards as a run begins, a chest at the foot of their tower holds one relic to take, and each rival beaten gives one stolen card back. A rival plays the same game on a board of its own, chosen for by a bot. In a match each side plays cats into three habitat rows (Hunt, Den, Prowl) and activates a row to take its reward and fire every cat's power in it from right to left, turn about over four rounds of eight, seven, six and five turns each, in the manner of base-game Wingspan. A rival gets no head start on any tier; a harder tier only has it play at a higher level. Losing a match ends the run.

Every rival match pays coins the moment it ends, won or lost, multiplied by how high up the tower it was, and they stay on the account however the run ends. Coins open packs in the shop: five cat packs, one an element, and two cosmetic packs. Cats go into the collection the deck is built from; cosmetics dress the player's hadu (their avatar and profile), their board and cloth, and the tower. Coins are only ever earned by playing: nothing is sold for money, and there is no idle play and no multiplayer. How coins are worked out stays on the server (`src/server/game/payout.ts`); a player is only ever shown what each match paid, its floor's factor and the run's total.

`PRODUCT.md` describes the product, `sprints/08-roguelike-overview.md` the rules, `sprints/10-engine.md` the engine and API, `sprints/14-real-rival.md` the rival (its bot, its levels and the measurements they were first set from), and `sprints/15-coins-packs-decks.md` coins, packs, the deck, the stolen-deck run and the four-round match, with what was measured for them.

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
- Never import `src/server/game/payout.ts` from anything a browser loads, and never send a client more of a match's coins than what it paid and its floor's factor.
