import { PixelIcon } from "~/components/PixelIcon";
import { plural } from "~/components/run/describe";

/**
 * The strip along the top of a mat: what playing a cat costs. The food is on
 * the cat's own card; the yarn is here, on a tab over each column, so no
 * space has to print it. The strip is a row of the mat's own grid, so a tab
 * stands exactly over its column at every size.
 */
export function MatHeader({
  costs,
}: {
  /** Yarn a cat costs in each column, left to right. */
  costs: readonly number[];
}) {
  return (
    <div className="mat-header text-ink">
      <div className="mat-label flex flex-col justify-center gap-0.5 py-1">
        <p className="text-print text-xl">Play a cat</p>
        <p className="mat-note text-[11px] leading-tight font-semibold">
          Pay its food, plus the yarn over its column.
        </p>
      </div>
      <ol className="contents">
        {costs.map((cost, col) => (
          <li key={col} data-cost={col} className="mat-tab">
            <span className="border-ink bg-cream flex h-6 min-w-10 items-center justify-center gap-px border-2 border-b-0 px-1.5 text-[11px] leading-none font-bold">
              {cost === 0 ? (
                <span aria-hidden>Free</span>
              ) : (
                Array.from({ length: cost }, (_, i) => (
                  <PixelIcon key={i} name="yarn" size={16} />
                ))
              )}
              <span className="sr-only">
                Column {col + 1}:{" "}
                {cost === 0 ? "free" : `costs ${plural(cost, "yarn", "yarn")}`}.
              </span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
