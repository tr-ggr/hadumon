import type { ButtonHTMLAttributes, CSSProperties } from "react";

import { ElementMark } from "~/components/cats/CatCard";
import { PixelSprite } from "~/components/PixelSprite";
import { ELEMENT_PALETTES } from "~/components/sprites/palettes";
import { tileImage } from "~/components/tower/tile";
import { Skeleton } from "~/components/ui";
import { ELEMENTS, type Element } from "~/server/game/elements";
import { CLANS, starterDeck } from "~/server/game/clans";

import { CLAN_PACKS, dulled, packWord } from "./packs";
import { pileEdge } from "./pieces";

/**
 * The crimp: teeth 16px across and 8px deep, cut in 2px steps. One character
 * is one step, and the bottom edge is the top one turned over. A mask reads
 * only what is opaque, so the colour is whatever.
 */
const TEETH = ["...11...", "..1111..", ".111111.", "11111111"];
const CUT = { "1": "#000" };
const CUT_TOP = tileImage(TEETH, CUT);
const TEETH_DOWN = [...TEETH].reverse();
const CUT_BOTTOM = tileImage(TEETH_DOWN, CUT);
/**
 * The bottom edge with 12px of wrapper above the teeth, for the strips under
 * a pack: they are moved down from behind it, and have to fill what they
 * leave. One tile, since an image stretched two ways keeps its own shape.
 */
const CUT_UNDER = tileImage(
  [...Array.from({ length: 6 }, () => "11111111"), ...TEETH_DOWN],
  CUT,
);

/**
 * What `globals.css` needs to draw one clan's wrapper. A locked clan's is
 * printed in the same two tones dulled: the print and the ribs are images,
 * so they are drawn again in those and not washed over.
 */
function wrapper(clanId: Element, locked: boolean): CSSProperties {
  const tones = ELEMENT_PALETTES[clanId];
  const ground = locked ? dulled(tones["1"]) : tones["1"];
  const light = locked ? dulled(tones["2"]) : tones["2"];
  return {
    "--ground": ground,
    "--light": light,
    "--print": tileImage(CLAN_PACKS[clanId].print, { "1": light }),
    "--rib": tileImage(["1..."], { "1": ground }),
    "--cut-top": CUT_TOP,
    "--cut-bottom": CUT_BOTTOM,
    "--cut-under": CUT_UNDER,
  } as CSSProperties;
}

const WRAPPERS = Object.fromEntries(
  ELEMENTS.map((clanId) => [clanId, wrapper(clanId, false)]),
) as Record<Element, CSSProperties>;
const LOCKED_WRAPPERS = Object.fromEntries(
  ELEMENTS.map((clanId) => [clanId, wrapper(clanId, true)]),
) as Record<Element, CSSProperties>;

export type PackSize = "centre" | "side";

export interface ClanPackProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "style"
> {
  clanId: Element;
  /** The pack in the middle of the row is drawn half as large again. */
  size?: PackSize;
  /** The clan a run would start with. */
  chosen?: boolean;
  locked?: boolean;
}

/**
 * A clan's starter deck as a sealed booster pack: the wrapper in the
 * element's colour with a print of its own, the clan's mascot, its name on a
 * plate and the number of cards in it. It stands as tall as a pile of those
 * cards. A button, and nothing on it is read out: the caller names it.
 */
export function ClanPack({
  clanId,
  size = "side",
  chosen = false,
  locked = false,
  className = "",
  type = "button",
  ...props
}: ClanPackProps) {
  const clan = CLANS[clanId];
  const count = starterDeck(clanId).length;
  return (
    <button
      type={type}
      data-size={size}
      className={`pack ${chosen ? "is-chosen lift" : ""} ${locked ? "is-locked" : ""} ${className}`}
      style={
        {
          ...(locked ? LOCKED_WRAPPERS : WRAPPERS)[clanId],
          "--e": `${pileEdge(count)}px`,
        } as CSSProperties
      }
      {...props}
    >
      <span aria-hidden className="pack-lean">
        <span className="pack-fin" data-edge="top">
          <i className="pack-cut" />
          <i className="pack-cut is-face" />
        </span>
        <span className="pack-body">
          <span className="pack-band" />
          <span className="pack-front">
            <span className="relative flex w-full justify-center">
              <PixelSprite
                catId={CLAN_PACKS[clanId].mascot}
                size={64}
                decorative
                className="pack-mascot"
              />
              {/* A paper strap round the pack, over the mascot's feet. */}
              {locked ? (
                <span className="border-ink absolute inset-x-0 -bottom-1.5 border-y-2 bg-white text-[11px] leading-5 font-black">
                  Locked
                </span>
              ) : null}
            </span>
            <span className="pack-plate text-print">
              <ElementMark element={clanId} />
              {packWord(clan.name)}
            </span>
          </span>
          <span className="pack-band" />
          <span className="card-shimmer is-band" />
        </span>
        <span className="pack-fin" data-edge="bottom">
          <i className="pack-cut is-cast" />
          <i className="pack-cut is-under" />
          <i className="pack-cut is-edge" />
          <i className="pack-cut" />
          <i className="pack-cut is-face" />
        </span>
        <span className="border-ink text-pixel absolute -top-1.5 -right-1.5 min-w-5 border-2 bg-white px-0.5 text-center text-xs leading-4 tabular-nums">
          {count}
        </span>
        {chosen ? (
          <span className="border-ink bg-lime absolute -top-1.5 -left-1.5 border-2 px-1 text-[11px] leading-4 font-black">
            Chosen
          </span>
        ) : null}
      </span>
    </button>
  );
}

/** Where a pack will stand, while the clans are still being fetched. */
export function PackSpace({ size = "side" }: { size?: PackSize }) {
  return (
    <span
      data-size={size}
      className="pack-space border-ink/35 border-2 border-dashed p-2"
    >
      <Skeleton className="h-full w-full" />
    </span>
  );
}
