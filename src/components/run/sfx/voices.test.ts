import { describe, expect, it } from "vitest";

import {
  ARCHETYPES,
  CAT_LIST,
  CATS,
  RARITIES,
  type Rarity,
} from "~/server/game/cats";
import { ELEMENTS } from "~/server/game/elements";

import { LIMITS, recipe, voiceSeconds, type Voice } from "./recipes";
import {
  catInflection,
  catPitch,
  catVoice,
  INFLECTIONS,
  ladderFor,
  rungHz,
  RUNGS,
  SIGNATURE,
  SQUARE_GAIN,
  VOICE_SECONDS,
  voiceFor,
  type Voiced,
} from "./voices";

const key = (catId: string) => JSON.stringify(catVoice(catId));

/** E4, seven semitones above A3. */
const HADU_RUNG = 28;
const BOTTOM_HZ = rungHz(0);
const TOP_HZ = rungHz(RUNGS - 1);

/** How many cats of each rarity a clan has when the catalogue is full. */
const CLAN: Record<Rarity, number> = {
  common: 8,
  uncommon: 5,
  rare: 4,
  epic: 2,
  legendary: 1,
};

/** A catalogue the size the real one is meant to reach: 102 cats. */
function fullCatalogue(): Voiced[] {
  const clans = ELEMENTS.flatMap((element) =>
    RARITIES.flatMap((rarity) =>
      Array.from({ length: CLAN[rarity] }, (_, i): Voiced => {
        const archetype = ARCHETYPES[i % ARCHETYPES.length] ?? "tank";
        return { id: `${element}-${rarity}-${i}`, element, archetype, rarity };
      }),
    ),
  );
  return [
    ...clans,
    {
      id: "hadu",
      element: "shade",
      archetype: "familiar",
      rarity: "legendary",
    },
    {
      id: "stussy",
      element: "flame",
      archetype: "familiar",
      rarity: "legendary",
    },
  ];
}

/** What every voice must keep to, whoever it belongs to. */
function expectInBounds(voice: Voice, who: string) {
  expect(voice.length, who).toBeGreaterThan(0);
  expect(voiceSeconds(voice), who).toBeLessThanOrEqual(VOICE_SECONDS);
  for (const note of voice) {
    expect(["triangle", "sine", "square"], who).toContain(note.wave);
    expect(note.gain, who).toBeGreaterThan(0);
    expect(note.gain, who).toBeLessThanOrEqual(
      note.wave === "square" ? SQUARE_GAIN : LIMITS.gain,
    );
    for (const hz of [note.from, note.to]) {
      expect(hz, who).toBeGreaterThanOrEqual(LIMITS.minHz);
      expect(hz, who).toBeLessThanOrEqual(LIMITS.maxHz);
    }
    expect(note.at, who).toBeGreaterThanOrEqual(0);
    expect(note.attack, who).toBeGreaterThan(0);
    expect(note.decay, who).toBeGreaterThan(0);
  }
}

