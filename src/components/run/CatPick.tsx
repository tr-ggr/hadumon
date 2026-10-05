"use client";

import type { ReactNode } from "react";

import { CatCard } from "~/components/cats/CatCard";
import { Habitats } from "~/components/cats/Habitats";
import { Modal, TableButton } from "~/components/ui";
import { getCat } from "~/server/game/cats";

import { plural } from "./describe";
import { KeyHint } from "./pieces";

export interface CatPickProps {
  catId: string;
  onDetail: () => void;
  /** Omit to show a card that cannot be selected, only inspected. */
  onSelect?: () => void;
  selected?: boolean;
  disabled?: boolean;
  /** Marks the card as one of the things to choose from right now. */
  pickable?: boolean;
  /** Greys the card without disabling it, e.g. a cat with no legal row. */
  dimmed?: boolean;
  /** What selecting does, for assistive tech: "Play", "Keep", "Draw". */
  verb?: string;
  /** Replaces the row list in the card's footer. */
  note?: ReactNode;
  /** A key that selects this card, shown where there is a keyboard. */
  hint?: string;
  /** Food taken off the cost by a legendary's relic on the board. */
  discount?: number;
  className?: string;
}

/**
 * A cat card in a hand, tray or offer. The card is the select control; the
 * small Info control opens the full card and never selects. The two are
 * siblings so neither nests inside the other.
 */
export function CatPick({
  catId,
  onDetail,
  onSelect,
  selected = false,
  disabled = false,
  pickable = false,
  dimmed = false,
  verb = "Select",
  note,
  hint,
  discount,
  className = "",
}: CatPickProps) {
  const cat = getCat(catId);
  const open = pickable && !disabled;
  const card = (
    <CatCard
      catId={catId}
      discount={discount}
      className={`h-full pb-8 ${selected ? "is-chosen" : open ? "is-open" : ""}`}
    />
  );

  return (
    <div
      className={`relative ${selected ? "lift" : onSelect && !disabled ? "liftable" : ""} ${dimmed && !selected ? "opacity-60" : ""} ${className}`}
    >
      {onSelect ? (
        <button
          type="button"
          onClick={onSelect}
          disabled={disabled}
          aria-pressed={selected}
          aria-label={`${verb} ${cat.name}`}
          className="block h-full w-full text-left disabled:cursor-not-allowed"
        >
          {card}
        </button>
      ) : (
        card
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 px-1.5 pb-1.5 pl-2">
        {selected || (note !== undefined && note !== null) ? (
          <span className="text-ink-soft min-w-0 truncate text-[11px] font-bold">
            {selected ? <span className="text-cobalt">Chosen</span> : note}
          </span>
        ) : (
          <Habitats rows={cat.rows} />
        )}
        <span className="flex shrink-0 items-center gap-1.5">
          {hint ? <KeyHint>{hint}</KeyHint> : null}
          <InfoButton name={cat.name} onClick={onDetail} />
        </span>
      </div>
    </div>
  );
}

/** Opens the full card. A sibling of the card's own control, never inside it. */
export function InfoButton({
  name,
  onClick,
}: {
  name: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${name} details`}
      className="border-ink text-ink hover:bg-sky-soft pointer-events-auto relative shrink-0 border-2 bg-white px-1.5 text-[11px] leading-5 font-black before:absolute before:-inset-2 before:content-['']"
    >
      Info
    </button>
  );
}

/** What is tucked under a cat on the mat. */
export interface TuckedUnder {
  /** Can exceed `under` on a match saved before tucks were recorded. */
  count: number;
  under: readonly string[];
}

/**
 * The full card in a dialog. Rendered once per screen; `catId` opens it. A
 * cat on the mat also lists the cats tucked under it.
 */
export function CatDetail({
  catId,
  tucked,
  onClose,
}: {
  catId: string | null;
  tucked?: TuckedUnder;
  onClose: () => void;
}) {
  const name = catId ? getCat(catId).name : "";
  const unseen = tucked ? tucked.count - tucked.under.length : 0;
  return (
    <Modal
      open={catId !== null}
      onClose={onClose}
      title={name}
      footer={
        <TableButton
          size="md"
          variant="secondary"
          data-autofocus
          onClick={onClose}
        >
          Close
        </TableButton>
      }
    >
      {catId ? <CatCard catId={catId} variant="full" /> : null}
      {tucked && tucked.count > 0 ? (
        <section className="mt-4">
          <h3 className="text-ink text-sm font-bold">
            Tucked under {name}: {plural(tucked.count, "cat")}, a point each
          </h3>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {tucked.under.map((under, index) => (
              <li key={`${index}-${under}`}>
                <CatCard catId={under} variant="compact" className="h-full" />
              </li>
            ))}
          </ul>
          {unseen > 0 ? (
            <p className="text-ink-soft mt-2 text-xs">
              {tucked.under.length > 0
                ? `${plural(unseen, "more cat")} went under before the table kept track of which.`
                : `These went under before the table kept track of which cats they were.`}
            </p>
          ) : null}
        </section>
      ) : null}
    </Modal>
  );
}
