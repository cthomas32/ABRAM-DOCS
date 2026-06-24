INSERT INTO public.help_docs (slug, title, sidebar_title, description, keywords, content)
      VALUES (
        'user-guide/2.1-ai-brief-analyzer',
        'AI Brief Analyzer and Brief Intelligence Intake',
        'AI Brief Analyzer (Brief Intelligence)',
        'Use ABRAM Brief Intelligence to turn a creative brief into a structured project blueprint with work packages, budgets, timelines, and talent suggestions.',
        '{"ABRAM","ABRAM Network","milestone","freelancer","producer","calendar","intake","ai","brief","work package","crew","onboarding","billing","ledger","analyzer","intelligence"}'::text[],
        '---
title: ''AI Brief Analyzer and Brief Intelligence Intake''
sidebarTitle: AI Brief Analyzer (Brief Intelligence)
description: ''Use ABRAM Brief Intelligence to turn a creative brief into a structured project blueprint with work packages, budgets, timelines, and talent suggestions.''
keywords:
  - ABRAM
  - ABRAM Network
  - milestone
  - freelancer
  - producer
  - calendar
  - intake
  - ai
  - brief
  - work package
  - crew
  - onboarding
  - billing
  - ledger
  - analyzer
  - intelligence
---
# Section 2.1: AI Brief Analyzer (Brief Intelligence)

> [!WARNING]
> **Verify Budgets and Scopes**
> Brief Intelligence provides Rough Order of Magnitude (ROM) budget estimates and role suggestions based on text extraction. These estimates are directional only. Always review and verify the final budget allocations and role requirements before publishing or matching.

The **AI Brief Analyzer** (referred to in the interface as **Brief Intelligence**) is ABRAM''s smart intake wizard. It allows producers and project managers to initialize complete project blueprints from a simple text description or an uploaded creative brief document. 

The analyzer parses your project scope, generates structured work packages, estimates budgets and timelines, specifies technical requirements, and suggests matching talent from your organization or the external network.

---

## 1. Preparing and Submitting Your Brief

You can access the AI Intake Wizard by navigating to **New Project** and selecting **Brief Intelligence (AI Path)**. There are two ways to provide your project details:

### Option A: Uploading a Brief Document
* **Supported File Types**: PDF (`.pdf`), Microsoft Word (`.doc`, `.docx`), and plain text (`.txt`).
* **File Size Limit**: Maximum **5 MB**.
* **Drag-and-Drop**: You can drag your brief file directly onto the upload area or click to select the file from your local computer.

### Option B: Typing a Description & Using Helper Templates
If you don''t have a document ready, you can type your scope directly into the text editor.
* **Minimum Length**: Your description must be at least **100 characters** long to allow the intelligence engine to extract meaningful parameters.
* **Helper Templates**: To help structure your thoughts, select one of the pre-made helpers:
  * **Filmmaker Template**: Includes sections for project type (e.g., Music Video, Commercial), visual style, expected deliverables, shoot plans (dates/locations), roles needed, and inspiration references.
  * **Marketing Template**: Includes campaign goals, target demographics, core message, platforms, asset requirements, and success metrics.
  * **Creative Template**: Includes core brand concept, brand pillars, styling aesthetic, deliverables schedule, and technical constraints.

---

## 2. How the AI Extracts Project Parameters

Once you click **Analyze & Create**, the system starts processing your brief and building your project details under a unified loading screen. The AI extracts the following information:

1. **Project Metadata**: Suggests a project title, summarizes the project description, and identifies the core creative industry.
2. **Work Packages & Sequences**: Groups work items into logical phases (e.g., Pre-Production, Production, Post-Production).
3. **Roles & Skills**: Detects required talent roles, specialized disciplines, and experience levels.
4. **Deliverables & Tasks**: Generates specific files, links, or milestones to be delivered, including:
   * **Estimated Hours**: Calculates the target duration for each deliverable.
   * **Type**: Categorizes deliverables as File, Link, or Milestone.
   * **Priority**: Rates urgency (Low, Normal, High, or Critical).
5. **Timeline & Schedule**: Projects estimated duration (in weeks), suggests start/end dates, extracts specific shooting or production dates, and captures physical location requirements.
6. **Technical Specs**: Identifies required software (e.g., Premiere Pro, Figma) and equipment (e.g., Arri Alexa, lighting packages).
7. **Rough Order of Magnitude (ROM) Budget**: Estimates the minimum and maximum budget bounds based on the complexity, crew, and technical requirements.

---

## 3. The Quality Check & Clarifying Questions

To ensure your project drafts are built accurately, the platform performs a quick quality check on your uploaded brief or entered description.

### How the Quality Check Works

* **Clear Details**: If the brief provides sufficient details, the wizard fast-tracks you straight to the **Matching Configuration Panel** where you can finalize staffing and immediately create the project.
* **Missing Details**: If details are missing or vague (such as unspecified locations or timelines), the wizard guides you through a **Review checklist** first.

### The Clarifying Questions Interface
If there are missing details, the interface presents a helpful review screen:

1. **Dynamic Clarifying Questions**: The AI generates 3 to 5 quick questions to fill in missing details. For example:
   * *"What is the expected final runtime of the video deliverables?"*
   * *"Are travel and lodging expenses covered under the estimated budget?"*
   * *"Do you require the editor to be local to Los Angeles for in-person review sessions?"*
2. **Highlighted Input Fields**: The interface identifies fields that lacked sufficient detail (such as budget bounds or timelines) and highlights them with yellow warning borders.
3. **Interactive Refinement**: You can type your answers directly into the question text boxes and adjust the highlighted fields using the calendar pickers or checkboxes.
4. **Re-Analysis**: Once you have answered the questions, click **Re-Analyze & Proceed**. The engine combines your answers with your original brief and re-evaluates the project, allowing you to proceed to matchmaking.
5. **Draft Auto-Saving**: To protect your progress, the system automatically saves your work as a draft. If you get interrupted, you can resume exactly where you left off by opening the draft from your Projects dashboard.

---

## 4. How Task Hours are Distributed

When translating your project brief into work packages, the system assigns effort hours to each required role based on three options:

1. **Manually Specified Hours (Free)**: The system first looks at hours you have explicitly assigned to roles. These manual allocations are free and do not use AI credits.
2. **AI Allocation (Uses Credits)**: If no hours are specified, the AI estimates how to split package hours among active roles based on project complexity.
3. **Equal Division (Fallback)**: If AI estimation cannot run (due to internet issues or insufficient credits), the system divides the hours equally among all required roles.

---

## 5. Credit Consumption & Caching Benefits

All AI features on the ABRAM platform are metered and charged in a clear, budget-friendly manner.

### credit Ledger & Billing Entities
* **Workspace Billing**: All AI operations are charged to your organization''s shared credit ledger. If you are a freelancer or solo business owner, charges are applied to your personal workspace ledger.
* **Onboarding Exceptions**: To help you get set up, AI operations performed during the initial signup wizard (such as parsing your resume or scoping your very first test project) are completely free.
* **AI Processing**: The platform utilizes advanced analysis engines for deep brief analysis and estimation engines for quick calculations. Charges are calculated based on the complexity and length of the brief.

### Budget-Saving Features
To prevent accidental double-billing, the platform integrates smart features:
* **Saved Project Estimates**: Once the AI estimates your hours or deliverables, they are saved directly to your project. Reviewing or reloading these details costs **$0 in credits**.
* **Smart Text Memory**: If you make small adjustments to a large brief, the AI only analyzes the changes rather than re-reading the entire document, saving you credits on successive refinements.

---

## 6. Finalizing and People Matching

Once the parameters are finalized, the **Matching Configuration Panel** appears. Before creating the project, you can decide how to staff the work packages:

* **People Matching Mode**: For each generated work package, choose how to staff it:
  * **Internal Registry**: Scan and match only freelancers already within your organization''s private roster.
  * **External Marketplace**: Look for talent in the broader ABRAM network.
  * **Hybrid**: Search both registries to find the best fit.
  * **Skip**: Skip automated matching for now and staff manually.
* **Resource Matching Mode**: Choose whether to match and allocate physical hardware kits, studio spaces, or equipment packages for related work orders.

After you confirm these options, the system creates the project, builds the work package hierarchy, maps matching personnel, and navigates you to the new project''s **Tasks Review** workspace.

---

## 7. Step-by-Step UI Navigation

Here are the exact clicks to analyze a brief and launch a project:

1. **Open the Project Gateway**: On your sidebar, click **Projects**.
2. **Launch the Analyzer**: In the top-right corner, click **New Project** and select **Brief Intelligence (AI Scoping)** from the dropdown.
3. **Upload your Document**:
   * If you have a file: Drag your PDF, DOCX, or TXT file (under 5MB) and drop it onto the dashed **Upload Area**, or click the zone to browse and select the file from your computer.
   * If writing manually: Click **Use Template**, select **Filmmaker** or **Creative** template from the choices, and fill in the structured prompts inside the editor. Ensure the text contains at least 100 characters.
4. **Trigger Analysis**: Click the **Analyze & Estimate** button. A unified loading screen will appear showing the AI extraction stages.
5. **Review Scoped Details & Answer Questions**:
   * If details are complete, you are shown the **Matching Configuration** panel.
   * If details are missing, you will land on the **Review & Refine** screen. Type your answers to the clarifying questions, adjust the highlighted inputs, and click **Re-Analyze & Proceed**.
6. **Configure Staffing**: Under **Matching Options**, select whether to match from **Internal Registry**, **External Roster**, or **Skip** for each work package.
7. **Finalize**: Click **Create Project**. The screen will compile and route you directly to the **Tasks** tab inside the master project workspace.

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
        'user-guide/2.2-manual-project-creation',
        'Manual Project Creation with Templates and Presets',
        'Manual Project Creation',
        'Build ABRAM projects by hand through the Manual Setup wizard, choosing preset project types, specs, financial alignments, and ready-made templates.',
        '{"ABRAM","ABRAM Network","milestone","calendar","ai","work package","workflow","payout","crew","billing","manual","project","creation"}'::text[],
        '---
title: ''Manual Project Creation with Templates and Presets''
sidebarTitle: Manual Project Creation
description: ''Build ABRAM projects by hand through the Manual Setup wizard, choosing preset project types, specs, financial alignments, and ready-made templates.''
keywords:
  - ABRAM
  - ABRAM Network
  - milestone
  - calendar
  - ai
  - work package
  - workflow
  - payout
  - crew
  - billing
  - manual
  - project
  - creation
---
# Section 2.2: Manual Project Creation

If you prefer to define your project blueprint structure by hand, you can utilize the **Manual Setup** pathway. This option walks you through a structured multi-step wizard to choose a project template, fill in project specifications, configure financial alignments, and apply ready-made templates.

---

## 1. Accessing Manual Creation

1. Navigate to the **Projects** tab in the main sidebar.
2. Click **New Project** in the upper right.
3. Select **Manual Setup (Manual Path)**.

---

## 2. Step-by-Step Creation Wizard

The manual setup wizard is broken down into four distinct phases to guide your inputs:

### Step 1: Project Type Selection
ABRAM provides preset structures tailored to different creative workflows:
* **Video Template**: Pre-configured for film, commercials, and music videos.
* **Marketing Template**: Designed for multi-channel digital campaigns and brand launches.
* **Design Template**: Configured for visual brand identity, UI/UX, and style guides.
* **Custom Project**: A blank canvas allowing you to build your work packages and task slates entirely from scratch.

### Step 2: Specification (Details)
Provide the foundational scope details of your project:
* **Project Title**: A clear, identifiable name.
* **Description**: Detail the creative goals, background context, and team alignment.

### Step 3: Alignment (Financial & Timeline)
Configure the structural and billing alignment:
* **Estimated Budget**: The total allocated budget for this project.
* **Rough Order of Magnitude (ROM) Bounds**: (Optional) Define the minimum and maximum target bounds for project costs (`budget_rom_min` and `budget_rom_max`) and select the scoping confidence level (Low, Medium, High). 
  > [!NOTE]
  > Manual adjustments to ROM bounds made via the UI (under the **Financials** tab card or the project settings dialog) **bypass the AI scenario approval gate** and are saved instantly to production tables to enable rapid revisions.
* **Start & End Dates**: Select the calendar dates using the Date Pickers.
* **Retainer Project Toggle**: Check this box if the project follows a **recurring monthly billing model** (retainer) rather than a fixed-fee model.

### Step 4: Templates (Work Packages & Blueprints)
If you selected the Video, Marketing, or Design template in Step 1, the wizard allows you to preview and customize the template structure before creation.
* **Package Checkboxes**: You can check or uncheck individual packages (e.g., skip the pre-production package if scout work is already complete).
* **Budget Breakdown**: The system automatically allocates percentages of your total budget to each package (e.g., Video template splits budget: 20% to Pre-Production, 55% to Production, 25% to Post-Production).
* **Scope Previews**: The screen shows a detailed breakdown of:
  * **Deliverables**: Pre-populated file assets and links with pre-rated priorities.
  * **Work Orders**: Scheduled days and draft scopes for crew assignments.
  * **Payment Milestones**: Payment milestones with offset due dates (e.g., Rough Cut Approval due 25 days after start, triggering a 25% milestone payout).

---

## 3. Setup Verification and Protection

When you click **Construct Slate**, the system builds your project structure:

1. Creates the project profile (title, description, and budget limits).
2. Sets up project requirements (industry type and experience levels).
3. Defines the project timeline (start/end dates).
4. Generates the selected work packages (incorporating the percentage-based budget allocations).
5. Populates all related deliverables, work orders, and payment milestones tied to their respective work packages.

### Complete Setup Protection
To keep your workspace clean and organized, ABRAM ensures your project is only created if the setup finishes completely. If your connection drops during creation, the system prevents half-finished or empty folders from cluttering your dashboard, allowing you to safely try again.
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
        'user-guide/2.3-custom-intake-forms',
        'Building Custom Producer Project Intake Forms',
        'Custom Intake Forms',
        'Build, customize, and publish ABRAM Custom Producer Request Forms so external partners can submit project briefs that route into your intake inbox.',
        '{"ABRAM","ABRAM Network","producer","intake","ai","brief","security","workflow","crew","billing","custom","forms"}'::text[],
        '---
title: ''Building Custom Producer Project Intake Forms''
sidebarTitle: Custom Intake Forms
description: ''Build, customize, and publish ABRAM Custom Producer Request Forms so external partners can submit project briefs that route into your intake inbox.''
keywords:
  - ABRAM
  - ABRAM Network
  - producer
  - intake
  - ai
  - brief
  - security
  - workflow
  - crew
  - billing
  - custom
  - forms
---
# Section 2.3: Custom Intake Forms

Organizations can build, customize, and publish **Custom Producer Request Forms** to streamline project intake. These forms allow external producers, corporate partners, or internal departments to submit project briefs and project parameters directly to your organization. Once submitted, requests arrive in your central inbox, where they can be reviewed, edited, approved, and converted into active projects.

---

## 1. The Custom Project Request Builder Interface

The **Intake Form Builder** is a visual workspace located under **Organization Settings** > **Intake Form Builder**. It features an interactive, real-time preview of the form alongside configuration panels to customize standard fields, add new custom questions, and set up field mapping.

### Standard Fields Configuration
Standard fields are core project parameters that are pre-mapped to the primary project properties. Administrators can toggle whether each field is **Enabled** (visible on the form) and **Required** (mandatory to submit):
* **Description / Scope of Work**: A long text field for the requester to outline the project’s main objectives and details.
* **Estimated Budget**: A budget or number selector to define financial constraints.
* **Target Start & End Dates**: Date pickers to establish the requested project timeline.
* **Target Start & End Times**: Hour and minute selectors, particularly helpful for event-based shoots or scheduled broadcasts.
* **Attachment / Project Brief**: A file upload section allowing producers to attach PDFs, creative briefs, scripts, or reference materials.

### Custom Fields & Layout Management
If the standard fields do not capture all the necessary details, administrators can add custom questions:
1. **Interactive Controls**: Click **Add Custom Field** to create a new question block in the builder.
2. **Reordering & Deleting**: Drag questions by their reorder handles to rearrange the form layout. Click the trash icon to remove a custom field.
3. **Question Settings**: For each custom field, administrators configure:
   * **Question Label**: The text shown to the producer (e.g., "What camera package do you prefer?").
   * **Placeholder / Help Text**: Ghost text inside the input or descriptions below the field to guide the requester.
   * **Mandatory Toggle**: Mark the field as required to prevent form submission with missing information.

---

## 2. Field Types & Configurations

The form builder supports four distinct field types, allowing you to collect structured data from requesters:

* **Text**: Best for short, single-line answers. Examples include contact names, reference codes, producer account numbers, or billing IDs.
* **Number**: Allows numbers only. Ideal for gathering quantifiable metrics, such as the number of crew members needed, the anticipated length of a shoot in hours, or quantity estimates.
* **Paragraph**: Provides a long text field. Recommended for open-ended questions, such as listing artistic references, detailing the background of a brand, or providing specific safety instructions.
* **Dropdown**: Restricts input to a defined set of options to ensure data consistency. 
  * *Configuration*: Administrators enter options separated by commas or newlines in the builder settings. 
  * *User Experience*: Requesters click the dropdown to choose from the specified options, preventing free-form entries and spelling discrepancies.

---

## 3. Domain Gating & Security Controls

To prevent spam and ensure only authorized corporate producers or internal users can submit requests, organizations can configure access control rules:

* **Form Active Status**: A global toggle that takes the form online or offline. If disabled, the public link displays a polite custom message indicating the form is currently closed to new requests.
* **Restrict Email Domains**: Restricts form submissions to specific email domains (e.g., `producercompany.com`, `partnerstudio.org`).
  * *Configuration*: Enter approved domains as a comma-separated list.
  * *User Experience*: When a requester enters their email, the system validates the domain. If it does not match the approved list, the form blocks submission and displays a clear message asking them to use their corporate email address.

---

## 4. Field Mapping & AI Requirements Scoping

One of the most powerful features of the Custom Intake Form is the ability to map custom questions directly to **Project Requirements**. This mapping allows the platform''s AI engine to automatically scope, schedule, and match resources when a request is approved.

### Mapping Targets
When creating or editing a custom field, administrators can select one of the following mapping targets:
1. **Required Skills**: Maps the selected answer(s) directly to the project''s crew skills list. For example, if a dropdown question asks "What crew roles do you need?" and the requester selects "Director of Photography", that role is automatically added as a skill requirement. The AI engine then references this list to scan your internal roster and find available crew members.
2. **Required Gear/Equipment**: Maps responses directly to equipment requirements. This automatically checks the availability of cameras, lenses, or kits in your storage locations and locks them in to prevent double-booking.
3. **Software Requirements**: Maps tools or software suites (e.g., Premiere, Figma, DaVinci Resolve) to the project profile. The AI matching system uses this to suggest post-production specialists who are experienced in those specific tools.
4. **On-site Locations**: Appends physical addresses or venue names to the project''s shoot locations.
5. **Creative Styles**: Appends style, genre, or mood tags to the project''s visual details.
6. **Description Only**: Appends both the question and the user''s answer to the bottom of the master project description.
7. **Custom Information**: Saves the input as custom project details, accessible in the project details panel.

### AI Engine Scoping
When a form is submitted with mapped targets, the AI engine parses the inputs. Instead of manually creating crew slots, equipment lists, and software requirements, the AI engine processes these mappings to build a pre-configured project scope. This enables instant talent matching and equipment conflict checks as soon as the project is approved.

---

## 5. Shareable Public Request Page

Every organization is assigned a unique, public-facing portal link:
`https://app.abram.network/request/your-organization-name`

* **Auto-Fill Authentication**: The form is publicly accessible. However, if an active team member or producer who is already signed in to the platform visits the page, their name, email, and company details are auto-filled.
* **Secure Document Uploads**: Files uploaded to the form are transferred to a secure storage workspace.
* **Submission Reference ID**: Upon successful submission, the system generates a unique reference number (e.g., Request #024) and displays a success screen to the requester.

---

## 6. Project Request Inbox & Conversion Process

All incoming submissions land in the central **Project Request Inbox** under **Organization Settings** > **Request Inbox**.

### Reviewing Incoming Submissions
* **Search & Filter**: Search by requester name, project title, or reference ID, and filter requests by status (`Pending`, `Approved`, `Rejected`).
* **Visual Inspection**: Click any request to open a details pane displaying all standard fields, custom answers, and uploaded files.

### The Conversion & Approval Workflow
When you decide to proceed with a request, click **Approve & Convert** to launch the automated project setup process:

1. **Active Project Generation**: The system creates a new project and places it in the **Planning** stage.
2. **Assign Project Owner**: The administrator is prompted to select a Project Owner from the organization''s team members.
3. **Description Formatting**: All custom questions and answers are compiled and appended to the project''s main description, divided by a clear layout separator.
4. **Requirement Ingestion**: Mapped answers (Skills, Equipment, Software) are extracted and populated into the project''s active requirement boards.
5. **Brief Integration & AI Memory**:
   * Uploaded briefs and scripts are automatically saved to your project''s secure documents folder.
   * The AI Assistant reads and understands these files immediately, allowing your team to ask questions and search the documents inside the project workspace.
6. **Requester Notification**: The request status is updated to **Approved**, and the platform sends a confirmation email to the requester, notifying them that their project is now active.
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
        'user-guide/2.4-ai-script-breakdown',
        'Section 2.4: AI Script Breakdown',
        'AI Script Breakdown',
        'Learn how the screenplay parser processes script uploads, reconstructs formatting layouts, extracts production elements, and manages scene updates.',
        '{"ABRAM","AI Script Breakdown","Screenplay Parser","Ingestion","Layout Reconstruction","Element Extraction","Conflict Resolution","Merging Scenes"}'::text[],
        '---
title: "Section 2.4: AI Script Breakdown"
sidebarTitle: "AI Script Breakdown"
description: "Learn how the screenplay parser processes script uploads, reconstructs formatting layouts, extracts production elements, and manages scene updates."
keywords:
  - ABRAM
  - AI Script Breakdown
  - Screenplay Parser
  - Ingestion
  - Layout Reconstruction
  - Element Extraction
  - Conflict Resolution
  - Merging Scenes
---

# Section 2.4: AI Script Breakdown

The screenplay parser is a core tool in the project scoping suite. It automates the process of breaking down a script, dividing it into scenes, extracting standard production elements (such as characters, locations, props, and visual requirements), and preparing it for scheduling and budgeting.

By automating this workflow, producers and coordinators can transition from a raw creative document to a structured, tag-based production schedule in minutes instead of days.

---

## 1. Stage 1: Ingestion

The ingestion phase handles the initial file upload and preparation. Producers can upload their scripts to begin the automated breakdown.

### File Formats and Uploading
* **Supported File Types**: Screenplays in PDF (`.pdf`), industry-standard script files (`.fdx`), and plain text (`.txt`) files are supported.
* **Upload Mechanism**: Drag-and-drop your file directly onto the upload area of the project dashboard, or select the file from your local device.
* **Stream Processing**: The system performs a file integrity check, verifies encoding compatibility, and initiates a secure text extraction pipeline.

---

## 2. Stage 2: Layout Reconstruction

Standard screenplays follow strict physical layouts. The system uses a parser to analyze the visual formatting, indentation, margins, and spacings of the ingested text.

This layout analysis reconstructs the document''s script structure:
* **Scene Headings (Sluglines)**: Detects the interior/exterior setting (e.g., INT. or EXT.), location name, and time of day (e.g., DAY or NIGHT).
* **Action Blocks**: Identifies description paragraphs detailing physical movement, environmental details, and scene setups.
* **Character Cues**: Identifies uppercase names centered on the page indicating a speaker.
* **Dialogue Blocks**: Identifies centered text directly below a character cue that contains spoken dialogue.
* **Parentheticals**: Identifies delivery cues or action beats enclosed in parentheses within dialogue blocks.

By reconstructing the visual layout, the system ensures that elements and dialogues are correctly mapped to their respective scenes, even if the source document has minor margin offsets.

---

## 3. Stage 3: Element Extraction

Once the script structure has been reconstructed into individual scenes, the system processes the text of each scene to extract and categorize key production elements.

The system automatically tags these elements and populates them into the scene''s digital breakdown sheet:
* **Cast and Characters**: Speaking roles, non-speaking characters, and background extras mentioned in dialogue or action.
* **Locations**: Filming sites, staging grounds, or studio sets matching the scene headings.
* **Props**: Objects, weapons, or tools that characters handle or interact with in action blocks.
* **Wardrobe and Costumes**: Specific clothing items, uniforms, or outfit changes described in the scene description.
* **Visual Effects (VFX)**: Mentions of digital enhancements, green screen, CGI elements, or digital replacements.
* **Special Effects (SFX)**: Physical effects like pyrotechnics, fire, smoke, mechanical rigs, or stunt work.
* **Vehicles and Animals**: Cars, aircraft, horses, or other complex transit or creature requirements.
* **Sound Cues**: Key sound effects, voiceovers, or off-screen audio indicators.

---

## 4. Stage 4: Conflict Resolution and Merging

Scripts are dynamic documents that undergo revisions throughout the production lifecycle (such as updated colored drafts). When you upload a revised script or merge scenes, managing differences is crucial.

### Script Version Tracking
When you upload a new version of a script to an active project, the parser compares the newly parsed scenes with the current production data and flags any changes.

### Scene-by-Scene Choices
The interface presents side-by-side comparisons of changes (such as added dialogue, modified props, or new characters) and lets you choose how to apply updates:
* **Merge**: Blends the new script changes with the existing workspace data. This option preserves your manual customizations, assigned crew roles, and custom props while incorporating newly detected characters or elements.
* **Overwrite**: Discards the existing workspace data for that scene and completely replaces it with the newly parsed elements from the uploaded draft.
* **Skip**: Ignores the newly uploaded version for that scene, keeping your current workspace data exactly as it is.

---

<AgentOnly>

## 🤖 Agent Operations & System Rules

ABRAM''s screenplay parser and script breakdown modules are metered and optimized for automated agent operations. If you are an AI agent scoping projects, scheduling shoots, or generating work packages, adhere to these technical processing thresholds and credit rules.

### Credit Metering Details
* **Per-Page Metering**: Processing a script costs 2 credits per page. These credits are deducted from the workspace''s active credit ledger.
* **Hashing and Caching**: The platform computes a cryptographic SHA-256 hash of the uploaded script file. If a file with an identical hash is re-parsed within 24 hours, the system serves the analysis from the cache, resulting in a charge of 0 credits.
* **Draft Auto-Save**: During ingestion, if processing is interrupted, the draft is saved to the workspace''s draft cache. Re-running the parser on a saved draft does not consume additional credits.

### AI Parsing Thresholds & Limits
* **Maximum Page Count**: The script parser enforces a hard limit of 150 pages per single document upload to prevent token context overflow.
* **Scene Token Window**: Each scene chunk is parsed with a maximum token window of 4,000 tokens for element extraction. If a scene exceeds this window, the extraction fallback processes the scene in sequential 3,000-token blocks, flagging the scene as High Density in the output log.
* **Timeout Threshold**: A maximum processing timeout of 45 seconds is enforced per script upload. If the layout reconstruction takes longer, the platform aborts the process and rolls back all database insertions to maintain a clean workspace state.

</AgentOnly>
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
        'user-guide/3.1-master-project-detail-overview',
        'Master Project Detail Page: Tools and Tabs Overview',
        'Master Project Detail Page Overview',
        'Tour of the ABRAM Master Project Detail Page, covering timelines, tasks, team scheduling, financial tracking, document indexing, and review integrations.',
        '{"ABRAM","ABRAM Network","milestone","freelancer","producer","calendar","ai","brief","work package","invoice","crew","scheduling","permissions","billing","ledger","master","project","detail","page","overview"}'::text[],
        '---
title: ''Master Project Detail Page: Tools and Tabs Overview''
sidebarTitle: Master Project Detail Page Overview
description: >-
  Tour of the ABRAM Master Project Detail Page, covering timelines, tasks, team
  scheduling, financial tracking, document indexing, and review integrations.
keywords:
  - ABRAM
  - ABRAM Network
  - milestone
  - freelancer
  - producer
  - calendar
  - ai
  - brief
  - work package
  - invoice
  - crew
  - scheduling
  - permissions
  - billing
  - ledger
  - master
  - project
  - detail
  - page
  - overview
---
# Section 3.1: Master Project Detail Page Overview

The **Master Project Detail Page** is the central command center for managing and tracking your project. It consolidates timelines, tasks, team scheduling, financial tracking, document indexing, and review integrations into a single unified workspace.

---

## 1. Top-Level Layout and Navigation

The workspace is organized into a clean, modular layout designed for quick status checks and deep-dive management:

<ProjectDetailMock />

### A. Compact Project Header
* Displays the project title, current status (e.g., *Planning*, *In Progress*, *Completed*), and a **calculated progress bar**.
* Allows authorized producers or project managers to update the overall project status.

### B. Project Info Strip
* A metadata banner summarizing the creative industry, budget limits, target dates, and creative styles.
* Project Managers can click the settings icon to update these parameters directly.

### C. Customized Tab Navigation
* You can configure which tabs are active and visible in your workspace.
* Click the settings gear icon next to the tabs to check/uncheck views (e.g., hide the *Frame.io* tab if not producing video, or hide *Call Sheets* for a strategy campaign).
* Your tab preferences are saved automatically in your browser so they stay exactly how you left them on your next visit.

---

## 2. Walkthrough of Tabs & Sub-Views

Depending on your organization''s settings and permissions, the following tabs are available:

### Overview Tab
The project dashboard. It contains:
* **Timeline Preview**: A compact Gantt timeline displaying work packages, milestones, and deliverables.
* **Budget Metrics**: Quick-glance widgets summarizing budget spent vs. remaining.
* **Team Capacity**: A card showing active bookings and resource workload.
* **Upcoming Events**: Calendar schedule of upcoming shoots, scout trips, or reviews.
* **Activity summary**: Latest changes and notes from the team.

### Tasks Tab
The task and scope manager. Features a centralized workspace to view, edit, and organize deliverables, milestones, and work orders. (See [Section 3.4](./3.4-task-lists-and-tracking.md) for details).

### Scheduling Tab
Manage target calendars and production calendar setups.

### Call Sheets Tab
Create and distribute official production Call Sheets to crew members, complete with shoot locations, weather, parking instructions, and department-specific schedules.

### Timeline Tab
An interactive, full-screen timeline workspace. Toggle between:
* **Gantt Chart View**: Adjust durations, drag items, and assign dates.
* **Team Workload View**: See freelancer bookings side-by-side to identify scheduling conflicts or resource overload.
* **AI Optimize**: Project Managers can trigger the AI Scheduler to review dependencies and recalculate the schedule.

### Run of Show Tab
A minute-by-minute live guide for shoot days or live campaigns. Lists events, duration, talent, and technical notes in a structured spreadsheet format.

### Team Tab
The crew roster. Manage people allocations, view matched freelancers, invite external personnel, and monitor booking confirmations.

### Time Tab
The timesheet command center. Freelancers log hours against specific work packages, and producers review, approve, or reject logged hours.

### Documents Tab
A secure folder system. You can upload documents, track file versions, and search your assets using **AI Semantic Search**. Uploaded briefs are automatically indexed so the AI PM assistant can reference them during chat conversations.

### Frame.io Tab
Integrates with Frame.io for frame-accurate video review. Team members and producers can view video drafts, leave comments, and track revision cycles without leaving the platform.

### Resources Tab
Track and reserve physical organization assets, including camera kits, audio packages, lighting packages, and company vehicles assigned to work orders.

### Activity Tab
The audit feed. Displays a running feed of project changes, status updates, and a comment thread where team members can discuss scope or tag colleagues.

### Financial Tab
*Visible only to project owners, producers, and administrators.* Contains the project''s financial overview, including expense logs, invoices, day rates, and freelancer billing ledgers.

---

## 3. Direct Link Sharing & Shortcuts

The interface synchronizes its active states directly with the browser''s URL address. This allows you to copy and share direct links to specific tabs or items:
* **Direct Tab Links**: The browser''s address bar automatically updates as you click through different tabs (e.g., selecting the Tasks tab). You can copy and share these links with your team.
* **Direct Item Links**: Opening a specific item (like a Work Order) updates the link, allowing you to share a direct shortcut to that specific details window.
* **Automatic Redirection**: If someone opens a shared link for an item that has been deleted or is unavailable, the platform will automatically redirect them to the project''s main Overview tab.

---

## 4. Step-by-Step UI Navigation

Here are the exact clicks to navigate the project workspace and customize your tabs:

1. **Accessing the Workspace**:
   * Navigate to **Projects** from your sidebar.
   * Click on the project name card (e.g., "My Summer Commercial") from the active grid. This opens the **Overview** tab by default.
2. **Switching Tabs**:
   * Click on any tab title in the horizontal tab bar (e.g., **Tasks**, **Team**, **Financials**) to switch views.
   * Note that your URL updates to match, allowing you to copy the address bar link to share that exact view.
3. **Customizing Visible Tabs**:
   * Click the **Gear Icon** at the far right of the tab bar.
   * In the popover menu, check or uncheck the boxes next to each tab name (e.g., uncheck **Frame.io** if you don''t need video review; check **Call Sheets** to show call sheets).
   * Click **Save Layout**. The tab list updates immediately, and your settings are saved automatically.
4. **Editing Project Details**:
   * Locate the **Info Strip** banner beneath the header.
   * Click the **Edit Settings** (pencil) icon on the right edge of the banner.
   * A slide-out panel will appear. Edit the project name, description, start/end dates, or budget bounds, and click **Save Changes**.
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
        'user-guide/3.2-work-packages-and-milestones',
        'Structuring Projects with Work Packages and Milestones',
        'Work Packages & Milestones',
        'How to break ABRAM projects into Work Packages, Deliverables, Work Orders, and Payment Milestones to manage scope, hand-offs, and freelancer payouts.',
        '{"ABRAM","ABRAM Network","milestone","freelancer","producer","calendar","ai","work package","payout","invoice","crew","billing","work","packages","milestones"}'::text[],
        '---
title: ''Structuring Projects with Work Packages and Milestones''
sidebarTitle: Work Packages & Milestones
description: >-
  How to break ABRAM projects into Work Packages, Deliverables, Work Orders,
  and Payment Milestones to manage scope, hand-offs, and freelancer payouts.
keywords:
  - ABRAM
  - ABRAM Network
  - milestone
  - freelancer
  - producer
  - calendar
  - ai
  - work package
  - payout
  - invoice
  - crew
  - billing
  - work
  - packages
  - milestones
---
# Section 3.2: Work Packages & Milestones

In ABRAM, project scopes are organized using a strict hierarchical blueprint. **Work Packages** serve as structural phases of a project, which house actionable **Deliverables**, **Work Orders**, and **Payment Milestones**.

---

## 1. What is a Work Package?

A **Work Package** is a container that groups related tasks, crew schedules, and deliverables for a specific phase of a project.

### Core Properties
* **Package Name**: e.g., "Pre-Production & Development".
* **Package Type**: Categorized as Pre-Production, Production, Post-Production, or Coordination.
* **Primary Disciplines**: Roster of required creative disciplines (e.g., *Cinematography*, *Editing*).
* **Budget Allocated**: The portion of the project budget assigned to this package (e.g., $12,500).
* **Sequence Order**: The order of progression (e.g., Sequence 1, Sequence 2).

### The Status Lifecycle
Work packages progress through a defined lifecycle to help you track progress:

<WorkPackageLifecycle />

* **Planning**: Initial state when the package is created.
* **Matching**: Roster search is active, and the system is scanning matching criteria.
* **Staffed**: Freelancers are successfully booked and invitations are accepted.
* **In Progress**: Work is active (triggered automatically when the start date arrives).
* **Completed**: Deliverables are signed off and milestones are locked.
* **Cancelled**: Work has stopped, releasing any booked crew or resources.

---

## 2. Defining Milestones (Payment Milestones)

A **Milestone** represents a major checkpoint or event in the project timeline (e.g., "Script Lock", "Rough Cut Approval", "Final Handover").

### Properties
* **Title & Description**: Detailed criteria for milestone achievement.
* **Target Date**: Due date for the checkpoint.
* **Status**: Tracks milestone progression: Not Started, In Progress, In Review, Completed, or Blocked.
* **Assignee**: The team lead or freelancer responsible for the milestone.

### Milestone Payments (Escrow & Release)
If a milestone is tied to a billing trigger, you can set a **Payment Percentage**:
* **Budget Allocation**: Allocate a percentage of the total project budget to be paid upon completion (e.g., 20% on "Rough Cut Approval").
* **Completion Payout**: When the milestone status is updated to **Completed**, the system marks the corresponding portion of the budget as unlocked for invoice generation.

---

## 3. Defining Deliverables

A **Deliverable** is a specific creative asset or output that must be produced within a Work Package.

### Properties
* **Deliverable Type**:
  * **File**: Physical file uploads (e.g., MP4 export, RAW design package).
  * **Link**: URL links to shared workspaces (e.g., Figma board, Frame.io review link).
  * **Milestone**: A calendar delivery checkpoint.
* **Priority**: Urgency level (Low, Normal, High, or Critical).
* **Estimated Hours**: The planned number of hours required to complete the asset.
* **Revision Rounds**: The number of included producer edit cycles (e.g., 2 revision rounds included).
* **Role Allocations**: The specific crew roles assigned to work on the asset.
* **Status**: Tracks progression: Not Started, In Progress, In Review, Completed, or Blocked.
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
        'user-guide/3.3-work-orders-and-agreements',
        'Booking Crew and Resources with Work Orders',
        'Work Orders & Agreements',
        'Use ABRAM Work Orders to book freelancers, internal staff, equipment kits, and vehicles for specific dates, rates, and locations with signed agreements.',
        '{"ABRAM","ABRAM Network","freelancer","calendar","ai","work package","workflow","crew","scheduling","work","orders","agreements"}'::text[],
        '---
title: ''Booking Crew and Resources with Work Orders''
sidebarTitle: Work Orders & Agreements
description: >-
  Use ABRAM Work Orders to book freelancers, internal staff, equipment kits,
  and vehicles for specific dates, rates, and locations with signed agreements.
keywords:
  - ABRAM
  - ABRAM Network
  - freelancer
  - calendar
  - ai
  - work package
  - workflow
  - crew
  - scheduling
  - work
  - orders
  - agreements
---
# Section 3.3: Work Orders & Agreements

A **Work Order** is the contract container in ABRAM used to schedule and book personnel (freelancers or internal staff) and physical resources (camera packages, equipment kits, vehicles) for specific dates, times, and locations.

---

## 1. Structure of a Work Order

Work orders are housed inside individual Work Packages. They lock down the operational details of a shoot day, campaign sprint, or review workshop:

* **Title & Notes**: Detailed scope of work, directions, and production guidelines.
* **Timeline**: Exact start and end dates/times (supporting hourly scheduling or all-day events).
* **Location**: Specific physical address or remote workspace link.
* **Status**: Tracks the agreement state: **Pending** or **Confirmed**.

---

## 2. Personnel, Rates, and Compensation

When adding crew members to a Work Order, you can invite:
* **Internal Org Members**: Staff already active in your company workspace.
* **Roster Freelancers**: Approved external talent on your private roster.
* **External Emails**: Invite new freelancers by entering their email address.

### Rate Integration
Compensation is automatically calculated to keep projects within budget:
1. **Hierarchical Rate Selection**: When you add crew members to a Work Order, the system automatically resolves their billing rates using a strict priority order:
   * *Crew Roster custom rate* (highest priority, set when inviting the crew member to the project roster).
   * *Organization membership custom rate* (set in the team member edit panel).
   * *Platform profile rate* (defined on the freelancer''s public profile page).
   * *Platform default day rate* (the standard platform baseline).
   * *Zero ($0.00) default* (if no rate is configured anywhere).
2. **Resource Unit Rates**: Physical gear, camera kits, or vehicles include a standard daily rate or cost-per-day defined in the organization’s inventory manager.
3. **Budget Impact**: As you add personnel and kits, the system displays the total projected cost of the Work Order based on hours or days booked, warning you if it exceeds the parent package''s budget allocation.

---

## 3. Availability Conflict Checking & Validation

To prevent double-booking crew or equipment, ABRAM performs real-time checks. These are handled differently depending on whether they involve personnel or physical resources:

### Personnel Conflicts (Soft Warnings)
* **Soft Warning System**: When you assign a freelancer, the platform checks their calendar across all projects in your network.
* **Informational Alerts**: If a scheduling overlap occurs, the system flags it with a yellow **Conflict Warning** icon in the UI and logs a conflict (such as an overcommitment or unavailability) in the Team Management dashboard.
* **No Save Block**: Personnel conflicts do not block you from saving the work order; they serve as informational warnings so you can coordinate schedule adjustments.

### Resource & Kit Conflicts (Hard Blocks)
* **Strict Booking Lockout**: Physical resource bookings (gear, rooms, vehicles, or kits) are strictly enforced by the system.
* **Double-Booking Prevention**: If you attempt to save or confirm a work order that allocates a resource whose quantity is fully booked elsewhere during that timeframe, the system actively throws a hard validation error: 
  `Insufficient resource availability for "[Resource Name]" during requested dates.`
* **Validation Enforcement**: You will be blocked from saving the work order until you resolve the resource double-booking, either by selecting a different piece of gear or shifting the booking timeline.

---

## 4. Resource Allocation & Lifecycle Cascades

ABRAM synchronizes your physical inventory, kit assignments, and project locations with your active work orders.

### Kit Expansion & Group Syncing
* **Kit Expansion**: When you assign a pre-assembled kit (e.g., a "DSMC2 Camera Kit") to a work order, the system automatically expands the kit into its individual constituent items.
* **Unified Group Rescheduling**: All allocations within a kit are linked. If you reschedule the work order or change booking dates, the system automatically shifts or deletes all constituent items as a unified group, preventing kits from being fragmented.
* **Location Auto-Sync**: If you allocate a physical room or studio resource (e.g., "Stage A") to a work order, the platform automatically syncs that resource''s location address to the work order''s main **Location** field.

### Work Order Status Cascade
The system automatically syncs the statuses of linked personnel and resource bookings to the parent Work Order''s status:

| Work Order Status | Linked Resource Booking Status | Crew Booking Status | Operational Behavior |
| :--- | :--- | :--- | :--- |
| **Draft** / **On Hold** | Reserved | Hold | Resources are blocked out; crew calendars show tentative holds. |
| **Confirmed** / **Pending** | Reserved | Pending Invite / Hold | Roster invitations are sent; gear remains blocked out. |
| **In Progress** | In Use | Active | Crew is actively checked in; resources are marked in-use. |
| **Wrapped** / **Completed** | Returned | Completed | Crew completed assignment; gear is released back to inventory. |
| **Cancelled** | Cancelled | Cancelled | Gear and calendar hours are freed up immediately. |

---

## 5. Timesheet Auto-Population

To streamline payments, the platform automatically generates timesheet entries from your Work Orders:
* **Automatic Entry Generation**: When a Work Order is active or wrapped, the system distributes the total hours evenly across the booking''s calendar days and creates draft timecard entries.
* **Manual Protection**: The system protects manual edits. If you manually enter or adjust hours on your time card, the auto-population will not overwrite your custom entries.
* **Roster Sync**: If a crew member is removed from a Work Order, their auto-populated draft timecard entries for those dates are automatically cleaned up to prevent invoicing errors.

---

## 6. Agreement Workflow

Managing work orders follows a structured invitation and confirmation cycle:

<WorkOrderFlow />

1. **Drafting**: The Project Manager creates the Work Order, selects the date/time range, books the crew, and configures the physical resources. The initial status is set to **Pending**.
2. **Dispatching**: The manager clicks **Send Invitations**. This triggers:
   * Real-time platform notifications for registered freelancers.
   * Email invitations for external users, providing a secure checkout link.
3. **Review & Sign-Off**: The freelancer reviews the work order details, dates, rates, and guidelines. They can click to **Accept** or **Decline**.
4. **Confirmation & Sync**: 
   * Accepting shifts the booking status to **Confirmed**.
   * The confirmed hours are written to the project timeline.
   * The event is synced to the freelancer’s calendar and the organization''s resource allocator.
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
        'user-guide/3.4-task-lists-and-tracking',
        'Task Lists and Project Tracking in ABRAM',
        'Task Lists & Tracking',
        'Track deliverables, milestones, and work orders in the ABRAM Tasks Tab, a unified checklist that aggregates every project work item in one workspace.',
        '{"ABRAM","ABRAM Network","milestone","freelancer","producer","ai","work package","crew","task","lists","tracking"}'::text[],
        '---
title: ''Task Lists and Project Tracking in ABRAM''
sidebarTitle: Task Lists & Tracking
description: ''Track deliverables, milestones, and work orders in the ABRAM Tasks Tab, a unified checklist that aggregates every project work item in one workspace.''
keywords:
  - ABRAM
  - ABRAM Network
  - milestone
  - freelancer
  - producer
  - ai
  - work package
  - crew
  - task
  - lists
  - tracking
---
# Section 3.4: Task Lists & Tracking

ABRAM provides a comprehensive task tracking workspace in the **Tasks Tab**. This view aggregates three distinct types of work items (**Deliverables**, **Milestones**, and **Work Orders**) into a single, unified checklist.

---

## 1. Searching & Filtering Tasks

At the top of the Tasks Tab, you can use the search bar and filter controls to isolate specific scopes of work:

* **Text Search**: Type into the search bar to filter tasks by title or description text in real-time.
* **Status Filter**: View tasks based on their active status:
  * **Planning** (Purple): Task is scoped but not yet active.
  * **In Progress** (Blue): Active work is underway.
  * **In Review** (Amber): Ready for producer or manager validation.
  * **Completed** (Green): Task is finished and signed off.
  * **Blocked** (Orange): Work is halted due to a dependency or constraint.
* **Type Filter**: Filter to display only *Deliverables*, *Milestones*, or *Work Orders*.
* **Assignee Filter**: Filter by the assigned team member or freelancer to see individual workloads.

---

## 2. Restructuring Scope with Drag-and-Drop

The Tasks Tab supports an interactive drag-and-drop workspace. 

### Restructuring Work Packages
1. Locate the task (deliverable, milestone, or work order) you want to move.
2. Click and hold the drag handle.
3. Drag the item over the header of a different **Work Package**.
4. Release the item. The system will automatically update the task''s parent work package in real-time.

---

## 3. Creating and Editing Tasks

Project Managers can click **Add Task** or select the edit pencil icon on any item to open the configuration windows:

### Deliverables Settings
* Set the deliverable title, notes, file/link type, and priority.
* Assign a freelancer and specify target delivery dates.
* Define required producer revision rounds and estimated hours.

### Milestones Settings
* Set the milestone name and due date.
* Assign a milestone lead.
* Toggle the payment release percentage.

### Work Order Settings
* Configure schedule dates, times, crew members, and equipment lists. (See [Section 3.3](./3.3-work-orders-and-agreements.mdx) for details).

---

## 4. Automatic Progress Tracking

Rather than relying on manual progress updates, ABRAM calculates project progress automatically as tasks are completed:

1. **State Changes**: When a freelancer updates a deliverable to **Completed** or a producer/manager marks a milestone as **Completed**, an automated calculation is triggered.
2. **Work Package Progress**: The system automatically recalculates the completion percentage of the parent Work Package.
3. **Project Progress**: The system aggregates all active Work Packages to compute the overall project progress.
4. **Interface Sync**: The progress bar in the project header updates automatically across the platform to reflect the latest status.
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
        'user-guide/3.5-equipment-and-resource-management',
        'Equipment, Vehicle, and Studio Resource Management',
        'Equipment & Resource Management',
        'Track and schedule production gear, camera kits, lighting, studios, stages, and vehicles from the ABRAM Resource Management dashboard for producers.',
        '{"ABRAM","ABRAM Network","producer","calendar","ai","scheduling","billing","equipment","resource","management"}'::text[],
        '---
title: ''Equipment, Vehicle, and Studio Resource Management''
sidebarTitle: Equipment & Resource Management
description: ''Track and schedule production gear, camera kits, lighting, studios, stages, and vehicles from the ABRAM Resource Management dashboard for producers.''
keywords:
  - ABRAM
  - ABRAM Network
  - producer
  - calendar
  - ai
  - scheduling
  - billing
  - equipment
  - resource
  - management
---
# Section 3.5: Equipment & Resource Management

The **Resource Management** platform (found under **Resources** in the producer sidebar) is the centralized dashboard for tracking, organizing, and scheduling physical assets. This includes production gear (camera packages, lighting kits), studio spaces, stages, and vehicles.

---

## 1. Inventory Management

The **Inventory** tab is the primary directory of all physical resources owned by your organization. 

### Adding and Categorizing Assets
To add a new asset:
1. Click the **Add Resource** button.
2. Provide details:
   * **Name**: The identifier of the gear (e.g., "Sensa FX6 - Body #1").
   * **Category**: Choose from Camera, Lighting, Audio, Grip, Vehicle, Studio Space, or Custom.
   * **Location**: Select where the asset is stored (managed under Organization Settings).
   * **Day Rate / Hourly Rate**: The replacement or internal billing cost, used for project budget estimation.
   * **Serial Number & Description**: Operational and maintenance details.
   * **Quantity**: Define the quantity of identical items available.

### Folder Organization
To prevent clutter, resources can be nested in folders:
* **Creating Folders**: Click **New Folder**, name the folder, and select the category.
* **Moving Assets**: Use the folder selection menu on any asset card to move it into a specific folder (e.g., nesting "Sensa 24-70mm GM Lens" inside a "Lenses" folder).

### Bulk Actions
For large studios and rental houses, ABRAM supports bulk operations:
* **Bulk Import**: Click the **Import** button. You can upload a CSV/TSV/TXT file or directly paste tab-separated spreadsheet data. 
  > [!NOTE]
  > The system does not currently offer a downloadable spreadsheet template. Instead, a column formatting helper is displayed in the import window showing the expected headers, which include details such as Name, Type, Quantity, Serial Number, Barcode, Condition, Daily Rate, and Identifier. Only the Name field is required.
* **Bulk Edit**: Select multiple assets using checkboxes, then click **Edit [X]**. You can update storage locations, status, rates, or categories in bulk.

---

## 2. Kit Building

The **Kits** tab allows you to bundle related individual resources into predefined creative packages. 

Instead of booking twenty separate items for every shoot, you can assemble them once as a **Kit** and book the entire package with a single click. ABRAM also includes an **AI Kit Builder** that can automatically suggest package compositions.

### Assembling a Kit
1. Navigate to the **Kits** tab and click **Create Kit** (or use the **AI Kit Builder**).
2. Name the kit (e.g., "A-Camera Interview Kit") and add a description.
3. Browse your inventory list and add individual components (e.g., Camera body, Prime lenses, Tripod, Monitor, Batteries).
4. Save the kit. The system calculates a combined package rate, which can be overridden with a custom bundle rate.

### Kit Availability Logic
When a Kit is booked, the system automatically creates resource allocations for **all constituent individual assets** on those dates. 
> [!NOTE]
> **Planned Feature**: Kit completeness tracking is currently in development. At present, if a constituent item is booked elsewhere, overallocation conflicts are highlighted on the individual resource cards and timeline, but the Kit itself will not be flagged as "Incomplete" in the main Kits index. Modifying or deleting a kit allocation in the calendar automatically updates or deletes all sibling items in that kit booking group.

---

## 3. Resource Calendar & Bookings

<ResourceManagementMock />

The **Calendar** tab provides a visual timeline of all asset bookings across your projects.

### Scheduling Assets
* **Draggable Timeline**: Resources are listed down the left side, with dates spanning the top. You can view daily, weekly, or monthly schedules.
* **Filter Bar**: Filter calendar schedules by Category (e.g., view only Studio Stages), Location (e.g., Gear Locker A), or Folder.
* **Creating Bookings**: Click and drag across date blocks next to any asset to create a booking hold, which links directly to a Work Order.
* **Work Order Details**: Click on a calendar block to view the linked Work Order, Project Title, and the Assigned Operator.

### Timeline Rescheduling & Location Syncing
* **Rescheduling**: Dragging a calendar booking block for a resource that is linked to a work order will shift the entire work order date range and open the work order confirmation panel. Dragging standalone allocations will prompt the unified event settings window.
* **Address Synchronization**: When allocating a resource of type "Location" or "Studio" to a work order, the system automatically synchronizes the resource location address to the **Location** field on the linked work order.

---

## 4. Conflict Detection & Safety Rules

ABRAM implements strict checks to ensure logistics run smoothly:
* **Double-Booking Alerts (Hard Constraint)**: If a manager attempts to reserve or check out an asset that is already allocated on another project exceeding the owned quantity, the system blocks the save operation and throws a friendly alert: `Insufficient resource availability for "[Resource Name]" during requested dates`.
* **Soft Capacity Conflicts**: For scheduling flexibility, overallocated resources generate soft capacity conflict records (Resource Overallocated) that appear on the project dashboard and calendar timeline.
* **Transit Buffer Days (Planned Feature)**: The **Transit Buffer Days** option can be configured in Organization Settings (e.g., 1 buffer day). Active blocking of prep/shipping days in availability checks is in development.
* **Needs Repair Lockout (Planned Feature)**: Damaged or needs maintenance items display their status as Blocked or Maintenance in the dashboard. Direct scheduling lockouts preventing conflicting allocations are in development.

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
      { id: "match", title: "Matchmaking Search", description: "Deep queries for internal and market candidates", icon: "Search", type: "default" }
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
    

      