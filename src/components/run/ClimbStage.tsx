"use client";

import {
  useMemo,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";

import { buildTower, type Tower } from "~/components/sprites/tower";
import { cameraFor, shotFocus } from "~/components/tower/camera";
import { TowerScene } from "~/components/tower/TowerScene";
import { TowerStage } from "~/components/tower/TowerStage";
import { getRival } from "~/server/game/rival";

import { CLIMB_PACE, type ClimbFrame } from "./climb";
import { tableButtonClass } from "./pieces";

/**
 * The card that names what the climb has come to: the rival of the floor, in
 * the rival's coral, or the roof in the player's lime.
 */
function TitleCard({
  rivalId,
  floor,
  count,
}: {
  /** Omit at the roof. */
  rivalId?: string;
  floor: number;
  count: number;
}) {
  const rival = rivalId === undefined ? null : getRival(rivalId);
  return (
    <div className="climb-title absolute inset-x-2 bottom-2 z-30 flex justify-center sm:inset-x-4 sm:bottom-3">
      <div
        className={`piece piece-card border-ink text-ink w-full max-w-md border-2 px-3 py-2 sm:px-4 sm:py-2.5 ${rival ? "bg-coral" : "bg-lime"}`}
      >
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold">
            {rival ? `Floor ${floor + 1} of ${count}` : "The top of the tower"}
          </p>
          {rival?.boss ? (
            <span className="border-ink bg-ink text-cream border px-1 text-[11px] leading-4 font-black">
              Boss
            </span>
          ) : null}
        </div>
        <p className="text-print mt-1.5 text-[30px]">
          {rival ? rival.name : "The roof"}
        </p>
        <p className="mt-1.5 text-sm leading-snug italic">
          {rival ? rival.flavor : `All ${count} floors are yours.`}
        </p>
      </div>
    </div>
  );
}

/** The tower a gauntlet climbs, built once for it. */
export function useTower(gauntlet: readonly string[]): Tower {
  return useMemo(
    () => buildTower(gauntlet.map((rivalId) => getRival(rivalId).boss)),
    [gauntlet],
  );
}

export interface ClimbStageProps {
  stageRef: RefObject<HTMLDivElement | null>;
  tower: Tower;
  frame: ClimbFrame;
  /** How the scene stood on the frame it was first shown on. */
  first: ClimbFrame;
  gauntlet: readonly string[];
  /** How many cards are in the air when the frame shows the theft. */
  stolen?: number;
  /** Leaves the subtitle out, for whatever is laid over its place. */
  caption?: boolean;
  /** Laid over the picture, on top of the bars. */
  children?: ReactNode;
}

/**
 * The tower shot like a scene, given the whole screen: the camera on what the
 * frame frames, bars across the top and bottom, and a subtitle or a title
 * card. A run's opening and every climb are drawn by it, so one can give way
 * to the next on the same picture.
 */
export function ClimbStage({
  stageRef,
  tower,
  frame,
  first,
  gauntlet,
  stolen = 0,
  caption = true,
  children,
}: ClimbStageProps) {
  return (
    <div
      ref={stageRef}
      className="climb"
      style={{ "--pace": CLIMB_PACE } as CSSProperties}
    >
      <TowerStage
        tower={tower}
        camera={cameraFor(frame.shot, frame.hadu, tower)}
        ms={frame.ms}
        focus={`${shotFocus(frame.shot) * 100}cqh`}
        className="absolute inset-0"
        overlay={
          <>
            <span className="climb-bar" data-edge="top" data-in={frame.bars} />
            <span
              className="climb-bar"
              data-edge="bottom"
              data-in={frame.bars}
            />
            {frame.title ? (
              <TitleCard
                rivalId={
                  frame.plate === null ? undefined : gauntlet[frame.plate]
                }
                floor={frame.plate ?? gauntlet.length}
                count={gauntlet.length}
              />
            ) : caption ? (
              // The card says the same thing, so the two are never up together.
              <div className="climb-caption">
                <p className="bg-ink text-cream max-w-md px-3 py-1.5 text-center text-sm leading-5 font-semibold">
                  {frame.text}
                </p>
              </div>
            ) : null}
          </>
        }
      >
        <TowerScene
          tower={tower}
          gauntlet={gauntlet}
          hadu={frame.hadu}
          windows={frame.windows}
          roofFlag={frame.roofFlag}
          chest={frame.chest}
          theft={frame.theft ? stolen : 0}
          first={first}
        />
      </TowerStage>
      {children}
    </div>
  );
}

/** The way out of a scene that is playing, in the corner. */
export function SkipButton({
  buttonRef,
  onSkip,
}: {
  buttonRef?: RefObject<HTMLButtonElement | null>;
  onSkip: () => void;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onSkip}
      className={tableButtonClass(
        "secondary",
        "md",
        "absolute top-2 right-2 z-40 sm:right-3",
      )}
    >
      Skip
    </button>
  );
}
