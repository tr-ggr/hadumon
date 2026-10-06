# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: players of roguelike deckbuilders and engine-building board games who arrive at HaduMon from a shared link. They already know what a run, a relic, and a boss are, and many have played Wingspan or something like it. They want to be in a match within a minute and learn the rest by playing. A run takes one sitting on a desktop browser or a few short sessions on a phone.

Secondary (unconfirmed, do not design for): friends and testers of the project.

## Product Purpose

HaduMon is a web-based roguelike engine-builder about feline "Fakemon". The player builds a deck of 32 cats from a collection, and a run is a gauntlet of six matches to take it back: the rivals steal eight of its cards as a run begins, and each one beaten gives a card back. A rival plays the same game on a board of its own. In a match each side plays cats into three habitat rows (Hunt, Den, Prowl) and activates a row to collect its reward and fire every cat's power in it, turn about across four rounds of eight, seven, six and five turns each. Losing a match ends the run. A finished run pays coins, coins open packs, and packs fill the collection and dress the player's hadu, table and tower. Success for a new visitor is a created account and a finished first match; success for a player is a run that goes one rival further than the last, a deck they changed because of it, and a codex that fills in.

## Positioning

Four claims the product can truthfully make and a neighbouring roguelike could not copy as a set:

1. The cast is feline Fakemon with elemental typing: 102 named cats (Flameclaw, Mistpaw, Voltwhisk, Nyxaroth, ...) across Flame, Mist, Volt, Thorn, and Shade, each with hand-written flavor text. Two are drawn from life: Hadu, the tuxedo the game is named after, and Stussy, a ginger.
2. The match is an engine-builder, not a combat game: three rows, one action a turn, and powers that chain from right to left. Nothing attacks anything.
3. A match is 26 turns each, against a rival that takes a real turn after each of yours on a board you can open, with no head start on any difficulty.
4. It runs in the browser on any device, and nothing is sold. No install. There are coins and a shop of packs, and coins are only ever earned by playing: the game takes no money.

## Operating Context

- Played in a browser; mobile-first UI that must work at 375px wide.
- Session cadence: one match is a few minutes; a full run is six matches. A run in progress is saved after every action and resumes where it stopped.
- New accounts start with a collection of 40 cards (three of each of ten commons, two of each of five uncommons), a default deck of 32 built from it, fifteen relics unlocked and no coins.
- One run at a time per account.

## Capabilities and Constraints

