"use client";

import { ELEMENT_PALETTES } from "~/components/sprites/palettes";
import { ElementBadge } from "~/components/ui";
import type { RouterOutputs } from "~/trpc/react";

export type ZoneCardZone = RouterOutputs["adventure"]["zones"]["zones"][number];

export interface ZoneCardProps {
  zone: ZoneCardZone;
  selected?: boolean;
  /** The player's current squad power, used for the "underpowered" hint. */
  power?: number;
  onSelect?: (zoneId: string) => void;
}

/** A pixel "map card" for one zone. Locked zones render greyed with the requirement. */
export function ZoneCard({ zone, selected = false, power, onSelect }: ZoneCardProps) {
  const palette = ELEMENT_PALETTES[zone.element];
  const underpowered = power !== undefined && power < zone.recommendedPower;

  return (
    <button
      type="button"
      disabled={!zone.unlocked}
      aria-pressed={selected}
      onClick={() => onSelect?.(zone.id)}
      className={`panel-flat pixel-press w-full p-2 text-left transition-opacity disabled:cursor-not-allowed disabled:opacity-45 ${
        zone.unlocked ? "hover:bg-panel-hi" : ""
      }`}
      style={{
        borderColor: selected ? "var(--color-gold)" : zone.unlocked ? palette["1"] : undefined,
        boxShadow: selected ? "0 0 0 2px var(--color-gold), 3px 3px 0 #000" : "3px 3px 0 #000",
      }}
    >
      <div
        aria-hidden
        className="mb-2 h-8 w-full border-2 border-edge"
        style={{
          background: `repeating-linear-gradient(135deg, ${palette["3"]} 0 6px, ${palette["1"]} 6px 12px)`,
        }}
      />

      <div className="flex items-start justify-between gap-1">
        <h3 className="text-pixel text-[9px] leading-relaxed text-ink">{zone.name}</h3>
        <span className="text-pixel shrink-0 text-[8px] text-gold">T{zone.tier}</span>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-1">
        <ElementBadge element={zone.element} />
        {zone.unlocked ? (
          <span className="text-pixel border border-edge px-1 py-0.5 text-[7px] text-ink-dim uppercase">
            {zone.wins} wins
          </span>
        ) : (
          <span className="text-pixel border border-pink px-1 py-0.5 text-[7px] text-pink uppercase">
            Locked
          </span>
        )}
      </div>

      <p className="mt-1 text-base leading-tight text-ink-dim">{zone.description}</p>

      <dl className="mt-1 space-y-0.5 text-base leading-tight text-ink-dim">
        <div className="flex justify-between gap-2">
          <dt>Enemy Lv</dt>
          <dd className="tabular-nums text-ink">
            {zone.enemyLevelRange[0]}–{zone.enemyLevelRange[1]}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Rec. power</dt>
          <dd className={`tabular-nums ${underpowered ? "text-pink" : "text-ink"}`}>
            {zone.recommendedPower}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Reward ×</dt>
          <dd className="tabular-nums text-gold">{zone.rewardMult.toFixed(2)}</dd>
        </div>
      </dl>

      {!zone.unlocked && zone.unlockZoneName ? (
        <p className="text-pixel mt-2 text-[7px] leading-relaxed text-pink">
          {zone.winsNeeded} more win{zone.winsNeeded === 1 ? "" : "s"} in{" "}
          {zone.unlockZoneName}
        </p>
      ) : null}
    </button>
  );
}
