# Documentation Project Instructions (Next.js Rebuild)

## About this project
- This documentation site has been rebuilt from Mintlify into a **Next.js App Router** application (Next.js 16/Turbopack) utilizing **Tailwind CSS v4** and **Framer Motion**.
- The main pages are dynamically loaded from MDX/MD files in the root folder (`user-guide/*.md` and `index.mdx`) and rendered via `next-mdx-remote`.

## Key File Locations & Structure
- **Global Styles & Custom Class Definitions**: [src/app/globals.css](file:///Users/connorthomas/Documents/Development%20Projects/GitHub/ABRAM-DOCS/src/app/globals.css) (uses Tailwind v4 `@theme` and custom classes like `.glass-panel`).
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

### 2. Footer Glassmorphic Blur
- The footer matches the header's glass layout directly in `AppLayout.tsx` on the `<footer>` element:
  ```tsx
  <footer className="w-full mt-auto bg-black/50 backdrop-blur-[20px] border-t border-white/8 py-6">
  ```
- **How to adjust footer blur**: Modify `backdrop-blur-[20px]` in [src/components/AppLayout.tsx](file:///Users/connorthomas/Documents/Development%20Projects/GitHub/ABRAM-DOCS/src/components/AppLayout.tsx#L75).

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

### 6. No Developer, Database, GitHub, or Supabase References
- **Target Audience**: These are human user-facing (consumer) help documents, not developer guides.
- **No Technical Backend Jargon**: Never mention database table names, schema keys, Supabase RPCs/functions, or specific code component files/paths (such as `RosterTable`, `cascade_work_order_status`, `contractor_profiles.total_weekly_hours`, or GitHub links).
- **Natural Language Representation**: Describe all fields, parameters, and tables in plain English (e.g., use `Serial Number` or `Daily Rate` instead of `serial_number` or `daily_rate`).
- **No Supabase or GitHub Branding**: Never mention "Supabase" or "GitHub" in the documentation text. Rephrase these references using generic terms like "the platform" or "the system".
- **Clean Formatting**: Format any UI status values or dropdown settings using capitalized words without code styling/backticks unless specifically representing literal code in an agent-only context (e.g. use `Reserved` or `In Use` instead of `reserved` or `in_use`).

