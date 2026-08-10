/**
 * The three release-note figures, built from the app's own tokens.
 *
 * Colors are the composited values of the real classes — e.g. `text-fg/40` on a
 * `bg-well` block is #FAFAFA at 40% over #1C1C1C = #757575. Nothing here is a
 * guess; every tone traces to src/index.css, blockStyles.ts, StatusGlyph.tsx or
 * RunOfShowRow.tsx.
 */
const FONT = 'Inter, ui-sans-serif, system-ui, sans-serif';

// --- surfaces (src/index.css) ---
const PAGE = '#0A0A0A';        // --background 0 0% 4%
const CARD = '#101010';        // --card 0 0% 6.3%
const WELL = '#1C1C1C';        // white 5% over card
const CHIP = '#272727';        // white 5% over well
const CHROME = '#27272A';      // --chrome
const BORDER = '#232323';      // --border, white 8% over card
const HAIRLINE = '#1C1C1C';    // border-white/5 row rule
const FG = '#FAFAFA';          // --foreground

// --- fg opacities over CARD ---
const FG40_CARD = '#6E6E6E';
const FG30_CARD = '#565656';
// --- fg opacities over WELL ---
const FG40 = '#757575';
const FG45 = '#808080';
const FG55 = '#969696';
const CREAM = '#F9F7F4';       // --abram-cream

// --- status glyph tones (StatusGlyph.tsx, composited over the row/card) ---
const ST_NOT_STARTED = '#565656';  // text-fg/30
const ST_IN_PROGRESS = '#326BC8';  // text-abram-info/80
const ST_IN_REVIEW   = '#6632C1';  // text-abram-purple/80
const ST_APPROVED    = '#2DAC7E';  // text-emerald-400/80

// --- RoS segment glyph tones (SEGMENT_TYPE_GLYPHS, over card) ---
const SEG_DEFAULT = FG40_CARD;   // text-fg/40
const SEG_VTR     = '#5C2DAB';   // text-abram-purple/70
const SEG_LIVE    = '#CC9C20';   // text-amber-400/80 — amber, never red
const SEG_OPEN    = '#299870';   // text-emerald-400/70
const SEG_INTVW   = '#2E60B1';   // text-abram-info/70

// --- persona accents (ROS_PERSONA_ACCENTS) ---
const AMBER400 = '#FBBF24';
const ZINC300 = '#D4D4D8';   // ROS_PERSONA_ACCENTS.zinc bar
const ZINC100 = '#F4F4F5';   // text-zinc-100 active label
const AMBER200 = '#FDE68A';
const CYAN400  = '#22D3EE';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const t = (x, y, s, { size = 12, fill = FG, weight, anchor, track, mono } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}"` +
  (weight ? ` font-weight="${weight}"` : '') +
  (anchor ? ` text-anchor="${anchor}"` : '') +
  (track ? ` letter-spacing="${track}"` : '') +
  (mono ? ` font-family="ui-monospace, SFMono-Regular, Menlo, monospace"` : '') +
  `>${esc(s)}</text>`;
const caps = (x, y, s, fill, size = 9) => t(x, y, s, { size, fill, weight: 700, track: 1.3 });

