import { ImageResponse } from "next/og";

import {
  ARCHETYPE_SPRITES,
  SPRITE_SIZE,
} from "~/components/sprites/archetypes";
import { spriteColors } from "~/components/sprites/palettes";
import { getSpecies, STARTER_SPECIES_IDS } from "~/server/game/species";

/**
 * The share card. Everything here is drawn from the same modules the game
 * draws from — `ARCHETYPE_SPRITES`, `spriteColors`, `STARTER_SPECIES_IDS` —
 * all of which are pure TypeScript and safe on the edge runtime. Nothing from
 * `~/server/db`, `~/server/auth` or `~/env` may be imported into this route.
 */
export const runtime = "edge";

export const alt =
  "HaduMon — summon cats, send them to work, come back to the loot.";

export const size = { width: 1200, height: 630 };

export const contentType = "image/png";

/* Palette, spelled out: Satori has no Tailwind theme to read tokens from.
   These mirror `src/styles/globals.css`. */
const NAVY = "#0f0b1e";
const PANEL = "#1e1633";
const EDGE = "#4a3b7a";
const GOLD = "#f5c542";
const PINK = "#ff6fb5";
const INK = "#efe9ff";

const TAGLINE = "Summon cats. Send them to work. Come back to the loot.";

/** Press Start 2P is monospace at 1em, so a line's width is chars × size. */
const TAGLINE_SIZE = 28;
/** Wide enough for 35 characters, which breaks the tagline at its full stop. */
const TAGLINE_WIDTH = TAGLINE_SIZE * 35;

interface Run {
  x: number;
  y: number;
  width: number;
  fill: string;
}

/**
 * Merges horizontal runs of one colour into a single `<rect>`, the way
 * `PixelSprite` does, so three 32×32 cats stay a few hundred rects rather than
 * three thousand.
 */
function buildRuns(
  rows: readonly string[],
  colors: Record<string, string | null>,
): Run[] {
  const runs: Run[] = [];

  rows.forEach((row, y) => {
    let start = 0;
    let current: string | null = null;

    const flush = (endExclusive: number) => {
      if (current !== null && endExclusive > start) {
        runs.push({ x: start, y, width: endExclusive - start, fill: current });
      }
    };

    for (let x = 0; x < row.length; x++) {
      const fill = colors[row[x] ?? "."] ?? null;
      if (fill !== current) {
        flush(x);
        current = fill;
        start = x;
      }
    }
    flush(row.length);
  });

  return runs;
}

/** One starter, as inline SVG. Satori renders `<svg>` and its `<rect>`s. */
function Sprite({ speciesId, size: px }: { speciesId: string; size: number }) {
  const species = getSpecies(speciesId);
  const runs = buildRuns(
    ARCHETYPE_SPRITES[species.archetype],
    spriteColors(species.element, species.rarity),
  );

  return (
    <svg
      width={px}
      height={px}
      viewBox={`0 0 ${SPRITE_SIZE} ${SPRITE_SIZE}`}
      shapeRendering="crispEdges"
    >
      {runs.map((run) => (
        <rect
          key={`${run.y}-${run.x}`}
          x={run.x}
          y={run.y}
          width={run.width}
          height={1}
          fill={run.fill}
        />
      ))}
    </svg>
  );
}

export default async function Image() {
  // Press Start 2P by CodeMan38, licensed under the SIL Open Font License 1.1.
  // Satori needs a TTF, so the woff2 `next/font` serves is no use here.
  const pixelFont = await fetch(
    new URL("./fonts/PressStart2P-Regular.ttf", import.meta.url),
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: NAVY,
        fontFamily: "Press Start 2P",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: 1080,
          padding: "52px 56px",
          background: PANEL,
          border: `4px solid ${EDGE}`,
          /* The app's hard offset, scaled to the card. No blur, no radius. */
          boxShadow: "12px 12px 0 #000",
        }}
      >
        <div style={{ display: "flex", fontSize: 96, lineHeight: 1.2 }}>
          <span style={{ color: GOLD }}>Hadu</span>
          <span style={{ color: PINK }}>Mon</span>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 30,
            width: TAGLINE_WIDTH,
            fontSize: TAGLINE_SIZE,
            lineHeight: 1.6,
            color: INK,
          }}
        >
          {TAGLINE}
        </div>

        <div style={{ display: "flex", gap: 32, marginTop: 36 }}>
          {STARTER_SPECIES_IDS.map((speciesId) => (
            <Sprite key={speciesId} speciesId={speciesId} size={128} />
          ))}
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: "Press Start 2P",
          data: pixelFont,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}
