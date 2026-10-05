/**
 * Rivals: the six opponents of a run. A rival sits across the table and
 * plays the same game on a board of its own. It has no stats: what sets one
 * apart is the clan its deck is built on (`rivalDecks.ts`) and its manner of
 * play (`bot/styles.ts`), and how well it plays is its level, which rises
 * with its place in the gauntlet and with the tier.
 */

import type { Element } from "./elements";

export interface Rival {
  id: string;
  name: string;
  boss: boolean;
  /** The clan its deck is built around; it holds that clan's charm. */
  theme: Element;
  /** How it plays, in one line. */
  trait: string;
  flavor: string;
}

export const RIVALS: Record<string, Rival> = Object.fromEntries(
  (
    [
      {
        id: "alley-tom",
        name: "Alley Tom",
        boss: false,
        theme: "thorn",
        trait:
          "Plays the first cat he can pay for and thinks about it afterwards.",
        flavor: "Has never planned anything and is doing fine.",
      },
      {
        id: "dockside-twins",
        name: "The Dockside Twins",
        boss: false,
        theme: "mist",
        trait: "Goes to the Den early and often; the yarn is the plan.",
        flavor: "One distracts you. The other is also distracting you.",
      },
      {
        id: "madame-mittens",
        name: "Madame Mittens",
        boss: true,
        theme: "flame",
        trait: "Hunts first. Counts what you need and takes that.",
        flavor: "The feeder is hers. You are welcome to what she leaves.",
      },
      {
        id: "rooftop-syndicate",
        name: "The Rooftop Syndicate",
        boss: false,
        theme: "volt",
        trait: "Fills rows wide before it builds anything tall.",
        flavor: "Seven cats, one opinion, no minutes taken.",
      },
      {
        id: "the-archivist",
        name: "The Archivist",
        boss: false,
        theme: "thorn",
        trait: "Plays the round goal, every round, to the last count.",
        flavor: "Has a card for you already. It is not flattering.",
      },
      {
        id: "old-nine-lives",
        name: "Old Nine Lives",
        boss: true,
        theme: "shade",
        trait: "No habits left. Takes whichever line scores.",
        flavor: "On the eighth. Not in a hurry.",
      },
    ] satisfies Rival[]
  ).map((rival) => [rival.id, rival] as const),
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
