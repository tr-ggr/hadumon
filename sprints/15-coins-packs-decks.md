# Sprint 15 — Coins, packs, decks, the stolen-deck run and four rounds

Until this sprint HaduMon had no currency, no packs and no deck of the player's own: a run began on a clan's fixed 16 cards, a win added a cat or a relic, and only unlocks carried over. This sprint reverses that on purpose. Runs pay coins, coins open packs, packs fill a collection of cats and cosmetics, the player builds a 24-card deck from it, and a run is a fight to take that deck back from the rivals who stole part of it. The player also has an identity, a "hadu" assembled from pieces. Matches are longer, and clans have left the player's side of the game.

Coins are only ever earned. Nothing is sold for money, so "nothing is for sale" is still true and is still said on the public pages.

## Decisions

Settled with the user before the build:

| Topic | Decision |
| --- | --- |
| Coin rate | 1 point = 0.5 coin on a run's points, plus bonuses for what the run did |
| Hidden | The whole formula stays on the server. A player only ever sees the total a run paid |
| Packs | Cat packs hold only cats; cosmetic packs hold only cosmetics |
| Catalogue | 75 new cats and Stussy (ginger, female, legendary): 102 in all |
| Deck | Exactly 32 owned cards, at most 4 of a cat and 1 of a legendary |
| Stolen cards | 8 of the 32 are stolen as a run begins: it opens with 24 and reaches 29 after five wins |
| Win reward | 3 of the cards still stolen are shown; take 1 back. Relic offers after matches 1, 3 and 5 stay. No new cat mid-run |
| Clans | Gone from the player's run. A run opens at a chest of 3 relics to take 1 from |
| Rounds | Four rounds of 8, 7, 6 and 5 turns (26 a seat), with four round goals |
| Rivals | A rival's deck is drawn to the rarity mix of the deck the player built |
| Hadu pieces | Hat, eyes, body, tail, aura |
| Other cosmetics | Board, tablecloth, tower, sky |

Chosen during the build, and open to change:

- A run that is lost or given up pays coins too, for the matches it finished.
- One saved deck an account. Saving it does not change a run in progress.
- A new account owns 40 cards (3 of each of the 10 original commons, 2 of each of the 5 original uncommons) and a default deck of 32 from them.
- The eleven trophy cats keep their unlock rules, which now hand over one copy; they are also in their element's pack.
- A cat past its cap is paid back in coins by rarity. A cosmetic pack never holds a piece the account has, and cannot be bought once it holds none.
- The fourth round's goal pays 7 to the higher count and 4 to the lower.
- The codex has no Clans chapter. Clans stay in the engine for the rivals.
- The player's hadu is the climber on the tower, the figure on the home mat and the picture in the lid.

## The match

- `ROUND_TURNS = [8, 7, 6, 5]`, `GOAL_WIN_POINTS = [4, 5, 6, 7]`, `GOAL_LOSE_POINTS = [1, 2, 3, 4]`. A test holds the three lists to one length: a missing entry used to pay nothing without a word.
- The lead still changes hands every round, so over four rounds each seat leads two.
- `MAX_ACTION_ITEMS = 16`. Three legendaries now add 1 to every lane's reward, and a Den with all three, the Ball of Twine and its trade lays nine yarn; the API had refused a list longer than eight. A test works the largest reward out from the relics and the cats.
- A clan's charm pays 1 point for each cat of its element, not 2. See the measurements.

## The bot

A match of 26 turns is not a match of 12 played for longer: boards fill, and what a turn is worth changes with how many are left.

