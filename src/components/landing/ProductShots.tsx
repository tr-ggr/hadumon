import { SectionHeading } from "./LandingSection";

/**
 * Real screenshots of the running game: the desktop dashboard and a scrollable
 * row of mobile screens.
 *
 * Phase 1 placeholder — Agent C owns the finished gallery.
 */
export function ProductShots() {
  return (
    <section className="mx-auto w-full max-w-6xl space-y-4 px-3 py-10 sm:px-4">
      <SectionHeading
        kicker="Screens"
        title="The game, as it is"
        intro="Screenshots of the running game, not a mock-up."
      />
      <div className="panel p-3">
        <p className="text-ink-dim text-lg">The screenshots land next.</p>
      </div>
    </section>
  );
}