/** Lucide-shaped status glyphs at 14px, drawn at (x,y) = icon centre. */
const glyph = {
  circle: (x, y, c) => `<circle cx="${x}" cy="${y}" r="5.2" fill="none" stroke="${c}" stroke-width="1.6" />`,
  circleDot: (x, y, c) =>
    `<circle cx="${x}" cy="${y}" r="5.2" fill="none" stroke="${c}" stroke-width="1.6" /><circle cx="${x}" cy="${y}" r="2.2" fill="${c}" />`,
  eye: (x, y, c) =>
    `<path d="M${x - 7} ${y} q7 -6 14 0 q-7 6 -14 0 z" fill="none" stroke="${c}" stroke-width="1.4" stroke-linejoin="round" /><circle cx="${x}" cy="${y}" r="2.1" fill="none" stroke="${c}" stroke-width="1.4" />`,
  check: (x, y, c) =>
    `<circle cx="${x}" cy="${y}" r="5.6" fill="none" stroke="${c}" stroke-width="1.6" /><path d="M${x - 2.6} ${y} l1.9 2 l3.4 -4" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />`,
  rows: (x, y, c) =>
    `<rect x="${x - 6}" y="${y - 5.5}" width="12" height="11" rx="2" fill="none" stroke="${c}" stroke-width="1.4" /><line x1="${x - 6}" y1="${y}" x2="${x + 6}" y2="${y}" stroke="${c}" stroke-width="1.4" />`,
  film: (x, y, c) =>
    `<rect x="${x - 6}" y="${y - 5.5}" width="12" height="11" rx="2" fill="none" stroke="${c}" stroke-width="1.4" /><line x1="${x - 2.5}" y1="${y - 5.5}" x2="${x - 2.5}" y2="${y + 5.5}" stroke="${c}" stroke-width="1.2" /><line x1="${x + 2.5}" y1="${y - 5.5}" x2="${x + 2.5}" y2="${y + 5.5}" stroke="${c}" stroke-width="1.2" />`,
  radio: (x, y, c) =>
    `<circle cx="${x}" cy="${y}" r="2" fill="${c}" /><path d="M${x - 5.5} ${y - 4} a7 7 0 0 0 0 8 M${x + 5.5} ${y - 4} a7 7 0 0 1 0 8" fill="none" stroke="${c}" stroke-width="1.4" stroke-linecap="round" />`,
  login: (x, y, c) =>
    `<path d="M${x - 1} ${y - 5} h5 v10 h-5" fill="none" stroke="${c}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" /><path d="M${x - 6} ${y} h6 m-2.5 -2.8 l2.8 2.8 l-2.8 2.8" fill="none" stroke="${c}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />`,
  mic: (x, y, c) =>
    `<rect x="${x - 2.2}" y="${y - 6}" width="4.4" height="7.5" rx="2.2" fill="none" stroke="${c}" stroke-width="1.4" /><path d="M${x - 4.5} ${y} a4.5 4.5 0 0 0 9 0 M${x} ${y + 4.5} v2" fill="none" stroke="${c}" stroke-width="1.4" stroke-linecap="round" />`,
  timer: (x, y, c) =>
    `<circle cx="${x}" cy="${y + 0.5}" r="4.6" fill="none" stroke="${c}" stroke-width="1.3" /><path d="M${x} ${y - 1.5} v2.2 h1.8" fill="none" stroke="${c}" stroke-width="1.3" stroke-linecap="round" />`,
  cal: (x, y, c) =>
    `<rect x="${x - 4.8}" y="${y - 4.2}" width="9.6" height="9" rx="1.6" fill="none" stroke="${c}" stroke-width="1.3" /><line x1="${x - 4.8}" y1="${y - 1.4}" x2="${x + 4.8}" y2="${y - 1.4}" stroke="${c}" stroke-width="1.3" />`,
};

/**
 * Run of Show status icons — the exact lucide set getStatusIcon() returns.
 * `skipped` (FastForward) is defined for completeness but unused: its pill is
 * amber, and this figure carries no warm accent.
 */
const statusPill = {
  pending: (x, y, c) =>
    `<circle cx="${x}" cy="${y}" r="5" fill="none" stroke="${c}" stroke-width="1.4" stroke-dasharray="2.6 2.4" />`,
  live: (x, y, c) => `<path d="M${x - 3.4} ${y - 4.4} l7.6 4.4 l-7.6 4.4 z" fill="${c}" />`,
  completed: (x, y, c) =>
    `<circle cx="${x}" cy="${y}" r="5.2" fill="none" stroke="${c}" stroke-width="1.4" /><path d="M${x - 2.4} ${y} l1.8 1.9 l3.2 -3.8" fill="none" stroke="${c}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />`,
};

