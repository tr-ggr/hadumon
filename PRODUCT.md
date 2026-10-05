# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: players of roguelike deckbuilders and engine-building board games who arrive at HaduMon from a shared link. They already know what a run, a relic, and a boss are, and many have played Wingspan or something like it. They want to be in a match within a minute and learn the rest by playing. A run takes one sitting on a desktop browser or a few short sessions on a phone.

Secondary (unconfirmed, do not design for): friends and testers of the project.

## Product Purpose

HaduMon is a web-based roguelike engine-builder about feline "Fakemon". A run is a gauntlet of six short matches against scripted rivals. In a match the player plays cats into three habitat rows (Hunt, Den, Prowl) and activates a row to collect its reward and fire every cat's power in it, across three rounds of five, four, and three turns. Winning a match adds a cat or a relic to the run; losing one ends the run. Success for a new visitor is a created account and a finished first match; success for a player is a run that goes one rival further than the last and a codex that fills in.

## Positioning

Four claims the product can truthfully make and a neighbouring roguelike could not copy as a set:

1. The cast is feline Fakemon with elemental typing: 26 named cats (Flameclaw, Mistpaw, Voltwhisk, Nyxaroth, ...) across Flame, Mist, Volt, Thorn, and Shade, each with hand-written flavor text.
2. The match is an engine-builder, not a combat game: three rows, one action a turn, and powers that chain from right to left. Nothing attacks anything.
3. Matches are short: twelve turns each, with a rival that takes one visible, scripted action after every turn.
4. It runs in the browser on any device, and nothing is for sale. No install, no currency, no shop.

## Operating Context

- Played in a browser; mobile-first UI that must work at 375px wide.
- Session cadence: one match is a few minutes; a full run is six matches. A run in progress is saved after every action and resumes where it stopped.
- New accounts start with one clan and the 15 common and uncommon cats unlocked. There is no currency of any kind.
- One run at a time per account.

## Capabilities and Constraints

- 26 cats: 10 common, 5 uncommon, 5 rare, 3 epic, 3 legendary. Rarity is a power tier: it weights reward offers and gates unlocks. Each legendary also has a relic of its own, a lasting effect while it is on the board.
- Five elements, each with the cat food its cats cost: Beef, Fish, Chicken, Dry food and Pork. A Treat pays for anything. There is no advantage wheel.
- A match: 3 rows of 4 slots; 3 rounds of 5 / 4 / 3 turns; a five-dice feeder; a three-card tray; one goal per round contested with the rival.
- A run: pick a clan (a starter deck built around one element) and a difficulty, six matches with bosses at 3 and 6, a reward after every win. The board resets each match; the deck and relics carry through.
- Three difficulties: Kitten (the game as it is), Stray (every rival starts each match 2 points ahead, as 2 yarn) and Apex (4 ahead). The head start is the only change, it is printed on the rival's nameplate, and the player's own score means the same on every tier. Every tier earns unlocks; the Loud Bell and the Quiet Corner need Stray or harder, and Hadu needs a run won on Apex.
- A run has sound, music and effects: all synthesized in the browser, no audio files. Every screen of a run has its own chiptune and every rival its own theme; the climb between matches is shot like a scene, with a camera, bars and a title card for the rival met. One control on the table sets the sound to full, quiet or off, and another turns the music alone off. Reduced motion lands a turn at once and shows the climb as one still frame.
- Between runs only unlocks persist: cats, relics, and clans. No permanent power upgrades.
- Rivals are scripted (an action deck), not other players. There is no multiplayer.
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
5. Free means free: state plainly that nothing is for sale.
