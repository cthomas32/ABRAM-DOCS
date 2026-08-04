import type { SocialImageSpec } from "./spec";

/**
 * Starting points for a card, and the reason this file exists at all.
 *
 * Every preset names what the reader walks away with, and lets the product
 * be the reason that is possible. "Call sheets out before you leave set"
 * is the shape to copy: it is an outcome somebody wants, and it leaves
 * them curious about how.
 *
 * Four rules these have to keep, taken from `.agents/brand-voice.md`:
 *
 *   1. Every claim traces to something that shipped or a number that was
 *      measured. No customer counts, no testimonials, no invented metrics.
 *      That is why no preset carries a figure: a stat card is worth making,
 *      and the number has to come from you.
 *   2. Write the outcome, in the words a reader would use for it.
 *   3. Leave them wanting the rest of it. A card that explains everything
 *      has nowhere left to send anyone.
 *   4. NEVER define something by what it is not. No "not X, it's Y", no
 *      "X rather than Y", no "one place, one decision". Say the thing
 *      once, straight, and stop. This is the single easiest way to make a
 *      card read as written by a machine, and it is banned outright.
 *
 * And one rule about a field rather than a sentence: **no eyebrows.**
 * Twenty-five of the presets here opened with a letterspaced label, and
 * on all but four of them it was a category name over a headline that
 * already said the thing. FOR PRODUCERS over "Get your evenings back" is
 * a word the reader steps over on the way to the sentence, and a card
 * that opens with one reads as a slide out of a deck. The four still here
 * carry information the card cannot get any other way: a version badge on
 * an announcement, and the position markers on a carousel that tell you
 * where in the sequence you are. If a preset needs a new one, it has to
 * clear that bar.
 */

export interface SocialPreset {
  id: string;
  label: string;
  /** What this card is doing, shown under the preset name in the studio */
  intent: string;
  spec: Partial<SocialImageSpec>;
}

