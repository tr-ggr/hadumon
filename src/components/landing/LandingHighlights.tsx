"use client";

import { CreatureArt } from "~/components/CreatureArt";
import { ELEMENT_LABELS, ELEMENTS, type Element } from "~/server/game/elements";
import { SPECIES_LIST } from "~/server/game/species";
import { MAX_OFFLINE_SECONDS } from "~/server/game/zones";
import { LandingSection, SectionHeading } from "./LandingSection";
import { useReveal } from "./useReveal";

const ELEMENT_CATS: Record<Element, string> = {
  flame: "flameclaw",
  mist: "mistpaw",
  volt: "voltwhisk",
  thorn: "verdantmane",
  shade: "shadewhisker",
};

const PROOFS = [
  { value: SPECIES_LIST.length, label: "cats", note: "Every one has a name." },
  {
    value: ELEMENTS.length,
    label: "elements",
    note: "Build around an affinity.",
  },
  {
    value: MAX_OFFLINE_SECONDS / 3600,
    label: "hours offline",
    note: "Progress waits for you.",
  },
] as const;

export function ProofStrip() {
  return (
    <section aria-label="HaduMon facts" className="bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-2 px-3 py-5 sm:px-4 lg:grid-cols-4 lg:py-7">
        {PROOFS.map((item) => (
          <div
            key={item.label}
            className="border-edge/70 border-b p-3 last:border-b-0 even:border-l lg:border-b-0 lg:border-l lg:first:border-l-0"
          >
            <p className="text-ink text-lg font-extrabold tabular-nums sm:text-xl">
              {item.value} {item.label}
            </p>
            <p className="text-ink-soft mt-0.5 text-sm">{item.note}</p>
          </div>
        ))}
        <div className="border-edge/70 border-l p-3">
          <p className="text-ink text-lg font-extrabold sm:text-xl">
            Nothing for sale
          </p>
          <p className="text-ink-soft mt-0.5 text-sm">Every gem is earned.</p>
        </div>
      </div>
    </section>
  );
}

const LOOP = [
  {
    number: "1",
    title: "Summon",
    copy: "Spend earned gems at the counter. Meet somebody odd.",
  },
  {
    number: "2",
    title: "Send",
    copy: "Choose a squad and a zone. They handle the fighting.",
  },
  {
    number: "3",
    title: "Return",
    copy: "Come back to experience, gold, and whatever they found.",
  },
] as const;

export function IdleLoop() {
  const reveal = useReveal<HTMLOListElement>();
  return (
    <LandingSection labelledBy="loop-heading" className="relative">
      <SectionHeading
        titleId="loop-heading"
        title="A small ritual, not another job."
        intro="Pull a cat, send the squad, close the tab. The adventure keeps its own time."
      />
      <ol
        ref={reveal.ref}
        className={`grid gap-4 md:grid-cols-3 ${reveal.revealed ? "land-revealed" : "land-reveal"}`}
      >
        {LOOP.map((step, index) => (
          <li
            key={step.title}
            className="landing-lift relative overflow-hidden rounded-2xl bg-white p-5 shadow-[0_12px_30px_rgb(23_33_43_/_0.08)]"
            style={{ transitionDelay: `${index * 70}ms` }}
          >
            <span className="bg-sky-soft text-cobalt flex size-11 items-center justify-center rounded-full text-lg font-extrabold">
              {step.number}
            </span>
            <h3 className="text-ink mt-5 text-2xl">{step.title}</h3>
            <p className="text-ink-soft mt-2 max-w-[34ch] text-base leading-relaxed">
              {step.copy}
            </p>
          </li>
        ))}
      </ol>
    </LandingSection>
  );
}

export function ElementCollection() {
  const reveal = useReveal<HTMLUListElement>();
  return (
    <section aria-labelledby="collection-heading" className="bg-sky-soft">
      <div className="mx-auto max-w-6xl px-3 py-16 sm:px-4 sm:py-24">
        <SectionHeading
          titleId="collection-heading"
          title="Five elements. Twenty-five personalities."
          intro="A deliberately small collection. Large enough for a favourite; small enough to learn their names."
        />
        <ul
          ref={reveal.ref}
          className={`mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5 ${reveal.revealed ? "land-revealed" : "land-reveal"}`}
        >
          {ELEMENTS.map((element, index) => {
            const cat = SPECIES_LIST.find(
              (species) => species.id === ELEMENT_CATS[element],
            );
            if (!cat) return null;
            return (
              <li
                key={element}
                className={`landing-lift element-surface-${element} col-span-1 flex min-h-44 flex-col items-center justify-end overflow-hidden rounded-2xl p-3 text-center shadow-[0_10px_24px_rgb(23_33_43_/_0.08)] last:col-span-2 last:mx-auto last:w-[calc(50%-0.375rem)] sm:last:col-span-1 sm:last:mx-0 sm:last:w-auto`}
                style={{ transitionDelay: `${index * 55}ms` }}
              >
                <CreatureArt speciesId={cat.id} size={112} decorative />
                <h3 className="text-ink text-lg">{cat.name}</h3>
                <p className="text-ink-soft text-sm font-bold">
                  {ELEMENT_LABELS[element]}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
