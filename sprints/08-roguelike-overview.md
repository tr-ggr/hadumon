# HaduMon — Roguelike Rebuild Overview

HaduMon was rebuilt from an idle gacha collector into a roguelike engine-builder. A run is a gauntlet of six matches against rivals who play the same game. A match uses base-game Wingspan mechanics: three habitat rows, one action a turn, row powers that chain right to left, shrinking rounds, round goals.

Sprints 00–07 describe the old game and are history. Where they disagree with this file, this file wins. `PRODUCT.md` is current. Sprint 15 (`15-coins-packs-decks.md`) brought coins, packs, the built deck, the stolen-deck run and the four-round match; the rules below are as they stand after it.

## What is gone

Banners and pity; idle expeditions and zones; auto-battle; levels, XP and upgrade tiers; gold, gems and shards; the PvP ladder and defense teams; market listings and trades. Sprint 15 brought back one currency, coins, which are only ever earned by playing, and packs to spend them on; nothing is bought with money.

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

- **Cat**: a card. 102 exist, defined in `src/server/game/cats.ts`: for each element 8 common, 5 uncommon, 4 rare, 2 epic and 1 legendary, and beside them Hadu and Stussy, two legendaries drawn from life.
- **Collection**: the copies of each cat an account owns, at most 3 of a cat and 1 of a legendary. Every account starts with 40 cards.
- **Deck**: the 24 cards a player builds from their collection and brings to a run.
- **Coins**: what a finished run pays, and what a pack costs. Earned by playing and in no other way.
- **Pack**: five cats of one element, or two cosmetics the account does not have.
- **Hadu**: besides the cat, the player's avatar: Hadu dressed in the cosmetics they wear.
- **Cat food** (`essence` in the code): the resource cats cost. Five kinds, one per element: Beef (`flame`), Fish (`mist`), Chicken (`volt`), Dry food (`thorn`), Pork (`shade`), plus a Treat (`wild`), which pays for anything. Any 2 food pay for 1 element pip the player can cover with neither that food nor a Treat; the player chooses which two.
- **Yarn**: laid on cats; each is worth a point and is spent to play cats into later columns.
- **Rows**: `hunt` (take food from the feeder), `den` (lay yarn), `prowl` (draw cats).
- **Feeder**: five six-sided dice, one face per food plus a Treat face.
- **Tray**: three face-up cats from a seat's own deck. Each seat has its own.
- **Rival**: the opponent across the table. It has a board, a hand, a deck, a tray and food of its own and plays by the player's rules; a bot chooses for it, shown only what its seat can see.
- **Level**: how well a rival plays, 0 to 7 in the code and 1 to 8 on screen. It is the rival's place in the gauntlet plus the tier's rank.
- **Relic**: a run-long passive.
- **Clan**: one element's deck and charm. Only rivals have a clan now; a player has the deck they built.

### Match

- Two seats. Each has a board of 3 rows of 4 slots, and its own deck, hand, tray and food. The feeder and the goals are shared. Yarn cost to play into column 1–4: 0 / 1 / 1 / 2.
- 4 rounds of 8 / 7 / 6 / 5 turns each, 52 in a match. The seats alternate; the player leads the first round and the lead changes hands every round. A turn is exactly one of: play a cat, activate Hunt, activate Den, activate Prowl.
- Activating a row gives its base reward by the number of cats in it (Hunt 1/1/2/2/3 dice, Den 2/2/3/3/4 yarn, Prowl 1/1/2/2/3 cats), then fires each "when activated" power in that row from right to left. A cat with the encore power (Hadu, Echomere, Afterclap) then fires every other "when activated" cat in its row a second time, right to left; two of them do not set each other off.
- Trade spots: while a row holds exactly 1 or 3 cats, activating it offers one optional trade on top of its reward. Hunt: discard 1 cat from hand for 1 extra die. Den: spend 1 food for 1 extra yarn. Prowl: spend 1 yarn from a cat the player picks for 1 extra cat. A trade is refused unless the extra can actually be taken, so nobody pays for nothing.
- Power timings: when played, when activated, between turns (answers the other seat's turn once it is finished: its Hunt, its Den, its Prowl, or, on three cats, every turn), end of round (both boards, the round's leader first).
- A legendary's relic: each legendary also has a lasting effect for as long as it is on the board, printed on its card as "Relic: from now on, ...". There are three kinds. A Treat at the end of each of its own seat's turns, starting with the turn that plays it (Hadu, Heliopard). 1 food off the cost of every cat played after it, the last pip of the cost, so a 1-food cat is free (Nyxaroth, Canopyx). 1 more on every lane's reward (Aurelynx, Stussy, Tidelune). They stack, so with all three of the last kind and a relic a Den can lay nine yarn; an action may name up to 16 things. The code calls this `aura`, because a relic there is already the kind a run carries from match to match.
- Setup: each seat is dealt 5 cats and one of each food and keeps any 5 in total. The rival keeps first, so it cannot answer what the player keeps.
- One goal per round, counted on what each side really has. The higher count takes 4 / 5 / 6 / 7 points, the lower 1 / 2 / 3 / 4, a tie splits, and a side with nothing towards the goal takes nothing.
- Final score, the same for both sides: cat points + yarn + cached food + tucked cats + goal points + relic bonuses. More points win. Level on points, the match goes to the side with more food left in hand, then to the one with more cats on its board, then to the player.

