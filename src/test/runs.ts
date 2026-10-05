/** Runs for tests to start from. Nothing the app ships imports this. */
import { defaultDeck } from "~/server/game/deck";
import {
  openChest,
  startRun,
  type RunConfig,
  type RunState,
} from "~/server/game/run";
import { startingPool } from "~/server/game/unlocks";

/** A new account's run, stopped at its chest. */
export function chestRun(
  seed = "r",
  config: Partial<RunConfig> = {},
): RunState {
  return startRun({
    seed,
    ticket: "ticket",
    deck: defaultDeck(),
    pool: startingPool(),
    ...config,
  });
}

/** A new account's run with its chest opened, at the keep of the first match. */
export function matchRun(
  seed = "r",
  config: Partial<RunConfig> = {},
): RunState {
  const run = chestRun(seed, config);
  return openChest(run, run.chest[0] ?? "");
}
