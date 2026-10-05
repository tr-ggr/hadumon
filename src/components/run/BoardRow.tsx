"use client";

import { ElementMark } from "~/components/cats/CatCard";
import {
  EmptySpace,
  LaneBanner,
  LaneEnd,
  LaneLabel,
  LaneTile,
} from "~/components/mat/LaneSpace";
import { LANES, rewardLadder } from "~/components/mat/lanes";
import { laneScene } from "~/components/mat/scene";
import { PixelIcon } from "~/components/PixelIcon";
import { PixelSprite } from "~/components/PixelSprite";
import { ELEMENT_PALETTES } from "~/components/sprites/palettes";
import { getCat, ROW_LABELS, type Row } from "~/server/game/cats";
import { ELEMENT_LABELS } from "~/server/game/elements";
import {
  columnYarnCost,
  SLOTS,
  TRADE_CATS,
  type PlacedCat,
  type SlotRef,
} from "~/server/game/match";
import type { MatchView } from "~/server/game/view";

import { plural, yarnCostLabel } from "./describe";
import { KeyHint, LIME, YarnTrack } from "./pieces";
import { denLimit, queuedYarn, swapOwed, yarnRoom, type Mode } from "./turn";

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
 * One lane printed on the mat, as a row of the mat's grid with its habitat
 * behind it: the lane's tile and the banner in the label column, four spaces,
 * and the lane's end. An empty space prints the step of the reward ladder
 * the lane is on while that space is the next one, and its trade if it has
 * one; what a cat costs there is on the tab over the column. Where the match
 * fits its window, a lane takes its share of the mat's height.
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
      className="lane lane-scene"
      style={laneScene(row)}
    >
      <LaneLabel>
        <h3 className="sr-only">{ROW_LABELS[row]}</h3>
        <LaneTile
          row={row}
          on={activating}
          gives={activateLabel}
          sub={lane.sub}
          note={
            match.trades[row] && !activating
              ? `or ${match.rewards[row] + 1} by trade`
              : null
          }
          hint={lane.key}
          aria-pressed={activating}
          aria-label={`${ROW_LABELS[row]}: ${activateLabel}`}
          disabled={busy || match.phase !== "turn"}
          onClick={onActivate}
          className={resolving ? "" : "disabled:opacity-55"}
        />
        <LaneBanner />
      </LaneLabel>

      <ol className="contents">
        {Array.from({ length: SLOTS }, (_, col) => {
          const placed = line[col];
          if (placed) {
            const slot = { row, col };
            return (
              <li key={col} className="mat-space @container">
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
              <li key={col} className="mat-space @container">
                <button
                  type="button"
                  disabled={busy}
                  onClick={onPlayHere}
                  className="piece border-ink bg-lime text-ink relative flex flex-col items-center justify-center gap-1 border-2 p-1 text-center text-xs leading-tight font-black hover:brightness-95 disabled:opacity-60"
                >
                  <span>Play here</span>
                  <span className="space-cost text-[11px] font-bold">
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
          return (
            <EmptySpace
              key={col}
              row={row}
              col={col}
              slot={`${row}-${col}`}
              cost={columnYarnCost(match.mods, col)}
              reward={ladder[col] ?? 0}
              next={next}
              trade={TRADE_CATS.includes(col)}
              tradeOpen={match.trades[row]}
            />
          );
        })}
      </ol>
      <LaneEnd
        row={row}
        cats={SLOTS}
        reward={ladder[SLOTS] ?? 0}
        here={line.length === SLOTS}
      />
    </section>
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
      className={`piece cat-tile border-ink bg-cream text-ink hover:bg-sky-soft disabled:hover:bg-cream relative flex flex-col items-center justify-center gap-1 border-2 px-0 py-1 text-center disabled:cursor-not-allowed @[10.5rem]:flex-row @[10.5rem]:justify-start @[10.5rem]:gap-2 @[10.5rem]:px-1.5 @[10.5rem]:text-left ${waiting ? "is-due" : queued < 0 ? "is-chosen" : (laying || paying) && !disabled ? "is-open" : ""} ${firing ? "is-firing" : ""}`}
    >
      <span className="relative shrink-0">
        <PixelSprite
          catId={placed.catId}
          size={48}
          decorative
          className="cat-sprite h-10 w-10 sm:h-12 sm:w-12"
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
      <span className="cat-words flex w-full min-w-0 flex-col items-center gap-1 @[10.5rem]:items-start">
        <span
          lang="en"
          className="cat-name w-full text-[10px] leading-tight font-black tracking-tighter [overflow-wrap:anywhere] sm:text-[11px] sm:tracking-tight"
        >
          {cat.name}
        </span>
        <YarnTrack
          held={placed.yarn + Math.min(queued, 0)}
          queued={Math.max(queued, 0)}
          cap={cat.yarnCap}
          size={16}
          className="cat-yarn-track justify-center @[10.5rem]:justify-start"
        />
        {/* The same yarn as a count, for a space too short for the track. */}
        <span
          aria-hidden
          className="cat-yarn-count text-pixel items-center gap-0.5 text-sm leading-none tabular-nums"
        >
          <PixelIcon
            name="yarn"
            size={16}
            fill={yarn > 0 ? LIME : "transparent"}
          />
          {yarn}/{cat.yarnCap}
        </span>
      </span>
    </button>
  );
}
