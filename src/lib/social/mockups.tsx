import type { SocialTheme } from "./themes";
import type { MockupKind } from "./spec";

/**
 * Drawn screens of the ABRAM app, for the product cards.
 *
 * These are built from flex boxes rather than screenshotted. A screenshot
 * would be soft at 1080 wide, would go stale the moment the UI moved, and
 * would carry whatever data happened to be on screen when it was taken.
 * Drawing them means every card is sharp, the data is invented on purpose,
 * and the window picks up the card's own palette.
 *
 * Each one is the FEATURE and nothing else: no nav rail, no app header, no
 * browser chrome. On a card that gets two seconds of attention the shell
 * only eats the space that the one thing worth showing needed. So a screen
 * is its title, its primary action, and its real content, cropped out of
 * the app the way a close-up is cropped out of a wide.
 *
 * Satori rules apply: flexbox only, explicit display: flex on anything
 * with more than one child, no grid, and no glyph that is not in the
 * render font, so icons and ticks are drawn from boxes.
 *
 * Every name, number and brand in here is fictitious.
 */

interface FrameProps {
  theme: SocialTheme;
  /** Scales a size tuned against this screen's reference width */
  u: (n: number) => number;
  /** The brand mark as a data URI, in the ink this theme wants */
  mark: string;
  /**
   * The full lockup, also as a data URI.
   *
   * The app names the assistant in a handful of places, and none of them
   * may be the word set in the body face. Where the product would say
   * ABRAM, these screens set the drawn identity instead.
   */
  lockup: string;
}

/** The lockup is 2400x440, so a height picks the width. */
const LOCKUP_RATIO = 2400 / 440;
/** The mark is 674x1200. */
const MARK_RATIO = 674 / 1200;

/** The identity, at a given cap height. Never the word. */
function Wordmark({ u, lockup, height }: FrameProps & { height: number }) {
  if (!lockup) return null;
  return <img src={lockup} width={Math.round(height * LOCKUP_RATIO)} height={height} alt="ABRAM" style={{ marginTop: u(1) }} />;
}

function Mark({ mark, height }: FrameProps & { height: number }) {
  if (!mark) return null;
  return <img src={mark} width={Math.max(1, Math.round(height * MARK_RATIO))} height={height} alt="" />;
}

/**
 * The vocabulary these screens are allowed to use.
 *
 * Written down because it was not. The file had grown thirteen corner
 * radii, twelve top paddings, ten font sizes (four of them within a pixel
 * of each other at real render scale) and seven tracking values for the
 * same overline role. None of that is visible one screen at a time and all
 * of it is visible across twenty-nine, which is what makes a set read as
 * generated rather than designed.
 *
 * Three radii, four paddings, four sizes, one tracking. Add a screen by
 * reaching in here; if nothing fits, the screen is probably wrong rather
 * than the scale.
 */
const R = { chip: 6, card: 12, pill: 999 } as const;
const PAD = { tight: 8, snug: 12, base: 16, roomy: 22 } as const;
const TYPE = { caption: 10, body: 13, title: 20, figure: 26 } as const;
/** One value, for every uppercase overline in the file. */
const TRACK = "0.12em";

/** Status colours, taken from the product's own token set. */
const STATUS = {
  success: "#10B981",
  info: "#3B82F6",
  warning: "#F97316",
  danger: "#CE1C1C",
  purple: "#A855F7",
} as const;

type Tone = keyof typeof STATUS | "neutral";

function toneColor(theme: SocialTheme, tone: Tone): string {
  return tone === "neutral" ? theme.muted : STATUS[tone];
}

/**
 * A tone at a given opacity.
 *
 * Written because the obvious thing does not work. A tone is usually a six
 * digit hex, so the fills and borders here were built by concatenating two
 * more digits on the end. `neutral` resolves to `theme.muted`, and on a
 * backdrop the ink override makes that an `rgba()` string, so the same
 * concatenation produced `rgba(255,255,255,0.62)30`, which is not a colour
 * and drew nothing. This takes either form and returns something Satori
 * will parse.
 */
function toneAlpha(theme: SocialTheme, tone: Tone, alpha: number): string {
  const colour = toneColor(theme, tone);
  const hex = colour.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const [r, g, b] = [0, 2, 4].map((i) => Number.parseInt(hex[1].slice(i, i + 2), 16));
    return `rgba(${r},${g},${b},${alpha})`;
  }
  const rgba = colour.match(/^rgba?\(([^)]+)\)$/i);
  if (rgba) {
    const [r, g, b] = rgba[1].split(",").map((part) => Number.parseFloat(part.trim()));
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return colour;
}

// ---------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------

function Avatar({ theme, u, initials, size }: FrameProps & { initials: string; size?: number }) {
  const d = size ?? u(22);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: d,
        height: d,
        borderRadius: d,
        backgroundColor: theme.appTile,
        fontSize: Math.round(d * 0.42),
        fontWeight: 600,
        color: theme.secondary,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

/**
 * Satori parses every style value as a string, so a key present with an
 * `undefined` value throws inside its CSS handler rather than being
 * ignored the way the DOM would. Optional dimensions therefore have to be
 * omitted entirely, not passed as undefined.
 */
function optionalWidth(width?: number) {
  // A fixed-width cell next to a growing one still shrinks below its width
  // unless it is told not to, which is what was wrapping short labels onto
  // two lines and letting them run under the column beside them.
  return width === undefined ? {} : { width, flexShrink: 0 };
}

/**
 * One feature of the app, and nothing around it.
 *
 * An earlier version drew the whole product shell here, nav rail and
 * header included. It was recognisably the app, but on a card that is
 * looked at for two seconds the chrome ate the space and shrank the one
 * thing worth showing. So the window is cropped to the feature: its title,
 * its primary action, and its actual content.
 */
function FeaturePanel({
  theme,
  u,
  title,
  action,
  children,
}: FrameProps & { title: React.ReactNode; action?: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        flexGrow: 1,
        paddingLeft: u(22),
        paddingRight: u(22),
        paddingTop: u(20),
        paddingBottom: u(20),
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: u(16) }}>
        <div
          style={{
            display: "flex",
            fontSize: u(TYPE.title),
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: theme.text,
            flexGrow: 1,
          }}
        >
          {title}
        </div>
        {action ? (
          <div
            style={{
              display: "flex",
              fontSize: u(TYPE.caption),
              fontWeight: 600,
              color: theme.appPanel,
              backgroundColor: theme.text,
              borderRadius: u(R.pill),
              paddingLeft: u(12),
              paddingRight: u(12),
              paddingTop: u(6),
              paddingBottom: u(6),
            }}
          >
            {action}
          </div>
        ) : null}
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------
// Pieces used inside the main panel
// ---------------------------------------------------------------------

function Tile({
  theme,
  u,
  label,
  value,
  foot,
  tone = "neutral",
  grow,
}: FrameProps & { label: string; value: string; foot?: string; tone?: Tone; grow?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flexGrow: grow ? 1 : 0,
        backgroundColor: theme.appTile,
        borderRadius: u(R.card),
        paddingLeft: u(PAD.base),
        paddingRight: u(PAD.base),
        paddingTop: u(PAD.snug),
        paddingBottom: u(PAD.snug),
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: u(TYPE.caption),
          fontWeight: 600,
          letterSpacing: TRACK,
          textTransform: "uppercase",
          color: theme.muted,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: u(TYPE.figure),
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: theme.text,
          marginTop: u(6),
        }}
      >
        {value}
      </div>
      {foot ? (
        <div style={{ display: "flex", fontSize: u(TYPE.caption), color: toneColor(theme, tone), marginTop: u(5) }}>{foot}</div>
      ) : null}
    </div>
  );
}

function TileRow({ theme, u, mark, children }: FrameProps & { children: React.ReactNode }) {
  void theme;
  void mark;
  return <div style={{ display: "flex", marginBottom: u(16) }}>{children}</div>;
}

/** Column headings, the thing that makes a list read as a table. */
function TableHead({
  theme,
  u,
  columns,
}: FrameProps & { columns: { label: string; width?: number; grow?: boolean; right?: boolean; padLeft?: number }[] }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        paddingLeft: u(12),
        paddingRight: u(12),
        paddingBottom: u(8),
        borderBottom: `1px solid ${theme.panelBorder}`,
        marginBottom: u(6),
      }}
    >
      {columns.map((column, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: column.right ? "flex-end" : "flex-start",
            ...optionalWidth(column.width),
            // Heads sit over cells that may carry their own inset, and a
            // head with no inset butts straight into the one before it.
            paddingLeft: column.padLeft ?? 0,
            flexGrow: column.grow ? 1 : 0,
            fontSize: u(TYPE.caption),
            fontWeight: 600,
            letterSpacing: TRACK,
            textTransform: "uppercase",
            color: theme.muted,
          }}
        >
          {column.label}
        </div>
      ))}
    </div>
  );
}

function TableRow({ theme, u, children, last }: FrameProps & { children: React.ReactNode; last?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        paddingLeft: u(12),
        paddingRight: u(12),
        paddingTop: u(10),
        paddingBottom: u(10),
        borderBottom: last ? "none" : `1px solid ${theme.panelBorder}`,
      }}
    >
      {children}
    </div>
  );
}

function Badge({ theme, u, label, tone }: FrameProps & { label: string; tone: Tone }) {
  const color = toneColor(theme, tone);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        fontSize: u(TYPE.caption),
        fontWeight: 600,
        letterSpacing: TRACK,
        textTransform: "uppercase",
        color,
        // The tint is the badge. It used to carry a tinted border on top of
        // a tinted fill, which is two marks for one piece of information.
        backgroundColor: tone === "neutral" ? theme.appTile : toneAlpha(theme, tone, 0.16),
        borderRadius: u(R.pill),
        paddingLeft: u(PAD.tight),
        paddingRight: u(PAD.tight),
        paddingTop: u(3),
        paddingBottom: u(3),
      }}
    >
      {label}
    </div>
  );
}

function Meter({ theme, u, percent, width, tone = "info" }: FrameProps & { percent: number; width: number; tone?: Tone }) {
  return (
    <div style={{ display: "flex", width, height: u(6), borderRadius: u(R.chip), backgroundColor: theme.panelBorder }}>
      <div
        style={{
          display: "flex",
          width: Math.max(u(6), Math.round((width * Math.min(100, percent)) / 100)),
          height: u(6),
          borderRadius: u(R.chip),
          backgroundColor: toneColor(theme, tone),
        }}
      />
    </div>
  );
}

/** A cell holding a primary line and a quieter one under it. */
function Cell({ theme, u, title, sub, width, grow }: FrameProps & { title: string; sub?: string; width?: number; grow?: boolean }) {
  return (
    // `flexBasis: 0` alongside the grow: without it the intrinsic width of
    // a long title sets the base size and the cell runs off the panel. This
    // is the most reused growing text cell in the file.
    <div style={{ display: "flex", flexDirection: "column", ...optionalWidth(width), flexGrow: grow ? 1 : 0, flexBasis: grow ? 0 : "auto", minWidth: 0 }}>
      <div style={{ display: "flex", fontSize: u(TYPE.body), fontWeight: 500, color: theme.text }}>{title}</div>
      {sub ? <div style={{ display: "flex", fontSize: u(TYPE.caption), color: theme.muted, marginTop: u(2) }}>{sub}</div> : null}
    </div>
  );
}

function Value({ theme, u, text, width, tone = "neutral", strong }: FrameProps & { text: string; width?: number; tone?: Tone; strong?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        ...optionalWidth(width),
        fontSize: u(TYPE.body),
        fontWeight: strong ? 600 : 400,
        color: tone === "neutral" ? theme.text : toneColor(theme, tone),
      }}
    >
      {text}
    </div>
  );
}

/** A pill button, for the screens whose point is that a decision gets made. */
function Button({ theme, u, label, primary }: FrameProps & { label: string; primary?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: u(TYPE.body),
        fontWeight: 600,
        borderRadius: u(R.pill),
        paddingLeft: u(16),
        paddingRight: u(16),
        paddingTop: u(9),
        paddingBottom: u(9),
        color: primary ? theme.appPanel : theme.secondary,
        backgroundColor: primary ? theme.text : "rgba(0,0,0,0)",
        border: `1px solid ${primary ? theme.text : theme.panelBorder}`,
      }}
    >
      {label}
    </div>
  );
}

// ---------------------------------------------------------------------
// Screens
// ---------------------------------------------------------------------

