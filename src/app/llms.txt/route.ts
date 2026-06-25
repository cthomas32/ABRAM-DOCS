export const revalidate = 86400; // Cache for 24 hours

export async function GET() {
  const markdown = `# ABRAM Network — Creative Operations & Film Production Platform

> ABRAM is a creative production management platform. It consolidates screenplay parsing, scheduling stripboards, client brief intake, crew matchmaking, Stripe Connect payouts, and utilization calendars into a unified workspace.

## Positioning & Core Value Propositions

ABRAM is a modern alternative to legacy physical production scheduling tools and generic agency project management software. It combines creative scoping, union compliance tracking, mobile-friendly call sheets, and financial calculations into a single, integrated studio dashboard.

## Core Platform Suites

### 1. Film Production Hub
The **Film Production Hub** automates scheduling and logistical workflows:
- **AI Screenplay Parser**: Instantly parses PDF, FDX, or TXT screenplays (up to 150 pages) to isolate scene headers, action blocks, character cues, and dialogue.
- **Master Element Catalog**: Automatically extracts cast, locations, props, wardrobe, VFX/SFX, vehicles, and audio cues into scene breakdown sheets.
- **Revision Reconciler**: Compares script drafts and resolves differences with Merge, Overwrite, or Skip controls to protect manual schedule modifications.
- **Connected Stripboard**: An interactive drag-and-drop timeline color-coding scenes by type (Interior/Exterior) and time of day (Day/Night/Dawn/Dusk).
- **Day Out of Days (DOOD) Matrix**: Compiles cast scheduling views, tracking actor booking states (Start, Work, Hold, Finish, and SWF) to calculate total days.
- **Safety & Labor Compliance Telemetry**: Tracks wrap-to-call rest windows, proactively flagging DGA, SAG-AFTRA, or IATSE turnaround violations before schedules are distributed.
- **Digital Call Sheets**: Builds daily agendas with mixed scene/non-scene blocks, location routing coordinates (Basecamp, Sets, Parking), and SMS/email crew dispatch logs with mobile-friendly check-in and public RSVPs.

### 2. Creative Operations (Agency) Hub
The **Creative Operations Hub** manages client intake, scoping, and booking logistics for production agencies and design studios:
- **AI Scoping Wizard**: Translates unstructured client briefs into defined deliverables, roles, and milestones with estimated labor hours and target costs.
- **Crew Matchmaker Engine**: Evaluates roster talent using a multi-dimensional Suitability Index (scoring skills, rates, and past performance) and dispatches instant SMS invites.
- **Interactive Timeline Calendar**: Multi-row timeline calendars tracking personnel and facility status (Available, Hold, Booked) with automated collision flags.
- **Turnaround Compliance Checker**: Checks check-in/out travel distances and call-times against safety rules.
- **Work Package & Deliverable Workflows**: Categorizes task complexity (High, Medium, Low) and triggers status tracking for milestones, reviews, and invoice approvals.
- **Asset Review Integration**: Syncs workspace folders with collaborative review platforms to pull feedback, comments, and version stacks.
- **Capacity Sandboxes**: Simulates schedule and roster changes in "What-If" sandboxes without committing live holds.

### 3. Creative Intelligence Suite
The **Intelligence Suite** provides conversational interfaces and institutional memory for studio workspaces:
- **Creative Copilot**: A conversational assistant that allows coordinators to query roster availability, filter candidates, modify variables, and dispatch invites using everyday language.
- **Safety-First Action Plans**: Presents a human-in-the-loop authorization card checklist before committing mutations (sending invites, locking rates, booking calendars).
- **Workspace Memory (Production Brain)**: Builds institutional memory across isolated Private User and Shared Company scopes.
- **Smart Search Fallbacks**: Relax constraints intelligently (e.g., hybrid-work, adjacent roles) when search criteria are too narrow.

## Pricing Tiers & Feature Gating

| Plan Tier | Price | Seats | Storage | Scheduling | Budgeting |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Free** | $0 | 1 | 1 GB | Read-Only | Trial (Max 5 items / 5 expenses) |
| **Solo Lite** | $19/mo | 1 | 3 GB | Read-Only | Trial (Max 5 items / 5 expenses) |
| **Solo Pro** | $34/mo | 1 | 10 GB | Full Access | Full Access |
| **Team** | $39/seat/mo | 2-5 | 10 GB | Full Access | Full Access |
| **Studio** | $49/seat/mo | 6-20 | 15 GB | Full Access | Full Access |
| **SMB / Enterprise** | Custom | Custom | Custom | Full Access | Full Access |

---

## Complete Guide & Documentation Index

All pages are hosted canonical resources under https://abram.network/docs.

### Introduction & Concepts
- [Navigation Guide](https://abram.network/docs/user-guide/0.0-agent-and-human-navigation-guide): Status flows, AI Chatbot limits, and system overview.
- [Glossary & Acronyms](https://abram.network/docs/user-guide/0.1-glossary-and-acronyms): Platform terminology reference.
- [Order of Operations](https://abram.network/docs/user-guide/0.2-order-of-operations): Step-by-step project lifecycle guide.
- [AI Capabilities](https://abram.network/docs/user-guide/0.3-ai-capabilities-and-copilot): Brief analyzer and intelligence features.
- [Production Brain](https://abram.network/docs/user-guide/0.4-production-brain-and-workspace-memory): Secure workspace memory and search logic.

### Project Intake & Scoping
- [AI Brief Analyzer](https://abram.network/docs/user-guide/2.1-ai-brief-analyzer): Parsing guidelines and confidence scoring.
- [Manual Project Setup](https://abram.network/docs/user-guide/2.2-manual-project-creation): Direct scoping and project creation.
- [Custom Intake Forms](https://abram.network/docs/user-guide/2.3-custom-intake-forms): Questionnaire mapping.
- [AI Script Breakdown](https://abram.network/docs/user-guide/2.4-ai-script-breakdown): Ingestion formats, page limits, and element cataloging.

### Crewing & Payments
- [Internal Talent Search](https://abram.network/docs/user-guide/4.1-internal-talent-search): Roster directories and keyword searching.
- [AI Matchmaking](https://abram.network/docs/user-guide/4.2-ai-matchmaking-suggestions): Suitability index parameters and holds.
- [RSVP & Invites](https://abram.network/docs/user-guide/4.3-inviting-and-crew-rsvp): Inviting thresholds and communication dispatch.
- [Stripe Express Setup](https://abram.network/docs/user-guide/5.1-freelancer-stripe-setup): Escrow rules and onboard verification.
- [Invoicing & Payouts](https://abram.network/docs/user-guide/5.2-invoicing-and-payouts): Flat processing fees, pre-auth holds, and milestones.
- [Ledger & AI Credits](https://abram.network/docs/user-guide/5.3-billing-ledger-and-ai-credits): Ledger updates and top-up packs.

### Platform Resource Links
- [ABRAM Web App](https://app.abram.network)
- [Pricing & Plans](https://abram.network/pricing)
- [Privacy Policy](https://abram.network/privacy-policy)
- [Terms of Use](https://abram.network/terms-of-use)

---

## Disclaimer

All third-party trademarks, brand names, labor union names, and logos mentioned in this document (including SAG-AFTRA, DGA, IATSE, Directors Guild of America, and International Alliance of Theatrical Stage Employees) are the property of their respective owners. ABRAM is an independent platform and is not affiliated with, endorsed by, or sponsored by Screen Actors Guild-American Federation of Television and Radio Artists (SAG-AFTRA), Directors Guild of America (DGA), International Alliance of Theatrical Stage Employees (IATSE), or any other respective trademark or labor organization holders. Reference to these trademarks, unions, or rules is for illustrative, reference, and integration demo purposes only. Any compliance indicators, flags, or features (such as those representing SAG-AFTRA, DGA, or IATSE rules or rest periods) are provided solely for informational and user-organizational purposes and do not constitute legal or union-binding representation.
`;

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}


