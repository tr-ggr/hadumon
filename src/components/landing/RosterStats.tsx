import { ELEMENTS } from "~/server/game/elements";
import { RARITIES, SPECIES_LIST } from "~/server/game/species";
import { ZONES } from "~/server/game/zones";

export interface RosterStatsProps {
  className?: string;
}

interface RosterCount {
  label: string;
  value: number;
}

/**
 * Every count on this strip is read out of the game modules, so it cannot drift
 * from the game. Hook-free, so it renders in the hero and in the final call
 * without either becoming a client component.
 */
const COUNTS: readonly RosterCount[] = [
  { label: "Cats", value: SPECIES_LIST.length },
  { label: "Elements", value: ELEMENTS.length },
  { label: "Rarities", value: RARITIES.length },
  { label: "Zones", value: ZONES.length },
];

/** Four derived counts: cats, elements, rarity tiers, zones. */
export function RosterStats({ className = "" }: RosterStatsProps) {
  return (
    <dl className={`grid grid-cols-2 gap-2 sm:grid-cols-4 ${className}`}>
      {COUNTS.map((count) => (
        <div
          key={count.label}
          /* Reversed so the value reads first while the DOM keeps `dt` before
             `dd` — screen readers get "Cats, 25". */
          className="panel-flat flex flex-col-reverse items-start gap-1 p-2 shadow-[3px_3px_0_#000]"
        >
          <dt className="text-pixel text-ink-dim text-[8px] tracking-wide uppercase">
            {count.label}
          </dt>
          <dd className="text-pixel text-gold text-xs tabular-nums sm:text-sm">
            {count.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
