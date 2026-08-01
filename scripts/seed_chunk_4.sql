INSERT INTO public.help_docs (slug, title, sidebar_title, description, keywords, content)
      VALUES (
        'user-guide/5.3-billing-ledger-and-ai-credits',
        'Billing Ledger and AI Credit Consumption in ABRAM',
        'Billing Ledger and AI Credits',
        'How ABRAM''s organization-bound credit ledger works, what AI features consume credits, how top-ups and plan allowances are structured, and what happens when your balance runs out.',
        '{"ABRAM","ABRAM Network","stripe","producer","ai","billing","ledger","matchmaking","credits"}'::text[],
        '---
title: ''Billing Ledger and AI Credit Consumption in ABRAM''
sidebarTitle: Billing Ledger and AI Credits
description: >-
  How ABRAM''s organization-bound credit ledger works, what AI features
  consume credits, how top-ups and plan allowances are structured, and
  what happens when your balance runs out.
keywords:
  - ABRAM
  - ABRAM Network
  - stripe
  - producer
  - ai
  - billing
  - ledger
  - matchmaking
  - credits
---
# Section 5.3: Billing Ledger and AI Credits

This guide explains how AI credits work in ABRAM, how the organization-bound credit ledger is structured, and how AI features are gated by your credit balance.

---

## 1. The AI Credit Concept

ABRAM meters AI-powered actions—such as analyzing a project brief, suggesting team matches, breaking down a script, or chatting with the Abram assistant—using credits. The credit ledger belongs to your organization (or your personal workspace, if you''re not part of a larger organization), not to any individual user, so every member of a team draws from the same shared pool.

---

## 2. What Consumes Credits

The exact number of credits a given action uses is calculated from the actual AI work performed—things like the length of the text involved and the complexity of the task—so costs vary from one request to the next. There is no fixed price list; any specific figures you may see in the product (such as a cost estimate before running an action) are approximate and can change based on what you submit.

AI features that draw from your credit balance include:

- **Project brief analysis** — extracting scope, roles, and requirements from an uploaded brief
- **Team matchmaking suggestions** — AI-assisted candidate and crew recommendations
- **Script breakdown** — parsing a script into scenes, elements, and requirements
- **Abram assistant conversations** — chatbot questions and actions performed on your behalf
- **Document generation** — AI-drafted documents such as summaries or outlines
- **Web search** — AI-assisted lookups the assistant performs to answer a question

> [!NOTE]
> Image generation is not yet available in ABRAM and does not consume credits.

---

## 3. The Three-Pool Credit Structure

Every organization''s ledger is divided into three credit pools. When an AI action is billed, credits are drawn in a strict priority order:

<ProgressFlow steps={[
  { 
    title: "1. Monthly Allowance", 
    description: "Included in your subscription tier. Resets monthly; unused balance does not roll over.", 
    icon: "Calendar", 
    status: "active" 
  },
  { 
    title: "2. Trial Credits", 
    description: "Awarded during onboarding. Valid until your trial period expires.", 
    icon: "Award", 
    status: "pending" 
  },
  { 
    title: "3. Purchased Balance", 
    description: "Top-up credits bought through checkout. Never expires, drawn last.", 
    icon: "Coins", 
    status: "pending" 
  }
]} />

1. **Monthly Allowance**: Included in your subscription tier. Drawn first. It resets every month; unused allowance does not roll over.
2. **Trial Credits**: Awarded during onboarding, where applicable. Drawn second, and only while your trial is still active.
3. **Purchased Balance**: Top-up credits bought through checkout. Drawn last. Purchased credits never expire.

---

## 4. Monthly Credit Allowances by Plan

Every subscription tier includes a monthly AI credit allowance:

| Tier | Monthly AI Credits |
| :--- | :--- |
| **Free** | 0 |
| **Solo Lite** | 300 |
| **Solo Pro** | 600 |
| **Team** | 500 per seat |
| **Studio** | 1,000 per seat |
| **Enterprise** | Custom |

On Team and Studio plans, the monthly allowance scales with the number of seats on your subscription—each seat you add increases your organization''s total monthly credits. Workspace storage limits, by contrast, are fixed per tier and do not change with seat count.

---

## 5. Organization-Bound Billing

* **Organization-Bound Billing**: All credit ledgers are bound to an organization. If you''re working solo, your personal workspace acts as your organization for billing purposes.
* **Membership Routing**: If you belong to an active organization, AI actions you take are billed against that organization''s ledger rather than a personal one.
* **Onboarding Exception**: AI calls made during the onboarding wizard (for example, parsing your resume while setting up your profile) are free and do not draw from the ledger.

---

## 6. Buying Top-Up Credit Packs

If your organization is running low, Owners and Admins can purchase one-time top-up packs from **Settings → Billing**. Purchases are processed securely through Stripe Checkout, and your balance updates immediately once the purchase completes.

| Pack | Credits | Price |
| :--- | :--- | :--- |
| **Basic** | 150 credits | $10 |
| **Pro** | 500 credits | $25 |
| **Maximum** | 1,200 credits | $50 |

Purchased credits are added to your Purchased Balance pool, which never expires and is drawn only after your Monthly Allowance and any Trial Credits are used up.

---

## 7. Credit Checks and the Credit Depletion Gate

Before running an AI action, ABRAM checks that your organization has an available credit balance across its active pools. If the check passes, the action runs, and the actual credits consumed are deducted from your ledger once it completes.

### When Your Balance Reaches Zero
If your organization''s combined balance (Monthly Allowance, Trial Credits, and Purchased Balance) is exhausted, AI features are blocked. Instead of running the action, ABRAM shows a prompt directing you to **Settings → Billing** to top up or upgrade before you can continue using AI features.

### Disconnect Safety Net
If a network disconnect or timeout interrupts an AI action partway through, ABRAM only bills your ledger for the work that was actually completed.

---

## 8. Credit Usage Log

To help you track where credits are going, ABRAM keeps a **Credit Usage Log** under **Settings**. It lists a per-feature history of credit transactions—so you can see, for example, how much of your organization''s recent usage came from brief analysis versus assistant conversations or script breakdowns. Use it to spot heavy usage patterns before your balance runs low.

---

## 9. Feature Gating by Plan Tier

Separately from credit balances, some features are gated by your subscription tier rather than by credit consumption:

- **Solo Pro and above**: watermark-free call sheet and invoice export, custom intake forms, third-party integrations (calendar sync, Slack, Frame.io, etc.), PO holds, financial export, budget alerts, and advanced conflict alerts.
- **Team and above**: barcode scanning, batch equipment tools, and shared capacity planning dashboards.
- **Enterprise only**: single sign-on, audit logs, and custom roles.

If a feature is unavailable, check whether it requires a higher plan tier before assuming it''s a credit issue—having a full credit balance does not unlock plan-gated features. See your plan''s details in **Settings → Billing** for the full list of what''s included at each tier.

---

## 10. Budgeting & Scheduling Feature Gating

ABRAM also gates advanced scheduling and budgeting features based on subscription level, allowing users on Free and Solo Lite tiers to test budgeting capabilities before upgrading.

| Tier | Scheduling Access | Budgeting Access |
| :--- | :--- | :--- |
| **Free** | **Read-Only**: Can view the stripboard and calendar. Editing, drag-and-drop, AI Sort, Sync Crew, and adding breaks are locked. | **Trial**: Can create and edit up to **5 budget line items** and **5 expenses**. Saving or adding items beyond that limit is locked. |
| **Solo Lite** | **Read-Only**: Can view the stripboard and calendar. Editing, drag-and-drop, AI Sort, Sync Crew, and adding breaks are locked. | **Trial**: Can create and edit up to **5 budget line items** and **5 expenses**. Saving or adding items beyond that limit is locked. |
| **Solo Pro** | **Full Access**: All scheduling features, including drag-and-drop, AI Sort, Sync Crew, and adding breaks, are fully unlocked. | **Full Access**: Unlimited budget line items and expenses. |
| **Team** | **Full Access**: All scheduling features, including drag-and-drop, AI Sort, Sync Crew, and adding breaks, are fully unlocked. | **Full Access**: Unlimited budget line items and expenses. |
| **Studio** | **Full Access**: All scheduling features, including drag-and-drop, AI Sort, Sync Crew, and adding breaks, are fully unlocked. | **Full Access**: Unlimited budget line items and expenses. |
| **Enterprise** | **Full Access**: All scheduling features, including drag-and-drop, AI Sort, Sync Crew, and adding breaks, are fully unlocked. | **Full Access**: Unlimited budget line items and expenses, plus custom AI credit arrangements. |

### Gating Indicators & Upgrade Paths
* **Locked Controls**: In read-only scheduling mode, action buttons (such as "Add Production Day," "Sync Crew to Schedule," and "AI Sort Board") render as locked, and drag-and-drop interactions are disabled.
* **Trial Restrictions**: When the limit of 5 budget line items or 5 expenses is reached on Free or Solo Lite plans, the system blocks the insertion of new items and displays a notification inviting you to upgrade.
* **Banners**: Persistent upgrade prompts are displayed at the top of the scheduling stripboard and financial overview frames for users on trial or restricted tiers, pointing to subscription settings for self-service upgrading.

---

## 11. Upgrading Plans and Buying Credits

Owners and Admins can purchase additional credits or upgrade plan tiers in **Settings → Billing**.

### Subscription Tiers

| Tier | Price | Seats | Monthly AI Credits | Storage |
| :--- | :--- | :--- | :--- | :--- |
| **Free** | $0 | 1 | 0 | 500 MB |
| **Solo Lite** | $19/mo | 1 | 300 | 3 GB |
| **Solo Pro** | $34/mo | 1 | 600 | 10 GB |
| **Team** | $39/seat/mo | 2–5 | 500 per seat | 10 GB |
| **Studio** | $49/seat/mo | 6–20 | 1,000 per seat | 15 GB |
| **Enterprise** | Custom | Unlimited | Custom | 100 GB |

Solo Pro and above unlock watermark-free call sheet and invoice export, AI brief upload and script breakdown, the full interactive resource scheduler, custom intake forms, PO holds, financial export, budget alerts, and calendar and integration connectors. Team and Studio add multi-seat collaboration, role-based permissions, shared capacity planning dashboards, and barcode/batch equipment tools. Enterprise adds single sign-on, compliance audit logs, and custom roles.

### Upgrading a Personal Workspace
If you''re currently on the **Free** tier in a personal workspace and select a team subscription (such as **Team** or **Studio**):
1. **Workspace Promotion**: ABRAM launches a coordinated flow prompting you for your Company Name and Team Size.
2. Your personal workspace is automatically promoted to a full **Organization**.
3. You''re redirected to Stripe Checkout to set up the subscription.
4. Once checkout completes, your organization''s Monthly Allowance is active and team seat limits are updated.
'
      ) ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        sidebar_title = EXCLUDED.sidebar_title,
        description = EXCLUDED.description,
        keywords = EXCLUDED.keywords,
        content = EXCLUDED.content,
        updated_at = now();
    

      
