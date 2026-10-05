import type { CSSProperties } from "react";

import { PixelIcon } from "~/components/PixelIcon";
import { PixelSprite } from "~/components/PixelSprite";
import { RivalSprite } from "~/components/RivalSprite";
import type { TowerStanding } from "~/components/run/climb";
import { Tower as TowerFront } from "~/components/run/Tower";
import { SPRITE_SIZE } from "~/components/sprites/cats";
import { LANE, type Tower } from "~/components/sprites/tower";

import { ROOF_PENNANT, ROOF_STAND } from "./camera";
import { px } from "./TowerStage";

/** The cat that climbs, whatever clan the run is. */
const CLIMBER = "hadu";
/** The player's lime, as a value: a pixel icon takes colours, not classes. */
const LIME = "#d8ff4f";

/** The player's lime pennant, planted where a floor has been taken. */
function Pennant({
  left,
  bottom,
  landing,
}: {
  left: number;
  bottom: number;
  /** False for one that was already up when the scene was first shown. */
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

export interface TowerSceneProps extends TowerStanding {
  tower: Tower;
  gauntlet: readonly string[];
  /**
   * How the scene stood when it was first shown. What has changed since
   * arrives: a pennant lands, Hadu walks in or scrambles up. Leave it out
   * for a scene that is simply there.
   */
  first?: Pick<TowerStanding, "hadu" | "windows">;
}

/**
 * The tower and everyone on it: a rival behind each window, the player's
 * pennants on the floors taken, and Hadu at the foot, on a ledge or on the
 * roof. It is the picture a `TowerStage` shows, drawn in tower pixels.
 */
export function TowerScene({
  tower,
  gauntlet,
  hadu,
  windows,
  roofFlag,
  first,
}: TowerSceneProps) {
  const rise =
    hadu === "roof"
      ? tower.height
      : typeof hadu === "number"
        ? tower.height - (tower.floors[hadu]?.ledge ?? tower.height)
        : 0;

  return (
    <>
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
              data-state={windows[index]}
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
        <TowerFront tower={tower} className="block h-full w-full" />
      </div>

      {tower.floors.map((floor, index) =>
        windows[index] === "flag" ? (
          <Pennant
            key={index}
            left={5}
            bottom={tower.height - floor.ledge}
            landing={first !== undefined && first.windows[index] !== "flag"}
          />
        ) : null,
      )}
      {roofFlag ? (
        <Pennant
          left={ROOF_PENNANT}
          bottom={tower.height}
          landing={first !== undefined}
        />
      ) : null}

      {hadu === "away" ? null : (
        <span
          className="climb-hadu absolute bottom-0 left-0 z-10"
          style={
            {
              "--x": hadu === "roof" ? ROOF_STAND : 0,
              "--rise": rise,
            } as CSSProperties
          }
        >
          {/* A new spot is a new sprite, so its way of arriving plays again:
              walking in at the foot, scrambling up to a ledge. */}
          <span
            key={String(hadu)}
            className={`relative block ${
              first === undefined || hadu === first.hadu
                ? ""
                : hadu === "ground"
                  ? "climb-walk"
                  : "climb-scramble"
            }`}
          >
            <PixelSprite catId={CLIMBER} decorative className="climb-sprite" />
            <span className="climb-dust" />
          </span>
        </span>
      )}
    </>
  );
}
