/**
 * The shape of a social image, and how it travels in a URL.
 *
 * A spec is the whole image: template, size, palette and copy. Rendering
 * is a pure function of it, which is what makes the rest of the feature
 * cheap. The studio previews an unsaved card by putting a spec in a query
 * string, the library previews a saved one by reading it back out of the
 * database, and KIPP files a draft by writing a spec and nothing else.
 * No image has to exist until somebody approves it.
 */

import {
  BACKDROP_CROPS,
  BACKDROP_DIMS,
  BACKDROP_FOCUS,
  DEFAULT_BACKDROP,
  DEFAULT_BACKDROP_BASE,
  DEFAULT_DIM,
  DEFAULT_FOCUS,
  SOCIAL_BACKDROPS,
  type BackdropFocus,
  type BackdropId,
} from "./backdrops";
import { DEFAULT_FORMAT, SOCIAL_FORMATS, type SocialFormatId } from "./formats";
import { DEFAULT_PLACEMENT, PLACEMENTS, type PlacementId } from "./placement";
import { DEFAULT_THEME, SOCIAL_THEMES, type SocialThemeId } from "./themes";

export type SocialTemplateId =
  | "statement"
  | "quote"
  | "stat"
  | "checklist"
  | "feature"
  | "announce"
  | "product"
  | "compare"
  | "steps"
  | "hook"
  | "grid"
  | "term"
  | "showcase"
  | "poster";

/**
 * Which piece of the app a product card shows. These are drawn from flex
 * boxes rather than screenshotted, so they stay sharp at 1080 wide, never
 * leak a real production's data, and can be re-themed with the card.
 */
export type MockupKind =
  | "dashboard"
  | "tasks"
  | "board"
  | "timeline"
  | "calendar"
  | "callsheet"
  | "document"
  | "schedule"
  | "runofshow"
  | "breakdown"
  | "alert"
  | "capacity"
  | "crew"
  | "roster"
  | "timecard"
  | "budget"
  | "invoice"
  | "chart"
  | "portal"
  | "clienthome"
  | "approval"
  | "requestform"
  | "intake"
  | "requests"
  | "inventory"
  | "resources"
  | "skills"
  | "chat"
  | "brain"
  | "aiupdate"
  | "suggestions"
  | "aisort";

/**
 * Which part of the job a screen belongs to. Twenty-nine chips in one row
 * is a wall; grouped, the picker reads as the product does.
 */
export type MockupGroup = "Plan" | "On set" | "Team" | "Money" | "Clients" | "Kit" | "Assistant";

export const MOCKUP_GROUPS: MockupGroup[] = ["Plan", "On set", "Team", "Money", "Clients", "Kit", "Assistant"];

export interface MockupDefinition {
  id: MockupKind;
  label: string;
  group: MockupGroup;
  /**
   * Roughly what the drawn panel looks like from across the room. A wide
   * panel wants a card that gives it width, a tall one wants a card that
   * gives it height, and putting them the wrong way round is the fastest
   * way to a card with a postage stamp in the middle of it. The exact
   * aspects live with the drawings, in `mockups.tsx`.
   */
  shape: "wide" | "tall";
  /** The outcome this screen delivers, offered as starting copy in the studio */
  valueLine: string;
}

