import type { ButtonHTMLAttributes, CSSProperties } from "react";

import { IconSvg, PixelIcon } from "~/components/PixelIcon";
import { PixelSprite } from "~/components/PixelSprite";
import { INK, pileEdge } from "~/components/run/pieces";
import { ICONS } from "~/components/sprites/icons";
import { tileImage } from "~/components/tower/tile";
import { Skeleton } from "~/components/ui";

import { dulled, packArt, type PackArt } from "./packs";

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

/** The line a pack is cut along: 4px of ink and 4px of none. */
const DASH = tileImage(["11.."], { "1": INK });

/** The three frames of a row of fire, in order. */
const FIRE = [ICONS.fire1, ICONS.fire2, ICONS.fire3] as const;

/**
 * A row of fire in two tones, as the images its three frames are drawn
 * from: `--fire-1` to `--fire-3`. The fire's edge is ink.
 */
export function fireStyle(fill: string, core: string): CSSProperties {
  return Object.fromEntries(
    FIRE.map((rows, i) => [
      `--fire-${i + 1}`,
      tileImage(rows, { o: INK, "1": fill, w: core }),
    ]),
  );
}

/**
 * A row of fire: its three frames one on another, shown in turn. The caller
 * places it and says how large one pixel of it is.
 */
export function Fire({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span aria-hidden className={`fire ${className}`} style={style}>
      <i />
      <i />
      <i />
    </span>
  );
}

/**
 * What `globals.css` needs to draw one wrapper. A pack with nothing left in
 * it is printed in the same two tones dulled: the print and the ribs are
 * images, so they are drawn again in those and not washed over.
 */
function wrapperStyle(art: PackArt, spent: boolean, holds: number) {
  const ground = spent ? dulled(art.ground) : art.ground;
  const light = spent ? dulled(art.light) : art.light;
  return {
    "--ground": ground,
    "--light": light,
    "--print": tileImage(art.print, { "1": light }),
    "--rib": tileImage(["1..."], { "1": ground }),
    "--cut-top": CUT_TOP,
    "--cut-bottom": CUT_BOTTOM,
    "--cut-under": CUT_UNDER,
    // A pack stands as tall as the pile of what is in it.
    "--e": `${pileEdge(Math.max(1, holds))}px`,
  } as CSSProperties;
}

export type PackSize = "centre" | "side";

/**
 * How far a pack being opened has got: sealed, waiting to be cut along its
 * line, its top cut off, its wrapper burning down, and burnt away to the
 * card that was in it. `PackWrapper` is always sealed.
 */
export type PackSeal = "sealed" | "ready" | "cut" | "burning" | "burnt";

interface PackFaceProps {
  art: PackArt;
  /** How many things come out of it, on the tag on its corner. */
  holds: number;
  spent: boolean;
  seal: PackSeal;
}

/**
 * A wrapper, drawn: the crimped fins, the sealed bands, the print, the
 * sticker on its front, its name on a plate and the count on its corner.
 * The top crimp and the band under it are one strip, which is what comes off
 * when the pack is cut open; the rest burns down from there behind a row of
 * fire in the wrapper's own two tones, and leaves the back of a card.
 *
 * What burns is in a window that moves down as its contents move up by as
 * much (`.pack-burn`, `.pack-burn-in`), so the wrapper stays where it is and
 * loses its top, and nothing but two transforms is animated.
 */
