INSERT INTO public.help_docs (slug, title, sidebar_title, description, keywords, content)
      VALUES (
        'user-guide/3.7-call-sheets',
        'Section 3.7: Call Sheets',
        'Call Sheets',
        'Build, preview, and send call sheets from your project, with autofill helpers and crew distribution.',
        '{"ABRAM","call sheets","production schedule","crew distribution"}'::text[],
        '---
title: "Section 3.7: Call Sheets"
sidebarTitle: Call Sheets
description: Build, preview, and send call sheets from your project, with autofill helpers and crew distribution.
keywords:
  - ABRAM
  - call sheets
  - production schedule
  - crew distribution
---

# Call Sheets

Call sheets bring together your locations, schedule, and personnel call times into a single document you can preview and share with your crew.

## Where to find call sheets

Open a project and go to the **Call Sheets** tab. From there you can start a new call sheet from scratch, or create one directly from a work order — which carries over that work order''s crew, resources, and location so you don''t have to re-enter them.

## Building a call sheet

The call sheet builder is organized into a few sections:

- **General Info** — the core details for the day.
- **Locations** — where the day''s work is happening.
- **Production Schedule / Scenes** — your shooting or work schedule, including eighths-of-a-page counts for scenes.
- **Personnel Calls** — individual call times for each crew member.
- **Department Notes** — notes for specific departments.

### Helpers to speed things up

- **Autofill Project** pulls in details already on file for the project, so you don''t have to retype information you''ve already entered elsewhere.
- **AI Auto-Fill** drafts the call sheet for you, giving you a starting point you can review and adjust.

## Previewing and exporting

Once your call sheet is built, open the preview to see how it will look. From the preview you can:

- **Print** the call sheet.
- **Edit** to go back and make changes.

A call sheet can also link to an existing work order, or auto-create one if it doesn''t have one yet.

## Sending the call sheet

You can send the call sheet to your crew by selecting recipients from your project crew list, adding external email addresses, or a combination of both.

## Plan requirements

On the Free and Solo Lite plans, call sheets are watermarked with "Powered by ABRAM," and you can''t export a clean PDF or email the sheet to your crew. Watermark-free PDF export and sending call sheets directly to crew require a Solo Pro plan or higher.
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
        'user-guide/3.8-deliverables-review-and-approval',
        'Section 3.8: Deliverables — Review & Approval',
        'Deliverables',
        'Walk through the full deliverable lifecycle in ABRAM — creating, assigning, submitting work, and getting it reviewed and approved.',
        '{"ABRAM","deliverables","review","approval","feedback","revisions","client portal","work package"}'::text[],
        '---
title: ''Section 3.8: Deliverables — Review & Approval''
sidebarTitle: Deliverables
description: ''Walk through the full deliverable lifecycle in ABRAM — creating, assigning, submitting work, and getting it reviewed and approved.''
keywords:
  - ABRAM
  - deliverables
  - review
  - approval
  - feedback
  - revisions
  - client portal
  - work package
---
# Section 3.8: Deliverables — Review & Approval

A deliverable is a single piece of work someone owes the project — a document, a cut, a design file, or a link to work stored elsewhere. This guide walks through the full lifecycle: creating a deliverable, assigning it, submitting work against it, and moving it through feedback to approval.

---

## 1. Creating a Deliverable

Add a deliverable by giving it a name. From there, you can optionally connect it to other deliverables in the project using two relationship types:

* **Blocks**: This deliverable must be finished before the linked one can move forward.
* **Relates To**: A looser connection for deliverables that are related but not strictly dependent on each other.

These relationships feed the dependency view described below, so it''s worth setting them up if your deliverables have a natural order.

---

## 2. Assigning Work

A deliverable isn''t limited to a single owner — you can add multiple assignees to the same deliverable, and each one gets their own allocated hours. This is useful when a deliverable is a shared effort rather than one person''s task.

To help you pick the right people, ABRAM can suggest recommended assignees, each shown with a confidence indicator so you can gauge how strong a fit the suggestion is before you commit to it.

Every change to who''s assigned is kept in an assignment history, so you can look back and see who was added or removed from a deliverable and when.

---

## 3. Submitting Work

Once assigned, a contributor submits their work directly on the deliverable. Two submission types are supported:

* **File upload**: Upload a PDF or Word document.
* **Reference links**: Attach one or more links pointing to work hosted elsewhere (for example, a cut stored in Frame.io).

Every time a new submission comes in, it''s saved as a new version — a revision counter increases with each round, so nothing overwrites the previous attempt and everyone can see how the work has evolved.

---

## 4. Feedback & Approval

Reviewers respond to a submission with a typed feedback entry. Each entry is one of three types:

* **Approve**: The submission is accepted.
* **Request Revision**: The submission needs changes before it can be approved.
* **Reject**: The submission is turned down.

Feedback entries can optionally be time-coded, which is useful for pointing to a specific moment in a video or audio submission rather than describing it in words.

Alongside formal feedback, every deliverable has a comment thread that supports @mentions to pull in specific teammates. Comments are clearly separated into client comments and internal comments, so your team''s internal back-and-forth stays distinct from anything a client has said.

---

## 5. Organizing & Tracking Deliverables

A few tools help keep larger deliverables — or a large batch of them — manageable:

* **Checklist sub-tasks**: Break a deliverable down into smaller checklist items to track partial progress.
* **Dependency view**: See how deliverables connect to each other based on the Blocks and Relates To relationships you set when creating them.
* **Portal visibility toggle**: Control whether a specific deliverable is shown or hidden in a connected Client Portal.
* **Activity feed**: See a running history of what''s happened on the deliverable.
* **Bulk actions**: Select several deliverables at once to assign them, set dependencies, update their status, or link them to a milestone in one step.

---

## 6. What Your Client Sees

If a deliverable''s portal visibility toggle is turned on and it belongs to a project shared with a Client Portal, your client can open it, review the submission, and leave comments of their own. Their comments show up in the same thread, tagged separately from your team''s internal comments.

For a full walkthrough of setting up and managing client access, see [Section 6.4: Client Portal](/user-guide/6.4-client-portal).

---

## 7. Related Guides

* [Section 3.2: Work Packages & Milestones](/user-guide/3.2-work-packages-and-milestones) — how deliverables fit into the larger project structure
* [Section 3.4: Task Lists & Tracking](/user-guide/3.4-task-lists-and-tracking) — tracking deliverables alongside milestones and work orders
* [Section 6.4: Client Portal](/user-guide/6.4-client-portal) — sharing deliverables with clients for review
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
        'user-guide/4.1-internal-talent-search',
        'Internal Talent Search and Private Crew Roster',
        'Internal Talent Search',
        'Search your private ABRAM Crew Roster under Team Management to find vetted producers, freelancers, and production companies you regularly work with.',
        '{"ABRAM","ABRAM Network","freelancer","producer","ai","crew","talent search","internal","talent","search"}'::text[],
        '---
title: ''Internal Talent Search and Private Crew Roster''
sidebarTitle: Internal Talent Search
description: ''Search your private ABRAM Crew Roster under Team Management to find vetted producers, freelancers, and production companies you regularly work with.''
keywords:
  - ABRAM
  - ABRAM Network
  - freelancer
  - producer
  - ai
  - crew
  - talent search
  - internal
  - talent
  - search
---
# Section 4.1: Internal Talent Search

In the current **Management Phase**, the marketplace-wide public talent directory ("Discover") is disabled. Instead, ABRAM operates as an internal production management platform where producers manage their own curated team of professionals.

To find, search, and manage your team, navigate to **Team Management** in the producer sidebar and select the **Roster** tab. This page serves as your organization’s private talent directory (Crew Roster), where you can coordinate individuals and production companies you work with.

---

## 1. Browsing the Crew Roster

The Roster tab presents a spreadsheet-style grid containing all your active team members, including both on-platform freelancers and external freelancers who have not yet signed up.

The roster displays key information for each member:
* **Name & Contact**: First and last name (or company name), initials, and email address.
* **Type**: Categorized as **Individual** or **Company**.
* **Roles**: Custom primary roles assigned to the freelancer.
* **Location**: Their physical base of operations.
* **Hourly / Day Rates**: Configured rates for project budget estimations.
* **Status**: Status indicator showing whether they are registered on the platform (**On ABRAM**) or remain an **External** contact.

---

## 2. Searching and Filtering Roster Members

To quickly find team members with specific capabilities or rates, use the filters at the top of the roster:

### 1. Keyword Search
Type in the search bar to filter by:
* First or last name
* Company name
* Email address
* Location
* Primary roles

### 2. Status Filters
Use the **All Status** dropdown to filter by:
* **On ABRAM**: Shows only members who have active accounts on the platform.
* **External Only**: Shows contacts you have added to your roster but who have not registered an account yet.

### 3. Role-Based Filters
Click the **All Roles** dropdown to filter the view down to specific roles that exist within your roster (e.g., *Director*, *Cinematographer*, *Gaffer*, *Editor*). This list updates dynamically based on the roles present in your roster.

### 4. Location Filters
Click the **All Locations** dropdown to filter by geographical region (e.g., *Los Angeles*, *New York*, *London*).

---

## 3. Sorting and Ordering the Roster

You can sort any column in ascending or descending order by clicking on the column headers:
* **Name & Contact**: Sort alphabetically by name or company name.
* **Type**: Group by individual vs. production company.
* **Roles**: Sort alphabetically by their primary role.
* **Location**: Sort alphabetically by location.
* **Hourly / Day Rate**: Sort numerically to find the most cost-effective resources or senior specialists.
* **Status**: Group by registered (On ABRAM) vs. external contacts.

---

## 4. Inline Editing and Roster Curation

Producers have the ability to curate roster details directly within the spreadsheet grid. These settings are private to your organization and do not alter the freelancer''s public profile:

* **Edit Roles**: Click on the roles cell of any crew member, type new roles (comma-separated), and press `Enter` (or click away) to save.
* **Edit Hourly Rate / Day Rate**: Click on the rate cell, input the custom rate, and press `Enter` to save.

---

## 5. Manually Adding Crew Members

If you work with freelancers who are not yet on ABRAM, you can add them to your private roster manually:

1. Click **Team Management** > **Roster** and select **Add Crew Member** (or use the Add button).
2. Choose the profile type: **Individual** or **Production Company**.
3. Fill in their details:
   * **Name / Company Name**
   * **Email Address** *(required for sending future invitations)*
   * **Phone Number** and **Location** *(optional)*
   * **Hourly Rate** and **Day Rate** *(used for project planning)*
   * **Primary Roles** and **Capabilities / Skills** *(comma-separated lists)*
   * **Notes** *(internal-only notes visible to your agency/studio)*
4. Click **Save** to add them to your roster. They will appear as an **External** contact until you invite them to the platform.
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
        'user-guide/4.2-ai-matchmaking-suggestions',
        'AI Crew Matchmaking: Smart Suggestions for Projects',
        'AI Matchmaking Suggestions',
        'How ABRAM AI matchmaking ranks crew suggestions using real-time availability, skills, portfolio history, budget, and working preferences for each project.',
        '{"ABRAM","ABRAM Network","milestone","freelancer","calendar","ai","brief","work package","workflow","crew","scheduling","onboarding","billing","ledger","matchmaking","suggestions"}'::text[],
        '---
title: ''AI Crew Matchmaking: Smart Suggestions for Projects''
sidebarTitle: AI Matchmaking Suggestions
description: >-
  How ABRAM AI matchmaking ranks crew suggestions using real-time availability,
  skills, portfolio history, budget, and working preferences for each project.
keywords:
  - ABRAM
  - ABRAM Network
  - milestone
  - freelancer
  - calendar
  - ai
  - brief
  - work package
  - workflow
  - crew
  - scheduling
  - onboarding
  - billing
  - ledger
  - matchmaking
  - suggestions
---
# Section 4.2: AI Matchmaking Suggestions

> [!IMPORTANT]
> **Match Suitability Disclaimer**
> A suitability percentage (e.g. 92%) represents a statistical match score generated by our AI matchmaking engine using profile inputs. It is not an endorsement or guarantee of contractor performance. You must vet all contractors and confirm details before signing a work order.

ABRAM features an advanced, AI-powered project matchmaking system designed to suggest the optimal crew members for your projects. Instead of searching and reviewing profiles manually, the matchmaking engine automatically analyzes project requirements and compares them against your team''s real-time availability, skills, portfolio experience, budget, and working preferences.

> [!NOTE]
> AI matchmaking currently searches your **internal roster** only — the people already connected to your organization. Suggesting candidates from the wider ABRAM marketplace is planned as a future capability.

---

## 1. The Matching Workflow

The matchmaking engine works on a per-role basis to compile optimal crew suggestions:

<StageFlowchart stages={[
  {
    title: "1. Scope Input",
    nodes: [
      { id: "wp", title: "Work Package", description: "Configured milestones and phase boundaries", icon: "Package", type: "purple" }
    ]
  },
  {
    title: "2. Role and Effort Scoping",
    nodes: [
      { id: "rs", title: "Role Slots", description: "Individual positions mapped to dates and skills", icon: "User", type: "default" },
      { id: "alloc", title: "Effort Hours Allocation", description: "Role hours determined from deliverables, AI, or even split", icon: "Clock", type: "warning", badge: "HOURS" }
    ]
  },
  {
    title: "3. Roster Query",
    nodes: [
      { id: "match", title: "Matchmaking Search", description: "Deep queries across your internal roster", icon: "Search", type: "default" }
    ]
  },
  {
    title: "4. Display and Actions",
    nodes: [
      { id: "ui", title: "Role Match Table", description: "Interactive review showing suitability score and concerns", icon: "LayoutGrid", type: "default" },
      { id: "invite", title: "Create Hold and Invite", description: "Dispatch invitations and block capacity holds", icon: "Send", type: "success", badge: "INVITATION" }
    ]
  }
]} />

### 1. Splitting into Role Slots
A project’s work package is broken down into individual **Role Slots** (e.g., *Cinematographer*, *Gaffer*, *Key Grip*). Each role slot has a defined start date, end date, and required skills.

### 2. The Hours Allocation Sequence
Before matching, the engine determines the required hours for each role slot using a simple sequence of sources:
* **Explicit Allocations**: If you have already specified hours for a role within the deliverables (e.g., *Editor: 15 hours*, *Colorist: 5 hours*), the platform uses these values. This manual input is completely free.
* **AI Estimation**: If you haven''t entered manual hours, you can use the AI Assistant to estimate the effort based on the project scope. To optimize credit usage, the system saves these estimations, so they are only calculated once.
* **Even Split**: If manual inputs are not specified and you do not run AI estimation, the platform splits the project''s total estimated hours evenly among all active roles (e.g., 30 total hours split among 3 roles results in 10 hours each).

### 3. Effort Hours to Weekly Capacity Conversion
Once the total effort hours are determined, they are converted into a **weekly planned capacity hold** for scheduling:
* **Short Projects (1 week or less)**: The weekly capacity hold is equal to the total effort hours.
* **Long Projects (more than 1 week)**: The weekly capacity hold divides the total hours by the number of weeks, rounded to the nearest whole hour.

This value is stored as the proposed hours per week on the crew invitation.

### 4. Calendar and Booking Capacity Holds
Upon invitation acceptance:
* The system automatically creates a calendar booking marked as a **Project Work Capacity Hold**.
* **Visual Layout**: This booking appears as a neat, all-day banner at the top of the freelancer''s calendar rather than blocking off specific hourly time slots. 
* **Freelancer Autonomy**: This ensures scheduling availability checks remain accurate while giving freelancers complete autonomy to decide exactly *when* during the week they will perform the work. Freelancers log their actual hours worked on their weekly **Time Card**.

---

## 2. Crew Suitability Evaluation (0–100%)

Candidates are ranked using a comprehensive matchmaking algorithm that calculates a suitability percentage based on four major factors:

### 1. Technical Skill & Expertise Fit
* **Skill Matching**: The AI compares the required project skills against the skills listed on the candidate''s profile. It uses synonym mapping (for example, if a project requires "Sensa Cut" and the freelancer listed "Sensa Editor", the AI automatically recognizes this match).
* **Software Proficiency**: Checks familiarity with required production software tools.
* **Role Alignment**: Confirms whether the freelancer''s primary declared roles match the slot.
* **Equipment Matching**: Checks if the freelancer owns or operates specific technical equipment required for the shoot.
* **Specialization Fit**: Evaluates whether the freelancer holds verified specializations related to the project type (e.g., video editing, motion design).
* **Expertise Level**: Considers the freelancer''s average expertise level in their verified skills.

### 2. Location & Work Mode Fit
* **On-Site Roles**: For physical, on-location roles (like Gaffer or Cinematographer), the algorithm checks travel feasibility. It prioritizes local crew to minimize travel overhead, mileage costs, and accommodation logistics.
* **Remote-Friendly Roles**: For digital or post-production roles (like Editor or Designer), physical location is ignored. The engine instead evaluates timezone overlap to ensure smooth communication during collaborative windows.

### 3. Real-Time Availability & Capacity
* **Schedule Analysis**: Rather than relying on a static availability flag on a profile, the algorithm queries all active bookings in the candidate''s schedule for the project''s exact date window.
* **Remaining Hours**: The system subtracts current project commitments from the freelancer''s maximum weekly capacity. Freelancers with sufficient unbooked time to cover the role''s weekly requirements are ranked higher, while overbookings lower suitability.

### 4. Budget Alignment
* **Rate Check**: Compares the freelancer''s declared hourly or daily rate against the target budget allocated for that specific role slot.
* **Budget Fit**: Freelancers whose rates fall within or below the budget range are prioritized, while rates exceeding the target budget will lower the candidate''s suitability ranking.

---

## 3. Reviewing Suggestions & Concerns

To view AI matchmaking suggestions for a project:
1. Navigate to **Projects** and open the specific project dashboard.
2. Click **Find Matches** in the upper right. The engine will evaluate candidates for each defined role slot.
3. Review the **Role Slot Matching Table** which displays suggested candidates sorted by match score.

### Match Reasoning & Concerns
Under each candidate''s score, the interface lists:
* **Match Reasoning**: A quick summary of their strengths (e.g., *"Strong fit with excellent technical skill match and high availability"*).
* **Concerns / Red Flags**: Potential risks, such as budget mismatches (hourly rate exceeds target budget) or timeline overlaps (conflicts with existing booked projects).

Once you''ve selected the optimal candidates, you can check their names and click **Invite All Selected** to dispatch invitations immediately.

---

## 4. Credit Consumption & Caching for Matchmaking

Running the AI matchmaking engine to analyze suitability, calculate scores, and generate match reasoning consumes platform credits from your workspace billing ledger.

### Matchmaking Credit Rules
* **Free Operations**: Browsing the freelancer list, searching your internal registry manually, or viewing freelancer profiles does not consume credits.
* **Credit-Gated Operations**: Running the AI matchmaking suggestions (which calculates suitability scores and generates match reasoning or concerns) always consumes credits. This applies even if you manually entered the role hours or used the even split fallback instead of AI hours estimation.
* **AI Processing**: The system uses specialized analysis engines to evaluate candidates, identify compatibility concerns, and write detailed suitability rationales. Credit consumption is based on the volume of data analyzed per query.
* **Onboarding Free-Tier**: If you are a new organization founder completing your first-time onboarding setup, credit consumption is waived for your initial matchmaking trials.

### Caching Safeguards
To protect your workspace budget from redundant credit charges:
* **Saved Role Estimates**: Once the AI estimates hours for a work package, the results are saved directly to the project''s deliverables. Reloading the dashboard or reviewing the saved estimates does not consume additional credits.
* **Match Reasoning Cache**: The detailed match reasonings and concerns are cached for your session. Opening a candidate''s profile preview or reloading the matching grid does not trigger a new credit charge. You only consume credits when you explicitly trigger a new search or re-evaluate matchmaking after changing the project''s dates, roles, or deliverables.
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
        'user-guide/4.3-inviting-and-crew-rsvp',
        'Inviting Crew and Managing RSVPs',
        'Inviting & Crew RSVP',
        'Learn how to invite crew to a project through Matching, let the ABRAM assistant help draft invitations, and understand what invitees see when they respond.',
        '{"ABRAM","freelancer","producer","calendar","ai","matching","roster","workflow","crew","assistant","rsvp","inviting"}'::text[],
        '---
title: ''Inviting Crew and Managing RSVPs''
sidebarTitle: Inviting & Crew RSVP
description: >-
  Learn how to invite crew to a project through Matching, let the ABRAM
  assistant help draft invitations, and understand what invitees see when
  they respond.
keywords:
  - ABRAM
  - freelancer
  - producer
  - calendar
  - ai
  - matching
  - roster
  - workflow
  - crew
  - assistant
  - rsvp
  - inviting
---
# Section 4.3: Inviting Crew & Managing RSVPs

ABRAM helps you find the right people for a project and get invitations out quickly. This section covers how to invite crew from Matching, how the ABRAM assistant can help draft invitations for you, and what happens on the other end when someone responds.

---

## 1. Inviting Crew from Matching

The main way to invite crew to a project is through the project''s **Matching** screen.

1. Open the project and go to **Matching**.
2. Click **Find Matches**. ABRAM scores candidates from your roster against each open role, based on skills, availability, and other role requirements.
3. From the results, you can:
   * Click **Invite Candidate** to send an invitation for that person right away, or
   * Select multiple candidates and click **Invite All Selected** to invite them in bulk.
4. To customize an invitation before sending it — for example, to adjust the message, proposed rate, or start date — open the candidate''s full profile and use the detailed invite page there.

> **Good to know:** In the current Management Phase, Matching only draws from your own roster and team. ABRAM will never suggest or invite someone from outside your organization — every candidate you see has already been added to your roster.

---

## 2. Letting the ABRAM Assistant Draft Invitations

If you''d rather not do it by hand, you can ask the ABRAM assistant to help draft and send invitations for you. For example, you might ask it to invite a specific person to a role, or to reach out to everyone still needed for a project.

The assistant prepares an invitation plan showing who it intends to invite, for which role, and with what details — nothing is sent until you review it. Click **Approve** in the chat panel to send the invitations. The assistant never sends invitations on its own without your confirmation.

---

## 3. The Crew RSVP Screen

When someone receives an invitation, they get a secure link they can open without needing to log in.

This link opens a clean, simple RSVP page that shows:
* The project title, dates, and times
* The location
* The name of the organizer
* Any notes the producer included with the invitation

This screen does **not** show pay or rate information — daily or hourly rates are not displayed here. Those details are shared separately if the invitee needs them.

From this screen, the invitee can respond with one of three options:
* **Accept** — confirms they''ll take the role
* **Maybe** — flags interest as tentative, without committing yet
* **Decline** — turns down the invitation

---

## 4. What Happens After Someone Accepts

Once an invitation is accepted, ABRAM automatically adds a booking to that crew member''s schedule for the dates and times on the invitation — no extra steps needed on your end to get it onto their calendar.
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

## 7. Notification Routing

From the **Settings** gear on the Schedule page, you can control where your Slack notifications go. If your workspace has Slack connected, route each category of update to the channel that makes sense for it:
* **General**
* **Milestones**
* **Deliverables & Reviews**
* **Financials & Invoicing**
* **Logistics & Bookings**

Choose a destination for each category so scheduling and booking updates land where your team will actually see them. For help connecting your workspace, see **Section 6.1: Connecting Slack**.
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
        '{"ABRAM","ABRAM Network","freelancer","producer","calendar","ai","work package","payout","crew","scheduling","billing","ledger","rsvp","team","management","dashboard","analytics"}'::text[],
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
  - analytics
---
# Section 4.6: Team Management Dashboard

The **Team Management** dashboard (found under **Team Management** in the producer sidebar) is the operational command center for managing team member scheduling, tracking utilization, resolving scheduling conflicts, managing your roster, building staffing templates, and reviewing staffing analytics.

---

## 1. Crew Roster Tab

The **Crew Roster** tab is the centralized directory for all personnel in your organization''s network, managing both registered on-platform users and external contacts.

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
* **Drag-and-Drop Scheduling**: Block holds can be dragged to change start/end dates. Everyone can view the Calendar, but the full interactive drag-and-drop scheduler requires a **Team plan or higher**. On lower plans, the Calendar operates in a read-only mode with upgrade prompts shown when a scheduling action is attempted.
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

---

## 8. Analytics Tab

The **Analytics** tab is the reporting center for reviewing staffing performance and trends across your organization over time. Reports can be filtered by date range and, where applicable, by project, and any view can be exported for use outside the platform.

* **Trends**: Visualizes utilization and booking activity over time, helping you spot seasonal or project-driven spikes in staffing demand.
* **Heatmap**: A calendar-style heatmap highlighting which days, weeks, or team members carry the heaviest booking load.
* **Projects**: Breaks down staffing hours and costs by project, useful for comparing crew investment across productions.
* **Roles**: Aggregates hours and utilization by role (e.g., Camera Operator, Grip), showing which roles are in highest demand.
* **At-Risk**: Surfaces team members or projects approaching capacity limits or showing patterns of overcommitment that may need attention.
* **ROI**: Compares staffing spend against project outcomes to help evaluate the return on crew investment.
* **CSV Export**: Any Analytics view can be exported as a CSV file for further analysis or reporting outside the platform.
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
        'user-guide/4.7-run-of-show',
        'Section 4.7: Run of Show',
        'Run of Show',
        'Build and run a minute-by-minute segment schedule for live and broadcast productions, with role-based views, AI generation, and live show-control tracking.',
        '{"ABRAM","run of show","live production","broadcast schedule","show control","stripboard","scheduling"}'::text[],
        '---
title: ''Section 4.7: Run of Show''
sidebarTitle: Run of Show
description: ''Build and run a minute-by-minute segment schedule for live and broadcast productions, with role-based views, AI generation, and live show-control tracking.''
keywords:
  - ABRAM
  - run of show
  - live production
  - broadcast schedule
  - show control
  - stripboard
  - scheduling
---
# Section 4.7: Run of Show

The **Run of Show** tab, found inside any project, is your minute-by-minute schedule of show segments. It is built for live, broadcast, and event productions where every segment needs a precise start time, owner, and set of notes — and where that schedule often needs to change in real time once the show is actually running.

---

## 1. What the Run of Show Is

At its core, the Run of Show is a grid of segments laid out across a timeline. Each segment represents a discrete block of the show (an opening, a segment, a break, a performance, and so on) with its own scheduled time.

To keep the grid readable for different roles on set, the Run of Show offers **role-based column presets**, so each team member can see the columns most relevant to their job:
* **Producer**
* **Camera**
* **Audio**
* **Graphics**
* **Replay**
* **Stage Manager**

### Layout Options
You can switch between two layouts depending on how you like to work:
* **Focused Day**: A streamlined view for working through one day''s schedule at a time.
* **Classic Stripboard**: A traditional stripboard-style layout for viewing the full run of segments.

---

## 2. Building Your Schedule

There are two ways to populate your Run of Show:

### Manual Entry
Add and arrange segments directly in the grid, filling in the details relevant to your production.

### AI Generate
Instead of building every segment by hand, you can provide a free-text outline of your show (for example, a rough rundown of what happens and when) and have a full set of segments generated for you automatically. You can then review and adjust the generated segments as needed.

> **Plan Availability**: The number of segments you can add to a Run of Show is capped by your plan. Higher plans allow more segments.

---

## 3. Editing and Reordering

The Run of Show is designed to be adjusted quickly as plans change:
* **Drag to Reorder**: Drag a segment to a new position in the schedule, and the times for surrounding segments recalculate automatically to keep the run sequential.
* **Shift Times**: Use the **Shift Times** tool to bulk-adjust the timing of multiple segments at once — useful when the whole show needs to move earlier or later without re-entering every segment individually.

---

## 4. Go Live Mode

When it''s time to actually run the show, switch into **Go Live** mode. This turns the Run of Show into a live show-control tool:
* **Elapsed vs. Scheduled Tracking**: As the show progresses, Go Live mode tracks your actual elapsed time against the scheduled time for each segment, so you can see at a glance whether you''re running ahead, on time, or behind (variance).
* **Show Controls**: From Go Live mode you can:
  * **Pause** and **Resume** the show clock.
  * **Advance** to the next segment.
  * **End** the show once it''s complete.

---

## 5. Step-by-Step UI Navigation

1. **Opening the Run of Show**: Open your project, then click the **Run of Show** tab.
2. **Choosing a Layout**: Select **Focused Day** or **Classic Stripboard** depending on how you want to view your segments.
3. **Generating a Schedule with AI**: Click **AI Generate**, enter a free-text outline of your show, and let ABRAM build the initial set of segments.
4. **Adjusting Manually**: Add or edit segments directly in the grid as needed.
5. **Reordering Segments**: Drag a segment to a new position — the schedule''s times recalculate automatically.
6. **Shifting the Whole Schedule**: Click **Shift Times** to bulk-adjust the timing of multiple segments at once.
7. **Switching Role Views**: Choose a column preset (**Producer**, **Camera**, **Audio**, **Graphics**, **Replay**, or **Stage Manager**) to see the columns relevant to your role.
8. **Running the Show**: Click **Go Live** to enter show-control mode. Use **Pause**, **Resume**, and **Advance** to control the show as it runs, and click **End** when the show is complete.
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

### Step 1: Navigate to Payouts
1. Log in to your ABRAM freelancer workspace.
2. Payout setup lives in the **Payouts** area. You can reach it either from **Settings → Payouts**, or from the **Financials** section''s **Payouts** tab.
3. Look for the **Payout Setup** (or **Organization Payout Setup**) widget.

### Step 2: Initialize Stripe Account Creation
1. Click **Get Started** on the setup card.
   * *Note: Only organization owners or admins can manage the organization''s payout account. Other members can''t initiate or edit this setup.*
2. ABRAM will securely register your profile with Stripe in the background. A loading spinner will appear briefly.
3. You will be redirected automatically to the Stripe-hosted onboarding wizard in the same browser tab, where you complete a Stripe Express account setup.

### Step 3: Complete the Stripe Express Form
On the Stripe-hosted onboarding portal, you must provide:
1. **Verification Details**: Enter your phone number and email to receive a Stripe verification code.
2. **Business Details**:
   * **Individual / Sole Proprietor**: Provide legal name, SSN (or tax ID), and date of birth.
   * **Company (Studio/Agency)**: Provide legal entity name, EIN, and business address.
3. **Payout Destination**: Enter your Bank Account details (Routing and Account Number) or link a Debit Card for instant payouts.

### Step 4: Verification and Return to ABRAM
1. Once you review and submit your details, Stripe will redirect you back to the ABRAM Payouts page.
2. ABRAM will automatically retrieve and update the setup status.
3. Your Payout Setup card will update to show one of three statuses: **Active**, **In Review**, or **Setup Required**.

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

Once your Stripe Connect account status is **Active**, the setup card shows an **Open Stripe Dashboard** button.

Clicking this button takes you to Stripe Express where you can:
* View pending and historical payout transfers.
* Track the exact arrival date of payouts in transit.
* Update your bank account or debit card information.
* View and download annual tax documents (such as Form 1099-NEC).

### Minimum Balance for Payout Requests
To request a payout, your available balance must be at least **$10**. If your balance is below this threshold, keep accumulating earnings from paid invoices until you reach the minimum before requesting a transfer.

---

## 5. Multi-Organization Context (Prime Freelancers)

If your user account is an Owner or Admin of a registered Production Company organization:
* **Org-Bound Setup**: ABRAM binds Stripe Connect accounts to organizations rather than individual users. Setting up Stripe here configures the bank account for the entire organization''s billings.
* **Role Restrictions**: Only organization owners or admins can manage the organization''s payout account. Standard team members see a read-only view of the Payouts area asking them to contact their organization admin.
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

> [!NOTE]
> Need to send a cost estimate before work begins? **Quotes** are a related feature covered in [Section 5.6](./5.6-quotes.md), and let you draft an estimate that a producer can approve before you invoice.

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
* Enter the **Description**, **Quantity**, and **Unit Price** for each item. You can add manual line items and expenses yourself, in addition to importing approved project expenses.
* The system calculates the row totals and subtotal automatically.

### Step 4: Fees and Taxes Preview
ABRAM calculates fees in real time:
* **Platform Fee**: A small platform processing fee is calculated on the subtotal and shown on the invoice before you submit it.

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
  * ABRAM securely processes the transaction through Stripe to complete the payment.
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
3. The system generates a print-ready, professional document containing your logo, producer address, line items, and a summary breakdown (Subtotal, the platform processing fee, and Total).

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
    

      