INSERT INTO public.help_docs (slug, title, sidebar_title, description, keywords, content)
      VALUES (
        'user-guide/5.4-billing-and-payments',
        'Producer Billing, Payment Methods, and Holds',
        'Producer Billing and Payments',
        'How producers and organization owners configure payment methods, fund project milestones, manage authorization holds, and reconcile charges on ABRAM.',
        '{"ABRAM","ABRAM Network","stripe","milestone","freelancer","producer","ai","work package","invoice","billing","payments"}'::text[],
        '---
title: ''Producer Billing, Payment Methods, and Holds''
sidebarTitle: Producer Billing and Payments
description: ''How producers and organization owners configure payment methods, fund project milestones, manage authorization holds, and reconcile charges on ABRAM.''
keywords:
  - ABRAM
  - ABRAM Network
  - stripe
  - milestone
  - freelancer
  - producer
  - ai
  - work package
  - invoice
  - billing
  - payments
---
# Section 5.4: Producer Billing and Payments

This guide details how producers, producers, and organization owners configure payment options, fund project milestones, and manage payment holds.

---

## 1. Setting Up Payment Methods

To pay freelancer invoices or allocate budgets for project work packages, you must link a valid payment source to your organization.

### How to Add a Card or Bank Account:
1. Navigate to **Settings** > **Billing** (or click the **Financials** tab on your project sidebar and select **Payment Methods**).
2. Click **Add Payment Method**.
3. In the secure Stripe Checkout window, choose one of the following options:
   * **Credit/Debit Card**: Enter your card number, expiration date, and CVV code. Supported cards include Visa, Mastercard, American Express, and Discover.
   * **Bank Account (ACH)**: (US Only) Log in securely via your bank provider to authorize direct transfers. Bank transfers are free but take 3–5 business days to clear.
4. Click **Save Method**. This card or bank account will be marked as your organization''s primary funding source.

---

## 2. Milestone Payments & Funding Flow

ABRAM uses a milestone-based funding flow to protect both producers and freelancers.

### Chronological Funding Stages:
1. **Milestone Scoping**: During project creation, the producer and freelancer agree to a set of work packages and milestones (e.g., "Pre-Production: 25%", "Final Edit: 75%").
2. **Payment Authorization**: When the project starts, ABRAM requests a payment authorization for the first upcoming milestone.
3. **Delivery & Approval**: The freelancer submits their deliverables. Once the producer reviews and approves the work package, they click **Approve & Release** in the project dashboard.
4. **Capture & Transfer**: Stripe immediately captures the authorized funds, deducts the platform processing fee, and routes the remainder to the freelancer''s connected bank account.

---

## 3. Payment Authorization Holds (7-Day Limit)

Credit card authorizations have a strict **7-day expiration limit** set by card networks. If your project milestone takes longer than 7 days to complete, the hold will naturally expire.

### How ABRAM Handles Hold Expirations:
* **No Automatic Refresh**: Card authorization holds cannot be silently or automatically refreshed by the system.
* **Hold Expiry Alerts**: The platform automatically monitors pending holds. Starting at **Day 5 and Day 6**, managers receive warnings and critical dashboard alerts prompting them to capture or release the hold.
* **Auto-Release**: If no action is taken, the hold expires naturally on **Day 7**. The funds are automatically released back to the producer''s card, and the invoice status is marked as expired.
* **Hold Release**: If a project is cancelled or a milestone is rejected by the producer before day 7, the authorization hold is released immediately. The funds are returned to the producer''s available balance.
'
      ) ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        sidebar_title = EXCLUDED.sidebar_title,
        description = EXCLUDED.description,
        keywords = EXCLUDED.keywords,
        content = EXCLUDED.content,
        updated_at = now();
    

      
