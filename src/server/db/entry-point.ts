import { realpathSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * True when `moduleUrl` is the script node was actually asked to run.
 *
 * A script that exports helpers must not run its `main()` when another module
 * imports it, and a substring check on `process.argv[1]` is not enough to tell
 * the two apart. Comparing resolved paths is.
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
