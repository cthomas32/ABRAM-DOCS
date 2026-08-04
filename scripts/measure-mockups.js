#!/usr/bin/env node
/**
 * Measure how tall each drawn app panel actually is, and write the answers
 * into `MOCKUP_ASPECT`.
 *
 * The product and showcase layouts budget space for a panel before anything
 * is drawn, using a ratio in `mockups.tsx`. Those numbers started as
 * estimates and drifted every time a panel gained or lost a row. Sixteen of
 * twenty-nine were out by more than fifteen per cent when this was written,
 * and four of them by enough to push the panel over the card's own footer.
 *
 * So: stop estimating. This draws each panel on its own, on flat magenta,
 * in a very tall frame, reads the PNG back, and finds the last row that is
 * not background. That row over the panel's width is the aspect.
 *
 *   node scripts/measure-mockups.js            # measure and rewrite
 *   node scripts/measure-mockups.js --dry-run  # print the drift, write nothing
 *
 * It writes a temporary route, builds, serves, measures and then removes
 * the route again, so nothing it needs is left in the app. Run it after
 * changing the density of any panel.
 *
 * The PNG reader here is deliberately small and only handles what
 * `next/og` emits: 8 bit, non-interlaced, one IHDR and one or more IDAT.
 */

const { execFileSync, spawn } = require("node:child_process");
const { mkdirSync, rmSync, readFileSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");
const zlib = require("node:zlib");

const ROOT = join(__dirname, "..");
const ROUTE_DIR = join(ROOT, "src/app/mockup-probe/[kind]");
const MOCKUPS = join(ROOT, "src/lib/social/mockups.tsx");
const SPEC = join(ROOT, "src/lib/social/spec.ts");
const PORT = 3121;
/** The width every panel is drawn at. Any width works; the answer is a ratio. */
const WIDTH = 680;

// ---------------------------------------------------------------------
// The temporary route
// ---------------------------------------------------------------------

const PROBE_IMAGE = `import { readFile } from "fs/promises";
import path from "path";
import { ImageResponse } from "next/og";
import { AppMockup } from "@/lib/social/mockups";
import { getTheme } from "@/lib/social/themes";
import { MOCKUP_IDS, type MockupKind } from "@/lib/social/spec";

// WRITTEN BY scripts/measure-mockups.js. Removed again when it finishes.
export const alt = "probe";
export const contentType = "image/png";
export const size = { width: ${WIDTH + 20}, height: 2400 };

export function generateStaticParams() {
  return MOCKUP_IDS.map((k) => ({ kind: k }));
}

async function fonts() {
  return Promise.all(
    [400, 500, 600, 700].map(async (weight) => {
      const file = await readFile(path.join(process.cwd(), "public", "fonts", \`Geist-\${weight}.ttf\`));
      return {
        name: "Geist",
        data: file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer,
        weight: weight as 400 | 500 | 600 | 700,
        style: "normal" as const,
      };
    })
  );
}

async function brand(kind: "mark" | "lockup") {
  const data = await readFile(path.join(process.cwd(), "public", "brand", \`\${kind}-cream.png\`));
  return \`data:image/png;base64,\${data.toString("base64")}\`;
}

export default async function Image({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  const [loaded, mark, lockup] = await Promise.all([fonts(), brand("mark"), brand("lockup")]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", backgroundColor: "#FF00FF" }}>
        <AppMockup kind={kind as MockupKind} theme={getTheme("midnight")} mark={mark} lockup={lockup} width={${WIDTH}} scaleWidth={${WIDTH}} />
      </div>
    ),
    { ...size, fonts: loaded }
  );
}
`;

const PROBE_PAGE = `import { MOCKUP_IDS } from "@/lib/social/spec";
export function generateStaticParams() {
  return MOCKUP_IDS.map((k) => ({ kind: k }));
}
export default async function Page({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  return <div>{kind}</div>;
}
`;

// ---------------------------------------------------------------------
// PNG
// ---------------------------------------------------------------------

function decode(buf) {
  let pos = 8;
  let width = 0;
  let height = 0;
  let depth = 0;
  let colourType = 0;
  const idat = [];

  while (pos < buf.length) {
    const length = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      depth = data[8];
      colourType = data[9];
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") break;
    pos += 12 + length;
  }

  if (depth !== 8) throw new Error(`unexpected bit depth ${depth}`);
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colourType];
  if (!channels) throw new Error(`unexpected colour type ${colourType}`);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);
  let prev = Buffer.alloc(stride);

  // Un-filter. Each scanline carries its filter type in its first byte and
  // is decoded against the pixel to its left and the row above it.
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const cur = Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev[x];
      const c = x >= channels ? prev[x - channels] : 0;
      let v = line[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const pa = Math.abs(b - c);
        const pb = Math.abs(a - c);
        const pc = Math.abs(a + b - 2 * c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[x] = v & 0xff;
    }
    cur.copy(out, y * stride);
    prev = cur;
  }

  return { width, height, channels, px: out };
}

