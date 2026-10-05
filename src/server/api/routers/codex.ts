import { ownedBy } from "~/server/api/economy";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { heldUnlocks } from "~/server/api/routers/run";
import { CAT_LIST } from "~/server/game/cats";
import { copyCap } from "~/server/game/collection";
import { packOf } from "~/server/game/packs";
import { RELIC_LIST } from "~/server/game/relics";
import { UNLOCK_RULES, unlockId } from "~/server/game/unlocks";

export interface CodexEntry {
  id: string;
  /** A cat the account owns a copy of, or a relic it has unlocked. */
  unlocked: boolean;
  /** How to come by it; `null` once it is held. */
  hint: string | null;
  /** Copies of a cat the account owns, and the most it can; `null` for a relic. */
  copies: number | null;
  cap: number | null;
}

export const codexRouter = createTRPCRouter({
  /**
   * Every cat and relic, flagged by whether the account holds it. The
   * catalogue itself is static and imported client-side by id.
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const [held, owned] = await Promise.all([
      heldUnlocks(ctx.db, ctx.user.id),
      ownedBy(ctx.db, ctx.user.id),
    ]);
    const paid = new Set(held.map(unlockId));
    const hints = new Map(
      UNLOCK_RULES.map((rule) => [unlockId(rule), rule.hint]),
    );
    return {
      cats: CAT_LIST.map((cat): CodexEntry => {
        const copies = owned[cat.id] ?? 0;
        const key = unlockId({ kind: "cat", key: cat.id });
        const found = `Found in the ${packOf(cat.id).name}.`;
        // A prize not yet paid is the surer way; a pack is the other.
        const goal = paid.has(key) ? undefined : hints.get(key);
        return {
          id: cat.id,
          unlocked: copies > 0,
          hint: copies > 0 ? null : goal ? `${goal} Or: ${found}` : found,
          copies,
          cap: copyCap(cat.id),
        };
      }),
      relics: RELIC_LIST.map((relic): CodexEntry => {
        const key = unlockId({ kind: "relic", key: relic.id });
        const unlocked = paid.has(key);
        return {
          id: relic.id,
          unlocked,
          hint: unlocked ? null : (hints.get(key) ?? null),
          copies: null,
          cap: null,
        };
      }),
    };
  }),
});
