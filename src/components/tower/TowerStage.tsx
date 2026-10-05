import type { CSSProperties, ReactNode } from "react";

import type { Tower } from "~/components/sprites/tower";

import { sceneHeight, type Camera } from "./camera";

/** A length in the tower's own pixels, which the screen's size sets. */
export function px(count: number): string {
  return `calc(var(--px) * ${count})`;
}

export interface TowerStageProps {
  tower: Tower;
  /** The point of the picture to frame, and how close. */
  camera: Camera;
  /** How long the camera takes to get there. */
  ms: number;
  /** The way it gets there, as a timing function. The climb's, unless told. */
  ease?: string;
  /** How far down the stage the framed point sits; any CSS length. */
  focus: string;
  /** How far across the stage it sits. The middle, unless told. */
  at?: string;
  /** The scene: what stands in the picture. */
  children: ReactNode;
  /** What is drawn over the picture and does not move with the camera. */
  overlay?: ReactNode;
  className?: string;
}

/**
 * The stage a tower stands on, and the camera that looks at it. The stage is
 * a clipped box with no frame and no fill; the picture inside it is moved and
 * magnified by one transform, so that the camera's point comes to rest where
 * `at` and `focus` say. The size of a tower pixel (`--px`) is whoever mounts
 * the stage's to set.
 */
export function TowerStage({
  tower,
  camera,
  ms,
  ease,
  focus,
  at,
  children,
  overlay,
  className = "",
}: TowerStageProps) {
  return (
    <div
      aria-hidden
      className={`tower-stage ${className}`}
      style={
        {
          "--focus": focus,
          "--at-x": at,
          "--cam-x": camera.x,
          "--cam-y": camera.y,
          "--zoom": camera.zoom,
          "--cam-ms": `${ms}ms`,
          "--cam-ease": ease,
        } as CSSProperties
      }
    >
      {/* A jolt is on a box of its own around the world, so it adds to the
          camera's move and does not replace it, and whatever is laid over
          the picture stays where it is through it. */}
      <div data-shake className="absolute inset-0">
        <div
          className="tower-world absolute top-0 left-0"
          style={{ width: px(tower.width), height: px(sceneHeight(tower)) }}
        >
          {children}
        </div>
      </div>
      {overlay}
    </div>
  );
}