/** The last row carrying anything that is not the magenta backdrop. */
function drawnHeight(png) {
  const { width, height, channels, px } = png;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const i = y * width * channels + x * channels;
      if (!(px[i] > 240 && px[i + 1] < 20 && px[i + 2] > 240)) return y + 1;
    }
  }
  return 0;
}

// ---------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------

function mockupIds() {
  const source = readFileSync(SPEC, "utf8");
  const block = source.slice(source.indexOf("export const MOCKUPS"), source.indexOf("export const MOCKUP_IDS"));
  return (block.match(/^ {2}(\w+): \{/gm) || []).map((line) => line.trim().split(":")[0]);
}

function declaredAspects() {
  const source = readFileSync(MOCKUPS, "utf8");
  const block = source.slice(source.indexOf("const MOCKUP_ASPECT"), source.indexOf("MOCKUP_REFERENCE"));
  const out = {};
  for (const m of block.matchAll(/^ {2}(\w+): ([\d.]+),/gm)) out[m[1]] = Number.parseFloat(m[2]);
  return out;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const ids = mockupIds();
  const declared = declaredAspects();
  let server;

  try {
    mkdirSync(ROUTE_DIR, { recursive: true });
    writeFileSync(join(ROUTE_DIR, "opengraph-image.tsx"), PROBE_IMAGE);
    writeFileSync(join(ROUTE_DIR, "page.tsx"), PROBE_PAGE);

    console.log(`Building with a probe route for ${ids.length} panels. This takes a couple of minutes.`);
    execFileSync("npm", ["run", "build"], { cwd: ROOT, stdio: "ignore" });

    server = spawn("npx", ["next", "start", "-p", String(PORT)], { cwd: ROOT, stdio: "ignore" });

    const base = `http://localhost:${PORT}`;
    for (let i = 0; i < 60; i++) {
      try {
        const probe = await fetch(`${base}/mockup-probe/${ids[0]}`);
        if (probe.ok) break;
      } catch {
        // Still starting.
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const measured = {};
    for (const id of ids) {
      const response = await fetch(`${base}/mockup-probe/${id}/opengraph-image`);
      if (!response.ok) throw new Error(`${id}: the probe answered ${response.status}`);
      const png = decode(Buffer.from(await response.arrayBuffer()));
      measured[id] = Number((drawnHeight(png) / WIDTH).toFixed(2));
    }

    let moved = 0;
    console.log("\nscreen".padEnd(15) + "declared  measured  drift");
    for (const id of ids) {
      const was = declared[id];
      const now = measured[id];
      const drift = was ? Math.round(((now - was) / was) * 100) : 0;
      if (Math.abs(drift) >= 15) moved += 1;
      const note = drift >= 15 ? "  overflows its box" : drift <= -15 ? "  drawn small" : "";
      console.log(id.padEnd(15) + String(was ?? "-").padEnd(10) + String(now).padEnd(10) + `${drift > 0 ? "+" : ""}${drift}%${note}`);
    }
    console.log(`\n${moved} of ${ids.length} were off by fifteen per cent or more.`);

    if (dryRun) {
      console.log("Dry run. Nothing written.");
      return 0;
    }

    const source = readFileSync(MOCKUPS, "utf8");
    const start = source.indexOf("const MOCKUP_ASPECT");
    const end = source.indexOf("};", start) + 2;
    const body = ids.map((id) => `  ${id}: ${measured[id]},`).join("\n");
    writeFileSync(
      MOCKUPS,
      `${source.slice(0, start)}const MOCKUP_ASPECT: Record<MockupKind, number> = {\n${body}\n};${source.slice(end)}`
    );
    console.log("Written into MOCKUP_ASPECT.");
    return 0;
  } finally {
    if (server) server.kill();
    // The route exists only for the length of this run. Leaving it behind
    // would put a public page on the site whose only job is to be measured.
    rmSync(join(ROOT, "src/app/mockup-probe"), { recursive: true, force: true });
  }
}

main()
  .then((code) => process.exit(code ?? 0))
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
