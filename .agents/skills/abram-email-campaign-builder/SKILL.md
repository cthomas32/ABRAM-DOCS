---
name: abram-email-campaign-builder
description: Build, format, and insert email campaign drafts into the ABRAM database using design-system-aligned HTML templates.
---

# ABRAM Email Campaign Builder Skill

Use this skill when you need to write, design, or insert email newsletter campaigns for ABRAM. This skill provides instructions on how to compile markdown content into a design-system-compliant HTML email and store it as a draft in the Supabase database.

---

## 🛠️ Available Automation Tools

Instead of writing custom SQL or database clients, you should execute the built-in campaign creator script. This script handles:
1. Reading markdown files or raw strings.
2. Converting markdown structures into email-safe inline HTML (e.g., `<p>`, `<ul>`, `<a>` tags with hex styles).
3. Compiling the final body into the official table-based brand template.
4. Calculating plain-text fallback copy.
5. Securely inserting the record as a `'draft'` into the `public.campaigns` table.

### CLI Usage Example:
```bash
node scripts/create-campaign-draft.js \
  --title "Weekly Update - June 2026" \
  --subject "Check out our new features! 🚀" \
  --badge "CHANGELOG" \
  --headline "New Integrations & Feature Spotlight" \
  --markdown "This is a **bold** update! Read more at [abram.network](https://abram.network)." \
  --cta-text "Read More" \
  --cta-url "https://abram.network/changelog"
```

### Script Arguments:
* `--title` (Required): Internal reference title.
* `--subject` (Required): Email subject line.
* `--headline` (Required): Card heading inside the email.
* `--markdown` (Either this or --markdown-file is required): Markdown content of the email body.
* `--markdown-file`: Path to a markdown file (useful for importing blog posts or release notes).
* `--badge` (Optional): Small red uppercase tag above the headline (e.g., `CHANGELOG`, `ANNOUNCEMENT`).
* `--cta-text` (Optional): Text on the action button (default: `Read More`).
* `--cta-url` (Optional): Destination URL for the button.
* `--cta-bg` (Optional): Hex background color for the button (default: `#CE1C1C`).
* `--cta-color` (Optional): Hex text color for the button (default: `#FAFAF9`).
* `--segment` (Optional): Target segment ID. Defaults to the general Marketing segment.

---

## 🎨 Design and Layout Compliance

If writing or editing email copy, all formats must align with `DESIGN.md`. Ensure that:
* **Brand Accent**: Use `#CE1C1C` for buttons, badge borders, and links.
* **Neutral Palette**: Dark backgrounds are `#0A0A0A` (canvas) and `#0F0F11` (inner card), text is `#FAFAF9` (primary) and `#A1A1AA` (paragraphs).
* **Button Shape**: Pill-shaped (`rounded-full`).

---

## 🔒 Security Constraints & RLS
* **No Direct Send**: Campaigns must **always** be inserted with `status: 'draft'`. Under no circumstances should an agent attempt to bypass the draft status or trigger direct sends. Sending requires manual admin authorization on the CMS dashboard.
* **RLS Protection**: All operations are protected by RLS. The script automatically reads `SUPABASE_SERVICE_ROLE_KEY` from `.env.local` to securely insert the draft. Ensure `.env.local` is never committed to Git.
