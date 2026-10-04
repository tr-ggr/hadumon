import { RARITY_LABELS, type Rarity } from "~/server/game/cats";
import { RARITY_PALETTES } from "~/components/sprites/palettes";

export interface RarityBadgeProps {
  rarity: Rarity;
  className?: string;
}

export function RarityBadge({ rarity, className = "" }: RarityBadgeProps) {
  const palette = RARITY_PALETTES[rarity];
  return (
    <span
      className={`text-pixel inline-block border px-1 py-0.5 text-[8px] uppercase ${className}`}
      style={{
        color: palette.outline,
        borderColor: palette.outline,
        boxShadow:
          rarity === "legendary" ? `0 0 6px ${palette.glow}` : undefined,
      }}
    >
      {RARITY_LABELS[rarity]}
    </span>
  );
}
