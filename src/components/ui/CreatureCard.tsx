import type { ReactNode } from "react";

import { CreatureArt } from "~/components/CreatureArt";
import { RARITY_PALETTES } from "~/components/sprites/palettes";
import type { Element } from "~/server/game/elements";
import type { Rarity } from "~/server/game/species";
import { ElementBadge } from "./ElementBadge";
import { RarityBadge } from "./RarityBadge";

const STATUS_LABELS: Record<string, string> = {
  idle: "Idle",
  expedition: "On expedition",
  listed: "Listed",
  trading: "In trade",
};

export interface CreatureCardCreature {
  id: string;
  speciesId: string;
  name: string;
  level: number;
  power: number;
  status?: string;
  species: { element: Element; rarity: Rarity };
}

export interface CreatureCardProps {
  creature: CreatureCardCreature;
  spriteSize?: number;
  footer?: ReactNode;
  selected?: boolean;
  className?: string;
}

export function CreatureCard({
  creature,
  spriteSize = 72,
  footer,
  selected = false,
  className = "",
}: CreatureCardProps) {
  const palette = RARITY_PALETTES[creature.species.rarity];

  return (
    <article
      className={`panel-flat flex flex-col items-center gap-2 p-3 text-center ${className}`}
      style={{
        borderColor: selected ? "var(--color-gold)" : palette.outline,
        boxShadow: selected
          ? `0 0 0 3px var(--color-cobalt)`
          : creature.species.rarity === "legendary" ||
              creature.species.rarity === "epic"
            ? `0 8px 20px ${palette.glow}`
            : "0 8px 20px rgb(23 33 43 / 0.08)",
      }}
    >
      <CreatureArt speciesId={creature.speciesId} size={spriteSize + 24} />
      <h3 className="text-pixel text-ink w-full text-base">{creature.name}</h3>
      <div className="flex flex-wrap items-center justify-center gap-1">
        <ElementBadge element={creature.species.element} />
        <RarityBadge rarity={creature.species.rarity} />
      </div>
      <p className="text-ink-dim text-base leading-none">
        Lv <span className="text-ink tabular-nums">{creature.level}</span>
        <span className="text-edge mx-1">|</span>
        <span className="text-gold tabular-nums">{creature.power}</span> PWR
      </p>
      {creature.status && creature.status !== "idle" ? (
        <p className="text-pixel text-pink text-[7px] uppercase">
          {STATUS_LABELS[creature.status] ?? creature.status}
        </p>
      ) : null}
      {footer}
    </article>
  );
}
