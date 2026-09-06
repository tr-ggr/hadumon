import { describe, expect, it } from "vitest";

import type { CreatureStatus } from "~/server/db/schema/creatures";
import {
  canBuy,
  canList,
  clampPrice,
  isReserved,
  isValidPrice,
  listingFee,
  LISTING_FEE_RATE,
  MAX_PRICE,
  MIN_PRICE,
  RARITY_PRICE_RANGE,
  sellerProceeds,
  suggestedPrice,
  validateTrade,
  type BuyableListing,
  type MarketCreature,
} from "./market";
import { RARITIES } from "./species";

const ALICE = "alice";
const BOB = "bob";

function cat(
  overrides: Partial<MarketCreature> & Pick<MarketCreature, "ownerId">,
): MarketCreature {
  return { id: "cat-1", status: "idle", ...overrides };
}

describe("pricing", () => {
  it("takes a 5% cut, rounded in the house's favour", () => {
    expect(LISTING_FEE_RATE).toBe(0.05);
    expect(sellerProceeds(1000)).toBe(950);
    expect(sellerProceeds(999)).toBe(949);
    expect(sellerProceeds(1)).toBe(0);
    expect(listingFee(1000)).toBe(50);
    expect(listingFee(999)).toBe(50);
  });

  it("never lets proceeds exceed the price", () => {
    for (const price of [1, 2, 7, 19, 100, 12345, MAX_PRICE]) {
      expect(sellerProceeds(price)).toBeLessThanOrEqual(price);
      expect(sellerProceeds(price) + listingFee(price)).toBe(price);
    }
  });

  it("accepts whole gold prices in range only", () => {
    expect(isValidPrice(MIN_PRICE)).toBe(true);
    expect(isValidPrice(MAX_PRICE)).toBe(true);
    expect(isValidPrice(0)).toBe(false);
    expect(isValidPrice(-5)).toBe(false);
    expect(isValidPrice(MAX_PRICE + 1)).toBe(false);
    expect(isValidPrice(12.5)).toBe(false);
    expect(isValidPrice(Number.NaN)).toBe(false);
  });

  it("clamps into the legal band", () => {
    expect(clampPrice(-100)).toBe(MIN_PRICE);
    expect(clampPrice(9_999_999)).toBe(MAX_PRICE);
    expect(clampPrice(250.4)).toBe(250);
  });

  it("suggests a price inside (or above) the rarity band", () => {
    for (const rarity of RARITIES) {
      const [min] = RARITY_PRICE_RANGE[rarity];
      const price = suggestedPrice(rarity, 1);
      expect(price).toBeGreaterThanOrEqual(min);
      expect(isValidPrice(price)).toBe(true);
      expect(suggestedPrice(rarity, 30)).toBeGreaterThan(price);
    }
  });
});

describe("canList", () => {
  it("allows an idle cat when another cat stays behind", () => {
    const check = canList({
      creature: cat({ ownerId: ALICE }),
      actorId: ALICE,
      availableCount: 3,
      price: 500,
    });
    expect(check.ok).toBe(true);
  });

  it("rejects cats owned by someone else", () => {
    const check = canList({
      creature: cat({ ownerId: BOB }),
      actorId: ALICE,
      availableCount: 3,
      price: 500,
    });
    expect(check).toMatchObject({ ok: false, code: "NOT_OWNED" });
  });

  it("rejects non-idle cats", () => {
    for (const status of [
      "expedition",
      "listed",
      "trading",
    ] as CreatureStatus[]) {
      const check = canList({
        creature: cat({ ownerId: ALICE, status }),
        actorId: ALICE,
        availableCount: 4,
        price: 500,
      });
      expect(check).toMatchObject({ ok: false, code: "NOT_IDLE" });
    }
  });

  it("refuses to list the last available cat", () => {
    const check = canList({
      creature: cat({ ownerId: ALICE }),
      actorId: ALICE,
      availableCount: 1,
      price: 500,
    });
    expect(check).toMatchObject({ ok: false, code: "LAST_CREATURE" });
  });

  it("rejects prices outside the band", () => {
    for (const price of [0, -1, 3.5, MAX_PRICE + 1]) {
      const check = canList({
        creature: cat({ ownerId: ALICE }),
        actorId: ALICE,
        availableCount: 5,
        price,
      });
      expect(check).toMatchObject({ ok: false, code: "INVALID_PRICE" });
    }
  });
});

