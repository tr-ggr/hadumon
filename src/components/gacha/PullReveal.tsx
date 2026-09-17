"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CreatureArt } from "~/components/CreatureArt";
import { RARITY_PALETTES } from "~/components/sprites/palettes";
import { Button, ElementBadge, RarityBadge } from "~/components/ui";
import {
  RARITY_LABELS,
  type Rarity,
  type Species,
} from "~/server/game/species";
import type { RouterOutputs } from "~/trpc/react";

export type PullSummary = RouterOutputs["gacha"]["pull"];
export type PullResultView = PullSummary["results"][number];

/**
 * Everything a {@link RevealCard} needs to draw one pull. Deliberately smaller
 * than the tRPC `PullResultView` so the landing page's client-side demo summon
 * can render the same card without a server round-trip.
 */
export interface RevealCardResult {
  speciesId: string;
  species: Species;
  rarity: Rarity;
  /** The pity counter forced this pull to epic+. */
  wasPity: boolean;
  /** The ten-summon rare+ guarantee produced this pull. */
  guaranteed: boolean;
  /** First time this trainer has owned this species. */
  isNew: boolean;
  creature: { level: number; power: number };
}

export interface RevealCardProps {
  result: RevealCardResult;
  /**
   * Tighter card for five-across grids narrower than the Summon page's: a
   * smaller sprite, less padding, and the name at 8px so the longest species
   * name in the game still fits on one line.
   */
  dense?: boolean;
}

/** Delay between two cards appearing. */
export const REVEAL_STAGGER_MS = 150;

export interface PullRevealProps {
  summary: PullSummary;
  busy: boolean;
  onSummonAgain: () => void;
  onDismiss: () => void;
}

/**
 * The payoff: results pop in one at a time with a rarity-coloured flash.
 * Two columns at 375px, five on desktop.
 */
export function PullReveal({
  summary,
  busy,
  onSummonAgain,
  onDismiss,
}: PullRevealProps) {
  const revealed = useStaggeredReveal(summary.results.length, summary);
  const done = revealed >= summary.results.length;
  const best = bestRarityLabel(summary.results);

  return (
    <section className="panel space-y-3 p-3">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-pixel text-gold text-[10px] sm:text-xs">
          {summary.results.length > 1
            ? `${summary.results.length} cats answered the call`
            : "A cat answered the call"}
        </h2>
        <button
          type="button"
          onClick={done ? onDismiss : () => undefined}
          className="text-pixel text-ink-dim text-[8px] uppercase underline disabled:opacity-40"
          disabled={!done}
        >
          {done ? "Close" : "Revealing…"}
        </button>
      </header>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {summary.results.map((result, index) => (
          <li key={result.creature.id}>
            {index < revealed ? (
              <RevealCard result={result} />
            ) : (
              <PendingCard index={index} />
            )}
          </li>
        ))}
      </ul>

      <p className="text-ink-dim text-base">
        Spent <span className="text-mint tabular-nums">◆ {summary.cost}</span> ·
        best pull <span className="text-ink">{best}</span> · pity{" "}
        <span className="text-ink tabular-nums">
          {summary.pityCount}/{summary.pityThreshold}
        </span>
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          onClick={onSummonAgain}
          disabled={busy || !done}
        >
          Summon again
        </Button>
        <Link href="/collection">
          <Button variant="secondary">Go to Collection</Button>
        </Link>
      </div>
    </section>
  );
}

/** One revealed cat: rarity-framed, flashing, with its level and power. */
export function RevealCard({ result, dense = false }: RevealCardProps) {
  const palette = RARITY_PALETTES[result.rarity];
  const isLegendary = result.rarity === "legendary";
  const isSpecial = isLegendary || result.rarity === "epic";

  return (
    <article
      className={`panel-flat gacha-pop relative flex flex-col items-center gap-1 overflow-hidden text-center ${dense ? "p-1.5" : "p-2"}`}
      style={{
        borderColor: palette.outline,
        borderWidth: isLegendary ? 3 : 2,
        boxShadow: isSpecial
          ? `0 0 12px ${palette.glow}, 4px 4px 0 #000`
          : "4px 4px 0 #000",
      }}
    >
      <span
        aria-hidden
        className="gacha-flash pointer-events-none absolute inset-0"
        style={{ backgroundColor: palette.glow }}
      />

      {result.isNew ? (
        <span className="text-pixel border-navy bg-pink text-navy absolute top-1 left-1 z-10 border px-1 text-[7px] uppercase">
          New!
        </span>
      ) : null}
      {result.wasPity ? (
        <span className="text-pixel border-navy bg-gold text-navy absolute top-1 right-1 z-10 border px-1 text-[7px] uppercase">
          Pity
        </span>
      ) : result.guaranteed ? (
        <span className="text-pixel border-navy bg-mint text-navy absolute top-1 right-1 z-10 border px-1 text-[7px] uppercase">
          Gtd
        </span>
      ) : null}

      <CreatureArt
        speciesId={result.speciesId}
        size={dense ? 64 : 72}
        className={isLegendary ? "gacha-legendary" : undefined}
      />
      {/* Never truncated: the cat's name is the reveal. */}
      <h3
        className={`text-pixel text-ink w-full leading-relaxed ${dense ? "text-[8px]" : "text-[9px]"}`}
      >
        {result.species.name}
      </h3>
      <div className="flex flex-wrap items-center justify-center gap-1">
        <ElementBadge element={result.species.element} />
        <RarityBadge rarity={result.rarity} />
      </div>
      <p className="text-ink-dim text-base leading-none">
        Lv{" "}
        <span className="text-ink tabular-nums">{result.creature.level}</span>
        <span className="text-edge mx-1">|</span>
        <span className="text-gold tabular-nums">
          {result.creature.power}
        </span>{" "}
        PWR
      </p>
    </article>
  );
}

function PendingCard({ index }: { index: number }) {
  return (
    <div
      className="panel-flat flex aspect-[3/4] items-center justify-center p-2"
      aria-hidden
    >
      <span className="text-pixel text-edge text-[10px]">?</span>
      <span className="sr-only">Summon {index + 1} revealing</span>
    </div>
  );
}

/** Reveals one card every {@link REVEAL_STAGGER_MS}, restarting per summary. */
function useStaggeredReveal(total: number, key: object): number {
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    setRevealed(0);
    if (total === 0) return;

    const timers = Array.from({ length: total }, (_, i) =>
      setTimeout(() => setRevealed(i + 1), REVEAL_STAGGER_MS * (i + 1)),
    );

    return () => timers.forEach(clearTimeout);
  }, [total, key]);

  return revealed;
}

function bestRarityLabel(results: readonly PullResultView[]): string {
  const order = ["common", "uncommon", "rare", "epic", "legendary"] as const;
  let best = 0;
  for (const result of results) {
    best = Math.max(best, order.indexOf(result.rarity));
  }
  return RARITY_LABELS[order[best] ?? "common"];
}
