"use client";

import { ElementMark } from "~/components/cats/CatCard";
import { PixelIcon } from "~/components/PixelIcon";
import { PixelSprite } from "~/components/PixelSprite";
import { ROW_ICONS, type IconName } from "~/components/sprites/icons";
import { ELEMENT_PALETTES } from "~/components/sprites/palettes";
import { getCat, ROW_LABELS, type Row } from "~/server/game/cats";
import { ELEMENT_LABELS } from "~/server/game/elements";
import {
  columnYarnCost,
  ROW_REWARD,
  SLOTS,
  TRADE_CATS,
  type PlacedCat,
  type SlotRef,
} from "~/server/game/match";
import type { MatchView } from "~/server/game/view";

import { plural, yarnCostLabel } from "./describe";
import {
  COBALT,
  INK,
  KeyHint,
  LIME,
  SpaceCost,
  WHITE,
  YarnTrack,
} from "./pieces";
import { denLimit, queuedYarn, swapOwed, yarnRoom, type Mode } from "./turn";

/** The thing a lane's reward is counted in, and the lane's key. */
const LANES: Record<
  Row,
  { unit: IconName; one: string; many: string; key: string; trade: string }
> = {
  hunt: {
    unit: "die",
    one: "die",
    many: "dice",
    key: "H",
    trade: "discard 1 cat from your hand for 1 more die",
  },
  den: {
    unit: "yarn",
    one: "yarn",
    many: "yarn",
    key: "D",
    trade: "spend 1 food for 1 more yarn",
  },
  prowl: {
    unit: "card",
    one: "cat",
    many: "cats",
    key: "P",
    trade: "spend 1 yarn from a cat for 1 more cat",
  },
};

/**
 * What activating the lane gives with 0 to 4 cats in it: the engine's ladder
 * plus whatever the run's relics add right now.
 */
function rewardLadder(match: MatchView, row: Row): number[] {
  const ladder = ROW_REWARD[row];
  const bonus = match.rewards[row] - (ladder[match.board[row].length] ?? 0);
  return ladder.map((base) => base + bonus);
}

export interface BoardRowProps {
  row: Row;
  match: MatchView;
  mode: Mode;
  busy: boolean;
  /** What the activate control says, e.g. "Take 2 dice". */
  activateLabel: string;
  /** The slot whose power is firing right now, if it is in this lane. */
  firing: SlotRef | null;
  /** True while this lane's activation is being played back. */
  resolving: boolean;
  onActivate: () => void;
  /** Plays the selected hand card here. */
  onPlayHere: () => void;
  /** A placed cat was tapped: lay yarn during a Den, otherwise open its card. */
  onSlot: (slot: SlotRef) => void;
}

/**
 * One lane printed on the mat: its name and activate tile, and four spaces.
 * An empty space prints two separate things, each under its own label: the
 * yarn it costs to seat a cat there, and the step of the reward ladder the
 * row gives while that space is the next one, with a marker on the step the
 * lane is on. Beside the rail a lane takes its share of the mat's spare
 * height.
 */