### Deck, collection and shop

- An account owns copies of cats: the 40 it starts with (3 of each of the 10 original commons, 2 of each of the 5 original uncommons), which are never stored, plus what it has gained since. It never holds more than 3 of a cat or 1 of a legendary.
- A deck is exactly 24 owned cards, at most 3 of a cat and 1 of a legendary. An account has one, built at `/deck`; until it saves one it has a default deck from its starting cards. Saving a deck does not change a run in progress.
- A cat pack is one element's cats, five to a pack: three slots are common (75%) or uncommon (25%), the fourth uncommon (70%) or rare (30%), the fifth rare (70%), epic (24%) or legendary (6%). A cat the account already holds every copy of is paid back in coins by its rarity; a pack held in full pays back less than it costs.
- A cosmetic pack holds two pieces the account does not have, the commoner ones likelier. It cannot be bought once the account has them all.
- A pack is rolled on the server. A press of the button carries an id the browser made up for it, and a request sent twice is answered with the pack the first one opened.
- Coins come only from finished runs. The formula is in `src/server/game/payout.ts`, which never leaves the server; a player sees a run's total and nothing else.

### Run

- Pick a difficulty; the run is played with the saved deck. A deck that is no longer legal is refused, not mended.
- 8 of the 24 cards are stolen as the run begins, so it opens with 16. A chest holds 3 of the relics the account has unlocked, and the player takes 1; a clan's charm is only put in the chest of a deck with 6 or more cats of its element. Both are drawn from a ticket that only moves on once a run has finished a match, so giving a run up at the chest and starting again deals the same chest and the same theft.
- Then 6 matches. Matches 3 and 6 are bosses.
- Difficulty is one of three tiers, and a tier gives the rival nothing: no points, no cards, no food. It adds its rank (Kitten 0, Stray 1, Apex 2) to the level every rival plays at, so a run meets levels 1 to 6, 2 to 7 or 3 to 8 of 8. The same seed deals the same table on all three.
- A rival's deck is the size of the player's by the same match: 16 cards and one more for each match already played. It is drawn from the cats the player owns, to the rarity mix of the deck the player built (every rarity above common rounded down), under the same copy caps. Half of it is its own clan's element, its rarest cards first, and half is not. For a new account that is the clan's old 16-card starter. It holds its clan's charm and no other relic.
- On screen the run is a tower of six floors, a rival at each window. The player's hadu walks in at the foot, goes up a floor after each win, and stands on the roof when the run is won. It is a picture of the gauntlet and changes no rule.
- After a win: take back 1 of 3 stolen cards shown (each a different cat, or fewer if fewer are left), or none, and optionally trim one card from the deck (never below 16). After matches 1, 3 and 5: also choose 1 of 3 relics. No new cat is gained in a run.
- Losing a match ends the run. One active run per account. A run saved by an older version of the game cannot be read and is closed as abandoned; it still pays for the matches it finished.
- A run that ends pays coins, whatever way it ended.
- Unlocks are prizes, each paid once. A relic's rule opens that relic for every chest and reward after it. Eleven cats have a rule too, which hands over one copy: among them Nyxaroth and Aurelynx for a run won with 12 or more Shade or Volt cats in the deck, and Hadu for a run won on Apex. Every cat is also in its element's pack. Three rules name a tier: the Loud Bell (beat Madame Mittens on Stray or harder), the Quiet Corner (win a run on Stray or harder), and Hadu.

### Engine contract

- The engine is pure and deterministic. All randomness comes from `createRng` in `src/server/game/rng.ts`, seeded per step.
- The server is authoritative. The client never holds a deck's order, the rival's hand, the cats tucked under the rival's cats, the seed, or how a run's coins were worked out; it receives a redacted view and a total.
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
