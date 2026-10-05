/**
 * Clans: one for each element, with the charm it carries and the 16 cards
 * it once started a run on. Only rivals have a clan now: each holds its
 * clan's charm and draws its deck with that element first
 * (`rivalDecks.ts`). The starter decks are kept for the measuring harness
 * and the landing page's demo, and pin what a new account's rivals bring.
 */

import { ELEMENT_LABELS, type Element } from "./elements";
import { getRelic } from "./relics";

export interface Clan {
  id: Element;
  name: string;
  /** The charm a rival of this clan holds. */
  relicId: string;
  text: string;
}

function clan(id: Element, name: string, relicId: string): Clan {
  return {
    id,
    name,
    relicId,
    text: `A deck built around ${ELEMENT_LABELS[id]} cats. Starts with the ${getRelic(relicId).name}.`,
  };
}

export const CLANS: Record<Element, Clan> = {
  flame: clan("flame", "Cinder Clan", "ember-charm"),
  mist: clan("mist", "Tide Clan", "tide-charm"),
  volt: clan("volt", "Static Clan", "spark-charm"),
  thorn: clan("thorn", "Bramble Clan", "briar-charm"),
  shade: clan("shade", "Dusk Clan", "dusk-charm"),
};

export const CLAN_LIST: Clan[] = Object.values(CLANS);

export function isClanId(value: string): value is Element {
  return value in CLANS;
}

/**
 * The 16 cards each clan starts on: three of each of its two first commons,
 * two of its first uncommon, and one of every other clan's two first commons.
 * The lists are written out, not worked out from the catalogue, so that a cat
 * added to it changes no deck a run or a rival already starts with.
 */
const STARTER_DECKS: Record<Element, readonly string[]> = {
  flame: [
    "flameclaw",
    "flameclaw",
    "flameclaw",
    "emberkit",
    "emberkit",
    "emberkit",
    "cinderpounce",
    "cinderpounce",
    "mistpaw",
    "dewhisker",
    "voltwhisk",
    "sparkmew",
    "thornkit",
    "bramblepaw",
    "shadewhisker",
    "duskmew",
  ],
  mist: [
    "flameclaw",
    "emberkit",
    "mistpaw",
    "mistpaw",
    "mistpaw",
    "dewhisker",
    "dewhisker",
    "dewhisker",
    "brumefang",
    "brumefang",
    "voltwhisk",
    "sparkmew",
    "thornkit",
    "bramblepaw",
    "shadewhisker",
    "duskmew",
  ],
  volt: [
    "flameclaw",
    "emberkit",
    "mistpaw",
    "dewhisker",
    "voltwhisk",
    "voltwhisk",
    "voltwhisk",
    "sparkmew",
    "sparkmew",
    "sparkmew",
    "joltpad",
    "joltpad",
    "thornkit",
    "bramblepaw",
    "shadewhisker",
    "duskmew",
  ],
  thorn: [
    "flameclaw",
    "emberkit",
    "mistpaw",
    "dewhisker",
    "voltwhisk",
    "sparkmew",
    "thornkit",
    "thornkit",
    "thornkit",
    "bramblepaw",
    "bramblepaw",
    "bramblepaw",
    "burrfang",
    "burrfang",
    "shadewhisker",
    "duskmew",
  ],
  shade: [
    "flameclaw",
    "emberkit",
    "mistpaw",
    "dewhisker",
    "voltwhisk",
    "sparkmew",
    "thornkit",
    "bramblepaw",
    "shadewhisker",
    "shadewhisker",
    "shadewhisker",
    "duskmew",
    "duskmew",
    "duskmew",
    "gloomtail",
    "gloomtail",
  ],
};

/** A clan's 16 starting cards, in the order they are listed. */
export function starterDeck(clanId: Element): string[] {
  return [...STARTER_DECKS[clanId]];
}
