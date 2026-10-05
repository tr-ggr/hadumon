/**
 * Builds `public/favicon.ico`: Hadu's face on a clear ground, at 16, 32 and
 * 48 pixels. The face is read from his sprite, so the icon follows any change
 * to it. Run with `pnpm favicon`.
 */
import { writeFileSync } from "node:fs";

import { SPRITE_SIZE, catSprite } from "~/components/sprites/cats";
import { spriteColors } from "~/components/sprites/palettes";

const OUT_FILE = "public/favicon.ico";

/** Rows of Hadu's sprite that hold his head, ears to chin. */
const HEAD_TOP = 1;
const HEAD_BOTTOM = 10;

/** Whole multiples of the sprite, so every pixel stays square. */
const SCALES = [1, 2, 3];

type Rgba = readonly [r: number, g: number, b: number, a: number];
const TRANSPARENT: Rgba = [0, 0, 0, 0];

function rgba(hex: string): Rgba {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff, 0xff];
}

/** Hadu's head. The chin row is the sprite's neck, closed into outline. */
function headRows(): string[] {
  const rows = catSprite("hadu").slice(HEAD_TOP, HEAD_BOTTOM + 1);
  const chin = rows.length - 1;
  return rows.map((row, y) => (y === chin ? row.replace(/[^.]/g, "o") : row));
}

/** The icon at sprite size: the head alone, centred on a clear ground. */
function paint(): Rgba[][] {
  const grid = Array.from({ length: SPRITE_SIZE }, () =>
    Array<Rgba>(SPRITE_SIZE).fill(TRANSPARENT),
  );

  const colors = spriteColors("shade", "legendary", "hadu");
  const head = headRows();
  const top = Math.floor((SPRITE_SIZE - head.length) / 2);
  head.forEach((row, y) => {
    [...row].forEach((pixel, x) => {
      const color = colors[pixel];
      const line = grid[top + y];
      if (color && line) line[x] = rgba(color);
    });
  });
  return grid;
}

/** Nearest-neighbour: each pixel becomes a `scale` by `scale` block. */
function scaleUp(grid: Rgba[][], scale: number): Rgba[][] {
  return grid.flatMap((row) => {
    const wide = row.flatMap((pixel) => Array<Rgba>(scale).fill(pixel));
    return Array<Rgba[]>(scale).fill(wide);
  });
}

/** One ICO image: a 32-bit BMP without its file header, plus the AND mask. */
function bitmap(grid: Rgba[][]): Buffer {
  const size = grid.length;
  const maskStride = Math.ceil(size / 32) * 4;
  const pixels = Buffer.alloc(size * size * 4);
  const mask = Buffer.alloc(maskStride * size);

  // Rows are stored bottom-up, pixels as BGRA.
  [...grid].reverse().forEach((row, y) => {
    row.forEach(([r, g, b, a], x) => {
      pixels.set([b, g, r, a], (y * size + x) * 4);
      if (a === 0) {
        const at = y * maskStride + (x >> 3);
        mask[at] = (mask[at] ?? 0) | (0x80 >> (x & 7));
      }
    });
  });

  const header = Buffer.alloc(40);
  header.writeUInt32LE(40, 0); // biSize
  header.writeInt32LE(size, 4); // biWidth
  header.writeInt32LE(size * 2, 8); // biHeight: the image and its mask
  header.writeUInt16LE(1, 12); // biPlanes
  header.writeUInt16LE(32, 14); // biBitCount
  header.writeUInt32LE(pixels.length + mask.length, 20); // biSizeImage
  return Buffer.concat([header, pixels, mask]);
}

function ico(images: Buffer[], sizes: number[]): Buffer {
  const directory = Buffer.alloc(6);
  directory.writeUInt16LE(1, 2); // type: icon
  directory.writeUInt16LE(images.length, 4);

  let offset = directory.length + images.length * 16;
  const entries = images.map((image, index) => {
    const size = sizes[index] ?? 0;
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size, 0); // width
    entry.writeUInt8(size, 1); // height
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(image.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += image.length;
    return entry;
  });

  return Buffer.concat([directory, ...entries, ...images]);
}

const face = paint();
const frames = SCALES.map((scale) => scaleUp(face, scale));
const file = ico(
  frames.map(bitmap),
  frames.map((frame) => frame.length),
);
writeFileSync(OUT_FILE, file);

const sizes = frames.map((frame) => `${frame.length}x${frame.length}`);
console.log(`${OUT_FILE}: ${sizes.join(", ")} (${file.length} bytes)`);
