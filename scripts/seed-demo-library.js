#!/usr/bin/env node
/**
 * seed-demo-library.js — the 19 finished demos, filed and described, as drafts.
 *
 * This file is the manifest. The recordings live in the sibling `abram-demos`
 * repository and are never committed here; what is committed is the mapping
 * from a file name to a folder, a title, an address and a sentence. That
 * mapping is the artefact worth keeping, which is why this is a script rather
 * than a one-off paste into a SQL console.
 *
 * It is idempotent. Every row is keyed on its slug, so re-running updates the
 * words and leaves the video alone. It never sets `published`: a demo reaching
 * the public page is always a person's decision, and `--publish` below is that
 * person typing a slug.
 *
 * Read .agents/video-hosting.md before changing anything here.
 *
 * ── The one thing that can block this ──────────────────────────────────────
 *
 * The player is Mux Player and it takes a playback ID. There is no code path
 * in this site that plays a file from Supabase storage, from `public/`, or
 * from any URL at all, and the poster frames and hover loops are built off the
 * same playback ID. So the file has to go to Mux, and that needs
 * MUX_TOKEN_ID and MUX_TOKEN_SECRET.
 *
 * Without them this script still does most of the job: it creates the folders
 * and writes every row with its title, address, description, runtime and
 * poster offset, in `pending`. Set the two variables in .env.local and run it
 * again and it uploads the files into those same rows.
 *
 * ── Usage ──────────────────────────────────────────────────────────────────
 *
 *   node scripts/seed-demo-library.js              # folders + rows, upload if Mux is set
 *   node scripts/seed-demo-library.js --no-upload  # metadata only
 *   node scripts/seed-demo-library.js --list       # what is in the database now
 *   node scripts/seed-demo-library.js --publish first-session-walkthrough
 *   node scripts/seed-demo-library.js --publish all
 *   node scripts/seed-demo-library.js --unpublish <slug>
 *
 *   --source <dir>   where the .mp4 files are
 *                    (default ../abram-demos/masters/Final, or DEMO_SOURCE_DIR)
 *
 * Zero new dependencies. Node 20+.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');

/* ------------------------------------------------------------------ */
/*  The manifest                                                       */
/* ------------------------------------------------------------------ */

/* Folder order is the order of the sections on /demos. Film programs lead
   because that is the vertical the recordings were made for. */
const FOLDERS = [
  {
    slug: 'for-film-programs',
    name: 'For Film Programs',
    description: 'The productions and the cage, in one workspace.',
  },
  {
    slug: 'getting-started',
    name: 'Getting Started',
    description: 'The first session, and the fastest way into a project.',
  },
  {
    slug: 'production',
    name: 'Production',
    description: 'Boards, schedules, paperwork and the people who carry it.',
  },
  {
    slug: 'money',
    name: 'Money',
    description: 'Hours in, quotes out, and the invoice in between.',
  },
  {
    slug: 'clients-and-communication',
    name: 'Clients and Communication',
    description: 'What a client sees, and where everything else arrives.',
  },
  {
    slug: 'resources',
    name: 'Resources',
    description: 'Gear, kits and the rooms they live in.',
  },
  {
    slug: 'platform',
    name: 'Platform',
    description: 'The assistant, the apps, and the whole of it at once.',
  },
];

/**
 * `file` is the master's name in abram-demos/masters/Final, minus .mp4. The
 * "ABRAM - " prefix is on the file and off the title, because on a page whose
 * heading already says ABRAM it is nineteen repetitions of the same word.
 *
 * `slug` is the public address at /demos?v=<slug> and is frozen once shared.
 * The console does not rebuild it on rename and neither does this.
 *
 * Descriptions are the opening of each voiceover script in abram-demos/docs/vo,
 * turned from narration into a sentence that reads on a card.
 */
