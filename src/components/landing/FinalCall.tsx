import { CreatureArt } from "~/components/CreatureArt";
import { STARTING_GEMS } from "~/server/game/economy";
import { getSpecies, STARTER_SPECIES_IDS } from "~/server/game/species";
import { ActionLink } from "./LandingHeader";
import { SECTION_SHELL } from "./LandingSection";

export function FinalCall() {
  return (
    <section aria-labelledby="close-heading" className="bg-sky-surface">
      <div className={`${SECTION_SHELL} py-16 sm:py-24`}>
        <div className="relative overflow-hidden rounded-[28px] bg-white px-5 pt-9 text-center shadow-[0_20px_50px_rgb(13_60_157_/_0.15)] sm:px-10 sm:pt-12">
          <h2
            id="close-heading"
            className="text-ink mx-auto max-w-2xl text-4xl text-balance sm:text-6xl"
          >
            Three cats already packed.
          </h2>
          <p className="text-ink-soft mx-auto mt-4 max-w-xl text-lg">
            Create an account and they arrive with {STARTING_GEMS} gems and
            nowhere urgent to be.
          </p>
          <div className="mt-6 flex justify-center">
            <ActionLink href="/signup" size="lg">
              Create account
            </ActionLink>
          </div>
          <ul
            aria-label="Starter cats every new account receives"
            className="mx-auto mt-5 flex max-w-xl items-end justify-center"
          >
            {STARTER_SPECIES_IDS.map((id, index) => {
              const species = getSpecies(id);
              return (
                <li
                  key={id}
                  className={`relative flex w-1/3 flex-col items-center ${index === 1 ? "z-10" : ""}`}
                >
                  <CreatureArt speciesId={id} size={index === 1 ? 180 : 150} />
                  <span className="sr-only">{species.name}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
