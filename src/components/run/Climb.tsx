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
  climbAnnouncement,
  type ClimbFrame,
  type ClimbRecord,
  type Spot,
} from "./climb";
import { LIME, Nameplate, tableButtonClass } from "./pieces";
import { TableArea, TableRail } from "./TableSurface";
import { Tower } from "./Tower";

/** The cat that climbs, whatever clan the run is. */
const CLIMBER = "hadu";
/** Where Hadu and the pennant stand on the roof, in from its left edge. */
const ROOF_STAND = LANE + 6;
const ROOF_PENNANT = LANE + 36;

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

export interface ClimbProps {
  climb: ClimbRecord;
  frame: ClimbFrame;
  gauntlet: readonly string[];
  onSkip: () => void;
}

/**
 * The way up between matches: the tower whole, Hadu on a ledge, a rival at
 * every window still to be passed. It asks for nothing; it plays, rests and
 * gives way to the next screen, sooner if anything is pressed.
 */
export function Climb({ climb, frame, gauntlet, onSkip }: ClimbProps) {
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
  const met = frame.plate === null ? null : tower.floors[frame.plate];
  const metId = frame.plate === null ? undefined : gauntlet[frame.plate];

  return (
    <>
      <TableArea className="flex flex-col justify-center">
        <h1 className="sr-only">Climbing the tower</h1>
        <p role="status" className="sr-only">
          {said}
        </p>

        <div
          aria-hidden
          className="climb mx-auto grid w-full max-w-xl grid-cols-[auto_minmax(0,1fr)] gap-3"
        >
          <div
            className="relative"
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
                    style={{ left: px((floor.hole.width - SPRITE_SIZE) / 2) }}
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
                <PixelSprite
                  key={String(frame.hadu)}
                  catId={CLIMBER}
                  decorative
                  className={`climb-sprite ${
                    frame.hadu === first.hadu
                      ? ""
                      : frame.hadu === "ground"
                        ? "anim-land"
                        : "climb-hop"
                  }`}
                />
              </span>
            )}
          </div>

          <div className="relative min-w-0" style={{ height: px(height) }}>
            {met && metId !== undefined && frame.plate !== null ? (
              <div
                className="absolute inset-x-0"
                style={
                  frame.plate < tower.floors.length / 2
                    ? { bottom: px(tower.height - met.top - met.height) }
                    : { top: px(SPRITE_SIZE + met.top) }
                }
              >
                <Nameplate rivalId={metId} flavor className="anim-land" />
              </div>
            ) : null}
          </div>
        </div>
      </TableArea>

      <TableRail>
        <p
          aria-hidden
          className="text-ink min-h-10 text-sm leading-5 font-semibold sm:min-h-0"
        >
          {frame.text}
        </p>
        <button
          ref={skip}
          type="button"
          onClick={onSkip}
          className={tableButtonClass("secondary", "md", "sm:shrink-0")}
        >
          Skip
        </button>
      </TableRail>
    </>
  );
}