describe("cat voices", () => {
  it("has a voice for every cat in the catalogue", () => {
    const pick = JSON.stringify(recipe("pick"));
    for (const cat of CAT_LIST) {
      expect(catPitch(cat.id), cat.id).not.toBeNull();
      expect(catVoice(cat.id).length, cat.id).toBeGreaterThan(0);
      expect(key(cat.id), cat.id).not.toBe(pick);
    }
  });

  it("gives no two cats the same voice, or the same pitch", () => {
    expect(new Set(CAT_LIST.map((cat) => key(cat.id))).size).toBe(
      CAT_LIST.length,
    );
    const pitches = CAT_LIST.map((cat) => catPitch(cat.id)?.toFixed(3));
    expect(new Set(pitches).size).toBe(CAT_LIST.length);
  });

  it("keeps every pitch on the ladder, from A3 to its top rung", () => {
    expect(BOTTOM_HZ).toBe(220);
    expect(TOP_HZ).toBeCloseTo(945.89, 2);
    for (const cat of CAT_LIST) {
      expect(catPitch(cat.id), cat.id).toBeGreaterThanOrEqual(BOTTOM_HZ);
      expect(catPitch(cat.id), cat.id).toBeLessThanOrEqual(TOP_HZ);
    }
  });

  it("spreads a catalogue smaller than the ladder over all of it", () => {
    const pitches = CAT_LIST.map((cat) => catPitch(cat.id) ?? 0);
    expect(Math.min(...pitches)).toBe(BOTTOM_HZ);
    expect(Math.max(...pitches)).toBe(TOP_HZ);
  });

  it("keeps Hadu on E4", () => {
    expect(catPitch("hadu")).toBeCloseTo(329.63, 2);
    expect(catPitch("hadu")).toBe(rungHz(HADU_RUNG));
  });

  it("says the same thing every time a cat is asked", () => {
    for (const cat of CAT_LIST) {
      expect(catPitch(cat.id), cat.id).toBe(catPitch(cat.id));
      expect(catVoice(cat.id), cat.id).toEqual(catVoice(cat.id));
      expect(catInflection(cat.id), cat.id).toBe(catInflection(cat.id));
    }
  });

  it("keeps every note inside its bounds", () => {
    for (const cat of CAT_LIST) {
      for (const note of catVoice(cat.id)) {
        expect(note.gain, cat.id).toBeGreaterThan(0);
        expect(note.gain, cat.id).toBeLessThanOrEqual(LIMITS.gain);
        for (const hz of [note.from, note.to]) {
          expect(hz, cat.id).toBeGreaterThanOrEqual(LIMITS.minHz);
          expect(hz, cat.id).toBeLessThanOrEqual(LIMITS.maxHz);
        }
        expect(note.at, cat.id).toBeGreaterThanOrEqual(0);
        expect(note.attack, cat.id).toBeGreaterThan(0);
        expect(note.decay, cat.id).toBeGreaterThan(0);
      }
    }
  });

  it("is short: a cat is heard and the table moves on", () => {
    for (const cat of CAT_LIST) {
      expect(voiceSeconds(catVoice(cat.id)), cat.id).toBeLessThanOrEqual(
        VOICE_SECONDS,
      );
    }
  });

  it("uses the player's waves only, and keeps a square quiet", () => {
    for (const cat of CAT_LIST) {
      for (const note of catVoice(cat.id)) {
        expect(["triangle", "sine", "square"], cat.id).toContain(note.wave);
        if (note.wave === "square") {
          expect(note.gain, cat.id).toBeLessThanOrEqual(SQUARE_GAIN);
        }
      }
    }
  });

  it("takes longer over a legendary than over a lesser cat of its kind", () => {
    // Both are shade familiars; only Hadu signs off.
    expect(voiceSeconds(catVoice("hadu"))).toBeGreaterThan(
      voiceSeconds(catVoice("gloomtail")),
    );
    expect(catVoice("hadu").length).toBeGreaterThan(
      catVoice("gloomtail").length,
    );
  });

  it("falls back to a pick for a cat it does not know", () => {
    expect(catVoice("nobody")).toEqual(recipe("pick"));
    expect(catVoice("constructor")).toEqual(recipe("pick"));
    expect(catPitch("nobody")).toBeNull();
    expect(catPitch("constructor")).toBeNull();
  });
});

describe("the ladder", () => {
  it("gives a full catalogue every rung, each to one cat", () => {
    const cats = fullCatalogue();
    expect(cats).toHaveLength(RUNGS);

    const ladder = ladderFor(cats);
    const rungs = cats.map((cat) => ladder.get(cat.id));
    expect([...rungs].sort((a, b) => (a ?? 0) - (b ?? 0))).toEqual(
      Array.from({ length: RUNGS }, (_, rung) => rung),
    );
    for (const rung of rungs) {
      expect(rungHz(rung ?? -1)).toBeGreaterThanOrEqual(BOTTOM_HZ);
      expect(rungHz(rung ?? -1)).toBeLessThanOrEqual(TOP_HZ);
    }
  });

  it("keeps Hadu on E4 however many cats there are", () => {
    const cats = fullCatalogue();
    const hadu = cats.filter((cat) => cat.id === "hadu");
    const others = cats.filter((cat) => cat.id !== "hadu");
    for (const count of [1, 2, 26, 60, RUNGS]) {
      const some = [...others.slice(0, count - 1), ...hadu];
      expect(some).toHaveLength(count);
      expect(ladderFor(some).get("hadu"), `${count} cats`).toBe(HADU_RUNG);
    }
    expect([...ladderFor(others).values()]).toHaveLength(others.length);
    expect(ladderFor(others).has("hadu")).toBe(false);
  });

  it("gives every cat a rung of its own at any size up to the ladder's", () => {
    const cats = fullCatalogue();
    for (let count = 1; count <= cats.length; count++) {
      const ladder = ladderFor(cats.slice(-count));
      const rungs = new Set(ladder.values());
      expect(rungs.size, `${count} cats`).toBe(count);
      expect(Math.min(...rungs), `${count} cats`).toBeGreaterThanOrEqual(0);
      expect(Math.max(...rungs), `${count} cats`).toBeLessThan(RUNGS);
    }
  });

  it("goes up in order: clan, then kind, then rarity, then name", () => {
    const ladder = ladderFor([
      { id: "d", element: "volt", archetype: "tank", rarity: "common" },
      { id: "c", element: "shade", archetype: "scout", rarity: "common" },
      { id: "b", element: "shade", archetype: "tank", rarity: "rare" },
      { id: "z", element: "shade", archetype: "tank", rarity: "common" },
      { id: "a", element: "shade", archetype: "tank", rarity: "common" },
      { id: "e", element: "thorn", archetype: "mage", rarity: "epic" },
      { id: "f", element: "flame", archetype: "rogue", rarity: "common" },
      { id: "g", element: "mist", archetype: "bruiser", rarity: "common" },
    ]);
    const upward = [...ladder.keys()].sort(
      (a, b) => (ladder.get(a) ?? 0) - (ladder.get(b) ?? 0),
    );
    expect(upward).toEqual(["a", "z", "b", "c", "e", "f", "g", "d"]);
    expect(ladder.get("a")).toBe(0);
    expect(ladder.get("d")).toBe(RUNGS - 1);
  });

  it("does not depend on the order the cats are listed in", () => {
    const cats = fullCatalogue();
    expect(ladderFor([...cats].reverse())).toEqual(ladderFor(cats));
  });

  it("goes on above its top rung for a catalogue too big for it", () => {
    const extra = Array.from({ length: 8 }, (_, i): Voiced => ({
      id: `extra-${i}`,
      element: "volt",
      archetype: "scout",
      rarity: "common",
    }));
    const cats = [...fullCatalogue(), ...extra];
    const ladder = ladderFor(cats);
    expect(new Set(ladder.values()).size).toBe(cats.length);
    expect(Math.max(...ladder.values())).toBe(cats.length - 1);
    expect(ladder.get("hadu")).toBe(HADU_RUNG);
  });
});