const VIDEOS = [
  /* ---- For Film Programs ---- */
  {
    file: 'ABRAM - Sizzle (Film Programs)',
    folder: 'for-film-programs',
    title: 'Sizzle (Film Programs)',
    slug: 'sizzle-film-programs',
    description:
      'A film program is two jobs at once: the productions, and the cage. Schedules, crews, budgets and call sheets on one side, four hundred pieces of gear on the other.',
  },
  {
    file: 'ABRAM - Gear Checkout - Student View',
    folder: 'for-film-programs',
    title: 'Gear Checkout, Student View',
    slug: 'gear-checkout-student-view',
    description:
      'The equipment cage as a student sees it. Shoot dates come first, availability is counted for those days, and the flagship cameras open at a higher certification level.',
  },
  {
    file: 'ABRAM - Gear Checkout - Cage Desk',
    folder: 'for-film-programs',
    title: 'Gear Checkout, Cage Desk',
    slug: 'gear-checkout-cage-desk',
    description:
      'The same cage from the desk. The morning opens with four numbers, every request holds its gear to a date the desk can see, and a request is approved whole or line by line.',
  },
  {
    file: 'ABRAM - Shoot to Cage',
    folder: 'for-film-programs',
    title: 'Shoot to Cage',
    slug: 'shoot-to-cage',
    description:
      'A thesis film that is already scheduled asks the cage for gear. ABRAM reads the days, the crew and what is in stock, and comes back with a draft cart to review.',
  },
  {
    file: 'ABRAM - Production Toolkit and Ask ABRAM',
    folder: 'for-film-programs',
    title: 'Production Toolkit and Ask ABRAM',
    slug: 'production-toolkit-and-ask-abram',
    description:
      'A film program running four productions at once. Each is a real production file with a stripboard, a day out of days, crewing that carries capacity, a budget, and call sheets that print.',
  },

  /* ---- Getting Started ---- */
  {
    file: 'ABRAM - First Session Walkthrough',
    folder: 'getting-started',
    title: 'First Session Walkthrough',
    slug: 'first-session-walkthrough',
    description:
      'What the first ten minutes look like. Pick a shape, answer the minimum it needs, say what you make, and the workspace arrives built for that work.',
  },
  {
    file: 'ABRAM - AI Project Intake',
    folder: 'getting-started',
    title: 'AI Project Intake',
    slug: 'ai-project-intake',
    description:
      'A client request sent through a public form lands in the queue with everything else. The brief, the budget, the answers and the files sit on one page, and ABRAM turns them into a project.',
  },

  /* ---- Production ---- */
  {
    file: 'ABRAM - Projects Board and Triage',
    folder: 'production',
    title: 'Projects Board and Triage',
    slug: 'projects-board-and-triage',
    description:
      'Every production the department has open, on one page that reads as a list or a board. Work arriving from outside lands in one queue and gets an owner before it is approved.',
  },
  {
    file: 'ABRAM - Scheduling Suite',
    folder: 'production',
    title: 'Scheduling Suite',
    slug: 'scheduling-suite',
    description:
      'Eighteen scenes across three days on one board, read three ways. Day out of days counts straight from the board, and moving a scene recounts everything downstream.',
  },
  {
    file: 'ABRAM - Call Sheets and Run of Show',
    folder: 'production',
    title: 'Call Sheets and Run of Show',
    slug: 'call-sheets-and-run-of-show',
    description:
      'Crew, calls, locations and the scenes for the day on one sheet that fills itself from the project and prints. A live event gets a rundown instead, and every time after a change recomputes.',
  },
  {
    file: 'ABRAM - Team and Capacity',
    folder: 'production',
    title: 'Team and Capacity',
    slug: 'team-and-capacity',
    description:
      'Everyone the department can call, and how booked they are. Four weeks day by day, conflicts surfaced before the shoot, and approved time off taken out of capacity.',
  },

  /* ---- Money ---- */
  {
    file: 'ABRAM - Time to Money',
    folder: 'money',
    title: 'Time to Money',
    slug: 'time-to-money',
    description:
      'Where the hours the crew logged turn into money. Crew log against the work itself, approval is one click, and approved hours become billable lines on the invoice.',
  },
  {
    file: 'ABRAM - Quotes and Money Hub',
    folder: 'money',
    title: 'Quotes and Money Hub',
    slug: 'quotes-and-money-hub',
    description:
      'Everything the department bills and everything it spends. Quotes go both ways, the client signs in the same place they read, and an accepted quote becomes the invoice.',
  },

  /* ---- Clients and Communication ---- */
  {
    file: 'ABRAM - Client Portal',
    folder: 'clients-and-communication',
    title: 'Client Portal',
    slug: 'client-portal',
    description:
      'What a client sees of their own project. Files open in place, a change is asked for on the work itself, and a sign-off lands on the project thread where the crew already is.',
  },
  {
    file: 'ABRAM - Inbox and Notifications',
    folder: 'clients-and-communication',
    title: 'Inbox and Notifications',
    slug: 'inbox-and-notifications',
    description:
      'One inbox for everything that arrives. Crew invitations, organization invitations and incoming requests in one list, with every category and channel set to a chosen cadence.',
  },

  /* ---- Resources ---- */
  {
    file: 'ABRAM - Resources and Inventory',
    folder: 'resources',
    title: 'Resources and Inventory',
    slug: 'resources-and-inventory',
    description:
      'Everything the department owns and where each piece is right now. Kits, rooms and cases are real places, and usage is counted over the year.',
  },

  /* ---- Platform ---- */
  {
    file: 'ABRAM - Apps and Link Hub',
    folder: 'platform',
    title: 'Apps and Link Hub',
    slug: 'apps-and-link-hub',
    description:
      'How the workspace grows when you ask it to. An install turns up in the navigation and adds a page the public can visit, at a real address, counting who clicked what.',
  },
  {
    file: 'ABRAM - Ask ABRAM',
    folder: 'platform',
    title: 'Ask ABRAM',
    slug: 'ask-abram',
    description:
      'The assistant answering from the page you are on. On a stripboard it answers about the schedule, on the team page about people, and when there is something to send it writes a draft.',
  },
  {
    file: 'ABRAM - Sizzle (Platform)',
    folder: 'platform',
    title: 'Sizzle (Platform)',
    slug: 'sizzle-platform',
    description:
      'A production is many jobs at once. A form becomes a request, a request becomes a production file: scenes on a board, a day out of days counted from it, and a call sheet that already knows the crew.',
  },
];

