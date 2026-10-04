import { ImageResponse } from "next/og";

import { buildRuns } from "~/components/PixelSprite";
import { SPRITE_SIZE, catSprite } from "~/components/sprites/cats";
import { spriteColors } from "~/components/sprites/palettes";
import { CAT_LIST, getCat } from "~/server/game/cats";

export const runtime = "edge";
export const alt =
  "HaduMon — a roguelike engine-builder about cats. Six rivals. Twelve turns each.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const MASCOT_ID = "flameclaw";
/** Edge length of one sprite pixel in the rendered image. */
const PIXEL = 26;

export default async function Image() {
  const mascot = getCat(MASCOT_ID);
  const runs = buildRuns(
    catSprite(MASCOT_ID),
    spriteColors(mascot.element, mascot.rarity, mascot.id),
  );

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        gap: 48,
        padding: 64,
        background: "#fff8e7",
        color: "#17212b",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <div
          style={{
            display: "flex",
            fontSize: 86,
            fontWeight: 900,
            letterSpacing: -5,
          }}
        >
          <span>Hadu</span>
          <span style={{ color: "#ff7163" }}>Mon</span>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 32,
            fontWeight: 700,
          }}
        >
          A roguelike engine-builder about cats. Six rivals. Twelve turns each.
        </div>
        <div style={{ display: "flex", marginTop: 42, gap: 14 }}>
          <span
            style={{
              display: "flex",
              background: "#1557d8",
              color: "white",
              borderRadius: 999,
              padding: "14px 24px",
              fontSize: 24,
              fontWeight: 800,
            }}
          >
            {CAT_LIST.length} elemental cats
          </span>
          <span
            style={{
              display: "flex",
              background: "#d8ff4f",
              borderRadius: 999,
              padding: "14px 24px",
              fontSize: 24,
              fontWeight: 800,
            }}
          >
            Nothing for sale
          </span>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          width: 460,
          height: 500,
          borderRadius: 32,
          background: "#a9ddf5",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* The sprite, one absolutely placed box per run of same-colour pixels. */}
        <div
          style={{
            display: "flex",
            position: "relative",
            width: SPRITE_SIZE * PIXEL,
            height: SPRITE_SIZE * PIXEL,
          }}
        >
          {runs.map((run) => (
            <div
              key={`${run.y}-${run.x}`}
              style={{
                position: "absolute",
                left: run.x * PIXEL,
                top: run.y * PIXEL,
                width: run.width * PIXEL,
                height: PIXEL,
                background: run.fill,
              }}
            />
          ))}
        </div>
      </div>
    </div>,
    { ...size },
  );
}
