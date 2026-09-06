import Link from "next/link";

import { PixelSprite } from "~/components/PixelSprite";
import { Button } from "~/components/ui";
import type { Banner } from "~/server/game/gacha";
import type { Species } from "~/server/game/species";
import { RosterStats } from "./RosterStats";

export interface SummonAltarProps {
  /** The Weekly Spotlight banner, resolved on the server for this week. */
  banner: Banner;
  /** The banner's rate-up cat. */
  featured: Species;
}

/**
 * The hero: a working ten-pull on the real rates, before an account exists.
 *
 * Phase 1 placeholder — Agent A owns the finished altar (`useDemoSummon`,
 * `RevealCard` slots, pity bar, preview wallet).
 */
export function SummonAltar({ banner, featured }: SummonAltarProps) {
  return (
    <section className="mx-auto grid w-full max-w-6xl gap-6 px-3 py-10 sm:px-4 lg:grid-cols-2 lg:items-center">
      <div className="order-2 space-y-4 lg:order-1">
        <p className="text-pixel text-gold text-[8px] tracking-widest uppercase">
          Idle feline collector
        </p>
        <h1 className="text-pixel text-ink text-lg leading-relaxed sm:text-2xl">
          Cats answer the call.
        </h1>
        <p className="text-ink-dim max-w-prose text-xl leading-snug">
          Summon feline Fakemon, send the squad out to fight while you&rsquo;re
          away, and come back to the loot. In your browser. Nothing to buy.
        </p>
        <RosterStats />
      </div>

      <div className="panel scanlines order-1 space-y-3 p-4 lg:order-2">
        <h2 className="text-pixel text-gold text-[10px]">{banner.name}</h2>
        <p className="text-ink-dim text-base leading-tight">
          {banner.description}
        </p>
        <div className="flex items-center gap-3">
          <PixelSprite speciesId={featured.id} size={128} />
          <div className="min-w-0">
            <p className="text-pixel text-pink text-[8px] uppercase">Rate-up</p>
            <p className="text-ink text-lg leading-none">{featured.name}</p>
          </div>
        </div>
        <p className="text-ink-dim text-base leading-tight">
          The playable altar arrives with the hero build.
        </p>
        <Link href="/signup" className="block">
          <Button variant="primary" className="w-full">
            Create an account for 1000 real gems
          </Button>
        </Link>
      </div>
    </section>
  );
}