INSERT INTO public.help_docs (slug, title, sidebar_title, description, keywords, content)
      VALUES (
        'user-guide/5.5-timesheets-and-time-tracking',
        'Section 5.5: Timesheets & Time Tracking',
        'Timesheets',
        'How crew log worked hours against a project''s Time tab, and how managers review, approve, and feed those hours into billing.',
        '{"ABRAM","timesheet","time tracking","hours","approval","work order","billing"}'::text[],
        '---
title: ''Section 5.5: Timesheets & Time Tracking''
sidebarTitle: Timesheets
description: How crew log worked hours against a project''s Time tab, and how managers review, approve, and feed those hours into billing.
keywords:
  - ABRAM
  - timesheet
  - time tracking
  - hours
  - approval
  - work order
  - billing
---
# Section 5.5: Timesheets & Time Tracking

Timesheets connect the hours your crew actually work to the hours you pay them for. This guide covers where to log time, how ABRAM pre-fills entries from scheduled bookings, and how managers review and approve hours before they reach billing.

---

## 1. Where to Log Time

Open a project and go to the **Time** tab. This is the project''s Timesheet view, where crew and freelancers log the hours they actually worked against specific work packages or deliverables.

---

## 2. For Crew: Logging Your Time

* Open the project you worked on and go to the **Time** tab.
* Log your hours against the relevant work package or deliverable so managers can see exactly where the time went.
* If ABRAM has already created a draft entry for you (see below), you can simply confirm it or edit the hours to match what you actually worked. Manual edits you make are preserved — the system will not overwrite them.

### Draft Entries from Work Orders

To save crew from re-entering hours that are already scheduled, ABRAM can auto-create time entries for you:

* When a work order you''re booked on becomes active or is marked Wrapped, ABRAM automatically creates **draft** time entries spread across the booking''s days.
* If you edit the hours on one of these drafts yourself, ABRAM will not overwrite your manual edit.
* If you''re removed from a work order, any draft time entries tied to that booking are cleaned up automatically.

---

## 3. For Managers: Reviewing & Approving

* Managers and producers review logged hours and can approve or reject each entry.
* To see how actual hours compare to what was scheduled, go to **Team Management → Hours**. This view lets you compare planned hours (from bookings) against the hours crew actually logged, so you can spot discrepancies before approving.
* Once you''re satisfied an entry is accurate, approve it. If something looks off, reject it so the crew member can correct and resubmit.

---

## 4. How Approved Hours Feed Payment

Approving a timesheet entry isn''t just a formality — it''s what allows the hours to move downstream:

* Approved hours flow into the billing ledger.
* From there, they can be pulled into invoices as line items when it''s time to bill.

For details on turning approved hours and expenses into an invoice, see [Section 5.2: Invoicing and Payouts](./5.2-invoicing-and-payouts.mdx).
'
      ) ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        sidebar_title = EXCLUDED.sidebar_title,
        description = EXCLUDED.description,
        keywords = EXCLUDED.keywords,
        content = EXCLUDED.content,
        updated_at = now();
    

      
INSERT INTO public.help_docs (slug, title, sidebar_title, description, keywords, content)
      VALUES (
        'user-guide/5.6-quotes',
        'Section 5.6: Quotes',
        'Quotes',
        'Create, send, and track quotes for your clients, and convert accepted quotes straight into invoices.',
        '{"ABRAM","quotes","estimates","invoicing","client portal","financials"}'::text[],
        '---
title: ''Section 5.6: Quotes''
sidebarTitle: Quotes
description: ''Create, send, and track quotes for your clients, and convert accepted quotes straight into invoices.''
keywords:
  - ABRAM
  - quotes
  - estimates
  - invoicing
  - client portal
  - financials
---
# Section 5.6: Quotes

Before work begins, you often need to give a client a formal estimate — or receive one from someone you''re hiring. ABRAM''s Quotes area lets you build, send, and track these estimates, and turn an accepted quote directly into an invoice once the client signs off.

---

## 1. Where to Find Quotes

Quotes live in the **Financials** area, in their own **Quotes** tab alongside your **Invoices** tab. The Quotes tab is split into two lists:

* **Sent**: Quotes you''ve created and sent out to clients.
* **Received**: Quotes that have been sent to you.

For more on invoices themselves, see [Section 5.2: Invoicing and Payouts](/user-guide/5.2-invoicing-and-payouts).

---

## 2. The Quote Lifecycle

A quote moves through a simple set of stages as it''s worked through:

| Status | What it means |
|---|---|
| Draft | You''ve started building the quote but haven''t sent it yet. |
| Sent | The quote has been delivered to the client. |
| Viewed | The client has opened and reviewed the quote. |
| Accepted | The client has approved the quote. |
| Declined | The client has turned the quote down. |
| Expired | The quote''s window passed without a response. |
| Converted | An accepted quote has been turned into an invoice. |

You can open any quote at any stage to review its detail — line items, status, and history — from the Quotes tab.

---

## 3. Building and Sending a Quote

To create a new quote, open the **Quotes** tab in Financials and start a new quote in the Sent list. From there you:

1. Add your line items — describing the work or goods being quoted, with quantities and pricing as needed.
2. Review the quote before sending.
3. Send it to the client, which moves the quote from Draft to Sent status.

Once sent, you can track whether the client has opened it (Viewed) and what they decide (Accepted or Declined).

---

## 4. Converting an Accepted Quote to an Invoice

Once a client accepts a quote, you don''t need to rebuild the invoice from scratch. Open the accepted quote from your Sent list and convert it — this carries the quote''s details over into a new invoice, which then follows the normal invoicing flow described in [Section 5.2: Invoicing and Payouts](/user-guide/5.2-invoicing-and-payouts). The original quote''s status updates to Converted so you can always trace an invoice back to the quote it came from.

---

## 5. How Clients Respond to Quotes

If you''ve given a client a Client Portal, they can review and respond to quotes right from their portal — no separate login or account needed. From their portal, a client can:

* Open and review a quote''s line items.
* **Accept** or **Decline** the quote directly.

Their response updates the quote''s status on your side immediately. For more on setting up and managing client portals, see [Section 6.4: Client Portal](/user-guide/6.4-client-portal).

---

## 6. Related Guides

* [Section 5.2: Invoicing and Payouts](/user-guide/5.2-invoicing-and-payouts) — what happens after a quote converts to an invoice
* [Section 6.4: Client Portal](/user-guide/6.4-client-portal) — how clients view and act on shared quotes
'
      ) ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        sidebar_title = EXCLUDED.sidebar_title,
        description = EXCLUDED.description,
        keywords = EXCLUDED.keywords,
        content = EXCLUDED.content,
        updated_at = now();
    

      
