/** How a profile lays out achievements: the whole catalogue, each held or not. */

import {
  ACHIEVEMENTS,
  getAchievement,
  type Achievement,
} from "~/server/game/achievements";

export interface ShelfAchievement extends Achievement {
  /** When it was earned; `null` while it is still to do. */
  earnedAt: Date | null;
}

/**
 * Every achievement in the catalogue's order, the ones held first, so a
 * profile opens on what its player has done. A held key the catalogue no
 * longer has is left out.
 */
export function achievementShelf(
  held: readonly { key: string; earnedAt: Date }[],
): ShelfAchievement[] {
  const when = new Map(held.map((a) => [a.key, a.earnedAt]));
  const all = ACHIEVEMENTS.map((rule): ShelfAchievement => ({
    ...getAchievement(rule.key),
    earnedAt: when.get(rule.key) ?? null,
  }));
  return [
    ...all.filter((a) => a.earnedAt !== null),
    ...all.filter((a) => a.earnedAt === null),
  ];
}
