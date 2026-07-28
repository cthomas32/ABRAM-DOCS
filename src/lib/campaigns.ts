/**
 * Campaign landing page configuration.
 *
 * Every conversion page under /start is rendered by a single component
 * (`CampaignLanding`) driven by one of these variants. Copy is kept short
 * on purpose: these pages catch social traffic, so the visible page is a
 * scan, not a read. The longer detail lives in `seoDetail`, which renders
 * for crawlers and assistants without cluttering the page.
 */

export const APP_SIGNUP_URL = "https://app.abram.network";

export type CampaignSlug = "start" | "start-filmmakers" | "start-agencies" | "start-post";

export type BenefitIcon =
  | "scan"
  | "calendar"
  | "clipboard"
  | "users"
  | "package"
  | "wallet"
  | "gauge"
  | "inbox"
  | "share"
  | "receipt"
  | "layers"
  | "sparkles";

export type VisualKind =
  | "callsheet"
  | "schedule"
  | "capacity"
  | "margin"
  | "review"
  | "runofshow"
  | "portal";

export interface CampaignHighlight {
  icon: BenefitIcon;
  label: string;
  body: string;
}

export interface CampaignFeature {
  title: string;
  body: string;
  visual: VisualKind;
  /** Small honest caveat, e.g. which plan a feature needs */
  note?: string;
}

export interface CampaignFaq {
  question: string;
  answer: string;
}

export interface CampaignVariant {
  /** Tracking slug stored against every visit */
  slug: CampaignSlug;
  /** Public route */
  path: string;
  /** Short label used in the admin dashboard */
  label: string;

  eyebrow: string;
  headline: string;
  headlineAccent: string;
  subhead: string;
  primaryCta: string;
  trustLine: string;
  heroVisual: VisualKind;

  highlights: CampaignHighlight[];
  features: CampaignFeature[];
  proofPoints: string[];
  faqs: CampaignFaq[];

  finalHeadline: string;

  /** Depth for search engines and AI assistants, hidden from the page */
  seoDetail: string[];
}

const FREE_PLAN_FAQ: CampaignFaq = {
  question: "Is the free plan actually free?",
  answer:
    "Yes. One seat and one active project with digital call sheets and view-only schedules. No card to open the account, and no trial countdown.",
};

const DATA_FAQ: CampaignFaq = {
  question: "What happens to my data if I stop?",
  answer:
    "Call sheets, schedules and reports export to PDF and spreadsheet formats at any time. Closing an account never locks your paperwork away.",
};