/* ─────────────────────────── Figure 1 — Documents ─────────────────────────
   Uniform 24px gutters so the whole page block is optically centred. */
function documents() {
  const W = 720, H = 296, M = 24, R = W - M; // content 24 → 696
  const tileW = 159, tileGap = 12;
  const tiles = [
    { label: 'Camera Reports', meta: 'Folder', kind: 'folder' },
    { label: 'Client Deliverables', meta: 'Folder', kind: 'folder' },
    { label: 'Rate Card.pdf', meta: 'Opens in the viewer', kind: 'pdf' },
    { label: 'Location Scout.jpg', meta: 'Opens in the viewer', kind: 'img' },
  ];
  let s = `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16" fill="${CARD}" stroke="${BORDER}" />`;
  s += t(M, 34, 'Documents', { size: 15, weight: 600 });
  // scope selector (segmented control — chrome tier)
  s += `<rect x="${M}" y="48" width="280" height="32" rx="8" fill="${PAGE}" stroke="${BORDER}" />`;
  s += `<rect x="${M + 2}" y="50" width="136" height="28" rx="6" fill="${CHROME}" />`;
  s += t(M + 70, 68, 'My files', { anchor: 'middle' });
  s += t(M + 210, 68, 'Shared with me', { anchor: 'middle', fill: FG55 });
  // search + sort
  s += `<rect x="316" y="48" width="248" height="32" rx="8" fill="${PAGE}" stroke="${BORDER}" />`;
  s += `<circle cx="334" cy="64" r="4.5" fill="none" stroke="${FG45}" stroke-width="1.4" /><line x1="337.5" y1="67.5" x2="341" y2="71" stroke="${FG45}" stroke-width="1.4" stroke-linecap="round" />`;
  s += t(350, 68, 'Search files', { fill: FG45 });
  s += `<rect x="576" y="48" width="120" height="32" rx="8" fill="${PAGE}" stroke="${BORDER}" />`;
  s += t(592, 68, 'Sort: Name', { fill: FG55 });
  // tiles
  tiles.forEach((tile, i) => {
    const x = M + i * (tileW + tileGap);
    s += `<rect x="${x}" y="96" width="${tileW}" height="92" rx="12" fill="${WELL}" stroke="${BORDER}" />`;
    const ix = x + 18;
    if (tile.kind === 'folder') {
      s += `<path d="M${ix} ${124} h15 l4 5 h19 v21 a3 3 0 0 1 -3 3 h-35 a3 3 0 0 1 -3 -3 v-23 a3 3 0 0 1 3 -3 z" fill="${CHIP}" stroke="${CHROME}" stroke-width="1" />`;
    } else if (tile.kind === 'pdf') {
      s += `<rect x="${ix}" y="120" width="26" height="32" rx="4" fill="${CHIP}" stroke="${CHROME}" stroke-width="1" />` + t(ix + 5, 141, 'PDF', { size: 8, weight: 600, fill: FG40 });
    } else {
      s += `<rect x="${ix}" y="120" width="34" height="32" rx="4" fill="${CHIP}" stroke="${CHROME}" stroke-width="1" /><circle cx="${ix + 9}" cy="130" r="3" fill="${FG40}" /><path d="M${ix + 2} 149 l9 -11 l7 8 l5 -5 l9 11 z" fill="${CHROME}" />`;
    }
    s += t(ix, 170, tile.label, { size: 12 });
    s += t(ix, 183, tile.meta, { size: 10, fill: FG55 });
  });
  // storage meter
  s += caps(M, 220, 'STORAGE', FG55);
  s += `<rect x="${M}" y="232" width="${R - M}" height="8" rx="4" fill="${CHIP}" />`;
  s += `<rect x="${M}" y="232" width="236" height="8" rx="4" fill="#3B82F6" />`;
  s += t(M, 264, 'One shared pool for your whole organization, with a per-file upload limit shown before you upload.', { size: 11, fill: FG55 });
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The Documents page: a My files and Shared with me scope selector, search and sort, folder and file tiles, and a storage meter." font-family="${FONT}">${s}</svg>`;
}

