import { PASSWORD_MIN_LENGTH } from "./validation";

/** zxcvbn's verdict: 0 is guessed at once, 4 is not worth trying. */
export type StrengthScore = 0 | 1 | 2 | 3 | 4;

export const STRENGTH_SEGMENTS = 4;

export interface Strength {
  /** How many of the four segments are filled. */
  filled: number;
  /** The word beside them; empty when there is nothing to say yet. */
  label: "" | "Too short" | "Weak" | "Fair" | "Good" | "Strong";
}

const NOTHING: Strength = { filled: 0, label: "" };

/**
 * What the meter shows for a password and its score. Advice only: the form
 * accepts anything of the minimum length. `score` is null until the estimator
 * has loaded, and a password under the minimum is "Too short" whatever it
 * would have scored.
 */
export function describeStrength(
  password: string,
  score: StrengthScore | null,
): Strength {
  if (password.length === 0) return NOTHING;
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { filled: 0, label: "Too short" };
  }
  if (score === null) return NOTHING;
  if (score <= 1) return { filled: 1, label: "Weak" };
  if (score === 2) return { filled: 2, label: "Fair" };
  if (score === 3) return { filled: 3, label: "Good" };
  return { filled: 4, label: "Strong" };
}

/** Scores a password; `userInputs` are words it should not be built from. */
export type StrengthEstimator = (
  password: string,
  userInputs?: string[],
) => StrengthScore;

let estimator: Promise<StrengthEstimator> | undefined;

/**
 * Loads zxcvbn and its dictionaries on first call and keeps them. They are
 * large, so they are a chunk of their own that only signup and reset fetch.
 * Without the dictionaries zxcvbn would call `password` strong.
 */
export function loadStrength(): Promise<StrengthEstimator> {
  estimator ??= Promise.all([
    import("@zxcvbn-ts/core"),
    import("@zxcvbn-ts/language-common"),
  ]).then(([{ ZxcvbnFactory }, common]) => {
    const zxcvbn = new ZxcvbnFactory({
      dictionary: common.dictionary,
      graphs: common.adjacencyGraphs,
    });
    return (password, userInputs = []) =>
      zxcvbn.check(password, userInputs).score;
  });
  return estimator;
}
