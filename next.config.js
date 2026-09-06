/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // Pin the workspace root so a lockfile further up the tree is not picked up.
  outputFileTracingRoot: import.meta.dirname,
};

export default config;