export const MOCKUPS: Record<MockupKind, MockupDefinition> = {
  dashboard: {
    id: "dashboard",
    label: "Dashboard",
    group: "Plan",
    shape: "wide",
    valueLine: "Open the app and already know what needs you today.",
  },
  tasks: {
    id: "tasks",
    label: "Tasks and work packages",
    group: "Plan",
    shape: "wide",
    valueLine: "A hundred moving parts, grouped so you can still read them.",
  },
  board: {
    id: "board",
    label: "Production board",
    group: "Plan",
    shape: "wide",
    valueLine: "Every job on one board, so nothing quietly stops moving.",
  },
  timeline: {
    id: "timeline",
    label: "Project timeline",
    group: "Plan",
    shape: "wide",
    valueLine: "See the whole run of a job, and what slips if one week does.",
  },
  calendar: {
    id: "calendar",
    label: "Booking calendar",
    group: "Plan",
    shape: "wide",
    valueLine: "A month you can actually answer questions about.",
  },
  callsheet: {
    id: "callsheet",
    label: "Call sheet",
    group: "On set",
    shape: "wide",
    valueLine: "Tomorrow's call sheet, built from the schedule you already made.",
  },
  document: {
    id: "document",
    label: "The printed sheet",
    group: "On set",
    // It reads as a page, but it measures 0.85 rather than the 1.24 it was
    // declared at, so calling it tall made the studio warn about a squash
    // that does not happen.
    shape: "wide",
    valueLine: "The sheet your crew opens on their phone at six in the morning.",
  },
  schedule: {
    id: "schedule",
    label: "Shooting schedule",
    group: "On set",
    shape: "wide",
    valueLine: "Move one scene and every call time downstream moves with it.",
  },
  runofshow: {
    id: "runofshow",
    label: "Run of show",
    group: "On set",
    shape: "wide",
    valueLine: "Everyone on the floor working from the same minute.",
  },
  breakdown: {
    id: "breakdown",
    label: "Script breakdown",
    group: "On set",
    shape: "wide",
    valueLine: "It reads the script and hands you the list you were going to write.",
  },
  alert: {
    id: "alert",
    label: "Notifications",
    group: "On set",
    shape: "wide",
    valueLine: "You hear about the problem while it is still a small one.",
  },
  capacity: {
    id: "capacity",
    label: "Team capacity",
    group: "Team",
    shape: "wide",
    valueLine: "See who is free next week before you promise a delivery date.",
  },
  crew: {
    id: "crew",
    label: "Crew search",
    group: "Team",
    shape: "wide",
    valueLine: "Find someone good who is actually free that week.",
  },
  roster: {
    id: "roster",
    label: "Crew roster",
    group: "Team",
    shape: "wide",
    valueLine: "Who is on this job, what they do, and whether they have said yes.",
  },
  timecard: {
    id: "timecard",
    label: "Timesheets",
    group: "Team",
    shape: "wide",
    valueLine: "Approve the week's hours in the time it takes to read them.",
  },
  budget: {
    id: "budget",
    label: "Budget and margin",
    group: "Money",
    shape: "wide",
    valueLine: "Watch the margin on a job while there is still time to protect it.",
  },
  invoice: {
    id: "invoice",
    label: "Invoices",
    group: "Money",
    shape: "wide",
    valueLine: "See what is owed, and how late it is.",
  },
  chart: {
    id: "chart",
    label: "Spend over time",
    group: "Money",
    shape: "wide",
    valueLine: "Watch what you have spent against what you planned to.",
  },
  portal: {
    id: "portal",
    label: "Client portal",
    group: "Clients",
    shape: "wide",
    valueLine: "Clients approve in one place, so feedback stops living in your inbox.",
  },
  clienthome: {
    id: "clienthome",
    label: "What the client sees",
    group: "Clients",
    shape: "wide",
    valueLine: "Your clients get a front door, and it has your name on it.",
  },
  approval: {
    id: "approval",
    label: "Sign off",
    group: "Clients",
    shape: "wide",
    valueLine: "Every sign off arrives with a name and a time on it.",
  },
  requestform: {
    id: "requestform",
    label: "The request form",
    group: "Clients",
    // It reads as a page, and it was declared tall on that basis. It
    // measures 0.68, the same trap `document` fell into: calling it tall
    // makes the studio warn about a squash that does not happen.
    shape: "wide",
    valueLine: "Your clients brief you on a form you wrote.",
  },
  intake: {
    id: "intake",
    label: "Building the form",
    group: "Clients",
    shape: "wide",
    valueLine: "Every question you ask lands somewhere in the project.",
  },
  requests: {
    id: "requests",
    label: "Project requests",
    group: "Clients",
    shape: "wide",
    valueLine: "A brief arrives, and the project builds itself out of it.",
  },
  inventory: {
    id: "inventory",
    label: "Gear and inventory",
    group: "Kit",
    shape: "wide",
    valueLine: "Know what is out, what is back, and what is double booked.",
  },
  resources: {
    id: "resources",
    label: "What the kit earned",
    group: "Kit",
    shape: "wide",
    valueLine: "Where the hours and the hire money actually went, by type.",
  },
  skills: {
    id: "skills",
    label: "Competency",
    group: "Team",
    shape: "wide",
    valueLine: "What you are good at, worked out from the work you actually did.",
  },
  aiupdate: {
    id: "aiupdate",
    label: "The unprompted briefing",
    group: "Assistant",
    shape: "wide",
    valueLine: "It has already read the job and written you the update.",
  },
  suggestions: {
    id: "suggestions",
    label: "What to do next",
    group: "Assistant",
    shape: "wide",
    valueLine: "Suggestions with the reasoning attached, so you can disagree with them.",
  },
  aisort: {
    id: "aisort",
    label: "Sorting the board",
    group: "Assistant",
    shape: "wide",
    valueLine: "An afternoon of scheduling, done and shown its working.",
  },
  chat: {
    id: "chat",
    label: "Asking it directly",
    group: "Assistant",
    shape: "wide",
    valueLine: "Ask for the thing you need, and watch it check before it writes.",
  },
  brain: {
    id: "brain",
    label: "The organisation brain",
    group: "Assistant",
    shape: "wide",
    valueLine: "It works out how you run from what already happened, with the evidence attached.",
  },
};

