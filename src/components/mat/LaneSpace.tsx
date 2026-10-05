import type { ButtonHTMLAttributes, ReactNode } from "react";

import { PixelIcon } from "~/components/PixelIcon";
import { plural } from "~/components/run/describe";
import { ROW_ICONS } from "~/components/sprites/icons";
import { KeyHint } from "~/components/ui/table";
import { ROW_LABELS, type Row } from "~/server/game/cats";

import { LANES } from "./lanes";

const INK = "#17212b";
const LIME = "#d8ff4f";
const WHITE = "#ffffff";
const COBALT = "#1557d8";

/** As many unit icons as this are drawn out; past it the reward is a numeral. */
const MAX_MARKS = 4;

export interface LaneTileProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  row: Row;
  /** Lime and pressed in: the lane being activated, or the one picked. */
  on: boolean;
  /** What activating gives now: "Take 2 dice". */
  gives: string;
  /** A line under that, for a mat with room: where the reward comes from. */
  sub?: string;
  /** A second line, such as what the lane's open trade would make it give. */
  note?: string | null;
  /** The key that does the same, shown where there is a keyboard. */
  hint?: string;
  /** A tile that only says what its lane is, and cannot be pressed. */
  still?: boolean;
}

/**
 * A lane's own tile, at the head of its row: the lane's mark and name in
 * print, and what activating it gives. Cobalt at rest, lime while it is the
 * lane in play.
 */
export function LaneTile({
  row,
  on,
  gives,
  sub,
  note,
  hint,
  still = false,
  className = "",
  ...props
}: LaneTileProps) {
  const face = (
    <>
      <PixelIcon
        name={ROW_ICONS[row]}
        size={24}
        fill={on ? WHITE : LIME}
        ink={on ? INK : row === "hunt" ? WHITE : INK}
      />
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-print text-xl">{ROW_LABELS[row]}</span>
        <span className="text-xs leading-none font-bold">{gives}</span>
        {sub ? (
          <span className="lane-sub text-[11px] leading-[1.1] font-semibold">
            {sub}
          </span>
        ) : null}
        {note ? (
          <span className="lane-note text-[11px] leading-none font-bold">
            {note}
          </span>
        ) : null}
      </span>
      {hint ? (
        <KeyHint className="absolute -top-1.5 -right-1.5">{hint}</KeyHint>
      ) : null}
    </>
  );
  const dress = `lane-tile piece border-ink relative flex items-center gap-2.5 border-2 px-2.5 py-1.5 text-left ${on ? "bg-lime text-ink is-pressed" : "bg-cobalt text-white"} ${className}`;
  if (still) return <div className={dress}>{face}</div>;
  return (
    <button
      type="button"
      {...props}
      className={`${dress} disabled:cursor-not-allowed ${on ? "" : "hover:bg-cobalt-dark"}`}
    >
      {face}
    </button>
  );
}

/**
 * The mat's banner under a lane's tile: what happens after the lane pays.
 * It is for the eye; the lane's end says the same thing aloud.
 */
export function LaneBanner() {
  return (
    <p
      aria-hidden
      className="lane-banner bg-ink text-cream flex items-center px-1.5 py-1 text-[11px] leading-[1.15] font-bold"
    >
      Then fire this row&rsquo;s powers, right to left
    </p>
  );
}

/**
 * One step of a lane's reward ladder: what the lane gives while it holds
 * `cats` cats. Up to four it is drawn out, one icon for each; past four, or
 * in a space too narrow for that, it is a numeral and one icon on a plate.
 * The step the lane is on is on a lime plate. Only the sentence is read out.
 */
export function RewardMarks({
  row,
  cats,
  reward,
  here,
  className = "",
}: {
  row: Row;
  cats: number;
  reward: number;
  /** The lane holds exactly this many cats now. */
  here: boolean;
  className?: string;
}) {
  const lane = LANES[row];
  const drawn = reward <= MAX_MARKS;
  const plate = here ? "border-ink bg-lime" : "border-cream bg-cream";
  return (
    <span className={`text-ink flex items-center justify-center ${className}`}>
      {drawn ? (
        <span
          aria-hidden
          className={`reward-drawn h-6 items-center gap-px border-2 px-0.5 ${here ? "border-ink bg-lime" : "border-transparent"}`}
        >
          {Array.from({ length: reward }, (_, i) => (
            <PixelIcon key={i} name={lane.unit} size={16} />
          ))}
        </span>
      ) : null}
      <span
        aria-hidden
        className={`text-pixel reward-numeral flex h-6 items-center gap-0.5 border-2 px-0.5 text-sm leading-none tabular-nums ${plate}`}
      >
        {reward}
        <PixelIcon name={lane.unit} size={16} />
      </span>
      <span className="sr-only">
        With {plural(cats, "cat")} here the lane gives{" "}
        {reward === 1 ? `1 ${lane.one}` : `${reward} ${lane.many}`}
        {here ? ", which is where it is now" : ""}.
      </span>
    </span>
  );
}