export const CAMPAIGN_VARIANTS: Record<CampaignSlug, CampaignVariant> = {
  /* ------------------------------------------------------------------ */
  /* Primary link-in-bio page. Channel agnostic.                         */
  /* ------------------------------------------------------------------ */
  start: {
    slug: "start",
    path: "/start",
    label: "Start (general)",

    eyebrow: "FREE TO START",
    headline: "Finish the job on time",
    headlineAccent: "with the margin you planned",
    subhead:
      "One workspace for schedules, crew, call sheets, gear and budgets, so nothing slips between them.",
    primaryCta: "Create your free account",
    trustLine: "Free plan. No card. Get started now.",
    heroVisual: "schedule",

    highlights: [
      {
        icon: "scan",
        label: "Prep in hours, not days",
        body: "Bring in a script and get the breakdown structured for you.",
      },
      {
        icon: "calendar",
        label: "Changes stop costing you",
        body: "Move a day and everything downstream follows it.",
      },
      {
        icon: "clipboard",
        label: "Get your evenings back",
        body: "Call sheets come off the schedule you already built.",
      },
      {
        icon: "wallet",
        label: "No surprises at wrap",
        body: "Spend tracks against plan while the job is still live.",
      },
    ],

    features: [
      {
        title: "Shoot days that end when you said they would",
        body: "Build the segment timeline, drag to reorder and the times recalculate. Go Live shows whether you are running behind while you can still do something about it.",
        visual: "runofshow",
      },
      {
        title: "Clients who chase you less",
        body: "They review deliverables, approve quotes and pay invoices through a secure link, so you stop being the middleman on every status update.",
        visual: "portal",
        note: "Client portals are available on Solo Pro and above.",
      },
    ],

    proofPoints: [
      "Free plan, no expiry",
      "No card to sign up",
      "Crew viewers are free",
      "Paid plans from $19",
    ],

    faqs: [
      FREE_PLAN_FAQ,
      {
        question: "How do I get set up?",
        answer:
          "Sign up, open a workspace, add a project. Bring in a script or a brief and let the structure come out the other side, or build it by hand. No demo call in the way.",
      },
      DATA_FAQ,
    ],

    finalHeadline: "Deliver the next one on time.",

    seoDetail: [
      "ABRAM is a creative operations platform for production companies, agencies and independent producers. It brings script and brief breakdown, shooting schedules, crew rosters with rates and availability, equipment and vehicle tracking, digital call sheets, run of show, client portals and production accounting into a single workspace.",
      "The free plan covers one seat and one active project, including digital call sheets and view-only schedules, with no expiry and no card required. Paid plans start at $19 per month for independent producers, $39 per seat for boutique agency teams and $49 per seat for larger production companies.",
      "Crew and clients invited to view a schedule or a call sheet do not consume a paid seat. Schedules, call sheets and reporting export to PDF and spreadsheet formats at any time.",
      "Run of Show gives live, broadcast and event productions a minute-by-minute segment timeline with role-based column presets for producer, camera, audio, graphics, replay and stage manager. Segments can be entered by hand or generated from a free-text outline of the show. Dragging a segment recalculates surrounding times, and a shift times tool bulk-adjusts a whole run. Go Live mode turns it into a show-control tool that tracks elapsed against scheduled time and reports variance, with pause, resume, advance and end controls.",
      "The Client Portal gives each client a private space to review deliverables, approve quotes, pay invoices and submit new requests through a secure magic link, with no password or account on their side. Visibility is controlled per client and per item, so clients see only what has been explicitly marked portal-visible, and a client discussion thread keeps that conversation separate from internal team chat. Client portals require a Solo Pro plan or higher.",
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Short-form video traffic: filmmakers, producers, videographers      */
  /* ------------------------------------------------------------------ */
  "start-filmmakers": {
    slug: "start-filmmakers",
    path: "/start/filmmakers",
    label: "Start (filmmakers)",

    eyebrow: "FOR FILMMAKERS AND PRODUCERS",
    headline: "Get your evenings back",
    headlineAccent: "and your shoot days on schedule",
    subhead:
      "Script in, breakdown out, schedule built, call sheet sent. One workspace instead of five tabs and a group chat.",
    primaryCta: "Start free",
    trustLine: "Free plan. No card. Get started now.",
    heroVisual: "callsheet",

    highlights: [
      {
        icon: "scan",
        label: "Break down a script in one sitting",
        body: "Scenes, cast, props and day counts, structured for you.",
      },
      {
        icon: "clipboard",
        label: "Stop rebuilding call sheets at 11pm",
        body: "They come off the schedule you already have.",
      },
      {
        icon: "users",
        label: "Crew up in minutes",
        body: "Rates, roles and availability in one searchable list.",
      },
      {
        icon: "package",
        label: "No gear surprises on the day",
        body: "Every body, lens and vehicle carries a calendar.",
      },
    ],

    features: [
      {
        title: "A schedule the crew actually follows",
        body: "Push a day and crew calls, bookings and downstream dates move with it. Crew see their own dates without you paying for a seat.",
        visual: "schedule",
      },
      {
        title: "Shoot days that end when you said they would",
        body: "A segment timeline you can drag to reorder, with times recalculating around it. Go Live tracks actual against scheduled on the day.",
        visual: "runofshow",
      },
    ],

    proofPoints: [
      "Free plan, no expiry",
      "No card to sign up",
      "Crew viewers are free",
      "Paid plans from $19",
    ],

    faqs: [
      FREE_PLAN_FAQ,
      {
        question: "Is this only for narrative film?",
        answer:
          "No. Commercials, branded content, docs, stills and event work run on the same structure. Anything with a shoot day, a crew and a kit list fits.",
      },
      DATA_FAQ,
    ],

    finalHeadline: "Your next shoot day, on schedule.",

    seoDetail: [
      "ABRAM is production management software for filmmakers, producers and videographers. Upload a script and get an AI script breakdown covering scenes, cast, props, locations and day counts, then build a shooting schedule and generate digital call sheets from it.",
      "Call sheets carry crew and cast contacts, unit call times, location details, weather forecasting and safety notes, and open on a phone. Schedules update downstream dates automatically when a shoot day moves.",
      "Crew rosters hold rates, roles, contact details and availability in one searchable list. Equipment, camera bodies, lenses and vehicles each carry a booking calendar so double bookings surface before the shoot day.",
      "Run of Show adds a minute-by-minute segment timeline with role-based column presets for producer, camera, audio, graphics, replay and stage manager. Segments can be built by hand or generated from a free-text outline, dragging a segment recalculates surrounding times, and Go Live mode tracks elapsed against scheduled time so variance is visible during the day.",
      "The free plan covers one seat and one active project with digital call sheets and view-only schedules, with no card required and no expiry. Paid plans start at $19 per month.",
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Forum traffic: studios, agencies, production companies              */
  /* ------------------------------------------------------------------ */
  "start-agencies": {
    slug: "start-agencies",
    path: "/start/agencies",
    label: "Start (agencies)",

    eyebrow: "FOR STUDIOS AND AGENCIES",
    headline: "Take on more work",
    headlineAccent: "without hiring for it",
    subhead:
      "See real capacity, scope faster, and keep the margin you quoted on every job.",
    primaryCta: "Open a free workspace",
    trustLine: "Free plan. No card. Get started now.",
    heroVisual: "capacity",

    highlights: [
      {
        icon: "gauge",
        label: "Say yes with confidence",
        body: "Real capacity by week before you commit to a date.",
      },
      {
        icon: "inbox",
        label: "Scope in minutes",
        body: "Requests arrive structured, not as a thread to decode.",
      },
      {
        icon: "share",
        label: "Fewer status calls",
        body: "Clients follow progress in their own portal.",
      },
      {
        icon: "receipt",
        label: "Keep the margin you quoted",
        body: "Estimates and spend tracked against the live job.",
      },
    ],

    features: [
      {
        title: "Quote faster, and quote closer",
        body: "Paste a client brief and get deliverables and constraints pulled out, so the estimate starts from something real instead of an old deck.",
        visual: "schedule",
      },
      {
        title: "Approvals that stop stalling the job",
        body: "Clients review deliverables, approve quotes and pay invoices through a secure link, and see only what you mark visible.",
        visual: "portal",
        note: "Client portals are available on Solo Pro and above.",
      },
    ],

    proofPoints: [
      "Free plan to evaluate",
      "No card, no sales call",
      "Team plans from $39 a seat",
      "Everything exports",
    ],

    faqs: [
      {
        question: "How is this different from a general project tool?",
        answer:
          "General trackers model tasks. This models a production: crew with rates and availability, resources with a calendar, shoot days, call sheets, client approvals and the money attached to all of it.",
      },
      FREE_PLAN_FAQ,
      DATA_FAQ,
    ],

    finalHeadline: "Same team. More delivered.",

    seoDetail: [
      "ABRAM is creative operations software for studios, creative agencies and commercial production companies. It covers capacity planning and utilisation across the team, custom client intake forms, AI brief analysis, crew matchmaking from your own roster, resource and equipment management, a client portal and production accounting.",
      "Capacity planning shows utilisation by week so overallocation is visible before it becomes a delivery problem. Crew matchmaking suggests people from your roster based on skills, rates and genuine availability for the dates.",
      "The Client Portal gives each client a private space to review deliverables, approve quotes, pay invoices and submit new requests through a secure magic link, with no password or account on their side. Visibility is controlled per client and per item, and a client discussion thread keeps that conversation separate from internal team chat. Client portals require a Solo Pro plan or higher.",
      "Production accounting tracks estimates, committed spend, timesheets and crew payouts against each job so margin stays visible while it can still be acted on.",
      "A free plan covers one seat and one active project with no expiry and no card. Team plans start at $39 per seat and include custom intake forms and the client portal. Studio plans start at $49 per seat and cover larger teams with up to 50 client portals.",
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Post production: editors, post houses, AI-assisted creatives        */
  /* ------------------------------------------------------------------ */
  "start-post": {
    slug: "start-post",
    path: "/start/post-production",
    label: "Start (post production)",

    eyebrow: "FOR EDITORS AND POST TEAMS",
    headline: "Get to final cut faster",
    headlineAccent: "with fewer rounds lost",
    subhead:
      "Deliverables, versioned rounds, approvals and post schedules in one workspace.",
    primaryCta: "Start free",
    trustLine: "Free plan. No card. Get started now.",
    heroVisual: "review",

    highlights: [
      {
        icon: "layers",
        label: "Never lose a round again",
        body: "Each submission saves as its own version.",
      },
      {
        icon: "clipboard",
        label: "Notes land in one place",
        body: "Feedback sits on the deliverable, not in an email thread.",
      },
      {
        icon: "share",
        label: "Stop hopping between apps",
        body: "Media assets and review links sit beside the project.",
      },
      {
        icon: "sparkles",
        label: "See what AI work costs",
        body: "Every AI action logged against your credit balance.",
      },
    ],

    features: [
      {
        title: "Deadlines you can actually hold",
        body: "Post phases, deliverables and dependencies on one timeline, so a slip in one place is visible everywhere else before it bites.",
        visual: "schedule",
      },
      {
        title: "Sign-off stops being a chase",
        body: "Clients review deliverables, approve quotes and pay invoices through a secure link, with no account for them to set up.",
        visual: "portal",
        note: "Client portals are available on Solo Pro and above.",
      },
    ],

    proofPoints: [
      "Free plan, no expiry",
      "No card to sign up",
      "Clients need a link, not an account",
      "Paid plans from $19",
    ],

    faqs: [
      FREE_PLAN_FAQ,
      {
        question: "Does this replace my review and approval tool?",
        answer:
          "No, it sits alongside it. Media assets and review links surface next to the project, so versions, notes and sign-off live with the job instead of in a separate silo.",
      },
      DATA_FAQ,
    ],

    finalHeadline: "Your next cut, approved sooner.",

    seoDetail: [
      "ABRAM handles post production alongside prep and shoot. Projects break into work packages by phase, and each package holds deliverables with a type of file, link or milestone, a priority, estimated hours, included revision rounds and dependencies marking which deliverable blocks or relates to another.",
      "Every time work is submitted against a deliverable it is saved as a new version and the revision counter increases, so no submission overwrites the one before it. Reviewers either approve the submission or request a revision, and the full history of rounds stays attached to the deliverable.",
      "A video review integration links a project to its media workspace, so producers can browse media assets, track active review and presentation links, and read reviewer comments from the project dashboard without switching applications.",
      "AI features are metered against an organization credit balance with a usage log, so AI-assisted work carries a visible cost alongside editor hours. Estimated hours and logged timesheet hours sit against each deliverable, which makes the true cost of a post schedule visible while the job is still running.",
      "Clients review deliverables, approve quotes and pay invoices through a private portal reached by a secure magic link, with no account to set up on their side. Client portals require a Solo Pro plan or higher. The free plan covers one seat and one active project with no expiry and no card required, and paid plans start at $19 per month.",
    ],
  },
};

/* -------------------------------------------------------------------- */
/* Attribution helpers                                                   */
/* -------------------------------------------------------------------- */

/**
 * Known referrer hosts mapped to a normalized channel name so the admin
 * dashboard groups traffic sensibly even when a link is shared without
 * tracking parameters attached.
 */
const REFERRER_CHANNELS: Array<[RegExp, string]> = [
  [/tiktok\.com|tiktokcdn/i, "tiktok"],
  [/reddit\.com|redd\.it/i, "reddit"],
  [/instagram\.com/i, "instagram"],
  [/youtube\.com|youtu\.be/i, "youtube"],
  [/linkedin\.com|lnkd\.in/i, "linkedin"],
  [/(^|\.)x\.com|twitter\.com|t\.co/i, "x"],
  [/facebook\.com|fb\.me/i, "facebook"],
  [/google\./i, "google"],
  [/bing\.com/i, "bing"],
  [/duckduckgo\.com/i, "duckduckgo"],
  [/chatgpt\.com|openai\.com/i, "chatgpt"],
  [/claude\.ai|perplexity\.ai/i, "ai-assistant"],
  [/discord\.com|discord\.gg/i, "discord"],
  [/news\.ycombinator\.com/i, "hackernews"],
];

/** Normalize a raw source string or referrer host into a channel bucket. */
export function normalizeSource(rawSource: string | null, referrer: string | null): string {
  if (rawSource) {
    const cleaned = rawSource.trim().toLowerCase().slice(0, 60);
    if (cleaned) {
      for (const [pattern, channel] of REFERRER_CHANNELS) {
        if (pattern.test(cleaned)) return channel;
      }
      return cleaned.replace(/[^a-z0-9._-]/g, "-");
    }
  }

  if (referrer) {
    for (const [pattern, channel] of REFERRER_CHANNELS) {
      if (pattern.test(referrer)) return channel;
    }
    try {
      const host = new URL(referrer).hostname.replace(/^www\./, "");
      if (host && host !== "abram.network") return host.toLowerCase();
    } catch {
      /* malformed referrer, fall through to direct */
    }
  }

  return "direct";
}

/**
 * Build the sign-up URL with attribution carried across to the app so the
 * product side can tie an account back to the campaign that produced it.
 */
export function buildSignupUrl(
  slug: CampaignSlug,
  params: { source?: string | null; medium?: string | null; campaign?: string | null } = {}
): string {
  const url = new URL(APP_SIGNUP_URL);
  url.searchParams.set("utm_source", params.source || "direct");
  url.searchParams.set("utm_medium", params.medium || "landing");
  url.searchParams.set("utm_campaign", params.campaign || slug);
  url.searchParams.set("ref", slug);
  return url.toString();
}
