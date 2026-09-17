import { RatesTable } from "~/components/gacha";
import {
  bannerRates,
  PITY_LEGENDARY_CHANCE,
  type Banner,
} from "~/server/game/gacha";
import { LandingSection } from "./LandingSection";

export interface FairPlayPanelProps {
  banners: Banner[];
}

export function FairPlayPanel({ banners }: FairPlayPanelProps) {
  const standard =
    banners.find((banner) => banner.id === "standard") ?? banners[0];
  const featured =
    banners.find((banner) => banner.id === "featured") ?? banners[0];
  if (!standard || !featured) return null;

  return (
    <LandingSection labelledBy="rates-heading">
      <div className="grid overflow-hidden rounded-2xl bg-white shadow-[0_16px_40px_rgb(23_33_43_/_0.09)] md:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-cobalt p-6 text-white sm:p-8">
          <h2 id="rates-heading" className="text-3xl text-white sm:text-4xl">
            The odds, on the tin.
          </h2>
          <p className="mt-3 max-w-[36ch] text-base leading-relaxed text-white/80">
            No paid gems, hidden shop, or premium track. The counter runs on
            currency earned by playing.
          </p>
          <ul className="mt-7 space-y-3 text-sm font-bold">
            <li>Every ten-pull guarantees rare or better.</li>
            <li>Epic+ guaranteed after {featured.pityThreshold} misses.</li>
            <li>
              {Math.round(PITY_LEGENDARY_CHANCE * 100)}% of pity pulls are
              legendary.
            </li>
          </ul>
        </div>
        <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
          {[standard, featured].map((banner) => (
            <div key={banner.id}>
              <h3 className="text-ink text-lg">{banner.name}</h3>
              <p className="text-ink-soft mt-1 min-h-10 text-sm leading-snug">
                {banner.id === "featured"
                  ? "Better odds, with one epic or legendary on rate-up."
                  : "The complete catalogue at its usual rates."}
              </p>
              <RatesTable rates={bannerRates(banner)} className="mt-4" />
              <p className="text-ink-soft mt-4 text-sm tabular-nums">
                ◆{banner.singleCost} once · ◆{banner.multiCost} for{" "}
                {banner.multiCount}
              </p>
            </div>
          ))}
        </div>
      </div>
    </LandingSection>
  );
}
