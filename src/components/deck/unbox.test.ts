import { describe, expect, it } from "vitest";

import {
  advanceUnbox,
  beginUnbox,
  skipUnbox,
  UNBOX_MS,
  type UnboxPhase,
} from "./unbox";

describe("the deck box", () => {
  it("starts shut, or with reduced motion is not there at all", () => {
    expect(beginUnbox(false)).toBe("shut");
    expect(beginUnbox(true)).toBe("done");
  });

  it("opens shut, lifted, drawn, out, and then stays done", () => {
    const seen: UnboxPhase[] = ["shut"];
    for (let i = 0; i < 5; i++) seen.push(advanceUnbox(seen.at(-1)!));
    expect(seen).toEqual(["shut", "lifted", "drawn", "out", "done", "done"]);
  });

  it("goes straight to the page landing on a press while it opens", () => {
    expect(skipUnbox("shut")).toBe("out");
    expect(skipUnbox("lifted")).toBe("out");
    expect(skipUnbox("drawn")).toBe("out");
  });

  it("ignores a press once the page is landing or there", () => {
    expect(skipUnbox("out")).toBe("out");
    expect(skipUnbox("done")).toBe("done");
  });

  it("keeps the player from the deck for under two seconds", () => {
    const total = Object.values(UNBOX_MS).reduce((sum, ms) => sum + ms, 0);
    expect(total).toBeLessThan(2000);
  });
});
