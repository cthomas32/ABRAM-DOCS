INSERT INTO public.help_docs (slug, title, sidebar_title, description, keywords, content)
      VALUES (
        'user-guide/4.4-managing-your-utilization-calendar',
        'Managing Your Freelancer Utilization Calendar',
        'Managing Your Utilization Calendar',
        'Track availability, manage bookings, and log project time in the ABRAM Utilization Calendar so producers see accurate, real-time freelancer schedules.',
        '{"ABRAM","ABRAM Network","freelancer","producer","calendar","ai","work package","scheduling","matchmaking","managing","utilization"}'::text[],
        '---
title: ''Managing Your Freelancer Utilization Calendar''
sidebarTitle: Managing Your Utilization Calendar
description: ''Track availability, manage bookings, and log project time in the ABRAM Utilization Calendar so producers see accurate, real-time freelancer schedules.''
keywords:
  - ABRAM
  - ABRAM Network
  - freelancer
  - producer
  - calendar
  - ai
  - work package
  - scheduling
  - matchmaking
  - managing
  - utilization
---
# Section 4.4: Managing Your Utilization Calendar

The **Utilization Calendar** (found under **Schedule** in the freelancer sidebar) is the central workspace for tracking availability, managing bookings, and logging project time. It allows you to visualize your schedule and ensures producers see accurate, real-time availability when querying the matchmaking engine.

---

## 1. Calendar Views & Navigation

The utilization calendar offers three layout formats to fit different planning needs:
* **Month View**: Provides a high-level grid mapping out monthly workloads. Each calendar cell shows daily utilization percentages, time-off banners, and color-coded event indicators.
* **Week View**: Focuses on weekly schedules. This is the main view for reviewing daily hour allocations, drag-and-drop rescheduling, and tracking weekly capacities.
* **Day View**: Shows a detailed, chronological list of meetings, personal events, and project work blocks for a single selected date.

### Calendar Settings
You can customize the calendar view by clicking the settings gear:
* **Start of Week**: Configure the calendar to begin weeks on either **Sunday** or **Monday**.
* **Filter Mode**: Toggle between viewing **All Events** (meetings, blockouts, personal) or filtering to focus strictly on **Project Work**.

### Privacy & Access Controls
* **Opaque "Busy" Blocks**: To protect client confidentiality and contractor privacy, when an organization manager or client views your calendar, any bookings for projects they do not own are redacted. They will display as solid **Busy** blocks with all titles, notes, and details hidden.
* **Read-Only View**: When other users view your calendar, it loads in a strict read-only mode. All event creation buttons, drag-and-drop handles, and editing dialogs are disabled.
* **Deep-Linking**: The calendar supports deep-linking via specific URL links. Clicking a calendar event link from a notification or email will load the calendar and automatically open the detailed review modal for that specific event.

---

## 2. Setting Blockouts and Event Types

To mark yourself as unavailable or record other commitments, click any day cell or click the **Add Event** (`+`) button to open the unified event settings window.

You can categorize your calendar events under four categories:
* **Time Off** *(Amber)*: Used to declare vacation, sick leave, or general unavailability. Events categorized as Time Off block out your capacity, notifying producers that you cannot accept work during these dates.
* **Personal** *(Teal)*: Standalone personal blocks. These act as soft blockouts where you are busy but can choose to override them if needed.
* **Meeting** *(Purple)*: Collaborative calls or syncs. These can link to specific projects and include invitees.
* **Project Work** *(Blue)*: Dedicated task execution blocks linked to your producer projects.

---

## 3. Booking Statuses

Calendar bookings operate under distinct statuses that reflect their confirmation states:
* **Tentative**: Proposed schedules or pending invitations. These hold hours on your schedule to prevent double-booking but are not officially committed.
* **Confirmed**: Active, scheduled engagements. Both you and the producer have agreed to this time block.
* **Declined**: Rejected invites. These do not count against your available capacity and are hidden from your active timeline.

---

## 4. Capacity Tracking & Hours Logged

ABRAM automatically calculates and displays utilization metrics at the top of your calendar:
* **Utilization Percentage**: Your total booked hours divided by your maximum weekly capacity (e.g., 30 booked hours / 40 max capacity = 75% utilization).
* **Tabbed Schedule Interface**:
  * **Calendar Tab**: The standard calendar view for managing bookings and visual schedules.
  * **Time Card Tab**: An embedded timesheet editor that lets you log your actual hours worked on each project directly on the Schedule page.
* **Planned vs. Actual Hours**:
  * **Planned Hours**: The hours allocated to you by project managers for specific work packages. These appear as all-day capacity holds.
  * **Actual Hours**: The actual hours you record on your time card.

---

## 5. Identifying & Resolving Conflicts

If your schedule overlaps, ABRAM triggers a conflict warning:

### Overlap Warnings
A conflict occurs when:
1. You have overlapping manual bookings scheduled for the same time.
2. The total planned hours across your active projects exceed your maximum weekly hours.

### Visual Warnings & Resolution
* **Alert Banners**: The calendar displays a red **Conflict Detected** banner at the top of the schedule.
* **Conflicts Panel**: Clicking the conflict banner opens the conflict details panel, listing the exact dates, hours, and overlapping events.
* **Resolution**: You can resolve conflicts by:
  * Dragging and dropping manual events to open slots on the calendar.
  * Opening the overlapping event and adjusting the start/end dates or reducing the planned hours.
  * Declining or rescheduling tentative invites that overlap with confirmed bookings.

---

## 6. Step-by-Step UI Navigation

Here are the exact clicks to manage your schedule and block out dates:

1. **Accessing the Calendar**: Click **Schedule** (or **Calendar**) in your sidebar to load your workspace.
2. **Switching Layouts**: Click the **Month**, **Week**, or **Day** buttons in the top-right toolbar to toggle views.
3. **Blocking Out Time Off**:
   * Click the **Add Event** (`+`) button in the top toolbar (or double-click the day cell directly).
   * In the event window, select **Time Off** from the event category dropdown.
   * Type a title (e.g., "Summer Vacation").
   * Enter the **Start Date** and **End Date** (or toggle **All Day**).
   * Click **Save Event**. The blockout appears immediately in amber, and the matchmaking engine will mark you as unavailable for those dates.
4. **Rescheduling an Event**:
   * On the **Week** or **Day** grid, hover over the event block until your cursor changes to a hand icon.
   * Click and drag the block to a new time or day, then release. The system updates the booking instantly.
5. **Managing Calendar Preferences**:
   * Click the **Gear Icon** next to the view selection buttons.
   * Toggle the **Start Week on Monday** checkbox.
   * Click the **Filter** dropdown to select **Project Work Only** to hide personal and meeting blocks.

---

## 7. Capacity Tracking Dashboard

For freelancers, the **Capacity Tracking** screen (found under **Capacity** in the freelancer sidebar) is a dedicated analytics and settings panel for managing weekly hours and manual bookings.

### Capacity Gauge & Weekly Hour Settings
* **Capacity Gauge**: Displays a visual ring representation of your current utilization for the selected week (e.g., "32 hrs booked out of 40 max capacity").
* **Base Weekly Hours**: Set your standard weekly availability (e.g., 40 hours/week) in profile settings.
* **Weekly Overrides**: If you have a busy week or planned time off, click **Edit Week Availability** to set custom maximum hours for that specific week (e.g., capping capacity at 20 hours for a holiday week). This immediately updates your availability status on the producer matchmaking engine.

### Timeline & List Views
* **List View**: Lists your bookings chronologically with search and filter capabilities (filter by *All*, *Confirmed*, *Tentative*, *Internal*, or *Producer Projects*).
* **Timeline View**: Visualizes your upcoming schedule on a linear capacity timeline, making it easy to spot gaps or over-commitments.

### Logging Manual Bookings
If you book work outside the ABRAM platform and want to reserve those hours to prevent matchmaking conflicts:
1. Click **Add Booking** (`+`).
2. Input the Booking Title, Producer Name, Date Range, and daily hours required.
3. Save the booking. These hours will be deducted from your available capacity pool, and producers will see you as busy.
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
        'user-guide/4.5-syncing-external-calendars',
        'Syncing Google and Outlook Calendars to ABRAM',
        'Syncing External Calendars',
        'Connect Google Calendar or Microsoft Outlook to ABRAM so external events sync into your availability and feed the AI matchmaking engine in real time.',
        '{"ABRAM","ABRAM Network","producer","calendar","ai","scheduling","permissions","matchmaking","syncing","external","calendars"}'::text[],
        '---
title: ''Syncing Google and Outlook Calendars to ABRAM''
sidebarTitle: Syncing External Calendars
description: ''Connect Google Calendar or Microsoft Outlook to ABRAM so external events sync into your availability and feed the AI matchmaking engine in real time.''
keywords:
  - ABRAM
  - ABRAM Network
  - producer
  - calendar
  - ai
  - scheduling
  - permissions
  - matchmaking
  - syncing
  - external
  - calendars
---
# Section 4.5: Syncing External Calendars

To ensure your availability is always up to date without manual entry, ABRAM supports real-time inbound calendar synchronization with **Google Calendar** and **Microsoft Outlook Calendar**. 

Once connected, any event added to your external calendar automatically updates your availability in ABRAM, preventing scheduling conflicts and ensuring the AI matchmaking engine has accurate data.

---

## 1. Setting Up the Integration

You can link your external calendars from the Settings page:
1. Navigate to **Settings** in the sidebar.
2. Select the **Connectors** tab.
3. Under **App Connectors**, you will see the integration widget.
4. Click **Connect** next to either **Google Calendar** or **Microsoft Outlook Calendar**.
5. Follow the authentication prompts to authorize ABRAM to view and synchronize your calendar events.

Once authorized, your active connection is established, and the platform registers a secure connection to listen for updates.

---

## 2. How Calendar Syncing Works

When you make changes to your external Google or Outlook calendars, updates appear in ABRAM within seconds.

### How it Works:
1. **Trigger**: You create, edit, or delete an event in Google Calendar or Outlook.
2. **Sync**: The calendar provider securely notifies ABRAM of the change.
3. **Update**: ABRAM updates your availability:
   * **No Duplicates**: Calendar entries are aligned to prevent duplicates.
   * **Clear Source**: Synced events are labeled with their source (Google or Outlook).
   * **Busy Blocks**: Events are cataloged as external commitments so producers know you are busy.
   * **Precise Timing**: Start/end times, timezones, and repeating schedules are synced.
4. **Deletion**: If you delete an event externally, the blockout is removed from ABRAM.

---

## 3. Real-Time Capacity & Privacy

### Event Title Privacy
> [!IMPORTANT]
> To protect your privacy, ABRAM **anonymizes** synced external event details. Producer users, managers, and AI matchmaking engines only see that you are "Busy" or "Blocked" during those hours. No personal event titles (e.g., "Doctor''s Appointment") or notes are visible to producers.

### Capacity Calculations
* **Immediate Recalculation**: As soon as an external event is written, your weekly capacity and remaining hours are updated.
* **Matchmaking Blockouts**: When a producer runs the AI matchmaking engine, the engine automatically sees your synced busy slots and factors them in. If an external booking leaves you with fewer than the required hours for a project slot, the engine will flag you as unavailable for that period.
* **All-Day & Recurring Blocks**: All-day events block out a standard 8-hour workday, and recurring events deduct from your capacity score for each repeating day.

---

## 4. Troubleshooting and Management

If your calendar events are not syncing, review these common troubleshooting steps:

### Re-Authenticating Connections
If you change your external password or revoke application permissions, the sync connection will break. 
1. Navigate to **Settings** > **Connectors**.
2. If a connection displays an error, click **Disconnect**.
3. Click **Connect** to re-authenticate with your provider and establish a fresh connection.

### Sync Reset
In rare cases, sync connections become invalid (e.g., if application credentials expire). When this happens, click **Re-Sync Now** in your settings to force a full, clean synchronization of your external calendar.

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
        'user-guide/4.6-team-management-dashboard',
        'Team Management Dashboard for Producer Scheduling',
        'Team Management Dashboard',
        'Use the ABRAM Team Management dashboard to schedule crew, monitor utilization, resolve booking conflicts, manage rosters, and reuse staffing templates.',
        '{"ABRAM","ABRAM Network","freelancer","producer","calendar","ai","work package","payout","crew","scheduling","billing","ledger","rsvp","team","management","dashboard"}'::text[],
        '---
title: ''Team Management Dashboard for Producer Scheduling''
sidebarTitle: Team Management Dashboard
description: ''Use the ABRAM Team Management dashboard to schedule crew, monitor utilization, resolve booking conflicts, manage rosters, and reuse staffing templates.''
keywords:
  - ABRAM
  - ABRAM Network
  - freelancer
  - producer
  - calendar
  - ai
  - work package
  - payout
  - crew
  - scheduling
  - billing
  - ledger
  - rsvp
  - team
  - management
  - dashboard
---
# Section 4.6: Team Management Dashboard

The **Team Management** dashboard (found under **Team Management** in the producer sidebar) is the operational command center for managing team member scheduling, tracking utilization, resolving scheduling conflicts, managing your roster, and building staffing templates.

---

## 1. Roster Tab

The **Roster** tab is the centralized directory for all personnel in your organization''s network, managing both registered on-platform users and external contacts.

* ** Roster Directory**: Every contact displays their name, contact details, member type (Individual vs. Company), location, tags, capabilities, and billing rates (Hourly and Day rates).
* **Roster Management**: Managers can manually add external crew contacts, edit rates and primary roles inline, or delete contacts.
* **On-Platform Sync**: Displays the member status:
  * **On-Platform**: Connected to a registered user account.
  * **External**: Unregistered contact with an email address. Managers can invite external crew to projects, prompting them to register on the platform.

---

## 2. Overview Tab

The **Overview** tab provides a real-time health check on your organization''s staffing and workforce utilization:

* ** Roster Metrics**:
  * *Active Roster Size*: Total registered and unregistered individuals and companies in your network.
  * *Average Utilization*: Overall booked capacity percentage across all staff.
  * *Pending Invitations*: Total outstanding project invites awaiting crew RSVP.
  * *Schedule Conflicts*: Total unresolved double-bookings, overcommitments, or capacity overages.
* **Roster People Grid**: Displays each team member (filtered to people only) with their primary role, division, department, and location. It shows:
  * **Aggregate Weekly Booked Hours**: Combined hours from all active bookings.
  * **Aggregate Weekly Capacity**: Maximum weekly hours configured for the individual.
  * **Utilization Gauge**: A color-coded progress bar representing the member''s aggregate utilization.
* **Utilization Details**: Clicking any row opens the details panel to inspect details, specific project assignments, and rates.

---

## 3. Calendar Tab

The **Calendar** tab renders a unified timeline mapping out the schedules of all personnel and resources:

* **Visual Timeline**: Displays every team member and resource as a row. Banners are color-coded based on booking categories (e.g., project work, time off, meetings, personal commitments, or kit reservations).
* **Folder Grouping**: Managers can organize the roster into folder groups (e.g., "Camera Department", "Grip & Electric") to filter the calendar view.
* **Drag-and-Drop Scheduling**: Block holds can be dragged to change start/end dates. If in a premium billing tier, the full drag-and-drop scheduler is enabled; otherwise, it operates in a read-only mode with upgrade triggers.
* **Direct Booking**: Double-clicking an empty slot on a team member''s row opens the booking editor to create a schedule hold or associate them with a work package.
* **Resource and Kit Support**: Toggle **Show Kits** to display equipment allocations and unified gear kits directly alongside personnel on the calendar.

---

## 4. Capacity Planning Tool

The Planning tab provides granular controls for analyzing and booking team hours:

### Capacity & Availability Rules

Capacity and availability are determined using the following rules:

1. **Weekly Capacity**:
   * **People**: Evaluates the team member''s configured total weekly hours. If not specified, it falls back to the default hours for their role (typically 8 hours per day over 5 days, totaling 40 hours per week). If no role is set, it defaults to 40 hours per week.
   * **Preferred Work Days**: Calculations distribute a contractor''s weekly hours evenly across their preferred work days (typically Monday through Friday). Non-preferred days (such as weekends) are skipped when spreading weekly hours, though single-day specific bookings on those off-days are still counted.
   * **Organization Capacity Scaling**: Availability percentages defined on organization membership profiles scale a team member''s total weekly capacity. For example, if a team member is mapped to an organization at 50% availability, their weekly capacity is scaled down by half.
   * **Resources**: Calculated based on the typical daily hours for that resource type over a standard 5-day week.
2. **Booked Hours**:
   * **People**: The total number of hours from confirmed or active project bookings during the target week.
   * **Resources**: The total number of hours allocated to active resource bookings during that time.
3. **Availability Status**:
   * **Busy**: Utilization is 100% or greater.
   * **Limited**: Utilization is between 75% and 99%.
   * **Available**: Utilization is less than 75%.

> [!NOTE]
> Utilization filters support three scopes: **All Utilization** (includes projects, meetings, personal, time-off), **Project Work Only**, and **Non-Project Only**.

### What-If Capacity Scenarios (Sandbox Simulation)

The Planning tab houses a **What-If Scenario Sandbox** allowing you to model and simulate the capacity impact of adding new project workloads before formally inviting crew or locking schedules:
* **Hypothetical Bookings**: Create a simulation draft by selecting a team member, inputting hypothetical hours per week, and specifying a target start/end date range.
* **Calculate Impact**: When you trigger the simulation, the system recalculates the organization''s average utilization, highlights the projected overbooked count, and generates dynamic alerts/warnings.
* **Visual Warnings**: Tables and charts highlight affected crew members. Color coding reflects capacity load:
  * 🟡 **Amber Highlight**: The member''s projected utilization is near capacity.
  * 🔴 **Red Highlight**: The member''s projected utilization is overcommitted.
* **Commit or Discard**: If the scenario is feasible, clicking **Apply Scenario** instantly commits and promotes the sandbox bookings into active project holds. Clicking **Reset** discards the simulation parameters and restores the live dashboard view.

---

## 5. Conflict Detection Panel

The **Conflicts** tab automatically flags scheduling issues across your entire roster:

### Overlap Detection Rules

Conflicts are automatically identified using the following rules:

* **Unavailable**: Flagged when a booking overlaps with a team member''s scheduled time-off. (Severity: *Critical*)
* **Overcommitment**: Flagged when the sum of a member''s planned weekly hours (timed clock-durations + spread weekday hours) exceeds their weekly capacity. (Severity: *Warning* if over capacity; *Critical* if exceeding capacity by > 20%)
* **Hard Clock-Time Conflict**: Flagged when two timed (non-all-day) bookings on the same day overlap in clock time. (Severity: *Critical*)
* **Back-to-Back Overload**: Flagged when a member has more than 8 hours of timed bookings scheduled on a single day. (Severity: *Warning*)
* **Resource Overallocation**: Triggered when the total allocated quantity of a resource (e.g., cameras, studios) exceeds its maximum available quantity on a given day. (Severity: *Critical*)

### Conflict Resolution

Each conflict card details the overlap (severity, dates, conflicting projects) and provides a **Resolve** button to open the booking editor, reduce hours, change dates, or assign an alternative crew member.

---

## 6. Team Templates

The **Templates** tab allows designing reusable staffing blueprints for standard project types (e.g., "Standard Commercial Shoot").

### Blueprint Structures

* **Template Structure**: Includes the template name, description, category, and target organization.
* **Role Slots**: Configured with the role name, typical billing rate, weekly hours, and an optional default team member.
* **Import from Past Crew**: Allows creating a template instantly by copying the team structure of a previously completed project.
* **Instantiate Crew**: Applying a template to a project creates role slots for the crew. When these roles are accepted, scheduling holds or bookings are automatically generated and distributed across the project or work package duration.

---

## 7. Hours & Timesheet Verification

The **Hours** tab is the timesheet auditing center:

### Timesheet Auditing & Variance

Freelancers log hours on the platform. The system aligns these entries with scheduled project bookings to show the difference:

* **Logged Hours**: Actual hours worked submitted by the freelancer.
* **Planned Hours**: Expected hours based on scheduling bookings.
* **Variance**: The difference between logged hours and planned hours.
  * **Positive Variance**: Green badge showing extra hours worked over the plan.
  * **Negative Variance**: Amber badge showing fewer hours worked than planned.

### Administrative & Non-Project Entries

* **Nullable Projects**: Time entries support logging without a specific project associated, enabling team members to log administrative overhead or internal meetings.
* **Work Order Completion Auto-population**: When a Work Order status is changed to **Wrapped** or **Completed** by a manager, timesheet entries are automatically populated for all assigned personnel, calculating daily hours from scheduled booking durations.
* **Actual Cost Rollup**: Any manual or auto-populated timesheet or expense entry automatically rolls up and updates the project work package''s actual spend in real time.
* **Approval Flow**: Managers verify, edit, or delete logged hours. Approved hours sync directly to the billing ledger to execute payouts.
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
        'user-guide/5.1-freelancer-stripe-setup',
        'Freelancer Stripe Express Onboarding and Payouts',
        'Freelancer Stripe Express Setup',
        'Onboard solo freelancers and prime freelancer orgs to Stripe Express on ABRAM, verify identity, and configure bank accounts or debit cards for payouts.',
        '{"ABRAM","ABRAM Network","stripe","freelancer","producer","ai","brief","payout","invoice","permissions","onboarding","billing","express","setup"}'::text[],
        '---
title: ''Freelancer Stripe Express Onboarding and Payouts''
sidebarTitle: Freelancer Stripe Express Setup
description: ''Onboard solo freelancers and prime freelancer orgs to Stripe Express on ABRAM, verify identity, and configure bank accounts or debit cards for payouts.''
keywords:
  - ABRAM
  - ABRAM Network
  - stripe
  - freelancer
  - producer
  - ai
  - brief
  - payout
  - invoice
  - permissions
  - onboarding
  - billing
  - express
  - setup
---
# Section 5.1: Freelancer Stripe Express Setup

This guide explains how solo freelancers and prime freelancer organizations onboard to **Stripe Express** through the ABRAM Network to verify their identity and configure bank accounts or debit cards for payout routing.

---

## 1. Overview of Stripe Express Onboarding

ABRAM uses Stripe Connect (Express) to route invoice payments securely and directly to freelancers. When a producer pays an invoice or authorizes a Purchase Order (PO), Stripe splits the platform processing fee and immediately routes the remaining funds to the freelancer''s connected bank account or debit card.

> [!IMPORTANT]
> - **Onboarding is mandatory** to receive automatic payouts.
> - If you have not completed Stripe setup, invoices can still be saved locally and sent, but payment routing will only activate once onboarding is complete.
> - Solo freelancers onboard as **Individuals**; agencies, studios, or production companies onboard as **Companies**.

### Onboarding Payout Safety Net
If a contractor has not completed their Stripe onboarding, clients can still pay their invoices. The system automatically processes the client''s payment and holds the funds securely on the ABRAM platform account. Once the contractor completes their Stripe setup, the platform automatically releases and routes the held funds to the contractor''s connected bank account.

---

## 2. Step-by-Step Setup Instructions

### Step 1: Navigate to Financials
1. Log in to your ABRAM freelancer workspace.
2. In the left navigation sidebar, click on **Financials**.
3. Under the **Overview** tab or the **Payouts** tab, look for the **Payout Setup** (or **Organization Payout Setup**) widget.

### Step 2: Initialize Stripe Account Creation
1. Click **Get Started** on the setup card.
   * *Note: Only users with Financial Management permissions (Owners and Admins for organizations) can initiate this setup.*
2. ABRAM will securely register your profile with Stripe in the background. A loading spinner will appear briefly.
3. You will be redirected automatically to the Stripe-hosted onboarding wizard in the same browser tab.

### Step 3: Complete the Stripe Express Form
On the Stripe-hosted onboarding portal, you must provide:
1. **Verification Details**: Enter your phone number and email to receive a Stripe verification code.
2. **Business Details**:
   * **Individual / Sole Proprietor**: Provide legal name, SSN (or tax ID), and date of birth.
   * **Company (Studio/Agency)**: Provide legal entity name, EIN, and business address.
3. **Payout Destination**: Enter your Bank Account details (Routing and Account Number) or link a Debit Card for instant payouts.

### Step 4: Verification and Return to ABRAM
1. Once you review and submit your details, Stripe will redirect you back to the ABRAM Financials page.
2. ABRAM will automatically retrieve and update the setup status.
3. Your Payout Setup card will update to show your active status.

---

## 3. Understanding Account Statuses

The **Stripe Connect Status** card indicates your verification state:

| Status | Charges | Payouts | Verification | Explanation | Action Required |
| :--- | :---: | :---: | :---: | :--- | :--- |
| **Active** (Green) | Enabled | Enabled | Submitted | Your account is fully configured. | None. You can receive automated payouts. |
| **In Review** (Amber) | Pending | Pending | Submitted | Stripe is verifying your documents. | Wait 24–48 hours, or check Stripe for alert notices. |
| **Setup Required** (Violet) | Pending | Pending | Required | Onboarding is incomplete or failed. | Click **Complete Setup** / **Continue Setup** to finish. |

> [!WARNING]
> If Stripe is unable to verify your identity with the initial details provided, your status will show **Setup Required** or **In Review**. Stripe may request additional documentation (e.g., a photo of a government-issued ID). Click **Continue Setup** to upload these directly to Stripe.

---

## 4. Managing Your Stripe Dashboard

Once your Stripe Connect account status is **Active**, the setup button changes to **Open Stripe Dashboard** (or **Open Organization Dashboard**).

Clicking this button takes you to Stripe Express where you can:
* View pending and historical payout transfers.
* Track the exact arrival date of payouts in transit.
* Update your bank account or debit card information.
* View and download annual tax documents (such as Form 1099-NEC).

---

## 5. Multi-Organization Context (Prime Freelancers)

If your user account is an Owner or Admin of a registered Production Company organization:
* **Org-Bound Setup**: ABRAM binds Stripe Connect accounts to organizations rather than individual users. Setting up Stripe here configures the bank account for the entire organization''s billings.
* **Role Restrictions**: Only organization members with financial permissions can start onboarding. Standard team members will see a read-only message: *"Only organization owners or authorized admins can manage Stripe setup."*
* **Personal vs. Organization View**: If you operate as both an individual freelancer and run a company, you can toggle between your **Personal** and **Organization** payout balances on the **Payouts** tab. Ensure you configure Stripe for both if you expect payments in both roles.

### Payout Destination Resolution
When a producer pays an invoice, the platform automatically routes the payout to the contractor''s correct connected Stripe account using a strict priority order:
1. **Payee Organization**: If the invoice is billed by an organization, the funds are routed directly to that organization''s Stripe account.
2. **Contractor Workspace Ranking**: If the invoice is billed by an individual contractor, the system resolves the organizations owned by that contractor and routes the payout to the most appropriate business account based on their organizational roles (favoring corporate production company accounts first, followed by contractor company accounts, and falling back to personal setups).
3. **Submitter Fallback**: If no organizational accounts can be resolved, the payout is routed to the individual Stripe account of the member who submitted the invoice.
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
        'user-guide/5.2-invoicing-and-payouts',
        'Invoicing, Purchase Orders, and Freelancer Payouts',
        'Invoicing and Payouts',
        'Generate invoices, manage producer checkout authorizations, approve Purchase Orders, and track Stripe payouts to freelancers across the ABRAM Network.',
        '{"ABRAM","ABRAM Network","stripe","freelancer","producer","ai","payout","invoice","billing","invoicing","payouts"}'::text[],
        '---
title: ''Invoicing, Purchase Orders, and Freelancer Payouts''
sidebarTitle: Invoicing and Payouts
description: >-
  Generate invoices, manage producer checkout authorizations, approve Purchase
  Orders, and track Stripe payouts to freelancers across the ABRAM Network.
keywords:
  - ABRAM
  - ABRAM Network
  - stripe
  - freelancer
  - producer
  - ai
  - payout
  - invoice
  - billing
  - invoicing
  - payouts
---
# Section 5.2: Invoicing and Payouts

This guide covers the lifecycle of generating invoices, managing producer checkout authorizations, approving Purchase Orders (POs), and tracking payouts in the ABRAM Network.

---

## 1. The Invoicing Lifecycle

In the current **Management Phase**, ABRAM supports two distinct billing scenarios:

<InvoicingFlowchart />

---

## 2. Generating Professional Invoices (Freelancers)

Freelancers can generate invoices linked to projects or select ad-hoc producer entities:

### Step 1: Access the Invoice Builder
1. Go to **Financials** -> **Invoices** tab.
2. Click **Create Invoice** to open the builder.

### Step 2: Configure Invoice Details
* **Title & Subtitle**: Provide a descriptive title (e.g., *"Post-Production Services — Season 1"*) and subtitle describing the scope.
* **Bill To**: Search and select the producer organization or individual. If you link a project, the builder automatically pre-populates this with the project''s producer org.
* **Link Project**: Optional. Allows you to link the invoice to an active project. If your project has a contract rate (proposed rate in the platform invitation), the builder pre-populates the default line item with that rate.
* **Import Expenses**: If you have unbilled project expenses submitted and approved on ABRAM, they will appear in a sidebar. Check them to instantly append them as line items.

### Step 3: Add Line Items
* Enter the **Description**, **Quantity**, and **Unit Price** for each item. 
* The system calculates the row totals and subtotal automatically.

### Step 4: Fees and Taxes Preview
ABRAM calculates fees in real time:
* **Platform Fee**: A flat **5% Payment Processing Fee** is calculated on the subtotal.

### Step 5: Save or Send
* **Save Draft**: Saves the invoice locally. You can edit or delete drafts at any time.
* **Send Invoice**: Changes the status to **Sent** (Awaiting Payment) and updates the billing details on Stripe. The producer receives an email notification with a secure payment link.

---

## 3. Producer Purchase Orders & Checkout Sessions

Producers can proactively initiate payments by creating a **Purchase Order (PO)** from their dashboard.

### Step 1: Create a PO
1. In the **Financials** tab, click **Create Purchase Order**.
2. Select the freelancer or freelancer organization to pay, input the title, and add the line items.

### Step 2: Authorize Payment (Stripe Checkout)
1. Click **Authorize Payment**.
2. You will be redirected to a Stripe Checkout Session to provide card or bank details.
3. The platform places a **7-day authorization hold** on your payment method.
4. Once authorized, you are redirected back to ABRAM. The invoice status transitions to **Pending Freelancer Approval**.

---

## 4. Freelancer PO Approval Flow

When a producer authorizes a Purchase Order, the freelancer must accept it before funds are captured.

### Step 1: Locate the Actionable PO
1. In your **Financials** tab, go to **Invoices**.
2. Search for items marked with the **Action Required** badge (**Pending Freelancer Approval** status).
3. Click the row to open the inline details.

### Step 2: Accept or Reject
* **Accept Purchase Order**:
  * Triggers the payment fulfillment.
  * ABRAM securely processes the transaction to complete the payment.
  * The authorized funds are captured and transferred to your account.
  * The invoice status transitions to **Paid**, and audit logs are recorded.
* **Reject**:
  * The authorization hold is released immediately.
  * The invoice status changes to **Cancelled/Rejected**.

---

## 5. Generating and Downloading PDFs

At any stage of the lifecycle:
1. Click on any invoice in your history to open the **Inline Detail View**.
2. Click the **Download PDF** icon in the header.
3. The system generates a print-ready, professional document containing your logo, producer address, line items, and a summary breakdown (Subtotal, 5% processing fee, and Total).

---

## 6. Tracking Payouts

Freelancers and Organizations can track their earnings on the **Payouts** tab of the Financial Command Center:

### Metric Cards
* **Total Earnings**: The total value of all paid invoices since account creation.
* **Total Payouts**: Funds successfully transferred to your bank/debit card.
* **Pending**: Funds currently held by Stripe or in transit to your bank.
* **Available**: Cleared funds ready for manual transfer.

### Requesting a Payout
If you have a positive **Available Balance**:
1. Click **Request Payout**.
2. Enter the amount to transfer (minimum $10.00).
3. Click **Confirm**. Stripe Express will schedule the transfer. You can trace its progress and estimated arrival date under **Payout History**.

### Payout Routing & Onboarding Safety Net
When payouts are executed, the system automatically routes them using the following rules:
* **Routing Priority**: Payouts are routed to the contractor''s primary organization Stripe account. If the contractor belongs to multiple organizations, the platform routes the payout to the most appropriate business account based on their organizational roles.
* **Onboarding Safety Net**: If you have not completed Stripe onboarding, clients can still pay your invoices. The platform temporarily holds the payment securely on the platform account. Once you complete your Stripe setup, the platform automatically releases and transfers the held funds to your connected bank account.
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
        'user-guide/5.3-billing-ledger-and-ai-credits',
        'Billing Ledger and AI Credit Consumption in ABRAM',
        'Billing Ledger and AI Credits',
        'How ABRAM calculates and meters AI credits, how the organization-bound billing ledger tracks usage, and how producer features unlock by balance.',
        '{"ABRAM","ABRAM Network","stripe","producer","calendar","ai","brief","onboarding","billing","ledger","matchmaking","credits"}'::text[],
        '---
title: ''Billing Ledger and AI Credit Consumption in ABRAM''
sidebarTitle: Billing Ledger and AI Credits
description: >-
  How ABRAM calculates and meters AI credits, how the organization-bound
  billing ledger tracks usage, and how producer features unlock by balance.
keywords:
  - ABRAM
  - ABRAM Network
  - stripe
  - producer
  - calendar
  - ai
  - brief
  - onboarding
  - billing
  - ledger
  - matchmaking
  - credits
---
# Section 5.3: Billing Ledger and AI Credits

This guide explains how AI credits are calculated, structured, and consumed in the ABRAM Network. It details how the organization-bound ledger works and how producer features are gated based on credit balances.

---

## 1. The AI Credit Concept

ABRAM meters and bills all user-initiated AI actions—such as parsing resumes, extracting project skills, matching candidates, or analyzing project briefs.

---

## 2. Typical Credit Costs & Caching

Credit consumption is calculated based on the complexity of the operation and length of text or data processed. This ensures that you only pay for the resources required to process your request.

| Feature / Action | Billing Model | Typical Cost / Range |
| :--- | :--- | :--- |
| **Project Brief Analysis** | Based on brief size & details | 5 - 25 credits per analysis |
| **AI Team Matchmaking Suggestions** | Based on scope size & candidate count | 5 - 20 credits per suggestion |
| **Resume & Profile Importing** | Based on resume file size | 2 - 10 credits per import |
| **Chatbot Co-pilot Interaction** | Per query/response | 0.5 - 5 credits per message |
| **Web Search Tool** | Based on query & results size | 1 - 5 credits per search |
| **Image Generation** | Based on resolution & quality | 5 - 15 credits per image |

> [!NOTE]
> **Smart Query Optimization** automatically reduces credit usage. If you repeat similar queries or ask follow-up questions within the same context (e.g. refining a project brief or candidate list), the platform reads from memory at a fraction of the standard credit cost, saving your organization credits.

<AgentOnly>Prompt cache reads are billed at a highly discounted rate (~10% of standard), while cache writes are billed at ~125% of standard input rates.</AgentOnly>

---

## 3. The Three-Pool Credit Structure

Every organization''s ledger is divided into three distinct credit pools. When credits are deducted, they are drawn in a strict priority order:

<ProgressFlow steps={[
  { 
    title: "1. Monthly Allowance", 
    description: "Included in your subscription tier. Reset monthly; unused balance does not roll over.", 
    icon: "Calendar", 
    status: "active" 
  },
  { 
    title: "2. Trial Credits", 
    description: "Awarded during onboarding. Valid until active trial timeframe expires.", 
    icon: "Award", 
    status: "pending" 
  },
  { 
    title: "3. Purchased Balance", 
    description: "Top-up credits bought via Stripe. Never expires, drawn last.", 
    icon: "Coins", 
    status: "pending" 
  }
]} />

1. **Monthly Allowance**: Included in your subscription tier (e.g., Team, Studio). Drawn first. It resets every month; unused allowance does not roll over.
2. **Trial Credits**: Awarded during onboarding. Drawn second. Only valid if the trial is still active and has not expired.
3. **Purchased Balance**: Top-up credits bought via Stripe. Drawn last. Purchased credits never expire.

**Sign-Up Credit Bonus**: New personal accounts and organizations are automatically initialized with a one-time welcome bonus of 250 credits in their purchased balance pool.

---

## 4. Organization-Bound Billing

* **Organization-Bound Billing**: All billing ledgers are bound to organizations. Solo users are billed through their personal organization workspace.
* **Membership Routing**: If a user belongs to an active organization membership, the organization''s ledger is billed.
* **Onboarding Exception**: AI calls made during the onboarding wizard (e.g., parsing your initial resume when setting up your profile) are free and bypass the ledger.
* **Dynamic Seat Scaling**: For organizations on the **Team** or **Studio** tiers, your monthly AI credit allowances scale dynamically based on the number of team seats purchased (for example, on the Team tier, each seat adds 500 monthly credits). Workspace storage limits are fixed workspace pools (10 GB for Team, 15 GB for Studio) and do not scale with additional seats.

---

## 5. Credit Gating (Example: Project Brief Analysis)

When a producer uploads a project brief for AI analysis, the platform follows this verification sequence:

1. **Credit Check**: The platform verifies that your organization has enough credits (at least 5 credits) in its active pools.
2. **Analysis Execution**: If credits are available, the analysis engine parses the brief to extract scope details and roles.
3. **Ledger Update**: The actual credits consumed are deducted from your balance once the analysis is completed.
4. **Insufficient Balance Alert**: If your balance is below the minimum required, the analysis is paused, and a checkout window appears to add top-up credits.

### Disconnect Safety Net
If a network disconnect or timeout occurs during an analysis, the platform ensures your ledger is only billed for the work actually completed.

---

## 6. Upgrading Plans and Buying Credits

Owners and Admins can purchase additional credits or upgrade plan tiers in **Settings** -> **Billing**:

### Buying Ad-Hoc Top-Ups
If your balance runs low, you can click **Top-Up** to purchase credit packs. This opens Stripe Checkout to securely process the purchase, and updates your balance immediately.

### Individual Subscription Tiers
ABRAM offers individual subscription tiers for solo professionals who do not require multi-user team collaboration:
* **Solo Lite ($19/mo)**: Unlocks 300 monthly credits, unlimited active projects (for clients), 30 applications/listings, and 3 GB workspace storage.
* **Solo Pro ($34/mo)**: Unlocks 600 monthly credits, PDF call sheet exports, Google/Outlook calendar sync, AI brief parser, and 10 GB workspace storage.

### Upgrading a Personal Workspace
If you are currently on the **Free** tier in a personal workspace and select a team subscription (e.g., **Team** or **Studio**):
1. **Workspace Promotion**: The platform launches a coordinated flow prompting you for your Company Name and Team Size.
2. The platform automatically promotes your personal workspace to a full **Organization**.
3. You are redirected to Stripe Checkout to set up the subscription.
4. Once completed, your organization''s Monthly Allowance is active, and team seat limits are updated.
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
        'user-guide/6.4-resend-email-integration',
        'Section 6.4: Resend Email Integration',
        'Resend Email Integration',
        'Sync subscribers, manage audiences, and broadcast newsletter updates directly from the CMS admin dashboard.',
        '{"ABRAM","Email Newsletter","Resend","Sync Contacts","Broadcast Campaign"}'::text[],
        '---
title: "Section 6.4: Resend Email Integration"
sidebarTitle: "Resend Email Integration"
description: "Sync subscribers, manage audiences, and broadcast newsletter updates directly from the CMS admin dashboard."
keywords:
  - ABRAM
  - Email Newsletter
  - Resend
  - Sync Contacts
  - Broadcast Campaign
---

# Resend Email Integration

The platform includes a built-in integration with the email delivery service to help you manage mailing lists and broadcast announcements directly from your administration dashboard.

## Overview of Features

The email integration streamlines marketing and release communications:
- **Automatic Subscriber Collection**: Collects public newsletter signups and synchronizes them with your central contact directory.
- **Manual Contact Additions**: Admins can manually register subscribers from the administration interface.
- **Automated Broadcasts**: Trigger email newsletter notifications to your general segment whenever a new article or release note is marked as Published.
- **Delivery Status & Safety**: Monitors email delivery status and handles bounces to preserve your domain’s sending reputation.

---

## Managing Subscribers

Subscriber management is centralized to keep your mailing list accurate:

### 1. Public Signup Form
Visitors can subscribe to your updates by submitting their email address and name through the public newsletter form on the site.

### 2. Manual Administration Entries
If you need to add a contact manually:
1. Navigate to the **Administration Dashboard**.
2. Select the **Subscribers** view.
3. Click **Add Subscriber**, enter the contact’s email address, and save.

---

## Broadcasting Newsletter Campaigns

When publishing content, you can easily notify your audience:

### Blog Post Announcements
Publishing a new article triggers a clean, editorial email to all active contacts. The email layout showcases the title, the summary, and a direct link to read the full post.

### Release Note Changelogs
Publishing release notes automatically triggers a formatted changelog broadcast containing the version number, update list, and links to the documentation center.

---

<AgentOnly>

## 🤖 Agent Operations, Technical Architecture, and API Keys

This section provides technical specs, database mapping, and integration details for LLM web-crawlers and agents.

### API Key Security Configuration
The service requires the `RESEND_API_KEY` configuration. To safeguard this key:
- It is stored server-side only in `.env.local` as `RESEND_API_KEY` and is never exposed to client-side bundles (no `NEXT_PUBLIC_` prefix).
- A safe client retrieval function `getResendClient` in [resend.ts](file:///Users/connorthomas/Documents/Development%20Projects/GitHub/ABRAM-DOCS/src/utils/resend.ts) ensures that missing credentials do not crash page rendering or static builds.

### Database Tables Schema
The system maps tracking logs and subscriber profiles using the following relational tables in the platform:
- `public.subscribers`: Stores subscriber profiles, status values (`subscribed`, `unsubscribed`, `bounced`), and references the ID from the email service.
- `public.campaigns`: Logs campaign status (`draft`, `sending`, `sent`, `failed`) and stores campaign statistics.
- `public.campaign_logs`: Logs transactional events (`email.delivered`, `email.bounced`, `email.opened`, `email.clicked`) returned via webhook callbacks.

### Resend Webhook Callbacks
Webhook notifications are routed to `/api/webhooks/resend`. This endpoint parses events:
- **Bounce/Complaint**: Catches `email.bounced` and updates the contact''s database status to `bounced` to preserve domain reputation.
- **Success/Delivery**: Tracks deliveries and opens to measure campaign performance.

</AgentOnly>
'
      ) ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        sidebar_title = EXCLUDED.sidebar_title,
        description = EXCLUDED.description,
        keywords = EXCLUDED.keywords,
        content = EXCLUDED.content,
        updated_at = now();
    

      