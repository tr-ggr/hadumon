"use client";

import { useMemo, useState } from "react";

import { towerStanding } from "~/components/run/climb";
import { CHIPBOARD } from "~/components/run/pieces";
import { useLook } from "~/components/skins/SkinProvider";
import { towerSkin, type TowerSkin } from "~/components/skins/skins";
import { WALL, buildTower } from "~/components/sprites/tower";
import { GAUNTLET, getRival } from "~/server/game/rival";
import { api } from "~/trpc/react";

import { moveEase, moveMs, placeShot, roomFloor, type Place } from "./places";
import { tileImage } from "./tile";
import { TowerScene } from "./TowerScene";
import { TowerStage } from "./TowerStage";

const CREAM = "#fff8e7";

/** The wall tile in each stone it has been asked for in. */
const WALLS = new WeakMap<TowerSkin, string>();

/** The wall tile as an image a stylesheet can repeat, drawn as the tower is. */
function wallImage(skin: TowerSkin): string {
  const built = WALLS.get(skin);
  if (built) return built;
  const image = tileImage(WALL, {
    ".": null,
    "3": skin.rib,
    "1": skin.stone,
    "2": skin.light,
    c: CHIPBOARD,
    w: CREAM,
  });
  WALLS.set(skin, image);
  return image;
}

export interface TowerBackdropProps {
  /** Where the page being shown, or being gone to, is. */
  place: Place;
  /** The camera is on its way and the page is put away. */
  moving: boolean;
  /** Kept in place but not drawn: the table has the whole screen. */
  hidden: boolean;
}

/**
 * The tower a run climbs, standing behind every page that is not the table.
 * It shows the run as it is: a pennant on each floor taken, the rivals still
 * to come looking over their sills, Hadu on the floor he has reached. A
 * camera looks at it, and going from one page to another moves the camera:
 * back to see the whole tower, in on where the run stands, or through a
 * window into the room the codex is kept in. It is not a piece and takes no
 * clicks.
 */
export function TowerBackdrop({ place, moving, hidden }: TowerBackdropProps) {
  const look = useLook();
  const run = api.run.current.useQuery(undefined, { retry: 1 });
  const gauntlet = run.data?.view.gauntlet ?? GAUNTLET;
  const tower = useMemo(
    () => buildTower(gauntlet.map((rivalId) => getRival(rivalId).boss)),
    [gauntlet],
  );
  const standing = towerStanding(
    run.isSuccess ? (run.data?.view ?? null) : undefined,
    gauntlet.length,
  );

  // The place before this one says how long the camera takes and how it eases.
  const [trip, setTrip] = useState({ from: place, to: place });
  if (trip.to !== place) setTrip({ from: trip.to, to: place });

  const room = roomFloor(gauntlet);
  // Whoever keeps the room is not at its window while the camera comes in.
  const windows =
    place === "room"
      ? standing.windows.map((state, floor) =>
          floor === room && state !== "flag" ? "dark" : state,
        )
      : standing.windows;
  const shot = placeShot(place, standing.hadu, tower, room);

  return (
    <div
      className="tower-backdrop"
      data-moving={moving}
      data-room={place === "room" && !moving}
      style={hidden ? { visibility: "hidden" } : undefined}
    >
      <TowerStage
        tower={tower}
        camera={shot.camera}
        ms={moveMs(trip.from, trip.to)}
        ease={moveEase(trip.from, trip.to)}
        focus={shot.focus}
        at={shot.at}
        className="absolute inset-0"
      >
        <TowerScene
          tower={tower}
          gauntlet={gauntlet}
          hadu={standing.hadu}
          windows={windows}
          roofFlag={standing.roofFlag}
        />
      </TowerStage>
      <div
        aria-hidden
        className="tower-room"
        style={{ backgroundImage: wallImage(towerSkin(look.tower)) }}
      />
    </div>
  );
}
