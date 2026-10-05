"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { CatCard, ElementMark } from "~/components/cats/CatCard";
import { PixelSprite } from "~/components/PixelSprite";
import { CAT_LIST, getCat, RARITY_LABELS } from "~/server/game/cats";
import { ELEMENT_LABELS, ELEMENTS } from "~/server/game/elements";

import { CrowdCat } from "./Crowd";
import { StageFrame } from "./StageFrame";

/** Every cat, grouped by element in the elements' own order. */
const CAST = ELEMENTS.flatMap((element) =>
  CAT_LIST.filter((cat) => cat.element === element),
);
/** The cat on show before the visitor picks one. */
const FIRST_CAT = "verdantmane";

const KEY_STEPS: Partial<Record<string, number>> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

/**
 * The cast panel: one cat at full size beside its real card, a strip that
 * picks any of the cats, and the chosen cat's flavor line as the pull quote.
 * `children` is the panel's heading and copy.
 */
export function CastShowcase({ children }: { children: ReactNode }) {
  const [catId, setCatId] = useState(FIRST_CAT);
  const picks = useRef<(HTMLButtonElement | null)[]>([]);
  const cat = getCat(catId);

  const pick = (index: number) => {
    const next = CAST[(index + CAST.length) % CAST.length];
    if (!next) return;
    setCatId(next.id);
    picks.current[CAST.indexOf(next)]?.focus();
  };

  // One tab stop for the strip; the arrow keys move along it.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const here = CAST.findIndex((entry) => entry.id === catId);
    const step = KEY_STEPS[event.key];
    if (step !== undefined) pick(here + step);
    else if (event.key === "Home") pick(0);
    else if (event.key === "End") pick(CAST.length - 1);
    else return;
    event.preventDefault();
  };

  return (
    <div className="grid gap-x-10 gap-y-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:grid-rows-[1fr_auto_auto_1fr]">
      <div className="lg:col-start-2 lg:row-start-2">{children}</div>

      <StageFrame
        className="max-lg:mt-10 lg:col-start-1 lg:row-span-4 lg:row-start-1"
        innerClassName="sky-band"
        crowd={
          <CrowdCat
            catId="joltpad"
            size={96}
            order={2}
            cast={false}
            flip
            className="right-5 bottom-[calc(100%-40px)]"
          />
        }
      >
        <div className="p-2.5 sm:p-4">
          <div className="grid items-end gap-x-4 gap-y-3 sm:grid-cols-[12rem_minmax(0,1fr)]">
            <div className="relative mx-auto h-[204px] w-48" aria-hidden>
              <CrowdCat
                key={cat.id}
                catId={cat.id}
                size={192}
                order={1}
                className="top-0 left-0"
              />
            </div>
            <CatCard catId={cat.id} variant="full" className="mb-2" />
          </div>

          <div
            role="group"
            aria-label="Jump to an element"
            className="mt-4 flex flex-wrap gap-x-2 gap-y-3"
          >
            {ELEMENTS.map((element) => {
              const here = cat.element === element;
              return (
                <button
                  key={element}
                  type="button"
                  aria-pressed={here}
                  onClick={() => {
                    const first = CAST.find(
                      (entry) => entry.element === element,
                    );
                    if (first && !here) setCatId(first.id);
                  }}
                  className={`piece border-ink flex min-h-10 items-center gap-1.5 border-2 px-2 text-xs font-black ${here ? "bg-lime is-pressed" : "liftable hover:bg-sky-soft bg-white"}`}
                >
                  <ElementMark element={element} />
                  {ELEMENT_LABELS[element]}
                </button>
              );
            })}
          </div>

          <div
            role="radiogroup"
            aria-label={`All ${CAST.length} cats`}
            onKeyDown={onKeyDown}
            className="tray-well mt-3 grid grid-cols-7 gap-y-1 px-1.5 pt-2.5 pb-2 sm:grid-cols-[repeat(13,minmax(0,1fr))]"
          >
            {CAST.map((entry, index) => {
              const chosen = entry.id === cat.id;
              return (
                <button
                  key={entry.id}
                  ref={(node) => {
                    picks.current[index] = node;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={chosen}
                  aria-label={entry.name}
                  title={entry.name}
                  tabIndex={chosen ? 0 : -1}
                  onClick={() => setCatId(entry.id)}
                  className={`grid h-11 place-items-center border-2 sm:h-10 ${chosen ? "piece border-ink bg-lime lift" : "liftable border-transparent hover:bg-white"}`}
                >
                  <PixelSprite catId={entry.id} size={32} decorative />
                </button>
              );
            })}
          </div>
        </div>
      </StageFrame>

      <figure aria-live="polite" className="lg:col-start-2 lg:row-start-3">
        <blockquote className="text-xl leading-snug font-bold text-balance italic sm:text-2xl">
          &ldquo;{cat.flavor}&rdquo;
        </blockquote>
        <figcaption className="mt-3 flex items-center gap-2 text-sm font-bold">
          <ElementMark element={cat.element} />
          {cat.name}, {RARITY_LABELS[cat.rarity].toLowerCase()}{" "}
          {ELEMENT_LABELS[cat.element]}
        </figcaption>
      </figure>
    </div>
  );
}
