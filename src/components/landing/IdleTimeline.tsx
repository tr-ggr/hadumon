import { SectionHeading } from "./LandingSection";

/**
 * Four stops from summon to claim, with a live fight-log ticker on the third.
 *
 * Phase 1 placeholder — Agent C owns the finished timeline.
 */
export function IdleTimeline() {
  return (
    <section className="mx-auto w-full max-w-6xl space-y-4 px-3 py-10 sm:px-4">
      <SectionHeading
        kicker="Idle mode"
        title="A day in the life"
        intro="Summon, send the squad out, and go and do something else."
      />
      <div className="panel p-3">
        <p className="text-ink-dim text-lg">The idle timeline lands next.</p>
      </div>
    </section>
  );
}
