"use client";

import { useEffect, useState } from "react";

import {
  GachaAnimations,
  PityBar,
  RevealCard,
  REVEAL_STAGGER_MS,
  type RevealCardResult,
} from "~/components/gacha";
import { PixelSprite } from "~/components/PixelSprite";
import { RARITY_PALETTES } from "~/components/sprites/palettes";
import { Button, ElementBadge, RarityBadge } from "~/components/ui";
import { STARTING_GEMS } from "~/server/game/economy";
import type { Banner } from "~/server/game/gacha";
import {
  RARITIES,
  RARITY_LABELS,
  type Rarity,
  type Species,
} from "~/server/game/species";
import { ActionLink } from "./LandingHeader";
import { SECTION_SHELL } from "./LandingSection";
import { RosterStats } from "./RosterStats";
import { useDemoSummon } from "./useDemoSummon";
import { useLoopWhileSeen } from "./useLoopWhileSeen";

/** Height of `LandingHeader`: 44px touch targets, 8px padding either side, 2px edge. */
const HEADER_PX = 62;

/** Matches `.land-jolt` in globals.css, with a frame to spare. */
const JOLT_MS = 160;

export interface SummonAltarProps {
  /** The Weekly Spotlight banner, resolved on the server for this week. */
  banner: Banner;
  /** The banner's rate-up cat. */
  featured: Species;
}

/**
 * The hero: a working ten-pull on the real rates, before an account exists.
 *
 * Everything here runs in the browser off `src/server/game/gacha` — the same
 * weights, the same pity, the same ten-pull guarantee the account gets. The
 * wallet is a preview and nothing is written anywhere.
 */
