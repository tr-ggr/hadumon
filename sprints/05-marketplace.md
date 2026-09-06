# Sprint 05 — Trading Post & Marketplace

**Mode:** parallel with 02/03/04. Read `00-overview.md` and skim `01-foundation.md` (wallet, creatures, status locks). Only edit files you own.

## Owned files
`src/server/db/schema/market.ts`, `src/server/game/market.ts` (+ `.test.ts`), `src/server/api/routers/market.ts`, `src/app/market/**`, `src/components/market/**`, `src/server/db/seed-market.ts`.

## Goal
Players list cats for fixed gold prices, buy others' listings, and propose direct 1:1 trades.

## Design

### Rules (`game/market.ts`, pure + tested)
- `LISTING_FEE_RATE = 0.05` (seller receives `floor(price * 0.95)`), price 1–1,000,000 gold, integer.
- `canList(creature)` → status must be `idle`; a user may not list their last creature (must keep ≥1 cat).
- `validateTrade(offer)`: exactly one creature each side, both `idle`, different owners, not the last creature of either side.

### Schema (`schema/market.ts`)
- `listings` (id, sellerId, creatureId, price, status `active|sold|cancelled`, buyerId nullable, createdAt, resolvedAt nullable). Partial unique index: one active listing per creature.
- `tradeOffers` (id, proposerId, receiverId, proposerCreatureId, receiverCreatureId, message text ≤140 nullable, status `pending|accepted|declined|cancelled`, createdAt, resolvedAt nullable).

### Router (`routers/market.ts`)
- `browse({ element?, rarity?, minPrice?, maxPrice?, sort: newest|priceAsc|priceDesc|power, cursor?, limit 24 })` → active listings excluding own, with creature + species + computed power + seller username.
- `myListings()`, `list({ creatureId, price })` → tx: lock creature, `canList`, set status `listed`, insert listing.
- `cancel({ listingId })` → tx: must be seller + active; status back to `idle`.
- `buy({ listingId })` → tx: lock listing (`FOR UPDATE`) must be active and not own; `adjustWallet(buyer, -price)`; `adjustWallet(seller, +floor(price*0.95))`; transfer ownership (ownerId, `obtainedVia: "market"`, status `idle`, clear nickname? keep nickname); mark sold with buyerId. Concurrency: two buyers → exactly one succeeds.
- Trades: `proposeTrade({ receiverUsername or receiverId, myCreatureId, theirCreatureId, message? })` → tx: lock both creatures, `validateTrade`, set both to `trading`, insert offer. `respondTrade({ offerId, accept: boolean })` (receiver only) → accept: swap owners atomically in tx, set both `idle`, `obtainedVia: "trade"`; decline: release both. `cancelTrade({ offerId })` (proposer only, pending). `incomingTrades()`, `outgoingTrades()`, `tradeHistory()`.
- `browseUserRoster({ username })` → another user's idle creatures (for choosing what to ask for in a trade).

### Seed helper (`src/server/db/seed-market.ts`)
Standalone script: creates ~10 active listings from bot users' creatures at plausible prices by rarity (common 50–150, uncommon 200–400, rare 800–1500, epic 3000–6000, legendary 15000+). Runnable via `pnpm tsx src/server/db/seed-market.ts`; Sprint 06 wires it into `db:seed`.

## UI (`src/app/market/`)
- Tabs: **Browse**, **My Listings**, **Trades**.
- Browse: filter bar (element chips, rarity select, price range, sort), responsive grid of listing cards (sprite, name, level, rarity, power, price in gold, seller). "Buy" opens a confirm dialog showing balance after purchase; error toast on failure (sold out / insufficient gold).
- My Listings: "List a cat" flow (pick idle cat → price input with fee preview "You receive 950") + active/sold/cancelled lists with Cancel.
- Trades: incoming offers (side-by-side sprites, Accept/Decline), outgoing (Cancel), "New trade" flow: enter username → their roster grid → pick theirs → pick yours → optional message → send.
- Mobile-first at 375px.

## Acceptance
- Buying with insufficient gold or a sold listing fails cleanly; concurrent buys can't double-sell (test at least the status precondition in a unit test and rely on `FOR UPDATE` in the router).
- Listed/trading cats are locked and released correctly on cancel/decline/complete.
- `pnpm check` and `pnpm test` pass. Commit `feat: sprint 05 marketplace and trading`.