/**
 * The mark of a trade spot, printed in the two spaces that have one: while
 * that space is the next one, activating the lane may also buy one more.
 * What is paid, an arrow, what it buys. The plate is dashed while the trade
 * is only printed there, and solid lime once it can be made.
 */
export function TradeMark({ row, open }: { row: Row; open: boolean }) {
  const { trade } = LANES[row];
  return (
    <span
      title={`Trade spot: ${trade.text}.`}
      className={`trade-mark text-pixel text-ink border-ink flex h-6 items-center gap-px border-2 px-0.5 text-sm leading-none ${open ? "bg-lime" : "bg-cream border-dashed"}`}
    >
      <span aria-hidden className="trade-full flex items-center gap-px">
        <PixelIcon name={trade.pay} size={16} />
        <PixelIcon name="arrow" size={16} />
      </span>
      <span aria-hidden className="trade-short">
        +1
      </span>
      <PixelIcon name={trade.gain} size={16} />
      <span className="sr-only">
        A trade spot: with this space next, you may {trade.text}
        {open ? ", which you can do now" : ""}.
      </span>
    </span>
  );
}

/**
 * An empty space of a lane: an outline with the lane's scenery showing
 * through it. It prints the lane's mark, the reward the lane gives while
 * this space is the next one, and the trade if it has one. What a cat costs
 * here is on the tab over the column, and is still read out here. The next
 * free space is dashed, on a light wash.
 */
export function EmptySpace({
  row,
  col,
  cost,
  reward,
  next,
  trade = false,
  tradeOpen = false,
  slot,
}: {
  row: Row;
  col: number;
  /** Yarn a cat costs here, for the sentence that is read out. */
  cost: number;
  reward: number;
  /** The lane's next free space. */
  next: boolean;
  /** The space has a trade spot. */
  trade?: boolean;
  /** And the trade can be made now. */
  tradeOpen?: boolean;
  /** Marks the space for whatever lands pieces on it. */
  slot?: string;
}) {
  return (
    <li
      data-slot={slot}
      className={`mat-space mat-empty @container ${next ? "is-next" : ""}`}
    >
      <div className="mat-empty-body">
        <span className="sr-only">
          Empty space {col + 1}.{" "}
          {cost === 0
            ? "A cat costs no yarn here."
            : `A cat costs ${plural(cost, "yarn", "yarn")} here.`}{" "}
        </span>
        <span aria-hidden className="mat-mark bg-cream p-0.5">
          <PixelIcon name={ROW_ICONS[row]} size={16} fill={LIME} />
        </span>
        <RewardMarks row={row} cats={col} reward={reward} here={next} />
        {trade ? <TradeMark row={row} open={next && tradeOpen} /> : null}
      </div>
    </li>
  );
}

/**
 * The end of a lane, a narrow strip at its right edge: the way the powers
 * fire, and what the lane gives once it is full, stood on end.
 */
export function LaneEnd({
  row,
  cats,
  reward,
  here,
}: {
  row: Row;
  /** Cats in a full lane. */
  cats: number;
  reward: number;
  /** The lane is full now. */
  here: boolean;
}) {
  const lane = LANES[row];
  return (
    <p className="mat-end text-ink">
      <span
        className={`flex flex-col items-center gap-0.5 border-2 py-1 ${here ? "border-ink bg-lime" : "border-cream bg-cream"}`}
      >
        <PixelIcon name="chevron" size={16} ink={COBALT} className="end-way" />
        <span
          aria-hidden
          className="end-full text-[11px] leading-none font-bold"
        >
          Full
        </span>
        <span
          aria-hidden
          className="text-pixel text-sm leading-none tabular-nums"
        >
          {reward}
        </span>
        <PixelIcon name={lane.unit} size={16} />
      </span>
      <span className="sr-only">
        Powers fire from right to left. With {plural(cats, "cat")} here the lane
        gives {reward === 1 ? `1 ${lane.one}` : `${reward} ${lane.many}`}
        {here ? ", which is where it is now" : ""}.
      </span>
    </p>
  );
}

/** The head of a lane: its tile, and the banner under it or beside it. */
export function LaneLabel({ children }: { children: ReactNode }) {
  return <div className="mat-label lane-label">{children}</div>;
}