- 102 cats: 40 common, 25 uncommon, 20 rare, 10 epic, 7 legendary. Every element has 8, 5, 4, 2 and 1 of them; Hadu and Stussy stand beside those. Rarity is a power tier: it sets how often a cat comes out of a pack, and a rival's deck is drawn as rare as the player's own. Each legendary also has a relic of its own, a lasting effect while it is on the board.
- Five elements, each with the cat food its cats cost: Beef, Fish, Chicken, Dry food and Pork. A Treat pays for anything. There is no advantage wheel.
- A match: two seats, each with 3 rows of 4 slots, its own deck, hand and three-card tray; 4 rounds of 8 / 7 / 6 / 5 turns each, the lead changing hands every round; one shared five-dice feeder; one goal per round, scored on what each side really has. A row holding exactly 1 or 3 cats offers a trade when it is activated: a cat from hand for a die, a food for a yarn, a yarn for a cat.
- A deck: exactly 32 cards the account owns, at most four of a cat and one of a legendary, built on its own page and saved; one deck an account.
- A run: pick a difficulty and play the saved deck. Eight of its cards are stolen as the run begins, so it opens with 24; a chest holds three relics to take one from; then six matches with bosses at 3 and 6. Each win but the last shows three of the stolen cards to take one back, and every other win offers a relic. No new cat is gained in a run. The board resets each match; the deck and relics carry through.
- Coins: a run that ends, won, lost or given up, pays coins for the matches it finished. The player is shown the total and nothing of how it is worked out.
- Packs: five cat packs, one an element, of five cats each, the last rare or better; two cosmetic packs, which never hold a piece the account has. A cat past its cap is paid back in coins, always less than the pack cost.
- Cosmetics: what the player's hadu wears (hat, eyes, body, tail, aura), and the look of their board, tablecloth, tower and sky. They change no rule.
- Three difficulties: Kitten, Stray and Apex. A tier gives the rival nothing: it only moves every rival up the table of eight levels (Kitten plays levels 1 to 6, Stray 2 to 7, Apex 3 to 8), so the same six rivals think further ahead. The level is printed on the rival's nameplate, and both scores mean the same on every tier. Every tier earns unlocks; the Loud Bell and the Quiet Corner need Stray or harder, and Hadu needs a run won on Apex.
- A run has sound, music and effects: all synthesized in the browser, no audio files. Every screen of a run has its own chiptune and every rival its own theme; every press on the table is heard, and every cat has a voice of its own, played when it is chosen or inspected; the climb between matches is shot like a scene and fills the screen, with a camera, bars, a subtitle and a title card for the rival met. One control on the table sets the sound to full, quiet or off, and another turns the music alone off. Reduced motion lands a turn at once and shows the climb as one still frame.
- Between runs an account keeps its coins, its cards, its deck, its cosmetics and its unlocked relics. Eleven cats are also prizes, handed over once for what a run did (Hadu for a run won on Apex). Nothing makes a rival weaker: its deck is drawn to match the player's.
- Achievements: 24 things done over an account's whole career (a run won on Apex, a score of 87 in one match, every cat owned, 50 packs opened), each paying its coins once, the first time it holds; a run played before they existed counts towards them. They are counted when a run ends and when a pack is opened, and they are earned by playing like every other coin.
- Other players: every account has a profile at `/players/<handle>` with its hadu, its record (run and match win rates, best scores, runs won on each tier), its achievements and its runs, and a players page lists them: a directory by name, a leaderboard (runs won, best run, or win rate past five runs) and the runs lately finished. Every finished run has a summary of everything it did. A player can keep their runs to themselves; their record, achievements and place on the leaderboard still show. A run's coins are only ever shown to its player. Profiles and run summaries open signed out, so a link can be shared. Nobody plays anybody: this is a record, not multiplayer.
- Rivals are played by a bot, not by other players, under the player's own rules: a deck the size of the player's by the same match, drawn from the cats the player owns to the rarity mix of the player's deck, half of it its own clan's element, that clan's charm and no other relic, and only what its seat can see (never the player's hand, a deck's order or dice not yet rolled). How well a rival plays is its level, 1 to 8: its place in the gauntlet plus the tier's rank. There is no multiplayer.
- Stack: Next.js 15 App Router, TypeScript strict, tRPC v11, Drizzle + Postgres, Tailwind v4. Game rules live as pure functions in `src/server/game/*` and are importable client-side.
- Undecided: no guest/anonymous play exists; not planned.

## Brand Commitments

- Name: HaduMon. The wordmark is bold rounded type with Hadu in near-black and Mon in coral.
- The cats are pixel art: 16x16 chibi, front-facing, near-black outline, three fur tones per element, rarity-tinted eyes. Every cat renders through `src/components/PixelSprite.tsx` as inline SVG.
- The colour palette carries over (warm cream canvas, sky-blue surfaces, cobalt actions, acid-lime rewards, coral notifications, near-black text). `DESIGN.md` is the source for everything visual.
- Voice: dry and wry, in the register of the flavor text ("Moss grows along its shoulders. It has not moved since Tuesday."). No hype.

## Evidence on Hand

- Game rules and content in `src/server/game/*` (cats, powers, rivals, goals, relics, unlocks): the only source for any number shown to visitors.
- The approved pixel treatment (ink outline) and five sample sprites.
- Absent, and must not be fabricated: testimonials, player counts, press mentions, ratings, awards, download or revenue figures.

## Product Principles

1. Prove with the game itself: real components, the real engine, real cats; never a mock-up of something the product does not do.
2. Every number on a public surface is derivable from the game code.
3. Get a genre-literate visitor into a real match as fast as possible; explain after they have played.
4. Every rule the player needs is on the card or the board. No rule lives only in a help page.
5. Free means free: coins are earned at the table and nowhere else, and the game takes no money. Say so plainly wherever coins or packs are shown.