export const SOCIAL_PRESETS: SocialPreset[] = [
  {
    id: "poster-question",
    label: "A question, quietly",
    intent:
      "The simplest card here. A small mark, one question, and weather behind it. Nothing to skip past, which is why it stops a scroll.",
    spec: {
      template: "poster",
      backdrop: "dusk",
      grain: true,
      brand: "mark",
      showRule: false,
      headline: "Whose evening does tomorrow's call sheet come out of?",
      body: "",
      footnote: "",
      cta: "",
    },
  },
  {
    id: "poster-line",
    label: "One line, nothing else",
    intent: "For a sentence that can carry a whole card on its own. No sub-line, no footer, no mockup.",
    spec: {
      template: "poster",
      backdrop: "deep",
      grain: true,
      brand: "mark",
      showRule: false,
      headline: "Nobody became a producer to write call sheets.",
      body: "",
      footnote: "abram.network",
      cta: "",
    },
  },
  {
    id: "poster-endcard",
    label: "The quiet end card",
    intent: "Last slide of a carousel, or a story on its own. Says the name and stops.",
    spec: {
      template: "poster",
      backdrop: "ember",
      grain: true,
      brand: "lockup",
      showRule: false,
      headline: "Run the whole production from one place.",
      body: "Free plan. No card.",
      footnote: "abram.network",
      cta: "",
    },
  },
  {
    id: "hook-opening",
    label: "The opening line",
    intent: "Slide one of a carousel, or a story. One line, nothing under it.",
    spec: {
      template: "hook",
      theme: "midnight",
      headline: "It is nine, and tomorrow's sheet is still not written.",
      footnote: "Free plan. No card.",
    },
  },
  {
    id: "compare-week",
    label: "The same week, two ways",
    intent:
      "The two-column card. The left side has to describe a real week, or the whole thing reads as an advert.",
    spec: {
      template: "compare",
      theme: "steel",
      headline: "The same week, run two ways",
      labelA: "How it goes now",
      items: [
        "The schedule is in one file and the call sheet in another",
        "You hear about someone's hours when the timesheet arrives",
        "Notes come back as four replies and a voice note",
        "Nobody is certain which version of the sheet is current",
      ],
      labelB: "With ABRAM",
      itemsB: [
        "The sheet is built from the schedule, so they cannot disagree",
        "Hours show while there is still a day to move things around",
        "Clients approve in one place, and the decision has a time on it",
        "There is one current version and everybody has it",
      ],
    },
  },
  {
    id: "steps-callsheet",
    label: "How it actually works",
    intent: "A sequence, for when people suspect the setup costs more than it saves.",
    spec: {
      template: "steps",
      theme: "midnight",
      headline: "Four steps, and three of them you were doing anyway",
      items: [
        "Build the schedule once. Scenes, days, and who is needed for each.",
        "Move things until the day works. The times after it follow on their own.",
        "Open tomorrow. The sheet is already written.",
        "Send it. Each department gets the part that concerns them.",
      ],
      footnote: "Free plan. No card.",
    },
  },
  {
    id: "term-turnaround",
    label: "A word, defined",
    intent: "Useful before it is an advert, which is why people save it. Rotate the term, keep the shape.",
    spec: {
      template: "term",
      theme: "cream",
      headline: "Turnaround",
      body:
        "The rest between someone wrapping and their next call. Shorten it by accident and tomorrow's call time is wrong before anyone has written it down.",
      footnote: "abram.network",
    },
  },
  {
    id: "showcase-board",
    label: "Just the screen",
    intent: "For a screen that makes the case on its own. One line over it, and let them look.",
    spec: {
      template: "showcase",
      mockup: "board",
      theme: "midnight",
      headline: "Every job you have running, on one board",
      footnote: "Free plan. No card.",
    },
  },
  {
    id: "product-document",
    label: "What the crew opens",
    intent:
      "Shows the paperwork stopping being their problem. Good for readers who have no interest in being shown software.",
    spec: {
      template: "product",
      mockup: "document",
      theme: "steel",
      headline: "This is what your crew actually opens",
      body: "Built from the schedule you already made, and out the door before you have left set.",
      footnote: "Nothing for them to install.",
    },
  },
  {
    id: "grid-leaks",
    label: "Four, side by side",
    intent: "For four things of equal weight, where a list would imply a ranking you did not mean.",
    spec: {
      template: "grid",
      theme: "ember",
      headline: "Four places a production quietly leaks time",
      items: [
        "A schedule only one person can edit",
        "A gear list living in a group chat",
        "Hours nobody counts until payroll",
        "Notes spread across four inboxes",
      ],
      footnote: "All four land in one place.",
    },
  },
  {
    id: "product-callsheet",
    label: "Call sheet, done",
    intent: "Shows the screen and names the evening it gives back.",
    spec: {
      template: "product",
      mockup: "callsheet",
      theme: "midnight",
      headline: "Leave set without the call sheet still to do",
      body:
        "Tomorrow's sheet builds from the schedule you already made.",
      footnote: "Free plan. No card.",
    },
  },
  {
    id: "product-capacity",
    label: "Say yes with proof",
    intent: "For the moment someone is deciding whether to take a job on.",
    spec: {
      template: "product",
      mockup: "capacity",
      theme: "steel",
      headline: "Know who is free before you promise a date",
      body:
        "Booked hours per person, a week ahead, so you can answer with a number.",
      footnote: "Free plan. No card.",
    },
  },
  {
    id: "product-portal",
    label: "Feedback in one place",
    intent: "Aimed at the hunt through the inbox, which is what people actually complain about.",
    spec: {
      template: "product",
      mockup: "portal",
      theme: "midnight",
      headline: "Know which round of notes is the current one",
      body:
        "Clients review and sign off in one place, and every decision arrives with a name and a time on it.",
      footnote: "Know where you stand.",
    },
  },
  {
    id: "product-aiupdate",
    label: "It read the job already",
    intent:
      "The strongest assistant card, because nobody had to ask. Use this before the chat one, which people have seen a thousand times.",
    spec: {
      template: "product",
      mockup: "aiupdate",
      theme: "laser",
      headline: "You did not have to ask it anything",
      body:
        "It reads the schedule, the hours and the ledger on its own, then tells you what happened, what it cost and what is still open.",
      footnote: "80 trial credits on the free plan.",
    },
  },
  {
    id: "product-brain",
    label: "It learns how you run",
    intent:
      "The card nobody else can make, because it needs a product that has been watching. Every line on the screen carries what it was inferred from.",
    spec: {
      template: "product",
      mockup: "brain",
      theme: "midnight",
      headline: "It works out how you run, from what already happened",
      body:
        "Who you book, how you plan, what never gets cancelled. Worked out from what happened, with the evidence attached to every line.",
      footnote: "Nothing here was typed in.",
    },
  },
  {
    id: "product-skills",
    label: "A CV that checks out",
    intent:
      "Aimed at crew. The hook is that every hour on it came off a finished job, so the record holds up when somebody checks it.",
    spec: {
      template: "product",
      mockup: "skills",
      theme: "steel",
      headline: "A record of what you have actually done",
      body:
        "Hours logged, deliverables approved, roles you were crewed into. Every line traces to a job, and it stays private to you.",
      footnote: "Free plan. No card.",
    },
  },
  {
    id: "product-chat",
    label: "Ask, then send",
    intent: "Sells what comes back, so the reader pictures the finished thing. Pairs with the briefing card.",
    spec: {
      template: "product",
      mockup: "chat",
      theme: "laser",
      headline: "Ask for it, and get it back ready to send",
      body:
        "It sits inside the production, so every answer already knows your schedule, your crew and your gear.",
      footnote: "80 trial credits on the free plan.",
    },
  },
  {
    id: "statement-outcome",
    label: "One promise",
    intent: "The plainest card. One claim across two lines, and nothing under it.",
    spec: {
      template: "statement",
      theme: "midnight",
      headline: "Get your evenings back",
      headlineAccent: "from the week's paperwork.",
      footnote: "Free plan. No card.",
    },
  },
  {
    id: "checklist-included",
    label: "What you actually get",
    intent: "Honest scope. Useful when the reply you keep getting is what is free.",
    spec: {
      template: "checklist",
      theme: "steel",
      headline: "The free plan, and exactly what is in it",
      items: [
        "One seat and one active project",
        "500 MB of storage and one workspace location",
        "80 trial credits for the assistant",
        "No card, and no expiry date",
      ],
    },
  },
  {
    id: "quote-line",
    label: "A line worth pulling",
    intent: "For a sentence from a post or a doc. Never for invented praise.",
    spec: {
      template: "quote",
      theme: "cream",
      // A real sentence, off a real page, at an address that resolves. The
      // line that used to be here was written for the card and attributed
      // to a page that did not contain it, at a URL that permanently
      // redirects. That is the exact failure this template's blurb warns
      // about, and it is harder to spot than invented praise because it
      // reads like a citation.
      headline: "A Production Brain that remembers crews, rates and estimates across every campaign.",
      attribution: "From the ABRAM intelligence pages",
      footnote: "abram.network/intelligence/brain",
    },
  },
  {
    id: "announce-release",
    label: "Something shipped",
    intent: "Release notes. The badge carries the version, the body carries the benefit.",
    spec: {
      template: "announce",
      theme: "ember",
      eyebrow: "New",
      headline: "Reschedule a day and every call time follows",
      body:
        "Move a scene and the times downstream move with it, so the version your crew is holding is the version that is true.",
      footnote: "Read the release notes",
    },
  },
];

