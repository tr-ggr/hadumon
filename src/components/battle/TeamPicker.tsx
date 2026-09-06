"use client";

import { PixelSprite } from "~/components/PixelSprite";
import { ElementBadge } from "~/components/ui";
import type { Element } from "~/server/game/elements";
import type { Rarity } from "~/server/game/species";

export interface PickableCreature {
  id: string;
  speciesId: string;
  name: string;
  level: number;
  power: number;
  species: { element: Element; rarity: Rarity };
}

export interface TeamPickerProps {
  creatures: readonly PickableCreature[];
  selected: readonly string[];
  onChange: (ids: string[]) => void;
  max?: number;
  className?: string;
}

/**
 * Tap-to-toggle roster grid used by both the defense editor and the attack
 * modal. Selection order is preserved so slot 1 is always the first tap.
 */
export function TeamPicker({
  creatures,
  selected,
  onChange,
  max = 4,
  className = "",
}: TeamPickerProps) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((value) => value !== id));
    } else if (selected.length < max) {
      onChange([...selected, id]);
    }
  };

  if (creatures.length === 0) {
    return <p className="text-ink-dim text-lg">No cats to pick from yet.</p>;
  }

  return (
    <ul
      className={`grid max-h-64 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4 ${className}`}
    >
      {creatures.map((creature) => {
        const slot = selected.indexOf(creature.id);
        const picked = slot >= 0;
        const full = !picked && selected.length >= max;

        return (
          <li key={creature.id}>
            <button
              type="button"
              onClick={() => toggle(creature.id)}
              disabled={full}
              aria-pressed={picked}
              className={`panel-flat flex w-full flex-col items-center gap-0.5 p-1 text-center disabled:opacity-40 ${
                picked ? "border-gold" : "border-edge"
              }`}
            >
              <span className="relative">
                <PixelSprite speciesId={creature.speciesId} size={44} />
                {picked ? (
                  <span className="text-pixel bg-gold text-navy absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center text-[8px]">
                    {slot + 1}
                  </span>
                ) : null}
              </span>
              <span className="text-pixel text-ink w-full truncate text-[7px]">
                {creature.name}
              </span>
              <span className="text-ink-dim text-sm leading-none">
                Lv {creature.level} ·{" "}
                <span className="text-gold">{creature.power}</span>
              </span>
              <ElementBadge
                element={creature.species.element}
                className="scale-90"
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
