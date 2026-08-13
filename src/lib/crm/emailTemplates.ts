/**
 * The words the conference capture emails are made of.
 *
 * One person leaves their details at a booth and a note arrives in their
 * inbox a minute later. The copy below is what that note says, and it is
 * the copy that sends when nobody has touched anything. An edit saved from
 * the console overrides it; a reset removes the override and this comes
 * back.
 *
 * Three rules run through the whole file:
 *
 * 1. **The built in copy is the floor.** Every failure, from a missing row
 *    to a template with an unclosed brace in it, lands back here. Somebody
 *    who just handed over a business card gets a note either way.
 * 2. **A placeholder never reaches a stranger.** An unknown name renders as
 *    nothing, and any brace that survives rendering means the template is
 *    treated as broken rather than sent.
 * 3. **An empty value takes its punctuation with it.** A blank job title
 *    leaves no orphan comma, no double line break and no empty line, which
 *    is what lets one template serve a card with every field filled in and
 *    a card with three.
 *
 * The syntax is deliberately small, because the person editing it is
 * writing an email rather than a program:
 *
 *   {{name}}              the value, or nothing at all
 *   {{#name}} ... {{/name}}   kept only when the value is there
 *   {{^name}} ... {{/name}}   kept only when the value is missing
 */

/* ------------------------------------------------------------------ */
/*  Variables                                                          */
/* ------------------------------------------------------------------ */

/** One thing a template may say, with the value the preview shows for it. */
export interface CrmEmailVariable {
  name: string;
  /** What it means, in the words the editor shows. */
  label: string;
  /** A realistic value, used by the preview and the test send. */
  sample: string;
}

/**
 * Everything a capture email may refer to.
 *
 * The contact half comes off the form they just filled in, the sender half
 * off the shared team record through resolveIdentity, so a photograph or a
 * job title changed once in the team screen reaches this email too.
 */
export const CRM_EMAIL_VARIABLES: CrmEmailVariable[] = [
  { name: "contact_first_name", label: "Their first name", sample: "Sam" },
  { name: "contact_name", label: "Their full name", sample: "Sam Whitlock" },
  { name: "contact_company", label: "Their company", sample: "Vesper Pictures" },
  { name: "contact_job_title", label: "Their job title", sample: "Line Producer" },
  { name: "event_name", label: "The event, when one is running", sample: "Onyx Screen Expo" },
  { name: "sender_first_name", label: "Your first name", sample: "Connor" },
  { name: "sender_name", label: "Your full name", sample: "Connor Thomas" },
  { name: "sender_job_title", label: "Your job title", sample: "Founder" },
  { name: "sender_city", label: "Your city", sample: "Washington, DC" },
  { name: "sender_email", label: "Your email address", sample: "connor@abram.network" },
  { name: "sender_phone", label: "Your phone number", sample: "+1 202 555 0142" },
  {
    name: "save_contact_link",
    label: "The link that saves you into their phone",
    sample: "https://abram.network/c/connor/vcf",
  },
  { name: "card_link", label: "The address of your card", sample: "https://abram.network/c/connor" },

  /* The list half. A newsletter signup has no event, no booth and nobody
     standing in front of them, so none of the contact variables above mean
     anything in that email. They stay in one catalogue all the same, because
     the renderer takes a flat bag of values and a second catalogue would be a
     second place to forget to add something. What each template may actually
     say is narrowed by `variables` on the spec. */
  { name: "subscriber_first_name", label: "Their first name", sample: "Sam" },
  { name: "subscriber_name", label: "Their full name", sample: "Sam Whitlock" },
  { name: "subscriber_email", label: "The address they signed up with", sample: "sam@vesperpictures.com" },
  {
    name: "unsubscribe_link",
    label: "The one-click way off the list",
    sample: "https://abram.network/api/newsletter/unsubscribe?token=sample",
  },
];

export const CRM_EMAIL_VARIABLE_NAMES = CRM_EMAIL_VARIABLES.map((v) => v.name);

/** The variables a conference email may refer to. The original set. */
export const CAPTURE_VARIABLE_NAMES = [
  "contact_first_name",
  "contact_name",
  "contact_company",
  "contact_job_title",
  "event_name",
  "sender_first_name",
  "sender_name",
  "sender_job_title",
  "sender_city",
  "sender_email",
  "sender_phone",
  "save_contact_link",
  "card_link",
];

/** The variables a list email may refer to. No event, no vCard, no phone. */
export const SUBSCRIBER_VARIABLE_NAMES = [
  "subscriber_first_name",
  "subscriber_name",
  "subscriber_email",
  "sender_first_name",
  "sender_name",
  "sender_job_title",
  "sender_city",
  "sender_email",
  "unsubscribe_link",
];

