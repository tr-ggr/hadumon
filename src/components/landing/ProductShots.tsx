import Image from "next/image";

import { LandingSection, SectionHeading } from "./LandingSection";

interface Shot {
  src: string;
  /** Caption under the phone — the screen's name in the app. */
  caption: string;
  alt: string;
  /** Intrinsic size at 375px wide; the files are captured at 2×. */
  height: number;
}

/** The six mobile screens, in the order a new player meets them. */
const MOBILE_SHOTS: Shot[] = [
  {
    src: "/screenshots/mobile-login.png",
    caption: "Login",
    alt: "The HaduMon login screen: username and password fields over the indigo pixel background.",
    height: 812,
  },
  {
    src: "/screenshots/mobile-home.png",
    caption: "Dashboard",
    alt: "The dashboard: gold and gem wallet, the active expedition, and the squad's cats.",
    height: 1576,
  },
  {
    src: "/screenshots/mobile-summon.png",
    caption: "Summon",
    alt: "The Summoning Hub: the Weekly Spotlight banner, the pity bar, and the summon buttons.",
    height: 1054,
  },
  {
    src: "/screenshots/mobile-adventure.png",
    caption: "Adventure",
    alt: "The adventure screen: the zone list, the running expedition timer, and the claim button.",
    height: 1735,
  },
  {
    src: "/screenshots/mobile-battle.png",
    caption: "Battle",
    alt: "The ladder screen: rating, opponents to attack, and recent battle results.",
    height: 1180,
  },
  {
    src: "/screenshots/mobile-market.png",
    caption: "Market",
    alt: "The marketplace: cats listed for gold with their rarity and power.",
    height: 1678,
  },
];

/**
 * Real captures from the seeded `demo` account, at their real pixel sizes.
 * Nothing here is a mock-up.
 */
export function ProductShots() {
  return (
    <LandingSection labelledBy="shots-heading">
      <SectionHeading
        titleId="shots-heading"
        title="Screens from the seeded demo account. Nothing staged."
        intro="No mock-ups: these are captures of the running app, at the sizes it is played at."
      />

      <figure className="panel">
        <div className="border-edge bg-panel-hi flex items-center gap-1.5 border-b-2 px-3 py-2">
          <span aria-hidden="true" className="bg-pink block h-2 w-2" />
          <span aria-hidden="true" className="bg-gold block h-2 w-2" />
          <span aria-hidden="true" className="bg-mint block h-2 w-2" />
          <figcaption className="text-pixel text-ink-dim ml-2 text-[8px] uppercase">
            Dashboard · 1280px
          </figcaption>
        </div>
        <Image
          src="/screenshots/desktop-home.png"
          alt="The HaduMon dashboard on desktop: wallet, expedition progress, squad, ladder standing and market activity."
          width={2560}
          height={1828}
          sizes="(min-width: 1152px) 1152px, 100vw"
          loading="lazy"
          className="block h-auto w-full"
        />
      </figure>

      <div className="space-y-2">
        <p className="text-ink-dim text-lg">
          The same screens on a phone. Scroll the row, or focus it and use the
          arrow keys.
        </p>
        <ul
          tabIndex={0}
          aria-label="Mobile screens, captured at 375px"
          className="focus-visible:outline-gold flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {MOBILE_SHOTS.map((shot) => (
            <li key={shot.src} className="panel w-[220px] shrink-0 snap-start">
              <div className="h-[400px] overflow-hidden">
                <Image
                  src={shot.src}
                  alt={shot.alt}
                  width={375}
                  height={shot.height}
                  sizes="220px"
                  loading="lazy"
                  className="block h-auto w-full"
                />
              </div>
              <p className="border-edge text-pixel text-ink-dim border-t-2 px-2 py-2 text-[8px] uppercase">
                {shot.caption}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </LandingSection>
  );
}