INSERT INTO public.help_docs (slug, title, sidebar_title, description, keywords, content)
      VALUES (
        'user-guide/5.7-referral-program',
        'Section 5.7: Invite & Earn Referral Program',
        'Invite & Earn',
        'How to invite others to ABRAM through the Referral Hub, track your referrals, and earn AI credits when they join.',
        '{"ABRAM","referral","invite","invite and earn","AI credits","referral hub"}'::text[],
        '---
title: ''Section 5.7: Invite & Earn Referral Program''
sidebarTitle: Invite & Earn
description: How to invite others to ABRAM through the Referral Hub, track your referrals, and earn AI credits when they join.
keywords:
  - ABRAM
  - referral
  - invite
  - invite and earn
  - AI credits
  - referral hub
---
# Section 5.7: Invite & Earn Referral Program

The Invite & Earn program lets you invite others to ABRAM and earn AI credits when they sign up through your invitation.

---

## 1. Where to Find It

Look for the **Invite & Earn** button in the sidebar. Selecting it opens the Referral Hub, where you can share your invitation and track its results.

---

## 2. How to Invite People

From the Referral Hub, you have two ways to invite people:

* **Share your referral link or code**: You''re given a unique referral link and code that you can send to anyone.
* **Send batch email invitations**: You can send invitations directly by email, up to **10 at a time**.

---

## 3. Tracking Your Referrals

The Referral Hub tracks who has signed up using your referral link or code, so you can see the status of the people you''ve invited in one place.

---

## 4. Earning AI Credits

When someone signs up through your referral, you earn AI credits, which are added to your account.

> [!NOTE]
> There is a lifetime cap of **5,000 credits** that can be earned through the referral program.

To see how AI credits are used across the platform — and how your credit balance is structured — see [Section 5.3: Billing Ledger and AI Credits](./5.3-billing-ledger-and-ai-credits.mdx).
'
      ) ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        sidebar_title = EXCLUDED.sidebar_title,
        description = EXCLUDED.description,
        keywords = EXCLUDED.keywords,
        content = EXCLUDED.content,
        updated_at = now();
    

      
INSERT INTO public.help_docs (slug, title, sidebar_title, description, keywords, content)
      VALUES (
        'user-guide/6.1-slack-notifications',
        'Slack Notifications and Channel Connector',
        'Slack Notifications',
        'Connect your Slack workspace to ABRAM to receive real-time milestone, task, review, and invoice updates in your designated production team channels.',
        '{"ABRAM","ABRAM Network","milestone","producer","slack","ai","invoice","collaboration","crew","notifications"}'::text[],
        '---
title: ''Slack Notifications and Channel Connector''
sidebarTitle: Slack Notifications
description: ''Connect your Slack workspace to ABRAM to receive real-time milestone, task, review, and invoice updates in your designated production team channels.''
keywords:
  - ABRAM
  - ABRAM Network
  - milestone
  - producer
  - slack
  - ai
  - invoice
  - collaboration
  - crew
  - notifications
---
# Section 6.1: Slack Notifications

Keep your production team aligned and producers updated by connecting your Slack workspace to ABRAM Network. The Slack connector sends real-time updates regarding milestones, tasks, review comments, and invoices directly to your designated channels.

---

## 1. Connecting Slack via App Connectors

The Slack integration is powered securely by our collaboration connector.
1. Navigate to the **Settings** page.
2. Click the **Connectors** tab.
3. In the App Connectors list, find the **Slack** card and click **Connect**.
4. You will be redirected to Slack''s authorization page.
5. Choose the Slack workspace you want to connect to and click **Allow**.
6. Once connected, Slack will show as *Connected* in your App Connectors list.

---

## 2. Configuring Channel Mappings

After authorized connection, you can decide which channels receive specific alerts. Channel mapping can be managed globally (for the whole organization) or overridden on a per-project basis:

### Global Channel Mappings
1. Open the Slack Connector settings inside the **Connectors** tab.
2. Map general updates to a global channel (e.g., `#production-updates` or `#general`).
3. Click **Save Mappings**.

### Per-Project Channel Mappings
For larger teams, you can direct updates to project-specific channels:
1. Navigate to the **Projects** dashboard and select your active project.
2. Click the **Project Settings** (gear icon) and go to the **Slack Settings** section.
3. Override the global mapping by choosing a channel specifically for this project (e.g., `#project-sunset-promo`).
4. All messages, task check-offs, and file comments related to this project will be routed there.

---

## 3. Customizing Notifications

You can choose what events trigger a Slack message. Select or deselect these options in your notification settings:

| Notification Type | Trigger Event | Slack Output Example |
| :--- | :--- | :--- |
| **Project Milestones** | Project created, status changes (Planning -> Active), or milestones achieved. | `🎉 Milestone "Rough Cut Approved" completed for Project Sunset Promo!` |
| **Tasks & Deliverables** | New task assigned, checklist items completed, or files uploaded. | `✅ Task "Color Correction" completed by Jane Doe.` |
| **Producer Feedback** | Comments posted on deliverables, review link updates, or approvals. | `💬 Producer John Smith left a comment on "V1 Main Export": "Reduce music volume."` |
| **Financial & Invoices** | Milestone expenses submitted, invoices approved, or payment confirmations. | `💵 Invoice INV-0045 for $5,000 has been approved by the producer.` |
| **Schedule & Logistics** | Call sheet published, crew check-in alerts, or equipment check-out reminders. | `📅 Call sheet for Day 2 published. Crew call is 07:00 AM at Stage 4.` |

---

## 4. Interactive Slack Actions & Fallbacks

Slack notifications on ABRAM are not just passive alerts; they allow you to take direct actions from within your Slack workspace.

### Interactive Buttons
Notifications sent to your mapped Slack channels include interactive action buttons:
* **Deliverable Reviews**: When a freelancer uploads a deliverable, the notification features **Approve** and **Request Revision** buttons. Clicking these buttons directly updates the deliverable status on the platform.
* **Crew Check-ins**: Call sheet notifications include a **Mark On-Site** button. Freelancers can click this directly in Slack to mark themselves as checked-in and active on-site.
* **System Alerts**: Administrative channel notifications feature options to resolve errors or launch debugging tools directly.

### Message Updates In-Place
When you click an interactive button in Slack, the notification message updates *in-place* to show a summary of the completed action (e.g., `✅ Deliverable "V1 Rough Cut" was approved by @username`). This prevents duplicate clicks and keeps your Slack channel history clean.

### Manual Channel Connection Fallback
If you are unable to locate a channel in the drop-down selector (e.g., due to integration permissions) or need to route messages to a private channel:
1. Toggle the Slack settings to **Manual Mode**.
2. Manually type in the Slack **Channel ID** (e.g., `C012345678`) and **Channel Name** (e.g., `#private-shoot-crew`).
3. Save the fallback connection.
* *Note: For private Slack channels, you must invite the ABRAM bot by running `/invite @ABRAM` in the private Slack channel before alerts can be successfully routed.*
'
      ) ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        sidebar_title = EXCLUDED.sidebar_title,
        description = EXCLUDED.description,
        keywords = EXCLUDED.keywords,
        content = EXCLUDED.content,
        updated_at = now();
    

      
