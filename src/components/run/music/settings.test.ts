import { describe, expect, it } from "vitest";

import {
  MUSIC_LABELS,
  MUSIC_SETTINGS,
  nextMusic,
  parseMusic,
} from "./settings";

describe("music setting", () => {
  it("reads a stored setting, and anything else as music on", () => {
    for (const setting of MUSIC_SETTINGS) {
      expect(parseMusic(setting)).toBe(setting);
    }
    expect(parseMusic(null)).toBe("on");
    expect(parseMusic("")).toBe("on");
    expect(parseMusic("OFF")).toBe("on");
    expect(parseMusic("muted")).toBe("on");
  });

  it("turns off and on again", () => {
    expect(nextMusic("on")).toBe("off");
    expect(nextMusic("off")).toBe("on");
  });

  it("names the two settings differently", () => {
    expect(new Set(Object.values(MUSIC_LABELS)).size).toBe(
      MUSIC_SETTINGS.length,
    );
  });
});
