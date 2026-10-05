"use client";

import { useEffect, useState } from "react";

import {
  describeStrength,
  loadStrength,
  STRENGTH_SEGMENTS,
  type Strength,
  type StrengthEstimator,
} from "~/lib/auth/strength";

/** A filled segment's colour: coral is a warning, lime is a good thing. */
const FILL: Record<Strength["label"], string> = {
  "": "bg-white",
  "Too short": "bg-white",
  Weak: "bg-coral",
  Fair: "bg-volt",
  Good: "bg-lime",
  Strong: "bg-lime",
};

export interface PasswordStrengthProps {
  password: string;
  /** Words the password should not be made of: the username, the email. */
  userInputs?: string[];
}

/**
 * How hard the password is to guess, as four segments and a word. It is
 * advice: it never stops a form. The row is always there, so nothing moves
 * when typing starts, and the word is said once when it changes.
 */
export function PasswordStrength({
  password,
  userInputs,
}: PasswordStrengthProps) {
  const [estimate, setEstimate] = useState<StrengthEstimator | null>(null);

  useEffect(() => {
    let live = true;
    loadStrength().then(
      (loaded) => {
        if (live) setEstimate(() => loaded);
      },
      // The meter is advice; without it the row simply stays empty.
      () => undefined,
    );
    return () => {
      live = false;
    };
  }, []);

  const score = estimate && password ? estimate(password, userInputs) : null;
  const { filled, label } = describeStrength(password, score);

  return (
    <div className="mt-2 flex min-h-4 items-center gap-3">
      <div aria-hidden="true" className="flex flex-1 gap-1">
        {Array.from({ length: STRENGTH_SEGMENTS }, (_, index) => (
          <span
            key={index}
            className={`border-ink h-3 flex-1 border-2 ${index < filled ? FILL[label] : "bg-white"}`}
          />
        ))}
      </div>
      <span aria-hidden="true" className="w-16 text-right text-xs font-black">
        {label}
      </span>
      <span className="sr-only" role="status">
        {label ? `Password strength: ${label}` : ""}
      </span>
    </div>
  );
}
