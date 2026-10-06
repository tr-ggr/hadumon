import type { CSSProperties } from "react";

import { HaduAvatar } from "~/components/HaduAvatar";
import { PixelIcon } from "~/components/PixelIcon";
import { RivalSprite } from "~/components/RivalSprite";
import type { ChestState, Spot, TowerStanding } from "~/components/run/climb";
import { Tower as TowerFront } from "~/components/run/Tower";
import { useLook } from "~/components/skins/SkinProvider";
import { skySkin, towerSkin } from "~/components/skins/skins";
import { SPRITE_SIZE } from "~/components/sprites/cats";
import { CHEST_COLOR } from "~/components/sprites/palettes";
import type { Tower } from "~/components/sprites/tower";

import {
  CHEST_AT,
  CHEST_SIZE,
  CHEST_STAND,
  PATH_X,
  ROOF_PENNANT,
  ROOF_STAND,
  sceneHeight,
  windowCentre,
} from "./camera";
import { TowerScenery } from "./TowerScenery";
import { px } from "./TowerStage";

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

/** Where Hadu stands across the picture, from his left edge. */
function haduX(hadu: Spot): number {
  if (hadu === "roof") return ROOF_STAND;
  if (hadu === "path") return PATH_X;
  if (hadu === "chest") return CHEST_STAND;
  return 0;
}

/** How Hadu arrives at a spot: walking in, stumbling, walking on, climbing. */
function arrival(hadu: Spot): string {
  if (hadu === "path") return "climb-stroll";
  if (hadu === "chest") return "climb-stumble";
  if (hadu === "ground") return "climb-walk";
  return "climb-scramble";
}

/** A card's size, in tower pixels, as it is snatched up to a window. */
const CARD_WIDTH = 6;
const CARD_HEIGHT = 8;
/** How high off the ground Hadu carries his pack. */
const PACK_HEIGHT = 6;

/**
 * The stolen cards, going up one after another out of Hadu's pack on the
 * landing and in at the rivals' windows, a window each in turn.
 */
function Theft({ tower, count }: { tower: Tower; count: number }) {
  const left = PATH_X + 5;
  const top = sceneHeight(tower) - PACK_HEIGHT - CARD_HEIGHT;
  const floors = Math.max(tower.floors.length, 1);
  return (
    <>
      {Array.from({ length: count }, (_, index) => {
        const to = windowCentre(tower, index % floors);
        return (
          <span
            key={index}
            className="theft-card absolute z-20"
            style={
              {
                left: px(left),
                top: px(top),
                width: px(CARD_WIDTH),
                height: px(CARD_HEIGHT),
                "--to-x": to.x - CARD_WIDTH / 2 - left,
                "--to-y": to.y - CARD_HEIGHT / 2 - top,
                "--i": index,
              } as CSSProperties
            }
          />
        );
      })}
    </>
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
  /** The chest by the foot, where a run opens. Not there, unless told. */
  chest?: ChestState;
  /** How many stolen cards are in the air. None, unless told. */
  theft?: number;
}

/**
 * The tower, where it stands and everyone on it: the sky and the sea behind,
 * a rival behind each window, the player's pennants on the floors taken, and
 * the player's hadu at the foot, on a ledge or on the roof. It is the picture a
 * `TowerStage` shows, drawn in tower pixels.
 */
export function TowerScene({
  tower,
  gauntlet,
  hadu,
  windows,
  roofFlag,
  first,
  chest = "none",
  theft = 0,
}: TowerSceneProps) {
  const look = useLook();
  const rise =
    hadu === "roof"
      ? tower.height
      : typeof hadu === "number"
        ? tower.height - (tower.floors[hadu]?.ledge ?? tower.height)
        : 0;

  return (
    <>
      <TowerScenery tower={tower} sky={skySkin(look.sky)} />

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
        <TowerFront
          tower={tower}
          skin={towerSkin(look.tower)}
          className="block h-full w-full"
        />
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

      {chest === "none" ? null : (
        <span
          className="absolute"
          style={{
            left: px(CHEST_AT),
            // The shut chest's icon has two empty rows under it; the open
            // one's, one.
            bottom: px(chest === "shut" ? -2 : -1),
            width: px(CHEST_SIZE),
            height: px(CHEST_SIZE),
          }}
        >
          <PixelIcon
            name={chest === "shut" ? "chest" : "chestOpen"}
            fill={CHEST_COLOR}
            className={`block h-full w-full ${chest === "open" && first?.hadu !== "chest" ? "chest-lid" : ""}`}
          />
        </span>
      )}

      {theft > 0 ? <Theft tower={tower} count={theft} /> : null}

      {hadu === "away" ? null : (
        <span
          className="climb-hadu absolute bottom-0 left-0 z-10"
          style={
            {
              "--x": haduX(hadu),
              "--rise": rise,
            } as CSSProperties
          }
        >
          {/* A new spot is a new sprite, so its way of arriving plays again:
              walking in over the landing, stumbling onto the chest, walking
              on to the foot, scrambling up to a ledge. */}
          <span
            key={String(hadu)}
            className={`relative block ${
              first === undefined || hadu === first.hadu ? "" : arrival(hadu)
            }`}
          >
            <HaduAvatar look={look} className="climb-sprite" />
            <span className="climb-dust" />
          </span>
        </span>
      )}
    </>
  );
}
