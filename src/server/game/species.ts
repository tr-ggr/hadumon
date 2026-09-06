import type { Element } from "./elements";

export const RARITIES = ["common", "uncommon", "rare", "epic", "legendary"] as const;
export type Rarity = (typeof RARITIES)[number];

export const RARITY_LABELS: Record<Rarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

/** Base-stat multiplier applied to every stat of a species of this rarity. */
export const RARITY_MULTIPLIER: Record<Rarity, number> = {
  common: 1,
  uncommon: 1.15,
  rare: 1.35,
  epic: 1.6,
  legendary: 2,
};

export const ARCHETYPES = [
  "rogue",
  "bruiser",
  "familiar",
  "scout",
  "mage",
  "tank",
] as const;
export type Archetype = (typeof ARCHETYPES)[number];

export const ARCHETYPE_LABELS: Record<Archetype, string> = {
  rogue: "Rogue",
  bruiser: "Bruiser",
  familiar: "Familiar",
  scout: "Scout",
  mage: "Mage",
  tank: "Tank",
};

export interface BaseStats {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  affinity: number;
}

export interface Species {
  id: string;
  name: string;
  element: Element;
  rarity: Rarity;
  archetype: Archetype;
  baseStats: BaseStats;
  flavor: string;
}

function s(
  id: string,
  name: string,
  element: Element,
  rarity: Rarity,
  archetype: Archetype,
  baseStats: BaseStats,
  flavor: string,
): Species {
  return { id, name, element, rarity, archetype, baseStats, flavor };
}

