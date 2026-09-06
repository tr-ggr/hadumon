import { realpathSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * True when `moduleUrl` is the script node was actually asked to run.
 *
 * The seed scripts import each other (`seed.ts` runs the battle and market
 * seeds), so a substring check on `process.argv[1]` is not enough: running
 * `seed-market.ts` would also fire `seed.ts`'s `main()` and seed everything
 * twice. Comparing resolved paths keeps each file's `main()` to itself.
 */
export function isEntryPoint(moduleUrl: string): boolean {
  const entry = process.argv[1];
  if (!entry) return false;

  try {
    return (
      realpathSync(fileURLToPath(moduleUrl)) ===
      realpathSync(fileURLToPath(pathToFileURL(entry)))
    );
  } catch {
    return false;
  }
}