/** What the renderer is handed. Anything absent renders as nothing. */
export type CrmEmailValues = Partial<Record<string, string | null | undefined>>;

/**
 * Realistic values for the preview and the test send.
 *
 * Every name here is invented. A test that goes to your own inbox should be
 * unmistakably a test, and a preview with lorem ipsum in it teaches you
 * nothing about whether the line breaks land.
 */
export function sampleValues(withEvent = true): CrmEmailValues {
  const values: CrmEmailValues = {};
  for (const variable of CRM_EMAIL_VARIABLES) values[variable.name] = variable.sample;
  if (!withEvent) values.event_name = "";
  return values;
}

/* ------------------------------------------------------------------ */
/*  The templates                                                      */
/* ------------------------------------------------------------------ */

/** The three editable parts of one email. */
export interface CrmEmailContent {
  subject: string;
  bodyText: string;
  bodyHtml: string;
}

/** One email the system sends, with the copy it ships with. */
export interface CrmEmailTemplateSpec extends CrmEmailContent {
  /** Stable identifier. More emails will be added, so this is the join. */
  key: string;
  name: string;
  description: string;
  /**
   * Which variables this email may refer to, out of the shared catalogue.
   *
   * The editor offers exactly these and the guard below rejects a saved edit
   * that reaches for anything else. Without it every template would offer
   * every variable, and a welcome email quietly inviting somebody to write
   * `{{save_contact_link}}` renders an empty space in a stranger's inbox
   * rather than an error anybody sees.
   */
  variables: string[];
}

/**
 * The follow up.
 *
 * This is meant to read as though the person you just met typed it on
 * their phone on the way home. No attachment, no file format named, no
 * button, no bold, no marketing footer. Just a note with a link in it.
 * Anything that looks designed reads as automated, and an automated note
 * from somebody you shook hands with an hour ago is worse than no note at
 * all. Keep that in mind before adding anything to it.
 *
 * The sign off is the real signature: name, title, city, then the mark
 * with the address under it. All of it comes from the shared team record,
 * so it stays true wherever it is signed.
 */
const CAPTURE_FOLLOW_UP: CrmEmailTemplateSpec = {
  key: "capture_follow_up",
  name: "Follow up after a scan",
  description:
    "Sent to somebody who left their details on your card, once, a moment after they hand them over.",
  variables: CAPTURE_VARIABLE_NAMES,
  subject: "Great to meet you{{#event_name}} at {{event_name}}{{/event_name}}",
  /* The blank lines are deliberate. An earlier version filtered empty
     strings out of this array, which quietly collapsed the plain text part
     into one dense block while the HTML part stayed properly spaced. Most
     people never see this half, which is exactly why it goes wrong
     unnoticed. */
  bodyText: [
    "Hi {{contact_first_name}},",
    "",
    "Great to meet you{{#event_name}} at {{event_name}}{{/event_name}}{{^event_name}} today{{/event_name}}!",
    "",
    "I thought I would send my details over so you have them.",
    "",
    "If it is easier, this will save me straight into your phone: {{save_contact_link}}",
    "",
    /* No separate sign off line. The signature block below already opens
       with the name, and two of them one after the other reads as a
       mistake rather than as a note somebody typed. */
    "{{sender_name}}",
    "{{sender_job_title}}",
    "{{sender_city}}",
    "",
    "{{sender_email}}",
    "{{sender_phone}}",
    "abram.network",
  ].join("\n"),
  bodyHtml: [
    '<div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#18181b;max-width:480px">',
    '<p style="margin:0 0 14px">Hi {{contact_first_name}},</p>',
    '<p style="margin:0 0 14px">Great to meet you{{#event_name}} at {{event_name}}{{/event_name}}{{^event_name}} today{{/event_name}}!</p>',
    '<p style="margin:0 0 14px">I thought I would send my details over so you have them.</p>',
    '<p style="margin:0 0 22px">If it is easier, <a href="{{save_contact_link}}" style="color:#18181b">this will save me straight into your phone</a>.</p>',
    '<p style="margin:0 0 14px;color:#3f3f46">{{sender_name}}<br>{{sender_job_title}}<br>{{sender_city}}</p>',
    '<p style="margin:0 0 10px"><img src="https://abram.network/brand/lockup-black.png" alt="ABRAM" width="104" style="display:block;height:auto;border:0" /></p>',
    '<p style="margin:0;font-size:13px;color:#71717a">{{sender_email}}<br>{{sender_phone}}<br><a href="https://abram.network" style="color:#71717a">abram.network</a></p>',
    "</div>",
  ].join("\n"),
};

