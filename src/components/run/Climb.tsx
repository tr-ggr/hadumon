"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { PixelIcon } from "~/components/PixelIcon";
import { PixelSprite } from "~/components/PixelSprite";
import { RivalSprite } from "~/components/RivalSprite";
import { SPRITE_SIZE } from "~/components/sprites/cats";
import { LANE, buildTower } from "~/components/sprites/tower";
import { getRival } from "~/server/game/rival";

import {
  CLIMB_PACE,
  climbAnnouncement,
  type ClimbFrame,
  type ClimbRecord,
  type Spot,
} from "./climb";
import { LIME, tableButtonClass } from "./pieces";
import { Tower } from "./Tower";
import { useClimbFx } from "./useClimb";

/** The cat that climbs, whatever clan the run is. */
const CLIMBER = "hadu";
/** Where Hadu and the pennant stand on the roof, in from its left edge. */
const ROOF_STAND = LANE + 6;
const ROOF_PENNANT = LANE + 36;

/**
 * How far down the picture the camera puts what it frames. A little above
 * the middle, so the title card has the lower part to itself.
 */
const FOCUS = 0.44;
/** How much larger the tower is drawn in a close shot. A whole number, so pixels stay square. */
const CLOSE = 2;
/** Where a close shot looks, across the tower: toward the ledge, or the window. */
const LEDGE_SIDE = LANE + 18;
const WINDOW_SIDE = LANE + 26;

/** A length in the tower's own pixels, which the screen's size sets. */
function px(count: number): string {
  return `calc(var(--px) * ${count})`;
}

/** The player's lime pennant, planted where a floor has been taken. */
function Pennant({
  left,
  bottom,
  landing,
}: {
  left: number;
  bottom: number;
  /** False for one that was already up when the climb began. */
  landing: boolean;
}) {
  return (
    <span
      className={`climb-pennant absolute ${landing ? "anim-land" : ""}`}
      style={{ left: px(left), bottom: px(bottom) }}
    >
      <PixelIcon name="goal" fill={LIME} className="block h-full w-full" />
    </span>
  );
}

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
  /** Above the roof, room for a cat to stand on it. */
  const height = tower.height + SPRITE_SIZE;
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

  const rise = (spot: Spot): number => {
    if (spot === "roof") return tower.height;
    if (typeof spot !== "number") return 0;
    return tower.height - (tower.floors[spot]?.ledge ?? tower.height);
  };

  /** The point of the tower the camera looks at, in tower pixels, and how close. */
  const camera = (): { x: number; y: number; zoom: number } => {
    const { shot } = frame;
    if (!shot.close || shot.on === "tower") {
      return { x: tower.width / 2, y: height * FOCUS, zoom: 1 };
    }
    const spot = shot.on === "floor" ? (shot.floor ?? 0) : frame.hadu;
    if (shot.on === "roof" || spot === "roof") {
      return { x: ROOF_STAND + 18, y: SPRITE_SIZE + 6, zoom: CLOSE };
    }
    const floor = typeof spot === "number" ? tower.floors[spot] : undefined;
    return {
      x: shot.on === "floor" ? WINDOW_SIDE : LEDGE_SIDE,
      // Off a floor he is at the foot, or about to be.
      y: floor ? SPRITE_SIZE + floor.top + floor.height / 2 : height - 26,
      zoom: CLOSE,
    };
  };
  const cam = camera();

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

      <div
        aria-hidden
        className="climb-stage"
        style={
          {
            "--focus": `${FOCUS * 100}cqh`,
            "--cam-x": cam.x,
            "--cam-y": cam.y,
            "--zoom": cam.zoom,
            "--cam-ms": `${frame.ms}ms`,
          } as CSSProperties
        }
      >
        {/* The jolt is on a box of its own around the world, so it adds to
            the camera's move and does not replace it, and the bars stay at
            the screen's edges through it. */}
        <div data-shake className="absolute inset-0">
          <div
            className="climb-world absolute top-0 left-0"
            style={{ width: px(tower.width), height: px(height) }}
          >
            <span
              className="climb-cast absolute"
              style={{
                left: px(LANE - 4),
                right: px(-2),
                top: "100%",
                height: px(2),
              }}
            />

            {tower.floors.map((floor, index) => {
              const rivalId = gauntlet[index];
              if (rivalId === undefined) return null;
              return (
                <div
                  key={rivalId}
                  className="bg-stone-deep absolute overflow-clip"
                  style={{
                    left: px(floor.hole.x),
                    top: px(SPRITE_SIZE + floor.hole.y),
                    width: px(floor.hole.width),
                    height: px(floor.hole.height),
                  }}
                >
                  <span
                    className="climb-rival absolute bottom-0"
                    data-state={frame.windows[index]}
                    style={{
                      left: px((floor.hole.width - SPRITE_SIZE) / 2),
                    }}
                  >
                    <RivalSprite
                      rivalId={rivalId}
                      decorative
                      className="climb-sprite"
                    />
                  </span>
                </div>
              );
            })}

            <div
              className="absolute bottom-0 left-0 w-full"
              style={{ height: px(tower.height) }}
            >
              <Tower tower={tower} className="block h-full w-full" />
            </div>

            {tower.floors.map((floor, index) =>
              frame.windows[index] === "flag" ? (
                <Pennant
                  key={index}
                  left={5}
                  bottom={tower.height - floor.ledge}
                  landing={first.windows[index] !== "flag"}
                />
              ) : null,
            )}
            {frame.roofFlag ? (
              <Pennant left={ROOF_PENNANT} bottom={tower.height} landing />
            ) : null}

            {frame.hadu === "away" ? null : (
              <span
                className="climb-hadu absolute bottom-0 left-0 z-10"
                style={
                  {
                    "--x": frame.hadu === "roof" ? ROOF_STAND : 0,
                    "--rise": rise(frame.hadu),
                  } as CSSProperties
                }
              >
                {/* A new spot is a new sprite, so its way of arriving plays
              again: walking in at the foot, scrambling up to a ledge. */}
                <span
                  key={String(frame.hadu)}
                  className={`relative block ${
                    frame.hadu === first.hadu
                      ? ""
                      : frame.hadu === "ground"
                        ? "climb-walk"
                        : "climb-scramble"
                  }`}
                >
                  <PixelSprite
                    catId={CLIMBER}
                    decorative
                    className="climb-sprite"
                  />
                  <span className="climb-dust" />
                </span>
              </span>
            )}
          </div>
        </div>

        <span className="climb-bar" data-edge="top" data-in={frame.bars} />
        <span className="climb-bar" data-edge="bottom" data-in={frame.bars} />
        {frame.title ? (
          <TitleCard
            rivalId={frame.plate === null ? undefined : gauntlet[frame.plate]}
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
      </div>

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