- What a playout may cost is worked out from the round lengths: the most moves it may make is a whole match for both seats, and the budget it keeps in reserve is the turns the two seats have left.
- The evaluation's weights were measured again at level 4 (300 to 400 matches a variant). The cat a seat could play next and the turns a cat on the board has left count for more (`afford` 0.3 to 0.5, `engine` 0.25 to 0.4), and yarn laid while there are turns to come counts for less (`yarn` 0 to -0.25, faded out over the last three turns). The new weights beat the old in 59% of 400 matches.
- The fixed list (levels 0 to 2) goes to the Den for yarn when the board is full or on its last turn of the match, instead of prowling or hunting for nothing. Level 2 is new: the careful list that gives its last two turns to yarn.
- The two levels that were "one step ahead on points" lost to the fixed list over 26 turns, which at least builds a board: points alone never hunt or prowl. They are now levels 3 and 4: the list for the kind of move and one step ahead, on points (level 4: and the round goal), for which; in the last two rounds the list is dropped and they make whatever move scores the most.
- The top level played 256 playouts to the end of the match. At 26 turns that is about 9,000 moves tried and 110 to 150 ms an answer, against a 60 ms budget. It now plays 96 (`stages: [6, 6, 12]`, cap 6000).
- The table was re-spaced after measuring it: see "The levels" below. Kitten still plays levels 1 to 6 of 8, Stray 2 to 7 and Apex 3 to 8, but what those levels are has moved.

## The run

