import { describe, expect, it } from "vitest";

import { standIn } from "./bot";
import { playMatch } from "./bot/arena";
import {
  ARCHETYPES,
  auraParts,
  CAT_LIST,
  catsByElement,
  catsByRarity,
  describeAura,
  describePower,
  getCat,
  powerParts,
  RARITIES,
  ROWS,
  type Cat,
  type Effect,
  type Rarity,
  type Timing,
  type Watched,
} from "./cats";
import { ELEMENTS } from "./elements";
import {
  applyAction,
  createMatch,
  ESSENCES,
  legalActions,
  placedCats,
  ROUND_TURNS,
  SIDES,
  type MatchConfig,
  type MatchState,
} from "./match";
import { createRng, type Rng } from "./rng";

/** The cats drawn from life, which stand outside an element's twenty. */
const FROM_LIFE = ["hadu", "stussy"];

/** How many cats of each rarity an element holds, the two from life aside. */
const ELEMENT_SHAPE: Record<Rarity, number> = {
  common: 8,
  uncommon: 5,
  rare: 4,
  epic: 2,
  legendary: 1,
};

/** The points a cat of each rarity may be worth, least and most. */
const POINTS: Record<Rarity, readonly [number, number]> = {
  common: [1, 3],
  uncommon: [2, 4],
  rare: [4, 5],
  epic: [5, 6],
  legendary: [8, 9],
};

const EFFECT_KINDS: Effect["kind"][] = [
  "essence",
  "wild",
  "yarnSelf",
  "yarnRow",
  "draw",
  "cache",
  "tuckDeck",
  "pounce",
  "tuckHand",
  "trade",
  "encore",
];

const TIMINGS: Timing[] = ["played", "activated", "roundEnd", "between"];

/** Everything about a cat that the engine reads. */
function rulesOf(cat: Cat): string {
  return JSON.stringify([
    [...cat.rows].sort(),
    cat.cost,
    cat.points,
    cat.yarnCap,
    cat.power,
    cat.aura,
  ]);
}