INSERT INTO public.help_docs (slug, title, sidebar_title, description, keywords, content)
      VALUES (
        'user-guide/6.2-frameio-workspaces',
        'Frame.io Workspaces and Video Review Integration',
        'Frame.io Workspaces',
        'Link Frame.io to ABRAM project dashboards to browse media assets, track presentation links, and review producer feedback without switching apps.',
        '{"ABRAM","ABRAM Network","producer","ai","workflow","collaboration","permissions","frameio","workspaces"}'::text[],
        '---
title: ''Frame.io Workspaces and Video Review Integration''
sidebarTitle: Frame.io Workspaces
description: ''Link Frame.io to ABRAM project dashboards to browse media assets, track presentation links, and review producer feedback without switching apps.''
keywords:
  - ABRAM
  - ABRAM Network
  - producer
  - ai
  - workflow
  - collaboration
  - permissions
  - frameio
  - workspaces
---
# Section 6.2: Frame.io Workspaces

The Frame.io integration bridges your video post-production review workflow directly with your ABRAM project dashboard. By linking Frame.io, you can browse media assets, track presentation links, and review producer comments without switching applications.

---

## 1. Connecting Frame.io

Before linking specific project folders, you must authorize Frame.io globally:
1. Go to the **Settings** page and click the **Connectors** tab.
2. Under the App Connectors list, click **Connect** on the **Frame.io** card.
3. Authenticate with your Frame.io credentials and grant the requested permissions.
4. Once connected, your authorization status will update to *Connected*.

---

## 2. Linking a Project Workspace

Once the connection is authorized globally, you can link a project workspace. The integration is built on the modern **Frame.io V4 REST API** architecture, allowing synchronization of media assets and stakeholder review shares.

1. Navigate to the **Projects** dashboard and click on your active project.
2. Select the **Frame.io** tab.
3. If no workspace is linked yet, click **Provision Frame.io Project**.
4. The system will automatically connect to Frame.io, create a dedicated project folder matching your project name, and sync the file references.

### Role-Based Access Controls
* **Administrative Actions**: Only Organization Administrators or project owners can provision workspaces, sync assets, or unlink references.
* **Read-Only Members**: Standard team members see a read-only notice and can browse assets or review links, but cannot modify connection settings or authorize new folders.

### Link Recovery & Re-Provisioning
If a project folder is deleted on Frame.io, or if the connection becomes invalid, administrators can resolve the issue using two options on the Frame.io tab:
1. **Clear Link Reference**: Removes the workspace link in ABRAM without deleting any remaining files on Frame.io.
2. **Re-Provision Project**: Programmatically creates a fresh project folder on Frame.io matching the project name and restores active synchronization.

---

## 3. Review Collaboration Features

Once linked, the Frame.io tab turns into a media review dashboard containing three sections:

### Overview Cards
* **Linked Project:** Shows the name of the connected project and provides a direct link to open the folder on Frame.io.
* **Review Shares:** Displays the number of active presentation and review links distributed to stakeholders.
* **Media Assets:** Displays the total count of files, folders, and rushes synced to the root workspace.

### Review Shares (Presentation Links)
This list displays active reviewer links created in Frame.io:
* See when the share was created and the number of video files attached.
* Click **Open Review Link** to open the stakeholder review player. This allows producers to leave time-coded comments and drawings.
* If you have administrative rights, a **New Share** button is available to launch the Frame.io review builder directly.

### Project Media Assets
Browse the root directory of your Frame.io workspace:
* Files display descriptive icons for folders, videos, or documents.
* File sizes (KB/MB) and file types are listed.
* Click the **External Link** icon next to any file to open it in your browser or Frame.io application. This allows you to check specific frame-by-frame drawings and review histories.

### Syncing and Refreshing
Assets and links do not require manual matching, but you can update them instantly:
* Click **Sync Assets & Shares** in the sidebar to sync new uploads, version stacks, or review link modifications.
* Admins can click **Unlink Project Reference** to remove the connection. Unlinking does *not* delete files on Frame.io; it only clears the folder reference from ABRAM.
'
      ) ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        sidebar_title = EXCLUDED.sidebar_title,
        description = EXCLUDED.description,
        keywords = EXCLUDED.keywords,
        content = EXCLUDED.content,
        updated_at = now();
    

      
INSERT INTO public.help_docs (slug, title, sidebar_title, description, keywords, content)
      VALUES (
        'user-guide/6.3-project-collaboration-and-file-sharing',
        'Project Collaboration, File Sharing, and @Mentions',
        'Project Collaboration & File Sharing',
        'Share files, link external assets, and run @mention feedback threads on every ABRAM project deliverable for tighter crew and producer collaboration.',
        '{"ABRAM","ABRAM Network","freelancer","producer","slack","ai","collaboration","project","file","sharing"}'::text[],
        '---
title: ''Project Collaboration, File Sharing, and @Mentions''
sidebarTitle: Project Collaboration & File Sharing
description: ''Share files, link external assets, and run @mention feedback threads on every ABRAM project deliverable for tighter crew and producer collaboration.''
keywords:
  - ABRAM
  - ABRAM Network
  - freelancer
  - producer
  - slack
  - ai
  - collaboration
  - project
  - file
  - sharing
---
# Section 6.3: Project Collaboration & File Sharing

Successful creative productions rely on efficient asset sharing and structured feedback loop. ABRAM Network integrates file uploads, external link management, and `@mention` collaboration threads directly into each project deliverable.

---

## 1. File Uploads & External Links

ABRAM provides two ways to attach deliverables, scripts, budgets, or assets to a specific task:

### Native File Uploads & Document Library
You can upload project assets in two locations:
* **Deliverables Tab**: Attach specific project deliverables (such as drafts, scripts, or exports) directly to their corresponding work tasks. Supported formats include PDF, DOC, and DOCX up to 100MB.
* **Documents Tab**: Upload files to your general project document library. The Documents tab supports a wide range of formats (including PDF, Word, Excel, CSV, text, images, video, audio, and ZIP files up to 100MB). 
* **AI Copilot References**: Uploading documents to the library automatically enables the AI Copilot to read and reference their contents during your workspace chats, allowing you to ask questions about the project files conversationally.

### Deliverable Links (External Media)
For file types not natively supported (such as raw video files, audio bundles, code repos, or Figma designs), use **Deliverable Links**:
1. In the deliverable detail panel, click **Add Link**.
2. Input the URL (e.g., Google Drive, Dropbox, Frame.io, YouTube).
3. Provide a friendly label (e.g., "Rough Cut YouTube Link").
4. Click **Add**. These external links stay grouped alongside native file attachments.

---

## 2. Managing Deliverables and Revisions

To maintain project quality control:
* **Upload New Revisions:** To update a deliverable, delete the existing file and upload a new one. This ensures team members are always referencing the latest revision.
* **Notification Alerts:** When a freelancer uploads a deliverable or marks a task as *Ready for Review*, producers and project leads are notified via in-app alerts, email, and Slack updates.
* **Approvals:** Producers can mark deliverables as *Approved*, locking further edits and initiating payment schedules.

---

## 3. Collaboration Threads & `@Mentions`

Every deliverable features a dedicated, real-time comment thread. This keeps feedback, revision histories, and change requests consolidated with the asset.

### Using Mentions
To notify a specific team member:
1. In the comment input box, type `@` followed by the user''s name.
2. A dropdown list of active project members will appear.
3. Select the correct user. The system will format the mention into a secure tag (e.g., `@Jane Doe`).
4. Type your comment and click **Send** (or press **Enter** to submit directly; press **Shift + Enter** to insert a new line).
5. The mentioned user will receive an immediate in-app and email alert, directing them to the thread.

### Thread Replies & Actions
* **Replies:** Click **Reply** beneath any comment to start a nested sub-discussion. This keeps specific review items grouped together.
* **Deleting Comments:** You can delete your own comments by clicking the **Trash** icon. Project owners and admins can delete any comment to keep threads clear.

---

## 4. Project Activity & Discussion Feed

In addition to individual deliverable comments, each project features a unified **Activity Feed**:
* **Consolidated Discussion**: A central board that displays all project-wide chat messages, updates, and replies.
* **Chronological Status Logs**: The feed automatically integrates chronological logs of project events, including:
  * Deliverable submissions and revision requests.
  * Milestone confirmations and completions.
  * Reported blocker issues.
  * Project team changes (adding or removing crew members).
  * System updates.
This creates a single, complete timeline of both human conversations and automated project events.
'
      ) ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        sidebar_title = EXCLUDED.sidebar_title,
        description = EXCLUDED.description,
        keywords = EXCLUDED.keywords,
        content = EXCLUDED.content,
        updated_at = now();
    

      
