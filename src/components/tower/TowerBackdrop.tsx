"use client";

import { useMemo } from "react";

import { towerStanding } from "~/components/run/climb";
import { buildTower } from "~/components/sprites/tower";
import { GAUNTLET, getRival } from "~/server/game/rival";
import { api } from "~/trpc/react";

import { sceneHeight, type Camera } from "./camera";
import { TowerScene } from "./TowerScene";
import { TowerStage } from "./TowerStage";

/**
 * Where the tower stands when it is seen whole from outside: its foot a
 * little above the bottom of the stage, and its right side on the right edge
 * of the page's column. A page that shows it keeps that side of itself clear
 * (`.beside-tower`).
 */
const GROUND = "calc(100cqh - 1.25rem)";
const PARKED = "calc(50cqw + min(50cqw, 590px) - 1.25rem - var(--px) * 39)";

/**
 * The tower a run climbs, standing behind every page that is not the table.
 * It shows the run as it is: a pennant on each floor taken, the rivals still
 * to come looking over their sills, Hadu on the floor he has reached. It is
 * not a piece and takes no clicks.
 */
export function TowerBackdrop() {
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
  const outside: Camera = {
    x: tower.width / 2,
    y: sceneHeight(tower),
    zoom: 1,
  };

  return (
    <div className="tower-backdrop">
      <TowerStage
        tower={tower}
        camera={outside}
        ms={0}
        focus={GROUND}
        at={PARKED}
        className="absolute inset-0"
      >
        <TowerScene tower={tower} gauntlet={gauntlet} {...standing} />
      </TowerStage>
    </div>
  );
}
