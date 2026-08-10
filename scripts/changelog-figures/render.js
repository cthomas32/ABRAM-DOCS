#!/usr/bin/env node
/**
 * Render the changelog figures.
 *
 *   node scripts/changelog-figures/render.js preview [out.html]
 *       Write every figure to a dark HTML sheet you can open in a browser.
 *       Do this before anything else — a figure is judged by eye, not by diff.
 *
 *   node scripts/changelog-figures/render.js svg <name>
 *       Print one figure's SVG to stdout, ready to paste into a release note.
 *
 *   node scripts/changelog-figures/render.js publish <release-slug> [--dry]
 *       Rasterize every figure to a 2x PNG, flatten it onto the email card
 *       colour, upload under a CONTENT-HASHED name, and sweep older objects in
 *       that folder. Prints the url map that build-email consumes.
 *
 * Why two outputs: the changelog page renders MDX, so it takes the SVG inline
 * and stays crisp at any width. Email clients strip <svg> outright — Gmail
 * removes it, Outlook renders through Word — so email gets PNGs. Same source,
 * so the two can never drift.
 *
 * Why content hashing: re-uploading a corrected figure to the same path leaves
 * every cache serving the old one, and Gmail proxies images by url through
 * googleusercontent.com. A changed figure must get a changed url.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { FIGURES } = require('./figures.js');

const BUCKET = 'blog-images';
const DISPLAY_W = 536; // 600px email card - 32px padding each side
const SCALE = 2;
const CARD_BG = '#0F0F12'; // email card, so rounded corners never halo

function loadEnv() {
  const envPath = path.join(__dirname, '..', '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const i = trimmed.indexOf('=');
    if (i === -1) continue;
    process.env[trimmed.slice(0, i).trim()] = trimmed.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
}

function previewSheet(outPath) {
  const body = Object.entries(FIGURES)
    .map(([name, fn]) => `<h3>${name}</h3>${fn()}`)
    .join('');
  fs.writeFileSync(
    outPath,
    `<!doctype html><meta charset="utf-8"><title>Changelog figures</title>` +
      `<style>body{background:#0A0A0A;color:#FAFAFA;font-family:Inter,system-ui,sans-serif;margin:0;padding:28px;max-width:820px}` +
      `h3{font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#969696;margin:30px 0 10px}` +
      `svg{width:100%;height:auto;display:block}</style>${body}`,
  );
  console.log(`wrote ${outPath} — ${Object.keys(FIGURES).length} figures`);
}

async function publish(slug, dry) {
  loadEnv();
  const sharp = require('sharp');
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  const s = createClient(url, key);

  const folder = `changelog/${slug}`;
  const { data: before } = await s.storage.from(BUCKET).list(folder);
  const keep = new Set();
  const out = {};

  for (const [name, fn] of Object.entries(FIGURES)) {
    const svg = fn();
    const vb = svg.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
    if (!vb) throw new Error(`${name}: no viewBox`);
    const h = Math.round((DISPLAY_W * Number(vb[2])) / Number(vb[1]));
    // give the root explicit pixel dimensions so librsvg renders at 2x
    // natively instead of upscaling a 720px raster
    const sized = svg.replace('<svg ', `<svg width="${DISPLAY_W * SCALE}" height="${h * SCALE}" `);
    const png = await sharp(Buffer.from(sized)).flatten({ background: CARD_BG }).png({ compressionLevel: 9 }).toBuffer();
    const hash = crypto.createHash('sha256').update(png).digest('hex').slice(0, 10);
    const file = `${name}.${hash}@2x.png`;
    keep.add(file);
    console.log(`${name} -> ${file} (${Math.round(png.length / 1024)}KB, ${DISPLAY_W}x${h} displayed)`);
    if (dry) continue;
    const up = await s.storage
      .from(BUCKET)
      .upload(`${folder}/${file}`, png, { contentType: 'image/png', upsert: true, cacheControl: '31536000' });
    if (up.error) throw new Error(`${name}: ${up.error.message}`);
    out[name] = { url: s.storage.from(BUCKET).getPublicUrl(`${folder}/${file}`).data.publicUrl, w: DISPLAY_W, h };
  }

  if (!dry) {
    const stale = (before || []).map((o) => o.name).filter((n) => !keep.has(n));
    if (stale.length) {
      await s.storage.from(BUCKET).remove(stale.map((n) => `${folder}/${n}`));
      console.log('swept stale objects:', stale.join(', '));
    }
    const mapPath = path.join(__dirname, `urls.${slug}.json`);
    fs.writeFileSync(mapPath, JSON.stringify(out, null, 2));
    console.log('url map ->', mapPath);
  }
}

(async () => {
  const [cmd, arg] = process.argv.slice(2);
  if (cmd === 'preview') {
    previewSheet(arg || path.join(__dirname, 'preview.html'));
  } else if (cmd === 'svg') {
    if (!FIGURES[arg]) throw new Error(`unknown figure "${arg}" — have: ${Object.keys(FIGURES).join(', ')}`);
    process.stdout.write(FIGURES[arg]() + '\n');
  } else if (cmd === 'publish') {
    if (!arg) throw new Error('publish needs a release slug, e.g. 1-4-0');
    await publish(arg, process.argv.includes('--dry'));
  } else {
    console.log('usage: render.js preview [out.html] | svg <name> | publish <release-slug> [--dry]');
    console.log('figures:', Object.keys(FIGURES).join(', '));
    process.exit(1);
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
