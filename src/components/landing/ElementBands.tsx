"use client";

import { useEffect, useState } from "react";

import { PixelSprite } from "~/components/PixelSprite";
import {
  ELEMENT_PALETTES,
  RARITY_PALETTES,
} from "~/components/sprites/palettes";
import { RarityBadge } from "~/components/ui";
import {
  ELEMENT_LABELS,
  ELEMENTS,
  MATERIAL_LABELS,
  type Element,
} from "~/server/game/elements";
import {
  RARITIES,
  SPECIES_LIST,
  speciesByElement,
  type Species,
} from "~/server/game/species";
import { ZONES } from "~/server/game/zones";
import { SECTION_SHELL, SectionHeading } from "./LandingSection";
import { useReveal } from "./useReveal";

/**
 * Reading order for the bands: warm to cold, ending on the darkest. Sorting
 * `ELEMENTS` by this rather than listing the bands by hand means a new element
 * still gets a band.
 */
const BAND_ORDER = [
  "flame",
  "mist",
  "volt",
  "thorn",
  "shade",
] as const satisfies readonly Element[];

const BANDS: readonly Element[] = [...ELEMENTS].sort(
  (a, b) => BAND_ORDER.indexOf(a) - BAND_ORDER.indexOf(b),
);

/** Distinct reveal delays before the stagger repeats. Four is enough to read. */
const STAGGER_STEPS = 4;
const STAGGER_MS = 60;

/**
 * The catalogue, as five full-bleed bands drenched in each element's own fur
 * palette — the page's one register the rest of the game does not already use.
 *
 * Client-side only because the tiles reveal on scroll; every value in it still
 * comes from `src/server/game/*`.
 */
export function ElementBands() {
  return (
    <section aria-labelledby="catalogue-heading">
      {/* Full-bleed bands, so the heading keeps the shell and the rhythm's top
          half by hand; the first band supplies the bottom half. */}
      <div className={`${SECTION_SHELL} pt-16 pb-8 sm:pt-24 sm:pb-10`}>
        <SectionHeading
          titleId="catalogue-heading"
          title={
            <>
              {sentenceCase(spellNumber(SPECIES_LIST.length))} cats.{" "}
              {sentenceCase(spellNumber(ELEMENTS.length))} elements. One of them
              has nine tails.
            </>
          }
          intro="Each element keeps its own zone, its own shard, and its own cats."
        />
      </div>
      {BANDS.map((element) => (
        <ElementBand key={element} element={element} />
      ))}
    </section>
  );
}

function ElementBand({ element }: { element: Element }) {
  const palette = ELEMENT_PALETTES[element];
  const zone = ZONES.find((candidate) => candidate.element === element);
  const cats = [...speciesByElement(element)].sort(rarestFirst);

  const { ref, revealed } = useReveal<HTMLUListElement>();
  const mounted = useMounted();
  // Never hidden in the static markup: a visitor without JavaScript sees it all.
  const hidden = mounted && !revealed;

  return (
    <section
      aria-labelledby={`band-${element}`}
      className="border-y-2"
      style={{ backgroundColor: palette["3"], borderColor: palette["1"] }}
    >
      {/* The zone's terrain, in the same 45° weave the adventure map uses. */}
      <div
        aria-hidden
        className="h-4 w-full border-b-2"
        style={{
          borderColor: palette["1"],
          backgroundImage: `repeating-linear-gradient(135deg, ${palette["3"]} 0 6px, ${palette["1"]} 6px 12px)`,
        }}
      />

      <div
        className={`${SECTION_SHELL} grid gap-5 py-8 sm:py-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8`}
      >
        <div className="space-y-3" style={{ color: palette["2"] }}>
          <h3
            id={`band-${element}`}
            className="text-pixel text-xs uppercase sm:text-sm"
          >
            {ELEMENT_LABELS[element]}
          </h3>

          {zone ? (
            <div className="border-2 p-2" style={{ borderColor: palette["1"] }}>
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-pixel text-[9px] leading-relaxed">
                  {zone.name}
                </h4>
                <span className="text-pixel shrink-0 text-[8px]">
                  T{zone.tier}
                </span>
              </div>
              <p className="mt-1 text-base leading-tight">{zone.description}</p>
            </div>
          ) : null}

          <p className="text-base leading-tight">
            Drops {MATERIAL_LABELS[element]}. {cats.length} cats answer to it.
          </p>
        </div>

        <ul
          ref={ref}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
        >
          {cats.map((species, index) => (
            <li
              key={species.id}
              className={
                hidden ? "land-hidden" : revealed ? "land-reveal" : undefined
              }
              style={
                revealed && !hidden
                  ? {
                      animationDelay: `${(index % STAGGER_STEPS) * STAGGER_MS}ms`,
                    }
                  : undefined
              }
            >
              <CatTile species={species} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** One cat, framed in its rarity like the summon reveal frames it. */
function CatTile({ species }: { species: Species }) {
  const palette = RARITY_PALETTES[species.rarity];
  const isLegendary = species.rarity === "legendary";
  const isSpecial = isLegendary || species.rarity === "epic";

  return (
    <article
      className="panel-flat flex h-full flex-col items-center gap-1 p-2 text-center"
      style={{
        // Sprites are drawn for the game's near-black ground, so each tile
        // keeps a pocket of it inside the element's colour.
        background:
          "color-mix(in srgb, var(--color-navy-deep) 84%, transparent)",
        borderColor: palette.outline,
        borderWidth: isLegendary ? 3 : 2,
        boxShadow: isSpecial
          ? `0 0 12px ${palette.glow}, 4px 4px 0 #000`
          : "4px 4px 0 #000",
      }}
    >
      <PixelSprite speciesId={species.id} size={72} />
      <h4 className="text-pixel text-ink text-[9px] leading-relaxed break-words">
        {species.name}
      </h4>
      <RarityBadge rarity={species.rarity} />
      <p className="text-ink-dim text-base leading-tight">{species.flavor}</p>
    </article>
  );
}

/** Legendary first, then epic, and so on down to the commons. */
function rarestFirst(a: Species, b: Species): number {
  return RARITIES.indexOf(b.rarity) - RARITIES.indexOf(a.rarity);
}

function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

const ONES = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
] as const;

const TENS = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
] as const;

/**
 * Spells a count so the headline reads as a sentence while still coming from
 * the game code. Falls back to digits for anything it cannot spell.
 */
function spellNumber(value: number): string {
  if (!Number.isInteger(value) || value < 0 || value > 99) return String(value);
  if (value < ONES.length) return ONES[value] ?? String(value);

  const tens = TENS[Math.floor(value / 10)];
  const ones = value % 10;
  if (!tens) return String(value);
  return ones === 0 ? tens : `${tens}-${ONES[ones] ?? ones}`;
}

function sentenceCase(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
