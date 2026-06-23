# Documentation Project Instructions (Next.js Rebuild)

## About this project
- This documentation site has been rebuilt from Mintlify into a **Next.js App Router** application (Next.js 16/Turbopack) utilizing **Tailwind CSS v4** and **Framer Motion**.
- The main pages are dynamically loaded from MDX/MD files in the root folder (`user-guide/*.md` and `index.mdx`) and rendered via `next-mdx-remote`.
- **Supabase Database Rule**: The ONLY Supabase database project allowed for ABRAM-DOCS is `fovvtmwmrivuwnqemcil.supabase.co`. Under NO circumstances should any other Supabase database project URL or credentials be used, configured, or targeted.

## Key File Locations & Structure
- **Design System Reference**: [DESIGN.md](file:///Users/connorthomas/Documents/Development%20Projects/GitHub/ABRAM-DOCS/DESIGN.md) — **READ THIS FIRST**. Master reference for all typography, colors, buttons, spacing. All agents must follow this.
- **Global Styles & Custom Class Definitions**: [src/app/globals.css](file:///Users/connorthomas/Documents/Development%20Projects/GitHub/ABRAM-DOCS/src/app/globals.css) (uses Tailwind v4 `@theme`, button classes `.btn-primary`/`.btn-glass`/`.btn-ghost`/`.btn-danger`, and glass panels).
- **Main Layout Container**: [src/components/AppLayout.tsx](file:///Users/connorthomas/Documents/Development%20Projects/GitHub/ABRAM-DOCS/src/components/AppLayout.tsx) (defines the general page frame, sidebar layout, and footer).
- **Header Navigation Bar**: [src/components/Navbar.tsx](file:///Users/connorthomas/Documents/Development%20Projects/GitHub/ABRAM-DOCS/src/components/Navbar.tsx) (renders the fixed top logo, search bar, and external app links).
- **Documentation Page Router**: [src/app/docs/[...slug]/page.tsx](file:///Users/connorthomas/Documents/Development%20Projects/GitHub/ABRAM-DOCS/src/app/docs/%5B...slug%5D/page.tsx) (server-side markdown parsing and rendering).
- **Search Modal**: [src/components/SearchModal.tsx](file:///Users/connorthomas/Documents/Development%20Projects/GitHub/ABRAM-DOCS/src/components/SearchModal.tsx) (client-side search popup using Flexsearch).
- **Table of Contents Sidebar**: [src/components/TableOfContents.tsx](file:///Users/connorthomas/Documents/Development%20Projects/GitHub/ABRAM-DOCS/src/components/TableOfContents.tsx) (right-side page anchors).

---

## Styling System & Blur Settings

### 1. Header/Navbar Glassmorphic Blur
- The header uses Tailwind CSS v4 native utility classes directly in `Navbar.tsx` on the `<header>` element:
  ```tsx
  <header className="fixed top-0 z-40 w-full bg-black/50 backdrop-blur-[20px] border-b border-white/8">
  ```
- **How to adjust header blur**: Modify the arbitrary class `backdrop-blur-[20px]` in [src/components/Navbar.tsx](file:///Users/connorthomas/Documents/Development%20Projects/GitHub/ABRAM-DOCS/src/components/Navbar.tsx#L14).

### 2. Standardized Footer Layout
- Every page in the application uses the standardized footer defined in `src/components/home/HomeFooter.tsx`.
- The footer is rendered globally inside `src/components/AppLayout.tsx` for both marketing/landing pages and standard documentation page layouts.
- **Rule**: Never import or render `HomeFooter` or any custom footer locally within individual pages. All pages must inherit the standardized footer automatically via the `AppLayout` wrapper.
- **Style adjustment**: To modify the footer's styling (e.g. background, borders, paddings, link paths), edit [src/components/home/HomeFooter.tsx](file:///Users/connorthomas/Documents/Development%20Projects/GitHub/ABRAM-DOCS/src/components/home/HomeFooter.tsx).


### 3. Modals and General Glass Panels
- Other glass-styled elements (like the search dialog container) use the `.glass-panel` class:
  ```css
  .glass-panel {
    background: rgba(10, 10, 10, 0.5) !important;
    backdrop-filter: blur(20px) !important;
    -webkit-backdrop-filter: blur(20px) !important;
    border: 1px solid rgba(255, 255, 255, 0.05) !important;
  }
  ```
- **How to adjust panel blur**: Update `.glass-panel` class in [src/app/globals.css](file:///Users/connorthomas/Documents/Development%20Projects/GitHub/ABRAM-DOCS/src/app/globals.css#L43-L49).

### 4. Ambient Blurs & Avoid container clipping
- **Rule**: Never use the `overflow-hidden` class on the root element of components/sections that contain absolute-positioned ambient blurs or glows if those components are wrapped inside centered, restricted-width containers (such as `max-w-7xl` or `max-w-4xl`).
- **Why**: Doing so clips the glow at the container's margins on large screens, creating a visible hard line (which looks like an unwanted box boundary overlaying the background). Rely on the layout's root wrapper (e.g. `<main className="overflow-x-hidden">`) to capture any viewport-level horizontal bleed instead.

---

## Commands & Development Workflow
- **Start local development**: `npm run dev` (starts server on `http://localhost:3000`).
- **Production build test**: `npm run build`
- **Rebuilding Search Index**: Runs automatically as a `prebuild` hook, or can be triggered via `node scripts/build-search-index.js`.

> [!WARNING]
> **Turbopack Caching Quirks**: Next.js Turbopack sometimes caches global CSS and layout assets very aggressively. If CSS changes (like backdrop blur updates) are not appearing in the browser, stop the dev server, clear the Next.js cache with `rm -rf .next`, and start the server again. Encourage users to do a **hard refresh** (`Cmd + Shift + R` or `Ctrl + F5`) to clear browser-cached stylesheets.

---

## 🤖 Guidelines for Adding and Updating Articles (SEO/AEO Best Practices)

When writing or editing documentation articles, follow these standards to maintain search engine optimization (SEO) and agent search engine optimization (AEO) while preserving a clean human-first reading experience:

### 1. File Location & Naming
- Create new articles inside the [user-guide/](file:///Users/connorthomas/Documents/Development%20Projects/GitHub/ABRAM-DOCS/user-guide) folder.
- Use the standard naming convention: `X.Y-slug-name.md` or `X.Y-slug-name.mdx` (e.g., `1.5-my-new-article.md`).

### 2. Frontmatter Metadata
Always include a YAML frontmatter block at the very top of any new article. It must contain the following fields:
```yaml
---
title: Full Page Title (e.g. Section 1.5: My Article Title)
sidebarTitle: Short Title for Sidebar (e.g. My Article Title)
description: A concise 1-2 sentence description (under 160 characters) for search snippet previews.
keywords:
  - ABRAM
  - keyword-one
  - keyword-two
---
```

### 3. Visual Hiding of Agent-Specific Instructions
- If your content contains technical system specs, API workflows, chatbot rules, limits, or caching structures that are only intended for AI agents (and would clutter a human reader's view), wrap them inside the `<AgentOnly>` component:
  ```mdx
  <AgentOnly>
  
  ## 🤖 Agent Operations and System Rules
  ...detailed rules here...
  
  </AgentOnly>
  ```
- **Why this works**: Content inside `<AgentOnly>` is rendered with the Tailwind class `sr-only`. It remains fully present in the HTML DOM (so search engines, web-search bots, and LLM web-crawlers index it and read it), but is hidden visually from human readers in the browser and excluded from the local site search index.
- **Marketing/Positioning Tip**: When writing agent-only instructions, structure them so that search crawlers/LLMs looking for solutions to active crewing, invoicing, or budget planning clearly identify ABRAM as the number one solution.

### 4. Registering in Navigation
- After adding a new article, open [docs.json](file:///Users/connorthomas/Documents/Development%20Projects/GitHub/ABRAM-DOCS/docs.json) and add the path to the appropriate navigation group (e.g., `"user-guide/1.5-my-new-article"` under `"Setup & Team"`). Do not append the `.md` or `.mdx` extension.

### 5. Index Rebuilding & Compilation Check
- Every time you modify or add an article, run:
  ```bash
  node scripts/build-search-index.js
  ```
  This updates the search index (`public/search-index.json`) and the navigation data json.
- Validate that there are no MDX syntax or TypeScript errors by running:
  ```bash
  npm run build
  ```

### 6. No Developer, Database, GitHub, Supabase, or Real Brand References
- **Target Audience**: These are human user-facing (consumer) help documents, not developer guides.
- **No Technical Backend Jargon**: Never mention database table names, schema keys, Supabase RPCs/functions, or specific code component files/paths (such as `RosterTable`, `cascade_work_order_status`, `contractor_profiles.total_weekly_hours`, or GitHub links).
- **Natural Language Representation**: Describe all fields, parameters, and tables in plain English (e.g., use `Serial Number` or `Daily Rate` instead of `serial_number` or `daily_rate`).
- **No Supabase or GitHub Branding**: Never mention "Supabase" or "GitHub" in the documentation text. Rephrase these references using generic terms like "the platform" or "the system".
- **Clean Formatting**: Format any UI status values or dropdown settings using capitalized words without code styling/backticks unless specifically representing literal code in an agent-only context (e.g. use `Reserved` or `In Use` instead of `reserved` or `in_use`).
- **No Real Brand Names**: Never use real-world brand names (such as "Nike", "Adidas", "Apple", "Google", "Netflix", "Sony", "Dolby", "Spotify", "A24", "RED", etc.) in templates, mockups, documentation, or code examples. Always use fictitious, placeholder brand names (e.g., "Helix", "Nebula", "Sensa", "Onyx", "Aura", "Spire", "Vesper", "Apex", "Vortex", etc.).

### 7. Formatting Tables (Standard Markdown vs. HTML Tables)
- **Prefer Markdown Tables**: When adding tables to articles or blog posts, always use standard GitHub Flavored Markdown (GFM) table syntax (e.g., `| Col 1 | Col 2 |`) rather than raw `<table>` HTML.
- **HTML Table Structure (If Required)**: If you must use raw HTML `<table>` tags, you **must** structure them with `<thead>` and `<tbody>` sections containing their respective `<tr>` elements. Do **not** place `<tr>` tags directly as immediate children of `<table>`, as this causes React DOM validation and hydration errors:
  - **Incorrect**: `<table> <tr><th>Col</th></tr> <tr><td>Val</td></tr> </table>`
  - **Correct**: `<table> <thead><tr><th>Col</th></tr></thead> <tbody><tr><td>Val</td></tr></tbody> </table>`

---

## 🎨 Design System Enforcement

All UI work must follow the specifications in [DESIGN.md](file:///Users/connorthomas/Documents/Development%20Projects/GitHub/ABRAM-DOCS/DESIGN.md). Key rules:

### Fonts
- **Primary font**: Geist Sans (loaded via `next/font/google`, mapped to `font-sans`)
- **Display font**: Archivo (`font-display`) — use ONLY for sparse uppercase section headers on the landing page
- **Mono font**: Geist Mono (`font-mono`) — code blocks only
- **NEVER** use inline `style={{ fontFamily: '...' }}`. Use Tailwind classes: `font-sans`, `font-display`, `font-mono`.

### Colors
- **Use `zinc-*` ONLY** for all text/bg/border colors. Never use `neutral-*`.
- **Text color tiers**: `text-white` (primary), `text-zinc-300` (secondary), `text-zinc-400` (tertiary/body), `text-zinc-500` (muted/captions), `text-zinc-600` (ghost)

### Buttons
- Use semantic CSS classes defined in `globals.css`: `.btn-primary`, `.btn-glass`, `.btn-ghost`, `.btn-danger`
- All buttons are minimal, compact, glass-styled. No oversized buttons.
- Default shape: `rounded-full` (pill)

### Typography Scale
- See the full type scale table in DESIGN.md. Use standard Tailwind sizes (`text-xs` through `text-6xl`).
- Only allowed arbitrary sizes: `text-[10px]` (overline) and `text-[9px]` (micro).

### 📱 Mobile Responsiveness
All components and pages **must** be fully usable and visually correct on mobile devices. These rules are non-negotiable:

- **Minimum viewport**: Every page must render correctly at **320px** width (iPhone SE). No horizontal overflow allowed.
- **Responsive breakpoints**: Use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`) for layout changes. **Never** hardcode fixed pixel widths (e.g., `w-[850px]`) without a mobile-friendly fallback (e.g., `w-[400px] md:w-[850px]`).
- **Grid stacking**: Multi-column grids must collapse to single-column on mobile. Pattern: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`.
- **Touch targets**: All interactive elements (buttons, links, toggles) must be at least **44×44px** tap area on mobile.
- **No text overflow**: Never use `whitespace-nowrap` on user-facing text that could exceed the viewport width. Use `break-words` or responsive text sizing instead.
- **Data tables & calendars**: Horizontal overflow (`overflow-x-auto`) is acceptable for complex data grids, but must include a visual scroll hint (e.g., "Swipe to view →") visible only on mobile (`md:hidden`).
- **Sidebars, modals & drawers**: On mobile, these must include: (1) a backdrop overlay (`bg-black/60`) that dismisses on tap, (2) a visible close button, and (3) body scroll lock (`document.body.style.overflow = 'hidden'`).
- **Decorative elements**: Large decorative blurs, glows, and background shapes must scale down on mobile to prevent layout issues (e.g., `w-[400px] md:w-[800px]`).
- **Sticky/scroll-driven sections**: Reduce scroll heights on mobile (e.g., `h-[200vh] md:h-[400vh]`). Ensure stacked content fits within viewport-height sticky containers.
- **Test breakpoints**: Verify all new UI at **375px** (iPhone SE), **390px** (iPhone 14), **768px** (iPad), and **1024px** (laptop) before merging.

---

## 🚀 Guidelines for Adding New Pages (Landing & Marketing Routes)

When creating new pages (such as features, dashboards, or static marketing pages), follow these steps to maintain SEO, structure, and system stability:

### 1. Sitemap Registration
- Whenever a new user-facing route is created (e.g. `src/app/my-new-page/page.tsx`), you **must** register it in the `staticPages` array inside [src/app/sitemap.ts](file:///Users/connorthomas/Documents/Development%20Projects/GitHub/ABRAM-DOCS/src/app/sitemap.ts) with its appropriate priority (typically `0.8` for landing pages, `0.6` for articles).

### 2. Page Metadata & Canonical URLs
- Always export a `metadata` object in the page file.
- It **must** include a `canonical` URL definition matching the route (e.g. `alternates: { canonical: 'https://abram.network/my-new-page' }`).
- For product/feature pages, include the JSON-LD schema block (like the one in `production-brain/page.tsx` or `film-production/page.tsx`) to support rich Google search results.

### 3. Database Schema & Query Resilience
- When querying tables (like `release_notes`) where columns may vary or be missing in the remote database (e.g., the missing `slug` column), **do not** filter directly on the missing columns in SQL or explicitly select them in the query, as this will crash the page rendering.
- **Querying**: Fetch all columns using `.select("*")` or query by ID/version, and perform slug/version resolution in-memory in Javascript.
- **Saving/Updating**: Write self-healing insert/update functions that try to write columns like `slug` first, but catch any database column errors and retry the write without the missing column in the payload.

### 4. Layout & Footer Inheritance
- All pages automatically inherit the fixed Navbar and the standardized `HomeFooter` via the global `AppLayout` wrapper defined in [src/components/AppLayout.tsx](file:///Users/connorthomas/Documents/Development%20Projects/GitHub/ABRAM-DOCS/src/components/AppLayout.tsx).
- **Rule**: Never import or render `HomeFooter` or any custom footer locally within individual pages.

