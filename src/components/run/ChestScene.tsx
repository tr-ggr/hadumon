"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { RelicIcon } from "~/components/RelicIcon";
import { getRelic } from "~/server/game/relics";
import type { RunView } from "~/server/game/view";

import { ClimbStage, SkipButton, useTower } from "./ClimbStage";
import { openingAnnouncement } from "./climb";
import { DeckSpread } from "./DeckSpread";
import { plural } from "./describe";
import { TableButton } from "./pieces";
import { playSound } from "./sfx/engine";
import { TableNav } from "./TableNav";
import { StepHeading } from "./TableSurface";
import { useClimbFx, type Opening } from "./useClimb";

export interface ChestSceneProps {
  run: RunView;
  /** The relics in the chest. */
  chest: readonly string[];
  busy: boolean;
  onOpen: (relicId: string) => void;
  /** The opening, playing or come to rest by the chest. */
  opening: Opening & { frame: NonNullable<Opening["frame"]> };
  /** The run's own strip: the gauntlet track and the way out. */
  runStrip: ReactNode;
}

/**
 * How a run opens, shot like the climb and on the same picture: the camera
 * tilts down the tower and pans out to Hadu walking up, the rivals lean out
 * and take cards from him, and he stumbles onto a chest by the foot. There
 * it rests, and the chest's three relics are offered over the scene with
 * the cards that were taken. Going in carries on from that very shot.
 */
export function ChestScene({
  run,
  chest,
  busy,
  onOpen,
  opening,
  runStrip,
}: ChestSceneProps) {
  const { frame, beat, playing, skip } = opening;
  const tower = useTower(run.gauntlet);
  /** What was already up when the scene began does not arrive again. */
  const [first] = useState(frame);
  const [relic, setRelic] = useState<string | null>(null);

  const [said, setSaid] = useState("");
  useEffect(() => {
    setSaid(openingAnnouncement(run.gauntlet, run.stolen.length));
  }, [run.gauntlet, run.stolen.length]);

  const stage = useRef<HTMLDivElement>(null);
  useClimbFx(stage, beat, frame);

  // While it plays the way out of it has the focus; once it rests, the
  // offer it comes to.
  const skipButton = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (playing) skipButton.current?.focus({ preventScroll: true });
    else heading.current?.focus({ preventScroll: true });
  }, [playing]);

  return (
    <ClimbStage
      stageRef={stage}
      tower={tower}
      frame={frame}
      first={first}
      gauntlet={run.gauntlet}
      stolen={run.stolen.length}
      caption={playing}
    >
      <h1 className="sr-only">The start of the run</h1>
      <p role="status" className="sr-only">
        {said}
      </p>

      {/* Come to rest, the scene is a choice like any other, and has the
          table's corner: its sound, its music and the ways off it. */}
      {playing ? null : (
        <TableNav className="absolute top-2 right-2 z-40 sm:right-3" />
      )}
      {playing ? (
        <SkipButton buttonRef={skipButton} onSkip={skip} />
      ) : (
        <section
          data-toast-clear
          className="absolute inset-x-2 bottom-2 z-30 flex justify-center sm:inset-x-4 sm:bottom-3"
        >
          <div className="piece piece-card border-ink text-ink bg-cream max-h-[64dvh] w-full max-w-2xl space-y-3 overflow-y-auto border-2 px-3 pt-1 sm:px-4">
            {runStrip}
            <StepHeading title="A chest by the door" headingRef={heading}>
              Hadu stumbled onto it at the foot of the tower. Three relics are
              inside, and you can carry one. A relic lasts the whole run.
            </StepHeading>

            {run.stolen.length > 0 ? (
              <div className="space-y-1.5">
                <h3 className="text-ink-soft text-xs font-bold">
                  Stolen: {plural(run.stolen.length, "card")}
                </h3>
                <p className="text-ink text-xs">
                  Beat a rival and you take a card back from the three it shows
                  you. You climb with the {run.deck.length} they left.
                </p>
                <DeckSpread
                  cards={run.stolen}
                  label="Stolen cards"
                  tone="coral"
                />
              </div>
            ) : null}

            <ul className="grid gap-x-3 gap-y-3 sm:grid-cols-3">
              {chest.map((id, place) => {
                const item = getRelic(id);
                const chosen = relic === id;
                return (
                  <li
                    key={id}
                    className="chest-rise"
                    style={{ "--i": place } as CSSProperties}
                  >
                    <button
                      type="button"
                      disabled={busy}
                      aria-pressed={chosen}
                      onClick={() => {
                        playSound("click");
                        setRelic(chosen ? null : id);
                      }}
                      className={`piece border-ink text-ink flex h-full min-h-16 w-full items-start gap-2 border-2 p-2 text-left ${chosen ? "bg-lime is-chosen lift" : "bg-cream hover:bg-sky-soft liftable"}`}
                    >
                      <RelicIcon relicId={id} />
                      <span className="min-w-0">
                        <span className="text-pixel block text-sm">
                          {item.name}
                        </span>
                        <span className="mt-1 block text-xs leading-snug">
                          {item.text}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* The choice ends in a rail that stays at the panel's foot,
                however much of the chest is scrolled above it. */}
            <div className="rail sticky bottom-0 z-10 -mx-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3 py-2.5 sm:-mx-4 sm:px-4">
              <p className="text-ink text-sm font-semibold" aria-live="polite">
                {relic
                  ? `Taking the ${getRelic(relic).name}.`
                  : "Take one. The other two stay in the chest."}
              </p>
              <TableButton
                size="md"
                disabled={busy || relic === null}
                onClick={() => {
                  if (relic) onOpen(relic);
                }}
              >
                {busy ? "Going in…" : "Enter the tower"}
              </TableButton>
            </div>
          </div>
        </section>
      )}
    </ClimbStage>
  );
}