export const MOCKUP_IDS = Object.keys(MOCKUPS) as MockupKind[];

/** The screens in one group, in catalogue order. Used by the studio picker. */
export function mockupsInGroup(group: MockupGroup): MockupDefinition[] {
  return MOCKUP_IDS.map((id) => MOCKUPS[id]).filter((m) => m.group === group);
}

export interface SocialImageSpec {
  template: SocialTemplateId;
  format: SocialFormatId;
  theme: SocialThemeId;

  /** Small letterspaced line above the headline */
  eyebrow: string;
  /** The main line. Every template uses it. */
  headline: string;
  /** Second headline line, rendered in the secondary tier */
  headlineAccent: string;
  /** Supporting paragraph */
  body: string;
  /** Bullets for the checklist and feature templates */
  items: string[];
  /**
   * The right-hand column of a comparison card. `items` is the left. Kept
   * as two lists rather than one list of pairs because the two sides are
   * rarely the same length and pairing them up on a card implies a
   * correspondence between rows that is almost never actually there.
   */
  itemsB: string[];
  /** Heading over the left column of a comparison */
  labelA: string;
  /** Heading over the right column */
  labelB: string;
  /** The large figure on a stat card, e.g. "3x" or "12 min" */
  stat: string;
  /** Who said the quote, or what the stat is measuring */
  attribution: string;
  /** Bottom-left line, usually the promise or the plan note */
  footnote: string;
  /** Bottom-right line. Defaults to the domain. */
  cta: string;

  /** Which app screen a product card draws */
  mockup: MockupKind;

  /**
   * Draw the app panel on a layout that would not otherwise carry one.
   *
   * The product and showcase cards are built around a panel and always
   * have one. Everywhere else it is a switch, because a stat, a statement
   * or a definition is sometimes stronger with the thing itself under it
   * and usually stronger without. Off by default for that reason.
   */
  showMockup: boolean;

  /** Which piece of the identity the card carries, and `none` means none */
  brand: BrandKind;

  /**
   * Multiplier on every type size and gap. 1 is the tuned default.
   *
   * Here because the right size depends on where a card lands, and that is
   * a judgement the person posting it makes, not one a template can.
   */
  typeScale: number;

  /** Multiplier on the mark or lockup, independent of the type size. */
  brandScale: number;

  /**
   * A cinematic backing, in place of the palette's flat background. Its
   * own scrim and ink take over so type stays legible on it.
   */
  backdrop: BackdropId;

  /**
   * An uploaded photograph behind the card: a path in the backdrops
   * bucket, or empty for none.
   *
   * Held as a path rather than an address so a card outlives a change of
   * project, and stored on the spec rather than looked up by id so that
   * rendering stays a pure function of the row.
   *
   * It wins over `backdrop`. A picture and a drawn sky in the same frame
   * is two backgrounds arguing.
   */
  backdropImage: string;

  /** How close the crop on that photograph is. Steps, so a set stays a set. */
  backdropCrop: number;

  /** Which part of the photograph survives the crop. */
  backdropFocus: BackdropFocus;

  /** How much darkening sits between the photograph and the words. */
  backdropDim: number;

  /**
   * The colour under an uploaded photograph.
   *
   * Carried on the spec rather than looked up, because rendering has to
   * stay a pure function of the row. It is what shows while the file is
   * loading and, more importantly, if the file cannot be read at all: with
   * no colour here a card whose photograph had gone drew its bottom-
   * weighted scrim over nothing and came out a light grey gradient, which
   * is the one thing a dark brand cannot ship by accident.
   */
  backdropBase: string;