/* ─────────────────────── Figure 2 — Run of Show views ───────────────────── */
function runOfShow() {
  const W = 720, H = 300, M = 22;
  // Producer is the active view: its accent is `zinc`, so the figure carries no
  // chromatic tab colour at all — only the neutral underline and header rule.
  const tabs = [
    { label: 'Producer', x: 22, w: 58, active: true },
    { label: 'Camera', x: 100, w: 52 },
    { label: 'Audio', x: 172, w: 40 },
    { label: 'Graphics / LED', x: 232, w: 90 },
    { label: 'Replay / VTR', x: 342, w: 78 },
    { label: 'Stage Manager', x: 440, w: 96 },
  ];
  // Producer's column set (VIEW_PRESETS.producer), trimmed to what fits.
  // No leading segment-type glyph cell — the row starts at the time column and
  // every column reclaims the space.
  const cols = { time: 24, seg: 82, dur: 224, cam: 268, aud: 366, gfx: 448, tal: 528, st: 604 };
  // A Run of Show segment's status vocabulary is its OWN — pending / live /
  // completed / skipped, rendered as a bordered pill with an icon
  // (getStatusColor + getStatusIcon in RunOfShowRow). It is NOT the deliverable
  // status set, and `skipped` is deliberately left out of this figure because
  // its pill is amber.
  const rows = [
    { time: '09:00', seg: 'Doors / Walk-in', dur: '15m', cam: 'Wide', aud: 'House mix', gfx: 'Holding', tal: '—', st: 'completed' },
    { time: '09:15', seg: 'Opening Package', dur: '2m', cam: 'Cam 2', aud: 'VT audio', gfx: 'Title card', tal: 'Host', st: 'completed' },
    { time: '09:17', seg: 'Host Welcome', dur: '3m', cam: 'Cam 1', aud: 'Host mic', gfx: 'L3: Host', tal: 'Host', st: 'live' },
    { time: '09:20', seg: 'Guest Interview', dur: '6m', cam: 'Cam 3', aud: 'Two mics', gfx: 'L3: Guest', tal: 'Host +1', st: 'pending' },
  ];
  // pill triads, composited over --card (bg /10, border /20, text at full)
  const PILL = {
    pending:   { bg: '#1C1C1C', border: '#282828', text: '#9C9C9C', label: 'Pending', w: 78 },
    live:      { bg: '#10211B', border: '#103227', text: '#34D399', label: 'Live', w: 56 },
    completed: { bg: '#1C1C1C', border: '#1C1C1C', text: '#6E6E6E', label: 'Completed', w: 90 },
  };
  let s = `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16" fill="${CARD}" stroke="${BORDER}" />`;
  tabs.forEach((tab) => {
    s += t(tab.x, 42, tab.label, { size: 12, fill: tab.active ? ZINC100 : FG55, weight: tab.active ? 600 : undefined });
    if (tab.active) s += `<rect x="${tab.x}" y="52" width="${tab.w}" height="2" rx="1" fill="${ZINC300}" />`;
  });
  // a project-defined view renders as a swatch, not a coloured label
  s += `<rect x="548" y="34" width="8" height="8" rx="2" fill="${CYAN400}" />`;
  s += t(562, 42, 'Rehearsal Day', { size: 12, fill: FG55 });
  s += t(654, 42, '+ Add view', { size: 12, fill: FG45 });
  s += `<line x1="0" y1="62" x2="${W}" y2="62" stroke="${BORDER}" />`;
  // header + persona hairline (zinc — a plain grey rule, not an accent)
  s += caps(cols.time, 88, 'TIME', FG55) + caps(cols.seg, 88, 'SEGMENT', FG55) + caps(cols.dur, 88, 'DUR', FG55) +
       caps(cols.cam, 88, 'CAMERA', FG55) + caps(cols.aud, 88, 'AUDIO', FG55) + caps(cols.gfx, 88, 'GFX', FG55) +
       caps(cols.tal, 88, 'TALENT', FG55) + caps(cols.st, 88, 'STATUS', FG55);
  s += `<rect x="${M}" y="96" width="${W - M * 2}" height="1.5" fill="${ZINC300}" fill-opacity="0.35" />`;
  rows.forEach((r, i) => {
    const y = 122 + i * 44;
    // the running segment gets the same emerald row wash as the app
    if (r.st === 'live') s += `<rect x="1" y="${y - 22}" width="${W - 2}" height="44" fill="#101816" />`;
    s += t(cols.time, y, r.time, { size: 11, fill: r.st === 'live' ? '#34D399' : CREAM, weight: r.st === 'live' ? 700 : undefined, mono: true });
    s += t(cols.seg, y, r.seg, { size: 12 });
    s += t(cols.dur, y, r.dur, { size: 11, fill: FG55 });
    s += t(cols.cam, y, r.cam, { size: 11, fill: FG55 });
    s += t(cols.aud, y, r.aud, { size: 11, fill: FG55 });
    s += t(cols.gfx, y, r.gfx, { size: 11, fill: FG55 });
    s += t(cols.tal, y, r.tal, { size: 11, fill: r.tal === '—' ? FG45 : FG55 });
    // status pill — a bordered Select trigger, icon + capitalised value
    const p = PILL[r.st];
    s += `<rect x="${cols.st}" y="${y - 14}" width="${p.w}" height="20" rx="6" fill="${p.bg}" stroke="${p.border}" />`;
    s += statusPill[r.st](cols.st + 11, y - 4, p.text);
    s += t(cols.st + 22, y, p.label, { size: 11, weight: 500, fill: p.text });
    if (i < rows.length - 1) s += `<line x1="${M}" y1="${y + 18}" x2="${W - M}" y2="${y + 18}" stroke="${HAIRLINE}" />`;
  });
  s += t(M, 288, "Every view's columns are editable, including the built-in ones — and the view you are on travels in the link.", { size: 11, fill: FG45 });
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Run of Show: a tab strip of six built-in views plus a project-defined one, with the Producer view active and its full cue rundown below." font-family="${FONT}">${s}</svg>`;
}

