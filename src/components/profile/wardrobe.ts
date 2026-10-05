/**
 * What the profile page says and decides: whether a piece is worn, owned or
 * still to be found, what a press on it puts on, and the one sentence that
 * says what the hadu is wearing. Every name is read from the game's own
 * tables.
 */

import {
  cosmeticsIn,
  DEFAULT_LOOK,
  getCosmetic,
  HADU_SLOTS,
  isCosmeticId,
  ownsCosmetic,
  SLOT_LABELS,
  type Cosmetic,
  type CosmeticSlot,
  type Look,
} from "~/server/game/cosmetics";
import { COSMETIC_PACKS } from "~/server/game/packs";

/** A piece as the account stands to it. */
export type Standing = "worn" | "owned" | "locked";

export function standingOf(
  cosmetic: Cosmetic,
  look: Look,
  gained: readonly string[],
): Standing {
  if (look[cosmetic.slot] === cosmetic.id) return "worn";
  return ownsCosmetic(cosmetic.id, gained) ? "owned" : "locked";
}

/**
 * What a press on an owned piece puts on in its slot. A piece not worn goes
 * on; the worn one comes off for the free piece; the free piece, worn, has
 * nothing under it to come off for, so the press changes nothing.
 */
export function pressWears(cosmetic: Cosmetic, look: Look): string | null {
  if (look[cosmetic.slot] !== cosmetic.id) return cosmetic.id;
  return cosmetic.free ? null : DEFAULT_LOOK[cosmetic.slot];
}

/** The pack a slot's pieces come out of, named as the shop names it. */
export function packNameOf(slot: CosmeticSlot): string {
  const pack = COSMETIC_PACKS.find((p) => p.slots.includes(slot));
  if (!pack) throw new Error(`No pack holds a ${slot}`);
  return /\bpack$/i.test(pack.name) ? pack.name : `${pack.name} pack`;
}

/** Why a piece cannot be put on yet. */
export function lockedNote(slot: CosmeticSlot): string {
  return `Found in the ${packNameOf(slot)}.`;
}

/** How many pieces of some slots the account has, of how many there are. */
export function ownedCount(
  slots: readonly CosmeticSlot[],
  gained: readonly string[],
): { owned: number; total: number } {
  const pieces = slots.flatMap(cosmeticsIn);
  return {
    owned: pieces.filter((piece) => ownsCosmetic(piece.id, gained)).length,
    total: pieces.length,
  };
}

/** "a", "a and b", "a, b and c". */
function listed(names: readonly string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

/** What the hadu has on, in one sentence. The free pieces go unsaid. */
export function wornSentence(look: Look): string {
  const worn = HADU_SLOTS.map((slot) => look[slot])
    .filter((id) => isCosmeticId(id) && !getCosmetic(id).free)
    .map((id) => getCosmetic(id).name);
  return worn.length === 0
    ? "Wearing nothing from the wardrobe. He came like this."
    : `Wearing ${listed(worn)}.`;
}

/** What a press has just changed, in one sentence. */
export function changeSentence(cosmetic: Cosmetic): string {
  if (cosmetic.free) return `Back to ${cosmetic.name}.`;
  return (HADU_SLOTS as readonly string[]).includes(cosmetic.slot)
    ? `${cosmetic.name} on.`
    : `${cosmetic.name} set for the ${SLOT_LABELS[cosmetic.slot].toLowerCase()}.`;
}

/** Why a press on a piece the account lacks did nothing. */
export function lockedSentence(cosmetic: Cosmetic): string {
  return `${cosmetic.name} is not yours yet. ${lockedNote(cosmetic.slot)}`;
}

/** What to say when the table would not take a change. */
export function refusedSentence(cosmetic: Cosmetic, reason: string): string {
  return `${cosmetic.name} did not go on. ${reason}`;
}
