import { describe, expect, it } from "vitest";

import {
  COMPACT_MIN,
  matchLayout,
  parseUpright,
  PHONE_MAX_WIDTH,
  WIDE_MIN,
} from "./layout";

describe("matchLayout", () => {
  it("fits the wide table to a desktop window", () => {
    for (const [width, height] of [
      [1024, 768],
      [1280, 720],
      [1440, 900],
      [1920, 1080],
      [1024, 600],
    ] as const) {
      expect(matchLayout(width, height, false), `${width}x${height}`).toBe(
        "wide",
      );
    }
  });

  it("fits the compact table to a phone on its side", () => {
    for (const [width, height] of [
      [844, 390],
      [750, 342],
      [932, 430],
    ] as const) {
      expect(matchLayout(width, height, true), `${width}x${height}`).toBe(
        "compact",
      );
    }
  });

  it("leaves a phone too small for the compact table to scroll", () => {
    expect(matchLayout(667, 375, true)).toBe("scroll");
    expect(matchLayout(568, 320, true)).toBe("scroll");
  });

  it("never asks a phone that small to turn", () => {
    expect(matchLayout(375, 667, true)).toBe("scroll");
    expect(matchLayout(320, 568, true)).toBe("scroll");
    // As a browser reports them, with its own bars taken off the height.
    expect(matchLayout(375, 548, true, 667)).toBe("scroll");
  });

  it("asks a phone held upright to turn, if it would fit on its side", () => {
    expect(matchLayout(390, 844, true)).toBe("turn");
    expect(matchLayout(430, 932, true)).toBe("turn");
    expect(matchLayout(360, 720, true)).toBe("turn");
    expect(matchLayout(360, 719, true)).toBe("scroll");
  });

  it("goes by the screen's longer side, not by what the browser leaves", () => {
    expect(matchLayout(390, 664, true)).toBe("scroll");
    expect(matchLayout(390, 664, true, 844)).toBe("turn");
  });

  it("asks only a touch screen, and nothing wider than a phone", () => {
    expect(matchLayout(390, 844, false)).toBe("scroll");
    expect(matchLayout(PHONE_MAX_WIDTH, 1000, true)).toBe("scroll");
    expect(matchLayout(PHONE_MAX_WIDTH - 1, 1000, true)).toBe("turn");
    expect(matchLayout(768, 1024, true)).toBe("scroll");
  });

  it("goes by the window alone, so a short desktop window is compact", () => {
    expect(matchLayout(1280, 500, false)).toBe("compact");
    expect(matchLayout(1920, 599, false)).toBe("compact");
  });

  it("changes over at the wide table's floor", () => {
    const { width, height } = WIDE_MIN;
    expect(matchLayout(width, height, false)).toBe("wide");
    expect(matchLayout(width, height - 1, false)).toBe("compact");
    // Narrower than the floor and too tall to be a phone on its side.
    expect(matchLayout(width - 1, height, false)).toBe("scroll");
    expect(matchLayout(width - 1, 768, false)).toBe("scroll");
  });

  it("changes over at the compact table's floor", () => {
    const { width, height } = COMPACT_MIN;
    expect(matchLayout(width, height, true)).toBe("compact");
    expect(matchLayout(width - 1, height, true)).toBe("scroll");
    expect(matchLayout(width, height - 1, true)).toBe("scroll");
  });

  it("gives a tablet held upright the page that scrolls", () => {
    expect(matchLayout(768, 1024, true)).toBe("scroll");
    expect(matchLayout(820, 1180, true)).toBe("scroll");
  });

  it("fits the wide table to a large tablet either way up", () => {
    expect(matchLayout(1024, 1366, true)).toBe("wide");
    expect(matchLayout(1366, 1024, true)).toBe("wide");
  });
});

describe("parseUpright", () => {
  it("asks unless the player has said to play upright", () => {
    expect(parseUpright(null)).toBe("ask");
    expect(parseUpright("")).toBe("ask");
    expect(parseUpright("sideways")).toBe("ask");
    expect(parseUpright("upright")).toBe("upright");
  });
});
