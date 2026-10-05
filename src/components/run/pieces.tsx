import { EssencePip } from "~/components/cats/CatCard";
import { PixelIcon } from "~/components/PixelIcon";
import { RelicIcon } from "~/components/RelicIcon";
import { KeyHint } from "~/components/ui/table";
import {
  difficultyOf,
  LEVEL_COUNT,
  rivalLevel,
  type DifficultyId,
} from "~/server/game/difficulty";
import type { Essence } from "~/server/game/match";
import { getRelic } from "~/server/game/relics";
import { GAUNTLET, getRival } from "~/server/game/rival";

import { essenceLabel, plural, yarnCostLabel } from "./describe";
import { RollingNumber } from "./fx/RollingNumber";

/** The palette as values, for pixel icons, which take colours and not classes. */
export const INK = "#17212b";
export const LIME = "#d8ff4f";
export const CORAL = "#ff7163";
export const COBALT = "#1557d8";
export const WHITE = "#ffffff";
export const CHIPBOARD = "#b9a47e";

// The table's own controls live with the rest of the shared pieces now; they
// are still part of a run's kit.
export {
  KeyHint,
  Label,
  TableButton,
  TableLink,
  tableButtonClass,
  type TableButtonProps,
} from "~/components/ui/table";

export interface DieProps {
  face: Essence;
  /** Omit for a die that is only shown. */
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  /** A key that picks this die, shown where there is a keyboard. */
  hint?: string;
}

/** One feeder die. A button only while dice are being chosen. */
export function Die({
  face,
  onClick,
  selected = false,
  disabled,
  hint,
}: DieProps) {
  const body = (
    <>
      <EssencePip kind={face} size={24} />
      {/* Two lines whether the name needs them or not ("Dry food" does),
          so every die in a row is the same shape. */}
      <span className="flex min-h-5 items-center text-center text-[10px] leading-none font-bold">
        {essenceLabel(face)}
      </span>
      {hint ? (
        <KeyHint className="absolute top-0.5 right-0.5">{hint}</KeyHint>
      ) : null}
    </>
  );
  const box = `piece border-ink text-ink relative flex h-full min-h-12 w-full flex-col items-center justify-center gap-1 border-2 px-1 py-1.5 ${selected ? "bg-lime lift" : "bg-white"}`;
  if (!onClick) return <div className={box}>{body}</div>;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${essenceLabel(face)} die`}
      className={`${box} hover:bg-sky-soft aria-pressed:hover:bg-lime disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {body}
    </button>
  );
}

/**
 * One kind of essence as a token with its count. Empty is a printed space.
 * While a swap is being chosen the token is a button: tapping it gives one
 * up, and the count shows what would be left.
 */
export function EssenceToken({
  kind,
  count,
  given = 0,
  onPick,
  disabled,
}: {
  kind: Essence;
  count: number;
  /** How many of this kind the swap being chosen gives up. */
  given?: number;
  /** Present while a swap is being chosen and this kind can still change. */
  onPick?: () => void;
  disabled?: boolean;
}) {
  const left = count - given;
  const body = (
    <>
      {/* A food the player holds none of stays in its place, faded. */}
      <span className={count > 0 ? "flex" : "flex opacity-35"}>
        <EssencePip kind={kind} size={24} />
      </span>
      <span
        aria-hidden
        className={`text-pixel min-w-3 text-sm leading-none ${left === 0 ? "text-ink-soft" : ""}`}
      >
        <RollingNumber value={left} />
      </span>
    </>
  );
  const said = `${count} ${essenceLabel(kind)}${given > 0 ? `, ${given} given up` : ""}`;
  const box = `text-ink relative flex items-center gap-0.5 border-2 py-0.5 tabular-nums ${given > 0 ? "piece border-ink bg-lime is-chosen" : onPick ? "piece border-ink is-open bg-white" : "border-transparent"}`;
  return (
    <li data-essence={kind}>
      {onPick ? (
        <button
          type="button"
          onClick={onPick}
          disabled={disabled}
          aria-label={`Give up 1 ${essenceLabel(kind)}: ${said}`}
          className={`${box} hover:bg-sky-soft before:absolute before:-inset-x-0.5 before:-inset-y-2 before:content-[''] disabled:cursor-not-allowed`}
        >
          {body}
        </button>
      ) : (
        <div className={box}>
          {body}
          <span className="sr-only">{said}</span>
        </div>
      )}
    </li>
  );
}

