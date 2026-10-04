import type { CSSProperties } from "react";

import { PixelIcon } from "~/components/PixelIcon";
import { PixelSprite } from "~/components/PixelSprite";
import type { IconName } from "~/components/sprites/icons";
import {
  ELEMENT_PALETTES,
  RARITY_PALETTES,
} from "~/components/sprites/palettes";
import {
  describePower,
  getCat,
  RARITY_LABELS,
  ROW_LABELS,
  type CostPip,
} from "~/server/game/cats";
import {
  ELEMENT_LABELS,
  FOOD_LABELS,
  TREAT_LABEL,
  type Element,
} from "~/server/game/elements";

const FOOD_ICONS: Record<CostPip | "wild", IconName> = {
  flame: "beef",
  mist: "fish",
  volt: "chicken",
  thorn: "dryFood",
  shade: "pork",
  wild: "treat",
  any: "any",
};

export interface EssencePipProps {
  /** A food by its element, `any` (a cost any food pays), or `wild` (a treat, which pays for anything). */
  kind: CostPip | "wild";
  /** Edge length; a multiple of 8 keeps the pixels whole. */
  size?: number;
}

/**
 * One cat food as its own pixel shape, filled with its element's colour. A
 * treat and a cost any food pays are white.
 */
export function EssencePip({ kind, size = 16 }: EssencePipProps) {
  const element = kind !== "any" && kind !== "wild" ? kind : null;
  const label = element
    ? FOOD_LABELS[element]
    : kind === "any"
      ? "Any food"
      : TREAT_LABEL;
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="inline-flex shrink-0"
    >
      <PixelIcon
        name={FOOD_ICONS[kind]}
        size={size}
        fill={element ? ELEMENT_PALETTES[element]["1"] : undefined}
      />
    </span>
  );
}

/** An element's own shape in its colour, to sit beside the element's name. */
export function ElementMark({
  element,
  size = 16,
}: {
  element: Element;
  size?: number;
}) {
  return (
    <PixelIcon
      name={element}
      size={size}
      fill={ELEMENT_PALETTES[element]["1"]}
    />
  );
}

export interface CatCardProps {
  catId: string;
  /** `full` shows rows, capacity and flavor; `compact` is for a hand or tray. */
  variant?: "full" | "compact";
  /** Dims the card and shows this instead of the rules, e.g. an unlock hint. */
  lockedHint?: string | null;
  className?: string;
}

/**
 * A cat as a card: sprite, cost, points and rules text. Purely presentational
 * so it can sit inside a button, a list item or a dialog.
 */
export function CatCard({
  catId,
  variant = "compact",
  lockedHint,
  className = "",
}: CatCardProps) {
  const cat = getCat(catId);
  const locked = lockedHint !== undefined && lockedHint !== null;
  const full = variant === "full";

  return (
    <div
      className={`piece piece-card cat-card border-ink bg-cream text-ink flex flex-col gap-2 border-2 p-2 text-left ${locked ? "opacity-60" : ""} ${className}`}
      style={
        { "--rarity": RARITY_PALETTES[cat.rarity].outline } as CSSProperties
      }
    >
      <div className="flex items-center gap-2">
        <PixelSprite
          catId={catId}
          size={full ? 72 : 44}
          decorative
          className={`shrink-0 ${locked ? "grayscale" : ""}`}
        />
        <div className="min-w-0 flex-1">
          <p className="text-pixel truncate text-sm leading-tight">
            {cat.name}
          </p>
          <div className="mt-1 flex items-center gap-1">
            {cat.cost.map((pip, i) => (
              <EssencePip key={i} kind={pip} />
            ))}
          </div>
        </div>
        <p
          className="text-pixel border-ink bg-lime shrink-0 border-2 px-1.5 text-sm leading-6"
          aria-label={`${cat.points} points`}
        >
          {cat.points}
        </p>
      </div>

      {full ? (
        <p className="text-ink-soft text-xs">
          {RARITY_LABELS[cat.rarity]} · {ELEMENT_LABELS[cat.element]} · lives in{" "}
          {cat.rows.map((row) => ROW_LABELS[row]).join(" or ")} · holds{" "}
          {cat.yarnCap} yarn
        </p>
      ) : null}

      <p className="border-ink/20 border-t pt-1.5 text-xs leading-snug">
        {locked
          ? lockedHint
          : cat.power
            ? describePower(cat.power)
            : "No power."}
      </p>

      {full && !locked ? (
        <p className="text-ink-soft text-xs italic">{cat.flavor}</p>
      ) : null}
    </div>
  );
}