describe("inflections", () => {
  it("gives every cat one of the four", () => {
    expect(INFLECTIONS).toHaveLength(4);
    for (const cat of CAT_LIST) {
      expect(INFLECTIONS, cat.id).toContain(catInflection(cat.id));
    }
  });

  it("does not give every cat the same one", () => {
    const heard = new Set(CAT_LIST.map((cat) => catInflection(cat.id)));
    expect(heard.size).toBeGreaterThanOrEqual(2);
  });

  it("says a cat's own inflection unless another is asked for", () => {
    for (const cat of CAT_LIST) {
      const hz = catPitch(cat.id) ?? 0;
      expect(catVoice(cat.id), cat.id).toEqual(
        voiceFor(cat, hz, catInflection(cat.id)),
      );
    }
  });

  it("makes four different voices of any kind of cat at one pitch", () => {
    for (const element of ELEMENTS) {
      for (const archetype of ARCHETYPES) {
        const cat: Voiced = { id: "any", element, archetype, rarity: "common" };
        const voices = INFLECTIONS.map((inflection) =>
          JSON.stringify(voiceFor(cat, 440, inflection)),
        );
        expect(new Set(voices).size, `${element} ${archetype}`).toBe(4);
      }
    }
  });

  it("keeps any cat there could be inside the limits, at either end", () => {
    const [signed = "hadu"] = Object.keys(SIGNATURE);
    for (const element of ELEMENTS) {
      for (const archetype of ARCHETYPES) {
        for (const rarity of RARITIES) {
          // A legendary is tried with a signature, the longest it can be.
          const id = rarity === "legendary" ? signed : "any";
          for (const inflection of INFLECTIONS) {
            for (const hz of [BOTTOM_HZ, TOP_HZ]) {
              expectInBounds(
                voiceFor({ id, element, archetype, rarity }, hz, inflection),
                `${element} ${archetype} ${rarity} ${inflection} at ${hz}`,
              );
            }
          }
        }
      }
    }
  });
});

describe("signatures", () => {
  it("has one for every legendary in the catalogue", () => {
    for (const cat of CAT_LIST.filter((c) => c.rarity === "legendary")) {
      expect(Object.hasOwn(SIGNATURE, cat.id), cat.id).toBe(true);
    }
  });

  it("has none for a cat that is not a legendary, or not a cat", () => {
    for (const catId of Object.keys(SIGNATURE)) {
      expect(Object.hasOwn(CATS, catId), catId).toBe(true);
      expect(CATS[catId]?.rarity, catId).toBe("legendary");
    }
  });

  it("is heard: a legendary without it is a shorter, smaller voice", () => {
    for (const catId of Object.keys(SIGNATURE)) {
      const cat = CATS[catId];
      const hz = catPitch(catId);
      if (!cat || hz === null) continue;
      const unsigned = voiceFor({ ...cat, id: "unsigned" }, hz, "plain");
      const signed = voiceFor(cat, hz, "plain");
      expect(signed.length, catId).toBe(unsigned.length + 3);
      expect(voiceSeconds(signed), catId).toBeGreaterThan(
        voiceSeconds(unsigned),
      );
    }
  });
});