function PackFace({ art, holds, spent, seal }: PackFaceProps) {
  const open = seal !== "sealed" && seal !== "ready";
  const hop = seal === "cut" ? "animate-[pack-hop_360ms_steps(1,end)_1]" : "";
  return (
    <span aria-hidden className="pack-lean" data-seal={seal}>
      {/* What is in it, behind the wrapper until the wrapper has burned. */}
      {open ? (
        <span className="pack-card border-ink bg-cobalt border-2 p-2">
          <span className="border-cobalt-dark grid h-full w-full place-items-center border-2">
            <PixelIcon name="paw" size={32} ink="#ffffff" />
          </span>
        </span>
      ) : null}
      <span className="pack-strip">
        <span className="pack-fin" data-edge="top">
          <i className="pack-cut" />
          <i className="pack-cut is-face" />
        </span>
        <span className="block border-x-2 border-(--line)">
          <span className="pack-band block" />
        </span>
        {/* Where to cut, and how far the cut has got. */}
        {seal === "ready" ? (
          <>
            <i className="pack-cutline" />
            <i className="pack-cutline is-done" />
          </>
        ) : null}
      </span>
      <span className="pack-burn">
        <span className="pack-burn-in">
          <span className="pack-body">
            {/* The cut mouth of the wrapper: one ink line where the band was. */}
            {open ? (
              <i className="absolute inset-x-0 top-0 z-10 h-0.5 bg-(--line)" />
            ) : null}
            <span className="pack-front">
              <span className="relative flex w-full justify-center">
                {art.front.kind === "cat" ? (
                  <PixelSprite
                    catId={art.front.catId}
                    size={64}
                    decorative
                    className={`pack-mascot ${hop}`}
                  />
                ) : (
                  <IconSvg
                    rows={art.front.rows}
                    size={64}
                    fill={art.front.fill}
                    className={`pack-mascot ${hop}`}
                  />
                )}
                {/* A paper strap round the pack, over the sticker's feet. */}
                {spent ? (
                  <span className="border-ink absolute inset-x-0 -bottom-1.5 border-y-2 bg-white text-center text-[11px] leading-5 font-black">
                    Empty
                  </span>
                ) : null}
              </span>
              <span className="pack-plate text-print">
                <PixelIcon name={art.mark} size={16} fill={art.markFill} />
                {art.word}
              </span>
            </span>
            <span className="pack-band" />
            {/* The one flat band of light: it crosses under a mouse, and once
                more as the top comes off. */}
            <span
              className={`card-shimmer is-band ${seal === "cut" ? "opacity-100! before:animate-[pack-shine_520ms_linear_both]" : ""}`}
            />
          </span>
          <span className="pack-fin" data-edge="bottom">
            <i className="pack-cut is-cast" />
            <i className="pack-cut is-under" />
            <i className="pack-cut is-edge" />
            <i className="pack-cut" />
            <i className="pack-cut is-face" />
          </span>
        </span>
      </span>
      {/* The fire the wrapper burns behind, on the edge it has burned to. */}
      {seal === "burning" ? (
        <span className="pack-flames">
          <Fire />
        </span>
      ) : null}
      {open ? null : (
        <span className="border-ink text-pixel absolute -top-1.5 -right-1.5 z-20 min-w-5 border-2 bg-white px-0.5 text-center text-xs leading-4 tabular-nums">
          {holds}
        </span>
      )}
    </span>
  );
}

export interface PackWrapperProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "style"
> {
  packId: string;
  /** The pack in the middle of the row is drawn half as large again. */
  size?: PackSize;
  /** How many things come out of it: five cats, or the pieces still to find. */
  holds: number;
  /** Nothing is left in it to find: printed dull, with a strap across it. */
  spent?: boolean;
}

/**
 * A pack on the shelf as a sealed booster: the wrapper in the colour of what
 * is in it with a print of its own, a sticker on its front, its name on a
 * plate and the number of things inside. A button, and nothing on it is read
 * out: the caller names it.
 */
export function PackWrapper({
  packId,
  size = "side",
  holds,
  spent = false,
  className = "",
  type = "button",
  ...props
}: PackWrapperProps) {
  const art = packArt(packId);
  return (
    <button
      type={type}
      data-size={size}
      className={`pack ${spent ? "is-locked" : ""} ${className}`}
      style={wrapperStyle(art, spent, holds)}
      {...props}
    >
      <PackFace art={art} holds={holds} spent={spent} seal="sealed" />
    </button>
  );
}

export interface OpenedPackProps {
  packId: string;
  holds: number;
  seal: PackSeal;
  className?: string;
}

/**
 * The pack that was bought, being opened: the same wrapper at the size it
 * stood in the middle of the shelf, as a picture and not a control. `seal`
 * is the only thing that moves it, so rendering it again plays nothing.
 */
export function OpenedPack({
  packId,
  holds,
  seal,
  className = "",
}: OpenedPackProps) {
  const art = packArt(packId);
  return (
    <span
      data-size="centre"
      className={`pack ${className}`}
      style={
        {
          ...wrapperStyle(art, false, holds),
          // Only a pack being opened is cut, or burns.
          "--dash": DASH,
          ...fireStyle(art.ground, art.light),
        } as CSSProperties
      }
    >
      <PackFace art={art} holds={holds} spent={false} seal={seal} />
    </span>
  );
}

/** Where a pack will stand, while the shelf is still being fetched. */
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
