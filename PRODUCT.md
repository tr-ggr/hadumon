# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: players of idle and gacha games who arrive at HaduMon from a shared link. They already know what a banner, a pity counter, and an idle loop are; they want to know what is different here and to start pulling within a minute. They play in a desktop browser during downtime and check back in on a phone between other things.

Secondary (unconfirmed, do not design for): friends and testers of the project.

## Product Purpose

HaduMon is a web-based idle creature-collector RPG about feline "Fakemon". Players pull cats from a Gacha Summoning Hub, assign a squad to Idle Adventure zones that resolve server-side auto-battles over time, climb an asynchronous PvP ladder, and trade cats on a marketplace. Success for a new visitor is a created account and a first ten-pull on the Summoning Hub; success for a player is a growing collection and a squad that keeps earning while they are away.

## Positioning

Four claims the product can truthfully make and a neighbouring idle-gacha could not copy as a set:

1. The cast is feline Fakemon with elemental typing: 25 named species (Flameclaw, Mistpaw, Voltwhisk, Nyxaroth, ...) across Flame, Mist, Volt, Thorn, and Shade, each with hand-written flavor text.
2. Progression is genuinely low-touch: encounters are simulated on the server one per minute, with up to 8 hours of progress banked while the player is away.
3. There is no real-money gacha. Every gem is earned in-game. There is nothing to buy.
4. It runs in the browser on any device. No install, no app store.

## Operating Context

- Played in a browser; mobile-first UI that must work at 375px wide.
- Session cadence: a summon or squad change, then hours away; return to claim loot.
- New accounts start with 1000 gems, 500 gold, and the three common starter cats (Flameclaw, Mistpaw, Voltwhisk).
- Currencies: gold (upgrades, market), gems (gacha; 100 per pull, 900 per ten), per-element shards (upgrades).

## Capabilities and Constraints

- 25 species: 10 common, 5 uncommon, 5 rare, 3 epic, 2 legendary. Rarity multipliers 1 / 1.15 / 1.35 / 1.6 / 2.
- Five elements on an advantage wheel: flame → thorn → volt → mist → flame at +25% (reverse −25%); Shade sits outside the wheel at +10% dealt and taken against everything else.
- Two banners: "Wandering Strays" (standard) and "Weekly Spotlight" (a rotating epic/legendary at double odds). Pity guarantees epic+ at 50 misses (25% of those legendary); every ten-pull guarantees at least one rare+.
- Five idle zones, Whisker Meadows (T1) through Moonlit Catacombs (T5); one encounter per minute; 8h offline cap; 20 wins unlock the next zone.
- Ladder tiers Kitten → Stray → Hunter → Prowler → Apex; 10 attacks per day; teams of up to 4.
- Marketplace listings and direct trades between players.
- Stack: Next.js 15 App Router, TypeScript strict, tRPC v11, Drizzle + Postgres, Tailwind v4. Game rules live as pure functions in `src/server/game/*` and are importable client-side.
- Undecided: no guest/anonymous play exists; not planned.

## Brand Commitments

- Name: HaduMon. Wordmark is text: "Hadu" in gold, "Mon" in pink, set in Press Start 2P.
- The visual world is an established retro pixel interface: near-black indigo ground, violet panels with 2px edges, zero border radius, hard black offset shadows, Press Start 2P headings and VT323 body, coloured rarity glows, stepped (`steps(n)`) motion. New surfaces inherit it.
- All creature art is generated inline-SVG pixel sprites (`src/components/PixelSprite.tsx`); there are no image files of cats.
- Voice: dry and wry, in the register of the species flavor text ("Moss grows along its shoulders. It has not moved since Tuesday."). No hype.

## Evidence on Hand

- Seed data and game rules in `src/server/game/*` (species, elements, banners, rates, zones, ladder tiers): the only source for any number shown to visitors.
- Real app screenshots from the seeded `demo` account in `public/screenshots/` (desktop dashboard; mobile login, home, summon, adventure, battle, market).
- `README.md` feature descriptions.
- Absent, and must not be fabricated: testimonials, player counts, press mentions, ratings, awards, download or revenue figures.

## Product Principles

1. Prove with the game itself: real components, real rates, real cats; never a mock-up of something the product does not do.
2. Every number on a public surface is derivable from the game code or the seed.
3. Get a genre-literate visitor to a real pull as fast as possible; explain after they have played.
4. Idle means idle: never imply the game needs constant attention.
5. Free means free: state plainly that nothing is for sale.