function Dashboard(p: FrameProps) {
  const { u } = p;
  return (
    <FeaturePanel {...p} title="Good evening" action="New project">
      <TileRow {...p}>
        <div style={{ display: "flex", flexGrow: 1, marginRight: u(10) }}>
          <Tile {...p} label="Active projects" value="4" foot="Of 29 in total" tone="info" grow />
        </div>
        <div style={{ display: "flex", flexGrow: 1 }}>
          <Tile {...p} label="Needs you" value="2" foot="Both due today" tone="warning" grow />
        </div>
      </TileRow>
      <TableHead
        {...p}
        columns={[
          { label: "Project", grow: true },
          { label: "Progress", width: u(110) },
          { label: "Timeline", width: u(112), right: true },
        ]}
      />
      {[
        { name: "Apex Athletic campaign", state: "Planning", budget: "250,000", pct: 35, health: "90", tone: "success" as Tone, when: "8 to 11 Jul" },
        { name: "Sports car commercial", state: "Active", budget: "110,000", pct: 37, health: "85", tone: "success" as Tone, when: "3 to 31 Aug" },
        { name: "District Friends pilot", state: "Active", budget: "5,000", pct: 63, health: "70", tone: "warning" as Tone, when: "1 to 21 Jul" },
      ].map((row, i, all) => (
        <TableRow key={row.name} {...p} last={i === all.length - 1}>
          <Cell {...p} title={row.name} sub={row.state} grow />
          <Value {...p} text={row.budget} width={u(90)} />
          <div style={{ display: "flex", alignItems: "center", width: u(110), flexShrink: 0, paddingLeft: u(12) }}>
            <Meter {...p} percent={row.pct} width={u(62)} tone="info" />
            <div style={{ display: "flex", fontSize: u(TYPE.caption), color: p.theme.muted, marginLeft: u(8) }}>{row.pct}%</div>
          </div>
          <div style={{ display: "flex", width: u(64), flexShrink: 0, justifyContent: "flex-end" }}>
            <Badge {...p} label={row.health} tone={row.tone} />
          </div>
          <div style={{ display: "flex", width: u(112), flexShrink: 0, justifyContent: "flex-end", fontSize: u(TYPE.caption), color: p.theme.muted }}>
            {row.when}
          </div>
        </TableRow>
      ))}
    </FeaturePanel>
  );
}

/**
 * The work of a job, grouped the way a production is actually structured.
 *
 * Not a flat task list. Work packages hold deliverables, work orders and
 * milestones, and the grouping is what makes a hundred-line job legible,
 * so the grouping is what the card has to show.
 */
