import { inArray } from "drizzle-orm";

import type { DbOrTx } from "~/server/db";
import { cosmetics } from "~/server/db/schema/economy";
import { isCosmeticId, lookOf, type Look } from "~/server/game/cosmetics";

/** A player as a list shows them: enough to draw their hadu and link to them. */
export interface PlayerCard {
  handle: string;
  name: string;
  look: Look;
}

/** The look each of several accounts wears, made whole from what each owns. */
export async function looksOf(
  db: DbOrTx,
  rows: readonly { userId: string; look: unknown }[],
): Promise<Map<string, Look>> {
  const ids = [...new Set(rows.map((row) => row.userId))];
  const gained = new Map<string, string[]>(ids.map((id) => [id, []]));
  if (ids.length > 0) {
    const owned = await db
      .select({ userId: cosmetics.userId, id: cosmetics.cosmeticId })
      .from(cosmetics)
      .where(inArray(cosmetics.userId, ids));
    for (const { userId, id } of owned) {
      if (isCosmeticId(id)) gained.get(userId)?.push(id);
    }
  }
  return new Map(
    rows.map((row) => [
      row.userId,
      lookOf(row.look, gained.get(row.userId) ?? []),
    ]),
  );
}