export function BoardRow({
  row,
  match,
  mode,
  busy,
  activateLabel,
  firing,
  resolving,
  onActivate,
  onPlayHere,
  onSlot,
}: BoardRowProps) {
  const line = match.board[row];
  const lane = LANES[row];
  const nextCost = match.yarnCosts[row];
  // A play that is short is not ready for a lane until its swap is chosen.
  const isTarget =
    mode.kind === "play" &&
    (match.playable[mode.hand] ?? []).includes(row) &&
    mode.swap.length === swapOwed(match, mode.hand);
  const activating = mode.kind === row || resolving;
  const denTargets = mode.kind === "den" ? mode.targets : null;
  const denFull =
    denTargets !== null && denTargets.length >= denLimit(match, mode);
  // A Prowl with its trade open is paid for with a yarn from a cat on the mat.
  const paying = mode.kind === "prowl" && match.trades.prowl ? mode : null;
  const ladder = rewardLadder(match, row);

  return (
    <section
      aria-label={`${ROW_LABELS[row]} lane`}
      data-lane={row}
      className="grid gap-x-3 gap-y-3 px-2 pt-2 pb-3.5 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:px-3 xl:flex-1"
    >
      <h3 className="sr-only">{ROW_LABELS[row]}</h3>
      <button
        type="button"
        aria-pressed={activating}
        aria-label={`${ROW_LABELS[row]}: ${activateLabel}`}
        disabled={busy || match.phase !== "turn"}
        onClick={onActivate}
        className={`piece border-ink relative flex min-h-12 items-center gap-2.5 self-start border-2 px-2.5 py-1.5 text-left disabled:cursor-not-allowed sm:min-h-[3.75rem] sm:self-stretch lg:min-h-20 ${resolving ? "" : "disabled:opacity-55"} ${activating ? "bg-lime text-ink is-pressed" : "bg-cobalt hover:bg-cobalt-dark text-white"}`}
      >
        <PixelIcon
          name={ROW_ICONS[row]}
          size={24}
          fill={activating ? WHITE : LIME}
          ink={activating ? INK : row === "hunt" ? WHITE : INK}
        />
        <span className="flex min-w-0 flex-col gap-1">
          <span className="text-print text-xl">{ROW_LABELS[row]}</span>
          <span className="text-xs leading-none font-bold">
            {activateLabel}
          </span>
          {match.trades[row] && !activating ? (
            <span className="text-[11px] leading-none font-bold">
              or {match.rewards[row] + 1} by trade
            </span>
          ) : null}
        </span>
        <KeyHint className="absolute -top-1.5 -right-1.5">{lane.key}</KeyHint>
      </button>

      <div className="grid min-w-0 grid-cols-[repeat(4,minmax(0,1fr))_1.75rem] gap-x-1.5 sm:grid-cols-[repeat(4,minmax(0,1fr))_2.75rem]">
        <ol className="contents">
          {Array.from({ length: SLOTS }, (_, col) => {
            const placed = line[col];
            if (placed) {
              const slot = { row, col };
              return (
                <li key={col} className="@container min-w-0">
                  <PlacedSlot
                    slot={slot}
                    placed={placed}
                    queued={
                      denTargets
                        ? queuedYarn(denTargets, slot)
                        : paying?.trade?.row === row && paying.trade.col === col
                          ? -1
                          : 0
                    }
                    laying={denTargets !== null}
                    paying={paying !== null}
                    disabled={
                      denTargets !== null
                        ? busy ||
                          denFull ||
                          yarnRoom(match.board, denTargets, slot) <= 0
                        : paying !== null && (busy || placed.yarn <= 0)
                    }
                    waiting={
                      match.pending?.slot.row === row &&
                      match.pending?.slot.col === col
                    }
                    firing={firing?.row === row && firing.col === col}
                    onClick={() => onSlot(slot)}
                  />
                </li>
              );
            }
            const next = col === line.length;
            if (next && isTarget) {
              return (
                <li key={col} className="min-w-0">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={onPlayHere}
                    className="piece border-ink bg-lime text-ink relative flex h-full min-h-24 w-full flex-col items-center justify-center gap-1 border-2 p-1 text-center text-xs leading-tight font-black hover:brightness-95 disabled:opacity-60 sm:min-h-[3.75rem] lg:min-h-20"
                  >
                    <span>Play here</span>
                    <span className="text-[11px] font-bold">
                      {nextCost
                        ? `Cat costs ${yarnCostLabel(nextCost)}`
                        : yarnCostLabel(0)}
                    </span>
                    <KeyHint className="absolute top-1 right-1">
                      {lane.key}
                    </KeyHint>
                  </button>
                </li>
              );
            }
            const cost = columnYarnCost(match.mods, col);
            return (
              // The space lays out by its own width. On a phone each label
              // stands over its value; from 640px they are two rows, which
              // say "now" or "here" from 7rem and are worded in full from
              // 8.5rem; a space 12rem wide sets the two parts side by side.
              <li
                key={col}
                data-slot={`${row}-${col}`}
                className={`text-ink @container flex min-h-24 min-w-0 border-2 text-[11px] leading-none font-bold sm:min-h-[3.75rem] lg:min-h-20 ${next ? "border-ink/55 border-dashed bg-white/45" : "border-sky-deep"}`}
              >
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-1 sm:gap-0.5 @[12rem]:flex-row @[12rem]:items-center @[12rem]:justify-center @[12rem]:gap-2.5">
                  <span className="sr-only">Empty space {col + 1}. </span>
                  <SpaceCost cost={cost} compact className={SPACE_PART} />
                  <span
                    className={`border-ink/20 border-t pt-1 sm:pt-0.5 @[12rem]:border-t-0 @[12rem]:border-l @[12rem]:pt-0 @[12rem]:pl-2.5 ${SPACE_PART}`}
                  >
                    <span className="font-semibold" aria-hidden>
                      Row<span className="@max-[8.5rem]:hidden"> gives</span>
                      {/* A trade mark takes the room the last word had. */}
                      <span
                        className={
                          TRADE_CATS.includes(col)
                            ? "sm:@max-[10.5rem]:hidden"
                            : "sm:@max-[7rem]:hidden"
                        }
                      >
                        {next ? " now" : " here"}
                      </span>
                    </span>
                    <span className="flex items-center gap-0.5">
                      <RewardStep
                        lane={lane}
                        cats={col}
                        reward={ladder[col] ?? 0}
                        here={next}
                      />
                      {TRADE_CATS.includes(col) ? (
                        <TradeMark
                          lane={lane}
                          open={next && match.trades[row]}
                        />
                      ) : null}
                    </span>
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="flex flex-col items-center justify-center gap-1.5">
          <PixelIcon name="chevron" size={16} ink={COBALT} />
          <span className="sr-only">Powers fire from right to left.</span>
          <span className="flex flex-col items-center gap-0.5 text-[11px] leading-none font-semibold">
            <span aria-hidden>Full</span>
            <RewardStep
              lane={lane}
              cats={SLOTS}
              reward={ladder[SLOTS] ?? 0}
              here={line.length === SLOTS}
              className="max-sm:h-auto max-sm:flex-col max-sm:py-0.5"
            />
          </span>
        </p>
      </div>
    </section>
  );
}

/**
 * One part of an empty space, the cost or the reward: on a phone and in a
 * wide space the label stands over its value, between those they share a row.
 */
const SPACE_PART =
  "flex items-center flex-col justify-center gap-0.5 sm:flex-row sm:justify-between sm:gap-1 @[12rem]:flex-col @[12rem]:justify-center @[12rem]:gap-1";

/**
 * One step of a lane's reward ladder, printed in the space that is next when
 * the lane holds `cats` cats. The step the lane is on carries a lime marker.
 * The sentence it carries is the one read out; the label printed beside it
 * is for the eye.
 */
function RewardStep({
  lane,
  cats,
  reward,
  here,
  className = "",
}: {
  lane: (typeof LANES)[Row];
  cats: number;
  reward: number;
  here: boolean;
  className?: string;
}) {
  return (
    <span
      className={`text-pixel flex h-6 items-center gap-0.5 border-2 px-0.5 text-sm leading-none tabular-nums ${here ? "border-ink bg-lime" : "border-transparent"} ${className}`}
    >
      <span aria-hidden>{reward}</span>
      <PixelIcon name={lane.unit} size={16} />
      <span className="sr-only">
        With {plural(cats, "cat")} here the lane gives{" "}
        {reward === 1 ? `1 ${lane.one}` : `${reward} ${lane.many}`}
        {here ? ", which is where it is now" : ""}.
      </span>
    </span>
  );
}

/**
 * The mark of a trade spot, printed beside the reward of the two spaces that
 * have one: while that space is the next one, activating the lane may also
 * buy one more. It is dashed while the trade is only printed there, and
 * solid lime once it can be made.
 */
function TradeMark({
  lane,
  open,
}: {
  lane: (typeof LANES)[Row];
  open: boolean;
}) {
  return (
    <span
      title={`Trade spot: ${lane.trade}.`}
      className={`text-pixel border-ink flex h-6 items-center border px-0.5 text-sm leading-none ${open ? "bg-lime" : "border-dashed"}`}
    >
      <span aria-hidden>+1</span>
      <span className="sr-only">
        A trade spot: with this space next, you may {lane.trade}
        {open ? ", which you can do now" : ""}.
      </span>
    </span>
  );
}

/**
 * A cat in its space. The tile answers to its own width: the sprite stands
 * over the name until there is room to set them side by side, so a name is
 * never cut short.
 */
function PlacedSlot({
  slot,
  placed,
  queued,
  laying,
  paying,
  disabled,
  waiting,
  firing,
  onClick,
}: {
  slot: SlotRef;
  placed: PlacedCat;
  /**
   * Yarn chosen for this cat in a Den that has not been sent, or -1 for the
   * yarn it gives up to a Prowl's trade.
   */
  queued: number;
  laying: boolean;
  /** A Prowl's trade is open and this cat's yarn could pay for it. */
  paying: boolean;
  disabled: boolean;
  waiting: boolean;
  firing: boolean;
  onClick: () => void;
}) {
  const cat = getCat(placed.catId);
  const yarn = placed.yarn + Math.max(queued, 0);
  return (
    <button
      type="button"
      data-slot={`${slot.row}-${slot.col}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={
        laying
          ? `Lay yarn on ${cat.name}, holding ${yarn} of ${cat.yarnCap}`
          : paying
            ? `Spend 1 yarn from ${cat.name} for 1 more cat, holding ${placed.yarn}`
            : `${cat.name}, ${ELEMENT_LABELS[cat.element]}, details${placed.tucked > 0 ? `, ${plural(placed.tucked, "cat")} tucked under it` : ""}`
      }
      // Cats tucked underneath show as a thicker edge. The left edge is the
      // cat's element, as on its card.
      style={{
        ["--e" as string]: `${2 + 2 * Math.min(placed.tucked, 2)}px`,
        ["--element" as string]: ELEMENT_PALETTES[cat.element]["1"],
      }}
      className={`piece cat-tile border-ink bg-cream text-ink hover:bg-sky-soft disabled:hover:bg-cream relative flex h-full min-h-24 w-full flex-col items-center justify-center gap-1 border-2 px-0 py-1 text-center disabled:cursor-not-allowed sm:min-h-[3.75rem] lg:min-h-20 @[10.5rem]:flex-row @[10.5rem]:justify-start @[10.5rem]:gap-2 @[10.5rem]:px-1.5 @[10.5rem]:text-left ${waiting ? "is-due" : queued < 0 ? "is-chosen" : (laying || paying) && !disabled ? "is-open" : ""} ${firing ? "is-firing" : ""}`}
    >
      <span className="relative shrink-0">
        <PixelSprite
          catId={placed.catId}
          size={48}
          decorative
          className="h-10 w-10 sm:h-12 sm:w-12"
        />
        {/* What the cat holds besides yarn sits on its corner as a tag, so
            the name and the yarn keep a row each. */}
        {placed.cached > 0 || placed.tucked > 0 ? (
          <span className="border-ink absolute -bottom-0.5 -left-0.5 flex items-center gap-1 border bg-white pr-0.5 text-[11px] leading-none font-bold tabular-nums">
            {placed.cached > 0 ? (
              <span className="flex items-center">
                <PixelIcon name="cached" size={16} fill={LIME} />
                <span aria-hidden>{placed.cached}</span>
                <span className="sr-only">Cached {placed.cached}</span>
              </span>
            ) : null}
            {placed.tucked > 0 ? (
              <span className="flex items-center">
                <PixelIcon name="tucked" size={16} fill={LIME} />
                <span aria-hidden>{placed.tucked}</span>
                <span className="sr-only">Tucked {placed.tucked}</span>
              </span>
            ) : null}
          </span>
        ) : null}
      </span>
      {/* The element stands in the tile's own corner, clear of the sprite.
          A narrow tile has no room for that, so the mark carries a rim of
          the tile's cream: over an ear it would read as part of the cat. */}
      <span className="mark-rim absolute top-0.5 left-1 flex sm:top-1.5 sm:left-1.5">
        <ElementMark element={cat.element} />
      </span>
      <span className="flex w-full min-w-0 flex-col items-center gap-1 @[10.5rem]:items-start">
        <span
          lang="en"
          className="w-full text-[10px] leading-tight font-black tracking-tighter [overflow-wrap:anywhere] sm:text-[11px] sm:tracking-tight"
        >
          {cat.name}
        </span>
        <YarnTrack
          held={placed.yarn + Math.min(queued, 0)}
          queued={Math.max(queued, 0)}
          cap={cat.yarnCap}
          size={16}
          className="justify-center @[10.5rem]:justify-start"
        />
      </span>
    </button>
  );
}
