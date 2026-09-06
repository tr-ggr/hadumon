/**
 * Marketplace rules (Sprint 05) — pure, side-effect free and unit tested.
 *
 * The router owns the transactions and row locks; everything decidable from
 * plain data lives here so it can be tested without a database.
 */
import type { CreatureStatus } from "~/server/db/schema/creatures";
import type { Rarity } from "~/server/game/species";

/** The marketplace keeps 5% of every sale. */
export const LISTING_FEE_RATE = 0.05;

export const MIN_PRICE = 1;
export const MAX_PRICE = 1_000_000;

/** Statuses that mean a creature is already reserved by the market. */
const RESERVED_STATUSES: readonly CreatureStatus[] = ["listed", "trading"];

export type MarketErrorCode =
  "NOT_IDLE" | "LAST_CREATURE" | "SAME_OWNER" | "NOT_OWNED" | "INVALID_PRICE";

export type MarketCheck =
  { ok: true } | { ok: false; code: MarketErrorCode; message: string };

const OK: MarketCheck = { ok: true };

function fail(code: MarketErrorCode, message: string): MarketCheck {
  return { ok: false, code, message };
}

/* -------------------------------------------------------------------------- */
/* Pricing                                                                     */
/* -------------------------------------------------------------------------- */

/** `true` when `price` is an integer inside the allowed gold range. */
export function isValidPrice(price: number): boolean {
  return Number.isInteger(price) && price >= MIN_PRICE && price <= MAX_PRICE;
}

/** What the seller actually receives: `floor(price * 0.95)`. */
export function sellerProceeds(price: number): number {
  return Math.floor(price * (1 - LISTING_FEE_RATE));
}

/** The house cut, i.e. `price - sellerProceeds(price)`. */
export function listingFee(price: number): number {
  return price - sellerProceeds(price);
}

/** Plausible asking-price band per rarity (used by the seed and as UI hints). */
export const RARITY_PRICE_RANGE: Record<Rarity, readonly [number, number]> = {
  common: [50, 150],
  uncommon: [200, 400],
  rare: [800, 1500],
  epic: [3000, 6000],
  legendary: [15000, 28000],
};

/** Midpoint of the rarity band, nudged by level — a starting price suggestion. */
export function suggestedPrice(rarity: Rarity, level: number): number {
  const [min, max] = RARITY_PRICE_RANGE[rarity];
  const levelBonus = 1 + 0.02 * Math.max(0, Math.floor(level) - 1);
  return clampPrice(Math.round(((min + max) / 2) * levelBonus));
}

export function clampPrice(price: number): number {
  return Math.min(MAX_PRICE, Math.max(MIN_PRICE, Math.round(price)));
}

/* -------------------------------------------------------------------------- */
/* Listing rules                                                               */
/* -------------------------------------------------------------------------- */

/** The slice of a creature row the market rules care about. */
export interface MarketCreature {
  id: string;
  ownerId: string;
  status: CreatureStatus;
}

export interface ListInput {
  creature: MarketCreature;
  /** Who is trying to list it. */
  actorId: string;
  /**
   * How many creatures the owner holds that are neither `listed` nor
   * `trading`, counting the one being offered. Must stay ≥ 1 afterwards.
   */
  availableCount: number;
  price: number;
}

/**
 * May `actorId` put this cat up for sale? Requires ownership, an `idle`
 * status, a valid price and at least one other unreserved cat left behind.
 */
export function canList(input: ListInput): MarketCheck {
  if (input.creature.ownerId !== input.actorId) {
    return fail("NOT_OWNED", "That cat is not yours");
  }
  if (!isValidPrice(input.price)) {
    return fail(
      "INVALID_PRICE",
      `Price must be a whole number between ${MIN_PRICE} and ${MAX_PRICE.toLocaleString()} gold`,
    );
  }
  return canReserve(input.creature, input.availableCount, "you");
}

/** Shared idle/last-cat guard behind both listing and trading. */
function canReserve(
  creature: MarketCreature,
  availableCount: number,
  subject: "you" | "they",
): MarketCheck {
  if (creature.status !== "idle") {
    return fail(
      "NOT_IDLE",
      `${describeStatus(creature.status)} cats cannot be offered`,
    );
  }
  if (availableCount < 2) {
    return fail(
      "LAST_CREATURE",
      subject === "you"
        ? "You must keep at least one cat"
        : "They must keep at least one cat",
    );
  }
  return OK;
}

function describeStatus(status: CreatureStatus): string {
  switch (status) {
    case "expedition":
      return "Expedition";
    case "listed":
      return "Listed";
    case "trading":
      return "Trading";
    default:
      return "Busy";
  }
}

/** Whether a creature is currently tied up by a listing or a trade offer. */
export function isReserved(status: CreatureStatus): boolean {
  return RESERVED_STATUSES.includes(status);
}

/* -------------------------------------------------------------------------- */
/* Buying                                                                      */
/* -------------------------------------------------------------------------- */

export interface BuyableListing {
  id: string;
  sellerId: string;
  status: "active" | "sold" | "cancelled";
  price: number;
}

export type BuyCheck =
  | { ok: true }
  | {
      ok: false;
      code: "SOLD" | "CANCELLED" | "OWN_LISTING" | "INSUFFICIENT_GOLD";
      message: string;
    };

/**
 * The precondition every `buy` must satisfy *after* the listing row is locked.
 * Two concurrent buyers both pass the pre-lock read, but only the first one
 * sees `active` once serialised behind `FOR UPDATE` — the second gets `SOLD`.
 */
export function canBuy(
  listing: BuyableListing,
  buyerId: string,
  buyerGold: number,
): BuyCheck {
  if (listing.status === "sold") {
    return {
      ok: false,
      code: "SOLD",
      message: "That cat has already been sold",
    };
  }
  if (listing.status === "cancelled") {
    return {
      ok: false,
      code: "CANCELLED",
      message: "That listing was withdrawn",
    };
  }
  if (listing.sellerId === buyerId) {
    return {
      ok: false,
      code: "OWN_LISTING",
      message: "You cannot buy your own listing",
    };
  }
  if (buyerGold < listing.price) {
    return {
      ok: false,
      code: "INSUFFICIENT_GOLD",
      message: `Not enough gold — you need ${(listing.price - buyerGold).toLocaleString()} more`,
    };
  }
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Trading                                                                     */
/* -------------------------------------------------------------------------- */

export interface TradeSide {
  userId: string;
  /** Every creature this side puts on the table — exactly one is allowed. */
  creatures: readonly MarketCreature[];
  /** Unreserved creatures the side owns, counting the offered one. */
  availableCount: number;
}

export interface TradeOfferInput {
  proposer: TradeSide;
  receiver: TradeSide;
}

/**
 * A trade is legal when each side stakes exactly one `idle` cat it actually
 * owns, the two sides are different trainers, and neither is giving away the
 * last cat they can still use.
 */
export function validateTrade(offer: TradeOfferInput): MarketCheck {
  const { proposer, receiver } = offer;

  if (proposer.userId === receiver.userId) {
    return fail("SAME_OWNER", "You cannot trade with yourself");
  }

  for (const [side, subject] of [
    [proposer, "you"],
    [receiver, "they"],
  ] as const) {
    if (side.creatures.length !== 1) {
      return fail("NOT_OWNED", "Each side must offer exactly one cat");
    }
    const creature = side.creatures[0];
    if (creature?.ownerId !== side.userId) {
      return fail("NOT_OWNED", "That cat no longer belongs to its trainer");
    }
    const check = canReserve(creature, side.availableCount, subject);
    if (!check.ok) return check;
  }

  return OK;
}
