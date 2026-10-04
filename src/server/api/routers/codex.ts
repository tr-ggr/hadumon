import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { heldUnlocks } from "~/server/api/routers/run";
import { CAT_LIST } from "~/server/game/cats";
import { RELIC_LIST } from "~/server/game/relics";
import { CLAN_LIST } from "~/server/game/run";
import { UNLOCK_RULES, unlockId, type UnlockKind } from "~/server/game/unlocks";

export interface CodexEntry {
  id: string;
  unlocked: boolean;
  /** How to unlock it; `null` once unlocked or if it was open from the start. */
  hint: string | null;
}

export const codexRouter = createTRPCRouter({
  /**
   * Every cat, relic and clan, flagged by whether the account holds it. The
   * catalogue itself is static and imported client-side by id.
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const held = new Set(
      (await heldUnlocks(ctx.db, ctx.user.id)).map(unlockId),
    );
    const hints = new Map(
      UNLOCK_RULES.map((rule) => [unlockId(rule), rule.hint]),
    );
    const entry = (kind: UnlockKind, id: string): CodexEntry => {
      const key = unlockId({ kind, key: id });
      const unlocked = held.has(key);
      return { id, unlocked, hint: unlocked ? null : (hints.get(key) ?? null) };
    };
    return {
      cats: CAT_LIST.map((cat) => entry("cat", cat.id)),
      relics: RELIC_LIST.map((relic) => entry("relic", relic.id)),
      clans: CLAN_LIST.map((clan) => entry("clan", clan.id)),
    };
  }),
});
