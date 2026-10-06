"use client";

import { useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";

import { PixelIcon } from "~/components/PixelIcon";
import { prefersCalm } from "~/components/run/fx/dom";
import { LIME_COLOR as LIME } from "~/components/sprites/palettes";

import { embers, raise, settleBack } from "./fx";
import { packArt } from "./packs";
import { OpenedPack, type PackSeal } from "./PackWrapper";
import { PHASE_MS, type Pace, type Phase } from "./reveal";
import { useCut } from "./useCut";

/**
 * How far the pack on the stage has got: picked off the shelf while the shop
 * is asked for it, and then the reveal's own phases until its cards are out.
 */
export type OpeningPhase = "picked" | Exclude<Phase, "dealt">;

/** What the wrapper looks like in each. */
const SEAL: Record<OpeningPhase, PackSeal> = {
  picked: "sealed",
  raised: "sealed",
  ready: "ready",
  cut: "cut",
  burnt: "burning",
  flash: "burnt",
};

/** How long each timed phase is held, for the stylesheet to keep time by. */
export function paceStyle(pace: Pace): CSSProperties {
  const ms = PHASE_MS[pace === "calm" ? "full" : pace];
  return {
    "--t-raised": `${ms.raised}ms`,
    "--t-cut": `${ms.cut}ms`,
    "--t-burnt": `${ms.burnt}ms`,
    "--t-flash": `${ms.flash}ms`,
  } as CSSProperties;
}

/** The star behind the card: twelve flat rays, each as wide as the gap by it. */
const RAYS = Array.from({ length: 12 }, (_, i) => {
  const at = (turn: number) => {
    const angle = (turn * Math.PI) / 12;
    return `${(Math.cos(angle) * 100).toFixed(2)},${(Math.sin(angle) * 100).toFixed(2)}`;
  };
  return `M0,0L${at(i * 2)}L${at(i * 2 + 1)}Z`;
}).join("");

export interface PackOpeningProps {
  packId: string;
  /** How many things come out of it, on the tag on its corner. */
  holds: number;
  phase: OpeningPhase;
  pace: Pace;
  /** The top was cut off by a drag across it. */
  onCut: () => void;
}

/**
 * The pack that is being opened, on the darkened stage, from the press that
 * bought it until its cards are out. It stands exactly where it stood in the
 * middle of the shelf, over the wash that has come down on everything else;
 * it comes forward, waits to be cut along its top, loses the strip, burns
 * down to the card inside behind a row of fire, and goes up in a star.
 *
 * It is a picture: nothing in it is read out or takes the focus. The cut can
 * be dragged here with a pointer, and the rail holds the same cut as a
 * button. `phase` is the only thing that moves it, so rendering it again
 * plays nothing.
 */
export function PackOpening({
  packId,
  holds,
  phase,
  pace,
  onCut,
}: PackOpeningProps) {
  const { light, ground } = packArt(packId);
  const root = useRef<HTMLDivElement>(null);
  const stand = useRef<HTMLDivElement>(null);
  const cut = useCut(
    () => root.current,
    () => stand.current,
    onCut,
  );

  // The pack is where the stylesheet says it is in each phase; getting there
  // is a spring, played once as the phase comes.
  const was = useRef<OpeningPhase | null>(null);
  useLayoutEffect(() => {
    const from = was.current;
    was.current = phase;
    const pack = stand.current;
    if (!pack || from === null || from === phase || prefersCalm()) return;
    if (phase === "raised" && pace !== "calm") {
      raise(pack, PHASE_MS[pace].raised ?? 0);
    } else if (phase === "burnt" && pace !== "calm") {
      settleBack(pack);
      embers(pack, [light, ground], PHASE_MS[pace].burnt ?? 0);
    }
  }, [phase, pace, light, ground]);

  // A cut that was made is made: nothing of the drag outlives its phase.
  useEffect(() => {
    if (phase !== "ready") root.current?.style.removeProperty("--cut");
  }, [phase]);

  return (
    <div ref={root} aria-hidden className="pack-opening" data-phase={phase}>
      <div className="pack-open-slot">
        <div ref={stand} className="pack-stand">
          <svg
            className="pack-star"
            fill={light}
            viewBox="-100 -100 200 200"
            width="760"
            height="760"
          >
            <path d={RAYS} />
          </svg>
          <OpenedPack packId={packId} holds={holds} seal={SEAL[phase]} />
          {phase === "ready" ? (
            <div className="pack-snip" {...cut}>
              <span className="pack-scissors mark-rim">
                <PixelIcon
                  name="scissors"
                  size={32}
                  ink="#ffffff"
                  fill={LIME}
                />
                <PixelIcon
                  name="scissorsShut"
                  size={32}
                  ink="#ffffff"
                  fill={LIME}
                />
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
