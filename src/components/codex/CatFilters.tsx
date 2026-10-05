import { ElementMark } from "~/components/cats/CatCard";
import { RARITIES, RARITY_LABELS, type Rarity } from "~/server/game/cats";
import { ELEMENT_LABELS, ELEMENTS, type Element } from "~/server/game/elements";
import { isFiltered, type Filters } from "./book";
import { FilterChips, type FilterOption } from "./FilterChips";

const ELEMENT_OPTIONS: FilterOption<Element>[] = ELEMENTS.map((element) => ({
  value: element,
  label: ELEMENT_LABELS[element],
  mark: <ElementMark element={element} />,
}));

const RARITY_OPTIONS: FilterOption<Rarity>[] = RARITIES.map((rarity) => ({
  value: rarity,
  label: RARITY_LABELS[rarity],
}));

export interface CatFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  /** How many cats the filters leave, of how many there are. */
  shown: number;
  total: number;
}

/**
 * The two rows of filter tokens for the Cats chapter, and one line saying
 * what they have left. Setting one deals the chapter's pages out again.
 */
export function CatFilters({
  filters,
  onChange,
  shown,
  total,
}: CatFiltersProps) {
  return (
    <div className="space-y-3">
      <FilterChips
        label="Element"
        options={ELEMENT_OPTIONS}
        value={filters.element}
        onChange={(element) => onChange({ ...filters, element })}
      />
      <FilterChips
        label="Rarity"
        options={RARITY_OPTIONS}
        value={filters.rarity}
        onChange={(rarity) => onChange({ ...filters, rarity })}
      />
      <p aria-live="polite" className="text-sm">
        {isFiltered(filters)
          ? `${shown} of ${total} cats match.`
          : "Tap a cat you have unlocked to read its whole card."}
      </p>
    </div>
  );
}
