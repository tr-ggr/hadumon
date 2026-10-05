import { ElementMark } from "~/components/cats/CatCard";
import { PixelSprite } from "~/components/PixelSprite";
import { getCat } from "~/server/game/cats";
import { ELEMENT_LABELS } from "~/server/game/elements";

import { countCats } from "./packs";

/**
 * A list of cards spread out as small tiles, one a cat with its count: a
 * deck before a run, or the cards the rivals made off with.
 */
export function DeckSpread({
  cards,
  label,
  tone = "cream",
  className = "",
}: {
  cards: readonly string[];
  /** Names the list for assistive tech, e.g. "Your deck". */
  label: string;
  /** Coral for cards a rival holds; cream for the player's own. */
  tone?: "cream" | "coral";
  className?: string;
}) {
  return (
    <ul
      aria-label={label}
      className={`flex flex-wrap gap-x-2 gap-y-3.5 pb-2 ${className}`}
    >
      {countCats(cards).map(([catId, copies]) => {
        const cat = getCat(catId);
        return (
          <li
            key={catId}
            className={`piece border-ink text-ink flex min-h-10 items-center gap-1 border-2 py-0.5 pr-2 pl-0.5 text-xs font-bold ${tone === "coral" ? "bg-coral" : "bg-cream"}`}
          >
            <PixelSprite catId={catId} size={32} decorative />
            <ElementMark element={cat.element} />
            <span className="tabular-nums">
              {copies}× {cat.name}
            </span>
            <span className="sr-only">, {ELEMENT_LABELS[cat.element]}</span>
          </li>
        );
      })}
    </ul>
  );
}
