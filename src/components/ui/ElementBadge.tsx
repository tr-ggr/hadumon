import { ELEMENT_LABELS, type Element } from "~/server/game/elements";
import { ELEMENT_PALETTES } from "~/components/sprites/palettes";

export interface ElementBadgeProps {
  element: Element;
  className?: string;
}

export function ElementBadge({ element, className = "" }: ElementBadgeProps) {
  const palette = ELEMENT_PALETTES[element];
  return (
    <span
      className={`text-pixel inline-block border px-1 py-0.5 text-[8px] uppercase ${className}`}
      style={{ color: palette["1"], borderColor: palette["1"] }}
    >
      {ELEMENT_LABELS[element]}
    </span>
  );
}
