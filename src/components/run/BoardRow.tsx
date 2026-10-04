"use client";

import { PixelIcon } from "~/components/PixelIcon";
import { PixelSprite } from "~/components/PixelSprite";
import type { IconName } from "~/components/sprites/icons";
import { getCat, ROW_LABELS, type Row } from "~/server/game/cats";
import {
  columnYarnCost,
  ROW_REWARD,
  SLOTS,
  type PlacedCat,
  type SlotRef,
} from "~/server/game/match";
import type { MatchView } from "~/server/game/view";

import { plural } from "./describe";
import { COBALT, INK, KeyHint, LIME, WHITE, YarnTrack } from "./pieces";
import { queuedYarn, yarnRoom, type Mode } from "./turn";

export function yarnCostLabel(cost: number): string {
  return cost === 0 ? "Free" : `${cost} yarn`;
}

/** The lane's own icon, the thing its reward is counted in, and its key. */
const LANES: Record<
  Row,
  { icon: IconName; unit: IconName; one: string; many: string; key: string }
> = {
  hunt: { icon: "paw", unit: "die", one: "die", many: "dice", key: "H" },
  den: { icon: "den", unit: "yarn", one: "yarn", many: "yarn", key: "D" },
  prowl: { icon: "card", unit: "card", one: "cat", many: "cats", key: "P" },
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
 * One lane printed on the mat: its name and activate tile, four spaces with
 * their yarn cost, and under them the reward ladder with a marker on the
 * step the lane is on.
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
  const isTarget =
    mode.kind === "play" && (match.playable[mode.hand] ?? []).includes(row);
  const activating = mode.kind === row || resolving;
  const denTargets = mode.kind === "den" ? mode.targets : null;
  const denFull = denTargets !== null && denTargets.length >= match.rewards.den;
  const ladder = rewardLadder(match, row);

  return (
    <section
      aria-label={`${ROW_LABELS[row]} lane`}
      data-lane={row}
      className="grid gap-x-3 gap-y-3 px-2 pt-2 pb-3.5 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:px-3"
    >
      <h3 className="sr-only">{ROW_LABELS[row]}</h3>
      <button
        type="button"
        aria-pressed={activating}
        aria-label={`${ROW_LABELS[row]}: ${activateLabel}`}
        disabled={busy || match.phase !== "turn"}
        onClick={onActivate}
        className={`piece border-ink relative flex min-h-12 items-center gap-2.5 self-start border-2 px-2.5 py-1.5 text-left disabled:cursor-not-allowed sm:min-h-[3.75rem] sm:self-stretch ${resolving ? "" : "disabled:opacity-55"} ${activating ? "bg-lime text-ink is-pressed" : "bg-cobalt hover:bg-cobalt-dark text-white"}`}
      >
        <PixelIcon
          name={lane.icon}
          size={24}
          fill={activating ? WHITE : LIME}
          ink={activating ? INK : row === "hunt" ? WHITE : INK}
        />
        <span className="flex min-w-0 flex-col gap-1">
          <span className="text-print text-xl">{ROW_LABELS[row]}</span>
          <span className="text-xs leading-none font-bold">
            {activateLabel}
          </span>
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
                <li key={col} className="min-w-0">
                  <PlacedSlot
                    slot={slot}
                    placed={placed}
                    queued={denTargets ? queuedYarn(denTargets, slot) : 0}
                    laying={denTargets !== null}
                    disabled={
                      denTargets !== null &&
                      (busy ||
                        denFull ||
                        yarnRoom(match.board, denTargets, slot) <= 0)
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
                    className="piece border-ink bg-lime text-ink relative flex h-full min-h-24 w-full flex-col items-center justify-center gap-1 border-2 p-1 text-center text-xs leading-tight font-black hover:brightness-95 disabled:opacity-60 sm:min-h-[3.75rem]"
                  >
                    <span>Play here</span>
                    <span className="text-[11px] font-bold">
                      {yarnCostLabel(nextCost ?? 0)}
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
              <li
                key={col}
                data-slot={`${row}-${col}`}
                className={`text-ink flex min-h-24 flex-col items-center justify-center gap-1.5 border-2 p-1 text-center text-[11px] leading-tight font-bold sm:min-h-[3.75rem] sm:flex-row sm:justify-between sm:px-2 ${next ? "border-ink/55 border-dashed bg-white/45" : "border-sky-deep"}`}
              >
                <span className="sr-only">Empty space {col + 1}, costs </span>
                {cost === 0 ? (
                  "Free"
                ) : (
                  <span className="flex items-center gap-1">
                    <span className="flex gap-px" aria-hidden>
                      {Array.from({ length: cost }, (_, i) => (
                        <PixelIcon key={i} name="yarn" size={16} />
                      ))}
                    </span>
                    <span className="max-sm:sr-only">
                      {yarnCostLabel(cost)}
                    </span>
                  </span>
                )}
                <RewardStep
                  lane={lane}
                  cats={col}
                  reward={ladder[col] ?? 0}
                  here={next}
                />
              </li>
            );
          })}
        </ol>
        <p className="flex flex-col items-center justify-center gap-1.5">
          <PixelIcon name="chevron" size={16} ink={COBALT} />
          <span className="sr-only">Powers fire from right to left.</span>
          <RewardStep
            lane={lane}
            cats={SLOTS}
            reward={ladder[SLOTS] ?? 0}
            here={line.length === SLOTS}
            className="max-sm:h-auto max-sm:flex-col max-sm:py-0.5"
          />
        </p>
      </div>
    </section>
  );
}

