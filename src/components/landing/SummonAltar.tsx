"use client";

import { useEffect, useState } from "react";

import { CreatureArt } from "~/components/CreatureArt";
import {
  GachaAnimations,
  REVEAL_STAGGER_MS,
  type RevealCardResult,
} from "~/components/gacha";
import { RARITY_PALETTES } from "~/components/sprites/palettes";
import { Button } from "~/components/ui";
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
import { useDemoSummon } from "./useDemoSummon";
import { useLoopWhileSeen } from "./useLoopWhileSeen";

const ANTICIPATION_MS = 240;

export interface SummonAltarProps {
  banner: Banner;
  featured: Species;
}

export function SummonAltar({ banner, featured }: SummonAltarProps) {
  const { gems, pity, results, summon, costOf, canAfford, pityThreshold } =
    useDemoSummon(banner);
  const revealed = useStaggeredReveal(results);
  const revealing = revealed < results.length;
  const recoil = useConsoleRecoil(results);
  const featuredMotion = useLoopWhileSeen<HTMLDivElement>();
  const broke = !canAfford(1);

  return (
    <section className="bg-sky-surface/45 relative isolate overflow-hidden">
      <GachaAnimations />
      <div
        className={`${SECTION_SHELL} grid min-h-[calc(100svh-4rem)] items-center gap-5 py-6 lg:min-h-[calc(100svh-4.5rem)] lg:grid-cols-[0.78fr_1.22fr] lg:gap-10 lg:py-10`}
      >
        <div className="land-hero-copy relative z-10 max-w-xl text-center lg:text-left">
          <h1 className="text-ink text-[2.25rem] leading-[0.94] text-balance sm:text-[clamp(2.65rem,6vw,5.4rem)]">
            Collect strange cats. Let them adventure.
          </h1>
          <p className="text-ink-soft mx-auto mt-3 max-w-[44ch] text-base leading-relaxed text-pretty sm:mt-5 sm:text-xl lg:mx-0">
            <span className="sm:hidden">
              Summon a squad, send it out, and return to the loot.
            </span>
            <span className="hidden sm:inline">
              An idle creature RPG for people with other things to do. Summon a
              squad, send it out, and return when you feel like it.
            </span>
          </p>
          <div className="mt-6 hidden flex-wrap items-center justify-center gap-3 lg:flex lg:justify-start">
            <ActionLink href="/signup" size="lg">
              Create account
            </ActionLink>
            <span className="text-ink-soft text-sm">
              {STARTING_GEMS} gems and three cats. No card required.
            </span>
          </div>
        </div>

        <div
          className={`land-hero-console bg-cobalt relative z-10 rounded-[28px] p-3 shadow-[0_24px_60px_rgb(13_60_157_/_0.26)] sm:p-4 ${recoil ? "land-console-recoil" : ""}`}
        >
          <div className="rounded-[20px] bg-white p-3 sm:p-4">
            <header className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-ink text-xl sm:text-2xl">{banner.name}</h2>
                <p className="text-ink-soft mt-1 hidden max-w-[48ch] text-sm sm:block">
                  This week, {featured.name} is twice as likely to answer.
                </p>
              </div>
              <div className="bg-sky-soft shrink-0 rounded-full px-3 py-2 text-right">
                <span className="text-ink-soft block text-[11px] font-bold tracking-wide uppercase">
                  Preview gems
                </span>
                <span className="text-cobalt text-lg font-extrabold tabular-nums">
                  ◆ {gems}
                </span>
              </div>
            </header>

            <div className="mt-3 grid gap-3 sm:grid-cols-[0.72fr_1.28fr] sm:items-center">
              <div
                ref={featuredMotion.ref}
                className="bg-sky-soft relative flex min-h-28 items-end justify-center overflow-hidden rounded-2xl sm:min-h-52"
              >
                <div
                  className={featuredMotion.active ? "land-featured-float" : ""}
                >
                  <CreatureArt
                    speciesId={featured.id}
                    size={190}
                    priority
                    label={`${featured.name}, this week's featured cat`}
                  />
                </div>
                <div className="absolute inset-x-2 bottom-2 rounded-xl bg-white/95 px-3 py-2 text-center shadow-[0_5px_16px_rgb(23_33_43_/_0.1)]">
                  <p className="text-ink font-extrabold">{featured.name}</p>
                  <p className="text-ink-soft line-clamp-1 text-xs">
                    {featured.flavor}
                  </p>
                </div>
              </div>

              <div>
                <ul
                  className="grid grid-cols-5 gap-1.5 sm:gap-2"
                  aria-label="Summon results"
                >
                  {Array.from({ length: banner.multiCount }, (_, index) => {
                    const result =
                      index < revealed ? results[index] : undefined;
                    return (
                      <li key={index}>
                        {result ? (
                          <LandingReveal result={result} />
                        ) : (
                          <EmptySlot
                            index={index}
                            waiting={revealing && index >= revealed}
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-3 grid grid-cols-[0.8fr_1.35fr] gap-2">
                  <Button
                    variant="secondary"
                    className="min-h-12 flex-col gap-0 px-2 text-xs"
                    disabled={revealing || !canAfford(1)}
                    onClick={() => summon(1)}
                  >
                    <span>Summon ×1</span>
                    <span className="text-[11px] opacity-70">
                      ◆ {costOf(1)}
                    </span>
                  </Button>
                  <Button
                    variant="hero"
                    className="min-h-14 flex-col gap-0 px-2 text-base"
                    disabled={revealing || !canAfford(10)}
                    onClick={() => summon(10)}
                  >
                    <span>Summon ×10</span>
                    <span className="text-xs opacity-70">◆ {costOf(10)}</span>
                  </Button>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-ink-soft">Epic+ pity</span>
                    <span className="text-ink tabular-nums">
                      {pity}/{pityThreshold}
                    </span>
                  </div>
                  <div
                    className="bg-sky-soft mt-1 h-2 overflow-hidden rounded-full"
                    role="progressbar"
                    aria-label="Pulls until guaranteed epic or better"
                    aria-valuemin={0}
                    aria-valuemax={pityThreshold}
                    aria-valuenow={pity}
                  >
                    <div
                      className="bg-coral h-full rounded-full transition-[width] duration-300"
                      style={{
                        width: `${Math.min(100, (pity / pityThreshold) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {broke ? (
              <ActionLink href="/signup" className="mt-3 w-full">
                Create an account for {STARTING_GEMS} real gems
              </ActionLink>
            ) : results.length > 0 && !revealing ? (
              <div className="bg-sky-soft mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2">
                <p className="text-ink-soft text-sm">
                  Preview only. Your pulls are not saved.
                </p>
                <ActionLink href="/signup" size="sm">
                  Keep playing
                </ActionLink>
              </div>
            ) : (
              <p className="text-ink-soft mt-3 text-center text-xs">
                Real rates. Real pity. Preview pulls are not saved.
              </p>
            )}
            <p aria-live="polite" className="sr-only">
              {revealing || results.length === 0 ? "" : summaryOf(results)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function EmptySlot({ index, waiting }: { index: number; waiting: boolean }) {
  return (
    <div
      className={`bg-sky-soft flex aspect-square items-center justify-center overflow-hidden rounded-xl ${waiting ? "land-slot-waiting" : ""}`}
      aria-label={`Summon slot ${index + 1}, empty`}
    >
      <span
        aria-hidden
        className="h-5 w-5 rounded-full border-[5px] border-white shadow-[inset_0_0_0_2px_rgb(200_223_234)] sm:h-7 sm:w-7"
      />
    </div>
  );
}

function LandingReveal({ result }: { result: RevealCardResult }) {
  const palette = RARITY_PALETTES[result.rarity];
  return (
    <article
      className="gacha-pop group relative aspect-square overflow-hidden rounded-xl bg-white text-center shadow-[0_6px_16px_rgb(23_33_43_/_0.11)]"
      style={{
        boxShadow: `inset 0 0 0 2px ${palette.outline}, 0 6px 16px rgb(23 33 43 / 0.11)`,
      }}
      title={`${result.species.name} — ${RARITY_LABELS[result.rarity]}`}
    >
      <span
        aria-hidden
        className="gacha-flash pointer-events-none absolute inset-0"
        style={{ backgroundColor: palette.glow }}
      />
      <CreatureArt
        speciesId={result.speciesId}
        size={74}
        className={`h-full w-full scale-110 p-1 ${result.rarity === "legendary" ? "gacha-legendary" : ""}`}
      />
      <span className="sr-only">
        {result.species.name}, {RARITY_LABELS[result.rarity]}
        {result.guaranteed ? ", guaranteed rare or better" : ""}
      </span>
    </article>
  );
}

function summaryOf(results: readonly RevealCardResult[]): string {
  const noun = results.length === 1 ? "cat" : "cats";
  return `${results.length} ${noun} answered the call, best: ${RARITY_LABELS[bestRarity(results)]}`;
}

function bestRarity(results: readonly RevealCardResult[]): Rarity {
  let best: Rarity = "common";
  for (const result of results)
    if (RARITIES.indexOf(result.rarity) > RARITIES.indexOf(best))
      best = result.rarity;
  return best;
}

function useStaggeredReveal(results: readonly RevealCardResult[]): number {
  const [revealed, setRevealed] = useState(0);
  useEffect(() => {
    setRevealed(0);
    if (results.length === 0) return;
    const timers = results.map((_, index) =>
      setTimeout(
        () => setRevealed(index + 1),
        ANTICIPATION_MS + REVEAL_STAGGER_MS * (index + 1),
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, [results]);
  return revealed;
}

function useConsoleRecoil(results: readonly RevealCardResult[]): boolean {
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (results.length === 0) return;
    setActive(true);
    const timer = setTimeout(() => setActive(false), 340);
    return () => clearTimeout(timer);
  }, [results]);
  return active;
}