  /**
   * The photographer's credit, drawn small and faint along the bottom.
   *
   * Already assembled into the line that goes on the card, name and handle
   * both, and carried on the spec rather than looked up for the same
   * reason `backdropBase` is: rendering has to stay a pure function of the
   * row, and a card that was approved crediting somebody has to keep
   * crediting them whatever the library says later.
   *
   * Empty means no credit is drawn, which is the right default for a
   * picture that came off one of our own shoots.
   */
  backdropCredit: string;

  /** Which bottom corner it sits in. Left is the default; a banner wants right. */
  backdropCreditSide: CreditSide;

  /**
   * Where the block of words sits on the card, and how its lines are set.
   *
   * Set-level, like the type size. A photograph decides this more than a
   * template does, which is why it is a control rather than something each
   * layout hard-codes.
   */
  placement: PlacementId;

  /**
   * Film grain over everything.
   *
   * The thing that stops a gradient reading as a software gradient, and
   * the difference between a card that looks photographed and one that
   * looks generated. On by default wherever a backdrop is set.
   */
  grain: boolean;

  /**
   * Position in a carousel, 1-based. Zero means this card stands alone.
   * Kept in the spec rather than derived at render time so the card is
   * still correct if it is exported on its own.
   */
  slideIndex: number;
  slideCount: number;

  /**
   * Which half of the footer bar draws.
   *
   * The bar has two slots doing different jobs: the footnote on the left is
   * the invitation, and the right is the call to action, or `Swipe` when the
   * card is one of a set. They were always drawn as a pair, so a card whose
   * footnote and cta both said `abram.network` printed the domain twice with
   * a rule under it, which reads as a rendering fault rather than as a
   * decision. Turning one side off is the fix that keeps the other side's
   * job intact.
   */
  footer: FooterMode;

  /**
   * The laser streak across the top-left corner.
   *
   * Off by default. It echoes a detail on the site, and on a card it is one
   * more thing above the mark competing with the words for the first look.
   * Every card that wants it can still ask.
   */
  showRule: boolean;
}

/**
 * Which side of the footer bar draws. `none` suppresses the bar and its rule
 * altogether, which is what a card carrying its address in the copy wants.
 */
export type FooterMode = "both" | "left" | "right" | "none";

export const FOOTER_MODES: { id: FooterMode; label: string }[] = [
  { id: "both", label: "Both" },
  { id: "left", label: "Left only" },
  { id: "right", label: "Right only" },
  { id: "none", label: "None" },
];

/**
 * Which corner a photographer's credit sits in.
 *
 * Left by default, where a printed page puts one. A LinkedIn banner is the
 * exception, since a profile photo covers its bottom left.
 */
export type CreditSide = "left" | "right";

export const CREDIT_SIDES: { id: CreditSide; label: string }[] = [
  { id: "left", label: "Bottom left" },
  { id: "right", label: "Bottom right" },
];

/**
 * The credit line for a picture, from whichever of the two fields the
 * library has.
 *
 * The handle is the half that does anything: a name on a card is a
 * courtesy, and a handle in the caption is a notification the creator
 * actually gets. Both, where both exist.
 */
export function creditLine(name: string | null | undefined, handle: string | null | undefined): string {
  const who = (name || "").trim();
  const at = (handle || "").trim().replace(/^@+/, "");
  if (who && at) return `${who} @${at}`;
  if (at) return `@${at}`;
  return who;
}

/**
 * The same credit, written the way it goes in a caption.
 *
 * A card can afford two words in a corner. A caption has room to say what
 * the line is doing there, and the tag has to be the last thing so a
 * platform that truncates the post still leaves the creator tagged.
 */
export function captionCredit(name: string | null | undefined, handle: string | null | undefined): string {
  const line = creditLine(name, handle);
  return line ? `Photo by ${line}` : "";
}

/**
 * The lockup is the mark plus the wordmark and is the default, since a
 * card is usually somebody's first sight of the name. The mark alone is
 * for a set where the name has already been established, most often the
 * middle slides of a carousel.
 */
export type BrandKind = "lockup" | "mark" | "none";

export const BRAND_KINDS: { id: BrandKind; label: string }[] = [
  { id: "lockup", label: "Lockup" },
  { id: "mark", label: "Mark only" },
  { id: "none", label: "None" },
];