/**
 * The poster frame, as a fraction of the runtime. Mux defaults to the
 * midpoint, which on a screen recording is reliably a half-open menu with the
 * cursor mid-drag. Forty percent is past the title card of every one of these
 * cuts and inside the demonstration, which is the picture worth showing.
 * Worth overriding by hand in the console for any card that lands badly.
 */
const POSTER_FRACTION = 0.4;

/* ------------------------------------------------------------------ */
/*  Plumbing                                                           */
/* ------------------------------------------------------------------ */

const argv = process.argv.slice(2);
const has = (flag) => argv.includes(flag);
function option(flag, fallback) {
  const at = argv.indexOf(flag);
  return at === -1 || at === argv.length - 1 ? fallback : argv[at + 1];
}

const ROOT = path.resolve(__dirname, '..');

function parseEnvLocal() {
  const envPath = path.join(ROOT, '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const at = trimmed.indexOf('=');
    if (at === -1) continue;
    const key = trimmed.slice(0, at).trim();
    const value = trimmed.slice(at + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!(key in process.env)) process.env[key] = value;
  }
}

/** ffprobe from the user's ~/.local/bin first, then whatever is on PATH. */
function ffprobePath() {
  const local = path.join(process.env.HOME || '', '.local/bin/ffprobe');
  return fs.existsSync(local) ? local : 'ffprobe';
}

