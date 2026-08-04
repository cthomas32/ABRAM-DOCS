#!/usr/bin/env node
/**
 * build-grain.js — write the film grain tile the social renderer overlays.
 *
 * Satori has no filters, no blend modes and no noise function, so grain has
 * to arrive as an image. This writes a small greyscale-plus-alpha PNG of
 * seeded noise into `public/brand/grain.png`, which the renderer inlines and
 * tiles over the whole card.
 *
 * Seeded on purpose: the file is committed, and a tile that changed on every
 * run would show up as a diff on every build for no reason.
 *
 * Zero dependencies, and it only writes when the bytes actually change.
 *
 * Usage: node scripts/build-grain.js
 */

const { deflateSync } = require("node:zlib");
const { writeFileSync, readFileSync, mkdirSync, existsSync } = require("node:fs");
const { join } = require("node:path");

const OUT = join(__dirname, "..", "public", "brand", "grain.png");

/** Big enough that the eye does not find the seam, small enough to inline. */
const SIZE = 160;

/**
 * How far each pixel strays from mid grey, and how much of it shows.
 *
 * Grain wants to be almost invisible on its own and only obvious by its
 * absence. These were set by eye against the midnight palette: any stronger
 * and a card reads as a JPEG artefact rather than as film.
 */
const SPREAD = 132;
const ALPHA = 34;

/** Mulberry32. Deterministic, and short enough to read. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = -1;
  for (let i = 0; i < buffer.length; i += 1) c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function buildPng() {
  const random = rng(0x41425241); // "ABRA"

  // Colour type 4 is greyscale plus alpha: two bytes a pixel, and each
  // scanline is prefixed with its filter byte, which is 0 here since the
  // data is noise and no filter is going to predict it.
  const raw = Buffer.alloc(SIZE * (SIZE * 2 + 1));
  let offset = 0;
  for (let y = 0; y < SIZE; y += 1) {
    raw[offset] = 0;
    offset += 1;
    for (let x = 0; x < SIZE; x += 1) {
      const value = Math.round(128 + (random() - 0.5) * SPREAD);
      raw[offset] = Math.max(0, Math.min(255, value));
      raw[offset + 1] = ALPHA;
      offset += 2;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);
  ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 4; // greyscale + alpha
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const png = buildPng();
mkdirSync(join(__dirname, "..", "public", "brand"), { recursive: true });

if (existsSync(OUT) && readFileSync(OUT).equals(png)) {
  console.log(`public/brand/grain.png is already current (${SIZE}x${SIZE}, ${png.length} bytes).`);
  process.exit(0);
}

writeFileSync(OUT, png);
console.log(`Wrote public/brand/grain.png (${SIZE}x${SIZE}, ${png.length} bytes).`);
