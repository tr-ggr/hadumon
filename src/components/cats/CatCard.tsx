import { PixelSprite } from "~/components/PixelSprite";
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
import { ELEMENT_LABELS } from "~/server/game/elements";

const WILD_COLOR = "#ffffff";

export interface EssencePipProps {
  /** An element, `any` (a cost anything pays), or `wild` (essence that pays anything). */
  kind: CostPip | "wild";
  size?: number;
}

/** One square of essence: element colour, or white with a mark for any/wild. */
export function EssencePip({ kind, size = 12 }: EssencePipProps) {
  const element = kind !== "any" && kind !== "wild" ? kind : null;
  const label = element
    ? ELEMENT_LABELS[element]
    : kind === "any"
      ? "Any"
      : "Wild";
  return (
    <span
      role="img"
      aria-label={`${label} essence`}
      title={`${label} essence`}
      className="border-ink text-ink inline-grid shrink-0 place-items-center border-2 text-[8px] leading-none font-black"
      style={{
        width: size,
        height: size,
        background: element ? ELEMENT_PALETTES[element]["1"] : WILD_COLOR,
      }}
    >
      {kind === "any" ? "?" : kind === "wild" ? "*" : null}
    </span>
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
      className={`border-ink bg-cream text-ink flex flex-col gap-2 border-2 p-2 text-left ${locked ? "opacity-60" : ""} ${className}`}
      style={{
        boxShadow: `inset 0 3px 0 ${RARITY_PALETTES[cat.rarity].outline}`,
      }}
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
