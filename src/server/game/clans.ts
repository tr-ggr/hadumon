/**
 * Clans: the five starter decks, one built around each element, and the
 * relic each one brings. A player picks a clan to start a run; a rival's
 * deck is built on one too (`rivalDecks.ts`).
 */

import { CAT_LIST } from "./cats";
import { ELEMENT_LABELS, type Element } from "./elements";
import { getRelic } from "./relics";

export interface Clan {
  id: Element;
  name: string;
  /** The relic every run with this clan starts with. */
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
 * 16 cards: three of each of the clan's commons, two of its uncommon, and one
 * of every other common.
 */
export function starterDeck(clanId: Element): string[] {
  const deck: string[] = [];
  for (const cat of CAT_LIST) {
    const own = cat.element === clanId;
    if (cat.rarity === "common") {
      deck.push(...Array.from({ length: own ? 3 : 1 }, () => cat.id));
    } else if (cat.rarity === "uncommon" && own) {
      deck.push(cat.id, cat.id);
    }
  }
  return deck;
}