/** Yarn as token spaces up to a cat's capacity. The count is always said. */
export function YarnTrack({
  held,
  queued = 0,
  cap,
  owner = "player",
  size = 16,
  className = "",
}: {
  held: number;
  /** Yarn chosen in a Den that has not been sent. */
  queued?: number;
  cap: number;
  owner?: "player" | "rival";
  size?: number;
  className?: string;
}) {
  const fill = owner === "player" ? LIME : CORAL;
  return (
    <span className={`flex flex-wrap items-center gap-px ${className}`}>
      {Array.from({ length: cap }, (_, i) => {
        const full = i < held + queued;
        return (
          <PixelIcon
            key={i}
            name="yarn"
            size={size}
            fill={full ? fill : "transparent"}
            ink={full ? (i >= held ? COBALT : INK) : CHIPBOARD}
            className={i >= held && full ? "anim-land" : ""}
          />
        );
      })}
      <span className="sr-only">
        Yarn {held + queued} of {cap}
        {queued > 0 ? `, ${queued} of it not laid yet` : ""}
      </span>
    </span>
  );
}

/**
 * The price printed in an empty lane space, named as what it is: the yarn it
 * costs to seat a cat there, which is not what the row gives. `className`
 * sets whether the label stands over the price or beside it.
 */
export function SpaceCost({
  cost,
  compact = false,
  className = "",
}: {
  cost: number;
  /**
   * Cuts to what the space has room for; the space must be an `@container`.
   * Under 8.5rem the label is "Cat", and under 12rem the yarn is its icons
   * without the words. What is cut is still read out.
   */
  compact?: boolean;
  className?: string;
}) {
  return (
    <span className={`flex items-center ${className}`}>
      <span className="font-semibold">
        Cat
        <span className={compact ? "@max-[8.5rem]:sr-only" : ""}> costs</span>
      </span>
      {cost === 0 ? (
        <span className="flex h-4 items-center">Free</span>
      ) : (
        // In a space too narrow for both, the words drop under the icons.
        <span className="flex flex-wrap items-center justify-center gap-1">
          <span className="flex gap-px" aria-hidden>
            {Array.from({ length: cost }, (_, i) => (
              <PixelIcon key={i} name="yarn" size={16} />
            ))}
          </span>
          <span
            className={`whitespace-nowrap ${compact ? "@max-[12rem]:sr-only" : ""}`}
          >
            {yarnCostLabel(cost)}
          </span>
        </span>
      )}
      <span className="sr-only">. </span>
    </span>
  );
}

/** How thick a pile of `count` cards stands, in pixels. */
export function pileEdge(count: number): number {
  return Math.min(9, 2 + Math.ceil(count / 3));
}

export interface PileProps {
  /** Cards in the pile. */
  count: number;
  /** What the pile is, for assistive tech: "Your deck". */
  label: string;
  /** Whose cards these are. */
  owner?: "player" | "rival";
  /** Face-up piles (a discard) show cream instead of a card back. */
  faceUp?: boolean;
  className?: string;
}

