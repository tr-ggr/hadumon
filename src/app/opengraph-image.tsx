import { ImageResponse } from "next/og";

import { MASCOT_ART } from "~/components/CreatureArt";

export const runtime = "edge";
export const alt =
  "HaduMon — summon cats, send them to work, come back to the loot.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// ImageResponse cannot decode WebP, so use the PNG rendition of the shared art.
const OPEN_GRAPH_MASCOT_ART = MASCOT_ART.replace(/\.webp$/, "-og.png");

export default async function Image() {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hadumon.vercel.app";
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
          Summon cats. Send them to work. Come back to the loot.
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
            25 elemental cats
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
            Nothing to buy
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
          alignItems: "flex-end",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <img
          src={`${site}${OPEN_GRAPH_MASCOT_ART}`}
          alt="HaduMon mascot"
          width="460"
          height="460"
          style={{ objectFit: "contain" }}
        />
      </div>
    </div>,
    { ...size },
  );
}
