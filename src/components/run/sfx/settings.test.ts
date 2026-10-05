import { describe, expect, it } from "vitest";

import {
  nextVolume,
  parseVolume,
  VOLUME_GAIN,
  VOLUME_LABELS,
  VOLUMES,
} from "./settings";

describe("sound settings", () => {
  it("reads a stored setting, and anything else as sound on", () => {
    for (const volume of VOLUMES) expect(parseVolume(volume)).toBe(volume);
    expect(parseVolume(null)).toBe("full");
    expect(parseVolume("")).toBe("full");
    expect(parseVolume("loud")).toBe("full");
    expect(parseVolume("MUTED")).toBe("full");
  });

  it("cycles full, quiet, muted and round again", () => {
    expect(nextVolume("full")).toBe("quiet");
    expect(nextVolume("quiet")).toBe("muted");
    expect(nextVolume("muted")).toBe("full");
  });

  it("plays quieter at each setting, and not at all when muted", () => {
    expect(VOLUME_GAIN.full).toBeLessThanOrEqual(1);
    expect(VOLUME_GAIN.quiet).toBeLessThan(VOLUME_GAIN.full / 2);
    expect(VOLUME_GAIN.quiet).toBeGreaterThan(0);
    expect(VOLUME_GAIN.muted).toBe(0);
  });

  it("names every setting differently", () => {
    expect(new Set(Object.values(VOLUME_LABELS)).size).toBe(VOLUMES.length);
  });
});
