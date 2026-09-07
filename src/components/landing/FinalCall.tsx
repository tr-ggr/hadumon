import { PixelSprite } from "~/components/PixelSprite";
import { ElementBadge } from "~/components/ui";
import { STARTING_GEMS } from "~/server/game/economy";
import { getSpecies, STARTER_SPECIES_IDS } from "~/server/game/species";
import { ActionLink } from "./LandingHeader";
import { SECTION_SHELL, SectionHeading } from "./LandingSection";

/**
 * The close: the offer, the two account actions, and the one thing the page
 * has not shown yet — the three cats every account is handed on day one.
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

          <ul
            aria-label="Starter cats every new account receives"
            className="mt-6 grid grid-cols-3 gap-2"
          >
            {STARTER_SPECIES_IDS.map((id) => {
              const species = getSpecies(id);
              return (
                <li
                  key={id}
                  className="panel-flat flex flex-col items-center gap-1 p-2"
                >
                  <PixelSprite speciesId={id} size={56} />
                  <span className="text-pixel text-ink text-[8px] leading-relaxed">
                    {species.name}
                  </span>
                  <ElementBadge element={species.element} />
                </li>
              );
            })}
          </ul>
          <p className="text-ink-dim mt-2 text-base leading-tight">
            Yours from the first minute, before a single pull.
          </p>
        </div>
      </div>
    </section>
  );
}
