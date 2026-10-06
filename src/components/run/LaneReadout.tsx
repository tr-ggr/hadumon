import { PixelSprite } from "~/components/PixelSprite";
import {
  describePower,
  getCat,
  ROW_LABELS,
  type Row,
} from "~/server/game/cats";
import type { MatchView } from "~/server/game/view";

import { firingOrder } from "./turn";

/**
 * What an activated power does, without the words that say when: in a list
 * of what a lane fires, every line is "when activated".
 */
export function firesText(catId: string): string {
  const power = getCat(catId).power;
  if (!power) return "";
  const text = describePower(power).replace(/^[^:]+:\s*/, "");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** The number a cat fires at, as the mark its tile on the mat carries too. */
export function FireMark({
  n,
  className = "",
}: {
  n: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`fire-mark bg-ink text-cream text-pixel inline-grid h-4 min-w-4 shrink-0 place-items-center px-0.5 text-xs leading-none tabular-nums ${className}`}
    >
      {n}
    </span>
  );
}

export interface LaneReadoutProps {
  match: MatchView;
  /** The lane being chosen. */
  row: Row;
  /**
   * `panel` stands where the log does, beside the table. `line` is the same
   * in the bar over the mat, two lines at most. `list` is set under the
   * prompt, where the table has neither.
   */
  variant: "panel" | "line" | "list";
  className?: string;
}

/**
 * What activating a lane will fire, in the order it fires: right to left,
 * each cat with the number its tile carries and its power in words. It is up
 * while the lane is being chosen, which is when the chain is being weighed,
 * so no card has to be opened to read it.
 */
export function LaneReadout({
  match,
  row,
  variant,
  className = "",
}: LaneReadoutProps) {
  const order = firingOrder(match.board, row);
  const lane = ROW_LABELS[row];
  const label = `What the ${lane} fires, in order`;
  const none = `No cat in the ${lane} has a power to fire.`;

  if (variant === "line") {
    const said = order
      .map(
        ({ catId }, i) =>
          `${i + 1}. ${getCat(catId).name}: ${firesText(catId)}`,
      )
      .join(" ");
    return (
      <p
        aria-label={label}
        title={order.length > 0 ? said : undefined}
        className={`text-ink line-clamp-2 min-w-0 text-xs leading-[1.15] font-semibold ${className}`}
      >
        {order.length === 0
          ? none
          : order.map(({ col, catId }, i) => (
              <span key={col} className="mr-2">
                <FireMark n={i + 1} className="mr-1 align-[-3px]" />
                <span className="font-black">{getCat(catId).name}</span>{" "}
                {firesText(catId)}
              </span>
            ))}
      </p>
    );
  }

  const list =
    order.length === 0 ? (
      <p className="text-ink-soft text-xs leading-snug">{none}</p>
    ) : (
      <ol className={variant === "panel" ? "space-y-2" : "space-y-1"}>
        {order.map(({ col, catId }, i) => (
          <li key={col} className="flex items-start gap-1.5">
            <FireMark n={i + 1} className="mt-px" />
            {variant === "panel" ? (
              <PixelSprite
                catId={catId}
                size={32}
                decorative
                className="-my-1 h-8 w-8 shrink-0"
              />
            ) : null}
            <p className="min-w-0 text-xs leading-snug">
              <span className="font-black">{getCat(catId).name}</span>{" "}
              {firesText(catId)}
            </p>
          </li>
        ))}
      </ol>
    );

  if (variant === "list") {
    return (
      <section aria-label={label} className={`text-ink ${className}`}>
        {list}
      </section>
    );
  }

  return (
    <section
      aria-label={label}
      className={`piece border-ink text-ink flex min-h-0 flex-col border-2 bg-white ${className}`}
    >
      <h2 className="text-print border-ink/15 border-b px-2.5 py-1 text-xl">
        {lane} fires
      </h2>
      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-2">{list}</div>
    </section>
  );
}
