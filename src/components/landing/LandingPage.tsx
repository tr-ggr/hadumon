import { featuredSpeciesFor, getBanner, getBanners } from "~/server/game/gacha";
import { FairPlayPanel } from "./FairPlayPanel";
import { FinalCall } from "./FinalCall";
import { ElementCollection, IdleLoop, ProofStrip } from "./LandingHighlights";
import { LandingFooter } from "./LandingFooter";
import { LandingHeader } from "./LandingHeader";
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
    <div className="landing-root bg-cream flex min-h-dvh flex-col overflow-hidden">
      <LandingHeader />
      <main className="flex-1">
        <SummonAltar banner={banner} featured={featured} />
        <ProofStrip />
        <IdleLoop />
        <ElementCollection />
        <FairPlayPanel banners={banners} />
        <FinalCall />
      </main>
      <LandingFooter />
    </div>
  );
}
