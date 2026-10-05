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
- **Tray**: three face-up cats from a seat's own deck. Each seat has its own.
- **Rival**: the opponent across the table. It has a board, a hand, a deck, a tray and food of its own and plays by the player's rules; a bot chooses for it, shown only what its seat can see.
- **Level**: how well a rival plays, 0 to 7 in the code and 1 to 8 on screen. It is the rival's place in the gauntlet plus the tier's rank.
- **Relic**: a run-long passive.
- **Clan**: a starter deck built around one element.

### Match

- Two seats. Each has a board of 3 rows of 4 slots, and its own deck, hand, tray and food. The feeder and the goals are shared. Yarn cost to play into column 1–4: 0 / 1 / 1 / 2.
- 3 rounds of 5 / 4 / 3 turns each, 24 in a match. The seats alternate; the player leads the first round and the lead changes hands every round. A turn is exactly one of: play a cat, activate Hunt, activate Den, activate Prowl.
- Activating a row gives its base reward by the number of cats in it (Hunt 1/1/2/2/3 dice, Den 2/2/3/3/4 yarn, Prowl 1/1/2/2/3 cats), then fires each "when activated" power in that row from right to left. Hadu, the one cat with the encore power, then fires every other "when activated" cat in his row a second time, right to left; two Hadus do not set each other off.
- Trade spots: while a row holds exactly 1 or 3 cats, activating it offers one optional trade on top of its reward. Hunt: discard 1 cat from hand for 1 extra die. Den: spend 1 food for 1 extra yarn. Prowl: spend 1 yarn from a cat the player picks for 1 extra cat. A trade is refused unless the extra can actually be taken, so nobody pays for nothing.
- Power timings: when played, when activated, between turns (answers the other seat's turn once it is finished: Brumefang its Hunt, Gloomtail its Den, Shadewhisker its Prowl, Nyxaroth every turn), end of round (both boards, the round's leader first).
- A legendary's relic: each legendary also has a lasting effect for as long as it is on the board, printed on its card as "Relic: from now on, ...". Hadu brings 1 Treat at the end of each of his own seat's turns, starting with the turn that plays him. Nyxaroth takes 1 food off the cost of every cat played after it (the last pip of the cost; a 1-food cat is free). Aurelynx adds 1 to every lane's reward. Two of the same stack. The code calls this `aura`, because a relic there is already the kind a run carries from match to match.
- Setup: each seat is dealt 5 cats and one of each food and keeps any 5 in total. The rival keeps first, so it cannot answer what the player keeps.
- One goal per round, counted on what each side really has. The higher count takes 4 / 5 / 6 points, the lower 1 / 2 / 3, a tie splits, and a side with nothing towards the goal takes nothing.
- Final score, the same for both sides: cat points + yarn + cached food + tucked cats + goal points + relic bonuses. More points win. Level on points, the match goes to the side with more food left in hand, then to the one with more cats on its board, then to the player.

### Run

- Pick a clan and a difficulty, then 6 matches. Matches 3 and 6 are bosses.
- Difficulty is one of three tiers, and a tier gives the rival nothing: no points, no cards, no food. It adds its rank (Kitten 0, Stray 1, Apex 2) to the level every rival plays at, so a run meets levels 1 to 6, 2 to 7 or 3 to 8 of 8. The same seed deals the same table on all three. A run with no tier is a Kitten run.
- A rival's deck is its clan's 16 starting cards plus one cat for each match already played, picked from the cats the player has unlocked at the rarity a player has typically taken by then. It holds its clan's charm and no other relic.
- On screen the run is a tower of six floors, a rival at each window. Hadu walks in at the foot, goes up a floor after each win, and stands on the roof when the run is won. It is a picture of the gauntlet and changes no rule.
- After a win: add 1 of 3 offered cats (or skip), and optionally trim one card from the deck (never below 12). After matches 1, 3 and 5: also choose 1 of 3 relics.
- Every clan starts with its own relic.
- Losing a match ends the run. One active run per account. A run saved by an older version of the game cannot be read and is closed as abandoned, with the unlocks its won matches earned.
- Between runs only unlocks persist (cats, relics, clans). Every tier earns them. Three rules name a tier: the Loud Bell (beat Madame Mittens on Stray or harder), the Quiet Corner (win a run on Stray or harder), and Hadu (win a run on Apex). Stormsabre is still any won run. An unlock already held stays held.

### Engine contract

- The engine is pure and deterministic. All randomness comes from `createRng` in `src/server/game/rng.ts`, seeded per step.
- The server is authoritative. The client never holds a deck's order, the rival's hand, the cats tucked under the rival's cats, or the seed; it receives a redacted view.
- The rival's bot is a function of what its seat can see (`observe` in `bot/observe.ts`) and an RNG seeded from the match and the step. It never reads the match state, and its thinking is capped by a count of moves tried, never by the clock.
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
