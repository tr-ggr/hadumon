import { RatesTable } from "~/components/gacha";
import { Panel } from "~/components/ui";
import {
  bannerRates,
  PITY_LEGENDARY_CHANCE,
  type Banner,
} from "~/server/game/gacha";
import { LandingSection, SectionHeading } from "./LandingSection";

export interface FairPlayPanelProps {
  /** Both banners, resolved on the server for the current week. */
  banners: Banner[];
}

/** "one in four" — how often a pity pull comes out legendary. */
const PITY_LEGENDARY_ODDS = Math.round(1 / PITY_LEGENDARY_CHANCE);

/**
 * The ten-pull guarantee, worded for whatever the banner's multi actually is.
 *
 * Reads `banner.multiCount` rather than the `MULTI_COUNT` module constant:
 * `export const MULTI_COUNT = 10` has the literal type `10`, so comparing it
 * against `10` narrows the other branch to `never` and the fallback wording
 * stops being live code. `Banner.multiCount` is typed `number`, which is what
 * this sentence is actually about.
 */
function multiGuarantee(count: number): string {
  return count === 10
    ? "Every ten-pull holds at least one rare."
    : `Every pull of ${count} holds at least one rare.`;
}

/**
 * The rate card, printed. Every figure comes out of `src/server/game/gacha.ts`,
 * so what is on this page is what the roller actually does.
 */
export function FairPlayPanel({ banners }: FairPlayPanelProps) {
  return (
    <LandingSection labelledBy="rates-heading">
      <SectionHeading
        kicker="Printed rates"
        titleId="rates-heading"
        title="The odds, on the tin."
        intro="Both banners, their costs, and the pity counter that catches you when the odds do not."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {banners.map((banner) => (
          <Panel
            key={banner.id}
            title={banner.name}
            bodyClassName="space-y-3"
            className="h-full"
          >
            <p className="text-ink-dim text-lg leading-snug">
              {banner.description}
            </p>

            <RatesTable rates={bannerRates(banner)} />

            <dl className="border-edge space-y-1 border-t-2 pt-3">
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-pixel text-ink-dim text-[8px] tracking-wide uppercase">
                  Cost
                </dt>
                <dd className="text-ink text-base tabular-nums">
                  ◆{banner.singleCost} a pull · ◆{banner.multiCost} for{" "}
                  {banner.multiCount}
                </dd>
              </div>
            </dl>

            <p className="text-ink-dim text-base leading-snug">
              Guaranteed epic or better after {banner.pityThreshold} misses; one
              in {PITY_LEGENDARY_ODDS} of those is legendary.
            </p>
            <p className="text-ink-dim text-base leading-snug">
              {multiGuarantee(banner.multiCount)}
            </p>
          </Panel>
        ))}
      </div>

      {/* Stated plainly, and only once. The gold border is kept for the altar
          and the close, so this reads as a fact rather than a second offer. */}
      <p className="panel text-pixel text-gold p-4 text-center text-xs leading-relaxed sm:p-6 sm:text-base">
        Every gem is earned in-game. There is nothing to buy.
      </p>
    </LandingSection>
  );
}
