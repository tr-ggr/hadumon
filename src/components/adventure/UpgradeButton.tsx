"use client";

import { Button, useToast } from "~/components/ui";
import { MATERIAL_LABELS } from "~/server/game/elements";
import { nextUpgradeCost, MAX_UPGRADE_TIER } from "~/server/game/progression";
import { api } from "~/trpc/react";

export interface UpgradeButtonCreature {
  id: string;
  name: string;
  speciesId: string;
  upgradeTier: number;
}

export interface UpgradeButtonProps {
  creature: UpgradeButtonCreature;
  size?: "sm" | "md";
  className?: string;
  /** Called after a successful upgrade, with the creature's new tier. */
  onUpgraded?: (tier: number) => void;
  /** Hide the "100 G · 3 Flame Shard" cost line under the button. */
  hideCost?: boolean;
}

/**
 * Spends gold + element shards to raise a cat's upgrade tier.
 *
 * Self-contained: it reads the wallet itself to decide whether the player can
 * afford the next tier, and invalidates the wallet, the collection and the
 * running expedition afterwards. Sprint 06 reuses it on the Collection page.
 */
export function UpgradeButton({
  creature,
  size = "sm",
  className = "",
  onUpgraded,
  hideCost = false,
}: UpgradeButtonProps) {
  const utils = api.useUtils();
  const notify = useToast();
  const me = api.auth.me.useQuery(undefined, { retry: false });

  const upgrade = api.adventure.upgrade.useMutation({
    onSuccess: async (result) => {
      onUpgraded?.(result.creature.upgradeTier);
      await Promise.all([
        utils.auth.me.invalidate(),
        utils.creatures.invalidate(),
        utils.adventure.current.invalidate(),
      ]);
      notify(
        `${creature.name} upgraded to tier ${result.creature.upgradeTier}!`,
      );
    },
    onError: (error) => notify(error.message, "error"),
  });

  const cost = nextUpgradeCost(creature);

  if (!cost) {
    return (
      <p className={`text-pixel text-gold text-[8px] uppercase ${className}`}>
        Tier {MAX_UPGRADE_TIER} · maxed
      </p>
    );
  }

  const wallet = me.data?.wallet;
  const shards = wallet?.materials[cost.materials.element] ?? 0;
  const affordable =
    wallet !== undefined &&
    wallet.gold >= cost.gold &&
    shards >= cost.materials.amount;

  return (
    <div className={`w-full space-y-1 ${className}`}>
      <Button
        size={size}
        variant={affordable ? "primary" : "secondary"}
        className="w-full"
        disabled={!affordable || upgrade.isPending}
        onClick={() => upgrade.mutate({ creatureId: creature.id })}
        title={
          affordable
            ? `Upgrade ${creature.name} to tier ${creature.upgradeTier + 1}`
            : "Not enough gold or shards"
        }
      >
        {upgrade.isPending ? "…" : `Upgrade → T${creature.upgradeTier + 1}`}
      </Button>

      {hideCost ? null : (
        <p className="text-ink-dim text-center text-base leading-tight">
          <span
            className={
              wallet && wallet.gold >= cost.gold ? "text-gold" : "text-pink"
            }
          >
            {cost.gold} G
          </span>
          <span className="text-edge mx-1">·</span>
          <span
            className={
              shards >= cost.materials.amount ? "text-mint" : "text-pink"
            }
          >
            {cost.materials.amount} {MATERIAL_LABELS[cost.materials.element]}
          </span>
        </p>
      )}
    </div>
  );
}