/**
 * One step of a lane's reward ladder, printed in the space that is next when
 * the lane holds `cats` cats. The step the lane is on carries a lime marker.
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
      className={`text-pixel flex h-6 items-center gap-0.5 border-2 px-0.5 text-sm leading-none tabular-nums sm:px-1 ${here ? "border-ink bg-lime" : "border-transparent"} ${className}`}
    >
      <span aria-hidden>{reward}</span>
      <PixelIcon name={lane.unit} size={16} />
      <span className="sr-only">
        . With {plural(cats, "cat")} here the lane gives{" "}
        {reward === 1 ? `1 ${lane.one}` : `${reward} ${lane.many}`}
        {here ? ", which is where it is now" : ""}.
      </span>
    </span>
  );
}

function PlacedSlot({
  slot,
  placed,
  queued,
  laying,
  disabled,
  waiting,
  firing,
  onClick,
}: {
  slot: SlotRef;
  placed: PlacedCat;
  /** Yarn chosen for this cat in a Den that has not been sent. */
  queued: number;
  laying: boolean;
  disabled: boolean;
  waiting: boolean;
  firing: boolean;
  onClick: () => void;
}) {
  const cat = getCat(placed.catId);
  const yarn = placed.yarn + queued;
  return (
    <button
      type="button"
      data-slot={`${slot.row}-${slot.col}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={
        laying
          ? `Lay yarn on ${cat.name}, holding ${yarn} of ${cat.yarnCap}`
          : `${cat.name} details`
      }
      // Cats tucked underneath show as a thicker edge.
      style={{ ["--e" as string]: `${2 + 2 * Math.min(placed.tucked, 2)}px` }}
      className={`piece border-ink bg-cream text-ink hover:bg-sky-soft disabled:hover:bg-cream flex h-full min-h-24 w-full flex-col items-center gap-1 border-2 px-0 py-1 text-center disabled:cursor-not-allowed sm:min-h-[3.75rem] sm:flex-row sm:gap-2 sm:px-1.5 sm:text-left ${waiting ? "is-due" : laying && !disabled ? "is-open" : ""} ${firing ? "anim-fire" : ""}`}
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
      <span className="flex min-w-0 flex-col items-center gap-1 sm:w-full sm:items-start">
        <span
          lang="en"
          className="w-full text-[10px] leading-tight font-black tracking-tighter [overflow-wrap:anywhere] sm:truncate sm:text-[11px] sm:tracking-tight"
        >
          {cat.name}
        </span>
        <YarnTrack
          held={placed.yarn}
          queued={queued}
          cap={cat.yarnCap}
          size={16}
          className="justify-center sm:justify-start"
        />
      </span>
    </button>
  );
}