/**
 * The welcome.
 *
 * The first rung of the funnel, and for now the only automatic email the list
 * ever sends. Three rules shaped the copy and none of them are style
 * preferences:
 *
 * 1. **It sets the frequency expectation in the first two lines.** The single
 *    biggest cause of a spam complaint is an email somebody does not remember
 *    asking for. Telling them what they will get, and how rarely, is worth
 *    more to the sending domain than anything persuasive we could put here.
 * 2. **Every claim is one we can defend.** What ABRAM is comes from
 *    `abram-network/.agents/brain/BUSINESS.md:14`, and it is deliberately the
 *    plain description rather than the positioning line, which BUSINESS.md
 *    marks as not verified customer-facing. No metric, no customer count, no
 *    roadmap date. See `.agents/brand-voice.md` §1.
 * 3. **Both links go somewhere that exists today.** `/docs` and `/changelog`
 *    are real routes. A welcome email is the worst possible place for a 404,
 *    because it is the first thing a new subscriber ever clicks.
 *
 * No button, no hero image, no marketing footer. Same reasoning as the
 * follow up above: a plain note reads as though a person sent it, and this
 * one genuinely is sent on a person's behalf.
 */
const NEWSLETTER_WELCOME: CrmEmailTemplateSpec = {
  key: "newsletter_welcome",
  name: "Welcome to the list",
  description:
    "Sent once, a moment after somebody subscribes on the site. Sets the expectation of what arrives and how often.",
  variables: SUBSCRIBER_VARIABLE_NAMES,
  subject: "You're on the list",
  bodyText: [
    "Hi {{subscriber_first_name}},",
    "",
    "Thanks for signing up. Here is what you have actually signed up for: a note when we ship",
    "something worth reading about, and not much else. No weekly roundup, no drip of tips.",
    "",
    "ABRAM is a production management platform for film and media — the clients, production",
    "companies, creative teams and contractors on a job, in one place.",
    "",
    "If you would rather not wait for the next note:",
    "",
    "The user guide, which is the honest version of how it works: https://abram.network/docs",
    "What we have shipped recently: https://abram.network/changelog",
    "",
    "{{sender_name}}",
    "{{sender_job_title}}",
    "{{sender_city}}",
    "",
    "abram.network",
    "",
    "No longer want these? {{unsubscribe_link}}",
  ].join("\n"),
  bodyHtml: [
    '<div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#18181b;max-width:480px">',
    '<p style="margin:0 0 14px">Hi {{subscriber_first_name}},</p>',
    '<p style="margin:0 0 14px">Thanks for signing up. Here is what you have actually signed up for: a note when we ship something worth reading about, and not much else. No weekly roundup, no drip of tips.</p>',
    '<p style="margin:0 0 14px">ABRAM is a production management platform for film and media — the clients, production companies, creative teams and contractors on a job, in one place.</p>',
    '<p style="margin:0 0 8px">If you would rather not wait for the next note:</p>',
    '<p style="margin:0 0 22px"><a href="https://abram.network/docs" style="color:#18181b">The user guide</a>, which is the honest version of how it works.<br><a href="https://abram.network/changelog" style="color:#18181b">What we have shipped recently</a>.</p>',
    '<p style="margin:0 0 14px;color:#3f3f46">{{sender_name}}<br>{{sender_job_title}}<br>{{sender_city}}</p>',
    '<p style="margin:0 0 10px"><img src="https://abram.network/brand/lockup-black.png" alt="ABRAM" width="104" style="display:block;height:auto;border:0" /></p>',
    '<p style="margin:0;font-size:13px;color:#71717a"><a href="https://abram.network" style="color:#71717a">abram.network</a><br><a href="{{unsubscribe_link}}" style="color:#71717a">Unsubscribe</a></p>',
    "</div>",
  ].join("\n"),
};

export const CRM_EMAIL_TEMPLATES: CrmEmailTemplateSpec[] = [
  CAPTURE_FOLLOW_UP,
  NEWSLETTER_WELCOME,
];

/** The follow up sent when somebody leaves their details. */
export const CAPTURE_FOLLOW_UP_KEY = CAPTURE_FOLLOW_UP.key;

/** The note sent once when somebody subscribes on the site. */
export const NEWSLETTER_WELCOME_KEY = NEWSLETTER_WELCOME.key;

export function crmEmailTemplateSpec(key: string): CrmEmailTemplateSpec | null {
  return CRM_EMAIL_TEMPLATES.find((template) => template.key === key) ?? null;
}

