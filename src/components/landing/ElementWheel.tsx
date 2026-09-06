import { SectionHeading } from "./LandingSection";

/**
 * The advantage wheel and the ladder tiers beside it.
 *
 * Phase 1 placeholder — Agent B owns the finished wheel.
 */
export function ElementWheel() {
  return (
    <section className="mx-auto w-full max-w-6xl space-y-4 px-3 py-10 sm:px-4">
      <SectionHeading
        kicker="Match-ups"
        title="The wheel, and the ladder"
        intro="Flame beats thorn beats volt beats mist beats flame. Shade sits outside it."
      />
      <div className="panel p-3">
        <p className="text-ink-dim text-lg">The element wheel lands next.</p>
      </div>
    </section>
  );
}