INSERT INTO public.help_docs (slug, title, sidebar_title, description, keywords, content)
      VALUES (
        'user-guide/6.4-client-portal',
        'Section 6.4: Client Portal',
        'Client Portal',
        'Give your clients a private, branded portal to review deliverables, approve quotes, and pay invoices without needing a full ABRAM account.',
        '{"ABRAM","client portal","client management","deliverables","invoicing","quotes","collaboration"}'::text[],
        '---
title: ''Section 6.4: Client Portal''
sidebarTitle: Client Portal
description: ''Give your clients a private, branded portal to review deliverables, approve quotes, and pay invoices without needing a full ABRAM account.''
keywords:
  - ABRAM
  - client portal
  - client management
  - deliverables
  - invoicing
  - quotes
  - collaboration
---
# Section 6.4: Client Portal

The Client Portal gives your own clients a private space to follow along on their work with you — without handing them a full account or login. You control exactly what each client can see, and they access everything through a secure link, no password required.

This guide covers both sides of the experience: how producers set portals up, and what a client actually sees once they''re in.

---

## 1. Plan Availability

Client portals require a **Solo Pro plan or higher**. How many clients you can give a portal to depends on your plan:

| Plan | Client Portals |
|---|---|
| Solo Pro | Up to 5 |
| Team | Up to 15 |
| Studio | Up to 50 |
| Enterprise | Unlimited |

If you''re on Free or Solo Lite, upgrade to Solo Pro or higher to unlock client portals.

---

## 2. Setting Up Portals (For Producers)

### Managing Clients

Client portals are managed from the top-level **Clients** hub. From here, you can add a new client and issue them a private portal.

* **Add a client**: Create a client record to start tracking their information.
* **Issue a portal**: Once a client is added, generate their portal access. Clients get in through a secure magic link — there''s no password or account for them to set up on their end.

### Controlling What Each Client Sees

For every client, you can configure:

* **Portal Requests**: Turn this on or off to control whether the client can submit new project requests through their portal.
* **Intake form**: Assign which of your custom intake forms the client sees when they submit a request. If you haven''t set one up, they''ll see a simple "Basic request" fallback form instead.
* **Visibility**: Control what information and project access the client has overall.

For more on building custom intake forms, see [Section 2.3: Custom Intake Forms](/user-guide/2.3-custom-intake-forms).

### Sharing a Project With a Client

Portal visibility is also managed at the project level. On a project, you choose which sections and items are visible to the linked portal client — for example, specific deliverables and milestones each have their own portal-visibility toggle, so you can share only what''s ready for client eyes.

Once a client portal is linked to a project, a **Client Discussion** tab appears on that project. This gives you a dedicated space to message with the client directly, separate from your internal team conversations.

---

## 3. What Your Client Sees

When a client opens their portal link for the first time, they''ll be asked to verify their email. After that, they land in their own portal view, where they can:

* **View shared projects**: See the projects you''ve shared with them, and follow an **activity feed** of updates.
* **Review deliverables**: Open deliverables you''ve shared, review them, and leave comments and feedback directly.
* **Respond to quotes**: Accept or decline quotes you''ve sent them. For more on how quotes and invoicing work, see [Section 5.2: Invoicing and Payouts](/user-guide/5.2-invoicing-and-payouts).
* **Pay invoices**: Pay invoices through the portal, processed securely via Stripe.
* **Submit new requests**: If you''ve turned on Portal Requests, the client can submit a new project request using the intake form you assigned to them (or the Basic request fallback).

The client only ever sees what you''ve explicitly shared — projects, deliverables, and milestones you haven''t marked as portal-visible stay private to your internal team.

---

## 4. Related Guides

* [Section 2.3: Custom Intake Forms](/user-guide/2.3-custom-intake-forms) — building and assigning intake forms
* [Section 5.2: Invoicing and Payouts](/user-guide/5.2-invoicing-and-payouts) — quotes, invoices, and payments
* [Section 3.2: Work Packages & Milestones](/user-guide/3.2-work-packages-and-milestones) — deliverables, work orders, and payment milestones
'
      ) ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        sidebar_title = EXCLUDED.sidebar_title,
        description = EXCLUDED.description,
        keywords = EXCLUDED.keywords,
        content = EXCLUDED.content,
        updated_at = now();
    

      
