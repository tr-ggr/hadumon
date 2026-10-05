import type { CSSProperties } from "react";

import { PixelIcon } from "~/components/PixelIcon";
import { PixelSprite } from "~/components/PixelSprite";
import type { IconName } from "~/components/sprites/icons";
import { ELEMENT_PALETTES } from "~/components/sprites/palettes";
import { WHITE } from "~/components/run/pieces";

/**
 * Which part of the firing chain a cat hops with: the right of the stage
 * goes first, then the middle, then the left, as the powers do.
 */
export type Wave = 0 | 1 | 2;

export interface CrowdCatProps {
  catId: string;
  /** Edge length; a multiple of 16 keeps the pixels whole. */
  size: number;
  /** Where it stands, and at which widths it shows. */
  className?: string;
  /** Overrides the edge length at other widths. */
  spriteClassName?: string;
  wave?: Wave;
  /** Its place in the idle bob and in its wave, so no two move together. */
  order?: number;
  /** Faces the other way. */
  flip?: boolean;
  /** False for a cat perched on an edge or cropped by one. */
  cast?: boolean;
}

/** One cat of the crowd. Decoration only: it says nothing and takes no clicks. */
export function CrowdCat({
  catId,
  size,
  className = "",
  spriteClassName,
  wave,
  order = 0,
  flip = false,
  cast = true,
}: CrowdCatProps) {
  return (
    <span
      aria-hidden
      data-wave={wave}
      className={`crowd-cat ${cast ? "has-cast" : ""} ${flip ? "-scale-x-100" : ""} ${className}`}
      style={{ "--i": order } as CSSProperties}
    >
      <PixelSprite
        catId={catId}
        size={size}
        decorative
        className={spriteClassName}
      />
    </span>
  );
}

/** An oversized pixel icon standing on the cloth like a cat does. */
function CrowdIcon({
  name,
  size,
  fill,
  order,
  className,
}: {
  name: IconName;
  size: number;
  fill: string;
  order: number;
  className: string;
}) {
  return (
    <span
      aria-hidden
      className={`crowd-cat has-cast ${className}`}
      style={{ "--i": order } as CSSProperties}
    >
      <PixelIcon name={name} size={size} fill={fill} />
    </span>
  );
}

/**
 * The cats around the hero's stage, placed against the frame's own box. Two
 * perch on its top edge at every width (a third from 640px to 1024px). Below
 * 1024px one more hangs off the stage's bottom corner, cropped by the page
 * edge. From 1024px a cat stands on the mat either side of the stage, and
 * from 1280px a far bigger one stands behind each, placed from the page edge
 * so the viewport always crops it the same way.
 */
export function HeroCrowd() {
  return (
    <>
      <CrowdCat
        catId="infernomane"
        size={320}
        wave={0}
        order={1}
        className="bottom-28 left-[calc(var(--half)-50vw-110px)] max-xl:hidden"
      />
      <CrowdCat
        catId="stormsabre"
        size={96}
        wave={0}
        order={0}
        flip
        className="right-[calc(100%-20px)] bottom-[72px] z-20 max-lg:hidden"
        spriteClassName="xl:h-48 xl:w-48"
      />
      <CrowdCat
        catId="mistpaw"
        size={64}
        wave={0}
        order={2}
        cast={false}
        className="bottom-full left-0 sm:left-2 xl:left-6"
        spriteClassName="lg:h-28 lg:w-28 xl:h-32 xl:w-32"
      />
      <CrowdCat
        catId="duskmew"
        size={64}
        wave={0}
        order={3}
        cast={false}
        flip
        className="bottom-full left-[3.75rem] max-sm:hidden lg:hidden"
      />
      <CrowdCat
        catId="pyrelynx"
        size={64}
        wave={2}
        order={2}
        cast={false}
        flip
        className="right-0 bottom-full sm:right-2 xl:right-6"
        spriteClassName="lg:h-28 lg:w-28 xl:h-32 xl:w-32"
      />
      <CrowdCat
        catId="nyxaroth"
        size={288}
        wave={2}
        order={1}
        flip
        className="right-[calc(var(--half)-50vw-96px)] bottom-[124px] max-xl:hidden"
      />
      <CrowdCat
        catId="verdantmane"
        size={96}
        wave={2}
        order={0}
        className="bottom-16 left-[calc(100%+12px)] z-20 max-lg:hidden xl:left-[calc(100%+44px)]"
        spriteClassName="xl:h-44 xl:w-44"
      />
      <CrowdCat
        catId="bramblepaw"
        size={96}
        wave={2}
        order={3}
        cast={false}
        className="-right-5 -bottom-9 z-20 sm:-right-8 sm:-bottom-12 lg:hidden"
        spriteClassName="sm:h-32 sm:w-32"
      />
    </>
  );
}

/**
 * Cats and oversized icons on the cloth beside the board column, from 1280px,
 * where the margins are wide enough to hold them.
 */
export function MarginCrowd() {
  return (
    <div aria-hidden className="max-xl:hidden">
      <CrowdIcon
        name="die"
        size={64}
        fill={WHITE}
        order={4}
        className="top-[9%] left-[calc(100%+40px)]"
      />
      <CrowdCat
        catId="arcpurr"
        size={160}
        order={1}
        className="top-[17%] right-[calc(100%-18px)] z-10"
      />
      <CrowdCat
        catId="oraclemew"
        size={192}
        order={3}
        flip
        className="top-[37%] left-[calc(100%-22px)] z-10"
      />
      <CrowdIcon
        name="yarn"
        size={96}
        fill={WHITE}
        order={2}
        className="top-[55%] right-[calc(100%+28px)]"
      />
      <CrowdIcon
        name="fish"
        size={96}
        fill={ELEMENT_PALETTES.mist["1"]}
        order={5}
        className="top-[68%] left-[calc(100%+32px)]"
      />
      <CrowdCat
        catId="gloomtail"
        size={144}
        order={0}
        flip
        className="top-[79%] right-[calc(100%-14px)] z-10"
      />
    </div>
  );
}

/** Two big cats cropped into the bottom corners of the closing band. */
export function CornerCats() {
  return (
    <>
      <CrowdCat
        catId="aurelynx"
        size={160}
        order={1}
        cast={false}
        className="-bottom-10 -left-8 sm:-bottom-20 sm:-left-12"
        spriteClassName="sm:h-80 sm:w-80"
      />
      <CrowdCat
        catId="umbralynx"
        size={160}
        order={3}
        cast={false}
        flip
        className="-right-8 -bottom-10 sm:-right-10 sm:-bottom-16"
        spriteClassName="sm:h-64 sm:w-64"
      />
    </>
  );
}
