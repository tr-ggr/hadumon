import { describe, expect, it } from "vitest";

import { CAT_LIST } from "~/server/game/cats";
import type { PackResult } from "~/server/game/packs";

import {
  advance,
  allUp,
  beginReveal,
  cutOpen,
  deal,
  DEAL_MS,
  heldBack,
  holdAfter,
  nextDown,
  noteSentence,
  PHASE_MS,
  phaseMs,
  PHASES,
  pulled,
  pullLine,
  pullNote,
  revealSentence,
  summary,
  tell,
  turn,
  TURN_GAP_MS,
  turnRest,
  type Pace,
  type Phase,
  type Reveal,
} from "./reveal";

const common = CAT_LIST.find((cat) => cat.rarity === "common")!;
const other = CAT_LIST.find(
  (cat) => cat.rarity === "common" && cat.id !== common.id,
)!;
const rare = CAT_LIST.find((cat) => cat.rarity === "rare")!;
const epic = CAT_LIST.find((cat) => cat.rarity === "epic")!;
const legendary = CAT_LIST.find((cat) => cat.rarity === "legendary")!;

/** Five cats: a new one twice, a full one, another kept, a full legendary. */
const CATS: PackResult = {
  kind: "cats",
  packId: "cinder-pack",
  cats: [
    { catId: other.id, kept: true, refund: 0 },
    { catId: common.id, kept: false, refund: 4 },
    { catId: other.id, kept: true, refund: 0 },
    { catId: other.id, kept: true, refund: 0 },
    { catId: legendary.id, kept: false, refund: 150 },
  ],
  refund: 154,
};
const PIECES: PackResult = {
  kind: "cosmetics",
  packId: "wardrobe-pack",
  pieces: ["hat-wool-cap", "tail-ringed"],
};

const begin = (result: PackResult = CATS, pace: Pace = "full") =>
  beginReveal("press-1", result, { [common.id]: 3, [legendary.id]: 1 }, pace);
/** Past the wrapper, with the cards on the board. */
const dealt = (result: PackResult = CATS) => deal(begin(result));
const turnEvery = (reveal: Reveal) =>
  reveal.up.reduce((now, _, index) => turn(now, index), reveal);
/** A wrapper played as its timer plays it, with the cut made when it waits. */
const played = (pace: Pace) => {
  const phases: Phase[] = [];
  let reveal = begin(CATS, pace);
  for (let i = 0; i < PHASES.length + 1; i++) {
    phases.push(reveal.phase);
    reveal = reveal.phase === "ready" ? cutOpen(reveal) : advance(reveal);
  }
  return { phases, reveal };
};

describe("beginReveal", () => {
  it("starts with the pack raised and everything face down", () => {
    const reveal = begin();
    expect(reveal.phase).toBe("raised");
    expect(reveal.up).toEqual([false, false, false, false, false]);
    expect(pulled(reveal.result)).toBe(5);
    expect(allUp(reveal)).toBe(false);
  });

  it("with reduced motion, starts with everything turned over and nothing to cut", () => {
    const reveal = begin(CATS, "calm");
    expect(reveal.phase).toBe("dealt");
    expect(reveal.up).toEqual([true, true, true, true, true]);
    expect(allUp(reveal)).toBe(true);
    expect(heldBack(reveal)).toBe(0);
    expect(phaseMs(reveal)).toBeNull();
    expect(reveal.flown).toBe(false);
  });
});

describe("the wrapper", () => {
  it("is raised, cut, burnt and dealt in that order, and then stays dealt", () => {
    expect(played("full").phases).toEqual([...PHASES, "dealt"]);
  });

  it("waits to be cut the first time, and not on a pack opened after it", () => {
    const waiting = advance(begin());
    expect(waiting.phase).toBe("ready");
    expect(phaseMs(waiting)).toBeNull();
    // Its timer never takes it past the wait: only the cut does.
    expect(advance(waiting)).toBe(waiting);
    expect(cutOpen(waiting).phase).toBe("cut");
    expect(played("short").phases).toEqual([
      "raised",
      "cut",
      "burnt",
      "flash",
      "dealt",
      "dealt",
      "dealt",
    ]);
  });

  it("is cut only while it waits for it", () => {
    const raised = begin();
    expect(cutOpen(raised)).toBe(raised);
    const there = dealt();
    expect(cutOpen(there)).toBe(there);
  });

  it("times every phase but the wait and the end, and the short one faster", () => {
    for (const phase of PHASES) {
      const full = PHASE_MS.full[phase];
      const short = PHASE_MS.short[phase];
      if (phase === "ready" || phase === "dealt") {
        expect(full, phase).toBeUndefined();
        expect(short, phase).toBeUndefined();
        continue;
      }
      expect(full, phase).toBeGreaterThan(0);
      expect(short, phase).toBeLessThan(full!);
    }
    const whole = (pace: "full" | "short") =>
      Object.values(PHASE_MS[pace]).reduce((sum, ms) => sum + ms, 0) +
      DEAL_MS[pace].fly +
      DEAL_MS[pace].gap * 4;
    // Four to five seconds with a cut made in good time, and under two after.
    expect(whole("full")).toBeGreaterThan(2800);
    expect(whole("full")).toBeLessThan(3600);
    expect(whole("short")).toBeLessThan(2000);
  });

  it("can be skipped straight to the cards", () => {
    expect(deal(begin()).phase).toBe("dealt");
    const there = dealt();
    expect(deal(there)).toBe(there);
  });

  it("sends its cards flying only when it was played to its end", () => {
    expect(played("full").reveal.flown).toBe(true);
    expect(played("short").reveal.flown).toBe(true);
    expect(dealt().flown).toBe(false);
    expect(deal(advance(begin())).flown).toBe(false);
  });
});

