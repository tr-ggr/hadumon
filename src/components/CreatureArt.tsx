import Image from "next/image";

import { getSpecies, SPECIES } from "~/server/game/species";

/** The single source of truth for project-bound creature art. */
export const CREATURE_ART_MANIFEST = Object.fromEntries(
  Object.keys(SPECIES).map((speciesId) => [
    speciesId,
    `/creatures/${speciesId}.webp`,
  ]),
) as Record<keyof typeof SPECIES, string>;

/** Stable accessible fallback text travels with the same manifest keys. */
export const CREATURE_ART_LABELS = Object.fromEntries(
  Object.keys(SPECIES).map((speciesId) => [
    speciesId,
    `${SPECIES[speciesId]?.name ?? speciesId} collectible`,
  ]),
) as Record<keyof typeof SPECIES, string>;

export type CreatureArtProps = {
  speciesId: string;
  size?: number;
  className?: string;
  label?: string;
  priority?: boolean;
  decorative?: boolean;
};

export function CreatureArt({
  speciesId,
  size = 96,
  className,
  label,
  priority = false,
  decorative = false,
}: CreatureArtProps) {
  const species = getSpecies(speciesId);
  const src = CREATURE_ART_MANIFEST[speciesId];

  if (!src) {
    throw new Error(`Missing creature art for species: ${speciesId}`);
  }

  return (
    <Image
      src={src}
      width={size}
      height={size}
      sizes={`${size}px`}
      alt={
        decorative
          ? ""
          : (label ??
            CREATURE_ART_LABELS[speciesId] ??
            `${species.name} collectible`)
      }
      aria-hidden={decorative ? true : undefined}
      priority={priority}
      unoptimized={true}
      className={`object-contain drop-shadow-[0_12px_12px_rgba(23,33,43,0.16)] ${className ?? ""}`}
    />
  );
}

export const MASCOT_ART = CREATURE_ART_MANIFEST.flameclaw!;
