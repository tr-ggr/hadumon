import { describe, expect, it } from "vitest";

import { skinSwatch } from "~/components/skins/skins";
import {
  COSMETIC_LIST,
  COSMETIC_SLOTS,
  DEFAULT_LOOK,
  getCosmetic,
  HADU_SLOTS,
  TABLE_SLOTS,
  type Look,
} from "~/server/game/cosmetics";

import { SWATCH_GRIDS, SWATCH_SIZE } from "./swatches";
import {
  changeSentence,
  lockedNote,
  lockedSentence,
  ownedCount,
  packNameOf,
  pressWears,
  refusedSentence,
  standingOf,
  wornSentence,
} from "./wardrobe";

const HEX = /^#[0-9a-f]{6}$/i;

const wearing = (look: Partial<Look>): Look => ({ ...DEFAULT_LOOK, ...look });

describe("a piece's standing", () => {
  it("is worn when the look has it on, whoever owns it", () => {
    const look = wearing({ hat: "hat-top-hat" });
    expect(standingOf(getCosmetic("hat-top-hat"), look, [])).toBe("worn");
    expect(standingOf(getCosmetic("hat-none"), look, [])).toBe("owned");
    expect(standingOf(getCosmetic("eyes-gold"), look, [])).toBe("worn");
  });

  it("is owned for a free piece and for one the account has gained", () => {
    const gained = ["hat-wool-cap", "sky-night"];
    expect(standingOf(getCosmetic("hat-wool-cap"), DEFAULT_LOOK, gained)).toBe(
      "owned",
    );
    expect(standingOf(getCosmetic("sky-night"), DEFAULT_LOOK, gained)).toBe(
      "owned",
    );
    expect(standingOf(getCosmetic("hat-top-hat"), DEFAULT_LOOK, gained)).toBe(
      "locked",
    );
  });

  it("locks every piece but the free ones on a new account", () => {
    for (const cosmetic of COSMETIC_LIST) {
      expect(standingOf(cosmetic, DEFAULT_LOOK, []), cosmetic.id).toBe(
        cosmetic.free ? "worn" : "locked",
      );
    }
  });
});

describe("a press on a piece", () => {
  it("puts on a piece that is not worn", () => {
    expect(pressWears(getCosmetic("hat-top-hat"), DEFAULT_LOOK)).toBe(
      "hat-top-hat",
    );
    const look = wearing({ hat: "hat-top-hat" });
    expect(pressWears(getCosmetic("hat-wool-cap"), look)).toBe("hat-wool-cap");
    expect(pressWears(getCosmetic("hat-none"), look)).toBe("hat-none");
  });

  it("takes the worn piece off for the free one of its slot", () => {
    for (const slot of COSMETIC_SLOTS) {
      const piece = COSMETIC_LIST.find((c) => c.slot === slot && !c.free)!;
      expect(pressWears(piece, wearing({ [slot]: piece.id })), slot).toBe(
        DEFAULT_LOOK[slot],
      );
    }
  });

  it("changes nothing when the free piece is already on", () => {
    for (const slot of COSMETIC_SLOTS) {
      const free = getCosmetic(DEFAULT_LOOK[slot]);
      expect(pressWears(free, DEFAULT_LOOK), slot).toBeNull();
    }
  });
});

describe("where a piece is found", () => {
  it("names the wardrobe pack for what a hadu wears", () => {
    for (const slot of HADU_SLOTS) {
      expect(packNameOf(slot)).toBe("Wardrobe pack");
      expect(lockedNote(slot)).toBe("Found in the Wardrobe pack.");
    }
  });

  it("names the table and tower pack for a skin", () => {
    for (const slot of TABLE_SLOTS) {
      expect(packNameOf(slot)).toBe("Table and Tower pack");
      expect(lockedNote(slot)).toBe("Found in the Table and Tower pack.");
    }
  });
});

