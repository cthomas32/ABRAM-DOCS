---
name: abram-email-campaign-builder
description: Build, format, and insert email campaign drafts into the ABRAM database using design-system-aligned HTML templates.
---

# ABRAM Email Campaign Builder Skill

Use this skill when you need to write, design, or insert email newsletter campaigns for ABRAM. This skill provides instructions on how to compile markdown content into a design-system-compliant HTML email and store it as a draft in the Supabase database.

---

## 🛠️ Available Automation Tools

### Option A: Local Script Execution (Preferred in Local Shell)
If you have terminal access, execute the built-in campaign creator script. This script handles converting markdown to inline HTML, compiling it into the brand layout, generating plain-text copies, and inserting it into the database:

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

### Option B: Database-Only Insertion (For Mobile Claude App)
If you do not have terminal/shell access (e.g. running inside the mobile Claude App), you must compile the HTML content locally in your context and perform a direct SQL `INSERT` statement into the Supabase database.

#### SQL Insert Statement
```sql
INSERT INTO public.campaigns (
  title,
  subject,
  segment_id,
  status,
  html_content,
  text_content,
  recipients_count,
  metadata
) VALUES (
  'Changelog Update - June 2026',
  'Release Notes: v1.5.0 Update 🚀',
  '42a3da82-ad27-475f-b2ad-113c9c8fa6b8', -- Segment ID (default marketing)
  'draft', -- MUST always be inserted as 'draft'
  '<!DOCTYPE html>...', -- Compiled HTML campaign body
  'Plain text fallback text...', -- Plain text body
  36, -- Recipient estimate count
  '{
    "created_via": "claude_app_database_agent",
    "badge": "CHANGELOG",
    "headline": "Say Hello to Smarter Scheduling",
    "cta": {
      "text": "View the Release Notes",
      "url": "https://abram.network/changelog"
    }
  }'::jsonb
);
```

---

## 🎨 Design and Layout Compliance

All email layouts must align with `DESIGN.md` and the website's dark glass branding.
- **canvas background**: Pure dark `#0A0A0A`.
- **Card Background**: Deep black-zinc glass shade `#0F0F12`.
- **Card Borders**: `1px solid #27272A` (zinc-800) with a top catch highlight of `1px solid #3F3F46` (zinc-700) to simulate a glass edge.
- **Accents**:
  - **No Red Accents**: Never use brand red (`#CE1C1C` / `#ef4444`).
  - **Standard Blue**: Use `#3B82F6` for links.
  - **Light Blue**: Use `#8ECAFF` for version/badge labels.
- **Fonts**: Geist Sans font stack: `'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.
- **Primary CTA Buttons**: Solid cream background (`#FAFAF9`), dark text (`#0A0A0A`), compact sizing (`padding: 10px 24px`, `font-size: 12px`, pill shape `border-radius: 9999px;`).

### ⚠️ Crucial Compatibility Fix: Pill Borders
To prevent email clients from overriding the pill borders (`border-radius: 9999px`) to sharp rectangular shapes, you **must** declare `border-collapse: separate !important;` inline on the parent `<table>` and `<td>` elements of the badge and CTA buttons:
```html
<table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 18px; border-collapse: separate !important;">
  <tr>
    <td align="center" style="border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 9999px; padding: 4px 12px; background-color: rgba(255, 255, 255, 0.04); border-collapse: separate !important; vertical-align: middle;">
      <span style="font-size: 10px; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase; color: #8ECAFF; font-family: 'Geist Sans', sans-serif; line-height: 1;">
        VERSION 1.5.0
      </span>
    </td>
  </tr>
</table>
```

---

## 🔒 Personalization & Security Constraints
- **Personalization tags**:
  - First Name: `{{{contact.first_name|there}}}` (resolved at delivery time).
  - Unsubscribe Link: `{{{RESEND_UNSUBSCRIBE_URL}}}`.
- **Legal Footer Requirement**: Every footer **must** include: **Thomas Abram, Inc. • Washington, DC**.
- **No Direct Send**: Campaigns must **always** be inserted with `status: 'draft'`. Bypassing this or triggering sends directly is prohibited.
