import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";

import type { DbOrTx } from "~/server/db";
import { users } from "~/server/db/schema/auth";
import { materials } from "~/server/db/schema/creatures";
import { ELEMENTS, type Element } from "./elements";

export interface WalletDelta {
  gold?: number;
  gems?: number;
}

export interface WalletBalance {
  gold: number;
  gems: number;
}

export interface Wallet extends WalletBalance {
  materials: Record<Element, number>;
}

/**
 * The single place gold/gems ever change.
 *
 * Applies both deltas in one guarded UPDATE, so a balance can never go
 * negative even under concurrent mutations. Throws `BAD_REQUEST` when the
 * player cannot afford the spend.
 */
export async function adjustWallet(
  tx: DbOrTx,
  userId: string,
  delta: WalletDelta,
): Promise<WalletBalance> {
  const gold = Math.trunc(delta.gold ?? 0);
  const gems = Math.trunc(delta.gems ?? 0);

  if (gold === 0 && gems === 0) {
    return readBalance(tx, userId);
  }

  const [updated] = await tx
    .update(users)
    .set({
      gold: sql`${users.gold} + ${gold}`,
      gems: sql`${users.gems} + ${gems}`,
    })
    .where(
      and(
        eq(users.id, userId),
        sql`${users.gold} + ${gold} >= 0`,
        sql`${users.gems} + ${gems} >= 0`,
      ),
    )
    .returning({ gold: users.gold, gems: users.gems });

  if (!updated) {
    const current = await readBalance(tx, userId);
    const short: string[] = [];
    if (current.gold + gold < 0) short.push("gold");
    if (current.gems + gems < 0) short.push("gems");
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Insufficient ${short.length > 0 ? short.join(" and ") : "funds"}`,
    });
  }

  return updated;
}

/** Adds (or spends) upgrade materials of one element. Never goes negative. */
export async function adjustMaterials(
  tx: DbOrTx,
  userId: string,
  element: Element,
  delta: number,
): Promise<number> {
  const amount = Math.trunc(delta);
  if (amount === 0) {
    return readMaterial(tx, userId, element);
  }

  if (amount > 0) {
    const [row] = await tx
      .insert(materials)
      .values({ userId, element, amount })
      .onConflictDoUpdate({
        target: [materials.userId, materials.element],
        set: { amount: sql`${materials.amount} + ${amount}` },
      })
      .returning({ amount: materials.amount });
    return row?.amount ?? amount;
  }

  const [row] = await tx
    .update(materials)
    .set({ amount: sql`${materials.amount} + ${amount}` })
    .where(
      and(
        eq(materials.userId, userId),
        eq(materials.element, element),
        sql`${materials.amount} + ${amount} >= 0`,
      ),
    )
    .returning({ amount: materials.amount });

  if (!row) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Insufficient ${element} shards`,
    });
  }

  return row.amount;
}

/** Gold, gems and every material count (missing elements read as 0). */
export async function getWallet(tx: DbOrTx, userId: string): Promise<Wallet> {
  const balance = await readBalance(tx, userId);
  const rows = await tx
    .select({ element: materials.element, amount: materials.amount })
    .from(materials)
    .where(eq(materials.userId, userId));

  const byElement = emptyMaterials();
  for (const row of rows) byElement[row.element] = row.amount;

  return { ...balance, materials: byElement };
}

export function emptyMaterials(): Record<Element, number> {
  return ELEMENTS.reduce<Record<Element, number>>(
    (acc, element) => {
      acc[element] = 0;
      return acc;
    },
    {} as Record<Element, number>,
  );
}

async function readBalance(tx: DbOrTx, userId: string): Promise<WalletBalance> {
  const [row] = await tx
    .select({ gold: users.gold, gems: users.gems })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Trainer not found" });
  return row;
}

async function readMaterial(
  tx: DbOrTx,
  userId: string,
  element: Element,
): Promise<number> {
  const [row] = await tx
    .select({ amount: materials.amount })
    .from(materials)
    .where(and(eq(materials.userId, userId), eq(materials.element, element)))
    .limit(1);
  return row?.amount ?? 0;
}
