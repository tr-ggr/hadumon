"use client";

import { useState } from "react";

import { PixelSprite } from "~/components/PixelSprite";
import { RARITY_PALETTES } from "~/components/sprites/palettes";
import { Button, ElementBadge, RarityBadge } from "~/components/ui";
import type { RouterOutputs } from "~/trpc/react";
import { PityBar } from "./PityBar";
import { RatesTable } from "./RatesTable";

export type BannerSummary = RouterOutputs["gacha"]["banners"][number];

export interface BannerCardProps {
  banner: BannerSummary;
  gems: number;
  busy: boolean;
  onSummon: (count: 1 | 10) => void;
}

/**
 * One banner: art, cost, a collapsible rate card, pity progress and the two
 * summon buttons. The spotlight banner is framed in gold.
 */
export function BannerCard({ banner, gems, busy, onSummon }: BannerCardProps) {
  const [showRates, setShowRates] = useState(false);
  const isFeatured = banner.featured !== null;
  const glow = banner.featured
    ? RARITY_PALETTES[banner.featured.rarity].glow
    : undefined;

  return (
    <section
      className="panel-flat flex flex-col gap-3 p-3"
      style={{
        borderColor: isFeatured ? "var(--color-gold)" : undefined,
        boxShadow: isFeatured
          ? `0 0 10px ${glow}, 4px 4px 0 #000`
          : "4px 4px 0 #000",
      }}
    >
      <header className="flex items-start gap-3">
        {banner.featured ? (
          <div className="shrink-0">
            <PixelSprite speciesId={banner.featured.id} size={64} />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <h3 className="text-pixel text-gold text-[10px]">{banner.name}</h3>
          {banner.featured ? (
            <p className="mt-1 flex flex-wrap items-center gap-1">
              <span className="text-pixel text-pink text-[8px] uppercase">
                Rate-up
              </span>
              <span className="text-ink text-lg leading-none">
                {banner.featured.name}
              </span>
              <ElementBadge element={banner.featured.element} />
              <RarityBadge rarity={banner.featured.rarity} />
            </p>
          ) : null}
          <p className="text-ink-dim mt-1 text-base leading-tight">
            {banner.description}
          </p>
        </div>
      </header>

      <PityBar count={banner.pityCount} threshold={banner.pityThreshold} />

      <div className="flex flex-col gap-2">
        <SummonButton
          label={`Summon ×1`}
          cost={banner.singleCost}
          gems={gems}
          busy={busy}
          variant="secondary"
          onClick={() => onSummon(1)}
        />
        <SummonButton
          label={`Summon ×${banner.multiCount}`}
          cost={banner.multiCost}
          gems={gems}
          busy={busy}
          variant="primary"
          hint="1 Rare+ guaranteed"
          onClick={() => onSummon(10)}
        />
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowRates((open) => !open)}
          aria-expanded={showRates}
          className="text-pixel text-mint text-[8px] uppercase underline"
        >
          {showRates ? "Hide rates" : "Rates"}
        </button>
        {showRates ? (
          <div className="border-edge bg-navy-deep mt-2 border-2 p-2">
            <RatesTable rates={banner.rates} />
            {banner.featured ? (
              <p className="text-ink-dim mt-2 text-base leading-tight">
                {banner.featured.name} takes 50% of every{" "}
                {banner.featured.rarity} roll on this banner.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function SummonButton({
  label,
  cost,
  gems,
  busy,
  variant,
  hint,
  onClick,
}: {
  label: string;
  cost: number;
  gems: number;
  busy: boolean;
  variant: "primary" | "secondary";
  hint?: string;
  onClick: () => void;
}) {
  const short = Math.max(0, cost - gems);
  const affordable = short === 0;

  return (
    <div className="space-y-0.5">
      <Button
        variant={variant}
        size="md"
        className="w-full"
        disabled={busy || !affordable}
        onClick={onClick}
      >
        <span>{label}</span>
        <span className="text-[9px] opacity-80">◆ {cost}</span>
      </Button>
      <p className="text-ink-dim text-base leading-none">
        {affordable
          ? (hint ?? ` `)
          : `Need ${short.toLocaleString()} more gems`}
      </p>
    </div>
  );
}
