import { describe, expect, it } from "vitest";

import { MAX_ROUNDS, simulateBattle, type Combatant } from "./battle";
import type { Element } from "./elements";
import { getSpecies } from "./species";
import { effectiveStats } from "./stats";

function fighter(
  id: string,
  element: Element,
  stats: Partial<Combatant["stats"]> = {},
): Combatant {
  return {
    id,
    name: id,
    speciesId: "flameclaw",
    element,
    stats: { hp: 150, attack: 40, defense: 25, speed: 30, affinity: 20, ...stats },
  };
}

function fromSpecies(id: string, speciesId: string, level: number): Combatant {
  const species = getSpecies(speciesId);
  return {
    id,
    name: species.name,
    speciesId,
    element: species.element,
    stats: effectiveStats(species, level, 0),
  };
}

describe("simulateBattle", () => {
  it("is deterministic for the same seed", () => {
    const a = [fighter("a1", "flame"), fighter("a2", "mist")];
    const b = [fighter("b1", "volt"), fighter("b2", "thorn")];
    const first = simulateBattle(a, b, "seed-1");
    const second = simulateBattle(a, b, "seed-1");
    expect(first).toEqual(second);
  });

  it("produces different fights for different seeds", () => {
    const a = [fighter("a1", "flame"), fighter("a2", "mist")];
    const b = [fighter("b1", "volt"), fighter("b2", "thorn")];
    const first = simulateBattle(a, b, "seed-1");
    const second = simulateBattle(a, b, "seed-2");
    expect(first.log).not.toEqual(second.log);
  });

  it("lets the far stronger team win", () => {
    const strong = [fromSpecies("s1", "aurelynx", 40), fromSpecies("s2", "nyxaroth", 40)];
    const weak = [fromSpecies("w1", "emberkit", 1), fromSpecies("w2", "sparkmew", 1)];
    for (const seed of ["a", "b", "c", "d", "e"]) {
      expect(simulateBattle(strong, weak, seed).winner).toBe("A");
      expect(simulateBattle(weak, strong, seed).winner).toBe("B");
    }
  });

  it("never exceeds the round cap and decides on remaining HP", () => {
    // Two immovable walls: enormous HP and defense, tiny attack.
    const wallA = [fighter("a1", "thorn", { hp: 90000, attack: 5, defense: 400, speed: 10 })];
    const wallB = [fighter("b1", "thorn", { hp: 60000, attack: 5, defense: 400, speed: 9 })];
    const result = simulateBattle(wallA, wallB, "stalemate");
    expect(result.rounds).toBe(MAX_ROUNDS);
    expect(result.remainingHpA).toBeGreaterThan(0);
    expect(result.remainingHpB).toBeGreaterThan(0);
    // A keeps a higher HP fraction, so A wins on the cap.
    expect(result.winner).toBe("A");
  });

  it("gives an exact HP tie at the cap to team B", () => {
    const a = [fighter("a1", "thorn", { hp: 50000, attack: 1, defense: 400, speed: 10 })];
    const b = [fighter("b1", "thorn", { hp: 50000, attack: 1, defense: 400, speed: 10 })];
    const result = simulateBattle(a, b, "tie");
    expect(result.rounds).toBe(MAX_ROUNDS);
    if (result.remainingHpA / 50000 === result.remainingHpB / 50000) {
      expect(result.winner).toBe("B");
    }
  });

  it("ends as soon as one side is wiped out", () => {
    const a = [fighter("a1", "flame", { attack: 900, speed: 99 })];
    const b = [fighter("b1", "thorn", { hp: 40, defense: 0, speed: 1 })];
    const result = simulateBattle(a, b, "sweep");
    expect(result.winner).toBe("A");
    expect(result.remainingHpB).toBe(0);
    expect(result.rounds).toBe(1);
    expect(result.log.at(-1)?.ko).toBe(true);
  });

  it("always deals at least 1 damage and logs coherent HP", () => {
    const a = [fighter("a1", "mist", { attack: 1 })];
    const b = [fighter("b1", "mist", { defense: 5000 })];
    const result = simulateBattle(a, b, "chip");
    for (const event of result.log) {
      expect(event.damage).toBeGreaterThanOrEqual(1);
      expect(event.targetHpAfter).toBeGreaterThanOrEqual(0);
      expect(event.round).toBeGreaterThanOrEqual(1);
      expect(event.round).toBeLessThanOrEqual(MAX_ROUNDS);
    }
  });

  it("respects the element wheel over many seeds", () => {
    const flame = [fighter("f", "flame")];
    const thorn = [fighter("t", "thorn")];
    const mist = [fighter("m", "mist")];
    let flameWins = 0;
    let mistWins = 0;
    for (let i = 0; i < 60; i++) {
      if (simulateBattle(flame, thorn, `w${i}`).winner === "A") flameWins += 1;
      if (simulateBattle(mist, thorn, `w${i}`).winner === "A") mistWins += 1;
    }
    expect(flameWins).toBeGreaterThan(mistWins);
  });

  it("handles uneven team sizes", () => {
    const a = [fighter("a1", "volt"), fighter("a2", "volt"), fighter("a3", "volt")];
    const b = [fighter("b1", "shade")];
    const result = simulateBattle(a, b, "outnumbered");
    expect(result.winner).toBe("A");
    expect(result.log.length).toBeGreaterThan(0);
  });
});
