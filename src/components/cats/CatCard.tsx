import type { CSSProperties } from "react";

import { PixelIcon } from "~/components/PixelIcon";
import { PixelSprite } from "~/components/PixelSprite";
import type { IconName } from "~/components/sprites/icons";
import {
  ELEMENT_PALETTES,
  RARITY_PALETTES,
} from "~/components/sprites/palettes";
import {
  describeAura,
  describePower,
  getCat,
  playCost,
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
  /**
   * `full` shows rows, capacity and flavor; `compact` is for a tray or an
   * offer; `hand` is the portrait face held in a fan, with everything that
   * names the cat in the left strip that an overlapping card leaves showing.
   */
  variant?: "full" | "compact" | "hand";
  /** Dims the card and shows this instead of the rules, e.g. an unlock hint. */
  lockedHint?: string | null;
  /** Food taken off the cost by a legendary's relic on the board, in a match. */
  discount?: number;
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
  discount = 0,
  className = "",
}: CatCardProps) {
  const cat = getCat(catId);
  const locked = lockedHint !== undefined && lockedHint !== null;
  const full = variant === "full";
  const cost = playCost(catId, discount);
  const rarity = {
    "--rarity": RARITY_PALETTES[cat.rarity].outline,
  } as CSSProperties;
  const points = (
    <p
      className="text-pixel border-ink bg-lime shrink-0 border-2 px-1.5 text-sm leading-6"
      aria-label={`${cat.points} points`}
    >
      {cat.points}
    </p>
  );
  const pips =
    cost.length > 0 ? (
      cost.map((pip, i) => <EssencePip key={i} kind={pip} />)
    ) : (
      <span className="text-ink-soft text-xs leading-4">Free</span>
    );

  if (variant === "hand") {
    // The face answers to its own width, not the screen's: a narrow card
    // takes the smaller sprite and clamps its rules to what fits.
    return (
      <div
        className={`piece piece-card cat-card border-ink bg-cream text-ink @container flex flex-col border-2 p-2 pb-8 text-left ${className}`}
        style={rarity}
      >
        <div className="flex items-start gap-1.5">
          {/* The two numbers a player compares stand in the first 32px, which
              the thinnest strip of the fan still shows. */}
          <div className="flex w-8 shrink-0 flex-col gap-1">
            <p
              className="text-pixel border-ink bg-lime border-2 text-center text-sm leading-6"
              aria-label={`${cat.points} points`}
            >
              {cat.points}
            </p>
            <div className="grid grid-cols-2 justify-items-center gap-y-0.5">
              {pips}
            </div>
          </div>
          <PixelSprite
            catId={catId}
            size={64}
            decorative
            className="h-12 w-12 shrink-0 @[9.5rem]:h-16 @[9.5rem]:w-16"
          />
        </div>
        <p className="text-pixel mt-1 truncate text-sm leading-tight">
          {cat.name}
        </p>
        <div className="border-ink/20 mt-1.5 space-y-1 border-t pt-1.5 text-[11px] leading-[1.35] @[9.5rem]:text-xs @[9.5rem]:leading-snug">
          <p
            className={`@[9.5rem]:line-clamp-none ${cat.aura ? "line-clamp-2" : "line-clamp-4"}`}
          >
            {cat.power ? describePower(cat.power) : "No power."}
          </p>
          {cat.aura ? (
            <p className="line-clamp-2 @[9.5rem]:line-clamp-none">
              {describeAura(cat.aura)}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`piece piece-card cat-card border-ink bg-cream text-ink @container flex flex-col gap-2 border-2 p-2 text-left ${locked ? "opacity-60" : ""} ${className}`}
      style={rarity}
    >
      {/* On a narrow card the name takes a line of its own under the sprite
          and the points, so it is never cut down to a letter or two. */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <PixelSprite
          catId={catId}
          size={full ? 72 : 44}
          decorative
          className={`shrink-0 ${locked ? "grayscale" : ""}`}
        />
        <div className="order-last min-w-0 basis-full @[11rem]:order-none @[11rem]:flex-1 @[11rem]:basis-0">
          <p className="text-pixel truncate text-sm leading-tight">
            {cat.name}
          </p>
          <div className="mt-1 flex items-center gap-1">{pips}</div>
        </div>
        <div className="ml-auto">{points}</div>
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

      {cat.aura && !locked ? (
        <p className="text-xs leading-snug">{describeAura(cat.aura)}</p>
      ) : null}

      {full && !locked ? (
        <p className="text-ink-soft text-xs italic">{cat.flavor}</p>
      ) : null}
    </div>
  );
}
