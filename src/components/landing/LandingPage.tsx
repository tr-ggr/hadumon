import {
  featuredSpeciesFor,
  getBanner,
  getBanners,
} from "~/server/game/gacha";
import { ElementBands } from "./ElementBands";
import { ElementWheel } from "./ElementWheel";
import { FairPlayPanel } from "./FairPlayPanel";
import { FinalCall } from "./FinalCall";
import { IdleTimeline } from "./IdleTimeline";
import { LandingFooter } from "./LandingFooter";
import { LandingHeader } from "./LandingHeader";
import { ProductShots } from "./ProductShots";
import { SummonAltar } from "./SummonAltar";

export interface LandingPageProps {
  /** Decides which cat is on rate-up this week. Passed in so it is testable. */
  now: Date;
}

/**
 * The public landing page at `/`. A server component: it resolves this week's
 * banners once and hands plain data to the sections, so nothing below has to
 * reach for the server.
 */
export function LandingPage({ now }: LandingPageProps) {
  const banner = getBanner("featured", now);
  const banners = getBanners(now);
  // The Weekly Spotlight always names a rate-up cat.
  const featured = featuredSpeciesFor(now);

  return (
    <div className="bg-navy flex min-h-dvh flex-col">
      <LandingHeader />
      <main className="flex-1">
        <SummonAltar banner={banner} featured={featured} />
        <ElementBands />
        <IdleTimeline />
        <ElementWheel />
        <FairPlayPanel banners={banners} />
        <ProductShots />
        <FinalCall />
      </main>
      <LandingFooter />
    </div>
  );
}
