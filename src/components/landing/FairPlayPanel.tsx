import type { Banner } from "~/server/game/gacha";
import { SectionHeading } from "./LandingSection";

export interface FairPlayPanelProps {
  /** Both banners, resolved on the server for the current week. */
  banners: Banner[];
}

/**
 * The printed rate card for every banner, plus the line that nothing is sold.
 *
 * Phase 1 placeholder — Agent C owns the finished panel.
 */
export function FairPlayPanel({ banners }: FairPlayPanelProps) {
  return (
    <section className="mx-auto w-full max-w-6xl space-y-4 px-3 py-10 sm:px-4">
      <SectionHeading
        kicker="Fair play"
        title="Printed rates"
        intro={`The odds in full, for ${banners.map((banner) => banner.name).join(" and ")}.`}
      />
      <div className="panel p-3">
        <p className="text-pixel text-gold text-[10px] leading-relaxed">
          Every gem is earned in-game. There is nothing to buy.
        </p>
      </div>
    </section>
  );
}
