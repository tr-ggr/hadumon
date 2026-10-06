import { TRPCError } from "@trpc/server";
import { and, eq, gte, isNull, sql } from "drizzle-orm";

import type { DbOrTx, Transaction } from "~/server/db";
import { users } from "~/server/db/schema/auth";
import {
  cards,
  cosmetics,
  decks,
  profiles,
  type Profile,
} from "~/server/db/schema/economy";
import { ownedCards, type Owned } from "~/server/game/collection";
import { isCosmeticId } from "~/server/game/cosmetics";
import { defaultDeck } from "~/server/game/deck";

/**
 * The account's profile row, made if it has none yet and locked until the
 * transaction ends. Everything that moves coins or cards takes this lock
 * first, so two requests of one account are applied one after the other. A
 * request that also holds a run locks the run row before this one.
 */
export async function lockProfile(
  tx: Transaction,
  userId: string,
): Promise<Profile> {
  await tx.insert(profiles).values({ userId }).onConflictDoNothing();
  const [profile] = await tx
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1)
    .for("update");
  if (!profile) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "No profile row",
    });
  }
  if (profile.handle === null) {
    return { ...profile, handle: await claimHandle(tx, userId) };
  }
  return profile;
}

/**
 * The handles an account may be found under, best first: its username,
 * then the username with more and more of its id. A username has no
 * hyphen, so a handle with one never belongs to another account's name.
 */
export function handleCandidates(name: string, userId: string): string[] {
  const base = name.toLowerCase();
  const id = userId.replace(/-/g, "").toLowerCase();
  return [
    base,
    `${base}-${id.slice(0, 4)}`,
    `${base}-${id.slice(0, 8)}`,
    `${base}-${id}`,
  ];
}

/**
 * Gives a profile without a handle the first free one and returns it; a
 * profile that has one keeps it. The row must exist.
 */
export async function claimHandle(db: DbOrTx, userId: string): Promise<string> {
  const [row] = await db
    .select({ handle: profiles.handle, name: users.name })
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .where(eq(profiles.userId, userId))
    .limit(1);
  if (!row) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "No profile row",
    });
  }
  if (row.handle !== null) return row.handle;
  for (const candidate of handleCandidates(row.name, userId)) {
    const [taken] = await db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(eq(profiles.handle, candidate))
      .limit(1);
    if (taken) continue;
    const [claimed] = await db
      .update(profiles)
      .set({ handle: candidate })
      .where(and(eq(profiles.userId, userId), isNull(profiles.handle)))
      .returning({ handle: profiles.handle });
    if (claimed?.handle) return claimed.handle;
    // Claimed by another request since it was read: that one's stands.
    return claimHandle(db, userId);
  }
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "No handle is free",
  });
}

/** The account's handle, making its profile row and handle if it has neither. */
export async function ensureHandle(
  db: DbOrTx,
  userId: string,
): Promise<string> {
  await db.insert(profiles).values({ userId }).onConflictDoNothing();
  return claimHandle(db, userId);
}

/** What a profile holds, without making or locking a row. */
export async function readProfile(
  db: DbOrTx,
  userId: string,
): Promise<
  Pick<Profile, "coins" | "look" | "runTicket" | "handle" | "runsPublic">
> {
  const [profile] = await db
    .select({
      coins: profiles.coins,
      look: profiles.look,
      runTicket: profiles.runTicket,
      handle: profiles.handle,
      runsPublic: profiles.runsPublic,
    })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  return (
    profile ?? {
      coins: 0,
      look: {},
      runTicket: 0,
      handle: null,
      runsPublic: true,
    }
  );
}

/** Adds coins to a profile whose row exists. Returns the new balance. */
export async function addCoins(
  tx: Transaction,
  userId: string,
  coins: number,
): Promise<number> {
  const [updated] = await tx
    .update(profiles)
    .set({ coins: sql`${profiles.coins} + ${coins}`, updatedAt: new Date() })
    .where(eq(profiles.userId, userId))
    .returning({ coins: profiles.coins });
  if (!updated) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "No profile row",
    });
  }
  return updated.coins;
}

/**
 * Takes `price` coins from a profile, in one statement that only matches a
 * balance that can pay. Returns the new balance, or `null` if it could not.
 */
export async function spendCoins(
  tx: Transaction,
  userId: string,
  price: number,
): Promise<number | null> {
  const [updated] = await tx
    .update(profiles)
    .set({ coins: sql`${profiles.coins} - ${price}`, updatedAt: new Date() })
    .where(and(eq(profiles.userId, userId), gte(profiles.coins, price)))
    .returning({ coins: profiles.coins });
  return updated?.coins ?? null;
}

/** Every card the account owns: the starter collection and what it has gained. */
export async function ownedBy(db: DbOrTx, userId: string): Promise<Owned> {
  const rows = await db
    .select({ catId: cards.catId, copies: cards.copies })
    .from(cards)
    .where(eq(cards.userId, userId));
  return ownedCards(rows);
}

/** Adds one gained copy of each of `catIds`. The caller has checked the caps. */
export async function addCards(
  tx: Transaction,
  userId: string,
  catIds: readonly string[],
): Promise<void> {
  const counts = new Map<string, number>();
  for (const catId of catIds) counts.set(catId, (counts.get(catId) ?? 0) + 1);
  if (counts.size === 0) return;
  await tx
    .insert(cards)
    .values([...counts].map(([catId, copies]) => ({ userId, catId, copies })))
    .onConflictDoUpdate({
      target: [cards.userId, cards.catId],
      set: { copies: sql`${cards.copies} + excluded.copies` },
    });
}

/** The cosmetics the account has gained; the free ones are not among them. */
export async function gainedCosmetics(
  db: DbOrTx,
  userId: string,
): Promise<string[]> {
  const rows = await db
    .select({ id: cosmetics.cosmeticId })
    .from(cosmetics)
    .where(eq(cosmetics.userId, userId));
  return rows.map((row) => row.id).filter(isCosmeticId);
}

/** The deck the account has built, or the default one if it never has. */
export async function savedDeck(
  db: DbOrTx,
  userId: string,
): Promise<{ cards: string[]; built: boolean }> {
  const [deck] = await db
    .select({ cards: decks.cards })
    .from(decks)
    .where(eq(decks.userId, userId))
    .limit(1);
  return deck && Array.isArray(deck.cards)
    ? { cards: deck.cards.map(String), built: true }
    : { cards: defaultDeck(), built: false };
}