/**
 * Carousels, as ordered slide copy.
 *
 * The shape that works: slide one earns the swipe, the middle slides do
 * one idea each, and the last one asks for something. Slides inherit the
 * set's theme and format, so a recipe only carries what changes.
 */
export interface CarouselPreset {
  id: string;
  label: string;
  intent: string;
  theme: SocialImageSpec["theme"];
  slides: Partial<SocialImageSpec>[];
}

export const CAROUSEL_PRESETS: CarouselPreset[] = [
  {
    id: "hook-and-answer",
    label: "Hook, then answer",
    intent: "Opens on a line worth stopping for. The shape that holds a swipe past slide two.",
    theme: "midnight",
    slides: [
      {
        template: "hook",
        headline: "Every shoot day ends with the same hour of typing.",
      },
      {
        template: "compare",
        headline: "But someone has to, every night",
        labelA: "How it goes now",
        items: [
          "The schedule is in one file and the sheet in another",
          "Times get retyped, and one of them is wrong",
          "It happens after everyone else has gone home",
        ],
        labelB: "With ABRAM",
        itemsB: [
          "The sheet is built from the schedule you already made",
          "Move a scene and the times after it follow",
          "It is written by the time you go looking for it",
        ],
        brand: "mark",
      },
      {
        template: "showcase",
        mockup: "callsheet",
        eyebrow: "Day 12",
        headline: "This is the whole job now",
        brand: "mark",
      },
      {
        template: "product",
        mockup: "document",
        headline: "And this is what your crew gets",
        body: "Call, location, scenes and weather, in the sheet they open at six in the morning.",
        brand: "mark",
      },
      {
        template: "statement",
        headline: "One seat, one project,",
        headlineAccent: "no card, no expiry.",
        footnote: "abram.network",
      },
    ],
  },
  {
    id: "assistant-range",
    label: "What the assistant actually does",
    intent:
      "Five screens, five different jobs. The point of the set is the range: most readers assume AI in a production tool means a chat box and nothing else.",
    theme: "laser",
    slides: [
      {
        template: "hook",
        headline: "Most of it happens before you ask for anything.",
      },
      {
        template: "product",
        mockup: "aiupdate",
        headline: "It writes the update",
        body: "Reads the schedule, the hours and the ledger, then tells you what happened and what is still unresolved.",
        brand: "mark",
      },
      {
        template: "product",
        mockup: "suggestions",
        headline: "It tells you what to do next",
        body: "Each one shows the thing it noticed, so you can argue with it before you act on it.",
        brand: "mark",
      },
      {
        template: "product",
        mockup: "aisort",
        headline: "It does the afternoon jobs",
        body: "Reorders a shooting day around locations and turnaround, and shows its working before you apply it.",
        brand: "mark",
      },
      {
        template: "product",
        mockup: "brain",
        headline: "It learns how you run",
        body: "Who you book, how you plan, what never gets cancelled. Every line says what it was inferred from.",
        brand: "mark",
      },
      {
        template: "product",
        mockup: "chat",
        headline: "And it answers when you do ask",
        body: "It checks the schedule before it writes, and shows you that it did.",
        brand: "mark",
      },
      {
        template: "statement",
        headline: "80 trial credits,",
        headlineAccent: "and no card.",
        footnote: "abram.network",
      },
    ],
  },
  {
    id: "how-it-works",
    label: "How it works",
    intent: "For the reply that it sounds like more setup than it saves. Steps, then the screen doing it.",
    theme: "steel",
    slides: [
      {
        template: "hook",
        headline: "An afternoon in, and then it does the evenings.",
      },
      {
        template: "steps",
        headline: "What the afternoon looks like",
        items: [
          "Put the schedule in once. Scenes, days, who is needed.",
          "Add the crew and their rates. Once, not per job.",
          "Everything after that reads from those two things.",
        ],
        brand: "mark",
      },
      {
        template: "showcase",
        mockup: "schedule",
        eyebrow: "Then",
        headline: "Move one scene",
        brand: "mark",
      },
      {
        template: "showcase",
        mockup: "callsheet",
        eyebrow: "And",
        headline: "Tomorrow already knows",
        brand: "mark",
      },
      {
        template: "statement",
        headline: "Free to start.",
        headlineAccent: "No card.",
        footnote: "abram.network",
      },
    ],
  },
  {
    id: "day-in-the-life",
    label: "One production day",
    intent: "Walks through a day and shows the app doing each part of it.",
    theme: "midnight",
    slides: [
      {
        template: "statement",
        headline: "Four things go wrong on a shoot day.",
        headlineAccent: "Here is where each one lands.",
      },
      {
        template: "product",
        mockup: "schedule",
        headline: "07:12. A location falls through",
        body: "Move the scene. Every call time after it moves too, and nobody is working from yesterday's version.",
      },
      {
        template: "product",
        mockup: "capacity",
        headline: "11:40. Someone is close to their hours",
        body: "You see it before it becomes an overtime conversation, while there is still a day left to move things around.",
      },
      {
        template: "product",
        mockup: "budget",
        headline: "15:20. A day runs long",
        body: "The margin updates as it happens, so the call about whether to push is made with the number in front of you.",
      },
      {
        template: "product",
        mockup: "callsheet",
        headline: "18:45. Tomorrow's sheet",
        body: "Built from the schedule you have been editing all day. Read it, send it, go home.",
      },
      {
        template: "statement",
        headline: "One seat, one project,",
        headlineAccent: "no card, no expiry.",
        footnote: "abram.network",
      },
    ],
  },
  {
    id: "what-you-get",
    label: "What you get out of it",
    intent: "Benefit per slide. The safest carousel to reuse for any audience.",
    theme: "steel",
    slides: [
      {
        template: "statement",
        headline: "The parts of the week",
        headlineAccent: "that were never really the work.",
      },
      {
        template: "product",
        mockup: "callsheet",
        headline: "The call sheet writes itself",
        body: "From the schedule you already made, with the contacts and times already in it.",
      },
      {
        template: "product",
        mockup: "portal",
        headline: "Notes stop living in your inbox",
        body: "Clients approve in one place, and you get a decision with a timestamp on it.",
      },
      {
        template: "product",
        mockup: "inventory",
        headline: "Gear stops being a group chat",
        body: "What is out, what is back, and what two people have booked for the same Tuesday.",
      },
      {
        template: "statement",
        headline: "Free to start.",
        headlineAccent: "No card.",
        footnote: "abram.network",
      },
    ],
  },
  {
    id: "objection",
    label: "Free plan, and after that",
    intent: "Sets out what the product covers, plainly, before anyone has to ask.",
    theme: "cream",
    slides: [
      {
        template: "statement",
        headline: "What you get,",
        headlineAccent: "and what comes after that.",
      },
      {
        template: "checklist",
        headline: "Start today, no card",
        items: [
          "One seat, one active project",
          "500 MB of storage",
          "One workspace location",
          "80 trial credits for the assistant",
        ],
      },
      {
        template: "checklist",
        headline: "And as the work grows",
        items: [
          "Call sheets exported and sent for you",
          "Capacity planning and crew search",
          "Client portals with sign off",
          "Script breakdowns done for you",
        ],
      },
      {
        template: "statement",
        headline: "Start on the free plan,",
        headlineAccent: "and stay there as long as you like.",
        footnote: "abram.network",
      },
    ],
  },
];
