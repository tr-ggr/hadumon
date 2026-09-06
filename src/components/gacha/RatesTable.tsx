import { RARITY_PALETTES } from "~/components/sprites/palettes";
import { RARITIES, RARITY_LABELS, type Rarity } from "~/server/game/species";

export interface RatesTableProps {
  rates: Record<Rarity, number>;
  className?: string;
}

/** The banner's drop table, highest rarity first. */
export function RatesTable({ rates, className = "" }: RatesTableProps) {
  return (
    <dl className={`space-y-1 ${className}`}>
      {[...RARITIES].reverse().map((rarity) => (
        <div key={rarity} className="flex items-baseline justify-between gap-2">
          <dt
            className="text-pixel text-[8px] uppercase"
            style={{ color: RARITY_PALETTES[rarity].outline }}
          >
            {RARITY_LABELS[rarity]}
          </dt>
          <dd className="text-ink text-base leading-none tabular-nums">
            {formatRate(rates[rarity])}%
          </dd>
        </div>
      ))}
    </dl>
  );
}

function formatRate(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