describe("cat catalogue", () => {
  it("has 102 cats in the documented rarity split", () => {
    expect(CAT_LIST).toHaveLength(102);
    expect(catsByRarity("common")).toHaveLength(40);
    expect(catsByRarity("uncommon")).toHaveLength(25);
    expect(catsByRarity("rare")).toHaveLength(20);
    expect(catsByRarity("epic")).toHaveLength(10);
    expect(catsByRarity("legendary")).toHaveLength(7);
  });

  it("gives every element twenty cats in one shape, and two from life besides", () => {
    for (const element of ELEMENTS) {
      const cats = catsByElement(element).filter(
        (cat) => !FROM_LIFE.includes(cat.id),
      );
      expect(cats, element).toHaveLength(20);
      for (const rarity of RARITIES) {
        expect(
          cats.filter((cat) => cat.rarity === rarity),
          `${element} ${rarity}`,
        ).toHaveLength(ELEMENT_SHAPE[rarity]);
      }
    }
    expect(FROM_LIFE.map((id) => getCat(id).rarity)).toEqual([
      "legendary",
      "legendary",
    ]);
    expect(getCat("hadu").element).toBe("shade");
    expect(getCat("stussy").element).toBe("flame");
  });

  it("names every cat once, with its id the name in lower case", () => {
    expect(new Set(CAT_LIST.map((cat) => cat.id)).size).toBe(CAT_LIST.length);
    expect(new Set(CAT_LIST.map((cat) => cat.name)).size).toBe(CAT_LIST.length);
    for (const cat of CAT_LIST) {
      expect(cat.name, cat.id).toMatch(/^[A-Z][a-z]+$/);
      expect(cat.id).toBe(cat.name.toLowerCase());
    }
  });

  it("says something of every cat, in a sentence", () => {
    for (const cat of CAT_LIST) {
      expect(cat.flavor, cat.id).toMatch(/^[A-Z].+\.$/);
    }
  });

  it("gives every cat playable rules", () => {
    for (const cat of CAT_LIST) {
      expect(cat.rows.length).toBeGreaterThan(0);
      expect(new Set(cat.rows).size, cat.id).toBe(cat.rows.length);
      expect(cat.rows.every((row) => ROWS.includes(row))).toBe(true);
      expect(cat.cost.length).toBeGreaterThanOrEqual(1);
      expect(cat.cost.length).toBeLessThanOrEqual(4);
      expect(cat.points).toBeGreaterThan(0);
      expect(cat.yarnCap).toBeGreaterThan(0);
    }
  });

  it("costs a cat what its rarity costs, in its own food", () => {
    for (const cat of CAT_LIST) {
      // Hadu is the one cat that eats anything.
      if (cat.id === "hadu") continue;
      const own = cat.element;
      const allowed = {
        common: [[own], ["any"], ["any", "any"]],
        uncommon: [[own, "any"]],
        rare: [[own, own, "any"]],
        epic: [[own, own, "any"]],
        legendary: [[own, own, "any", "any"]],
      }[cat.rarity];
      expect(allowed, cat.id).toContainEqual([...cat.cost]);
    }
    expect(getCat("hadu").cost).toEqual(["any", "any", "any"]);
  });

  it("is worth what its rarity is worth", () => {
    for (const cat of CAT_LIST) {
      if (cat.id === "hadu") continue;
      const [least, most] = POINTS[cat.rarity];
      expect(cat.points, cat.id).toBeGreaterThanOrEqual(least);
      expect(cat.points, cat.id).toBeLessThanOrEqual(most);
      expect(cat.yarnCap, cat.id).toBeGreaterThanOrEqual(2);
      expect(cat.yarnCap, cat.id).toBeLessThanOrEqual(6);
    }
    // Above every other cat, as the game's namesake.
    expect(getCat("hadu").points).toBe(10);
    expect(getCat("hadu").yarnCap).toBe(9);
  });

  it("keeps every power's numbers small", () => {
    for (const cat of CAT_LIST) {
      const power = cat.power;
      if (!power) continue;
      const effect = power.effect;
      const epicRoundEnd = cat.rarity === "epic" && power.timing === "roundEnd";
      switch (effect.kind) {
        case "essence":
          expect(effect.element, cat.id).toBe(cat.element);
          expect(effect.n, cat.id).toBeLessThanOrEqual(2);
          break;
        case "wild":
          expect(effect.n, cat.id).toBeLessThanOrEqual(epicRoundEnd ? 2 : 1);
          break;
        case "yarnSelf":
          expect(effect.n, cat.id).toBeLessThanOrEqual(3);
          break;
        case "yarnRow":
          expect(effect.n, cat.id).toBe(1);
          break;
        case "draw":
        case "cache":
        case "tuckDeck":
          expect(effect.n, cat.id).toBeLessThanOrEqual(2);
          break;
        case "pounce":
          expect(effect.maxPoints, cat.id).toBeGreaterThanOrEqual(2);
          expect(effect.maxPoints, cat.id).toBeLessThanOrEqual(4);
          break;
        case "tuckHand":
          expect(effect.draw, cat.id).toBeLessThanOrEqual(2);
          break;
        case "trade":
        case "encore":
          break;
      }
    }
  });

  it("keeps the strongest powers for the rarer cats", () => {
    const rank = (cat: Cat) => RARITIES.indexOf(cat.rarity);
    for (const cat of CAT_LIST) {
      const power = cat.power;
      if (!power) continue;
      if (power.effect.kind === "encore") {
        expect(rank(cat), cat.id).toBeGreaterThanOrEqual(
          RARITIES.indexOf("rare"),
        );
      }
      if (power.timing === "between" && power.on === "any") {
        expect(rank(cat), cat.id).toBeGreaterThanOrEqual(
          RARITIES.indexOf("epic"),
        );
      }
    }
  });

  it("gives every legendary a relic, and no other cat", () => {
    for (const cat of CAT_LIST) {
      expect(cat.aura !== null, cat.id).toBe(cat.rarity === "legendary");
      if (cat.aura) {
        expect(cat.power, cat.id).not.toBeNull();
        expect(cat.aura.n, cat.id).toBe(1);
        expect(describeAura(cat.aura)).toMatch(/^Relic: from now on, .*\.$/);
      }
    }
    expect(describeAura({ kind: "treat", n: 1 })).toBe(
      "Relic: from now on, gain 1 Treat after each of your turns.",
    );
  });

  it("only offers a player choice on the player's own turn", () => {
    for (const cat of CAT_LIST) {
      if (!cat.power) continue;
      const choice =
        cat.power.effect.kind === "tuckHand" ||
        cat.power.effect.kind === "trade";
      if (choice) expect(["played", "activated"]).toContain(cat.power.timing);
    }
  });

  it("pairs no effect with a timing the engine does nothing for", () => {
    for (const cat of CAT_LIST) {
      if (!cat.power) continue;
      const { timing, effect } = cat.power;
      // A cat just played holds no yarn to trade, and the cats an encore
      // sets off are only ever fired on the turn that activated their row.
      if (effect.kind === "trade" || effect.kind === "encore") {
        expect(timing, cat.id).toBe("activated");
      }
    }
  });

  it("writes rules text for every power", () => {
    for (const cat of CAT_LIST) {
      if (!cat.power) continue;
      expect(describePower(cat.power)).toMatch(/^[A-Z].*\.$/);
    }
    expect(describePower(getCat("flameclaw").power!)).toBe(
      "When activated: gain 1 Beef.",
    );
    expect(describePower(getCat("brumefang").power!)).toBe(
      "Between turns: when the rival hunts, gain 1 Fish.",
    );
  });

  it("splits its rules text into a trigger and what it does, losing nothing", () => {
    for (const cat of CAT_LIST) {
      if (cat.power) {
        const { trigger, text } = powerParts(cat.power);
        expect(`${trigger}: ${text}`, cat.id).toBe(describePower(cat.power));
        expect(trigger, cat.id).toMatch(/^[A-Z][a-z ]+$/);
        expect(text, cat.id).toMatch(/^[a-z].*\.$/);
      }
      if (cat.aura) {
        const { trigger, text } = auraParts(cat.aura);
        expect(`${trigger}: ${text}`, cat.id).toBe(describeAura(cat.aura));
        expect(trigger, cat.id).toBe("Relic");
      }
    }
    expect(powerParts(getCat("brumefang").power!)).toEqual({
      trigger: "Between turns",
      text: "when the rival hunts, gain 1 Fish.",
    });
  });

  it("has its watchers answer the rival's Hunt, Den, Prowl and every turn", () => {
    const watched = new Set<Watched>(
      CAT_LIST.flatMap((cat) =>
        cat.power?.timing === "between" ? [cat.power.on] : [],
      ),
    );
    expect([...watched].sort()).toEqual(["any", "den", "hunt", "prowl"]);
    expect(describePower(getCat("nyxaroth").power!)).toBe(
      "Between turns: after each of the rival's turns, lay 1 yarn on this cat.",
    );
  });

  it("gives every element all six kinds of cat, and cats for each row", () => {
    for (const element of ELEMENTS) {
      const cats = catsByElement(element);
      for (const archetype of ARCHETYPES) {
        expect(
          cats.some((cat) => cat.archetype === archetype),
          `${element} ${archetype}`,
        ).toBe(true);
      }
      for (const row of ROWS) {
        for (const rarity of ["common", "uncommon", "rare"] as const) {
          expect(
            cats.some((cat) => cat.rarity === rarity && cat.rows.includes(row)),
            `${element} ${rarity} ${row}`,
          ).toBe(true);
        }
      }
    }
  });

  it("uses every effect and every timing on three cats or more", () => {
    for (const kind of EFFECT_KINDS) {
      const cats = CAT_LIST.filter((cat) => cat.power?.effect.kind === kind);
      expect(cats.length, kind).toBeGreaterThanOrEqual(3);
    }
    for (const timing of TIMINGS) {
      const cats = CAT_LIST.filter((cat) => cat.power?.timing === timing);
      expect(cats.length, timing).toBeGreaterThanOrEqual(3);
    }
  });

  it("gives no two cats the same rules", () => {
    const owners = new Map<string, string>();
    for (const cat of CAT_LIST) {
      const rules = rulesOf(cat);
      expect(owners.get(rules), `${cat.id} repeats`).toBeUndefined();
      owners.set(rules, cat.id);
    }
  });

  it("leaves the first 26 cats as they were", () => {
    expect(CAT_LIST.slice(0, 4).map((cat) => cat.id)).toEqual([
      "flameclaw",
      "emberkit",
      "cinderpounce",
      "pyrelynx",
    ]);
    expect(getCat("bramblepaw")).toMatchObject({
      cost: ["any", "any"],
      points: 3,
      yarnCap: 5,
      power: null,
    });
    expect(getCat("hadu")).toMatchObject({
      rows: ["hunt", "den", "prowl"],
      power: { timing: "activated", effect: { kind: "encore" } },
      aura: { kind: "treat", n: 1 },
    });
  });

  it("makes Stussy a centrepiece of her own, not a second Hadu", () => {
    const stussy = getCat("stussy");
    const hadu = getCat("hadu");
    expect(stussy.rows).toEqual(["hunt", "den", "prowl"]);
    expect(stussy.power?.effect.kind).not.toBe(hadu.power?.effect.kind);
    expect(stussy.aura?.kind).not.toBe(hadu.aura?.kind);
    expect(stussy.cost).not.toEqual(hadu.cost);
  });

  it("throws on an unknown id", () => {
    expect(() => getCat("dogmon")).toThrow();
  });
});

