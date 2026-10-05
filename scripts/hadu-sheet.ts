/**
 * Writes a contact sheet of the hadu's wardrobe, to look every piece over at
 * once: one HTML file with nothing outside it. A row to a slot, each piece
 * worn on a plain Hadu at eight times its size on the cloth's cream and again
 * at twice its size on white, on the mat's sky and on the lid's ink, then a
 * dozen whole looks picked at random.
 *
 *   pnpm exec tsx scripts/hadu-sheet.ts /tmp/hadu.html
 *   pnpm exec tsx scripts/hadu-sheet.ts /tmp/hadu.html --seed=7
 *
 * With no path the sheet goes under the system's temporary directory, and
 * the path it was written to is printed.
 */
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { buildRuns } from "~/components/PixelSprite";
import { SPRITE_SIZE } from "~/components/sprites/cats";
import {
  AURA_INSET,
  AURA_SIZE,
  haduDrawing,
  type SpriteLayer,
} from "~/components/sprites/hadu";
import { RARITY_LABELS } from "~/server/game/cats";
import {
  cosmeticsIn,
  HADU_SLOTS,
  SLOT_LABELS,
  type Look,
} from "~/server/game/cosmetics";

/** Whole multiples of the sprite: the close look, and the shell's size. */
const LARGE = 8;
const SMALL = 2;
/** The grounds a small hadu has to read on: a tile, a mat, the lid. */
const GROUNDS = ["#ffffff", "#a9ddf5", "#17212b"];
const RANDOM_LOOKS = 12;

function rects(layer: SpriteLayer, offset: number): string {
  return buildRuns(layer.rows, { ...layer.colors })
    .map(
      (run) =>
        `<rect x="${run.x + offset}" y="${run.y + offset}" width="${run.width}" height="1" fill="${run.fill}"/>`,
    )
    .join("");
}

/** A hadu with the air an aura needs round it, at `scale` pixels a cell. */
function hadu(look: Partial<Look>, scale: number): string {
  const { cat, aura } = haduDrawing(look);
  const edge = AURA_SIZE * scale;
  return (
    `<svg viewBox="0 0 ${AURA_SIZE} ${AURA_SIZE}" width="${edge}" height="${edge}" shape-rendering="crispEdges">` +
    (aura ? rects(aura, 0) : "") +
    rects(cat, AURA_INSET) +
    `</svg>`
  );
}

function figure(look: Partial<Look>, caption: string, note: string): string {
  const small = GROUNDS.map(
    (ground) =>
      `<span class="small" style="background:${ground}">${hadu(look, SMALL)}</span>`,
  ).join("");
  return (
    `<figure><span class="large">${hadu(look, LARGE)}</span>` +
    `<span class="smalls">${small}</span>` +
    `<figcaption>${caption}<br><i>${note}</i></figcaption></figure>`
  );
}

/** A small generator with a seed, so a sheet can be made again. */
function dice(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

function randomLooks(seed: number): Partial<Look>[] {
  const roll = dice(seed);
  return Array.from({ length: RANDOM_LOOKS }, () =>
    Object.fromEntries(
      HADU_SLOTS.map((slot) => {
        const pieces = cosmeticsIn(slot);
        const piece = pieces[Math.floor(roll() * pieces.length)];
        return [slot, piece?.id ?? ""];
      }),
    ),
  );
}

function page(seed: number): string {
  const rows = HADU_SLOTS.map((slot) => {
    const pieces = cosmeticsIn(slot);
    const figures = pieces.map((piece) =>
      figure({ [slot]: piece.id }, piece.name, RARITY_LABELS[piece.rarity]),
    );
    return (
      `<section><h2>${SLOT_LABELS[slot]} (${pieces.length})</h2>` +
      `<div class="row">${figures.join("")}</div></section>`
    );
  });
  const looks = randomLooks(seed).map((look, i) =>
    figure(
      look,
      `Look ${i + 1}`,
      HADU_SLOTS.map((slot) => look[slot]?.replace(`${slot}-`, "")).join(", "),
    ),
  );

  const large = AURA_SIZE * LARGE;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>HaduMon: the hadu's wardrobe</title>
<style>
  body { margin: 24px; background: #f4ead4; color: #17212b; font: 12px/1.3 monospace; }
  h1 { font-size: 16px; }
  h2 { font-size: 14px; margin: 28px 0 8px; border-top: 2px solid #17212b; padding-top: 8px; }
  .row { display: flex; flex-wrap: wrap; gap: 16px 10px; }
  figure { margin: 0; width: ${large}px; }
  .large { display: block; background: #fff8e7; line-height: 0; outline: 1px solid #b9a47e; }
  .smalls { display: flex; gap: 4px; margin-top: 4px; }
  .small { line-height: 0; }
  figcaption { margin-top: 4px; }
  i { color: #5b6c7d; font-style: normal; }
</style>
</head>
<body>
<h1>The hadu's wardrobe: ${SPRITE_SIZE}x${SPRITE_SIZE}, the aura on ${AURA_SIZE}x${AURA_SIZE}</h1>
<p>Each piece on a plain Hadu at ${LARGE}x on cream, and at ${SMALL}x on white, sky and ink. Seed ${seed}.</p>
${rows.join("\n")}
<section><h2>Whole looks (${RANDOM_LOOKS})</h2><div class="row">${looks.join("")}</div></section>
</body>
</html>
`;
}

const args = process.argv.slice(2);
const target = args.find((arg) => !arg.startsWith("--"));
const seedArg = args.find((arg) => arg.startsWith("--seed="));
const seed = Number(seedArg?.slice("--seed=".length) ?? 1) || 1;
const outFile = target ? resolve(target) : join(tmpdir(), "hadumon-hadu.html");
writeFileSync(outFile, page(seed));
console.log(`${outFile}: seed ${seed}`);
