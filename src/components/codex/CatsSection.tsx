"use client";

import { useState } from "react";

import { CatCard, ElementMark } from "~/components/cats/CatCard";
import { Modal, TableButton } from "~/components/ui";
import {
  getCat,
  RARITIES,
  RARITY_LABELS,
  type Rarity,
} from "~/server/game/cats";
import { ELEMENT_LABELS, ELEMENTS, type Element } from "~/server/game/elements";
import { FilterChips, type FilterOption } from "./FilterChips";
import { lockedText, type CodexEntry } from "./entries";

const ELEMENT_OPTIONS: FilterOption<Element>[] = ELEMENTS.map((element) => ({
  value: element,
  label: ELEMENT_LABELS[element],
  mark: <ElementMark element={element} />,
}));

const RARITY_OPTIONS: FilterOption<Rarity>[] = RARITIES.map((rarity) => ({
  value: rarity,
  label: RARITY_LABELS[rarity],
}));

/** The cat grid: element and rarity filters, and the full card in a dialog. */
export function CatsSection({ entries }: { entries: readonly CodexEntry[] }) {
  const [element, setElement] = useState<Element | null>(null);
  const [rarity, setRarity] = useState<Rarity | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const shown = entries.filter((entry) => {
    const cat = getCat(entry.id);
    return (
      (element === null || cat.element === element) &&
      (rarity === null || cat.rarity === rarity)
    );
  });
  const filtered = element !== null || rarity !== null;
  const clearFilters = () => {
    setElement(null);
    setRarity(null);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <FilterChips
          label="Element"
          options={ELEMENT_OPTIONS}
          value={element}
          onChange={setElement}
        />
        <FilterChips
          label="Rarity"
          options={RARITY_OPTIONS}
          value={rarity}
          onChange={setRarity}
        />
      </div>

      <p aria-live="polite" className="text-sm">
        {filtered
          ? `${shown.length} of ${entries.length} cats match.`
          : "Tap a cat you have unlocked to read its whole card."}
      </p>

      {shown.length === 0 ? (
        <div className="border-ink/40 flex flex-col items-start gap-3 border-2 border-dashed p-4">
          <p className="text-ink">
            No cat is both of those things. Several have tried.
          </p>
          <TableButton variant="secondary" size="sm" onClick={clearFilters}>
            Clear filters
          </TableButton>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((entry) => (
            <li key={entry.id} className="flex">
              {entry.unlocked ? (
                <button
                  type="button"
                  aria-haspopup="dialog"
                  aria-label={`${getCat(entry.id).name}: read the whole card`}
                  onClick={() => setOpenId(entry.id)}
                  className="liftable flex w-full cursor-pointer text-left"
                >
                  <CatCard catId={entry.id} className="w-full" />
                </button>
              ) : (
                <CatCard
                  catId={entry.id}
                  lockedHint={lockedText(entry)}
                  className="w-full"
                />
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={openId !== null}
        onClose={() => setOpenId(null)}
        title={openId ? getCat(openId).name : ""}
        footer={
          <TableButton
            size="md"
            variant="secondary"
            data-autofocus
            onClick={() => setOpenId(null)}
          >
            Close
          </TableButton>
        }
      >
        {openId ? <CatCard catId={openId} variant="full" /> : null}
      </Modal>
    </div>
  );
}