/** A stack of cards seen from above: one back, an edge as thick as the stack. */
export function Pile({
  count,
  label,
  owner = "player",
  faceUp = false,
  className = "",
}: PileProps) {
  const face = faceUp
    ? "bg-cream"
    : owner === "player"
      ? "bg-cobalt"
      : "bg-coral";
  return (
    <div
      role="img"
      aria-label={`${label}: ${plural(count, "card")}`}
      className={`relative h-12 w-9 shrink-0 ${className}`}
    >
      {count > 0 ? (
        <div
          className={`piece border-ink grid h-full w-full place-items-center border-2 ${face}`}
          style={{ ["--e" as string]: `${pileEdge(count)}px` }}
        >
          <PixelIcon
            name="paw"
            size={16}
            ink={faceUp ? CHIPBOARD : owner === "player" ? WHITE : INK}
          />
        </div>
      ) : (
        <div className="border-ink/35 h-full w-full border-2 border-dashed" />
      )}
      <span
        aria-hidden
        className="border-ink text-ink text-pixel absolute -top-1.5 -right-1.5 min-w-5 border-2 bg-white px-0.5 text-center text-xs leading-4 tabular-nums"
      >
        {count}
      </span>
    </div>
  );
}

/** One turn of a round: a lime cube while it is still to play. */
export function TurnCube({ spent }: { spent: boolean }) {
  return spent ? (
    <span className="border-sky-deep block h-3 w-3 border-2" />
  ) : (
    <span className="piece border-ink bg-lime block h-3 w-3 border-2" />
  );
}

/** A relic as a tile: its drawing, and its rules text. */
export function RelicTile({
  relicId,
  className = "",
}: {
  relicId: string;
  className?: string;
}) {
  const relic = getRelic(relicId);
  return (
    <div
      className={`piece border-ink bg-cream text-ink flex items-center gap-2 border-2 px-2 py-1 ${className}`}
    >
      <RelicIcon relicId={relicId} />
      <p className="min-w-0 text-xs leading-snug">
        <span className="text-pixel text-sm">{relic.name}.</span> {relic.text}
      </p>
    </div>
  );
}

export function RelicTiles({
  relicIds,
  className = "",
}: {
  relicIds: readonly string[];
  className?: string;
}) {
  if (relicIds.length === 0) {
    return <p className="text-ink-soft text-sm">No relics yet.</p>;
  }
  return (
    <ul className={`grid gap-2.5 ${className}`}>
      {relicIds.map((id) => (
        <li key={id}>
          <RelicTile relicId={id} className="h-full" />
        </li>
      ))}
    </ul>
  );
}

/**
 * The rival's coral nameplate: name, boss mark and its manner of play.
 * Across the table in a run it also carries the level it plays at there,
 * which is all a tier changes.
 */
export function Nameplate({
  rivalId,
  flavor = false,
  difficulty,
  className = "",
}: {
  rivalId: string;
  /** Also print the flavor line, when meeting the rival. */
  flavor?: boolean;
  /** The run's tier, where the plate is across the table in a run. */
  difficulty?: DifficultyId;
  className?: string;
}) {
  const rival = getRival(rivalId);
  const tier = difficultyOf(difficulty);
  // Counted from 1, as a player counts.
  const level =
    difficulty === undefined
      ? null
      : rivalLevel(GAUNTLET.indexOf(rivalId), difficulty) + 1;
  return (
    <div
      className={`piece border-ink bg-coral text-ink flex flex-col justify-center border-2 px-2.5 py-1 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <h2 className="text-print text-xl">{rival.name}</h2>
        {rival.boss ? (
          <span className="border-ink bg-ink text-cream border px-1 text-[11px] leading-4 font-black">
            Boss
          </span>
        ) : null}
        {level !== null ? (
          <span className="border-ink border bg-white px-1 text-[11px] leading-4 font-black">
            {tier.name}, level {level} of {LEVEL_COUNT}
          </span>
        ) : null}
      </div>
      {flavor ? (
        <p className="mt-1 text-sm leading-snug italic">{rival.flavor}</p>
      ) : null}
      <p className="mt-0.5 text-xs leading-snug font-bold">{rival.trait}</p>
    </div>
  );
}