- `RUN_VERSION = 3`. `RunConfig` is `{ seed, ticket, deck, pool, difficulty }`. A stored run from an older version is closed as abandoned and paid for the matches it finished.
- `startRun` steals `STOLEN = 8` cards with an RNG seeded `${ticket}:theft`, builds the chest from `${ticket}:chest`, and stops in phase `chest` with no match dealt. `openChest(run, relicId)` takes the relic and deals the first match.
- The ticket is `${userId}:${runTicket}`. `runTicket` only goes up when a run ends with a match finished, so giving a run up at the chest and starting again deals the same chest and the same theft. Changing the deck between two attempts does change what is stolen; that is accepted.
- A chest holds 3 of the account's unlocked relics. A clan's charm is only put in for a deck with `CHARM_CATS = 8` or more cats of its element, unless there are too few relics without it.
- `RewardOffer.reclaim` is up to 3 different cats from the cards still stolen. `chooseReward` moves one copy from `stolen` to `deck`.
- `takeChest`, `settleMatch` and `applyReward` are the run's bookkeeping without a match dealt. `playGauntlet`, the measuring harness, is built from them and from `matchConfig`, so it cannot drift from the game.
- A rival's deck (`rivalDecks.ts`) is 24 cards and one more for each match before it. For each rarity above common it holds `floor(size x the player's share of that rarity)` cards; commons make up the rest. Within a rarity it takes its own clan's cats first, a copy of each in turn up to the cap and the one worth most first, then the other clans' the same way, from the cats the player owns. No more than half the deck is its own element (`themeShare`), the rarest cards first: see the measurements. For a new account's first match its own half is the clan's starter cats, which a test pins.
- `MIN_DECK = 16`: a deck is not trimmed below the size a run starts at.
- Unlocks are prizes. Clan rules are gone; a cat's rule hands over one copy as well as going on the ledger; Nyxaroth and Aurelynx ask for a run won with 12 or more Shade or Volt cats in the deck.
- The view sends `stolen` sorted, `reward.reclaim`, and `chest` only while the chest waits. The seed, the pool and the deck as built stay on the server.

## The catalogue

- 102 cats: for each element 8 common, 5 uncommon, 4 rare, 2 epic and 1 legendary, and Hadu and Stussy beside them. The 76 new ones use the powers the game already had: 11 effects, 4 timings, 3 kinds of legendary relic.
- The clans' starter decks are written out as lists, so the larger catalogue changed no rival's deck.
- Sprites: a cat not drawn by hand is put together from a recipe, one part a zone (ears, crown, brow, cheeks, body, tail, side, paws) and one of four coats of its element. No part touches the face and no two zones share a cell. `pnpm sprites:recipes` picks recipes that are far apart; they were then touched up by hand. The nearest two cats of one element differ in 34 cells.
- Voices: a cat's pitch is its place on a ladder of 102 quarter-tone rungs over the range the 26 had, set by element, kind, rarity and id, with Hadu kept on E4. One of four inflections, chosen from the cat's id, tells neighbours apart. Every legendary has a signature of its own.
- Stussy is a Flame legendary with her own ginger palette, markings drawn by hand, and a signature.

## Coins, packs and cosmetics

Pure modules beside the engine:

- `collection.ts`: the starter collection, which is never stored, the copy caps, and adding cards to a collection.
- `deck.ts`: `DECK_SIZE = 32`, `validateDeck(deck, owned)`, the default deck, and each problem as a sentence.
- `packs.ts`: five cat packs, one an element, and two cosmetic packs. A cat pack is five slots: three are common 75% / uncommon 25%, the fourth uncommon 70% / rare 30%, the fifth rare 70% / epic 24% / legendary 6%. `openCatPack` and `openCosmeticPack` are pure functions of the pack and an RNG. A full-collection pack pays back 61.6 coins on average against a price of 100, and a test holds the refund under the price.
- `cosmetics.ts`: 73 pieces over nine slots, one free a slot. Hadu slots hold 8 pack pieces each, table slots 6. The aura slot is `halo` in the code, because `Aura` already names a legendary's rule.
- `payout.ts` (`import "server-only"`): half a coin a point on every tier, and bonuses for wins, each worth more than the one before, for a won run, a high best match, a swept match and cards taken back, all of them worth more on a harder tier. The numbers are in the file and nowhere else: the client is never sent more than a total. Vitest aliases `server-only` to an empty module.
- Prices: a cat pack 100 coins, a cosmetic pack 150.

## Data and API

- Migration `0006_coins_cards_cosmetics`: `profiles (user_id, coins, look, run_ticket)`, `cards (user_id, cat_id, copies)`, `decks (user_id, cards)`, `cosmetics (user_id, cosmetic_id)`, `pack_opens (user_id, request_id unique, result)`, and `runs.coins`. Coins and the look are on `profiles`, not on `users`, which belongs to Better Auth. `0007_drop_run_clan` drops `runs.clan_id`.
- `shop.open({ packId, requestId })` locks the profile row, takes the price with an `UPDATE` that only matches a balance that can pay, rolls the pack on the server, adds the cards, pays back what was not kept, and records the result under the request id. A request sent again is answered with that record.
- `collection.get`, `collection.deck`, `collection.saveDeck`; `profile.get`, `profile.equip`.
- `run.start({ difficulty })` reads the saved deck and checks it again; a deck that is not legal is refused with a sentence that points at `/deck`. `run.openChest({ version, relic })`. A run that closes is paid in the transaction that closes it, and only a run still `active` can be closed. Locks are taken run row first, then profile row.
- `codex.get` reports for each cat the copies owned, the cap, and where an unowned one is found.

## The screens

- The shell has five ways about the app (Home, Play, Deck, Shop, Codex), five across a phone's dock, and the lid shows the player's coins and their hadu, which leads to the profile.
- A run starts on a tier-and-deck screen, then the chest: what was stolen, the hadu walking up to the chest and the relics rising out of it, a recap, and then the climb into the tower. Reduced motion shows the chest open.
- A reward's first step is taking a card back. The end of a run has a coins step showing the total, and the record book on the home page keeps what each run paid.
- `/deck`: the deck as stacks beside the collection; a press on a card adds a copy and a press on a stack takes one out; the rail says what stands in the way of saving.
- `/shop`: the seven packs and the reveal.
- `/profile`: the hadu and what it can wear, and the board, tablecloth, tower and sky.
- Skins: the root layout reads the look and sets `--mat-fill`, `--mat-line`, `--cloth-fill`, `--cloth-shade`, `--cloth-weave`, `--cloth-size` and the stone colours on the body, so the first paint and every dialog are dressed. The tower and its scenery draw their tiles in the worn stone and sky. Every board and cloth is light enough to print on in ink; a test holds the contrast at 7:1.

## What was measured

All of it with `pnpm selfplay` (the numbers are in `sprints/data/15-ladder.json`) and one-off scripts for the questions it does not ask.

### The levels

On plain starter decks with no relics, each pair of deals played twice with the seats swapped. "Scored" is the higher level's mean score and the lower's.

| Level | What it is | Against the level below | Scored |
| --- | --- | --- | --- |
| 0 | The fixed list: play the first cat it can; with no room or no turn left, go to the Den; with no cats, prowl; otherwise hunt | | |
| 1 | The same list with care: its best cat first, the dice its hand needs, the cheapest cats kept | 62.1% of 600 | 43.8 to 41.1 |
| 2 | The same again, giving its last two turns to yarn | 66.2% of 600 | 47.2 to 43.8 |
| 3 | The list for the kind of move and one step ahead on points for which; whatever scores most in the last two rounds | 68.0% of 600 | 52.8 to 48.0 |
| 4 | The same, counting the round goal | 70.4% of 600 | 57.0 to 51.7 |
| 5 | One step ahead with the full evaluation | 59.9% of 600 | 57.8 to 55.1 |
| 6 | Its 3 best moves, each played out twice to the end of the round | 60.7% of 300 | 58.2 to 55.4 |
| 7 | Its 8 best moves and 96 playouts to the end of the match | 55.2% of 300 | 59.3 to 58.3 |

Two levels up, the higher wins 74% to 88% of the time.

How the table came to this:

- With only the round lengths changed, the old levels 2 and 3 ("one step ahead on points") were no better against a charm-holding fixed list than the list itself: they laid 17 yarn on 6 cats where the list put 10 cats down. Giving them the list for the kind of move fixed that.
- The old level 6 (6 moves, 6 playouts each to the end of the match) won 51.9% of 750 against the level below it, and round-limited variants of it 52% to 56% of 200. It is gone.
- 192 playouts won 51.7% of 200 against 96, so a larger budget for level 7 was not the answer the plan hoped for. Level 7 is the one step under the 56% the table was held to; it is worth about a point a match over level 6.
- A fixed list that goes for yarn through its last four or five turns scores as much as level 3. That is why level 2 gives it two turns and no more, and it is the plainest sign of how flat the top of the game is on starter decks: once a seat plays its cats and then lays yarn, there are only three or four points left to find.
- `pnpm bench:bot` answers every position of twelve matches at each level. Level 7 tries 2,328 moves in the middle case, 4,862 in the slowest of twenty and 5,716 at worst, under its cap of 6,000, in 23 ms, 43 ms and 47 ms: inside the 60 ms budget. No level reached its cap. Level 6 takes 1 to 4 ms and the rest under 2.
- The seats are even: with the same bot in both, the player's seat won 47.8% and the rival's 47.2% at level 5, with 5.0% of matches level on points and settled by the tiebreaks.

### The relics

What a relic is worth to the seat that holds it: 600 matches a relic, the same deals played by level 5 in both seats with the relic and without. A charm is measured on its own clan's starter deck.

| Relic | Points | Win rate without, and with |
| --- | --- | --- |
| Ember Charm | +3.9 | 57.8% to 73.9% |
| Tide Charm | +4.9 | 66.9% to 80.8% |
| Spark Charm | +4.1 | 45.4% to 63.7% |
| Briar Charm | +4.7 | 39.9% to 62.0% |
| Dusk Charm | +3.9 | 35.7% to 51.8% |
| Warm Saucer | +1.2 | 51.7% to 55.6% |
| Ball of Twine | +3.1 | 51.7% to 66.2% |
| Bent Whisker | +3.6 | 51.7% to 69.2% |
| Night Map | +3.1 | 51.7% to 69.3% |
| Soft Landing | +3.9 | 51.7% to 67.5% |
| Early Riser | +1.7 | 51.7% to 60.2% |
| Lucky Collar | +2.4 | 51.7% to 74.8% |
| Loud Bell | +2.8 | 51.7% to 66.7% |
| Hoarder's Basket | +4.4 | 51.7% to 68.2% |
| Quiet Corner | +6.3 | 51.7% to 75.6% |

At 2 points a cat the five charms measured +7.4 to +9.7, twice any other relic, because over 26 turns a board fills and a clan's deck fills it with its own element. A rival always holds its charm, and a player's chest only has one for a deck with six cats of an element, so that was a head start. At 1 point they sit beside the better relics. The Quiet Corner is now the strongest relic; it is a prize for a run won on Stray or harder.

### Whole runs

A stand-in plays whole runs with the run's own transitions: it takes the first relic in the chest, and after a win the rarest stolen card shown and the first relic. 33 to 50 runs a row.

A new account, on the default deck:

| Tier | Stand-in | First match | Matches won | Runs won | Best match, middle and 9 in 10 | Points a run | Coins a run |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Kitten | Level 0, the fixed list | 50% | 0.80 | 0% | 48 / 64 | 88 | 49 |
| Kitten | Level 3, the list led by points | 88% | 3.54 | 26% | 69 / 77 | 270 | 183 |
| Kitten | Level 5, the full evaluation | 96% | 5.00 | 60% | 75 / 81 | 361 | 265 |
| Kitten | Level 6, playouts | 100% | 5.79 | 85% | 78 / 84 | 424 | 321 |
| Stray | Level 0 | 46% | 0.70 | 0% | 47 / 66 | 81 | 49 |
| Stray | Level 3 | 84% | 2.48 | 2% | 64 / 72 | 213 | 147 |
| Stray | Level 5 | 96% | 4.26 | 40% | 72 / 78 | 322 | 270 |
| Stray | Level 6 | 100% | 5.33 | 79% | 77 / 82 | 391 | 362 |
| Apex | Level 0 | 34% | 0.48 | 0% | 46 / 64 | 71 | 46 |
| Apex | Level 3 | 76% | 1.76 | 6% | 62 / 73 | 166 | 134 |
| Apex | Level 5 | 92% | 2.90 | 18% | 69 / 75 | 243 | 226 |
| Apex | Level 6 | 97% | 4.27 | 55% | 74 / 80 | 328 | 368 |

An account that owns every cat, on the richest deck one element allows (its rarest cats first, each to its cap):

| Tier | Stand-in | First match | Matches won | Runs won | Best match, middle and 9 in 10 | Points a run | Coins a run |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Kitten | Level 0 | 46% | 1.14 | 2% | 62 / 105 | 144 | 86 |
| Kitten | Level 3 | 48% | 1.12 | 0% | 59 / 102 | 140 | 83 |
| Kitten | Level 5 | 78% | 3.02 | 34% | 93 / 114 | 291 | 200 |
| Kitten | Level 6 | 94% | 3.94 | 48% | 103 / 127 | 392 | 269 |
| Stray | Level 0 | 46% | 0.98 | 2% | 63 / 101 | 128 | 85 |
| Stray | Level 3 | 34% | 0.82 | 2% | 59 / 90 | 116 | 76 |
| Stray | Level 5 | 64% | 2.08 | 18% | 81 / 107 | 220 | 168 |
| Stray | Level 6 | 88% | 4.03 | 58% | 96 / 127 | 393 | 331 |
| Apex | Level 0 | 36% | 0.78 | 0% | 61 / 91 | 116 | 81 |
| Apex | Level 3 | 34% | 0.82 | 0% | 59 / 90 | 117 | 84 |
| Apex | Level 5 | 62% | 2.08 | 18% | 83 / 108 | 221 | 208 |
| Apex | Level 6 | 85% | 3.73 | 36% | 98 / 114 | 369 | 366 |

What these set:

- **The two scores a prize asks for.** A careful player on a new account (level 5, Kitten, 100 runs) has a best match of 76 or more in two runs of five and 87 or more in one of fifty, so `HIGH_SCORE` is 76 and `TOP_SCORE` 87.
- **What a run pays.** A run on a new account pays about 50 coins to play by rote and 180 to 370 to careful play, so a cat pack at 100 is half a run to two runs and a cosmetic pack at 150 a little more. The prices stayed. With the bonuses raised by a quarter on Stray and a half on Apex, the same careful play was paid 283 coins a run on Kitten, 252 on Stray and 215 on Apex, because a harder run ends sooner. A point stays at half a coin on every tier, as agreed, so the bonuses carry it: multiplied by 1.7 on Stray and 2.8 on Apex they pay 281, 281 and 279, and better play is paid more the harder the tier.
- **Paid match by match.** Later, a run stopped paying only when it closed: each match pays the moment it ends, won or lost, onto the account, and its sheet shows the coins and its floor's factor. The factor (×1, 1.2, 1.4, 1.6, 1.8, 2 from the first rival to the last) multiplies everything the match pays and replaces the rising win bonus, now a flat 8; the bonus for a card taken back is gone. Measured over 40 runs of each stand-in on the default deck, a run lost to the first rival pays the same (about 23 coins), and deeper runs more: careful play on Kitten went from 126 to 163 coins a run, Stray from 116 to 146, Apex from 96 to 116, and a won Kitten run from about 310 to 437. `RUN_VERSION` went to 4; a run saved before is retired and each of its finished matches paid on its floor.
- **Thin decks.** A match finds no card to draw five to seven times between its two seats on 16-card decks (ten for the fixed list, which prowls more). The tray left short is not counted. That is why a deck is not trimmed below 16.

Two things the tables show that were not planned for:

- **A rich collection makes a run harder, not easier.** The same level 5 play wins 60% of Kitten runs on a new account and 34% with the richest deck, because the rivals are dealt cats as rare as the player's, the best of each rarity, and the player starts with a random 16 of their 24. Part of that was a fault and is fixed: a rival's deck took its clan's element first with no limit, so against a large collection it was all one element and its charm paid for every cat (10% of Kitten runs won with the rivals' charms, 27% without them). A rival's deck is now half its element, as a starter was, and the charm no longer decides it (22% and 25% in the same 40 runs). The rest is the rule as decided, and the stand-in's own limits: the evaluation knows nothing of a legendary's relic, so it plays a rich deck less well than a person would. Whether rivals should mirror a deck's rarity in full is worth a second look once people have collections.
- **Levels 3 and 4 play a rich deck no better than the fixed list** (a first match won 48% against 46%). They follow the list until the last two rounds and then take points, which is right for a starter deck and wastes strong cards. On Kitten those are the fourth and fifth rivals, so a rich account's Kitten run has two soft floors before its last.

## Risks, as they turned out

- **Run length.** A seat takes 26 turns a match, 2.17 times the old 12, and a full run is 156 of the player's turns instead of 72.
- **Thin decks.** With 16 cards a deck runs out late in a match: about three draws a seat find no card. Trimming below 16 would only make it sooner, so the floor is 16.
- **Clan charms** dominated at 2 points a cat and were cut to 1.
- **Action limits** were too small for a legal move and were raised.
- **The rival can work out the player's deck** from the cats it has not seen, since its deck is drawn from the player's collection to the player's mix. Accepted.
- **The theft can be rerolled** by changing the deck between two attempts given up at the chest. Accepted.

## Verification

- `pnpm check`, `pnpm test` (793 tests) and `pnpm format:check` pass, and were run before each commit on a clean checkout holding only that commit's files.
- `pnpm db:generate` writes nothing after 0007. All eight migrations apply to a fresh local database, and `pnpm db:seed` creates the demo account on it.
- The routers were driven end to end against that database: a new account's profile, collection and default deck; decks refused at 23 cards, with a fourth copy and with a cat not owned; a pack refused for want of coins; a cat pack opened, the same request replayed, the same request sent twice at once (one pack bought), two requests at once (two bought and paid for); both cosmetic packs emptied without a duplicate and then refused; a piece put on and taken off; a run given up at the chest (no coins, the same chest and theft again); a run played to its end (coins paid once, on the profile, in the history; the ticket moved on); a deck broken in the database (the run refused, pointing at the Deck page).
- By hand in a browser at 375px and 1280px: the start screen, the chest and a reload at it, the climb into the tower, a match with its four rounds in the rail on a short and a tall window, a reward with three cards to take one back, the end of a run showing a coin total and nothing else, the record book after a reload, the deck builder at 23 and 25 cards and at a fourth copy, a pack opened and a second press, each kind of skin on the home page, the table and a dialog, the hadu in the lid, on the tower, on the home mat and at the chest, the five-item dock, the codex at 102 cats, and the landing page's eight-turn round.