describe("tell", () => {
  const pack = (ids: readonly string[]): PackResult => ({
    kind: "cats",
    packId: "cinder-pack",
    cats: ids.map((catId) => ({ catId, kept: true, refund: 0 })),
    refund: 0,
  });
  const reveal = dealt(pack([common.id, rare.id, epic.id, legendary.id]));

  it("gives away a card that is rare or better, and no other", () => {
    expect(tell(reveal, 0)).toBeNull();
    expect(tell(reveal, 1)).toBe("rare");
    expect(tell(reveal, 2)).toBe("epic");
    expect(tell(reveal, 3)).toBe("legendary");
    expect(tell(reveal, 9)).toBeNull();
  });

  it("reads a piece's rarity as it does a cat's", () => {
    expect(tell(dealt(PIECES), 0)).toBeNull();
  });

  it("holds the board longer after an epic, and longer still after a legendary", () => {
    expect(holdAfter(reveal, null)).toBe(TURN_GAP_MS);
    expect(holdAfter(reveal, 0)).toBe(TURN_GAP_MS);
    expect(holdAfter(reveal, 1)).toBe(TURN_GAP_MS);
    expect(holdAfter(reveal, 2)).toBe(TURN_GAP_MS + 250);
    expect(holdAfter(reveal, 3)).toBe(TURN_GAP_MS + 450);
  });
});

describe("turn", () => {
  it("turns the card pressed and no other", () => {
    const reveal = turn(dealt(), 2);
    expect(reveal.up).toEqual([false, false, true, false, false]);
    expect(reveal.last).toBe(2);
    expect(nextDown(reveal)).toBe(0);
  });

  it("changes nothing for a card that is up, or not there", () => {
    const once = turn(dealt(), 2);
    expect(turn(once, 2)).toBe(once);
    expect(turn(once, 9)).toBe(once);
    expect(turn(once, -1)).toBe(once);
  });

  it("does not change the reveal it was given", () => {
    const before = dealt();
    turn(before, 0);
    expect(before.up).toEqual([false, false, false, false, false]);
    expect(before.last).toBeNull();
  });

  it("is over when the last card is up", () => {
    const reveal = turnEvery(dealt());
    expect(allUp(reveal)).toBe(true);
    expect(nextDown(reveal)).toBe(-1);
  });
});

describe("turnRest", () => {
  it("turns the rest one after another until none is left", () => {
    let reveal = turnRest(turn(dealt(), 0));
    expect(reveal.turningAll).toBe(true);
    while (!allUp(reveal)) {
      expect(reveal.turningAll).toBe(true);
      reveal = turn(reveal, nextDown(reveal));
    }
    expect(reveal.turningAll).toBe(false);
    expect(reveal.byHand).toBe(false);
  });

  it("has nothing to do once everything is up", () => {
    const done = turnEvery(dealt());
    expect(turnRest(done)).toBe(done);
  });
});

describe("heldBack", () => {
  it("keeps a refund out of the purse until its card is up", () => {
    let reveal = dealt();
    expect(heldBack(reveal)).toBe(154);
    reveal = turn(reveal, 0);
    expect(heldBack(reveal)).toBe(154);
    reveal = turn(reveal, 1);
    expect(heldBack(reveal)).toBe(150);
    reveal = turn(reveal, 4);
    expect(heldBack(reveal)).toBe(0);
  });

  it("holds nothing back for a cosmetic pack", () => {
    expect(heldBack(dealt(PIECES))).toBe(0);
  });
});