describe("canBuy", () => {
  const listing = {
    id: "l1",
    sellerId: ALICE,
    status: "active" as const,
    price: 1000,
  };

  it("allows a funded stranger", () => {
    expect(canBuy(listing, BOB, 1000).ok).toBe(true);
  });

  it("blocks the seller buying their own listing", () => {
    expect(canBuy(listing, ALICE, 99999)).toMatchObject({
      ok: false,
      code: "OWN_LISTING",
    });
  });

  it("blocks an underfunded buyer", () => {
    expect(canBuy(listing, BOB, 999)).toMatchObject({
      ok: false,
      code: "INSUFFICIENT_GOLD",
    });
  });

  // The concurrency guard: the loser of two racing buys re-reads the row
  // (behind FOR UPDATE) as `sold` and must be rejected.
  it("rejects a listing that was sold or withdrawn while we waited", () => {
    expect(canBuy({ ...listing, status: "sold" }, BOB, 10_000)).toMatchObject({
      ok: false,
      code: "SOLD",
    });
    expect(
      canBuy({ ...listing, status: "cancelled" }, BOB, 10_000),
    ).toMatchObject({
      ok: false,
      code: "CANCELLED",
    });
  });

  it("resolves exactly one winner for two concurrent buyers", () => {
    let row: BuyableListing = { ...listing };
    const attempts = ["carol", "dave"].map((buyer) => {
      const check = canBuy(row, buyer, 10_000);
      if (check.ok) row = { ...row, status: "sold" };
      return check.ok;
    });
    expect(attempts.filter(Boolean)).toHaveLength(1);
  });
});

describe("validateTrade", () => {
  const side = (
    userId: string,
    overrides: Partial<MarketCreature> = {},
    available = 3,
  ) => ({
    userId,
    creatures: [cat({ ownerId: userId, id: `${userId}-cat`, ...overrides })],
    availableCount: available,
  });

  it("accepts a clean 1:1 swap", () => {
    expect(
      validateTrade({ proposer: side(ALICE), receiver: side(BOB) }).ok,
    ).toBe(true);
  });

  it("rejects trading with yourself", () => {
    expect(
      validateTrade({ proposer: side(ALICE), receiver: side(ALICE) }),
    ).toMatchObject({
      ok: false,
      code: "SAME_OWNER",
    });
  });

  it("requires exactly one cat per side", () => {
    expect(
      validateTrade({
        proposer: { ...side(ALICE), creatures: [] },
        receiver: side(BOB),
      }),
    ).toMatchObject({ ok: false, code: "NOT_OWNED" });

    expect(
      validateTrade({
        proposer: {
          ...side(ALICE),
          creatures: [
            cat({ ownerId: ALICE, id: "a" }),
            cat({ ownerId: ALICE, id: "b" }),
          ],
        },
        receiver: side(BOB),
      }),
    ).toMatchObject({ ok: false, code: "NOT_OWNED" });
  });

  it("rejects a cat that is not owned by the side offering it", () => {
    expect(
      validateTrade({
        proposer: {
          ...side(ALICE),
          creatures: [cat({ ownerId: BOB, id: "x" })],
        },
        receiver: side(BOB),
      }),
    ).toMatchObject({ ok: false, code: "NOT_OWNED" });
  });

  it("rejects cats that are not idle on either side", () => {
    expect(
      validateTrade({
        proposer: side(ALICE, { status: "listed" }),
        receiver: side(BOB),
      }),
    ).toMatchObject({ ok: false, code: "NOT_IDLE" });
    expect(
      validateTrade({
        proposer: side(ALICE),
        receiver: side(BOB, { status: "expedition" }),
      }),
    ).toMatchObject({ ok: false, code: "NOT_IDLE" });
  });

  it("protects the last cat of either side", () => {
    expect(
      validateTrade({ proposer: side(ALICE, {}, 1), receiver: side(BOB) }),
    ).toMatchObject({
      ok: false,
      code: "LAST_CREATURE",
      message: "You must keep at least one cat",
    });
    expect(
      validateTrade({ proposer: side(ALICE), receiver: side(BOB, {}, 1) }),
    ).toMatchObject({
      ok: false,
      code: "LAST_CREATURE",
      message: "They must keep at least one cat",
    });
  });
});

describe("isReserved", () => {
  it("flags market-held statuses only", () => {
    expect(isReserved("listed")).toBe(true);
    expect(isReserved("trading")).toBe(true);
    expect(isReserved("idle")).toBe(false);
    expect(isReserved("expedition")).toBe(false);
  });
});