/**
 * Type and mark sizes, as steps rather than a slider.
 *
 * A slider invites fiddling and every card comes out a different size. Four
 * steps means a set still looks like a set.
 */
export const TYPE_SCALES: { value: number; label: string }[] = [
  { value: 0.85, label: "Small" },
  { value: 1, label: "Default" },
  { value: 1.15, label: "Large" },
  { value: 1.3, label: "Largest" },
];

export const BRAND_SCALES: { value: number; label: string }[] = [
  { value: 0.7, label: "Small" },
  { value: 1, label: "Default" },
  { value: 1.35, label: "Large" },
];

/** Which fields a template actually renders, so the studio only asks for those. */
export type SocialSpecField = keyof Pick<
  SocialImageSpec,
  | "eyebrow"
  | "headline"
  | "headlineAccent"
  | "body"
  | "items"
  | "itemsB"
  | "labelA"
  | "labelB"
  | "stat"
  | "attribution"
  | "footnote"
  | "cta"
>;

/** The fields that hold a list rather than a line. */
export const LIST_FIELDS: SocialSpecField[] = ["items", "itemsB"];

export interface SocialTemplate {
  id: SocialTemplateId;
  label: string;
  /** One line on what this card is for, shown in the studio picker */
  blurb: string;
  fields: SocialSpecField[];
  /**
   * Fields this layout will draw but does not ask for.
   *
   * Only the eyebrow, so far, and the reason is worth writing down. A
   * letterspaced label above the headline was on eleven of the fourteen
   * layouts and on nearly every preset, and almost none of them needed
   * one: FOR PRODUCERS over a line that already says what it does is a
   * word the reader has to step over to reach the sentence. Offering it
   * as a field meant it got filled in, because an empty box asks to be
   * filled. It is behind a switch now, off unless somebody turns it on.
   */
  optional?: SocialSpecField[];
  /** Soft character budgets, surfaced as counters rather than enforced */
  limits: Partial<Record<SocialSpecField, number>>;
}