/* ───────────────────────── Figure 3 — Tasks kanban ──────────────────────── */
function kanban() {
  const W = 720, H = 344, LX = [16, 249, 482], LW = 222;
  const lanes = [
    {
      title: 'NOT STARTED', count: 4, cards: [
        { key: 'TASK', who: 'JM', title: 'Lock location agreements', st: 'circle', stc: ST_NOT_STARTED, stl: 'Not Started', hrs: '6h', due: 'Aug 14' },
        { key: 'DELIVERABLE', who: 'AR', title: 'Sizzle reel — v1', st: 'circle', stc: ST_NOT_STARTED, stl: 'Not Started', hrs: '10h', due: 'Aug 18' },
      ],
    },
    {
      title: 'IN PROGRESS', count: 3, cards: [
        { key: 'TASK', who: 'DP', title: 'Camera package pickup', st: 'circleDot', stc: ST_IN_PROGRESS, stl: 'In Progress', hrs: '12h', due: 'Aug 12' },
        { key: 'MILESTONE', who: 'JM', title: 'Principal photography', st: 'circleDot', stc: ST_IN_PROGRESS, stl: 'In Progress', hrs: '40h', due: 'Aug 15' },
      ],
    },
    {
      title: 'IN REVIEW', count: 1, cards: [
        { key: 'DELIVERABLE', who: 'AR', title: 'Client cut — round 2', st: 'eye', stc: ST_IN_REVIEW, stl: 'In Review', hrs: '8h', due: 'Aug 13' },
      ],
    },
  ];
  let s = `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16" fill="${PAGE}" stroke="${BORDER}" />`;
  lanes.forEach((lane, li) => {
    const lx = LX[li];
    s += `<rect x="${lx}" y="18" width="${LW}" height="308" rx="16" fill="${CARD}" stroke="${BORDER}" />`;
    s += caps(lx + 14, 44, lane.title, FG55, 10);
    s += `<rect x="${lx + LW - 40}" y="32" width="26" height="16" rx="8" fill="${CHIP}" />`;
    s += t(lx + LW - 27, 44, String(lane.count), { size: 10, fill: FG55, anchor: 'middle' });
    lane.cards.forEach((c, ci) => {
      const x = lx + 12, y = 58 + ci * 110, cw = LW - 24;
      s += `<rect x="${x}" y="${y}" width="${cw}" height="100" rx="12" fill="${WELL}" stroke="${BORDER}" />`;
      // row 1 — uppercase key label + assignee avatar
      s += t(x + 14, y + 22, c.key, { size: 10, fill: FG40, track: 1.1 });
      s += `<circle cx="${x + cw - 25}" cy="${y + 17}" r="11" fill="${CHIP}" stroke="${PAGE}" stroke-width="2" />`;
      s += t(x + cw - 25, y + 21, c.who, { size: 9, fill: '#C8C8C8', anchor: 'middle' });
      // row 2 — status glyph + title
      s += glyph[c.st](x + 20, y + 44, c.stc);
      s += t(x + 34, y + 48, c.title, { size: 12 });
      // row 4 — meta chips, due chip right-aligned
      // the status chip carries the SAME glyph as row 2 — MetaChip takes
      // StatusGlyph as its leading element, so the two can never disagree
      s += `<rect x="${x + 14}" y="${y + 66}" width="76" height="20" rx="6" fill="${CHIP}" />`;
      s += glyph[c.st](x + 25, y + 76, c.stc).replace(/r="5\.2"/g, 'r="4"').replace(/r="5\.6"/g, 'r="4.4"');
      s += t(x + 34, y + 80, c.stl, { size: 9, fill: FG55 });
      s += `<rect x="${x + 96}" y="${y + 66}" width="36" height="20" rx="6" fill="${CHIP}" />`;
      s += glyph.timer(x + 106, y + 75, FG45);
      s += t(x + 114, y + 80, c.hrs, { size: 9, fill: FG55 });
      s += `<rect x="${x + cw - 60}" y="${y + 66}" width="46" height="20" rx="6" fill="${CHIP}" />`;
      s += glyph.cal(x + cw - 50, y + 76, FG45);
      s += t(x + cw - 42, y + 80, c.due, { size: 9, fill: FG55 });
    });
    const addY = 58 + lane.cards.length * 110 + 14;
    s += t(lx + LW / 2, addY, '+ Add', { size: 11, fill: FG45, anchor: 'middle' });
  });
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The project Tasks tab as a kanban board: lanes grouped by status, each card carrying a type label, a status glyph, hours and a due date." font-family="${FONT}">${s}</svg>`;
}

/**
 * The registry. `render.js` drives everything from this map, so adding a figure
 * is one function plus one line here.
 *
 * Keys become filenames — keep them kebab-case and named for the SURFACE, not
 * the release ('tasks-kanban', never 'figure-3').
 */
const FIGURES = {
  'documents-storage': documents,
  'run-of-show-views': runOfShow,
  'tasks-kanban': kanban,
};

module.exports = {
  FIGURES,
  // exported so a new figure reuses the exact tones and primitives
  tokens: {
    PAGE, CARD, WELL, CHIP, CHROME, BORDER, HAIRLINE, FG,
    FG30_CARD, FG40_CARD, FG40, FG45, FG55, CREAM,
    ST_NOT_STARTED, ST_IN_PROGRESS, ST_IN_REVIEW, ST_APPROVED,
    SEG_DEFAULT, SEG_VTR, SEG_LIVE, SEG_OPEN, SEG_INTVW,
    AMBER400, AMBER200, ZINC300, ZINC100, CYAN400, FONT,
  },
  primitives: { t, caps, glyph, statusPill, esc },
};
