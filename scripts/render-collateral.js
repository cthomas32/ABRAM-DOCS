#!/usr/bin/env node
/**
 * Render a collateral HTML file to a print-ready PDF (and a PNG for eyeballing).
 *
 * The one-pagers in `collateral/` are written as HTML because that is the only
 * format where the copy stays diffable — a PDF in git is an opaque blob and a
 * reviewer cannot see that a claim changed. The HTML is the source; the PDF is
 * the artifact you actually send someone.
 *
 *   node scripts/render-collateral.js                                  # render every file in collateral/
 *   node scripts/render-collateral.js collateral/nbcuniversal-one-pager.html
 *   node scripts/render-collateral.js --png                            # also write a PNG preview
 *
 * No dependencies. It shells out to whichever Chrome/Chromium is already on the
 * machine, which on CI is the Playwright browser and locally is usually Chrome.
 */

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const COLLATERAL = path.join(ROOT, "collateral");

/** Places a Chromium binary tends to live, best first. */
const CANDIDATES = [
  process.env.CHROME_PATH,
  "/opt/pw-browsers/chromium/chrome-linux/chrome",
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
];

function findChrome() {
  for (const c of CANDIDATES) {
    if (c && fs.existsSync(c)) return c;
  }
  // Last resort: anything Playwright unpacked under /opt/pw-browsers.
  const pw = "/opt/pw-browsers";
  if (fs.existsSync(pw)) {
    for (const dir of fs.readdirSync(pw)) {
      const guess = path.join(pw, dir, "chrome-linux", "chrome");
      if (fs.existsSync(guess)) return guess;
    }
  }
  throw new Error(
    "No Chrome or Chromium found. Set CHROME_PATH to a browser binary and try again."
  );
}

function render(chrome, htmlPath, { png }) {
  const out = htmlPath.replace(/\.html$/, ".pdf");
  const url = "file://" + htmlPath;

  // --allow-file-access-from-files lets the page reach ../public/fonts, so the
  // PDF ships with Geist rather than falling back to whatever the box has.
  const base = [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--allow-file-access-from-files",
    "--virtual-time-budget=4000",
  ];

  execFileSync(chrome, [...base, "--no-pdf-header-footer", `--print-to-pdf=${out}`, url], {
    stdio: "inherit",
  });
  console.log("  → " + path.relative(ROOT, out) + `  (${pageCount(out)} page)`);

  if (png) {
    // The window is taller than the 11in page on purpose. Headless clips the
    // screenshot at roughly the viewport height, so a window sized to exactly
    // one page silently cuts the footer off and the preview lies about the fit.
    // Extra height costs a white strip at the bottom and nothing else — the
    // real fit test is the page count above.
    const shot = htmlPath.replace(/\.html$/, ".preview.png");
    execFileSync(
      chrome,
      [
        ...base,
        "--window-size=816,1240",
        "--hide-scrollbars",
        `--screenshot=${shot}`,
        url,
      ],
      { stdio: "inherit" }
    );
    console.log("  → " + path.relative(ROOT, shot));
  }
}

/** How many pages Chromium actually paginated the document into. */
function pageCount(pdfPath) {
  const s = fs.readFileSync(pdfPath, "latin1");
  return (s.match(/\/Type\s*\/Page[^s]/g) || []).length;
}

function main() {
  const args = process.argv.slice(2);
  const png = args.includes("--png");
  const files = args.filter((a) => !a.startsWith("--"));

  const targets = files.length
    ? files.map((f) => path.resolve(ROOT, f))
    : fs
        .readdirSync(COLLATERAL)
        .filter((f) => f.endsWith(".html"))
        .map((f) => path.join(COLLATERAL, f));

  if (!targets.length) {
    console.log("Nothing to render.");
    return;
  }

  const chrome = findChrome();
  for (const t of targets) {
    if (!fs.existsSync(t)) throw new Error("No such file: " + t);
    console.log(path.relative(ROOT, t));
    render(chrome, t, { png });
  }
}

main();