export const SOCIAL_TEMPLATES: Record<SocialTemplateId, SocialTemplate> = {
  statement: {
    id: "statement",
    label: "Statement",
    blurb: "One claim, two lines. The default card and the one the campaign pages already use.",
    fields: ["headline", "headlineAccent", "footnote", "cta"],
    optional: ["eyebrow"],
    limits: { eyebrow: 32, headline: 46, headlineAccent: 46, footnote: 60, cta: 30 },
  },
  poster: {
    id: "poster",
    label: "Poster",
    blurb:
      "A small mark, one line, and something atmospheric behind it. Centred, no eyebrow, no footer. The quietest card here and usually the best one.",
    fields: ["headline", "body", "footnote"],
    limits: { headline: 70, body: 60, footnote: 34 },
  },
  hook: {
    id: "hook",
    label: "Hook",
    blurb:
      "One line, as large as it will go, and nothing else. For slide one of a carousel and for stories, where you have about a second.",
    fields: ["headline", "footnote", "cta"],
    optional: ["eyebrow"],
    limits: { eyebrow: 24, headline: 62, footnote: 40, cta: 26 },
  },
  product: {
    id: "product",
    label: "Product look",
    blurb: "A drawn panel of the app next to the outcome it gets you. The one that shows the thing working.",
    fields: ["headline", "body", "footnote", "cta"],
    optional: ["eyebrow"],
    limits: { eyebrow: 32, headline: 44, body: 130, footnote: 56, cta: 30 },
  },
  showcase: {
    id: "showcase",
    label: "Showcase",
    blurb:
      "The same app panel, but as the whole card, with one line over it. Use it when the screen is the argument.",
    fields: ["headline", "footnote", "cta"],
    optional: ["eyebrow"],
    limits: { eyebrow: 32, headline: 40, footnote: 50, cta: 30 },
  },
  compare: {
    id: "compare",
    label: "Comparison",
    blurb:
      "Two columns, the old way and this way. The most-shared shape there is, and the easiest one to overclaim on.",
    fields: ["headline", "labelA", "items", "labelB", "itemsB", "cta"],
    optional: ["eyebrow"],
    limits: { eyebrow: 32, headline: 42, labelA: 22, labelB: 22, items: 62, itemsB: 62, cta: 30 },
  },
  steps: {
    id: "steps",
    label: "Steps",
    blurb: "A numbered sequence, three or four long. For how something is actually done.",
    fields: ["headline", "items", "footnote", "cta"],
    optional: ["eyebrow"],
    limits: { eyebrow: 32, headline: 42, items: 72, footnote: 50, cta: 30 },
  },
  quote: {
    id: "quote",
    label: "Quote",
    blurb: "A pulled sentence with an attribution. Use it for lines from a post, never for invented praise.",
    fields: ["headline", "attribution", "footnote", "cta"],
    limits: { headline: 180, attribution: 48, footnote: 60, cta: 30 },
  },
  stat: {
    id: "stat",
    label: "Stat",
    blurb: "One measured number, large. The figure has to be something you can point at.",
    fields: ["stat", "headline", "attribution", "cta"],
    optional: ["eyebrow"],
    limits: { eyebrow: 32, stat: 12, headline: 60, attribution: 70, cta: 30 },
  },
  checklist: {
    id: "checklist",
    label: "Checklist",
    blurb: "A title over three to five ticked lines. Good for what shipped, or what a plan includes.",
    fields: ["headline", "items", "cta"],
    optional: ["eyebrow"],
    limits: { eyebrow: 32, headline: 50, items: 52, cta: 30 },
  },
  feature: {
    id: "feature",
    label: "Feature",
    blurb: "Title, paragraph, and a few supporting points. The densest card, best in portrait or square.",
    fields: ["headline", "body", "items", "cta"],
    optional: ["eyebrow"],
    limits: { eyebrow: 32, headline: 44, body: 190, items: 46, cta: 30 },
  },
  announce: {
    id: "announce",
    label: "Announcement",
    blurb: "A badge, a title and a paragraph. For release notes and anything with a date on it.",
    fields: ["eyebrow", "headline", "body", "footnote", "cta"],
    limits: { eyebrow: 20, headline: 52, body: 170, footnote: 48, cta: 30 },
  },
  grid: {
    id: "grid",
    label: "Tiles",
    blurb: "Four short things in a two by two. For a range, where a list would read as a ranking.",
    fields: ["headline", "items", "footnote", "cta"],
    optional: ["eyebrow"],
    limits: { eyebrow: 32, headline: 40, items: 34, footnote: 50, cta: 30 },
  },
  term: {
    id: "term",
    label: "Definition",
    blurb:
      "A word and what it means on a set. Quietly the best performer, because it is useful before it is an advert.",
    fields: ["headline", "body", "footnote", "cta"],
    optional: ["eyebrow"],
    limits: { eyebrow: 24, headline: 26, body: 200, footnote: 50, cta: 30 },
  },
};

export const SOCIAL_TEMPLATE_IDS = Object.keys(SOCIAL_TEMPLATES) as SocialTemplateId[];

/** Layouts built around an app panel, which therefore always draw one. */
export const TEMPLATES_WITH_MOCKUP: SocialTemplateId[] = ["product", "showcase"];

/**
 * Whether this card draws an app panel at all.
 *
 * Two layouts are built around one and compose it themselves. Everywhere
 * else it is `showMockup`, and the frame draws the panel under the words
 * rather than the template knowing anything about it. That split is what
 * keeps the switch to one flag: no layout has to grow a second version of
 * itself with a screen in it.
 */
export function drawsMockup(spec: Pick<SocialImageSpec, "template" | "showMockup">): boolean {
  return TEMPLATES_WITH_MOCKUP.includes(spec.template) || spec.showMockup;
}

/** True where the demo is a switch rather than the point of the layout. */
export function canToggleMockup(template: SocialTemplateId): boolean {
  return !TEMPLATES_WITH_MOCKUP.includes(template);
}

/**
 * How much of the card's height the switched-on panel may take.
 *
 * A statement is two lines and can give away nearly half the card. A
 * comparison is two columns of bullets and cannot: the panel would push
 * the second column into the footer. Set by density rather than by one
 * number for all fourteen.
 */
export const MOCKUP_SHARE: Partial<Record<SocialTemplateId, number>> = {
  compare: 0.28,
  steps: 0.3,
  feature: 0.3,
  grid: 0.3,
  checklist: 0.34,
  term: 0.34,
  announce: 0.36,
  quote: 0.36,
};

export const DEFAULT_MOCKUP_SHARE = 0.46;

export const DEFAULT_TEMPLATE: SocialTemplateId = "statement";

