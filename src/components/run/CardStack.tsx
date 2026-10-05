import type { CSSProperties } from "react";

import { ElementMark } from "~/components/cats/CatCard";
import { PixelSprite } from "~/components/PixelSprite";
import {
  ELEMENT_PALETTES,
  RARITY_PALETTES,
} from "~/components/sprites/palettes";
import { getCat } from "~/server/game/cats";

import { stackEdge } from "./packs";

/** A stack shows the edge of this many cards under the top one, and no more. */
const MAX_UNDER = 2;

export interface CardStackProps {
  catId: string;
  /** How many of this cat are in the deck. */
  copies: number;
  /** The stack was pressed: show this cat's card. */
  onShow: () => void;
}

/**
 * The copies of one cat in a deck, seen from above: the card on top, the top
 * edge of each copy under it, and the number of them on a tag. The face is a
 * small portrait of its own (96 by 128), since six have to stand side by
 * side and a hand card needs more room than that to open up. It carries what
 * tells one cat from another at a glance: sprite, name, element, points.
 */
export function CardStack({ catId, copies, onShow }: CardStackProps) {
  const cat = getCat(catId);
  const under = Math.min(MAX_UNDER, Math.max(0, copies - 1));
  return (
    <button
      type="button"
      onClick={onShow}
      aria-label={`${cat.name}, ${copies} ${copies === 1 ? "copy" : "copies"}. Show card.`}
      className="card-stack liftable text-ink"
      style={
        {
          "--rarity": RARITY_PALETTES[cat.rarity].outline,
          "--element": ELEMENT_PALETTES[cat.element]["1"],
        } as CSSProperties
      }
    >
      {Array.from({ length: under }, (_, index) => (
        <span
          key={index}
          aria-hidden
          className="stack-under"
          // The lowest copy first, so each one lies on the one before it.
          style={{ "--k": under - index } as CSSProperties}
        />
      ))}
      <span
        aria-hidden
        className="piece piece-card cat-card border-ink bg-cream relative flex h-32 flex-col items-center justify-between border-2 pt-1.5 pr-1 pb-1 pl-2"
        style={{ "--e": `${stackEdge(copies)}px` } as CSSProperties}
      >
        <span className="flex w-full items-center justify-between">
          <span className="text-pixel border-ink bg-lime border-2 px-1 text-xs leading-4">
            {cat.points}
          </span>
          <ElementMark element={cat.element} />
        </span>
        <PixelSprite catId={catId} size={64} decorative />
        <span className="text-pixel w-full truncate text-center text-[11px] leading-tight">
          {cat.name}
        </span>
      </span>
      {copies > 1 ? (
        <span
          aria-hidden
          className="border-ink text-pixel absolute top-1.5 -right-1 min-w-5 border-2 bg-white px-0.5 text-center text-xs leading-4 tabular-nums"
        >
          ×{copies}
        </span>
      ) : null}
    </button>
  );
}
