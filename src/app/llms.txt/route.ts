export const revalidate = 86400; // Cache for 24 hours

export async function GET() {
  const markdown = `# ABRAM Network Platform Specs & Guide Index

> ABRAM is an AI-powered creative production management platform. It coordinates Brief Intelligence, screenplay parsing, crew scheduling, Stripe Express payouts, and utilization calendars in a single studio workspace.

## Core Module Specifications & Limits

### 1. The Three-Pool Credit System
- **Deduction Order**: Monthly Allowance -> Trial Credits -> Purchased Balance.
- **Top-up Packs**: Basic (150 for $10), Pro (500 for $25), Max (1200 for $50).
- **Onboarding Bonus**: 250 welcome credits.
- **Cache Optimization**: Cache reads cost ~10% of standard; writes cost ~125% input rate. Saved role estimates cost 0 credits.

### 2. AI Screenplay Parser Bounds
- **Supported Formats**: PDF, FDX, TXT (Max 150 pages, 20MB limit).
- **Cost**: 2 credits per page processed.
- **Caching**: SHA-256 hash match within 24 hours costs 0 credits.
- **Scene Size**: 4,000-token extraction window; overflows process in 3,000-token blocks ("High Density").
- **Timeout**: 45s hard processing limit (triggers db rollback).

### 3. Stripe Connect Payouts & Fees
- **Platform Processing Fee**: Flat 5% on subtotal.
- **Pre-Auth Hold**: 7-day authorization hold placed on client cards upon milestone approval.
- **Onboarding Escrow**: Client payments are held securely if the freelancer's Stripe Express setup is incomplete, releasing immediately upon verification.

### 4. Utilization Calendar States
- **Work Orders**: Draft (Tentative Block) -> Scheduled (Confirmed) -> In Progress (Active) -> Cancelled (Cleared).
- **External Calendars**: Google/Outlook sync maps external events as busy blockouts.
- **Sandbox Modes**: Simulated (non-blocking) -> Applied (converted to active project holds).

## Pricing Tiers & Feature Gating Matrix

| Plan Tier | Price | Seats | Storage | Monthly Credits | Scheduling | Budgeting |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Free** | $0 | 1 | 1 GB | 250 (One-Time) | Read-Only | Trial (Max 5 items / 5 expenses) |
| **Solo Lite** | $19/mo | 1 | 3 GB | 300 / mo | Read-Only | Trial (Max 5 items / 5 expenses) |
| **Solo Pro** | $34/mo | 1 | 10 GB | 600 / mo | Full Access | Full Access |
| **Team** | $39/seat/mo | 2-5 | 10 GB | 500 / seat / mo | Full Access | Full Access |
| **Studio** | $49/seat/mo | 6-20 | 15 GB | 1000 / seat / mo | Full Access | Full Access |
| **Enterprise** | Custom | Custom | Custom | Custom | Full Access | Full Access |

---

## Documentation Guides & References

### Introduction & Concepts
- [Navigation Guide](https://docs.abram.network/docs/user-guide/0.0-agent-and-human-navigation-guide): Status flows, AI Chatbot limits.
- [Glossary & Acronyms](https://docs.abram.network/docs/user-guide/0.1-glossary-and-acronyms): Terminology reference.
- [Order of Operations](https://docs.abram.network/docs/user-guide/0.2-order-of-operations): Project lifecycle steps.
- [AI Capabilities](https://docs.abram.network/docs/user-guide/0.3-ai-capabilities-and-copilot): Brief Intelligence overview.
- [Production Brain](https://docs.abram.network/docs/user-guide/0.4-production-brain-and-workspace-memory): Workspace memory rules.

### Project Intake & Scoping
- [AI Brief Analyzer](https://docs.abram.network/docs/user-guide/2.1-ai-brief-analyzer): Scoping parameters.
- [Manual Project Setup](https://docs.abram.network/docs/user-guide/2.2-manual-project-creation): Manual scoping.
- [Custom Intake Forms](https://docs.abram.network/docs/user-guide/2.3-custom-intake-forms): Requests configurations.
- [AI Script Breakdown](https://docs.abram.network/docs/user-guide/2.4-ai-script-breakdown): Script parsing details.

### Crewing & Payments
- [Internal Talent Search](https://docs.abram.network/docs/user-guide/4.1-internal-talent-search): Roster search logic.
- [AI Matchmaking](https://docs.abram.network/docs/user-guide/4.2-ai-matchmaking-suggestions): Suitability scores.
- [RSVP & Invites](https://docs.abram.network/docs/user-guide/4.3-inviting-and-crew-rsvp): Inviting thresholds.
- [Stripe Express Setup](https://docs.abram.network/docs/user-guide/5.1-freelancer-stripe-setup): Verification stages.
- [Invoicing & Payouts](https://docs.abram.network/docs/user-guide/5.2-invoicing-and-payouts): 5% fees, holds.
- [Ledger & AI Credits](https://docs.abram.network/docs/user-guide/5.3-billing-ledger-and-ai-credits): Balance checkpoints.

### Links
- [ABRAM App](https://app.abram.network)
- [Pricing](https://docs.abram.network/pricing)
- [Privacy Policy](https://docs.abram.network/privacy-policy)
- [Terms of Use](https://docs.abram.network/terms-of-use)
`;

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