export const EMPTY_SPEC: SocialImageSpec = {
  template: DEFAULT_TEMPLATE,
  format: DEFAULT_FORMAT,
  theme: DEFAULT_THEME,
  eyebrow: "",
  headline: "",
  headlineAccent: "",
  body: "",
  items: [],
  itemsB: [],
  labelA: "",
  labelB: "",
  stat: "",
  attribution: "",
  footnote: "",
  cta: "abram.network",
  mockup: "callsheet",
  showMockup: false,
  brand: "lockup",
  typeScale: 1,
  brandScale: 1,
  backdrop: DEFAULT_BACKDROP,
  backdropImage: "",
  backdropCrop: 1,
  backdropFocus: DEFAULT_FOCUS,
  backdropDim: DEFAULT_DIM,
  backdropBase: DEFAULT_BACKDROP_BASE,
  backdropCredit: "",
  backdropCreditSide: "left",
  placement: DEFAULT_PLACEMENT,
  grain: false,
  slideIndex: 0,
  slideCount: 0,
  footer: "both",
  showRule: false,
};

/** A carousel longer than this stops being read and starts being scrolled past. */
export const MAX_SLIDES = 10;

/** How many bullets a card can carry before it stops being readable. */
export const MAX_ITEMS = 5;

/**
 * Longest string we will accept in any single field. Generous next to the
 * soft limits above, and there only so a hand-built URL cannot ask Satori
 * to lay out a novel.
 */
const MAX_FIELD_LENGTH = 600;

function text(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  return value.slice(0, MAX_FIELD_LENGTH);
}

/** Blank rows are dropped: the studio always sends `MAX_ITEMS` inputs, most of them empty. */
function list(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .slice(0, MAX_ITEMS)
    .map((item) => item.slice(0, MAX_FIELD_LENGTH));
}

/**
 * Turn anything into a spec we are willing to render. Unknown templates,
 * formats and themes fall back to the defaults rather than throwing,
 * because the caller is often a URL and a broken preview is worse than a
 * plain one.
 */
export function normalizeSpec(input: unknown): SocialImageSpec {
  const raw = (input && typeof input === "object" ? input : {}) as Partial<SocialImageSpec>;

  const template = SOCIAL_TEMPLATES[raw.template as SocialTemplateId] ? (raw.template as SocialTemplateId) : DEFAULT_TEMPLATE;
  const format = SOCIAL_FORMATS[raw.format as SocialFormatId] ? (raw.format as SocialFormatId) : DEFAULT_FORMAT;
  const theme = SOCIAL_THEMES[raw.theme as SocialThemeId] ? (raw.theme as SocialThemeId) : DEFAULT_THEME;
  const backdrop = SOCIAL_BACKDROPS[raw.backdrop as BackdropId] ? (raw.backdrop as BackdropId) : DEFAULT_BACKDROP;
  const backdropImage = storagePath(raw.backdropImage);
  // A photograph is a backdrop by any reading, so it turns on the same
  // light text tiers and the same grain default the drawn skies do.
  const hasBacking = backdrop !== "none" || Boolean(backdropImage);

  return {
    template,
    format,
    theme,
    eyebrow: text(raw.eyebrow),
    headline: text(raw.headline),
    headlineAccent: text(raw.headlineAccent),
    body: text(raw.body),
    items: list(raw.items),
    itemsB: list(raw.itemsB),
    labelA: text(raw.labelA),
    labelB: text(raw.labelB),
    stat: text(raw.stat),
    attribution: text(raw.attribution),
    footnote: text(raw.footnote),
    cta: text(raw.cta, EMPTY_SPEC.cta),
    mockup: MOCKUPS[raw.mockup as MockupKind] ? (raw.mockup as MockupKind) : EMPTY_SPEC.mockup,
    // Only ever true when somebody asked for it. The two layouts that are
    // built around a panel do not read this at all.
    showMockup: raw.showMockup === true,
    brand: brandOf(raw),
    typeScale: scale(raw.typeScale, TYPE_SCALES),
    brandScale: scale(raw.brandScale, BRAND_SCALES),
    backdrop,
    backdropImage,
    backdropCrop: scale(raw.backdropCrop, BACKDROP_CROPS),
    backdropFocus: BACKDROP_FOCUS[raw.backdropFocus as BackdropFocus] ? (raw.backdropFocus as BackdropFocus) : DEFAULT_FOCUS,
    backdropDim: nearest(raw.backdropDim, BACKDROP_DIMS, DEFAULT_DIM),
    backdropBase: hexColour(raw.backdropBase),
    // A credit with no picture behind it is crediting nobody for nothing,
    // and would draw a stray line along the bottom of a plain card.
    backdropCredit: backdropImage ? text(raw.backdropCredit).slice(0, 80) : "",
    backdropCreditSide: raw.backdropCreditSide === "right" ? "right" : "left",
    placement: PLACEMENTS[raw.placement as PlacementId] ? (raw.placement as PlacementId) : DEFAULT_PLACEMENT,
    // Grain without a backdrop is just noise on a flat colour, so it
    // follows the backing unless somebody has said otherwise.
    grain: typeof raw.grain === "boolean" ? raw.grain : hasBacking,
    slideIndex: clampInt(raw.slideIndex, 0, MAX_SLIDES),
    slideCount: clampInt(raw.slideCount, 0, MAX_SLIDES),
    footer: FOOTER_MODES.some((f) => f.id === raw.footer) ? (raw.footer as FooterMode) : "both",
    // Opt in rather than opt out. An absent flag on an existing draft now
    // means no streak, which is the answer that card would have chosen.
    showRule: raw.showRule === true,
  };
}

