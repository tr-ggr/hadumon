import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { contrast } from "~/components/skins/contrast";

const CSS = readFileSync(
  fileURLToPath(new URL("./globals.css", import.meta.url)),
  "utf8",
);

/** A colour of the theme by its name, as the stylesheet has it. */
function token(name: string): string {
  const value = new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6});`).exec(
    CSS,
  )?.[1];
  if (!value) throw new Error(`No colour named ${name} in globals.css`);
  return value;
}

const INK = token("ink");
/** What a cat card prints ink on: its face, its tab and its power bands. */
const CARD = [
  "paper",
  "card-tab",
  "band-activated",
  "band-between",
  "band-round-end",
];
/** Colours that already mean something, which a card's own may not repeat. */
const SPOKEN = [
  "flame",
  "mist",
  "volt",
  "thorn",
  "shade",
  "coral",
  "lime",
  "lime-deep",
  "chipboard",
];

describe("the cat card's colours", () => {
  it("all take ink at 7:1 or better", () => {
    for (const name of CARD) {
      expect(contrast(INK, token(name)), name).toBeGreaterThanOrEqual(7);
    }
  });

  it("repeat no element's colour, nor coral, lime or chipboard", () => {
    const spoken = new Map(SPOKEN.map((name) => [token(name), name]));
    for (const name of CARD) {
      expect(spoken.get(token(name)), name).toBeUndefined();
    }
  });

  it("are five different colours, and the tab is none of the tower's greys", () => {
    expect(new Set(CARD.map(token)).size).toBe(CARD.length);
    for (const stone of ["stone", "stone-light", "stone-rib", "stone-deep"]) {
      expect(token("card-tab")).not.toBe(token(stone));
    }
  });
});