/** The copy that ships, as a plain content object. */
export function defaultCrmEmailContent(key: string): CrmEmailContent | null {
  const spec = crmEmailTemplateSpec(key);
  if (!spec) return null;
  return { subject: spec.subject, bodyText: spec.bodyText, bodyHtml: spec.bodyHtml };
}

/* ------------------------------------------------------------------ */
/*  Rendering                                                          */
/* ------------------------------------------------------------------ */

/**
 * Where a value used to be.
 *
 * Substitution leaves this behind wherever it wrote nothing, so the tidy up
 * afterwards can tell "the job title is blank" from "there was never a job
 * title here". It is removed before anything leaves this file, and a
 * template that somehow contains one already is scrubbed on the way in.
 */
const GAP = "\u0000";

/** Only bare names substitute. A brace with a # or a / in it is structure. */
const VARIABLE = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

/** {{#name}} ... {{/name}} and its inverse. Non greedy so two in a row work. */
const SECTION = /\{\{\s*([#^])\s*([a-zA-Z0-9_]+)\s*\}\}([\s\S]*?)\{\{\s*\/\s*\2\s*\}\}/;

/**
 * A separator that belongs to the value beside it.
 *
 * A line break, a comma, a semicolon, a colon, a pipe, a middle dot, or
 * failing all of those a run of spaces. Each gap swallows exactly one, on
 * whichever side it finds one first, so "Name, City" with no city loses the
 * comma and "Name<br><br>City" with no job title loses one break rather
 * than both.
 *
 * The order of the alternatives is the whole design. Punctuation is tried
 * before whitespace on both sides, and the whitespace before a gap is only
 * taken when there is no punctuation waiting after it, so "Hi {{name}}," with
 * no name comes out as "Hi" rather than as "Hi,".
 */
const MARK = `(?:\\s*<br\\s*/?>\\s*|[ \\t]*[,;:|\u00b7][ \\t]*)`;
const ORPHAN = new RegExp(
  [
    `${MARK}${GAP}`,
    `${GAP}${MARK}`,
    `[ \\t]+${GAP}(?![ \\t]*[,;:|\u00b7])`,
    `${GAP}[ \\t]+`,
    GAP,
  ].join("|"),
  "gi",
);

function valueOf(values: CrmEmailValues, name: string): string {
  const raw = values[name];
  if (typeof raw !== "string") return "";
  return raw.split(GAP).join("").trim();
}

/**
 * A name typed into a form at a booth ends up inside an HTML document, so
 * it is escaped on the way in. The template itself is never touched, only
 * the values dropped into it.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Resolves the conditional blocks, outermost first, with a sane ceiling. */
function resolveSections(source: string, values: CrmEmailValues): string {
  let out = source;
  for (let pass = 0; pass < 100; pass++) {
    const match = SECTION.exec(out);
    if (!match) break;
    const [whole, kind, name, inner] = match;
    const present = valueOf(values, name).length > 0;
    const keep = kind === "#" ? present : !present;
    /* Spliced by index rather than replaced by string, so a dollar sign in
       the copy is a dollar sign. */
    out = out.slice(0, match.index) + (keep ? inner : "") + out.slice(match.index + whole.length);
  }
  return out;
}

/**
 * One template part, rendered.
 *
 * Substitution, then the tidy up, in that order. The tidy up is the part
 * worth reading: it removes the punctuation an empty value left behind, it
 * drops a line that existed only to hold a value, and in HTML it removes a
 * paragraph and a link that ended up with nothing in them.
 */
export function renderCrmEmailPart(
  source: string,
  values: CrmEmailValues,
  format: "text" | "html" = "text",
): string {
  const clean = String(source ?? "").split(GAP).join("");
  const filled = resolveSections(clean, values).replace(VARIABLE, (_match, name: string) => {
    const value = valueOf(values, name);
    if (!value) return GAP;
    return format === "html" ? escapeHtml(value) : value;
  });

  /* Each gap takes one neighbouring separator with it and leaves a marker
     so the line pass below can still see where it stood. */
  let out = filled.replace(ORPHAN, GAP);

  out = out
    .split("\n")
    .filter((line) => {
      /* A line that held nothing but values, and got none, is not a blank
         line the writer asked for. It goes. */
      if (!line.includes(GAP)) return true;
      return line.split(GAP).join("").trim().length > 0;
    })
    .map((line) => line.split(GAP).join("").replace(/[ \t]+$/, ""))
    .join("\n");

  if (format === "html") {
    /* A paragraph or a link with nothing left inside it is a gap in the
       page rather than a piece of the note. */
    out = out.replace(/<p\b[^>]*>\s*<\/p>/gi, "");
    out = out.replace(/<a\b[^>]*href=["']\s*["'][^>]*>([\s\S]*?)<\/a>/gi, "$1");
    out = out.replace(/\n{2,}/g, "\n");
    return out.trim();
  }

  return out.replace(/\n{3,}/g, "\n\n").trim();
}

/** The three parts of an email, rendered and ready to hand to the sender. */
export interface RenderedCrmEmail {
  subject: string;
  text: string;
  html: string;
}

export function renderCrmEmail(content: CrmEmailContent, values: CrmEmailValues): RenderedCrmEmail {
  return {
    subject: renderCrmEmailPart(content.subject, values, "text").split("\n").join(" ").trim(),
    text: renderCrmEmailPart(content.bodyText, values, "text"),
    html: renderCrmEmailPart(content.bodyHtml, values, "html"),
  };
}

/* ------------------------------------------------------------------ */
/*  Is it safe to send                                                 */
/* ------------------------------------------------------------------ */

/**
 * Why a template was refused, in the words the console shows.
 *
 * Returns null when the template is fine. Anything else is a reason to fall
 * back to the built in copy, and the caller sends either way.
 */
/** Every name the copy reaches for, whether as a value or as a block. */
const ANY_TAG = /\{\{\s*[#^/]?\s*([a-zA-Z0-9_]+)\s*\}\}/g;

/**
 * Which variables a piece of copy actually refers to.
 *
 * Read off the raw template rather than the rendered output, because the
 * whole point is to catch a name that renders as nothing.
 */
export function referencedVariables(content: CrmEmailContent): string[] {
  const found = new Set<string>();
  for (const part of [content.subject, content.bodyText, content.bodyHtml]) {
    if (typeof part !== "string") continue;
    for (const match of part.matchAll(ANY_TAG)) found.add(match[1]);
  }
  return [...found];
}

/**
 * What is wrong with this copy, in the words the editor shows, or null.
 *
 * `allowed` narrows the check to one template's variables. It is optional
 * because the renderer does not care, but every caller that knows which
 * template it is holding should pass it: a variable outside the list is the
 * one class of mistake that survives every other guard here. It has matched
 * braces, it renders without error, and it leaves a silent hole in a
 * stranger's inbox.
 */
export function crmEmailProblem(
  content: CrmEmailContent | null | undefined,
  allowed?: string[],
): string | null {
  if (!content) return "There is no saved wording for this email.";

  const parts: [string, unknown][] = [
    ["subject", content.subject],
    ["plain text", content.bodyText],
    ["HTML", content.bodyHtml],
  ];
  for (const [label, value] of parts) {
    if (typeof value !== "string") return `The ${label} is missing.`;
  }

  if (!content.subject.trim()) return "The subject line is empty.";
  if (!content.bodyText.trim() && !content.bodyHtml.trim()) return "The email has no body.";

  if (allowed) {
    const unknown = referencedVariables(content).filter((name) => !allowed.includes(name));
    if (unknown.length) {
      const named = unknown.map((name) => `{{${name}}}`).join(", ");
      return unknown.length === 1
        ? `${named} is not something this email knows about, so it would arrive as a blank space. Use one of the variables listed beside the editor.`
        : `${named} are not things this email knows about, so they would arrive as blank spaces. Use the variables listed beside the editor.`;
    }
  }

  /* Rendered against a full set of values and against an empty one, because
     a template can be well formed with an event running and broken without
     one. Anything that leaves a brace behind is an unclosed block or a
     misspelt tag, and either would print into somebody's inbox. */
  const probes: CrmEmailValues[] = [sampleValues(true), sampleValues(false), {}];
  for (const values of probes) {
    const rendered = renderCrmEmail(content, values);
    for (const [label, value] of [
      ["subject line", rendered.subject],
      ["plain text", rendered.text],
      ["HTML", rendered.html],
    ] as const) {
      if (value.includes("{{") || value.includes("}}")) {
        return `The ${label} has an unfinished {{ }} tag in it. Check that every {{#name}} has a matching {{/name}}.`;
      }
    }
    if (!rendered.subject) return "The subject line comes out empty for some contacts.";
    if (!rendered.text && !rendered.html) return "The email comes out empty for some contacts.";
  }

  return null;
}

/** True when this template can be sent as written. */
export function isCrmEmailUsable(content: CrmEmailContent | null | undefined): boolean {
  return crmEmailProblem(content) === null;
}
