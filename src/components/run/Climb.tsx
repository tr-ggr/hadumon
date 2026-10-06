"use client";

import { useEffect, useRef, useState } from "react";

import { climbAnnouncement, type ClimbFrame, type ClimbRecord } from "./climb";
import { ClimbStage, SkipButton, useTower } from "./ClimbStage";
import { useClimbFx } from "./useClimb";

export interface ClimbProps {
  climb: ClimbRecord;
  frame: ClimbFrame;
  /** Which frame of the climb this is, counted from 0. */
  beat: number;
  gauntlet: readonly string[];
  onSkip: () => void;
}

/**
 * The way up between matches: the tower on a stage, a camera that pushes in
 * on Hadu and follows him up the wall, and a title card for whoever is at
 * the window. It asks for nothing; it plays, rests and gives way to the next
 * screen, sooner if anything is pressed.
 */
export function Climb({ climb, frame, beat, gauntlet, onSkip }: ClimbProps) {
  const tower = useTower(gauntlet);
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
    <ClimbStage
      stageRef={stage}
      tower={tower}
      frame={frame}
      first={first}
      gauntlet={gauntlet}
    >
      <h1 className="sr-only">Climbing the tower</h1>
      <p role="status" className="sr-only">
        {said}
      </p>
      <SkipButton buttonRef={skip} onSkip={onSkip} />
    </ClimbStage>
  );
}
