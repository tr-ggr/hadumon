import type { CSSProperties } from "react";

import { RARITY_PALETTES } from "~/components/sprites/palettes";
import { RARITY_LABELS } from "~/server/game/cats";
import type { Cosmetic } from "~/server/game/cosmetics";

import { PieceDrawing } from "./PieceDrawing";
import type { Standing } from "./wardrobe";

export interface WardrobeTileProps {
  cosmetic: Cosmetic;
  standing: Standing;
  /** The tag a tile in force carries: "Worn" on the hadu, "In use" on the table. */
  inForce: string;
  /** The element that says why a piece the account lacks cannot be put on. */
  noteId: string;
  onPress: () => void;
}

/**
 * One cosmetic in its slot's row. A piece the account has is cardboard: a
 * white tile with its rarity's band, pressed to put it on, and lime, framed
 * and lifted while it is in force. One it lacks is not a piece yet: a dashed
 * space printed on the board with the picture faint in it, which says where
 * it is found and takes no press.
 */
export function WardrobeTile({
  cosmetic,
  standing,
  inForce,
  noteId,
  onPress,
}: WardrobeTileProps) {
  const locked = standing === "locked";
  const worn = standing === "worn";
  const band = {
    "--piece-inset": `inset 0 3px 0 ${RARITY_PALETTES[cosmetic.rarity].outline}`,
  } as CSSProperties;

  return (
    <button
      type="button"
      aria-pressed={worn}
      aria-disabled={locked ? true : undefined}
      aria-describedby={locked ? noteId : undefined}
      data-sfx={locked ? undefined : "pick"}
      data-standing={standing}
      onClick={onPress}
      style={locked ? undefined : band}
      className={`text-ink relative flex h-full w-full flex-col items-center gap-1 border-2 px-1 pt-2 pb-1.5 text-center ${
        locked
          ? "border-ink/40 cursor-not-allowed border-dashed"
          : worn
            ? "piece border-ink bg-lime is-chosen lift"
            : "piece border-ink liftable hover:bg-sky-soft bg-white"
      }`}
    >
      {/* Tall enough for an aura, which stands a quarter out round the cat. */}
      <span
        className={`grid h-[72px] w-full place-items-center ${locked ? "opacity-45" : ""}`}
      >
        <PieceDrawing
          cosmeticId={cosmetic.id}
          size={cosmetic.slot === "halo" ? 48 : 64}
        />
      </span>
      <span className="text-[11px] leading-tight font-black text-balance">
        {cosmetic.name}
      </span>
      <span
        className={`mt-auto text-[11px] leading-tight font-bold ${worn ? "" : "text-ink-soft"}`}
      >
        {RARITY_LABELS[cosmetic.rarity]}
      </span>
      {worn ? (
        <span
          aria-hidden
          className="border-ink bg-ink text-cream absolute -top-2 right-1 border px-1 text-[10px] leading-4 font-black"
        >
          {inForce}
        </span>
      ) : null}
    </button>
  );
}
