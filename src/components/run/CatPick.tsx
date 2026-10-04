"use client";

import type { ReactNode } from "react";

import { CatCard } from "~/components/cats/CatCard";
import { Button, Modal } from "~/components/ui";
import { getCat } from "~/server/game/cats";

import { KeyHint } from "./pieces";
import { rowsLabel } from "./turn";

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
  className = "",
}: CatPickProps) {
  const cat = getCat(catId);
  const open = pickable && !disabled;
  const card = (
    <CatCard
      catId={catId}
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
        <span className="text-ink-soft min-w-0 truncate text-[11px] font-bold">
          {selected ? (
            <span className="text-cobalt">Chosen</span>
          ) : (
            (note ?? rowsLabel(cat.rows))
          )}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {hint ? <KeyHint>{hint}</KeyHint> : null}
          <InfoButton name={cat.name} onClick={onDetail} />
        </span>
      </div>
    </div>
  );
}

function InfoButton({ name, onClick }: { name: string; onClick: () => void }) {
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

/** The full card in a dialog. Rendered once per screen; `catId` opens it. */
export function CatDetail({
  catId,
  onClose,
}: {
  catId: string | null;
  onClose: () => void;
}) {
  return (
    <Modal
      open={catId !== null}
      onClose={onClose}
      title={catId ? getCat(catId).name : ""}
      footer={
        <Button variant="secondary" data-autofocus onClick={onClose}>
          Close
        </Button>
      }
    >
      {catId ? <CatCard catId={catId} variant="full" /> : null}
    </Modal>
  );
}