INSERT INTO public.help_docs (slug, title, sidebar_title, description, keywords, content)
      VALUES (
        'user-guide/7.1-faqs-and-troubleshooting',
        'ABRAM FAQs and Troubleshooting Guide',
        'FAQs & Troubleshooting Guide',
        'Answers to common ABRAM Network questions plus step-by-step troubleshooting for sign-in, intake, scheduling, Stripe payouts, AI credits, and integration issues.',
        '{"ABRAM","ABRAM Network","stripe","milestone","freelancer","producer","calendar","ai","brief","work package","payout","invoice","crew","permissions","billing","talent search","rsvp","faqs","troubleshooting","feedback","release notes","invite and earn","ai credits"}'::text[],
        '---
title: ''ABRAM FAQs and Troubleshooting Guide''
sidebarTitle: FAQs & Troubleshooting Guide
description: ''Answers to common ABRAM Network questions plus step-by-step troubleshooting for sign-in, intake, scheduling, Stripe payouts, AI credits, and integration issues.''
keywords:
  - ABRAM
  - ABRAM Network
  - stripe
  - milestone
  - freelancer
  - producer
  - calendar
  - ai
  - brief
  - work package
  - payout
  - invoice
  - crew
  - permissions
  - billing
  - talent search
  - rsvp
  - faqs
  - troubleshooting
  - feedback
  - release notes
  - invite and earn
  - ai credits
---
# Section 7.1: FAQs & Troubleshooting Guide

This guide compiles answers to the most common questions and provides step-by-step troubleshooting procedures for the ABRAM platform.

---

## 1. Calendar Sync & Availability Issues

### Q: Why are my external calendar events not showing up on my ABRAM Utilization Calendar?
**A**: Calendar sync is driven by real-time connection sync. If sync stops or fails to initialize:
1. Navigate to **Settings** > **App Connectors** > **Calendar Sync**.
2. Check the connection status of your Google Calendar or Microsoft Outlook account.
3. If it displays "Connected" but is not updating, click **Re-Sync Now** to refresh the subscription.
4. If it displays "Disconnected" or "Error", click **Reconnect** to re-authorize the connection.

### Q: Does blocking out a day on my Google Calendar automatically make me unavailable on ABRAM?
**A**: Yes. Any event marked as **"Busy"** on your primary synced external calendar is imported automatically. Events marked as **"Free"** or **"Tentative"** are ignored to prevent accidental blockouts.

### Q: How do I resolve a capacity conflict alert?
**A**: If a producer attempts to book you for a work package that overlaps with an existing confirmed booking or external blockout, the system highlights the dates in red. You can:
* Decline the invitation or RSVP as **Tentative** and leave a message.
* Adjust your availability in the **Utilization** tab by clicking the conflict date and selecting **Resolve Conflict** (this will release tentative holds).

---

## 2. Stripe Connect & Payment Issues

### Q: Why is my Stripe Connect account status showing as "Setup Required" or "In Review"?
**A**: Stripe requires identity and banking verification before activating your account.
* **Setup Required**: You have not finished filling out the details. Navigate to **Financials** > **Payout Account** and click **Complete Stripe Setup** to finish the form.
* **In Review**: Stripe is verifying your uploaded documents (identity or business registry). This usually takes 2–24 hours. Payouts are temporarily held until verification is successful.
* **Onboarding Delay Safety Net**: If you have not completed Stripe setup, clients can still pay your invoices. The platform temporarily holds the payment securely on the platform account. Once you complete your Stripe setup, the platform automatically releases and transfers the held funds to your connected bank account.

### Q: How does the invoice "Authorization Hold" work for producers?
**A**: When a producer approves a Purchase Order (PO) or milestone invoice, ABRAM places a **7-day authorization hold** on the producer''s credit card via Stripe Checkout.
* The funds are not captured immediately.
* Once the freelancer completes the work package deliverables and the producer clicks **Approve & Capture**, the funds are captured and routed.
* If the project is cancelled or rejected, the hold is released immediately, and the producer is not charged.

### Q: Why did my invoice approval fail?
**A**: If you receive an error when attempting to approve or submit an invoice:
1. Ensure the linked project and work package are active (status is not Completed or Cancelled).
2. Verify that your Stripe account status is **Active**.
3. Check if the producer has a valid payment method on file or has completed the checkout session.

---

## 3. AI Brief Analyzer & Credit Errors

### Q: Why does the AI Brief Analyzer ask for more information or clarification?
**A**: The AI analyzer requires sufficient detail to outline a project. If your description is too short or your uploaded brief document lacks key details (such as scope, timeline, or roles), the analyzer will ask for clarification.
* **Fix**: Provide more details about your project, or answer the clarifying questions generated by the AI assistant to help build an accurate project scope.

### Q: Why did I get an "Insufficient AI Credits" error?
**A**: Running brief analysis, semantic talent search, or automatic crew suggestions consumes organization credits.
* **Fix**: Ask your Organization Owner or Admin to navigate to **Admin** > **Billing** (or **Settings** > **Billing**) and click **Purchase Credits** to top up the balance.

---

## 4. Organization & Member Settings

### Q: How do I invite a teammate who is already registered on another organization?
**A**: Teammates can belong to multiple organizations. When you dispatch an invite to their email, the system detects their profile and sends a platform invitation. Once they accept, they can switch organizations using the dropdown menu in the sidebar.

### Q: Why can''t a member access the Frame.io review workspace?
**A**: Access to integrations depends on user roles and workspace permissions.
1. The Organization Admin must ensure the user has the **Member** or **Admin** role in the workspace.
2. The user must link their Frame.io account under their personal **App Connectors** settings page.

### Q: Why did the Onboarding Wizard loading screen disappear and start a fresh profile?
**A**: To prevent users from getting stuck, the onboarding wizard has a **10-second timeout safeguard** on invitation lookups. If the lookup takes longer than 10 seconds, it falls back to a fresh setup so you are not blocked. You can still link your organization or project invitations manually from your settings once your workspace is open.

### Q: What should I do if a linked Frame.io folder is deleted or the connection is broken?
**A**: If a project folder is deleted on Frame.io or the connection becomes invalid, workspace administrators can resolve it on the **Frame.io** tab of the project details:
* **Clear Link Reference**: Removes the link in ABRAM without affecting files on Frame.io, allowing you to link a different folder.
* **Re-Provision Project**: Automatically creates a fresh project folder on Frame.io matching the project name and restores syncing.

---

## 5. Feedback, Updates & Rewards

### Q: How do I report a bug or leave feedback?
**A**: Look for the **Report Feedback** option in the footer at the bottom of any page. Clicking it opens a feedback form where you can describe an issue or share a suggestion directly with the ABRAM team.

### Q: Where can I see what''s new?
**A**: Check the **Release Notes** page. It lists recent product updates, including new features, improvements, and bug fixes, so you can stay current on what''s changed.

### Q: How do I earn free AI credits?
**A**: Use the **Invite & Earn** referral program. When people you invite sign up and join ABRAM, you earn AI credits added to your account. See Section 5.7 for details on finding your invite link and tracking referrals.

---

## 6. Plan Limits & AI Feature Access

### Q: Why are my AI features turned off?
**A**: This usually comes down to one of two things:
* **Your AI credit balance is at zero.** AI features (like the Brief Analyzer, talent matching, and chatbot actions) draw from your credit balance, and they pause once it runs out. Go to **Billing** to check your balance and top up — see Section 5.3 for how credits work.
* **Your plan doesn''t include the feature.** Some AI tools, such as script breakdown and uploading a brief file for the AI to analyze, require a Solo Pro plan or higher. If you''re on Free or Solo Lite, you''ll need to upgrade to use them.

### Q: Why can''t I export a clean call sheet, or use certain other features?
**A**: Some features are limited by your plan tier. For example, exporting or emailing a call sheet without a watermark, using custom intake forms, and connecting integrations like Slack, Frame.io, or calendar sync all require a Solo Pro plan or higher. Check your organization''s plan tier and available upgrades from the Billing page.
'
      ) ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        sidebar_title = EXCLUDED.sidebar_title,
        description = EXCLUDED.description,
        keywords = EXCLUDED.keywords,
        content = EXCLUDED.content,
        updated_at = now();
    

      
