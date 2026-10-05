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
  /**
   * `board` is two labelled rows and a line of status, for a board under the
   * book. `flags` is the two groups side by side with nothing else printed,
   * to stand along the book's top edge, one group over each page.
   */
  layout?: "board" | "flags";
}

/**
 * The element and rarity filter tokens for the Cats chapter, and one line
 * saying what they have left. Setting one deals the chapter's pages out
 * again.
 */
export function CatFilters({
  filters,
  onChange,
  shown,
  total,
  layout = "board",
}: CatFiltersProps) {
  const filtered = isFiltered(filters);
  const matches = `${shown} of ${total} cats match.`;
  const groups = (
    <>
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
    </>
  );

  if (layout === "flags") {
    return (
      <div className="book-flags">
        {groups}
        {/* The count is printed at the head of the page; this reads it out. */}
        <p aria-live="polite" className="sr-only">
          {filtered ? matches : ""}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups}
      <p aria-live="polite" className="text-sm">
        {filtered
          ? matches
          : "Tap a cat you have unlocked to read its whole card."}
      </p>
    </div>
  );
}
