import { Stat } from "~/components/ui";
import { ELEMENTS } from "~/server/game/elements";
import { RARITIES, SPECIES_LIST } from "~/server/game/species";
import { ZONES } from "~/server/game/zones";

export interface RosterStatsProps {
  className?: string;
}

/**
 * Four counts, all derived from the game code — never typed by hand.
 *
 * Phase 1 placeholder — Agent B owns the finished strip.
 */
export function RosterStats({ className = "" }: RosterStatsProps) {
  return (
    <div className={`grid grid-cols-2 gap-2 sm:grid-cols-4 ${className}`}>
      <Stat label="Cats" value={SPECIES_LIST.length} tone="pink" />
      <Stat label="Elements" value={ELEMENTS.length} tone="mint" />
      <Stat label="Rarities" value={RARITIES.length} tone="gold" />
      <Stat label="Zones" value={ZONES.length} tone="sky" />
    </div>
  );
}
