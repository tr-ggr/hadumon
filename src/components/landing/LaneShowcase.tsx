"use client";

import { useState } from "react";

import { PixelIcon } from "~/components/PixelIcon";
import type { IconName } from "~/components/sprites/icons";
import { plural } from "~/components/run/describe";
import { COBALT, INK, LIME, WHITE } from "~/components/run/pieces";
import { ROW_LABELS, ROWS, type Row } from "~/server/game/cats";
import { COLUMN_YARN_COST, ROW_REWARD, SLOTS } from "~/server/game/match";

interface Lane {
  icon: IconName;
  unit: IconName;
  /** What activating the lane says it gives, for a count. */
  gives: (n: number) => string;
  /** What the lane's reward is, in a sentence that takes two counts. */
  pays: (empty: string, full: string) => string;
}

const LANES: Record<Row, Lane> = {
  hunt: {
    icon: "paw",
    unit: "die",
    gives: (n) => `Take ${plural(n, "die", "dice")}`,
    pays: (empty, full) =>
      `takes food from the feeder: ${empty} from an empty row, ${full} from a full one. Food is what cats cost.`,
  },
  den: {
    icon: "den",
    unit: "yarn",
    gives: (n) => `Lay ${n} yarn`,
    pays: (empty, full) =>
      `lays yarn on your cats: ${empty} from an empty row, ${full} from a full one. Each yarn is a point, and yarn pays for a row's later spaces.`,
  },
  prowl: {
    icon: "card",
    unit: "card",
    gives: (n) => `Draw ${plural(n, "cat")}`,
    pays: (empty, full) =>
      `draws cats into your hand: ${empty} from an empty row, ${full} from a full one. Those are the cats you play into rows.`,
  },
};

/**
 * The player's mat at a glance: three lanes with the yarn each space costs
 * and the reward each one gives as it fills, printed from the engine's own
 * tables. A lane's tile picks it, and one sentence says what it pays.
 */
export function LaneShowcase() {
  const [row, setRow] = useState<Row>("hunt");
  const chosen = LANES[row];
  const ladder = ROW_REWARD[row];

  return (
    <div className="p-2.5 sm:p-3.5">
      <div className="mat">
        <p className="flex items-center justify-between gap-3 px-2.5 pt-2 text-xs font-bold sm:px-3">
          Every power in a row fires right to left.
          <PixelIcon name="chevron" size={16} ink={COBALT} />
        </p>
        {ROWS.map((id, index) => {
          const lane = LANES[id];
          const on = id === row;
          return (
            <section
              key={id}
              aria-label={`${ROW_LABELS[id]} lane`}
              className={`grid gap-x-3 gap-y-2.5 px-2 pt-2.5 pb-3.5 sm:grid-cols-[8.25rem_minmax(0,1fr)] sm:px-3 ${index > 0 ? "border-sky-deep border-t-2" : ""}`}
            >
              <button
                type="button"
                aria-pressed={on}
                aria-label={`${ROW_LABELS[id]}: ${lane.gives(ROW_REWARD[id][0] ?? 0)}`}
                onClick={() => setRow(id)}
                className={`piece border-ink flex min-h-12 items-center gap-2.5 border-2 px-2.5 py-1.5 text-left ${on ? "bg-lime text-ink is-pressed" : "bg-cobalt hover:bg-cobalt-dark liftable text-white"}`}
              >
                <PixelIcon
                  name={lane.icon}
                  size={24}
                  fill={on ? WHITE : LIME}
                  ink={on ? INK : id === "hunt" ? WHITE : INK}
                />
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="text-print text-xl">{ROW_LABELS[id]}</span>
                  <span className="text-xs leading-none font-bold">
                    {lane.gives(ROW_REWARD[id][0] ?? 0)}
                  </span>
                </span>
              </button>

              <ol className="grid min-w-0 grid-cols-[repeat(4,minmax(0,1fr))_1.75rem] gap-x-1.5 sm:grid-cols-[repeat(4,minmax(0,1fr))_2.25rem]">
                {Array.from({ length: SLOTS + 1 }, (_, col) => {
                  const reward = ROW_REWARD[id][col] ?? 0;
                  const step = (
                    <span className="text-pixel flex items-center gap-0.5 text-sm leading-none tabular-nums">
                      <span aria-hidden>{reward}</span>
                      <PixelIcon name={lane.unit} size={16} />
                      <span className="sr-only">
                        With {plural(col, "cat")} here: {lane.gives(reward)}.
                      </span>
                    </span>
                  );
                  if (col === SLOTS) {
                    return (
                      <li
                        key={col}
                        className="flex flex-col items-center justify-center"
                      >
                        {step}
                      </li>
                    );
                  }
                  const cost = COLUMN_YARN_COST[col] ?? 0;
                  return (
                    <li
                      key={col}
                      className={`flex min-h-14 flex-col items-center justify-center gap-1.5 border-2 px-0.5 py-1 text-[11px] leading-none font-bold ${on ? "border-ink/55 border-dashed bg-white/45" : "border-sky-deep"}`}
                    >
                      <span className="sr-only">Space {col + 1} costs </span>
                      {cost === 0 ? (
                        <span className="flex h-4 items-center">Free</span>
                      ) : (
                        <span className="flex gap-px">
                          {Array.from({ length: cost }, (_, i) => (
                            <PixelIcon key={i} name="yarn" size={16} />
                          ))}
                          <span className="sr-only">{cost} yarn. </span>
                        </span>
                      )}
                      {step}
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>

      <p
        aria-live="polite"
        className="piece border-ink mt-4 mb-1 border-2 bg-white px-3 py-2 text-sm leading-snug"
      >
        <span className="text-print mr-1 text-xl">{ROW_LABELS[row]}</span>{" "}
        {chosen.pays(`${ladder[0]}`, `${ladder[SLOTS]}`)}
      </p>
    </div>
  );
}