describe("pullNote", () => {
  const reveal = dealt();

  it("says a cat the account had none of is new", () => {
    expect(pullNote(reveal, 0)).toEqual({
      text: "New.",
      refund: 0,
      fresh: true,
    });
  });

  it("counts a second and third of the same cat in one pack", () => {
    expect(pullNote(reveal, 2)?.text).toBe("Copy 2 of 4.");
    expect(pullNote(reveal, 3)?.text).toBe("Copy 3 of 4.");
  });

  it("says what a cat with no room paid back, by how many it could hold", () => {
    const full = pullNote(reveal, 1)!;
    expect(noteSentence(full)).toBe("Already have 4. 4 coins back.");
    const one = pullNote(reveal, 4)!;
    expect(noteSentence(one)).toBe("Already have 1. 150 coins back.");
  });

  it("says only that a cat was kept when what was held is not known", () => {
    const blind = beginReveal("press-2", CATS, null, "full");
    expect(pullNote(blind, 0)?.text).toBe("Kept.");
    expect(noteSentence(pullNote(blind, 1)!)).toBe(
      "Already have 4. 4 coins back.",
    );
  });

  it("has no note for a piece, or for a card that is not there", () => {
    expect(pullNote(dealt(PIECES), 0)).toBeNull();
    expect(pullNote(reveal, 7)).toBeNull();
  });
});

describe("what the rail says", () => {
  it("says what the wrapper is doing before the cards are out", () => {
    const said = played("full")
      .phases.slice(0, 5)
      .map((phase) => revealSentence({ ...begin(), phase }, 46));
    expect(said).toEqual([
      "Off the shelf it comes.",
      "Cut the top off: drag across it, or press Enter.",
      "The top is off.",
      "The wrapper burns away.",
      "Out they come.",
    ]);
    const one: PackResult = { ...PIECES, pieces: ["hat-wool-cap"] };
    expect(revealSentence({ ...begin(one), phase: "flash" }, 46)).toBe(
      "Out it comes.",
    );
    expect(revealSentence(dealt(one), 46)).toBe(
      "1 piece, face down. Turn it over.",
    );
  });

  it("says what is on the board once they are", () => {
    expect(revealSentence(dealt(), 46)).toBe(
      "5 cards, face down. Turn them over.",
    );
    expect(revealSentence(dealt(PIECES), 90)).toBe(
      "2 pieces, face down. Turn them over.",
    );
  });

  it("names the card just turned and counts the rest", () => {
    expect(revealSentence(turn(dealt(), 1), 50)).toBe(
      `${common.name}, common. Already have 4. 4 coins back. 4 to go.`,
    );
    expect(revealSentence(turn(dealt(), 0), 46)).toBe(
      `${other.name}, common. New. 4 to go.`,
    );
  });

  it("names the last card turned by hand before it sums the pack", () => {
    const done = turnEvery(dealt());
    expect(revealSentence(done, 200)).toBe(
      `${legendary.name}, legendary. Already have 1. 150 coins back. 3 kept. 2 you had no room for: 154 coins back. You have 200 coins.`,
    );
  });

  it("does not read the rest out one by one when they are turned all at once", () => {
    let reveal = turnRest(dealt());
    expect(revealSentence(reveal, 46)).toBe("Turning them all over.");
    reveal = turn(reveal, 0);
    expect(revealSentence(reveal, 46)).toBe("Turning them all over.");
    while (!allUp(reveal)) reveal = turn(reveal, nextDown(reveal));
    expect(revealSentence(reveal, 200)).toBe(
      "3 kept. 2 you had no room for: 154 coins back. You have 200 coins.",
    );
  });

  it("sums a pack shown all at once, with reduced motion", () => {
    expect(revealSentence(begin(PIECES, "calm"), 90)).toBe(
      "2 new pieces. You have 90 coins.",
    );
  });

  it("names a piece by its slot and rarity", () => {
    expect(pullLine(dealt(PIECES), 0)).toBe("Wool Cap: hat, common.");
  });
});

describe("summary", () => {
  const all = (kept: boolean, refund: number): PackResult => ({
    kind: "cats",
    packId: "cinder-pack",
    cats: Array.from({ length: 5 }, () => ({
      catId: common.id,
      kept,
      refund,
    })),
    refund: refund * 5,
  });

  it("says when every cat was kept, and when none was", () => {
    expect(summary(dealt(all(true, 0)), 0)).toBe(
      "All 5 kept. You have 0 coins.",
    );
    expect(summary(dealt(all(false, 4)), 21)).toBe(
      "5 you had no room for: 20 coins back. You have 21 coins.",
    );
  });

  it("counts one piece as one", () => {
    const one: PackResult = { ...PIECES, pieces: ["hat-wool-cap"] };
    expect(summary(dealt(one), 1)).toBe("1 new piece. You have 1 coin.");
  });
});