/** The complete HaduMon catalogue. Ids are stable and used as DB keys. */
export const SPECIES: Record<string, Species> = Object.fromEntries(
  [
    /* ------------------------------------------------------------- flame */
    s("flameclaw", "Flameclaw", "flame", "common", "bruiser",
      { hp: 140, attack: 46, defense: 30, speed: 28, affinity: 16 },
      "Sharpens its claws on smouldering coals and purrs at the sparks."),
    s("emberkit", "Emberkit", "flame", "common", "scout",
      { hp: 120, attack: 36, defense: 24, speed: 44, affinity: 20 },
      "Leaves tiny scorch-marks wherever it naps."),
    s("cinderpounce", "Cinderpounce", "flame", "uncommon", "rogue",
      { hp: 126, attack: 50, defense: 26, speed: 46, affinity: 24 },
      "Strikes from a cloud of ash, then vanishes into the smoke."),
    s("pyrelynx", "Pyrelynx", "flame", "rare", "mage",
      { hp: 128, attack: 58, defense: 26, speed: 40, affinity: 52 },
      "Its whiskers trace burning sigils in the night air."),

    /* -------------------------------------------------------------- mist */
    s("mistpaw", "Mistpaw", "mist", "common", "scout",
      { hp: 124, attack: 34, defense: 26, speed: 42, affinity: 24 },
      "Pads across water without leaving a single ripple."),
    s("dewhisker", "Dewhisker", "mist", "common", "mage",
      { hp: 112, attack: 42, defense: 20, speed: 32, affinity: 36 },
      "Collects morning dew on its whiskers to read the weather."),
    s("brumefang", "Brumefang", "mist", "uncommon", "familiar",
      { hp: 134, attack: 42, defense: 32, speed: 36, affinity: 42 },
      "Sailors say a fog that follows you home is a Brumefang."),
    s("nimbustail", "Nimbustail", "mist", "rare", "familiar",
      { hp: 142, attack: 48, defense: 36, speed: 42, affinity: 56 },
      "Its tails trail thunderheads that smell of rain."),

    /* -------------------------------------------------------------- volt */
    s("voltwhisk", "Voltwhisk", "volt", "common", "scout",
      { hp: 118, attack: 38, defense: 22, speed: 48, affinity: 22 },
      "Static clings to its coat; petting it is a gamble."),
    s("sparkmew", "Sparkmew", "volt", "common", "mage",
      { hp: 110, attack: 44, defense: 20, speed: 34, affinity: 34 },
      "Mews in morse. Nobody has decoded it yet."),
    s("joltpad", "Joltpad", "volt", "uncommon", "rogue",
      { hp: 124, attack: 48, defense: 25, speed: 52, affinity: 26 },
      "Its paw-pads spark on stone, so it hunts on rooftops."),
    s("arcpurr", "Arcpurr", "volt", "rare", "bruiser",
      { hp: 158, attack: 60, defense: 40, speed: 38, affinity: 30 },
      "A purr you feel in your teeth from three rooms away."),

    /* ------------------------------------------------------------- thorn */
    s("thornkit", "Thornkit", "thorn", "common", "rogue",
      { hp: 116, attack: 42, defense: 24, speed: 40, affinity: 18 },
      "Hides in bramble patches and ambushes anything ankle-height."),
    s("bramblepaw", "Bramblepaw", "thorn", "common", "tank",
      { hp: 170, attack: 28, defense: 44, speed: 18, affinity: 16 },
      "Grows a hedge of burrs each spring and refuses to be brushed."),
    s("burrfang", "Burrfang", "thorn", "uncommon", "bruiser",
      { hp: 152, attack: 52, defense: 36, speed: 30, affinity: 20 },
      "Fangs like rose-thorns; a bite that takes root."),
    s("verdantmane", "Verdantmane", "thorn", "rare", "tank",
      { hp: 196, attack: 40, defense: 56, speed: 24, affinity: 28 },
      "Moss grows along its shoulders. It has not moved since Tuesday."),

    /* ------------------------------------------------------------- shade */
    s("shadewhisker", "Shadewhisker", "shade", "common", "rogue",
      { hp: 114, attack: 44, defense: 22, speed: 42, affinity: 20 },
      "Only its grin arrives on time; the rest catches up later."),
    s("duskmew", "Duskmew", "shade", "common", "mage",
      { hp: 108, attack: 45, defense: 19, speed: 33, affinity: 38 },
      "Sings the sun down every evening, whether it needs it or not."),
    s("gloomtail", "Gloomtail", "shade", "uncommon", "familiar",
      { hp: 130, attack: 44, defense: 30, speed: 38, affinity: 44 },
      "Keeps a spare shadow in case it loses the first."),
    s("umbralynx", "Umbralynx", "shade", "rare", "rogue",
      { hp: 134, attack: 60, defense: 28, speed: 58, affinity: 34 },
      "Steps between lamp-posts without crossing the light."),

    /* -------------------------------------------------------------- epic */
    s("infernomane", "Infernomane", "flame", "epic", "bruiser",
      { hp: 176, attack: 68, defense: 46, speed: 42, affinity: 36 },
      "Its mane is a slow wildfire that never quite catches."),
    s("stormsabre", "Stormsabre", "volt", "epic", "rogue",
      { hp: 148, attack: 66, defense: 34, speed: 66, affinity: 40 },
      "Thunder arrives after it does, apologising."),
    s("oraclemew", "Oraclemew", "mist", "epic", "mage",
      { hp: 140, attack: 64, defense: 32, speed: 46, affinity: 66 },
      "Reads futures in condensation. Charges in fish."),

    /* --------------------------------------------------------- legendary */
    s("nyxaroth", "Nyxaroth", "shade", "legendary", "familiar",
      { hp: 180, attack: 72, defense: 48, speed: 56, affinity: 70 },
      "Nine tails, one of which is always somewhere else."),
    s("aurelynx", "Aurelynx", "volt", "legendary", "tank",
      { hp: 230, attack: 60, defense: 68, speed: 40, affinity: 52 },
      "A living lightning rod in gilded plate. Storms ask permission."),
  ].map((sp) => [sp.id, sp] as const),
);

export const SPECIES_LIST: Species[] = Object.values(SPECIES);

export function getSpecies(speciesId: string): Species {
  const species = SPECIES[speciesId];
  if (!species) throw new Error(`Unknown species: ${speciesId}`);
  return species;
}

export function speciesByRarity(rarity: Rarity): Species[] {
  return SPECIES_LIST.filter((sp) => sp.rarity === rarity);
}

export function speciesByElement(element: Element): Species[] {
  return SPECIES_LIST.filter((sp) => sp.element === element);
}

/** The three commons every new trainer receives. */
export const STARTER_SPECIES_IDS = ["flameclaw", "mistpaw", "voltwhisk"] as const;
