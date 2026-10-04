"use client";

import { PixelSprite } from "~/components/PixelSprite";
import { Button } from "~/components/ui";
import { getCat, ROW_LABELS, type Row } from "~/server/game/cats";
import {
  columnYarnCost,
  SLOTS,
  type PlacedCat,
  type SlotRef,
} from "~/server/game/match";
import type { MatchView } from "~/server/game/view";

import { queuedYarn, yarnRoom, type Mode } from "./turn";

export function yarnCostLabel(cost: number): string {
  return cost === 0 ? "Free" : `${cost} yarn`;
}

export interface BoardRowProps {
  row: Row;
  match: MatchView;
  mode: Mode;
  busy: boolean;
  /** What the activate control says, e.g. "Take 2 dice". */
  activateLabel: string;
  onActivate: () => void;
  /** Plays the selected hand card here. */
  onPlayHere: () => void;
  /** A placed cat was tapped: lay yarn during a Den, otherwise open its card. */
  onSlot: (slot: SlotRef) => void;
}

/** One habitat row: its activate control and its four slots. */
export function BoardRow({
  row,
  match,
  mode,
  busy,
  activateLabel,
  onActivate,
  onPlayHere,
  onSlot,
}: BoardRowProps) {
  const line = match.board[row];
  const nextCost = match.yarnCosts[row];
  const isTarget =
    mode.kind === "play" && (match.playable[mode.hand] ?? []).includes(row);
  const activating = mode.kind === row;
  const denTargets = mode.kind === "den" ? mode.targets : null;
  const denFull = denTargets !== null && denTargets.length >= match.rewards.den;

  return (
    <section
      aria-label={`${ROW_LABELS[row]} row`}
      className={`border-ink bg-sky-surface flex flex-col gap-2 border-2 p-2 sm:flex-row sm:items-stretch ${isTarget ? "ring-cobalt ring-4" : ""}`}
    >
      <header className="flex items-center justify-between gap-2 sm:w-36 sm:shrink-0 sm:flex-col sm:items-start sm:justify-start">
        <div className="min-w-0">
          <h3 className="text-pixel text-ink text-base leading-tight">
            {ROW_LABELS[row]}
          </h3>
          <p className="text-ink text-[11px] leading-tight font-semibold">
            {nextCost === null
              ? "Full"
              : `Next slot: ${yarnCostLabel(nextCost).toLowerCase()}`}
          </p>
        </div>
        <Button
          size="sm"
          variant={activating ? "hero" : "primary"}
          aria-pressed={activating}
          disabled={busy || match.phase !== "turn"}
          onClick={onActivate}
          className="shrink-0"
        >
          {activateLabel}
        </Button>
      </header>

      <ol className="grid min-w-0 flex-1 grid-cols-4 gap-1.5">
        {Array.from({ length: SLOTS }, (_, col) => {
          const placed = line[col];
          if (placed) {
            const slot = { row, col };
            const waiting =
              match.pending?.slot.row === row &&
              match.pending?.slot.col === col;
            return (
              <li key={col} className="min-w-0">
                <PlacedSlot
                  placed={placed}
                  queued={denTargets ? queuedYarn(denTargets, slot) : 0}
                  laying={denTargets !== null}
                  disabled={
                    denTargets !== null &&
                    (busy ||
                      denFull ||
                      yarnRoom(match.board, denTargets, slot) <= 0)
                  }
                  waiting={waiting}
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
                  className="border-ink bg-lime text-ink flex h-full min-h-24 w-full flex-col items-center justify-center gap-1 border-2 p-1 text-center text-xs leading-tight font-black hover:brightness-95 disabled:opacity-60"
                >
                  <span>Play here</span>
                  <span className="text-[10px] font-bold">
                    {yarnCostLabel(nextCost ?? 0)}
                  </span>
                </button>
              </li>
            );
          }
          return (
            <li
              key={col}
              className={`border-ink/45 text-ink flex min-h-24 flex-col items-center justify-center border-2 border-dashed p-1 text-center text-[10px] leading-tight font-bold ${next ? "bg-white/40" : "opacity-60"}`}
            >
              <span className="sr-only">Empty slot {col + 1}, costs </span>
              {yarnCostLabel(columnYarnCost(match.mods, col))}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function PlacedSlot({
  placed,
  queued,
  laying,
  disabled,
  waiting,
  onClick,
}: {
  placed: PlacedCat;
  /** Yarn chosen for this cat in a Den that has not been sent. */
  queued: number;
  laying: boolean;
  disabled: boolean;
  waiting: boolean;
  onClick: () => void;
}) {
  const cat = getCat(placed.catId);
  const yarn = placed.yarn + queued;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={
        laying
          ? `Lay yarn on ${cat.name}, holding ${yarn} of ${cat.yarnCap}`
          : `${cat.name} details`
      }
      className={`border-ink bg-cream text-ink hover:bg-sky-soft disabled:hover:bg-cream flex h-full min-h-24 w-full flex-col items-center gap-0.5 border-2 p-1 text-center disabled:cursor-not-allowed ${waiting ? "ring-coral ring-4" : ""} ${laying && !disabled ? "ring-cobalt ring-2" : ""}`}
    >
      <PixelSprite
        catId={placed.catId}
        size={56}
        decorative
        className="h-10 w-10 sm:h-14 sm:w-14"
      />
      <span className="w-full truncate text-[10px] leading-tight font-black">
        {cat.name}
      </span>
      <span
        className={`border-ink border px-1 text-[10px] leading-4 font-bold tabular-nums ${queued > 0 ? "bg-lime" : "bg-white"}`}
      >
        Yarn {yarn}/{cat.yarnCap}
      </span>
      {placed.cached > 0 ? (
        <span className="text-[10px] leading-tight font-bold">
          Cached {placed.cached}
        </span>
      ) : null}
      {placed.tucked > 0 ? (
        <span className="text-[10px] leading-tight font-bold">
          Tucked {placed.tucked}
        </span>
      ) : null}
    </button>
  );
}
