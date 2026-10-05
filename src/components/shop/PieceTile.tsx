import type { CSSProperties, ReactNode } from "react";

import { RARITY_PALETTES } from "~/components/sprites/palettes";
import { RARITY_LABELS } from "~/server/game/cats";
import { getCosmetic, SLOT_LABELS } from "~/server/game/cosmetics";

export interface PieceTileProps {
  cosmeticId: string;
  /**
   * The piece's own drawing. The drawings are being made elsewhere, keyed by
   * the same cosmetic ids; until one is passed the tile keeps its place as
   * an empty printed space, so nothing moves when the art lands.
   */
  drawing?: ReactNode;
  /** `row` lies in a list of a pack's pieces; `card` is turned over in a reveal. */
  layout?: "row" | "card";
  /** The account has it. */
  owned?: boolean;
  className?: string;
}

/**
 * One cosmetic as a named tile: its name, the slot it is worn in and its
 * rarity, with the rarity's band along its top as a cat card has. It says
 * what the piece is in words, since its drawing may not be there yet.
 */
export function PieceTile({
  cosmeticId,
  drawing,
  layout = "row",
  owned = false,
  className = "",
}: PieceTileProps) {
  const piece = getCosmetic(cosmeticId);
  const band = {
    "--piece-inset": `inset 0 3px 0 ${RARITY_PALETTES[piece.rarity].outline}`,
  } as CSSProperties;
  const card = layout === "card";
  return (
    <div
      className={`piece border-ink text-ink relative flex border-2 bg-white text-left ${
        card
          ? "piece-card h-full flex-col items-center gap-3 px-2 pt-5 pb-3 text-center"
          : "items-center gap-2.5 py-2 pr-2 pl-2.5"
      } ${className}`}
      style={band}
    >
      <span
        data-slot="drawing"
        className={`grid shrink-0 place-items-center ${card ? "h-24 w-24" : "h-10 w-10"} ${
          drawing ? "" : "border-ink/35 border-2 border-dashed"
        }`}
      >
        {drawing}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`text-print block text-xl ${card ? "text-balance" : "truncate"}`}
        >
          {piece.name}
        </span>
        <span className="text-ink-soft mt-0.5 block text-[11px] leading-tight font-bold">
          {SLOT_LABELS[piece.slot]} · {RARITY_LABELS[piece.rarity]}
        </span>
      </span>
      {owned ? (
        <span
          className={`border-ink bg-lime shrink-0 border-2 px-1 text-[11px] leading-4 font-black ${card ? "" : "self-start"}`}
        >
          Yours
        </span>
      ) : null}
    </div>
  );
}
