import { ActionLink } from "./LandingHeader";
import { SECTION_SHELL, SectionHeading } from "./LandingSection";
import { RosterStats } from "./RosterStats";

/**
 * The starting gem balance a new account is created with.
 *
 * Mirrors `gems: integer("gems").notNull().default(1000)` —
 * `src/server/db/schema/auth.ts:25`. The column default is the source of
 * truth; it is not importable here because the schema pulls Drizzle into the
 * bundle, so the number is copied with its provenance instead.
 */
const STARTING_GEMS = 1000;

/**
 * The close: the offer, the two account actions, and the roster counts once
 * more for anyone who scrolled straight past the hero.
 *
 * Deliberately the bookend of the hero rather than one more section: the
 * ground drops to the deepest navy, and the panel wears the same gold border,
 * glow and scanlines as the altar the page opened on.
 */
export function FinalCall() {
  return (
    <section
      aria-labelledby="close-heading"
      className="border-edge bg-navy-deep border-t-2"
    >
      <div className={`${SECTION_SHELL} py-20 sm:py-28`}>
        <div
          className="panel scanlines mx-auto max-w-3xl p-5 text-center sm:p-8"
          style={{
            borderColor: "var(--color-gold)",
            boxShadow:
              "0 0 16px color-mix(in srgb, var(--color-gold) 35%, transparent), 4px 4px 0 #000",
          }}
        >
          <SectionHeading
            kicker="Start here"
            titleId="close-heading"
            title={`Your first ${STARTING_GEMS} gems are waiting.`}
            intro="Free account, no store. Pull ten, pick a zone, and let the squad get on with it."
            tone="gold"
            align="center"
          />

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <ActionLink href="/signup" variant="primary">
              Create account
            </ActionLink>
            <ActionLink href="/login" variant="secondary">
              Log in
            </ActionLink>
          </div>

          <RosterStats className="mt-6" />
        </div>
      </div>
    </section>
  );
}