function durationOf(file) {
  const out = execFileSync(
    ffprobePath(),
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file],
    { encoding: 'utf-8' },
  );
  const seconds = Number(out.trim());
  return Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds * 1000) / 1000 : null;
}

const MUX_API = 'https://api.mux.com/video/v1';
const muxConfigured = () => Boolean(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET);

async function mux(pathname, init = {}) {
  const auth = Buffer.from(
    `${process.env.MUX_TOKEN_ID}:${process.env.MUX_TOKEN_SECRET}`,
  ).toString('base64');
  const response = await fetch(`${MUX_API}${pathname}`, {
    ...init,
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const messages = body?.error?.messages;
    throw new Error(
      Array.isArray(messages) && messages.length ? messages.join(' ') : `Mux returned ${response.status}.`,
    );
  }
  return body?.data;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Create an upload, PUT the file, wait for the asset.
 *
 * The console does this in three round trips because the bytes have to go
 * from a browser. Here they go from a laptop, so it is one function that
 * blocks. The whole file is read into memory: these masters are single-digit
 * megabytes, and a signed PUT wants a Content-Length.
 *
 * `cors_origin` is required by the API and irrelevant to a request with no
 * Origin header, so it is set to the site rather than guessed at.
 */
async function uploadToMux(file) {
  const upload = await mux('/uploads', {
    method: 'POST',
    body: JSON.stringify({
      cors_origin: 'https://abram.network',
      timeout: 3600,
      new_asset_settings: { playback_policies: ['public'], video_quality: 'basic' },
    }),
  });

  const put = await fetch(upload.url, {
    method: 'PUT',
    headers: { 'Content-Type': 'video/mp4' },
    body: fs.readFileSync(file),
  });
  if (!put.ok) throw new Error(`The upload PUT returned ${put.status}.`);

  /* Mux accepts the file, then encodes it. Both waits are the same loop. */
  let assetId = null;
  for (let attempt = 0; attempt < 120 && !assetId; attempt += 1) {
    const state = await mux(`/uploads/${encodeURIComponent(upload.id)}`);
    if (['errored', 'cancelled', 'timed_out'].includes(state.status)) {
      throw new Error(state.error?.message ?? `The upload ${state.status.replace('_', ' ')}.`);
    }
    assetId = state.asset_id ?? null;
    if (!assetId) await sleep(5000);
  }
  if (!assetId) throw new Error('Mux never turned that upload into an asset.');

  for (let attempt = 0; attempt < 240; attempt += 1) {
    const asset = await mux(`/assets/${encodeURIComponent(assetId)}`);
    if (asset.status === 'errored') {
      throw new Error(asset.errors?.messages?.join(' ') ?? 'Mux could not process that file.');
    }
    if (asset.status === 'ready') {
      const playback = asset.playback_ids?.find((p) => p.policy === 'public');
      if (!playback) throw new Error('Mux finished encoding but gave the asset no public playback ID.');
      return { uploadId: upload.id, assetId, playbackId: playback.id, duration: asset.duration ?? null };
    }
    await sleep(5000);
  }
  throw new Error('Mux is still encoding after twenty minutes. Re-run to pick it up.');
}

/* ------------------------------------------------------------------ */
/*  The work                                                           */
/* ------------------------------------------------------------------ */

function connect() {
  parseEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY have to be set in .env.local.');
    process.exit(78);
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function syncFolders(supabase) {
  const { data: existing, error } = await supabase.from('demo_folders').select('id, slug, position');
  if (error) throw new Error(error.message);
  const bySlug = new Map((existing ?? []).map((row) => [row.slug, row]));

  /* `product-tour` ships with the migration and already carries a published
     demo, and anything else somebody made by hand is in the same position.
     This manifest stacks after whatever is already there rather than
     renumbering from zero: ordering is a decision somebody made by looking at
     the page, and re-seeding is not a reason to move live sections around
     underneath them. */
  const mine = new Set(FOLDERS.map((folder) => folder.slug));
  const offset = (existing ?? [])
    .filter((row) => !mine.has(row.slug))
    .reduce((highest, row) => Math.max(highest, Number(row.position ?? 0) + 1), 0);

  const ids = new Map();
  for (const [index, folder] of FOLDERS.entries()) {
    const fields = {
      slug: folder.slug,
      name: folder.name,
      description: folder.description,
      position: offset + index,
      archived: false,
    };
    const found = bySlug.get(folder.slug);
    if (found) {
      const { error: updateError } = await supabase
        .from('demo_folders')
        .update(fields)
        .eq('id', found.id);
      if (updateError) throw new Error(updateError.message);
      ids.set(folder.slug, found.id);
      console.log(`  folder  ${folder.slug.padEnd(28)} kept`);
    } else {
      const { data, error: insertError } = await supabase
        .from('demo_folders')
        .insert(fields)
        .select('id')
        .single();
      if (insertError) throw new Error(insertError.message);
      ids.set(folder.slug, data.id);
      console.log(`  folder  ${folder.slug.padEnd(28)} created`);
    }
  }
  return ids;
}

async function syncVideos(supabase, folderIds, { sourceDir, upload }) {
  const { data: existing, error } = await supabase
    .from('demo_videos')
    .select('id, slug, playback_id, status, published, duration_seconds');
  if (error) throw new Error(error.message);
  const bySlug = new Map((existing ?? []).map((row) => [row.slug, row]));

  /* Position is per folder, and the manifest's order is the intended one. */
  const seen = new Map();

  for (const video of VIDEOS) {
    const file = path.join(sourceDir, `${video.file}.mp4`);
    const present = fs.existsSync(file);
    const position = seen.get(video.folder) ?? 0;
    seen.set(video.folder, position + 1);

    const duration = present ? durationOf(file) : null;
    const fields = {
      folder_id: folderIds.get(video.folder) ?? null,
      slug: video.slug,
      title: video.title,
      description: video.description,
      position,
    };
    if (duration) {
      fields.duration_seconds = duration;
      fields.thumbnail_time = Math.round(duration * POSTER_FRACTION);
    }

    let row = bySlug.get(video.slug);
    if (row) {
      /* Words, filing and order are the manifest's to own. Everything about
         the file itself belongs to whatever put it at Mux, so a ready row
         keeps its own runtime and poster. */
      if (row.status === 'ready') {
        delete fields.duration_seconds;
        delete fields.thumbnail_time;
      }
      const { error: updateError } = await supabase.from('demo_videos').update(fields).eq('id', row.id);
      if (updateError) throw new Error(updateError.message);
    } else {
      const { data, error: insertError } = await supabase
        .from('demo_videos')
        .insert({ ...fields, status: 'pending', published: false })
        .select('id, slug, playback_id, status, published')
        .single();
      if (insertError) throw new Error(insertError.message);
      row = data;
    }

    let note = row.playback_id ? 'has video' : present ? 'no video yet' : 'FILE MISSING';

    if (upload && present && !row.playback_id) {
      process.stdout.write(`  upload  ${video.slug} `);
      try {
        const result = await uploadToMux(file);
        const { error: writeError } = await supabase
          .from('demo_videos')
          .update({
            mux_upload_id: result.uploadId,
            mux_asset_id: result.assetId,
            playback_id: result.playbackId,
            duration_seconds: result.duration ?? duration,
            thumbnail_time: Math.round((result.duration ?? duration) * POSTER_FRACTION),
            status: 'ready',
            error: null,
          })
          .eq('id', row.id);
        if (writeError) throw new Error(writeError.message);
        note = 'uploaded, ready';
        console.log('done');
      } catch (err) {
        await supabase
          .from('demo_videos')
          .update({ status: 'errored', error: err.message })
          .eq('id', row.id);
        note = `FAILED: ${err.message}`;
        console.log('failed');
      }
    }

    console.log(`  video   ${video.slug.padEnd(34)} ${String(duration ?? '?').padEnd(9)} ${note}`);
  }
}

async function list(supabase) {
  const { data: folders } = await supabase
    .from('demo_folders')
    .select('id, slug, name, position, archived')
    .order('position');
  const { data: videos } = await supabase
    .from('demo_videos')
    .select('slug, title, folder_id, position, status, published, duration_seconds, playback_id')
    .order('position');

  for (const folder of folders ?? []) {
    console.log(`\n${folder.name}  (${folder.slug})${folder.archived ? '  [archived]' : ''}`);
    const inside = (videos ?? []).filter((v) => v.folder_id === folder.id);
    if (!inside.length) console.log('  (empty)');
    for (const video of inside) {
      const state = video.published ? 'LIVE ' : 'draft';
      console.log(
        `  ${state}  ${video.slug.padEnd(34)} ${String(Math.round(video.duration_seconds ?? 0)).padStart(4)}s  ` +
          `${video.status.padEnd(10)} ${video.playback_id ? 'playable' : 'no playback id'}`,
      );
    }
  }
  const orphans = (videos ?? []).filter((v) => !v.folder_id);
  if (orphans.length) {
    console.log('\nUnsorted');
    for (const video of orphans) console.log(`  ${video.slug}`);
  }
}

/**
 * Publishing.
 *
 * The trigger stamps published_at, and the public page revalidates every 60
 * seconds, so this shows up within a minute with no deploy. A row with no
 * playback ID is refused rather than published: row level security would hide
 * it anyway, and a published row that nobody can see is a worse state to
 * debug than a refusal.
 */
async function setPublished(supabase, target, published) {
  const { data: rows, error } = await supabase
    .from('demo_videos')
    .select('id, slug, playback_id, status');
  if (error) throw new Error(error.message);

  const manifest = new Set(VIDEOS.map((v) => v.slug));
  const chosen = (rows ?? []).filter((row) =>
    target === 'all' ? manifest.has(row.slug) : row.slug === target,
  );
  if (!chosen.length) {
    console.error(`No demo with the slug "${target}".`);
    process.exit(1);
  }

  for (const row of chosen) {
    if (published && (!row.playback_id || row.status !== 'ready')) {
      console.log(`  skipped  ${row.slug}  (nothing to play yet)`);
      continue;
    }
    const { error: writeError } = await supabase
      .from('demo_videos')
      .update({ published })
      .eq('id', row.id);
    if (writeError) throw new Error(writeError.message);
    console.log(`  ${published ? 'live   ' : 'draft  '}  ${row.slug}`);
  }
}

async function main() {
  const supabase = connect();

  if (has('--list')) return list(supabase);
  if (has('--publish')) return setPublished(supabase, option('--publish', 'all'), true);
  if (has('--unpublish')) return setPublished(supabase, option('--unpublish', ''), false);

  const sourceDir = path.resolve(
    option('--source', process.env.DEMO_SOURCE_DIR || path.join(ROOT, '..', 'abram-demos', 'masters', 'Final')),
  );
  const upload = !has('--no-upload') && muxConfigured();

  console.log(`Source:  ${sourceDir}${fs.existsSync(sourceDir) ? '' : '  (not found)'}`);
  console.log(`Mux:     ${muxConfigured() ? 'configured' : 'NOT configured, metadata only'}`);
  console.log('');

  const folderIds = await syncFolders(supabase);
  console.log('');
  await syncVideos(supabase, folderIds, { sourceDir, upload });

  console.log('');
  if (!muxConfigured()) {
    console.log('Rows are filed and described but have nothing to play. Set MUX_TOKEN_ID and');
    console.log('MUX_TOKEN_SECRET in .env.local and run this again to upload the files.');
  } else {
    console.log('Publish with:  node scripts/seed-demo-library.js --publish <slug>');
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
