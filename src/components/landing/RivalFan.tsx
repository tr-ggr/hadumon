import type { CSSProperties } from "react";

import { GAUNTLET, getRival } from "~/server/game/rival";

/**
 * The six rivals of a run as coral nameplates, fanned up a staircase: the
 * first at the foot, the last boss on top. The list is in the order they are
 * met; only the way it is laid out climbs.
 */
export function RivalFan() {
  const last = GAUNTLET.length - 1;
  return (
    <ol
      className="flex flex-col-reverse gap-3 p-3 pb-4 sm:p-4 sm:pb-5"
      style={{ "--steps": last } as CSSProperties}
    >
      {GAUNTLET.map((rivalId, index) => {
        const rival = getRival(rivalId);
        return (
          <li
            key={rivalId}
            style={{ "--n": index } as CSSProperties}
            className="piece border-ink bg-coral ml-[calc(var(--n)*6px)] flex w-[calc(100%-var(--steps)*6px)] items-start gap-3 border-2 px-3 py-2 sm:ml-[calc(var(--n)*22px)] sm:w-[calc(100%-var(--steps)*22px)]"
          >
            <span
              aria-hidden
              className={`text-print w-4 shrink-0 tabular-nums ${rival.boss ? "text-3xl" : "text-xl"}`}
            >
              {index + 1}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h3
                  className={`text-print ${rival.boss ? "text-3xl" : "text-xl"}`}
                >
                  {rival.name}
                </h3>
                {rival.boss ? (
                  <span className="border-ink bg-ink text-cream border px-1 text-[11px] leading-4 font-black">
                    Boss
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm leading-snug italic">{rival.flavor}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