const EVERY_CAT = CAT_LIST.map((cat) => cat.id);
const DECK_SIZE = 24;

/** Two decks of 24 dealt off one shuffle of the catalogue, so no cat is in both. */
function randomDecks(rng: Rng): [string[], string[]] {
  const shuffled = rng.shuffle(EVERY_CAT);
  return [
    shuffled.slice(0, DECK_SIZE),
    shuffled.slice(DECK_SIZE, 2 * DECK_SIZE),
  ];
}

function soakConfig(seed: string): MatchConfig {
  const [player, rival] = randomDecks(createRng(`${seed}:decks`));
  return {
    seed,
    rivalId: "alley-tom",
    level: 0,
    player: { deck: player, relics: [] },
    rival: { deck: rival, relics: [] },
  };
}

function boardIds(state: MatchState): string[] {
  return SIDES.flatMap((who) =>
    placedCats(state.sides[who].board).map((placed) => placed.catId),
  );
}

describe("the whole catalogue at the table", () => {
  /**
   * Random legal play, with a taste for playing a cat when one can be
   * played, so the powers get used and not only held. In a `fed` match both
   * seats sit down to a full pantry, or the dearest cats would stay in hand.
   */
  function walk(seed: string, fed: boolean, tryEvery: boolean): MatchState {
    const rng = createRng(`${seed}:walk`);
    let state = createMatch(soakConfig(seed));
    if (fed) {
      for (const who of SIDES) {
        for (const kind of ESSENCES) state.sides[who].essence[kind] = 12;
      }
    }
    let turns = 0;
    for (let guard = 0; guard < 600 && state.phase !== "over"; guard++) {
      const actions = legalActions(state);
      expect(actions.length, seed).toBeGreaterThan(0);
      if (tryEvery) {
        for (const action of actions) {
          expect(() => applyAction(state, action), seed).not.toThrow();
        }
      }
      const plays = actions.filter((action) => action.type === "play");
      const action =
        plays.length > 0 && rng.chance(0.6)
          ? rng.pick(plays)
          : rng.pick(actions);
      if (state.phase === "turn" && action.type !== "reroll") turns += 1;
      state = applyAction(state, action).state;
    }
    expect(state.phase, seed).toBe("over");
    expect(state.result, seed).not.toBeNull();
    expect(turns, seed).toBe(
      2 * ROUND_TURNS.reduce<number>((sum, n) => sum + n, 0),
    );
    expect(state.goalResults, seed).toHaveLength(ROUND_TURNS.length);
    return state;
  }

  it("plays 40 whole matches on random decks of 24 without an action failing", () => {
    const dealt = new Set<string>();
    const played = new Set<string>();
    for (let match = 0; match < 40; match++) {
      const seed = `soak-${match}`;
      for (const deck of randomDecks(createRng(`${seed}:decks`))) {
        expect(deck).toHaveLength(DECK_SIZE);
        for (const catId of deck) dealt.add(catId);
      }
      // Every action listed is tried in the first few; the rest are walked.
      const state = walk(seed, match % 2 === 1, match < 6);
      for (const catId of boardIds(state)) played.add(catId);
    }
    expect([...dealt].sort()).toEqual([...EVERY_CAT].sort());
    // Every cat came down onto a board somewhere, so every power was live.
    expect(EVERY_CAT.filter((catId) => !played.has(catId))).toEqual([]);
  }, 60_000);

  it("is played to the end by the bots, whatever they are dealt", () => {
    const bot = standIn(4);
    const played = new Set<string>();
    for (let match = 0; match < 8; match++) {
      const state = playMatch(soakConfig(`bots-${match}`), {
        player: bot,
        rival: bot,
      });
      expect(state.phase).toBe("over");
      expect(state.result).not.toBeNull();
      expect(state.goalResults).toHaveLength(ROUND_TURNS.length);
      for (const catId of boardIds(state)) played.add(catId);
    }
    // The bots put a good half of the catalogue to use between them.
    expect(played.size).toBeGreaterThan(CAT_LIST.length / 2);
  }, 60_000);
});
