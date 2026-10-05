# HaduMon — Roguelike Rebuild Overview

HaduMon is being rebuilt from an idle gacha collector into a roguelike engine-builder. A run is a gauntlet of six short matches against scripted rivals. A match uses base-game Wingspan mechanics: three habitat rows, one action a turn, row powers that chain right to left, shrinking rounds, round goals.

Sprints 00–07 describe the old game and are history. Where they disagree with this file, this file wins. `PRODUCT.md` is current.

## What is gone

Gacha, banners and pity; idle expeditions and zones; auto-battle; levels, XP and upgrade tiers; gold, gems and shards; the PvP ladder and defense teams; market listings and trades; owned-creature rows. There is no currency and no wallet.

## Sprint order

| # | File | Mode | Depends on |
|---|------|------|-----------|
| 09 | `09-foundation.md` | sequential | — |
| 10 | `10-engine.md` | sequential (main session) | — |
| 11 | `11-run-ui.md` | parallel | 09, 10 |
| 12 | `12-art-codex-home.md` | parallel | 09, 10 |
| 13 | `13-landing-docs.md` | sequential | 11, 12 |

09 and 10 ran at the same time, as 11 and 12 do, in the same working tree with disjoint files. An agent must not edit files owned by another sprint.

## Domain rules

### Vocabulary

- **Cat**: a card. 26 exist, defined in `src/server/game/cats.ts`.
- **Cat food** (`essence` in the code): the resource cats cost. Five kinds, one per element: Beef (`flame`), Fish (`mist`), Chicken (`volt`), Dry food (`thorn`), Pork (`shade`), plus a Treat (`wild`), which pays for anything. Any 2 food pay for 1 element pip the player can cover with neither that food nor a Treat; the player chooses which two.
- **Yarn**: laid on cats; each is worth a point and is spent to play cats into later columns.
- **Rows**: `hunt` (take food from the feeder), `den` (lay yarn), `prowl` (draw cats).
- **Feeder**: five six-sided dice, one face per food plus a Treat face.
- **Tray**: three face-up cats from the player's own deck.
- **Rival**: the scripted opponent. It flips one action card after every player turn.
- **Relic**: a run-long passive.
- **Clan**: a starter deck built around one element.

### Match

- Board: 3 rows of 4 slots. Yarn cost to play into column 1–4: 0 / 1 / 1 / 2.
- 3 rounds of 5 / 4 / 3 turns. A turn is exactly one of: play a cat, activate Hunt, activate Den, activate Prowl.
- Activating a row gives its base reward by the number of cats in it (Hunt 1/1/2/2/3 dice, Den 2/2/3/3/4 yarn, Prowl 1/1/2/2/3 cats), then fires each "when activated" power in that row from right to left. Hadu, the one cat with the encore power, then fires every other "when activated" cat in his row a second time, right to left; two Hadus do not set each other off.
- Power timings: when played, when activated, between turns (reacts to a rival action), end of round.
- A legendary's relic: each legendary also has a lasting effect for as long as it is on the board, printed on its card as "Relic: from now on, ...". Hadu brings 1 Treat at the end of each of the player's turns, starting with the turn that plays him. Nyxaroth takes 1 food off the cost of every cat played after it (the last pip of the cost; a 1-food cat is free). Aurelynx adds 1 to every lane's reward. Two of the same stack. The code calls this `aura`, because a relic there is already the kind a run carries from match to match.
- Setup: the player is dealt 5 cats and one of each food and keeps any 5 in total.
- One goal per round. The higher count takes 4 / 5 / 6 points, the lower 1 / 2 / 3.
- Final score: cat points + yarn + cached food + tucked cats + goal points + relic bonuses. The player wins by scoring strictly more than the rival.

### Run

- Pick a clan, then 6 matches. Matches 3 and 6 are bosses.
- After a win: add 1 of 3 offered cats (or skip), and optionally trim one card from the deck (never below 12). After matches 1, 3 and 5: also choose 1 of 3 relics.
- Every clan starts with its own relic.
- Losing a match ends the run. One active run per account.
- Between runs only unlocks persist (cats, relics, clans).

### Engine contract

- The engine is pure and deterministic. All randomness comes from `createRng` in `src/server/game/rng.ts`, seeded per step.
- The server is authoritative. The client never holds the deck order, the rival's deck, or the seed; it receives a redacted view.
- Routers stay thin: load the run row `FOR UPDATE`, check `version`, call the engine, persist.

## File ownership

| Sprint | Owns |
|--------|------|
| 09 | Deleting the old game; `src/server/db/**`; `drizzle/**`; `src/server/api/root.ts`; `src/server/api/routers/auth.ts`; stub `routers/{run,codex}.ts`; `src/server/game/elements.ts` (+test); `src/app/**` (stubs for `/run` and `/codex`); `src/components/AppShell.tsx`; `src/components/ui/**`; `src/components/PixelSprite.tsx`; `src/components/sprites/**`; `src/components/landing/**` (minimal placeholder); `package.json` scripts |
| 10 | `src/server/game/{cats,match,rival,goals,relics,run,unlocks,view,sim}.ts` (+tests); `src/server/api/routers/{run,codex}.ts`; `src/components/cats/**`; `sprints/**`; `PRODUCT.md` |
| 11 | `src/app/run/**`; `src/components/run/**` |
| 12 | `src/components/sprites/**`; `src/app/codex/**`; `src/components/codex/**`; `src/app/HomeDashboard.tsx` |
| 13 | `src/components/landing/**`; `src/app/login/**`; `src/app/opengraph-image.tsx`; `DESIGN.md`; `README.md`; `AGENTS.md` |

## Conventions

- Branch `feat/roguelike`. Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`). No co-author lines. `git add` only your own files.
- Every tRPC mutation validates input with zod and uses `protectedProcedure`.
- Game logic lives in `src/server/game/*` as pure functions with colocated Vitest files.
- Strict TypeScript, no `any`. Tailwind only. Mobile-first: everything works at 375px wide.
- Every cat image goes through `<PixelSprite>`.
- Before finishing a sprint: `pnpm check` and `pnpm test` pass for the files you own. Do not leave TODOs for your own scope.
- Local Postgres only. Never run a database command against anything that is not `localhost`.
