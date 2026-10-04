/**
 * Rivals: the scripted opponents of a run. A rival owns a small deck of
 * action cards and flips one after every player turn.
 *
 *   bank   bank a face-down cat worth `bankPoints`
 *   stash  gain `stashYarn` yarn, a point each
 *   raid   remove `raidDice` dice from the feeder
 *   burn   discard the best `burnCards` cats from the tray
 *   push   add 1 to its tally for this round's goal
 */

import type { RivalAction } from "./cats";

export interface Rival {
  id: string;
  name: string;
  boss: boolean;
  bankPoints: number;
  stashYarn: number;
  raidDice: number;
  burnCards: number;
  /** Added to the goal's par to make the rival's tally. */
  goalEdge: number;
  deck: readonly RivalAction[];
  /** The one line of rules text that sets this rival apart, if any. */
  trait: string | null;
  flavor: string;
}

function cards(counts: Partial<Record<RivalAction, number>>): RivalAction[] {
  return (Object.entries(counts) as [RivalAction, number][]).flatMap(
    ([action, n]) => Array.from({ length: n }, () => action),
  );
}

export const RIVALS: Record<string, Rival> = Object.fromEntries(
  [
    {
      id: "alley-tom",
      name: "Alley Tom",
      boss: false,
      bankPoints: 2,
      stashYarn: 1,
      raidDice: 1,
      burnCards: 1,
      goalEdge: 0,
      deck: cards({ bank: 4, stash: 2, raid: 2, burn: 1, push: 1 }),
      trait: null,
      flavor: "Has never planned anything and is doing fine.",
    },
    {
      id: "dockside-twins",
      name: "The Dockside Twins",
      boss: false,
      bankPoints: 2,
      stashYarn: 2,
      raidDice: 1,
      burnCards: 1,
      goalEdge: 0,
      deck: cards({ bank: 4, stash: 3, raid: 1, burn: 1, push: 1 }),
      trait: "Stashes 2 yarn at a time.",
      flavor: "One distracts you. The other is also distracting you.",
    },
    {
      id: "madame-mittens",
      name: "Madame Mittens",
      boss: true,
      bankPoints: 3,
      stashYarn: 1,
      raidDice: 2,
      burnCards: 1,
      goalEdge: 1,
      deck: cards({ bank: 4, stash: 2, raid: 3, push: 1 }),
      trait: "Raids take 2 dice, and she raids often.",
      flavor: "The feeder is hers. You are welcome to what she leaves.",
    },
    {
      id: "rooftop-syndicate",
      name: "The Rooftop Syndicate",
      boss: false,
      bankPoints: 3,
      stashYarn: 2,
      raidDice: 1,
      burnCards: 2,
      goalEdge: 0,
      deck: cards({ bank: 4, stash: 2, raid: 1, burn: 2, push: 1 }),
      trait: "Burns 2 tray cards at a time.",
      flavor: "Seven cats, one opinion, no minutes taken.",
    },
    {
      id: "the-archivist",
      name: "The Archivist",
      boss: false,
      bankPoints: 3,
      stashYarn: 2,
      raidDice: 1,
      burnCards: 1,
      goalEdge: 1,
      deck: cards({ bank: 4, stash: 2, raid: 1, burn: 1, push: 2 }),
      trait: "Starts every goal 1 ahead and pushes twice as often.",
      flavor: "Has a card for you already. It is not flattering.",
    },
    {
      id: "old-nine-lives",
      name: "Old Nine Lives",
      boss: true,
      bankPoints: 4,
      stashYarn: 1,
      raidDice: 2,
      burnCards: 1,
      goalEdge: 1,
      deck: cards({ bank: 5, stash: 2, raid: 1, burn: 1, push: 1 }),
      trait: "Banks more often, for 4 points each, and raids 2 dice.",
      flavor: "On the eighth. Not in a hurry.",
    },
  ].map((rival) => [rival.id, rival] as const),
);

export const RIVAL_LIST: Rival[] = Object.values(RIVALS);

export function getRival(rivalId: string): Rival {
  const rival = RIVALS[rivalId];
  if (!rival) throw new Error(`Unknown rival: ${rivalId}`);
  return rival;
}

/** The six matches of a run, in order. Matches 3 and 6 are bosses. */
export const GAUNTLET: readonly string[] = [
  "alley-tom",
  "dockside-twins",
  "madame-mittens",
  "rooftop-syndicate",
  "the-archivist",
  "old-nine-lives",
];