function Tasks(p: FrameProps) {
  const { u, theme } = p;
  const packages = [
    {
      name: "Principal photography",
      done: "1/2 done",
      tone: "info" as Tone,
      rows: [
        { name: "Full shoot package", kind: "Work order", kindTone: "info" as Tone, state: "Wrapped", stateTone: "success" as Tone },
        { name: "Principal photography", kind: "Deliverable", kindTone: "purple" as Tone, state: "Not started", stateTone: "neutral" as Tone },
      ],
    },
    {
      name: "Post and delivery",
      done: "0/2 done",
      tone: "purple" as Tone,
      rows: [
        { name: "Hero 60s spot delivery", kind: "Deliverable", kindTone: "purple" as Tone, state: "Not started", stateTone: "neutral" as Tone },
        { name: "Client sign off", kind: "Milestone", kindTone: "warning" as Tone, state: "Not started", stateTone: "neutral" as Tone },
      ],
    },
    {
      name: "Pre-production",
      done: "2/2 done",
      tone: "success" as Tone,
      rows: [
        { name: "Location scouts finalised", kind: "Deliverable", kindTone: "purple" as Tone, state: "Completed", stateTone: "success" as Tone },
        { name: "Shot list and lookbook", kind: "Deliverable", kindTone: "purple" as Tone, state: "Completed", stateTone: "success" as Tone },
      ],
    },
  ];

  return (
    <FeaturePanel {...p} title="Apex Athletic campaign" action="Add work package">
      {packages.map((pkg, g) => (
        <div key={pkg.name} style={{ display: "flex", flexDirection: "column", marginBottom: g === packages.length - 1 ? 0 : u(12) }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: u(7) }}>
            <div
              style={{
                display: "flex",
                width: u(7),
                height: u(7),
                borderRadius: u(R.chip),
                backgroundColor: toneColor(theme, pkg.tone),
                marginRight: u(9),
              }}
            />
            <div style={{ display: "flex", fontSize: u(TYPE.body), fontWeight: 600, color: theme.text, flexGrow: 1, flexBasis: 0 }}>{pkg.name}</div>
            <div style={{ display: "flex", fontSize: u(TYPE.caption), color: theme.muted }}>{pkg.done}</div>
          </div>

          {pkg.rows.map((row, i, all) => (
            <div
              key={row.name}
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: theme.appTile,
                borderRadius: u(R.chip),
                paddingLeft: u(11),
                paddingRight: u(11),
                paddingTop: u(8),
                paddingBottom: u(8),
                marginBottom: i === all.length - 1 ? 0 : u(4),
              }}
            >
              <div style={{ display: "flex", flexGrow: 1, flexBasis: 0, minWidth: 0, fontSize: u(TYPE.body), color: theme.text }}>{row.name}</div>
              <div style={{ display: "flex", width: u(104), flexShrink: 0 }}>
                <Badge {...p} label={row.kind} tone={row.kindTone} />
              </div>
              <div style={{ display: "flex", width: u(104), flexShrink: 0, justifyContent: "flex-end" }}>
                <Badge {...p} label={row.state} tone={row.stateTone} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </FeaturePanel>
  );
}

function CallSheet(p: FrameProps) {
  const { u, theme } = p;
  return (
    <FeaturePanel {...p} title="Day 12 call sheet" action="Send to 14">
      <TableHead
        {...p}
        columns={[
          { label: "Name", grow: true },
          { label: "Department", width: u(110) },
          { label: "Call", width: u(70), right: true },
        ]}
      />
      {[
        { id: "A-01", name: "L. Vance", dept: "Cast, lead", call: "08:30" },
        { id: "DP", name: "J. Rhee", dept: "Camera", call: "07:00" },
        { id: "SND", name: "V. Lin", dept: "Sound", call: "07:30" },
      ].map((row, i, all) => (
        <TableRow key={row.id} {...p} last={i === all.length - 1}>
          <div style={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
            <Avatar {...p} initials={row.name.slice(3, 5).toUpperCase()} size={u(20)} />
            <div style={{ display: "flex", fontSize: u(TYPE.body), color: theme.text, marginLeft: u(10) }}>{row.name}</div>
          </div>
          <div style={{ display: "flex", width: u(110), flexShrink: 0, fontSize: u(TYPE.body), color: theme.muted }}>{row.dept}</div>
          <Value {...p} text={row.call} width={u(70)} strong />
        </TableRow>
      ))}
    </FeaturePanel>
  );
}

/**
 * The stripboard, as the day it actually is.
 *
 * The strip down the left edge is the part that makes this read as a
 * schedule and not a list: amber for exteriors, which is the thing that
 * moves when the weather does, and blue for the interiors that do not.
 */
function Schedule(p: FrameProps) {
  const { u, theme } = p;
  const scenes = [
    { no: "1", pages: "1/2", type: "EXT/DAY", tone: "warning" as Tone, synopsis: "Hero athlete warm-up", location: "Griffith Park trail", time: "1.5h" },
    { no: "2", pages: "1", type: "EXT/DAY", tone: "warning" as Tone, synopsis: "Performance sprint sequence", location: "Griffith Park trail", time: "2.5h" },
    { no: "3", pages: "1/2", type: "INT/DAY", tone: "info" as Tone, synopsis: "Downtown strength training", location: "Downtown gym", time: "2h" },
    { no: "5", pages: "3/8", type: "EXT/DUSK", tone: "purple" as Tone, synopsis: "Sunset victory shot", location: "Griffith overlook", time: "1h" },
  ];

  return (
    <FeaturePanel {...p} title="Wednesday, day 2 of 3" action="Sync crew">
      <div style={{ display: "flex", marginBottom: u(12) }}>
        <Badge {...p} label="Call 06:00" tone="neutral" />
        <div style={{ display: "flex", marginLeft: u(8) }}>
          <Badge {...p} label="Shooting day" tone="info" />
        </div>
        <div style={{ display: "flex", marginLeft: u(8) }}>
          <Badge {...p} label="2 3/8 pages" tone="neutral" />
        </div>
      </div>

      <TableHead
        {...p}
        columns={[
          { label: "Sc.", width: u(42) },
          { label: "Type", width: u(84) },
          { label: "Synopsis", grow: true },
          { label: "Location", width: u(140) },
        ]}
      />

      {scenes.map((scene) => (
        <div
          key={scene.no}
          style={{
            display: "flex",
            alignItems: "center",
            // The coloured edge is the strip. It is the whole reason a
            // stripboard is a stripboard.
            borderLeft: `${u(6)}px solid ${toneColor(theme, scene.tone)}`,
            backgroundColor: theme.appTile,
            borderRadius: u(R.chip),
            paddingLeft: u(10),
            paddingRight: u(10),
            paddingTop: u(9),
            paddingBottom: u(9),
            marginBottom: u(5),
          }}
        >
          <div style={{ display: "flex", width: u(42), flexShrink: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: u(20),
                height: u(18),
                borderRadius: u(R.chip),
                backgroundColor: theme.appShell,
                fontSize: u(TYPE.caption),
                fontWeight: 700,
                color: theme.text,
              }}
            >
              {scene.no}
            </div>
          </div>
          <div style={{ display: "flex", width: u(84), flexShrink: 0 }}>
            <Badge {...p} label={scene.type} tone={scene.tone} />
          </div>
          <div style={{ display: "flex", flexGrow: 1, flexBasis: 0, minWidth: 0, fontSize: u(TYPE.body), color: theme.text }}>{scene.synopsis}</div>
          <div style={{ display: "flex", alignItems: "center", width: u(140), flexShrink: 0 }}>
            <div
              style={{
                display: "flex",
                width: u(5),
                height: u(5),
                borderRadius: u(R.chip),
                backgroundColor: theme.muted,
                marginRight: u(7),
              }}
            />
            <div style={{ display: "flex", fontSize: u(TYPE.caption), color: theme.muted }}>{scene.location}</div>
          </div>
        </div>
      ))}

      <div style={{ display: "flex", alignItems: "center", marginTop: u(12) }}>
        <div style={{ display: "flex", width: u(7), height: u(7), borderRadius: u(R.chip), backgroundColor: STATUS.warning, marginRight: u(10) }} />
        <div style={{ display: "flex", fontSize: u(TYPE.body), color: theme.secondary }}>
          Move scene 3 and every call time after it moves with it.
        </div>
      </div>
    </FeaturePanel>
  );
}

/**
 * Capacity as a heatmap rather than a list of percentages.
 *
 * A bar chart of utilisation tells you who is busy. This tells you which
 * Tuesday, which is the only version of the question anyone actually
 * needs answered. Four weeks of weekdays across, people down, and the
 * empty column in the middle of week 34 is the whole card.
 */
function Capacity(p: FrameProps) {
  const { u, theme } = p;
  const weeks = ["W32", "W33", "W34", "W35"];
  // Hours per weekday. 0 is free, and anything over 8 is somebody's evening.
  const people = [
    { name: "A. Kroll", role: "Producer", days: [8, 8, 8, 6, 4, 8, 8, 8, 8, 8, 0, 0, 4, 8, 8, 8, 8, 6, 0, 0] },
    { name: "J. Rhee", role: "Camera", days: [8, 8, 10, 10, 8, 0, 0, 0, 0, 0, 8, 8, 8, 8, 4, 0, 0, 0, 0, 0] },
    { name: "M. Reyes", role: "Editor", days: [0, 0, 4, 8, 8, 8, 8, 8, 10, 12, 8, 8, 8, 8, 8, 8, 8, 8, 4, 0] },
    { name: "Open", role: "Colourist", unassigned: true, days: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 8, 8, 8, 4] },
  ];

  // Work nobody is doing has to look different from work somebody is, or
  // the last row reads as a fifth booked person and the callout under it
  // makes no sense.
  const cellTone = (hours: number, unassigned?: boolean): Tone | null => {
    if (hours === 0) return null;
    if (unassigned) return "danger";
    if (hours > 8) return "warning";
    return "info";
  };

  const nameWidth = u(104);

  return (
    <FeaturePanel {...p} title="Who is free, and when" action="Plan">

      {/* Week headings, sitting over their five weekdays */}
      <div style={{ display: "flex", marginBottom: u(6) }}>
        <div style={{ display: "flex", width: nameWidth, flexShrink: 0 }} />
        {weeks.map((week, i) => (
          <div
            key={week}
            style={{
              display: "flex",
              flexGrow: 1,
              flexBasis: 0,
              marginRight: i === weeks.length - 1 ? 0 : u(8),
              fontSize: u(TYPE.caption),
              fontWeight: 600,
              letterSpacing: TRACK,
              color: theme.muted,
            }}
          >
            {week}
          </div>
        ))}
      </div>

      {people.map((person, r) => (
        <div key={person.name} style={{ display: "flex", alignItems: "center", marginBottom: r === people.length - 1 ? 0 : u(6) }}>
          <div style={{ display: "flex", flexDirection: "column", width: nameWidth, flexShrink: 0 }}>
            <div style={{ display: "flex", fontSize: u(TYPE.body), fontWeight: 500, color: theme.text }}>{person.name}</div>
            <div style={{ display: "flex", fontSize: u(TYPE.caption), color: theme.muted, marginTop: u(1) }}>{person.role}</div>
          </div>
          {weeks.map((week, w) => (
            <div
              key={week}
              style={{ display: "flex", flexGrow: 1, flexBasis: 0, marginRight: w === weeks.length - 1 ? 0 : u(8) }}
            >
              {person.days.slice(w * 5, w * 5 + 5).map((hours, d) => {
                const tone = cellTone(hours, person.unassigned);
                return (
                  <div
                    key={d}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexGrow: 1,
                      flexBasis: 0,
                      minWidth: 0,
                      height: u(26),
                      marginRight: d === 4 ? 0 : u(3),
                      borderRadius: u(R.chip),
                      fontSize: u(TYPE.caption),
                      fontWeight: 600,
                      color: tone ? toneColor(theme, tone) : theme.panelBorder,
                      backgroundColor: tone ? toneAlpha(theme, tone, 0.18) : theme.appTile,
                      border: `1px solid ${tone ? toneAlpha(theme, tone, 0.35) : theme.panelBorder}`,
                    }}
                  >
                    {hours === 0 ? "" : String(hours)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ))}

      <div style={{ display: "flex", alignItems: "center", marginTop: u(14) }}>
        <div style={{ display: "flex", width: u(7), height: u(7), borderRadius: u(R.chip), backgroundColor: STATUS.danger, marginRight: u(10) }} />
        <div style={{ display: "flex", fontSize: u(TYPE.body), color: theme.secondary }}>
          Week 35 has thirty-four hours of colour and nobody booked to do it.
        </div>
      </div>
    </FeaturePanel>
  );
}

function Budget(p: FrameProps) {
  const { u } = p;
  return (
    <FeaturePanel {...p} title="Budget and margin" action="Export">
      <TableHead
        {...p}
        columns={[
          { label: "Line", grow: true },
          { label: "Actual", width: u(96), right: true },
          { label: "Variance", width: u(96), right: true },
        ]}
      />
      {[
        { label: "Crew", sub: "18 people", actual: "36,910", diff: "-1,490", tone: "success" as Tone },
        { label: "Equipment", sub: "Camera, grip", actual: "12,850", diff: "+850", tone: "warning" as Tone },
        { label: "Post", sub: "Edit, colour", actual: "15,400", diff: "-600", tone: "success" as Tone },
      ].map((row, i, all) => (
        <TableRow key={row.label} {...p} last={i === all.length - 1}>
          <Cell {...p} title={row.label} sub={row.sub} grow />
          <Value {...p} text={row.actual} width={u(96)} strong />
          <Value {...p} text={row.diff} width={u(96)} tone={row.tone} />
        </TableRow>
      ))}
    </FeaturePanel>
  );
}

/**
 * What the client sees: what they are owed, and where they said so.
 *
 * Drawn as two columns because that is the argument. The deliverables and
 * the conversation about them are on one screen, which is the difference
 * between a decision you can point at and a thread you have to reconstruct.
 */
function Portal(p: FrameProps) {
  const { u, theme } = p;
  const deliverables = [
    { name: "Unreal environments", when: "Approved 24d ago", tone: "success" as Tone },
    { name: "Shot list and storyboards", when: "Approved 12d ago", tone: "success" as Tone },
    { name: "Call sheet and crew manifest", when: "Approved 24d ago", tone: "success" as Tone },
    { name: "Raw LED volume footage", when: "Due 18 Aug", tone: "info" as Tone },
    { name: "Final 30 second spot", when: "Due 30 Aug", tone: "info" as Tone },
  ];

  const messages = [
    { text: "Storyboards look right. Approved.", mine: false },
    { text: "Can we see the desert highway pass?", mine: false },
    { text: "Uploading it now. Cut is 30 seconds flat.", mine: true },
    { text: "Perfect. Sending this up the chain.", mine: false },
  ];

  return (
    <FeaturePanel {...p} title="Sports car commercial" action="Share link">
      <div style={{ display: "flex", flexGrow: 1 }}>
        {/* Deliverables */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            flexBasis: 0,
            minWidth: 0,
            marginRight: u(12),
            backgroundColor: theme.appTile,
            borderRadius: u(R.card),
            padding: u(14),
          }}
        >
          <div style={{ display: "flex", alignItems: "center", marginBottom: u(12) }}>
            <div style={{ display: "flex", fontSize: u(TYPE.caption), fontWeight: 600, letterSpacing: TRACK, textTransform: "uppercase", color: theme.muted, flexGrow: 1 }}>
              Deliverables
            </div>
            <div style={{ display: "flex", fontSize: u(TYPE.caption), color: theme.muted }}>3/5 approved</div>
          </div>
          {deliverables.map((item, i, all) => (
            <div key={item.name} style={{ display: "flex", alignItems: "flex-start", marginBottom: i === all.length - 1 ? 0 : u(11) }}>
              <div
                style={{
                  display: "flex",
                  width: u(6),
                  height: u(6),
                  borderRadius: u(R.chip),
                  backgroundColor: toneColor(theme, item.tone),
                  marginTop: u(5),
                  marginRight: u(9),
                  flexShrink: 0,
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, minWidth: 0 }}>
                <div style={{ display: "flex", fontSize: u(TYPE.body), color: theme.text, lineHeight: 1.3 }}>{item.name}</div>
                <div style={{ display: "flex", fontSize: u(TYPE.caption), color: theme.muted, marginTop: u(2) }}>{item.when}</div>
              </div>
            </div>
          ))}
        </div>

        {/* And the conversation about them */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            flexBasis: 0,
            minWidth: 0,
            backgroundColor: theme.appTile,
            borderRadius: u(R.card),
            padding: u(14),
          }}
        >
          <div style={{ display: "flex", alignItems: "center", marginBottom: u(12) }}>
            <div style={{ display: "flex", fontSize: u(TYPE.caption), fontWeight: 600, letterSpacing: TRACK, textTransform: "uppercase", color: theme.muted, flexGrow: 1 }}>
              Discussion
            </div>
            <div style={{ display: "flex", fontSize: u(TYPE.caption), color: theme.muted }}>14 messages</div>
          </div>
          {messages.map((message, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: message.mine ? "flex-end" : "flex-start",
                marginBottom: u(8),
              }}
            >
              <div
                style={{
                  display: "flex",
                  maxWidth: "88%",
                  fontSize: u(TYPE.caption),
                  lineHeight: 1.35,
                  color: message.mine ? theme.appPanel : theme.text,
                  backgroundColor: message.mine ? theme.text : theme.appShell,
                  border: `1px solid ${message.mine ? theme.text : theme.panelBorder}`,
                  borderRadius: u(R.card),
                  paddingLeft: u(10),
                  paddingRight: u(10),
                  paddingTop: u(7),
                  paddingBottom: u(7),
                }}
              >
                {message.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </FeaturePanel>
  );
}

function Inventory(p: FrameProps) {
  const { u } = p;
  return (
    <FeaturePanel {...p} title="Camera and grip" action="Check out">
      <TableHead
        {...p}
        columns={[
          { label: "Item", grow: true },
          { label: "Back", width: u(80) },
          { label: "Status", width: u(104), right: true },
        ]}
      />
      {[
        { name: "Cine body, 8K", sub: "Helix launch film", serial: "CB-1042", back: "Fri", status: "In use", tone: "info" as Tone },
        { name: "Prime set, 6 lens", sub: "Held for Vesper", serial: "PS-0219", back: "Mon", status: "Reserved", tone: "purple" as Tone },
        { name: "Lighting cart B", sub: "Workspace", serial: "LC-0067", back: "-", status: "Available", tone: "success" as Tone },
      ].map((row, i, all) => (
        <TableRow key={row.serial} {...p} last={i === all.length - 1}>
          <Cell {...p} title={row.name} sub={row.sub} grow />
          <div style={{ display: "flex", width: u(80), flexShrink: 0, fontSize: u(TYPE.body), color: p.theme.muted }}>{row.back}</div>
          <div style={{ display: "flex", width: u(104), flexShrink: 0, justifyContent: "flex-end" }}>
            <Badge {...p} label={row.status} tone={row.tone} />
          </div>
        </TableRow>
      ))}
    </FeaturePanel>
  );
}

/**
 * Asking it directly, and watching it work.
 *
 * The visible steps are the point and not decoration. A chat window that
 * only shows an answer is asking to be trusted; one that shows it went and
 * looked at the schedule first, and says out loud that it is checking
 * before it writes so it does not clobber existing shoot days, is asking
 * to be checked. That is a different product and a much better card.
 */
function Chat(p: FrameProps) {
  const { u, theme } = p;
  const steps = [
    { text: "Finding the project.", done: true },
    { text: "Northwind Outdoor soft shell campaign. Checking the schedule before I draft, so I do not clobber days that already exist.", done: true },
    { text: "No shoot days on the board yet. Drafting from the scene list.", done: false },
  ];

  return (
    <FeaturePanel
      {...p}
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          <Wordmark {...p} height={u(16)} />
          <div style={{ display: "flex", fontSize: u(TYPE.title), fontWeight: 700, letterSpacing: "-0.02em", color: theme.muted, marginLeft: u(12) }}>
            Agent
          </div>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
        {/* Asked */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: u(14) }}>
          <div
            style={{
              display: "flex",
              maxWidth: "68%",
              fontSize: u(TYPE.body),
              lineHeight: 1.4,
              color: theme.text,
              backgroundColor: theme.appTile,
              borderRadius: u(R.card),
              padding: u(12),
            }}
          >
            Draft a call sheet for Ridgeline 3
          </div>
        </div>

        {/* Working, out loud */}
        {steps.map((step, i) => (
          <div key={step.text} style={{ display: "flex", alignItems: "flex-start", marginBottom: u(10), paddingLeft: u(2) }}>
            <div
              style={{
                display: "flex",
                width: u(6),
                height: u(6),
                borderRadius: u(R.chip),
                backgroundColor: step.done ? STATUS.success : theme.accent,
                marginTop: u(6),
                marginRight: u(11),
                flexShrink: 0,
              }}
            />
            <div
              style={{
                display: "flex",
                maxWidth: "88%",
                fontSize: u(TYPE.body),
                lineHeight: 1.45,
                color: i === steps.length - 1 ? theme.secondary : theme.muted,
              }}
            >
              {step.text}
            </div>
          </div>
        ))}

        {/* What came back */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            backgroundColor: theme.appTile,
            borderRadius: u(R.card),
            padding: u(12),
            marginTop: u(4),
          }}
        >
          <div style={{ display: "flex", fontSize: u(TYPE.body), fontWeight: 600, color: theme.text, marginBottom: u(10) }}>
            Day 1 drafted, ready to send
          </div>
          {[
            { text: "Unit call 06:00. Three scenes, 2 3/8 pages.", tone: "info" as Tone },
            { text: "Nine crew pulled from the project roster.", tone: "success" as Tone },
            { text: "One turnaround is tight. Flagged for you to call.", tone: "warning" as Tone },
          ].map((line, i, all) => (
            <div key={line.text} style={{ display: "flex", alignItems: "center", marginBottom: i === all.length - 1 ? 0 : u(8) }}>
              <div
                style={{
                  display: "flex",
                  width: u(5),
                  height: u(5),
                  borderRadius: u(R.chip),
                  backgroundColor: toneColor(theme, line.tone),
                  marginRight: u(10),
                }}
              />
              <div style={{ display: "flex", fontSize: u(TYPE.caption), color: theme.muted }}>{line.text}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexGrow: 1 }} />

        {/* Composer, with the skills picker the real one carries */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            borderRadius: u(R.card),
            border: `1px solid ${theme.panelBorder}`,
            backgroundColor: theme.appTile,
            paddingLeft: u(14),
            paddingRight: u(10),
            paddingTop: u(11),
            paddingBottom: u(9),
            marginTop: u(12),
          }}
        >
          <div style={{ display: "flex", fontSize: u(TYPE.body), color: theme.muted, marginBottom: u(10) }}>
            Ask about this production
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <Mark {...p} height={u(14)} />
            <div style={{ display: "flex", fontSize: u(TYPE.caption), fontWeight: 600, color: theme.secondary, marginLeft: u(8) }}>
              Skills
            </div>
            <div style={{ display: "flex", flexGrow: 1 }} />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: u(26),
                height: u(26),
                borderRadius: u(R.pill),
                backgroundColor: theme.text,
                fontSize: u(TYPE.body),
                fontWeight: 700,
                color: theme.appPanel,
              }}
            >
              &#8593;
            </div>
          </div>
        </div>
      </div>
    </FeaturePanel>
  );
}

function Breakdown(p: FrameProps) {
  const { u, theme } = p;
  return (
    <FeaturePanel {...p} title="Scene 14A" action="Tag all">
      <TableHead {...p} columns={[{ label: "Category", width: u(130) }, { label: "Tagged", grow: true }, { label: "Count", width: u(70), right: true }]} />
      {[
        { label: "Cast", detail: "L. Vance, S. Apex", count: "2", tone: "purple" as Tone },
        { label: "Props", detail: "Crowbar, handheld radio, crate", count: "7", tone: "info" as Tone },
        { label: "Wardrobe", detail: "Rain coat, continuity set", count: "3", tone: "neutral" as Tone },
        { label: "Special effects", detail: "Rain rig, practical spark", count: "2", tone: "neutral" as Tone },
      ].map((row, i, all) => (
        <TableRow key={row.label} {...p} last={i === all.length - 1}>
          <div style={{ display: "flex", width: u(130), flexShrink: 0 }}>
            <Badge {...p} label={row.label} tone={row.tone} />
          </div>
          <div style={{ display: "flex", fontSize: u(TYPE.body), color: theme.secondary, flexGrow: 1, flexBasis: 0 }}>{row.detail}</div>
          <Value {...p} text={row.count} width={u(70)} strong />
        </TableRow>
      ))}
    </FeaturePanel>
  );
}

function Crew(p: FrameProps) {
  const { u } = p;
  return (
    <FeaturePanel {...p} title="Gaffer, week of the 14th" action="Invite">
      <div style={{ display: "flex", marginBottom: u(14) }}>
        <Badge {...p} label="Los Angeles" tone="neutral" />
        <div style={{ display: "flex", marginLeft: u(8) }}>
          <Badge {...p} label="Availability checked" tone="success" />
        </div>
        <div style={{ display: "flex", marginLeft: u(8) }}>
          <Badge {...p} label="4 matches" tone="info" />
        </div>
      </div>
      <TableHead
        {...p}
        columns={[
          { label: "Name", grow: true },
          { label: "Rate", width: u(90), right: true },
          { label: "That week", width: u(96), right: true },
        ]}
      />
      {[
        { name: "R. Okafor", role: "Gaffer, 11 yrs", rate: "650/day", status: "Free", tone: "success" as Tone },
        { name: "M. Bright", role: "Key grip, 14 yrs", rate: "600/day", status: "Held", tone: "warning" as Tone },
        { name: "C. Alder", role: "Gaffer, 5 yrs", rate: "580/day", status: "Booked", tone: "neutral" as Tone },
      ].map((row, i, all) => (
        <TableRow key={row.name} {...p} last={i === all.length - 1}>
          <div style={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
            <Avatar {...p} initials={row.name[0] + row.name.split(" ")[1][0]} size={u(22)} />
            <div style={{ display: "flex", marginLeft: u(10) }}>
              <Cell {...p} title={row.name} sub={row.role} />
            </div>
          </div>
          <Value {...p} text={row.rate} width={u(90)} />
          <div style={{ display: "flex", width: u(96), flexShrink: 0, justifyContent: "flex-end" }}>
            <Badge {...p} label={row.status} tone={row.tone} />
          </div>
        </TableRow>
      ))}
    </FeaturePanel>
  );
}

function Invoice(p: FrameProps) {
  const { u } = p;
  return (
    <FeaturePanel {...p} title="This quarter" action="New invoice">
      <TableHead
        {...p}
        columns={[
          { label: "Client", grow: true },
          { label: "Amount", width: u(96), right: true },
          { label: "Status", width: u(104), right: true },
        ]}
      />
      {[
        { client: "Helix", sub: "Launch film", due: "Paid", amount: "18,400", status: "Paid", tone: "success" as Tone },
        { client: "Vesper Studios", sub: "Brand series", due: "12 Aug", amount: "12,000", status: "Sent", tone: "neutral" as Tone },
        { client: "Nebula", sub: "Event coverage", due: "30 Jul", amount: "6,750", status: "Overdue", tone: "danger" as Tone },
      ].map((row, i, all) => (
        <TableRow key={row.client} {...p} last={i === all.length - 1}>
          <Cell {...p} title={row.client} sub={row.sub} grow />
          <Value {...p} text={row.amount} width={u(96)} strong />
          <div style={{ display: "flex", width: u(104), flexShrink: 0, justifyContent: "flex-end" }}>
            <Badge {...p} label={row.status} tone={row.tone} />
          </div>
        </TableRow>
      ))}
    </FeaturePanel>
  );
}

function RunOfShow(p: FrameProps) {
  const { u, theme } = p;
  return (
    <FeaturePanel {...p} title="Launch night" action="Go live">
      <div style={{ display: "flex", marginBottom: u(14) }}>
        <Badge {...p} label="Live" tone="danger" />
        <div style={{ display: "flex", marginLeft: u(8) }}>
          <Badge {...p} label="On time" tone="success" />
        </div>
        <div style={{ display: "flex", marginLeft: u(8) }}>
          <Badge {...p} label="Next in 12m" tone="neutral" />
        </div>
      </div>
      <TableHead
        {...p}
        columns={[
          { label: "Time", width: u(78) },
          { label: "Segment", grow: true },
          { label: "Runs", width: u(64), right: true },
        ]}
      />
      {[
        { time: "18:00", label: "Doors and welcome drinks", run: "45m", done: true },
        { time: "18:55", label: "Film screening", run: "22m", done: false },
        { time: "19:20", label: "Panel and questions", run: "35m", done: false },
      ].map((row, i, all) => (
        <TableRow key={row.time} {...p} last={i === all.length - 1}>
          <div
            style={{
              display: "flex",
              width: u(78),
              flexShrink: 0,
              fontSize: u(TYPE.body),
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: row.done ? theme.muted : theme.text,
            }}
          >
            {row.time}
          </div>
          <div style={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
            <div
              style={{
                display: "flex",
                width: u(7),
                height: u(7),
                borderRadius: u(R.chip),
                backgroundColor: row.done ? STATUS.success : theme.panelBorder,
                marginRight: u(10),
              }}
            />
            <div style={{ display: "flex", fontSize: u(TYPE.body), color: row.done ? theme.muted : theme.text }}>{row.label}</div>
          </div>
          <Value {...p} text={row.run} width={u(64)} />
        </TableRow>
      ))}
    </FeaturePanel>
  );
}

/**
 * The client's own front door.
 *
 * Worth its own screen because it is the part of the product the client
 * actually meets, and because "your clients get this too" is a different
 * claim from anything the producer-facing screens can make. The studio
 * name is the client's; the mark on it is theirs, not ours.
 */
function ClientHome(p: FrameProps) {
  const { u, theme } = p;
  const projects = [
    { name: "National sales kickoff", sub: "Three day live event", pct: 5, state: "On hold", tone: "neutral" as Tone },
    { name: "Sports car commercial", sub: "LED volume, two environments", pct: 37, state: "In progress", tone: "info" as Tone },
    { name: "Leadership shoot", sub: "Three people, one afternoon", pct: 0, state: "Planning", tone: "neutral" as Tone },
  ];
  const activity = [
    { text: "You approved Shot list and storyboards", when: "12d ago", tone: "success" as Tone },
    { text: "Raw LED volume footage moved to In progress", when: "24d ago", tone: "neutral" as Tone },
    { text: "Context added to Unreal environments", when: "24d ago", tone: "neutral" as Tone },
  ];

  return (
    <FeaturePanel {...p} title="Your projects" action="New request">
      <div style={{ display: "flex", marginBottom: u(14) }}>
        {projects.map((project, i, all) => (
          <div
            key={project.name}
            style={{
              display: "flex",
              flexDirection: "column",
              flexGrow: 1,
              flexBasis: 0,
              minWidth: 0,
              marginRight: i === all.length - 1 ? 0 : u(10),
              backgroundColor: theme.appTile,
              borderRadius: u(R.card),
              padding: u(13),
            }}
          >
            <div style={{ display: "flex", fontSize: u(TYPE.body), fontWeight: 600, color: theme.text, lineHeight: 1.25 }}>
              {project.name}
            </div>
            <div style={{ display: "flex", fontSize: u(TYPE.caption), color: theme.muted, marginTop: u(4), lineHeight: 1.3 }}>
              {project.sub}
            </div>
            <div style={{ display: "flex", alignItems: "center", marginTop: u(12) }}>
              <Meter {...p} percent={project.pct} width={u(80)} tone={project.pct > 0 ? "info" : "neutral"} />
              <div style={{ display: "flex", fontSize: u(TYPE.caption), color: theme.muted, marginLeft: u(8) }}>{project.pct}%</div>
            </div>
            <div style={{ display: "flex", marginTop: u(10) }}>
              <Badge {...p} label={project.state} tone={project.tone} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", fontSize: u(TYPE.caption), fontWeight: 600, letterSpacing: TRACK, textTransform: "uppercase", color: theme.muted, marginBottom: u(9) }}>
        Recent activity
      </div>
      {activity.map((row, i, all) => (
        <div
          key={row.text}
          style={{
            display: "flex",
            alignItems: "center",
            paddingTop: u(9),
            paddingBottom: u(9),
            borderBottom: i === all.length - 1 ? "none" : `1px solid ${theme.panelBorder}`,
          }}
        >
          <div
            style={{
              display: "flex",
              width: u(6),
              height: u(6),
              borderRadius: u(R.chip),
              backgroundColor: toneColor(theme, row.tone),
              marginRight: u(10),
            }}
          />
          <div style={{ display: "flex", flexGrow: 1, flexBasis: 0, fontSize: u(TYPE.body), color: theme.secondary }}>{row.text}</div>
          <div style={{ display: "flex", fontSize: u(TYPE.caption), color: theme.muted }}>{row.when}</div>
        </div>
      ))}
    </FeaturePanel>
  );
}

function Timecard(p: FrameProps) {
  const { u } = p;
  return (
    <FeaturePanel {...p} title="Week 32" action="Approve all">
      <TableHead
        {...p}
        columns={[
          { label: "Person", grow: true },
          { label: "Hours", width: u(88), right: true },
          { label: "Status", width: u(104), right: true },
        ]}
      />
      {[
        { name: "Maya R.", role: "Editor", hours: "38.5", status: "Approved", tone: "success" as Tone },
        { name: "Dev P.", role: "Colourist", hours: "31.0", status: "Approved", tone: "success" as Tone },
        { name: "Tom A.", role: "Camera", hours: "46.5", status: "Review", tone: "warning" as Tone },
      ].map((row, i, all) => (
        <TableRow key={row.name} {...p} last={i === all.length - 1}>
          <div style={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
            <Avatar {...p} initials={row.name[0] + row.name.split(" ")[1][0]} size={u(20)} />
            <div style={{ display: "flex", marginLeft: u(10) }}>
              <Cell {...p} title={row.name} sub={row.role} />
            </div>
          </div>
          <Value {...p} text={row.hours} width={u(88)} strong />
          <div style={{ display: "flex", width: u(104), flexShrink: 0, justifyContent: "flex-end" }}>
            <Badge {...p} label={row.status} tone={row.tone} />
          </div>
        </TableRow>
      ))}
    </FeaturePanel>
  );
}

/**
 * The production board.
 *
 * Columns, because a board is the one screen whose shape carries the
 * meaning: work moves left to right, and a column with nothing in it is
 * the thing you notice first.
 */
function Board(p: FrameProps) {
  const { u, theme } = p;
  const columns = [
    {
      title: "Prep",
      count: "3",
      tone: "neutral" as Tone,
      cards: [
        { name: "Aura retainer", sub: "Kickoff Thu", tone: "neutral" as Tone },
        { name: "Spire pitch", sub: "Treatment due", tone: "warning" as Tone },
      ],
    },
    {
      title: "Shooting",
      count: "2",
      tone: "info" as Tone,
      cards: [
        { name: "Helix launch film", sub: "Day 12 of 21", tone: "info" as Tone },
        { name: "Onyx interviews", sub: "Day 2 of 3", tone: "info" as Tone },
      ],
    },
    {
      title: "Post",
      count: "2",
      tone: "purple" as Tone,
      cards: [
        { name: "Vesper series", sub: "Colour, Fri", tone: "purple" as Tone },
        { name: "Sensa cutdowns", sub: "6 versions", tone: "purple" as Tone },
      ],
    },
    {
      title: "Delivered",
      count: "1",
      tone: "success" as Tone,
      cards: [{ name: "Nebula event", sub: "Invoiced", tone: "success" as Tone }],
    },
  ];

  return (
    <FeaturePanel {...p} title="Production board" action="New project">
      <div style={{ display: "flex", flexGrow: 1 }}>
        {columns.map((column, i) => (
          <div
            key={column.title}
            style={{
              display: "flex",
              flexDirection: "column",
              flexGrow: 1,
              flexBasis: 0,
              minWidth: 0,
              marginRight: i === columns.length - 1 ? 0 : u(10),
            }}
          >
            <div style={{ display: "flex", alignItems: "center", marginBottom: u(9) }}>
              <div
                style={{
                  display: "flex",
                  width: u(6),
                  height: u(6),
                  borderRadius: u(R.chip),
                  backgroundColor: toneColor(theme, column.tone),
                  marginRight: u(7),
                }}
              />
              <div
                style={{
                  display: "flex",
                  fontSize: u(TYPE.caption),
                  fontWeight: 600,
                  letterSpacing: TRACK,
                  textTransform: "uppercase",
                  color: theme.muted,
                  flexGrow: 1,
                }}
              >
                {column.title}
              </div>
              <div style={{ display: "flex", fontSize: u(TYPE.caption), color: theme.muted }}>{column.count}</div>
            </div>

            {column.cards.map((card) => (
              <div
                key={card.name}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  backgroundColor: theme.appTile,
                  borderRadius: u(R.card),
                  paddingLeft: u(10),
                  paddingRight: u(10),
                  paddingTop: u(9),
                  paddingBottom: u(9),
                  marginBottom: u(8),
                }}
              >
                <div style={{ display: "flex", fontSize: u(TYPE.body), fontWeight: 500, color: theme.text }}>{card.name}</div>
                <div style={{ display: "flex", fontSize: u(TYPE.caption), color: theme.muted, marginTop: u(4) }}>{card.sub}</div>
              </div>
            ))}

            {/* An empty slot, so a short column reads as room rather than as a crop. */}
            <div
              style={{
                display: "flex",
                height: u(4),
                borderRadius: u(R.chip),
                backgroundColor: theme.panelBorder,
              }}
            />
          </div>
        ))}
      </div>
    </FeaturePanel>
  );
}

/**
 * The run of a job across weeks.
 *
 * Offsets are drawn as a transparent spacer before the bar rather than as
 * a margin, because a percentage margin inside a flex row does not survive
 * Satori the way a percentage width does.
 */
function Timeline(p: FrameProps) {
  const { u, theme } = p;
  const rows = [
    { label: "Prep", sub: "Locations, crew", start: 0, span: 22, tone: "neutral" as Tone },
    { label: "Shoot", sub: "21 days", start: 22, span: 38, tone: "info" as Tone },
    { label: "Edit", sub: "Offline to lock", start: 56, span: 26, tone: "purple" as Tone },
    { label: "Colour and mix", sub: "Finishing", start: 78, span: 14, tone: "warning" as Tone },
    { label: "Delivery", sub: "All versions", start: 90, span: 10, tone: "success" as Tone },
  ];

  return (
    <FeaturePanel {...p} title="Helix launch film" action="Shift dates">
      <div style={{ display: "flex", marginBottom: u(12), paddingLeft: u(118) }}>
        {["Aug", "Sep", "Oct", "Nov"].map((month) => (
          <div
            key={month}
            style={{
              display: "flex",
              flexGrow: 1,
              flexBasis: 0,
              fontSize: u(TYPE.caption),
              fontWeight: 600,
              letterSpacing: TRACK,
              textTransform: "uppercase",
              color: theme.muted,
            }}
          >
            {month}
          </div>
        ))}
      </div>

      {rows.map((row, i) => (
        <div key={row.label} style={{ display: "flex", alignItems: "center", marginBottom: i === rows.length - 1 ? 0 : u(10) }}>
          <div style={{ display: "flex", flexDirection: "column", width: u(118), flexShrink: 0 }}>
            <div style={{ display: "flex", fontSize: u(TYPE.body), fontWeight: 500, color: theme.text }}>{row.label}</div>
            <div style={{ display: "flex", fontSize: u(TYPE.caption), color: theme.muted, marginTop: u(1) }}>{row.sub}</div>
          </div>
          {/* The track. `flexBasis: 0` because a growing box without it
              takes its base size from its content, and `overflow: hidden`
              because the last row runs from 90 to 100 and its border adds
              two pixels on top of that: without the clip the delivery bar
              came out past the right edge of the panel and floated on the
              card. The spacer and the bar hold their percentages rather
              than shrinking, so the dates stay where the months say. */}
          <div style={{ display: "flex", flexGrow: 1, flexBasis: 0, height: u(22), alignItems: "center", overflow: "hidden" }}>
            <div style={{ display: "flex", width: `${row.start}%`, height: u(22), flexShrink: 0 }} />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                width: `${row.span}%`,
                height: u(22),
                flexShrink: 0,
                borderRadius: u(R.chip),
                backgroundColor: toneAlpha(theme, row.tone, 0.19),
                border: `1px solid ${toneAlpha(theme, row.tone, 0.4)}`,
              }}
            />
          </div>
        </div>
      ))}

      <div style={{ display: "flex", alignItems: "center", marginTop: u(14) }}>
        <div style={{ display: "flex", width: u(7), height: u(7), borderRadius: u(R.chip), backgroundColor: STATUS.info, marginRight: u(10) }} />
        <div style={{ display: "flex", fontSize: u(TYPE.body), color: theme.secondary }}>
          Push the shoot a week and delivery moves to 14 November.
        </div>
      </div>
    </FeaturePanel>
  );
}

/**
 * A month, as a month.
 *
 * The one screen where the answer is a shape rather than a number: the run
 * of blocked days in the middle of the grid is the whole point, and no
 * table of dates ever communicated it as fast.
 */
function Calendar(p: FrameProps) {
  const { u, theme } = p;
  // -1 is a day from the month before. Tones mark what a day is spoken for by.
  const weeks: { day: number; tone: Tone | null }[][] = [
    [
      { day: -1, tone: null },
      { day: -1, tone: null },
      { day: 1, tone: null },
      { day: 2, tone: "neutral" },
      { day: 3, tone: "neutral" },
      { day: 4, tone: null },
      { day: 5, tone: null },
    ],
    [
      { day: 6, tone: null },
      { day: 7, tone: "info" },
      { day: 8, tone: "info" },
      { day: 9, tone: "info" },
      { day: 10, tone: "info" },
      { day: 11, tone: "info" },
      { day: 12, tone: null },
    ],
    [
      { day: 13, tone: null },
      { day: 14, tone: "info" },
      { day: 15, tone: "info" },
      { day: 16, tone: "warning" },
      { day: 17, tone: "info" },
      { day: 18, tone: null },
      { day: 19, tone: null },
    ],
    [
      { day: 20, tone: null },
      { day: 21, tone: "purple" },
      { day: 22, tone: "purple" },
      { day: 23, tone: "purple" },
      { day: 24, tone: "success" },
      { day: 25, tone: null },
      { day: 26, tone: null },
    ],
  ];

  return (
    <FeaturePanel {...p} title="August" action="Hold dates">
      <div style={{ display: "flex", marginBottom: u(8) }}>
        {["M", "T", "W", "T", "F", "S", "S"].map((label, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "center",
              flexGrow: 1,
              flexBasis: 0,
              fontSize: u(TYPE.caption),
              fontWeight: 600,
              letterSpacing: TRACK,
              color: theme.muted,
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {weeks.map((week, w) => (
        <div key={w} style={{ display: "flex", marginBottom: w === weeks.length - 1 ? 0 : u(6) }}>
          {week.map((cell, d) => (
            <div
              key={d}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                flexGrow: 1,
                flexBasis: 0,
                minWidth: 0,
                height: u(38),
                marginRight: d === week.length - 1 ? 0 : u(5),
                borderRadius: u(R.chip),
                paddingLeft: u(7),
                paddingRight: u(7),
                paddingTop: u(5),
                paddingBottom: u(5),
                backgroundColor: cell.tone && cell.tone !== "neutral" ? toneAlpha(theme, cell.tone, 0.15) : theme.appTile,
                border: `1px solid ${cell.tone && cell.tone !== "neutral" ? toneAlpha(theme, cell.tone, 0.35) : theme.panelBorder}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: u(TYPE.caption),
                  fontWeight: 500,
                  color: cell.day < 0 ? theme.panelBorder : cell.tone ? theme.text : theme.muted,
                }}
              >
                {cell.day < 0 ? "" : String(cell.day)}
              </div>
              {cell.tone ? (
                <div
                  style={{
                    display: "flex",
                    height: u(3),
                    borderRadius: u(R.chip),
                    backgroundColor: toneColor(theme, cell.tone),
                  }}
                />
              ) : (
                <div style={{ display: "flex", height: u(3) }} />
              )}
            </div>
          ))}
        </div>
      ))}

      <div style={{ display: "flex", marginTop: u(14) }}>
        {[
          { label: "Shooting", tone: "info" as Tone },
          { label: "Post", tone: "purple" as Tone },
          { label: "Held", tone: "warning" as Tone },
          { label: "Delivered", tone: "success" as Tone },
        ].map((key, i, all) => (
          <div key={key.label} style={{ display: "flex", alignItems: "center", marginRight: i === all.length - 1 ? 0 : u(16) }}>
            <div
              style={{
                display: "flex",
                width: u(7),
                height: u(7),
                borderRadius: u(R.chip),
                backgroundColor: toneColor(theme, key.tone),
                marginRight: u(7),
              }}
            />
            <div style={{ display: "flex", fontSize: u(TYPE.caption), color: theme.muted }}>{key.label}</div>
          </div>
        ))}
      </div>
    </FeaturePanel>
  );
}

/**
 * Spend against plan, as bars.
 *
 * The bars sit in a container that is bottom aligned, and the plan is a
 * line ruled across them. A number in a tile says what happened; this says
 * whether it was supposed to.
 */
function Chart(p: FrameProps) {
  const { u, theme } = p;
  const bars = [
    { label: "W1", pct: 22, tone: "info" as Tone },
    { label: "W2", pct: 38, tone: "info" as Tone },
    { label: "W3", pct: 54, tone: "info" as Tone },
    { label: "W4", pct: 71, tone: "info" as Tone },
    { label: "W5", pct: 88, tone: "warning" as Tone },
    { label: "W6", pct: 96, tone: "warning" as Tone },
  ];
  const track = u(132);

  return (
    <FeaturePanel {...p} title="Committed against budget" action="Export">
      <TileRow {...p}>
        <div style={{ display: "flex", flexGrow: 1, marginRight: u(10) }}>
          <Tile {...p} label="Budget" value="74,900" foot="Approved 12 Jun" grow />
        </div>
        <div style={{ display: "flex", flexGrow: 1, marginRight: u(10) }}>
          <Tile {...p} label="Committed" value="72,360" foot="96.6% of budget" tone="warning" grow />
        </div>
        <div style={{ display: "flex", flexGrow: 1 }}>
          <Tile {...p} label="Left" value="2,540" foot="Two weeks to run" tone="info" grow />
        </div>
      </TileRow>

      <div style={{ display: "flex", alignItems: "flex-end", height: track, position: "relative" }}>
        {/* Where the plan said the line would be by now */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: Math.round(track * 0.8),
            height: 1,
            backgroundColor: theme.panelBorder,
            display: "flex",
          }}
        />
        {bars.map((bar, i) => (
          <div
            key={bar.label}
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              flexGrow: 1,
              flexBasis: 0,
              height: track,
              marginRight: i === bars.length - 1 ? 0 : u(10),
            }}
          >
            <div
              style={{
                display: "flex",
                height: Math.round((track * bar.pct) / 100),
                borderRadius: u(R.chip),
                backgroundColor: toneAlpha(theme, bar.tone, 0.35),
                border: `1px solid ${toneColor(theme, bar.tone)}`,
              }}
            />
          </div>
        ))}
      </div>

      <div style={{ display: "flex", marginTop: u(8) }}>
        {bars.map((bar, i) => (
          <div
            key={bar.label}
            style={{
              display: "flex",
              justifyContent: "center",
              flexGrow: 1,
              flexBasis: 0,
              marginRight: i === bars.length - 1 ? 0 : u(10),
              fontSize: u(TYPE.caption),
              color: theme.muted,
            }}
          >
            {bar.label}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", marginTop: u(12) }}>
        <div style={{ display: "flex", width: u(7), height: u(7), borderRadius: u(R.chip), backgroundColor: STATUS.warning, marginRight: u(10) }} />
        <div style={{ display: "flex", fontSize: u(TYPE.body), color: theme.secondary }}>
          Week 5 crossed the line early. There are still two weeks to spend.
        </div>
      </div>
    </FeaturePanel>
  );
}

/**
 * The call sheet as the thing it turns into.
 *
 * A page rather than an interface. Some readers do not want to be shown
 * software at all, they want to be shown the paperwork stopping being
 * their problem, and this is the panel for them.
 */
function Document(p: FrameProps) {
  const { u, theme } = p;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        flexGrow: 1,
        backgroundColor: theme.appPanel,
        paddingLeft: u(26),
        paddingRight: u(26),
        paddingTop: u(24),
        paddingBottom: u(24),
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
          <div style={{ display: "flex", fontSize: u(TYPE.caption), fontWeight: 600, letterSpacing: TRACK, textTransform: "uppercase", color: theme.muted }}>
            Call sheet
          </div>
          <div style={{ display: "flex", fontSize: u(TYPE.title), fontWeight: 700, letterSpacing: "-0.02em", color: theme.text, marginTop: u(5) }}>
            Helix launch film
          </div>
          <div style={{ display: "flex", fontSize: u(TYPE.caption), color: theme.muted, marginTop: u(3) }}>
            Day 12 of 21, Tuesday 12 August
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}>
          <div style={{ display: "flex", fontSize: u(TYPE.caption), fontWeight: 600, letterSpacing: TRACK, textTransform: "uppercase", color: theme.muted }}>
            Unit call
          </div>
          <div style={{ display: "flex", fontSize: u(TYPE.title), fontWeight: 700, color: theme.text, marginTop: u(4) }}>07:00</div>
        </div>
      </div>

      <div style={{ display: "flex", height: 1, backgroundColor: theme.panelBorder, marginTop: u(16), marginBottom: u(14) }} />

      <div style={{ display: "flex", marginBottom: u(16) }}>
        {[
          { label: "Location", value: "Alleyway Backlot" },
          { label: "Weather", value: "74°F, sunny" },
          { label: "Nearest hospital", value: "St Alder, 1.4 mi" },
        ].map((column, i, all) => (
          <div
            key={column.label}
            style={{ display: "flex", flexDirection: "column", flexGrow: 1, flexBasis: 0, minWidth: 0, marginRight: i === all.length - 1 ? 0 : u(12) }}
          >
            <div style={{ display: "flex", fontSize: u(TYPE.caption), fontWeight: 600, letterSpacing: TRACK, textTransform: "uppercase", color: theme.muted }}>
              {column.label}
            </div>
            <div style={{ display: "flex", fontSize: u(TYPE.body), color: theme.text, marginTop: u(4) }}>{column.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", height: 1, backgroundColor: theme.panelBorder, marginBottom: u(10) }} />

      {[
        { id: "A-01", name: "L. Vance", dept: "Cast, lead", call: "08:30" },
        { id: "A-02", name: "S. Apex", dept: "Cast, lead", call: "07:30" },
        { id: "DP", name: "J. Rhee", dept: "Camera", call: "07:00" },
        { id: "SND", name: "V. Lin", dept: "Sound", call: "07:30" },
        { id: "1AD", name: "P. Oyelaran", dept: "Production", call: "06:45" },
      ].map((row, i, all) => (
        <div
          key={row.id}
          style={{
            display: "flex",
            alignItems: "center",
            paddingTop: u(8),
            paddingBottom: u(8),
            borderBottom: i === all.length - 1 ? "none" : `1px solid ${theme.panelBorder}`,
          }}
        >
          <div style={{ display: "flex", width: u(46), flexShrink: 0, fontSize: u(TYPE.caption), color: theme.muted }}>{row.id}</div>
          <div style={{ display: "flex", flexGrow: 1, flexBasis: 0, fontSize: u(TYPE.body), color: theme.text }}>{row.name}</div>
          <div style={{ display: "flex", width: u(96), flexShrink: 0, fontSize: u(TYPE.caption), color: theme.muted }}>{row.dept}</div>
          <div style={{ display: "flex", width: u(52), flexShrink: 0, justifyContent: "flex-end", fontSize: u(TYPE.body), fontWeight: 600, color: theme.text }}>
            {row.call}
          </div>
        </div>
      ))}

      <div style={{ display: "flex", flexGrow: 1 }} />

      <div style={{ display: "flex", alignItems: "center", marginTop: u(14) }}>
        <div style={{ display: "flex", width: u(6), height: u(6), borderRadius: u(R.chip), backgroundColor: STATUS.success, marginRight: u(8) }} />
        <div style={{ display: "flex", fontSize: u(TYPE.caption), color: theme.muted, flexGrow: 1, flexBasis: 0 }}>Sent to 14 crew and 2 clients, 18:45</div>
        {p.mark ? <img src={p.mark} width={u(9)} height={u(16)} alt="" /> : null}
      </div>
    </div>
  );
}

/**
 * What the app tells you before somebody else has to.
 *
 * Three notices and nothing around them. It is the smallest panel here and
 * the one that survives a feed thumbnail best, because there is no table
 * to turn into grey mush.
 */
function Alert(p: FrameProps) {
  const { u, theme } = p;
  const notices = [
    {
      tone: "warning" as Tone,
      title: "V. Lin is close to their hours",
      body: "Eleven today. Their call tomorrow moved to 07:30 on its own.",
      when: "now",
    },
    {
      tone: "danger" as Tone,
      title: "Nebula invoice is four days overdue",
      body: "6,750 outstanding. A chaser is drafted and waiting on you.",
      when: "2m",
    },
    {
      tone: "success" as Tone,
      title: "Vesper signed off the hero cut",
      body: "A. Reyes approved v4 at 16:12. Post can move to colour.",
      when: "18m",
    },
  ];

  return (
    <FeaturePanel {...p} title="Worth knowing" action="Mark read">
      {notices.map((notice, i, all) => (
        <div
          key={notice.title}
          style={{
            display: "flex",
            alignItems: "flex-start",
            backgroundColor: theme.appTile,
            borderLeft: `${u(3)}px solid ${toneColor(theme, notice.tone)}`,
            borderRadius: u(R.card),
            paddingLeft: u(14),
            paddingRight: u(14),
            paddingTop: u(12),
            paddingBottom: u(12),
            marginBottom: i === all.length - 1 ? 0 : u(10),
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, minWidth: 0 }}>
            <div style={{ display: "flex", fontSize: u(TYPE.body), fontWeight: 600, color: theme.text }}>{notice.title}</div>
            <div style={{ display: "flex", fontSize: u(TYPE.body), color: theme.muted, marginTop: u(4), lineHeight: 1.4 }}>{notice.body}</div>
          </div>
          <div style={{ display: "flex", width: u(40), flexShrink: 0, justifyContent: "flex-end", fontSize: u(TYPE.caption), color: theme.muted }}>
            {notice.when}
          </div>
        </div>
      ))}
    </FeaturePanel>
  );
}

/** Who is on the job, as faces rather than as rows. */
function Roster(p: FrameProps) {
  const { u, theme } = p;
  const people = [
    { name: "J. Rhee", role: "Director of photography", state: "Confirmed", tone: "success" as Tone },
    { name: "P. Oyelaran", role: "First assistant director", state: "Confirmed", tone: "success" as Tone },
    { name: "R. Okafor", role: "Gaffer", state: "Confirmed", tone: "success" as Tone },
    { name: "V. Lin", role: "Sound recordist", state: "Confirmed", tone: "success" as Tone },
    { name: "M. Bright", role: "Key grip", state: "Held", tone: "warning" as Tone },
    { name: "Open", role: "Second assistant camera", state: "To fill", tone: "neutral" as Tone },
  ];

  return (
    <FeaturePanel {...p} title="Crew, Helix launch film" action="Invite">
      {[0, 3].map((offset) => (
        <div key={offset} style={{ display: "flex", marginBottom: offset === 0 ? u(10) : 0 }}>
          {people.slice(offset, offset + 3).map((person, i, all) => (
            <div
              key={person.name + person.role}
              style={{
                display: "flex",
                flexDirection: "column",
                flexGrow: 1,
                flexBasis: 0,
                minWidth: 0,
                marginRight: i === all.length - 1 ? 0 : u(10),
                backgroundColor: theme.appTile,
                borderRadius: u(R.card),
                paddingLeft: u(12),
                paddingRight: u(12),
                paddingTop: u(12),
                paddingBottom: u(12),
              }}
            >
              <div style={{ display: "flex", alignItems: "center", marginBottom: u(9) }}>
                <Avatar {...p} initials={person.name === "Open" ? "?" : person.name[0] + person.name.split(" ")[1][0]} size={u(26)} />
                <div style={{ display: "flex", flexGrow: 1 }} />
                <div
                  style={{
                    display: "flex",
                    width: u(7),
                    height: u(7),
                    borderRadius: u(R.chip),
                    backgroundColor: toneColor(theme, person.tone),
                  }}
                />
              </div>
              <div style={{ display: "flex", fontSize: u(TYPE.body), fontWeight: 600, color: theme.text }}>{person.name}</div>
              <div style={{ display: "flex", fontSize: u(TYPE.caption), color: theme.muted, marginTop: u(3), lineHeight: 1.3 }}>{person.role}</div>
              <div style={{ display: "flex", marginTop: u(9) }}>
                <Badge {...p} label={person.state} tone={person.tone} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </FeaturePanel>
  );
}


/**
 * The assistant's read on a project, unprompted.
 *
 * This is the one that changes what people think ABRAM is. A chat window
 * says "there is an AI in here somewhere" and puts the work of asking back
 * on the reader. This says it already looked: what happened, what it cost,
 * what is unresolved, and the one decision that is due. Nobody had to type
 * anything.
 */
function AiUpdate(p: FrameProps) {
  const { u, theme } = p;
  const lines = [
    { text: "Shoot wrapped on schedule. Post starts tomorrow with eight days to delivery.", tone: "success" as Tone },
    { text: "Post is still unassigned, with 30,000 left for edit, colour and delivery.", tone: "warning" as Tone },
    { text: "Lock the edit timeline by tomorrow or the 19th slips.", tone: "danger" as Tone },
  ];

  return (
    <FeaturePanel
      {...p}
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          <Mark {...p} height={u(18)} />
          <div style={{ display: "flex", fontSize: u(TYPE.title), fontWeight: 700, letterSpacing: "-0.02em", color: theme.text, marginLeft: u(10) }}>
            Update
          </div>
        </div>
      }
      action="Regenerate"
    >
      {lines.map((line, i, all) => (
        <div key={line.text} style={{ display: "flex", alignItems: "flex-start", marginBottom: i === all.length - 1 ? 0 : u(13) }}>
          <div
            style={{
              display: "flex",
              width: u(8),
              height: u(8),
              borderRadius: u(R.chip),
              backgroundColor: toneColor(theme, line.tone),
              marginTop: u(6),
              marginRight: u(12),
              flexShrink: 0,
            }}
          />
          <div style={{ display: "flex", fontSize: u(TYPE.body), lineHeight: 1.4, color: theme.text, flexGrow: 1, flexBasis: 0 }}>{line.text}</div>
        </div>
      ))}

      <div style={{ display: "flex", flexGrow: 1 }} />

      {/* Signed with the identity rather than the word. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginTop: u(16),
          paddingTop: u(12),
          borderTop: `1px solid ${theme.panelBorder}`,
        }}
      >
        <Wordmark {...p} height={u(11)} />
        <div style={{ display: "flex", fontSize: u(TYPE.caption), color: theme.muted, marginLeft: u(12) }}>
          wrote this 4 minutes ago, from the schedule and the ledger
        </div>
      </div>
    </FeaturePanel>
  );
}

/**
 * What it thinks you should do next, with the reasoning attached.
 *
 * A suggestion nobody can audit is a guess with better manners, so each
 * one carries the thing it noticed. That is also what makes it safe to put
 * on a card: the reader can check the logic without the product.
 */
function Suggestions(p: FrameProps) {
  const { u, theme } = p;
  const items = [
    {
      title: "Move the Thursday pickup to Wednesday",
      why: "Wednesday runs short and the same unit is already at that location.",
      tone: "info" as Tone,
    },
    {
      title: "Chase the Nebula invoice",
      why: "Four days overdue, and a draft is written and waiting on you.",
      tone: "danger" as Tone,
    },
    {
      title: "Hold a colourist for week 34",
      why: "Two jobs land in post the same week and only one has anyone booked.",
      tone: "warning" as Tone,
    },
  ];

  return (
    <FeaturePanel {...p} title="Needs a decision" action="Review all">
      <div style={{ display: "flex", marginBottom: u(12) }}>
        <Badge {...p} label="Actions 0" tone="neutral" />
        <div style={{ display: "flex", marginLeft: u(8) }}>
          <Badge {...p} label="Suggestions 3" tone="info" />
        </div>
      </div>

      {items.map((item, i, all) => (
        <div
          key={item.title}
          style={{
            display: "flex",
            flexDirection: "column",
            backgroundColor: theme.appTile,
            borderRadius: u(R.card),
            padding: u(13),
            marginBottom: i === all.length - 1 ? 0 : u(9),
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                width: u(6),
                height: u(6),
                borderRadius: u(R.chip),
                backgroundColor: toneColor(theme, item.tone),
                marginRight: u(10),
              }}
            />
            <div style={{ display: "flex", fontSize: u(TYPE.body), fontWeight: 600, color: theme.text, flexGrow: 1, flexBasis: 0 }}>
              {item.title}
            </div>
            <div style={{ display: "flex", fontSize: u(TYPE.caption), fontWeight: 600, color: theme.accent }}>Apply</div>
          </div>
          <div style={{ display: "flex", fontSize: u(TYPE.caption), color: theme.muted, marginTop: u(6), marginLeft: u(16), lineHeight: 1.4 }}>
            {item.why}
          </div>
        </div>
      ))}
    </FeaturePanel>
  );
}

/**
 * The assistant doing a job that used to take an afternoon.
 *
 * Deliberately drawn as the result, not the stripboard: the interesting
 * thing is not that there is a list of scenes, it is that the list got
 * rearranged for a reason somebody can argue with.
 */
function AiSort(p: FrameProps) {
  const { u, theme } = p;
  const moves = [
    { scene: "3", label: "Downtown Strength Training", from: "Thu", to: "Wed", why: "Same location as scene 7" },
    { scene: "7", label: "Team Training Montage", from: "Wed", to: "Wed", why: "Kept with scene 3" },
    { scene: "5", label: "Sunset Victory Shot", from: "Wed", to: "Thu", why: "Needs the golden hour window" },
  ];

  return (
    <FeaturePanel
      {...p}
      title={
        // The lockup rather than the mark, because this line needs a
        // subject: it is the name that sorted the board.
        <div style={{ display: "flex", alignItems: "center" }}>
          <Wordmark {...p} height={u(16)} />
          <div style={{ display: "flex", fontSize: u(TYPE.title), fontWeight: 700, letterSpacing: "-0.02em", color: theme.text, marginLeft: u(12) }}>
            sorted the board
          </div>
        </div>
      }
      action="Apply"
    >

      <TableHead
        {...p}
        columns={[
          { label: "Scene", grow: true },
          { label: "Moved", width: u(110), right: true },
          { label: "Because", width: u(190), padLeft: u(14) },
        ]}
      />
      {moves.map((move, i, all) => (
        <TableRow key={move.scene} {...p} last={i === all.length - 1}>
          <div style={{ display: "flex", flexGrow: 1, flexBasis: 0, fontSize: u(TYPE.body), color: theme.text }}>{move.label}</div>
          <div style={{ display: "flex", width: u(110), flexShrink: 0, justifyContent: "flex-end", alignItems: "center" }}>
            <div style={{ display: "flex", fontSize: u(TYPE.body), color: theme.muted }}>{move.from}</div>
            <div style={{ display: "flex", fontSize: u(TYPE.body), color: theme.muted, marginLeft: u(6), marginRight: u(6) }}>
              &#8594;
            </div>
            <div
              style={{
                display: "flex",
                fontSize: u(TYPE.body),
                fontWeight: 600,
                color: move.from === move.to ? theme.muted : STATUS.success,
              }}
            >
              {move.to}
            </div>
          </div>
          <div style={{ display: "flex", width: u(190), flexShrink: 0, fontSize: u(TYPE.caption), color: theme.muted, paddingLeft: u(14) }}>
            {move.why}
          </div>
        </TableRow>
      ))}
    </FeaturePanel>
  );
}

/**
 * One decision, and the two buttons it comes down to.
 *
 * The only screen here with nothing to scan. What it is selling is that
 * approval is a moment with a name and a time attached to it, rather than
 * a maybe at the bottom of an email.
 */
function Approval(p: FrameProps) {
  const { u, theme } = p;
  return (
    <FeaturePanel {...p} title="Sign off">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          borderRadius: u(R.card),
          border: `1px solid ${theme.panelBorder}`,
          backgroundColor: theme.appTile,
          padding: u(20),
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: u(14) }}>
          <Badge {...p} label="Awaiting you" tone="warning" />
          <div style={{ display: "flex", flexGrow: 1 }} />
          <div style={{ display: "flex", fontSize: u(TYPE.caption), color: theme.muted }}>Sent 2h ago</div>
        </div>

        <div style={{ display: "flex", fontSize: u(TYPE.title), fontWeight: 700, letterSpacing: "-0.02em", color: theme.text }}>
          Hero cut v4
        </div>
        <div style={{ display: "flex", fontSize: u(TYPE.body), color: theme.muted, marginTop: u(5) }}>
          Helix launch film, 02:41, colour pass applied
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: u(16) }}>
          {[
            { label: "Three open notes have been addressed", tone: "success" as Tone },
            { label: "Captions in English and Spanish attached", tone: "success" as Tone },
            { label: "Music licence expires 30 November", tone: "warning" as Tone },
          ].map((line, i, all) => (
            <div key={line.label} style={{ display: "flex", alignItems: "center", marginBottom: i === all.length - 1 ? 0 : u(9) }}>
              <div
                style={{
                  display: "flex",
                  width: u(6),
                  height: u(6),
                  borderRadius: u(R.chip),
                  backgroundColor: toneColor(theme, line.tone),
                  marginRight: u(10),
                }}
              />
              <div style={{ display: "flex", fontSize: u(TYPE.body), color: theme.secondary }}>{line.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexGrow: 1 }} />

        <div style={{ display: "flex", alignItems: "center", marginTop: u(18) }}>
          <div style={{ display: "flex", marginRight: u(10) }}>
            <Button {...p} label="Approve" primary />
          </div>
          <Button {...p} label="Request changes" />
          <div style={{ display: "flex", flexGrow: 1 }} />
          <Avatar {...p} initials="AR" size={u(24)} />
          <div style={{ display: "flex", fontSize: u(TYPE.caption), color: theme.muted, marginLeft: u(8) }}>A. Reyes, Helix</div>
        </div>
      </div>
    </FeaturePanel>
  );
}

/**
 * Where the resources actually went.
 *
 * The gear list says what you own. This says what it earned, which is the
 * question that decides whether the next one gets bought. Drawn as a
 * stacked bar and a legend rather than the app's doughnut: Satori has no
 * arcs, and a proportion reads at least as well lying down.
 */
function Resources(p: FrameProps) {
  const { u, theme } = p;
  // The percentages have to sum to exactly 100. Rounded independently they
  // came to 100.1, and the only reason the bar did not overflow was the
  // default flex shrink quietly absorbing the extra tenth.
  const split = [
    { label: "Location", hours: "213h", pct: 71.7, tone: "success" as Tone },
    { label: "Equipment", hours: "38.5h", pct: 13.0, tone: "info" as Tone },
    { label: "Camera", hours: "27h", pct: 9.1, tone: "purple" as Tone },
    { label: "Studio", hours: "13.3h", pct: 4.5, tone: "neutral" as Tone },
    { label: "Lighting", hours: "5h", pct: 1.7, tone: "neutral" as Tone },
  ];

  return (
    <FeaturePanel {...p} title="Resources, last 90 days" action="Export">

      <div
        style={{
          display: "flex",
          fontSize: u(TYPE.caption),
          fontWeight: 600,
          letterSpacing: TRACK,
          textTransform: "uppercase",
          color: theme.muted,
          marginBottom: u(10),
        }}
      >
        Hours by resource type
      </div>

      {/* One bar, five segments, in the real proportions. The segments abut
          rather than carrying a gap: the widths already sum to a hundred,
          and four gaps on top of that push the last one off the end. */}
      <div style={{ display: "flex", height: u(22), borderRadius: u(R.chip), overflow: "hidden", marginBottom: u(14) }}>
        {split.map((segment) => (
          <div
            key={segment.label}
            style={{
              display: "flex",
              width: `${segment.pct}%`,
              height: u(22),
              backgroundColor: toneColor(theme, segment.tone),
            }}
          />
        ))}
      </div>

      {split.map((segment, i, all) => (
        <div
          key={segment.label}
          style={{
            display: "flex",
            alignItems: "center",
            paddingTop: u(7),
            paddingBottom: u(7),
            borderBottom: i === all.length - 1 ? "none" : `1px solid ${theme.panelBorder}`,
          }}
        >
          <div
            style={{
              display: "flex",
              width: u(8),
              height: u(8),
              borderRadius: u(R.chip),
              backgroundColor: toneColor(theme, segment.tone),
              marginRight: u(11),
            }}
          />
          <div style={{ display: "flex", flexGrow: 1, flexBasis: 0, fontSize: u(TYPE.body), color: theme.text }}>{segment.label}</div>
          <div style={{ display: "flex", width: u(70), flexShrink: 0, justifyContent: "flex-end", fontSize: u(TYPE.body), fontWeight: 600, color: theme.text }}>
            {segment.hours}
          </div>
          <div style={{ display: "flex", width: u(60), flexShrink: 0, justifyContent: "flex-end", fontSize: u(TYPE.caption), color: theme.muted }}>
            {segment.pct}%
          </div>
        </div>
      ))}
    </FeaturePanel>
  );
}

/**
 * What you are actually good at, worked out from what you actually did.
 *
 * The strongest thing on this screen is the sentence about where the
 * numbers come from: hours logged, deliverables approved, roles you were
 * crewed into. A self-reported skills list is a CV. One with a citation
 * count against every line is a different object, and the card has to
 * carry the citations or it is just a CV again.
 */
function Skills(p: FrameProps) {
  const { u, theme } = p;
  const skills = [
    { name: "Production design", group: "Art department", hours: "80h", pct: 74, strength: "Working", cites: "3 citations" },
    { name: "Set design", group: "Art department", hours: "64h", pct: 62, strength: "Working", cites: "2 citations" },
  ];

  return (
    <FeaturePanel {...p} title="Competency" action="Add skill">
      {skills.map((skill, i, all) => (
        <div
          key={skill.name}
          style={{
            display: "flex",
            flexDirection: "column",
            backgroundColor: theme.appTile,
            borderRadius: u(R.card),
            padding: u(12),
            marginBottom: i === all.length - 1 ? 0 : u(8),
          }}
        >
          <div style={{ display: "flex", alignItems: "center", marginBottom: u(9) }}>
            <div style={{ display: "flex", fontSize: u(TYPE.body), fontWeight: 600, color: theme.text, marginRight: u(10) }}>
              {skill.name}
            </div>
            <Badge {...p} label="Observed" tone="info" />
            <div style={{ display: "flex", flexGrow: 1 }} />
            <div style={{ display: "flex", fontSize: u(TYPE.caption), color: theme.muted }}>{skill.hours} logged</div>
          </div>
          <Meter {...p} percent={skill.pct} width={u(560)} tone="info" />
          <div style={{ display: "flex", alignItems: "center", marginTop: u(8) }}>
            <div style={{ display: "flex", fontSize: u(TYPE.caption), color: theme.muted, flexGrow: 1, flexBasis: 0 }}>{skill.group}</div>
            <div style={{ display: "flex", fontSize: u(TYPE.caption), color: theme.muted }}>
              {skill.strength}, {skill.cites}
            </div>
          </div>
        </div>
      ))}
    </FeaturePanel>
  );
}

/**
 * What the workspace has worked out about itself.
 *
 * The one screen here that is not a view of your data but a view of the
 * conclusions drawn from it, which is why every entry carries what it was
 * inferred from. A pattern with no event count behind it is a horoscope.
 */
function Brain(p: FrameProps) {
  const { u, theme } = p;
  const entries = [
    {
      kind: "Pattern",
      tone: "purple" as Tone,
      text: "Most-booked roles are director, camera operator and director of photography, in that order.",
      source: "From 111 bookings, February to August",
    },
    {
      kind: "Pattern",
      tone: "purple" as Tone,
      text: "Nobody has cancelled on you. None of the last twenty status changes were a decline.",
      source: "From 20 status changes",
    },
    {
      kind: "Note",
      tone: "info" as Tone,
      text: "Runs documentary work in structured phases, and plans from the timeline first.",
      source: "Learned from how projects get set up",
    },
    {
      kind: "Contact",
      tone: "success" as Tone,
      text: "Works with the same first assistant director across every project type.",
      source: "From 9 projects",
    },
  ];

  return (
    <FeaturePanel
      {...p}
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          <Mark {...p} height={u(18)} />
          <div style={{ display: "flex", fontSize: u(TYPE.title), fontWeight: 700, letterSpacing: "-0.02em", color: theme.text, marginLeft: u(10) }}>
            Organisation brain
          </div>
        </div>
      }
      action="Search"
    >
      {entries.map((entry, i, all) => (
        <div
          key={entry.text}
          style={{
            display: "flex",
            alignItems: "flex-start",
            paddingTop: u(11),
            paddingBottom: u(11),
            borderBottom: i === all.length - 1 ? "none" : `1px solid ${theme.panelBorder}`,
          }}
        >
          <div style={{ display: "flex", width: u(92), flexShrink: 0, paddingTop: u(1) }}>
            <Badge {...p} label={entry.kind} tone={entry.tone} />
          </div>
          {/* flexBasis: 0 as well as flexGrow, or the intrinsic width of a
              long line sets the base size and the text runs off the panel
              instead of wrapping. */}
          <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, flexBasis: 0, minWidth: 0 }}>
            <div style={{ display: "flex", fontSize: u(TYPE.body), color: theme.text, lineHeight: 1.4 }}>{entry.text}</div>
            <div style={{ display: "flex", fontSize: u(TYPE.caption), color: theme.muted, marginTop: u(4) }}>{entry.source}</div>
          </div>
        </div>
      ))}

      <div style={{ display: "flex", flexGrow: 1 }} />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginTop: u(14),
          paddingTop: u(12),
          borderTop: `1px solid ${theme.panelBorder}`,
        }}
      >
        <Wordmark {...p} height={u(11)} />
        <div style={{ display: "flex", fontSize: u(TYPE.caption), color: theme.muted, marginLeft: u(12) }}>
          works these out on its own. Nothing here was typed in.
        </div>
      </div>
    </FeaturePanel>
  );
}

// ---------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------

/**
 * How tall each screen draws relative to its width, measured off the
 * rendered cards. The caller works backwards from these to size a panel
 * against the height it has free: Satori gives no measurement pass, and a
 * card that sized on width alone pushed its own footer off the bottom.
 * Overestimating is the safe direction, since it only shrinks the panel.
 */
/**
 * The form a client actually fills in.
 *
 * The shape is the argument here: a stack of labelled boxes reads as a form
 * from across a room, which is what makes this recognisable at thumbnail
 * size where a table of the same information would be grey mush. The fields
 * are the real ones the builder offers, and the last row is a custom
 * question, because custom questions are the reason anybody builds one.
 */
function RequestForm(p: FrameProps) {
  const { u, theme } = p;

  const field = (label: string, value: string, filled: boolean, width?: number) => (
    <div key={label} style={{ display: "flex", flexDirection: "column", ...optionalWidth(width), flexGrow: width === undefined ? 1 : 0, flexBasis: width === undefined ? 0 : "auto", minWidth: 0 }}>
      <div style={{ display: "flex", fontSize: u(TYPE.caption), fontWeight: 600, letterSpacing: TRACK, textTransform: "uppercase", color: theme.muted, marginBottom: u(6) }}>
        {label}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          backgroundColor: theme.appTile,
          borderRadius: u(R.card),
          paddingLeft: u(PAD.snug),
          paddingRight: u(PAD.snug),
          paddingTop: u(10),
          paddingBottom: u(10),
          fontSize: u(TYPE.body),
          color: filled ? theme.text : theme.muted,
        }}
      >
        {value}
      </div>
    </div>
  );

  return (
    <FeaturePanel {...p} title="Request a project" action="Submit">
      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
        <div style={{ display: "flex", marginBottom: u(12) }}>{field("Project title", "Helix spring campaign", true)}</div>

        <div style={{ display: "flex", marginBottom: u(12) }}>
          {field("What you need", "Three social cutdowns from the March shoot, plus a 60 second hero.", true)}
        </div>

        <div style={{ display: "flex", marginBottom: u(12) }}>
          <div style={{ display: "flex", flexGrow: 1, flexBasis: 0, minWidth: 0, marginRight: u(10) }}>
            {field("Estimated budget", "$40,000", true)}
          </div>
          <div style={{ display: "flex", flexGrow: 1, flexBasis: 0, minWidth: 0, marginRight: u(10) }}>
            {field("Start date", "14 Sep", true)}
          </div>
          <div style={{ display: "flex", flexGrow: 1, flexBasis: 0, minWidth: 0 }}>{field("End date", "02 Oct", true)}</div>
        </div>

        <div style={{ display: "flex", marginBottom: u(12) }}>{field("Where is it shooting", "Lisbon, and one studio day", true)}</div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: theme.appTile,
              borderRadius: u(R.pill),
              paddingLeft: u(PAD.snug),
              paddingRight: u(PAD.snug),
              paddingTop: u(6),
              paddingBottom: u(6),
              fontSize: u(TYPE.caption),
              color: theme.secondary,
            }}
          >
            brief-v3.pdf
          </div>
          <div style={{ display: "flex", fontSize: u(TYPE.caption), color: theme.muted, marginLeft: u(10) }}>
            Attached
          </div>
        </div>
      </div>
    </FeaturePanel>
  );
}

/**
 * The builder behind that form.
 *
 * The mapping chip on the right is the whole point of the screen, and the
 * reason it is worth drawing separately from the form: an answer that lands
 * in the project's locations or its kit list is different from an answer
 * that lands in a paragraph of description, and nothing on the client's side
 * of the form shows that.
 */
function IntakeBuilder(p: FrameProps) {
  const { u, theme } = p;

  const fields = [
    { name: "Project title", type: "Always on", maps: "Title", tone: "neutral" as Tone },
    { name: "Estimated budget", type: "Required", maps: "Budget", tone: "info" as Tone },
    { name: "Where is it shooting", type: "Short text", maps: "On-site locations", tone: "purple" as Tone },
    { name: "Kit you need us to bring", type: "Paragraph", maps: "Equipment", tone: "purple" as Tone },
    { name: "Crew disciplines", type: "Dropdown", maps: "Required skills", tone: "purple" as Tone },
  ];

  return (
    <FeaturePanel {...p} title="Intake form" action="Copy link">
      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
        <TableHead
          {...p}
          columns={[
            { label: "Question", grow: true },
            { label: "Type", width: u(96) },
            { label: "Lands in", width: u(150) },
          ]}
        />

        {fields.map((row, i, all) => (
          <TableRow key={row.name} {...p} last={i === all.length - 1}>
            <Cell {...p} title={row.name} grow />
            <div style={{ display: "flex", width: u(96), fontSize: u(TYPE.caption), color: theme.muted, flexShrink: 0 }}>{row.type}</div>
            <div style={{ display: "flex", width: u(150), flexShrink: 0 }}>
              <Badge {...p} label={row.maps} tone={row.tone} />
            </div>
          </TableRow>
        ))}
      </div>
    </FeaturePanel>
  );
}

/**
 * The queue those answers land in, and the decision at the end of it.
 *
 * The action row is the screen. A list of requests on its own says nothing
 * a shared inbox does not already say; the thing worth showing is that one
 * of the three buttons builds the project out of the answers rather than
 * opening an empty one.
 */
function ProjectRequests(p: FrameProps) {
  const { u, theme } = p;

  const requests = [
    { name: "Helix spring campaign", from: "Helix, portal", when: "2h ago", tone: "warning" as Tone, status: "New" },
    { name: "Nebula product film", from: "Public link", when: "Yesterday", tone: "warning" as Tone, status: "New" },
    { name: "Vesper brand refresh", from: "Aura, portal", when: "3d ago", tone: "success" as Tone, status: "Approved" },
  ];

  return (
    <FeaturePanel {...p} title="Project requests" action="Export">
      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
        {requests.map((row, i, all) => (
          <TableRow key={row.name} {...p} last={i === all.length - 1}>
            <Cell {...p} title={row.name} sub={row.from} grow />
            <div style={{ display: "flex", width: u(88), fontSize: u(TYPE.caption), color: theme.muted, flexShrink: 0 }}>{row.when}</div>
            <div style={{ display: "flex", width: u(92), flexShrink: 0 }}>
              <Badge {...p} label={row.status} tone={row.tone} />
            </div>
          </TableRow>
        ))}

        {/* The decision. Three buttons because there are three, and the
            middle one is the one worth knowing about. */}
        <div style={{ display: "flex", alignItems: "center", marginTop: u(16) }}>
          <div style={{ display: "flex", marginRight: u(10) }}>
            <Button {...p} label="Approve and set up" />
          </div>
          <div style={{ display: "flex", marginRight: u(10) }}>
            {/* The product's own label. It may not say ABRAM: the name is
                only ever the drawn mark, never the word in the body face,
                and a pill button is no place for a lockup. */}
            <Button {...p} label="AI auto-setup" primary />
          </div>
          <Button {...p} label="Reject" />
        </div>

        <div style={{ display: "flex", fontSize: u(TYPE.caption), color: theme.muted, marginTop: u(12) }}>
          Work packages, milestones and deliverables, from the answers they gave.
        </div>
      </div>
    </FeaturePanel>
  );
}

export /**
 * Roughly how tall each panel draws, as a fraction of its width.
 *
 * The layouts budget space with this before anything is drawn, so a wrong
 * number costs real estate in one direction or the footer in the other.
 * These were guessed once and then drifted: sixteen of the twenty-nine were
 * out by more than fifteen per cent, four of them badly enough to push the
 * panel over the card's own footer.
 *
 * They are now measured rather than estimated. `scripts/measure-mockups.js`
 * draws each panel alone on a flat colour, reads the pixels back, and finds
 * the last row that is not background. Re-run it after changing any panel's
 * density: taking rows out changes these, which is the whole reason they
 * were wrong.
 */
const MOCKUP_ASPECT: Record<MockupKind, number> = {
  dashboard: 0.56,
  tasks: 0.59,
  board: 0.34,
  timeline: 0.49,
  calendar: 0.44,
  callsheet: 0.34,
  document: 0.85,
  schedule: 0.5,
  runofshow: 0.38,
  breakdown: 0.4,
  alert: 0.43,
  capacity: 0.41,
  crew: 0.45,
  roster: 0.49,
  timecard: 0.4,
  budget: 0.4,
  invoice: 0.4,
  chart: 0.55,
  portal: 0.5,
  clienthome: 0.5,
  approval: 0.51,
  requestform: 0.68,
  intake: 0.46,
  requests: 0.47,
  inventory: 0.4,
  resources: 0.44,
  skills: 0.37,
  aiupdate: 0.3,
  suggestions: 0.47,
  aisort: 0.33,
  chat: 0.65,
  brain: 0.55,
};

/**
 * The width each screen's internals are tuned against.
 *
 * 680 is a browser-ish frame and suits everything drawn as a browser
 * window. A screen that is not one cannot use it: the printed sheet is a
 * page rather than an interface, and at 680 its type comes out too small
 * for the shape. Each screen therefore says what width its own type was
 * set at, and the panel scales from there.
 */
const MOCKUP_REFERENCE: Record<MockupKind, number> = {
  dashboard: 680,
  tasks: 680,
  board: 680,
  timeline: 680,
  calendar: 680,
  callsheet: 680,
  document: 470,
  schedule: 680,
  runofshow: 680,
  breakdown: 680,
  alert: 680,
  capacity: 680,
  crew: 680,
  roster: 680,
  timecard: 680,
  budget: 680,
  invoice: 680,
  chart: 680,
  portal: 680,
  clienthome: 680,
  approval: 680,
  requestform: 560,
  intake: 680,
  requests: 680,
  inventory: 680,
  resources: 680,
  skills: 680,
  brain: 680,
  chat: 680,
  aiupdate: 680,
  suggestions: 680,
  aisort: 680,
};

const SCREENS: Record<MockupKind, (props: FrameProps) => React.ReactElement> = {
  dashboard: Dashboard,
  tasks: Tasks,
  board: Board,
  timeline: Timeline,
  calendar: Calendar,
  callsheet: CallSheet,
  document: Document,
  schedule: Schedule,
  runofshow: RunOfShow,
  breakdown: Breakdown,
  alert: Alert,
  capacity: Capacity,
  crew: Crew,
  roster: Roster,
  timecard: Timecard,
  budget: Budget,
  invoice: Invoice,
  chart: Chart,
  portal: Portal,
  clienthome: ClientHome,
  approval: Approval,
  requestform: RequestForm,
  intake: IntakeBuilder,
  requests: ProjectRequests,
  inventory: Inventory,
  resources: Resources,
  skills: Skills,
  brain: Brain,
  chat: Chat,
  aiupdate: AiUpdate,
  suggestions: Suggestions,
  aisort: AiSort,
};

/**
 * Draw one app screen at a given width.
 *
 * `scaleWidth` sizes the internals when it differs from the drawn width,
 * which is how a card stretches the window to fill its column while
 * keeping the vertical footprint the height budget allows.
 */
export function AppMockup({
  kind,
  theme,
  mark,
  lockup,
  width,
  scaleWidth,
  height,
}: {
  kind: MockupKind;
  theme: SocialTheme;
  /** The brand mark as a data URI, in this theme's ink. Empty is tolerated. */
  mark: string;
  /** The full lockup, for the screens that name the assistant. */
  lockup: string;
  width: number;
  scaleWidth?: number;
  height?: number;
}) {
  // Most screens are tuned against a 680pt frame. That reference is
  // deliberately narrower than a real browser: a card is looked at, not
  // worked in, so the window has to stay legible when it is only half of a
  // 1200-wide link preview. The printed sheet sets its own.
  const reference = MOCKUP_REFERENCE[kind] ?? 680;
  const u = (n: number) => Math.max(1, Math.round((n * (scaleWidth ?? width)) / reference));
  const Screen = SCREENS[kind] ?? CallSheet;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width,
        ...(height ? { height } : {}),
        borderRadius: u(R.card),
        border: `1px solid ${theme.panelBorder}`,
        backgroundColor: theme.appPanel,
        // Only a backdrop sets one. On a flat card the panel is already
        // plainly not the background and a shadow would be decoration.
        ...(theme.appShadow ? { boxShadow: theme.appShadow } : {}),
        overflow: "hidden",
      }}
    >
      <Screen theme={theme} u={u} mark={mark} lockup={lockup} />
    </div>
  );
}