INSERT INTO public.help_docs (slug, title, sidebar_title, description, keywords, content)
      VALUES (
        'user-guide/7.2-cookie-consent-and-tag-behavior',
        'Section 7.2: Cookie Consent and Tag Behavior',
        'Cookie Consent & Tag Behavior',
        'A clear explanation of cookie settings, Google Consent Mode v2, and cookieless pings on the ABRAM platform.',
        '{"ABRAM","cookie consent","consent mode","cookieless pings","ad_storage","analytics_storage","privacy"}'::text[],
        '---
title: ''Section 7.2: Cookie Consent and Tag Behavior''
sidebarTitle: Cookie Consent & Tag Behavior
description: A clear explanation of cookie settings, Google Consent Mode v2, and cookieless pings on the ABRAM platform.
keywords:
  - ABRAM
  - cookie consent
  - consent mode
  - cookieless pings
  - ad_storage
  - analytics_storage
  - privacy
---

# Section 7.2: Cookie Consent and Tag Behavior

This article outlines how the ABRAM platform handles cookie consent, manages user preferences, integrates Google Consent Mode v2, and utilizes cookieless pings to balance accurate analytics with user privacy compliance.

---

## 1. Consent State and Tag Behavior

The platform utilizes a dynamic consent framework that respects user privacy preferences by adjusting the behavior of measurement tags in real time. Rather than blocking tags from loading entirely, the platform loads tags in all cases and manages their capabilities via two primary consent states:

*   **`ad_storage`**: Controls the storage (such as cookies) related to advertising.
*   **`analytics_storage`**: Controls the storage (such as cookies) related to analytics and site usage.

Depending on the consent state, tag behavior adjusts as follows:

| Consent Parameter | State | Tag Behavior & Data Collection |
| :--- | :--- | :--- |
| **`ad_storage`** | `granted` | Advertising cookies are read and written. Full conversion tracking, audience building, and remarketing capabilities are enabled. |
| | `denied` | Advertising cookies are blocked. Tags do not read or write advertising-related cookies. Instead, cookieless pings are sent to report basic ad performance and conversion metrics. |
| **`analytics_storage`** | `granted` | Analytics cookies are read and written. Full session tracking, page-view journeys, and user behavior analytics are recorded. |
| | `denied` | Analytics cookies are blocked. Tags do not read or write analytics cookies. The system sends cookieless pings containing basic operational parameters. |

---

## 2. Ad Storage Denied: Redaction vs. Redaction Disabled

When a user denies consent for advertising cookies (`ad_storage=''denied''`), the platform can handle data transmission in two distinct modes depending on compliance settings:

### Redaction Disabled (`ads_data_redaction=''false''`)
When ad data redaction is disabled and `ad_storage` is `denied`:
*   The system blocks the creation and reading of advertising cookies.
*   The tag continues to send cookieless pings to measure conversions.
*   Ad click identifiers (such as query parameters in URLs) are still sent to help attribute the click event to a campaign.

### Redaction Enabled (`ads_data_redaction=''true''`)
When ad data redaction is enabled and `ad_storage` is `denied`:
*   The system blocks all advertising cookies.
*   All ad click identifiers (such as ad-click query parameters) are stripped or redacted from the URL and payload before sending.
*   The cookieless pings sent to the server contain no identifiers that could link the interaction to a specific ad click, ensuring maximum privacy compliance under strict regional laws.

---

## 3. Cookieless Pings and Data Collection

Cookieless pings are secure, stateless network requests sent to measurement servers when a user has denied cookie consent. They do not store, access, or read any cookies or local identifiers on the user''s browser, preventing the creation of a persistent profile.

These pings carry essential, coarse-level metadata to ensure basic reporting remains functional:

*   **Functional Information**: User agent (browser type, OS version, device type) and screen resolution.
*   **Timestamp**: The exact time of the event.
*   **Coarse Location Info**: Regional/country data derived from the user''s IP address (the IP address itself is processed in memory and discarded; it is never written to disk or stored).
*   **Referrer**: The page URL that led the user to the current page.
*   **Random Page-Navigation ID**: A temporary, random ID generated for each page view. This links events occurring within the same page load (e.g., a page view and a button click) but cannot track the user across different pages or sessions.
*   **Consent State**: Verification metadata detailing that consent was explicitly denied.

---

## 4. Regional Defaults and Measurement Strategy

To preserve analytical integrity without violating privacy regulations, the platform dynamically configures consent defaults based on the visitor’s geographic region:

*   **Strict Opt-In Regions (EEA, UK, Switzerland)**: By default, `ad_storage` and `analytics_storage` are set to `denied` before any tag executes. Tags only activate fully when the user explicitly grants permission through the consent banner.
*   **Opt-Out Regions (Rest of the World)**: By default, `ad_storage` and `analytics_storage` are set to `granted`. Users can opt out or modify their preferences at any time via their cookie settings.

> [!NOTE]
> Setting defaults dynamically by region allows the platform to maintain compliant tracking workflows globally without sacrificing measurement accuracy in regions with opt-out regulations.

---

## 5. Implementation Best Practices

To ensure correct consent management across your workspace pages, adhere to the following best practices:

1.  **Load Tags in All Cases**: Do not use conditional logic to prevent tag scripts from loading. Instead, load the tag scripts on all page views. The tags themselves will read the consent state and dynamically adjust their behavior.
2.  **Define Defaults Early**: Set default consent states (such as `denied` for EEA visitors) at the very top of the page header, before any Google Analytics or advertising scripts are parsed or loaded.
3.  **Update State Instantly**: When a user selects their preferences in the consent banner, update the consent state immediately using the update API. Tags will immediately adjust and process any queued events according to the new consent values.
4.  **Understand Advanced vs. Basic Consent**:
    *   **Advanced Consent (Recommended)**: Loads scripts immediately with `denied` defaults. When users deny consent, tags adapt to send cookieless pings, enabling conversion modeling and basic metrics.
    *   **Basic Consent**: Blocks tag scripts from loading until the user explicitly clicks "Accept". This prevents any data transmission, including cookieless pings, resulting in a complete loss of measurement for non-consenting users.

---

<AgentOnly>

## 🤖 Agent Operations & System Rules

This technical section defines the programmatic script configuration, initialization sequences, and consent state updates for LLM-based crawlers and automated verification systems.

### 1. Default Script Configuration (Gtag.js Syntax)

The platform implements Google Consent Mode v2 via the following script sequence in the document `<head>`:

```html
<!-- Initialize the data layer -->
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}

  // 1. Set default consent state (e.g., for EEA/UK regions)
  gtag(''consent'', ''default'', {
    ''ad_storage'': ''denied'',
    ''analytics_storage'': ''denied'',
    ''ad_user_data'': ''denied'',
    ''ad_personalization'': ''denied'',
    ''wait_for_update'': 500
  });
  
  // 2. Set ads data redaction behavior
  gtag(''set'', ''ads_data_redaction'', true);
</script>

<!-- Load Google Tag Manager / Global Site Tag -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  gtag(''js'', new Date());
  gtag(''config'', ''G-XXXXXXXXXX'');
</script>
```

### 2. User Consent Update Workflow

When a user interacts with the UI consent banner and selects their choices, the application dispatches an update command:

```javascript
// Example: User grants analytics consent but denies ad consent
gtag(''consent'', ''update'', {
  ''ad_storage'': ''denied'',
  ''analytics_storage'': ''granted'',
  ''ad_user_data'': ''denied'',
  ''ad_personalization'': ''denied''
});
```

### 3. Event Execution Order

To prevent race conditions, the platform enforces the following lifecycle steps:

```mermaid
sequenceDiagram
    autonumber
    participant Browser
    participant Consent API
    participant Google Tags
    participant Servers
    
    Browser->>Consent API: Load page & execute default consent (denied)
    Browser->>Google Tags: Load async tag script
    Google Tags->>Consent API: Query current consent state
    Google Tags->>Servers: Dispatch cookieless pings (state metadata only)
    Browser->>Consent API: User clicks "Accept Analytics"
    Consent API->>Google Tags: Dispatch update event (''analytics_storage'': ''granted'')
    Google Tags->>Servers: Write analytics cookies & dispatch full session data
```

### 4. Technical Validation Checklist
*   Verify that `gtag(''consent'', ''default'', ...)` is executed before the main tracking script tag loads.
*   Confirm that the `wait_for_update` parameter is defined, allowing custom scripts up to 500ms to resolve initial consent state before firing tags.
*   Ensure that no local storage items or cookies are created under domains when consent is in a `denied` state.

</AgentOnly>
'
      ) ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        sidebar_title = EXCLUDED.sidebar_title,
        description = EXCLUDED.description,
        keywords = EXCLUDED.keywords,
        content = EXCLUDED.content,
        updated_at = now();
    

      