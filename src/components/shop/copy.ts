/**
 * What the shop says: a pack's standing on the shelf, the sentence in the
 * rail, and a pack's odds in words. Every number is read from the game's own
 * tables, so a sentence here cannot disagree with what a pack does.
 */

import { RARITIES, RARITY_LABELS, type Rarity } from "~/server/game/cats";
import { MAX_COPIES, MAX_LEGENDARY } from "~/server/game/collection";
import {
  DUPLICATE_REFUND,
  PACK_CARDS,
  SLOT_ODDS,
  type Pack,
} from "~/server/game/packs";

/** "1 coin", "240 coins". */
export function coins(n: number): string {
  return `${n} ${n === 1 ? "coin" : "coins"}`;
}

/** A pack named in a sentence: "the Cinder Pack", "the Wardrobe pack". */
export function packPhrase(pack: Pack): string {
  return /\bpack$/i.test(pack.name)
    ? `the ${pack.name}`
    : `the ${pack.name} pack`;
}

/** A pack named as a heading: "Cinder Pack", "Wardrobe pack". */
export function packHeading(pack: Pack): string {
  return /\bpack$/i.test(pack.name) ? pack.name : `${pack.name} pack`;
}

/** Why a pack cannot be opened, or that it can. */
export type Standing =
  | { can: true }
  /** Every piece of a cosmetic pack is already the account's. */
  | { can: false; reason: "complete"; why: string }
  /** The balance is under the price, by `short`. */
  | { can: false; reason: "short"; short: number; why: string };

/**
 * Whether a pack can be opened with `balance` coins. `left` is what a
 * cosmetic pack has left to find, and `null` for a cat pack. A pack with
 * nothing left says so before it says anything about coins.
 */
export function standing(
  price: number,
  left: number | null,
  balance: number,
): Standing {
  if (left !== null && left <= 0) {
    return {
      can: false,
      reason: "complete",
      why: "You have everything in this pack.",
    };
  }
  if (balance < price) {
    const short = price - balance;
    return {
      can: false,
      reason: "short",
      short,
      why:
        balance <= 0
          ? `It is ${coins(price)} and you have none.`
          : `It is ${coins(price)} and you have ${balance}: ${short} more to go.`,
    };
  }
  return { can: true };
}

/** The rail's sentence for the pack in the middle of the shelf. */
export function shelfSentence(
  pack: Pack,
  price: number,
  left: number | null,
  balance: number,
): string {
  const state = standing(price, left, balance);
  if (state.can) {
    return `Open ${packPhrase(pack)} for ${coins(price)}. You have ${balance}.`;
  }
  if (state.reason === "complete") return state.why;
  return balance <= 0
    ? `${capital(packPhrase(pack))} is ${coins(price)}. You have none.`
    : `${capital(packPhrase(pack))} is ${coins(price)}. You have ${balance}: ${state.short} more to go.`;
}

function capital(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** How many pieces of a cosmetic pack are still to be found, in words. */
export function leftToFind(left: number, total: number): string {
  if (left <= 0) return `All ${total} found.`;
  return `${left} of ${total} still to find.`;
}

export interface OddsLine {
  /** Which cards of the five: "Cards 1 to 3", "Card 5". */
  cards: string;
  /** Their chances, most likely first: "75 in 100 common, 25 in 100 uncommon". */
  chances: string;
}

/**
 * A cat pack's odds, a line to each run of cards that share them. The
 * chances are the game's own, out of a hundred, and are not rounded.
 */
export function oddsLines(): OddsLine[] {
  const lines: { from: number; to: number; chances: string }[] = [];
  SLOT_ODDS.forEach((odds, index) => {
    const chances = RARITIES.filter((rarity) => (odds[rarity] ?? 0) > 0)
      .sort((a, b) => (odds[b] ?? 0) - (odds[a] ?? 0))
      .map((rarity) => `${odds[rarity]} in 100 ${rarityWord(rarity)}`)
      .join(", ");
    const last = lines[lines.length - 1];
    if (last?.chances === chances) last.to = index + 1;
    else lines.push({ from: index + 1, to: index + 1, chances });
  });
  return lines.map(({ from, to, chances }) => ({
    cards: from === to ? `Card ${from}` : `Cards ${from} to ${to}`,
    chances,
  }));
}

/** A rarity inside a sentence: "common", "legendary". */
export function rarityWord(rarity: Rarity): string {
  return RARITY_LABELS[rarity].toLowerCase();
}

/** How many of one cat an account can hold, as a sentence. */
export function copiesRule(): string {
  return `You can hold ${MAX_COPIES} of a cat, and ${MAX_LEGENDARY} of a legendary.`;
}

/** What a cat past that pays back, by rarity, as a sentence. */
export function refundRule(): string {
  const each = RARITIES.map(
    (rarity) =>
      `${DUPLICATE_REFUND[rarity]} for ${article(rarity)} ${rarityWord(rarity)}`,
  );
  const last = each.pop() ?? "";
  return `One you have no room for pays coins back: ${each.join(", ")} and ${last}.`;
}

function article(rarity: Rarity): string {
  return /^[aeiou]/.test(rarity) ? "an" : "a";
}

/** What a cat pack holds, said once above its odds. */
export function catPackRule(found: number): string {
  return `${PACK_CARDS} cats a pack, from the ${found} here. A cat can come up twice.`;
}