/** Accepts the older `showLockup: false` shape, which meant `brand: "none"`. */
function brandOf(raw: Partial<SocialImageSpec> & { showLockup?: boolean }): BrandKind {
  if (BRAND_KINDS.some((b) => b.id === raw.brand)) return raw.brand as BrandKind;
  return raw.showLockup === false ? "none" : "lockup";
}

/** Snaps to the nearest offered step, so a hand-built URL cannot ask for 40x type. */
function scale(value: unknown, steps: { value: number }[]): number {
  return nearest(value, steps, 1);
}

function nearest(value: unknown, steps: { value: number }[], fallback: number): number {
  const n = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  if (!Number.isFinite(n)) return fallback;
  return steps.reduce((best, step) => (Math.abs(step.value - n) < Math.abs(best - n) ? step.value : best), fallback);
}

/** A six digit hex and nothing else: it is written straight into a style. */
function hexColour(value: unknown): string {
  if (typeof value !== "string") return DEFAULT_BACKDROP_BASE;
  const trimmed = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : DEFAULT_BACKDROP_BASE;
}

/**
 * A path inside the backdrops bucket, and nothing else.
 *
 * The renderer turns this into an address and fetches it server-side, so
 * an unchecked string here would be a way to make the server fetch
 * anything. Anything with a scheme, a host, a leading slash or a parent
 * segment in it is dropped rather than repaired: a card with no photograph
 * is a smaller problem than a card with somebody else's.
 */
function storagePath(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 240) return "";
  if (!/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(trimmed)) return "";
  if (trimmed.includes("..") || trimmed.includes("//")) return "";
  return trimmed;
}

function clampInt(value: unknown, min: number, max: number): number {
  const n = typeof value === "number" ? Math.round(value) : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

/**
 * Specs go into URLs as base64url JSON. A flat query string was the first
 * try, but bullets and apostrophes made the escaping fiddly and the
 * preview `<img>` tag re-encodes on every keystroke.
 */
export function encodeSpec(spec: SocialImageSpec): string {
  const json = JSON.stringify(spec);
  const base64 = typeof window === "undefined"
    ? Buffer.from(json, "utf8").toString("base64")
    : btoa(String.fromCharCode(...new TextEncoder().encode(json)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeSpec(encoded: string | null | undefined): SocialImageSpec {
  if (!encoded) return normalizeSpec(null);
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const json = typeof window === "undefined"
      ? Buffer.from(base64, "base64").toString("utf8")
      : new TextDecoder().decode(Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)));
    return normalizeSpec(JSON.parse(json));
  } catch {
    return normalizeSpec(null);
  }
}

/** Path the render route serves this spec from. */
export function specToRenderPath(spec: SocialImageSpec): string {
  return `/api/social/render?s=${encodeSpec(spec)}`;
}

/**
 * A filename someone can find again in their downloads folder. Derived
 * from the headline so a batch of cards for one post sorts together.
 */
export function specToFilename(spec: SocialImageSpec, title?: string): string {
  const base = (title || spec.headline || spec.stat || spec.template)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "abram-social";
  return `${base}-${spec.format}.png`;
}