describe("how much of the wardrobe an account has", () => {
  it("counts the free pieces of a new account", () => {
    expect(ownedCount(HADU_SLOTS, [])).toEqual({ owned: 5, total: 45 });
    expect(ownedCount(TABLE_SLOTS, [])).toEqual({ owned: 4, total: 28 });
    expect(ownedCount(["hat"], [])).toEqual({ owned: 1, total: 9 });
  });

  it("counts a gained piece in its own slots only", () => {
    const gained = ["hat-top-hat", "hat-wool-cap", "mat-gilt", "no-such-piece"];
    expect(ownedCount(HADU_SLOTS, gained)).toEqual({ owned: 7, total: 45 });
    expect(ownedCount(TABLE_SLOTS, gained)).toEqual({ owned: 5, total: 28 });
    expect(ownedCount(["hat"], gained)).toEqual({ owned: 3, total: 9 });
    expect(ownedCount(["eyes"], gained)).toEqual({ owned: 1, total: 9 });
  });
});

describe("what the page says", () => {
  it("says what is worn, leaving the free pieces unsaid", () => {
    expect(wornSentence(DEFAULT_LOOK)).toBe(
      "Wearing nothing from the wardrobe. He came like this.",
    );
    expect(wornSentence(wearing({ hat: "hat-top-hat" }))).toBe(
      "Wearing Top Hat.",
    );
    expect(
      wornSentence(wearing({ hat: "hat-top-hat", body: "body-cape" })),
    ).toBe("Wearing Top Hat and Cape.");
    expect(
      wornSentence(
        wearing({
          hat: "hat-top-hat",
          eyes: "eyes-wink",
          tail: "tail-twin",
          halo: "halo-storm",
        }),
      ),
    ).toBe("Wearing Top Hat, Wink, Twin Tails and Storm.");
    // The table's skins are not something he wears.
    expect(wornSentence(wearing({ mat: "mat-gilt", sky: "sky-night" }))).toBe(
      wornSentence(DEFAULT_LOOK),
    );
    // A look holding an id that is no piece still makes a sentence.
    expect(wornSentence(wearing({ hat: "hat-gone" }))).toBe(
      wornSentence(DEFAULT_LOOK),
    );
  });

  it("says what a press changed", () => {
    expect(changeSentence(getCosmetic("hat-top-hat"))).toBe("Top Hat on.");
    expect(changeSentence(getCosmetic("halo-nine-lives"))).toBe(
      "Nine Lives on.",
    );
    expect(changeSentence(getCosmetic("hat-none"))).toBe("Back to Bare Head.");
    expect(changeSentence(getCosmetic("sky-night"))).toBe(
      "Night set for the sky.",
    );
    expect(changeSentence(getCosmetic("cloth-gingham"))).toBe(
      "Gingham set for the tablecloth.",
    );
    expect(changeSentence(getCosmetic("mat-sky"))).toBe("Back to Sky Board.");
  });

  it("says why a press did nothing", () => {
    expect(lockedSentence(getCosmetic("hat-top-hat"))).toBe(
      "Top Hat is not yours yet. Found in the Wardrobe pack.",
    );
    expect(lockedSentence(getCosmetic("tower-ice"))).toBe(
      "Ice Tower is not yours yet. Found in the Table and Tower pack.",
    );
    expect(
      refusedSentence(
        getCosmetic("hat-top-hat"),
        "You do not have that one yet.",
      ),
    ).toBe("Top Hat did not go on. You do not have that one yet.");
  });
});

describe("a skin's swatch", () => {
  it("has a square picture for every table slot, in three colours", () => {
    expect(Object.keys(SWATCH_GRIDS).sort()).toEqual([...TABLE_SLOTS].sort());
    for (const slot of TABLE_SLOTS) {
      const rows = SWATCH_GRIDS[slot];
      expect(rows, slot).toHaveLength(SWATCH_SIZE);
      for (const row of rows) expect(row, slot).toMatch(/^[123]{12}$/);
      // All three of a skin's colours are on show.
      expect(new Set(rows.join("")).size, slot).toBe(3);
    }
  });

  it("has three flat colours for every skin there is", () => {
    const skins = COSMETIC_LIST.filter((c) =>
      (TABLE_SLOTS as readonly string[]).includes(c.slot),
    );
    expect(skins).toHaveLength(28);
    for (const skin of skins) {
      const swatch = skinSwatch(skin.id);
      expect(swatch, skin.id).toHaveLength(3);
      for (const color of swatch) expect(color, skin.id).toMatch(HEX);
    }
  });
});
