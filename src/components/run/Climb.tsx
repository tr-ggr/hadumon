"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { buildTower } from "~/components/sprites/tower";
import { FOCUS, cameraFor } from "~/components/tower/camera";
import { TowerScene } from "~/components/tower/TowerScene";
import { TowerStage } from "~/components/tower/TowerStage";
import { getRival } from "~/server/game/rival";

import {
  CLIMB_PACE,
  climbAnnouncement,
  type ClimbFrame,
  type ClimbRecord,
} from "./climb";
import { tableButtonClass } from "./pieces";
import { useClimbFx } from "./useClimb";

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

export interface ClimbProps {
  climb: ClimbRecord;
  frame: ClimbFrame;
  /** Which frame of the climb this is, counted from 0. */
  beat: number;
  gauntlet: readonly string[];
  onSkip: () => void;
}

/**
 * The way up between matches, shot like a scene and given the whole screen:
 * the tower on a stage, a camera that pushes in on Hadu and follows him up
 * the wall, bars across the top and bottom, a subtitle saying what is
 * happening, and a title card for whoever is at the window. It asks for
 * nothing; it plays, rests and gives way to the next screen, sooner if
 * anything is pressed.
 */
export function Climb({ climb, frame, beat, gauntlet, onSkip }: ClimbProps) {
  const tower = useMemo(
    () => buildTower(gauntlet.map((rivalId) => getRival(rivalId).boss)),
    [gauntlet],
  );
  /** What was already up when the climb began does not land again. */
  const [first] = useState(frame);

  // Said once, after the region exists, so a screen reader reads the climb
  // as one sentence and not as every caption on the way.
  const [said, setSaid] = useState("");
  useEffect(() => {
    setSaid(climbAnnouncement(climb.kind, climb.to, gauntlet));
  }, [climb.kind, climb.to, gauntlet]);

  const skip = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    skip.current?.focus({ preventScroll: true });
  }, []);

  const stage = useRef<HTMLDivElement>(null);
  useClimbFx(stage, beat, frame);

  return (
    <div
      ref={stage}
      className="climb"
      style={{ "--pace": CLIMB_PACE } as CSSProperties}
    >
      <h1 className="sr-only">Climbing the tower</h1>
      <p role="status" className="sr-only">
        {said}
      </p>

      <TowerStage
        tower={tower}
        camera={cameraFor(frame.shot, frame.hadu, tower)}
        ms={frame.ms}
        focus={`${FOCUS * 100}cqh`}
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
            ) : (
              // The card says the same thing, so the two are never up together.
              <div className="climb-caption">
                <p className="bg-ink text-cream max-w-md px-3 py-1.5 text-center text-sm leading-5 font-semibold">
                  {frame.text}
                </p>
              </div>
            )}
          </>
        }
      >
        <TowerScene
          tower={tower}
          gauntlet={gauntlet}
          hadu={frame.hadu}
          windows={frame.windows}
          roofFlag={frame.roofFlag}
          first={first}
        />
      </TowerStage>

      <button
        ref={skip}
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
    </div>
  );
}