export function SummonAltar({ banner, featured }: SummonAltarProps) {
  const { gems, pity, results, summon, costOf, canAfford, pityThreshold } =
    useDemoSummon(banner);

  const revealed = useStaggeredReveal(results);
  const revealing = revealed < results.length;
  const jolting = useLegendaryJolt(results, revealed);
  const bob = useLoopWhileSeen<HTMLSpanElement>();

  const glow = RARITY_PALETTES[featured.rarity].glow;
  const singleCost = costOf(1);
  const multiCost = costOf(10);
  const broke = !canAfford(1);

  return (
    <section
      /* Below `lg` this is one column in reading order: what it is, the altar,
         then the counts. At `lg` the copy and counts share the left column and
         the altar spans both rows on the right. */
      className={`${SECTION_SHELL} grid items-center gap-6 py-6 lg:grid-cols-[2fr_3fr] lg:grid-rows-[auto_auto] lg:gap-x-8 lg:gap-y-4 lg:py-2`}
      style={{ minHeight: `calc(100dvh - ${HEADER_PX}px)` }}
    >
      <GachaAnimations />

      <div className="space-y-4 lg:col-start-1 lg:row-start-1 lg:self-end">
        {/* One line at every width: the 2fr column at lg is ~435px, which holds
            the 21-character headline at 18px and not at 20px. */}
        <h1 className="text-pixel text-ink text-lg leading-relaxed sm:text-2xl lg:text-lg">
          Cats answer the call.
        </h1>
        <p className="text-ink-dim max-w-prose text-xl leading-snug">
          Summon feline Fakemon, send the squad out to fight while you&rsquo;re
          away, and come back to the loot. In your browser. Nothing to buy.
        </p>
      </div>

      <RosterStats className="lg:col-start-1 lg:row-start-2 lg:self-start" />

      <div
        className={`panel scanlines flex flex-col gap-3 p-3 sm:p-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:gap-2.5 lg:self-center lg:p-3 ${
          jolting ? "land-jolt" : ""
        }`}
        style={{
          borderColor: "var(--color-gold)",
          boxShadow: `0 0 12px ${glow}, 4px 4px 0 #000`,
        }}
      >
        <header>
          <h2 className="text-pixel text-gold text-[10px] sm:text-xs">
            {banner.name}
          </h2>
          <p className="text-ink-dim mt-1 text-base leading-tight">
            {banner.description}
          </p>
        </header>

        <div className="flex items-center gap-3">
          <span
            ref={bob.ref}
            className={`shrink-0 ${bob.active ? "land-bob" : ""}`}
          >
            <PixelSprite speciesId={featured.id} size={128} />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-pixel text-pink text-[8px] uppercase">Rate-up</p>
            <p className="text-ink text-lg leading-none">{featured.name}</p>
            <p className="flex flex-wrap items-center gap-1">
              <ElementBadge element={featured.element} />
              <RarityBadge rarity={featured.rarity} />
            </p>
          </div>
        </div>

        {/* Before the first summon the stage is one compact row on a phone: an
            empty 2×5 grid there is a thousand pixels of nothing between the
            buttons and the rest of the page. */}
        <ul
          className={`order-2 grid sm:order-none sm:grid-cols-5 sm:gap-2 ${
            results.length === 0 ? "grid-cols-5 gap-1" : "grid-cols-2 gap-2"
          }`}
        >
          {Array.from({ length: banner.multiCount }, (_, index) => {
            const result = index < revealed ? results[index] : undefined;
            return (
              <li key={index}>
                {result ? (
                  <RevealCard result={result} dense />
                ) : (
                  <EmptySlot index={index} />
                )}
              </li>
            );
          })}
        </ul>

        {/* Below `sm` the ten slots are two columns deep, so the controls come
            first and the cats land underneath them. */}
        <div className="order-1 flex flex-col gap-3 sm:order-none">
          {broke ? (
            <ActionLink href="/signup" variant="primary" className="w-full">
              Create an account for {STARTING_GEMS} real gems
            </ActionLink>
          ) : (
            <div className="flex items-end gap-2">
              {/* The ×10 is the page's primary action, so it is the wider and
                  taller of the two. The ×1 keeps its label on one line at
                  375px, which is what sets these widths. */}
              <Button
                variant="secondary"
                className="min-h-11 flex-1 flex-col gap-0 px-2 text-[10px] whitespace-nowrap"
                disabled={revealing}
                onClick={() => summon(1)}
              >
                <span>SUMMON &times;1</span>
                <span className="text-[9px] opacity-80">
                  &#9670;{singleCost}
                </span>
              </Button>
              <Button
                variant="primary"
                className="min-h-14 flex-[1.6] flex-col gap-0 px-2 text-sm whitespace-nowrap"
                disabled={revealing || !canAfford(10)}
                onClick={() => summon(10)}
              >
                <span>SUMMON &times;{banner.multiCount}</span>
                <span className="text-[10px] opacity-80">
                  &#9670;{multiCost}
                </span>
              </Button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <span className="panel-flat text-mint px-2 py-1 text-base leading-none tabular-nums">
              <span className="text-pixel mr-1 text-[8px]">&#9670;</span>
              {gems} preview gems
            </span>
            {!broke && !canAfford(10) ? (
              <span className="text-ink-dim text-base leading-tight">
                Not enough preview gems for a ten-pull.
              </span>
            ) : null}
          </div>

          <PityBar count={pity} threshold={pityThreshold} />

          <p className="text-ink-dim text-base leading-tight">
            Preview pulls. Nothing here is saved — your real {STARTING_GEMS}{" "}
            gems arrive with your account.
          </p>

          {/* The story's last beat, where the visitor is looking: once the
              cats have landed, the way to keep pulling for real is right here. */}
          {!broke && !revealing && results.length > 0 ? (
            <ActionLink href="/signup" variant="primary" className="w-full">
              Create account &mdash; {STARTING_GEMS} real gems are waiting
            </ActionLink>
          ) : null}

          <p aria-live="polite" className="sr-only">
            {revealing || results.length === 0 ? "" : summaryOf(results)}
          </p>
        </div>
      </div>
    </section>
  );
}

/** A slot waiting for a cat. Matches `PullReveal`'s pending card. */
function EmptySlot({ index }: { index: number }) {
  return (
    <div
      className="panel-flat flex aspect-square items-center justify-center p-2 sm:aspect-[4/5]"
      aria-hidden
    >
      <span className="text-pixel text-edge text-[10px]">?</span>
      <span className="sr-only">Summon slot {index + 1}</span>
    </div>
  );
}

/** "10 cats answered the call, best: Epic" — for people who cannot see them. */
function summaryOf(results: readonly RevealCardResult[]): string {
  const noun = results.length === 1 ? "cat" : "cats";
  return `${results.length} ${noun} answered the call, best: ${RARITY_LABELS[bestRarity(results)]}`;
}

function bestRarity(results: readonly RevealCardResult[]): Rarity {
  let best: Rarity = "common";
  for (const result of results) {
    if (RARITIES.indexOf(result.rarity) > RARITIES.indexOf(best)) {
      best = result.rarity;
    }
  }
  return best;
}

/**
 * Turns a batch into a count that climbs one slot every
 * {@link REVEAL_STAGGER_MS}. The stagger is state, not movement, so it survives
 * reduced motion — the cats still arrive one at a time, they just do not pop.
 */
function useStaggeredReveal(results: readonly RevealCardResult[]): number {
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    setRevealed(0);
    if (results.length === 0) return;

    const timers = results.map((_, index) =>
      setTimeout(() => setRevealed(index + 1), REVEAL_STAGGER_MS * (index + 1)),
    );

    return () => timers.forEach(clearTimeout);
  }, [results]);

  return revealed;
}

/**
 * True for one frame-run of `.land-jolt` each time a legendary flips in.
 *
 * The class is toggled rather than remounted on a key: remounting the altar
 * would drop keyboard focus from the summon button mid-reveal. CSS already
 * flattens the jolt under `prefers-reduced-motion`.
 */
function useLegendaryJolt(
  results: readonly RevealCardResult[],
  revealed: number,
): boolean {
  const [jolting, setJolting] = useState(false);

  useEffect(() => {
    if (revealed === 0) return;
    if (results[revealed - 1]?.rarity !== "legendary") return;
    setJolting(true);
    const timer = setTimeout(() => setJolting(false), JOLT_MS);
    return () => clearTimeout(timer);
  }, [results, revealed]);

  return jolting;
}
