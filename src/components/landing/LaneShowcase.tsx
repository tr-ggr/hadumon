"use client";

import { useState, type CSSProperties } from "react";

import {
  EmptySpace,
  LaneBanner,
  LaneEnd,
  LaneLabel,
  LaneTile,
} from "~/components/mat/LaneSpace";
import { LANES } from "~/components/mat/lanes";
import { MatHeader } from "~/components/mat/MatHeader";
import { laneScene } from "~/components/mat/scene";
import { ROW_LABELS, ROWS, type Row } from "~/server/game/cats";
import {
  COLUMN_YARN_COST,
  ROW_REWARD,
  SLOTS,
  TRADE_CATS,
} from "~/server/game/match";

/**
 * The player's mat at a glance, as a match lays it out and printed from the
 * engine's own tables: the yarn a cat costs on a tab over each column, and
 * three lanes on their scenery with what each gives as it fills and where
 * its trades are. A lane's tile picks it, and one sentence says what it pays.
 */
export function LaneShowcase() {
  const [row, setRow] = useState<Row>("hunt");
  const ladder = ROW_REWARD[row];

  return (
    <div className="p-2.5 sm:p-3.5">
      <div
        className="mat mat-grid"
        style={{ "--mat-label": "8.5rem" } as CSSProperties}
      >
        <MatHeader costs={COLUMN_YARN_COST} />
        {ROWS.map((id) => {
          const lane = LANES[id];
          const on = id === row;
          const gives = lane.gives(ROW_REWARD[id][0] ?? 0);
          return (
            <section
              key={id}
              aria-label={`${ROW_LABELS[id]} lane`}
              className="lane lane-scene"
              style={laneScene(id)}
            >
              <LaneLabel>
                <LaneTile
                  row={id}
                  on={on}
                  gives={gives}
                  sub={lane.sub}
                  aria-pressed={on}
                  aria-label={`${ROW_LABELS[id]}: ${gives}`}
                  onClick={() => setRow(id)}
                  className={on ? "" : "liftable"}
                />
                <LaneBanner />
              </LaneLabel>
              <ol className="contents">
                {Array.from({ length: SLOTS }, (_, col) => (
                  <EmptySpace
                    key={col}
                    row={id}
                    col={col}
                    cost={COLUMN_YARN_COST[col] ?? 0}
                    reward={ROW_REWARD[id][col] ?? 0}
                    // An empty lane's next space is its first.
                    next={col === 0}
                    trade={TRADE_CATS.includes(col)}
                  />
                ))}
              </ol>
              <LaneEnd
                row={id}
                cats={SLOTS}
                reward={ROW_REWARD[id][SLOTS] ?? 0}
                here={false}
              />
            </section>
          );
        })}
      </div>

      <p
        aria-live="polite"
        className="piece border-ink mt-4 mb-1 border-2 bg-white px-3 py-2 text-sm leading-snug"
      >
        <span className="text-print mr-1 text-xl">{ROW_LABELS[row]}</span>{" "}
        {LANES[row].pays(`${ladder[0]}`, `${ladder[SLOTS]}`)}
      </p>
    </div>
  );
}
