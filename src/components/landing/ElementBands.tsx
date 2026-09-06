import { SectionHeading } from "./LandingSection";

/**
 * Five full-bleed bands, one per element, each drenched in that element's fur
 * palette and holding its zone and its cats.
 *
 * Phase 1 placeholder — Agent B owns the finished bands.
 */
export function ElementBands() {
  return (
    <section className="mx-auto w-full max-w-6xl space-y-4 px-3 py-10 sm:px-4">
      <SectionHeading
        kicker="The catalogue"
        title="Twenty-five cats, five elements"
        intro="Every cat in the game, sorted by the element it answers to."
      />
      <div className="panel p-3">
        <p className="text-ink-dim text-lg">The element bands land next.</p>
      </div>
    </section>
  );
}
