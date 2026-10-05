"use client";

import { useEffect, useRef, useState } from "react";

import { TableButton } from "./pieces";
import { uprightSetting, useUpright, windowLayout } from "./layout";

/** Turning the screen from a page: only some browsers have it. */
type Turnable = ScreenOrientation & {
  lock?: (orientation: "landscape") => Promise<void>;
};

/** Where the page can go full screen and turn the screen itself. */
function canTurn(): boolean {
  return (
    typeof document !== "undefined" &&
    document.fullscreenEnabled &&
    typeof (screen.orientation as Turnable | undefined)?.lock === "function"
  );
}

/**
 * What a phone held upright sees in place of the match: the table is laid
 * out for a wide screen, so it asks to be turned. A page cannot turn an
 * iPhone; where the browser lets it (Android), one button goes full screen
 * and turns the screen itself. The other plays upright, on the page that
 * scrolls, and is remembered.
 *
 * It shows on a touch screen held upright that is no wider than a phone and
 * long enough to hold the table on its side (`matchLayout`). It is not a
 * dialog, so the match's keys are left as they are.
 */
export function TurnPhone() {
  const upright = useUpright();
  const heading = useRef<HTMLHeadingElement>(null);
  /** The window is a phone's, upright, and the table would fit it turned. */
  const [asking, setAsking] = useState(false);
  const [turnable, setTurnable] = useState(false);
  const [refused, setRefused] = useState(false);

  useEffect(() => {
    setTurnable(canTurn());
    const measure = () => setAsking(windowLayout() === "turn");
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // The heading takes focus whenever the prompt comes up: on arriving, and
  // each time the phone is stood upright again.
  const shown = asking && upright === "ask";
  useEffect(() => {
    if (shown) heading.current?.focus();
  }, [shown]);

  if (!shown) return null;

  const turn = async () => {
    setRefused(false);
    try {
      await document.documentElement.requestFullscreen();
      await (screen.orientation as Turnable).lock?.("landscape");
    } catch {
      if (document.fullscreenElement) void document.exitFullscreen();
      setRefused(true);
    }
  };

  return (
    <section aria-labelledby="turn-phone" className="turn-phone cloth">
      <div className="board text-ink flex w-full max-w-sm flex-col gap-3 p-4">
        <h2
          id="turn-phone"
          ref={heading}
          tabIndex={-1}
          className="text-print text-3xl outline-none"
        >
          Turn your phone sideways
        </h2>
        <p className="text-sm leading-snug">
          The table is laid out for a wide screen. Turn the phone and the match
          fits on it whole.
        </p>
        {refused ? (
          <p role="alert" className="text-sm leading-snug font-bold">
            This browser will not turn the screen. Turn the phone, or play
            upright.
          </p>
        ) : null}
        <div className="flex flex-col gap-2.5 pt-1 pb-1">
          {turnable ? (
            <TableButton size="md" onClick={() => void turn()}>
              Go full screen and turn
            </TableButton>
          ) : null}
          <TableButton
            size="md"
            variant="secondary"
            onClick={() => uprightSetting.write("upright")}
          >
            Play upright anyway
          </TableButton>
        </div>
      </div>
    </section>
  );
}
