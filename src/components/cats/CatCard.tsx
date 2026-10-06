import type { CSSProperties } from "react";

import { PixelIcon } from "~/components/PixelIcon";
import { PixelSprite } from "~/components/PixelSprite";
import type { IconName } from "~/components/sprites/icons";
import {
  ELEMENT_PALETTES,
  RARITY_PALETTES,
} from "~/components/sprites/palettes";
import {
  ARCHETYPE_LABELS,
  auraParts,
  getCat,
  playCost,
  powerParts,
  RARITY_LABELS,
  type CostPip,
  type RulesParts,
} from "~/server/game/cats";
import {
  ELEMENT_LABELS,
  FOOD_LABELS,
  TREAT_LABEL,
  type Element,
} from "~/server/game/elements";

import { HabitatIcon, habitatsLabel } from "./Habitats";

/** The lime of a card's points mark, as on the lanes' own marks. */
const LIME = "#d8ff4f";

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

/**
 * An element's own shape in its colour. Beside the element's name it is
 * decoration; with `label` it stands for the name, read out and on hover.
 */
export function ElementMark({
  element,
  size = 16,
  label = false,
}: {
  element: Element;
  size?: number;
  /** Names the element, where no text nearby does. */
  label?: boolean;
}) {
  const mark = (
    <PixelIcon
      name={element}
      size={size}
      fill={ELEMENT_PALETTES[element]["1"]}
    />
  );
  if (!label) return mark;
  return (
    <span
      role="img"
      aria-label={ELEMENT_LABELS[element]}
      title={ELEMENT_LABELS[element]}
      className="inline-flex shrink-0"
    >
      {mark}
    </span>
  );
}

/**
 * How much yarn a cat can hold, as a mark: the ball and the number. The ball
 * is unfilled, because this is room for yarn and not yarn held.
 */
export function YarnCap({
  cap,
  className = "",
}: {
  cap: number;
  className?: string;
}) {
  const label = `Holds ${cap} yarn`;
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={`text-pixel inline-flex shrink-0 items-center gap-0.5 text-sm leading-none tabular-nums ${className}`}
    >
      <PixelIcon name="yarn" size={16} />
      {cap}
    </span>
  );
}

export interface CatCardProps {
  catId: string;
  /**
   * `hand` is the upright card held in a fan, with the lanes, the cost, the
   * element and the points in the left strip that an overlapping card leaves
   * showing. `full` is the same card read on its own, larger, with a foot for
   * the lanes in words and what is said of the cat. `compact` is the tile of
   * a tray or an offer, made of the same parts.
   */
  variant?: "full" | "compact" | "hand";
  /** Dims the card and shows this instead of the rules, e.g. an unlock hint. */
  lockedHint?: string | null;
  /** Food taken off the cost by a legendary's relic on the board, in a match. */
  discount?: number;
  className?: string;
}

/**
 * Where a card's flecks start, from its id: two cards side by side are not
 * the one sheet of paper twice.
 */
function fleckAt(catId: string): { x: number; y: number } {
  let hash = 0;
  for (const letter of catId) hash = (hash * 31 + letter.charCodeAt(0)) % 2304;
  return { x: hash % 48, y: Math.floor(hash / 48) };
}

/**
 * One line of rules in a card's band: what sets it off in the plate's
 * capitals, then what it does. Read out, it is the sentence it always was.
 */
function Rules({ parts, className }: { parts: RulesParts; className: string }) {
  return (
    <p className={className}>
      <span className="card-trigger">{parts.trigger}:</span> {parts.text}
    </p>
  );
}

/**
 * A cat as a printed card: a tab with its lanes, cost and element, its name
 * on a plate, the cat with its points and the yarn it holds, and its power
 * on a band coloured by what sets it off. Purely presentational so it can
 * sit inside a button, a list item or a dialog; the styles are `.paper-card`.
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
  const cost = playCost(catId, discount);
  const fleck = fleckAt(catId);
  const paper = {
    "--rarity": RARITY_PALETTES[cat.rarity].outline,
    "--fleck-x": `${fleck.x}px`,
    "--fleck-y": `${fleck.y}px`,
    // The plate sets a name as large as its letters leave room for.
    "--name-len": cat.name.length,
  } as CSSProperties;
  const mark = variant === "full" ? 24 : 16;

  return (
    <div
      data-variant={variant}
      data-timing={cat.power?.timing ?? "none"}
      data-locked={locked ? "" : undefined}
      data-aura={cat.aura && !locked ? "" : undefined}
      className={`piece piece-card paper-card border-ink text-ink border-2 text-left ${locked ? "opacity-60" : ""} ${className}`}
      style={paper}
    >
      <div className="card-body">
        <div className="card-tab">
          <span role="img" aria-label={habitatsLabel(cat.rows)}>
            {cat.rows.map((row) => (
              <HabitatIcon key={row} row={row} size={mark} />
            ))}
          </span>
          <span role="group" aria-label="Cost">
            {cost.length > 0 ? (
              cost.map((pip, i) => (
                <EssencePip key={i} kind={pip} size={mark} />
              ))
            ) : (
              <span className="card-free">Free</span>
            )}
          </span>
          <ElementMark element={cat.element} size={mark} label />
        </div>

        <header className="card-plate">
          <p className="card-name text-plate">{cat.name}</p>
          <p className="card-kind">
            <span className="card-rarity">{RARITY_LABELS[cat.rarity]} </span>
            <span className="card-archetype">
              {ARCHETYPE_LABELS[cat.archetype].toLowerCase()}
            </span>
          </p>
        </header>

        <div className="card-stats">
          <p
            className="card-score text-pixel tabular-nums"
            aria-label={`${cat.points} points`}
          >
            {cat.points}
            <PixelIcon name="medal" size={mark} fill={LIME} />
          </p>
          <YarnCap cap={cat.yarnCap} className="card-yarn mark-rim" />
        </div>

        <div className="card-art">
          <PixelSprite
            catId={catId}
            size={64}
            decorative
            className="card-sprite"
          />
        </div>

        <div
          className="card-band"
          data-timing={locked ? "none" : (cat.power?.timing ?? "none")}
        >
          {locked ? (
            <p className="card-power">{lockedHint}</p>
          ) : cat.power ? (
            <Rules parts={powerParts(cat.power)} className="card-power" />
          ) : (
            <p className="card-power">No power.</p>
          )}
          {cat.aura && !locked ? (
            <Rules parts={auraParts(cat.aura)} className="card-aura" />
          ) : null}
        </div>

        {variant === "full" ? (
          <footer className="card-foot">
            <p>
              {habitatsLabel(cat.rows)} · holds {cat.yarnCap} yarn
            </p>
            {locked ? null : (
              <p className="text-ink-soft italic">{cat.flavor}</p>
            )}
          </footer>
        ) : null}
      </div>
      {cat.rarity === "legendary" && !locked ? (
        <span aria-hidden className="card-shimmer" />
      ) : null}
    </div>
  );
}
