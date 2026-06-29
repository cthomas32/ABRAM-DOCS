/* eslint-disable */
/**
 * Seed script: inserts the three dark-mode glassmorphic email templates
 * into public.email_templates on fovvtmwmrivuwnqemcil.supabase.co
 *
 * Run: node scripts/seed-email-templates.js
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// ── Load .env.local ─────────────────────────────────────────────────────────
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) return;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

console.log(`🔗  Targeting: ${SUPABASE_URL}`);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── Design tokens (shared) ───────────────────────────────────────────────────
const DESIGN_TOKENS = {
  canvas_bg: '#0A0A0A',
  card_bg: '#0F0F12',
  card_border: '#27272A',
  card_border_top: '#3F3F46',
  text_primary: '#FAFAF9',
  text_secondary: '#A1A1AA',
  text_muted: '#71717A',
  text_link: '#3B82F6',
  badge_color: '#8ECAFF',
  badge_bg: 'rgba(255, 255, 255, 0.04)',
  badge_border: 'rgba(255, 255, 255, 0.15)',
  cta_bg: '#FAFAF9',
  cta_color: '#0A0A0A',
  font_family: "'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

// ── Shared wrapper HTML builder ──────────────────────────────────────────────
function buildEmail({ title, headStyle = '', innerContent }) {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>${title}</title>
    <style type="text/css">
      body { margin:0;padding:0;min-width:100% !important;width:100% !important;background-color:#0A0A0A;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%; }
      table,td { mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse !important; }
      img { border:0;height:auto;line-height:100%;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic; }
      .btn-primary:hover { background-color:#E4E4E7 !important; }
      .link-hover:hover { color:#FAFAF9 !important;text-decoration:underline !important; }
      @media screen and (max-width:620px) {
        .container-table { width:100% !important;max-width:100% !important;border-radius:0px !important;border:none !important; }
        .content-padding { padding:32px 24px !important; }
      }
      ${headStyle}
    </style>
  </head>
  <body style="margin:0;padding:0;background-color:#0A0A0A;font-family:'Geist Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#FAFAF9;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0A0A0A" style="table-layout:fixed;">
      <tr>
        <td align="center" style="padding:40px 10px;">
          <table width="600" cellpadding="0" cellspacing="0" border="0" class="container-table" bgcolor="#0F0F12"
            style="width:600px;border-radius:16px;border:1px solid #27272A;border-top:1px solid #3F3F46;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.6);">
            <!-- Logo -->
            <tr>
              <td align="center" style="padding:44px 32px 16px;">
                <img src="https://abram.network/abram-logo-lockup-cream.png" alt="ABRAM" width="110" height="22"
                  style="border:0;display:block;outline:none;text-decoration:none;" />
              </td>
            </tr>
            <!-- Main content -->
            ${innerContent}
            <!-- Footer -->
            <tr>
              <td style="padding:0 32px 40px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #27272A;padding-top:24px;">
                  <tr>
                    <td>
                      <p style="font-size:11px;color:#71717A;line-height:1.6;margin:0;">
                        You are receiving this because you subscribed to updates from ABRAM.
                      </p>
                      <p style="font-size:11px;color:#71717A;line-height:1.6;margin:6px 0 0 0;">
                        Thomas Abram, Inc. &bull; Washington, DC &bull;
                        <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" class="link-hover" style="color:#3B82F6;text-decoration:underline;">Unsubscribe</a> from this list.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// ── Template definitions ─────────────────────────────────────────────────────
const TEMPLATES = [
  {
    name: 'editorial',
    description: 'Classic dark-mode glassmorphic newsletter layout with header logo, headline, cream CTA, and standard blue links.',
    subject_layout: 'Update: New Release & Insights from ABRAM',
    badge_layout: 'NEWS',
    html_template: buildEmail({
      title: 'ABRAM Update',
      innerContent: `
            <tr>
              <td class="content-padding" style="padding:16px 32px 32px;">
                <h1 style="font-size:24px;font-weight:600;color:#FAFAF9;margin-top:0;margin-bottom:16px;line-height:1.35;letter-spacing:-0.02em;">
                  Our Latest Update
                </h1>
                <div style="font-size:14px;color:#A1A1AA;line-height:1.6;margin-bottom:28px;">
                  <p style="margin:0 0 16px 0;">Write your announcement body here. Customize this layout to share news, insights, or blog updates with your subscribers.</p>
                </div>
                <table cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 16px;border-collapse:separate !important;">
                  <tr>
                    <td align="center" style="background-color:#FAFAF9;border-radius:9999px;border-collapse:separate !important;">
                      <a href="https://abram.network" target="_blank" class="btn-primary"
                        style="display:inline-block;padding:12px 28px;font-size:13px;font-weight:600;color:#0A0A0A;text-decoration:none;border-radius:9999px;">
                        Read Full Story
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`,
    }),
    design_tokens: DESIGN_TOKENS,
  },
  {
    name: 'changelog',
    description: 'Release updates changelog template with version badge pill, bulleted list, and solid cream CTA button.',
    subject_layout: 'Release Notes: ABRAM Network v1.1.0 Update',
    badge_layout: 'CHANGELOG',
    html_template: buildEmail({
      title: 'Changelog Update',
      innerContent: `
            <tr>
              <td class="content-padding" style="padding:16px 32px 32px;">
                <!-- Version badge -->
                <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;border-collapse:separate !important;">
                  <tr>
                    <td align="center" style="border:1px solid rgba(255,255,255,0.15);border-radius:9999px;padding:4px 12px;background-color:rgba(255,255,255,0.04);border-collapse:separate !important;vertical-align:middle;">
                      <span style="font-size:10px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;color:#8ECAFF;line-height:1;">VERSION 1.1.0</span>
                    </td>
                  </tr>
                </table>
                <h1 style="font-size:24px;font-weight:600;color:#FAFAF9;margin-top:0;margin-bottom:16px;line-height:1.35;letter-spacing:-0.02em;">
                  Changelog: What's New
                </h1>
                <div style="font-size:14px;color:#A1A1AA;line-height:1.6;margin-bottom:28px;">
                  <p style="margin:0 0 12px 0;">Here are the updates pushed in our latest deployment:</p>
                  <ul style="padding-left:20px;margin:12px 0;color:#A1A1AA;">
                    <li style="margin-bottom:8px;"><strong style="color:#FAFAF9;font-weight:600;">New Feature</strong>: Explain your new feature here.</li>
                    <li style="margin-bottom:8px;"><strong style="color:#FAFAF9;font-weight:600;">Performance Boost</strong>: Outline speed/efficiency updates.</li>
                    <li style="margin-bottom:8px;"><strong style="color:#FAFAF9;font-weight:600;">Bug Fixes</strong>: List fixed bugs.</li>
                  </ul>
                </div>
                <table cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 16px;border-collapse:separate !important;">
                  <tr>
                    <td align="center" style="background-color:#FAFAF9;border-radius:9999px;border-collapse:separate !important;">
                      <a href="https://abram.network/changelog" target="_blank" class="btn-primary"
                        style="display:inline-block;padding:12px 28px;font-size:13px;font-weight:600;color:#0A0A0A;text-decoration:none;border-radius:9999px;">
                        View Full Changelog
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`,
    }),
    design_tokens: DESIGN_TOKENS,
  },
  {
    name: 'minimal',
    description: 'Minimal Text / Standard Update template with dark glass container and signature, optimized for direct messages.',
    subject_layout: 'Quick Update from ABRAM Team',
    badge_layout: 'UPDATE',
    html_template: buildEmail({
      title: 'Quick Update',
      innerContent: `
            <tr>
              <td class="content-padding" style="padding:16px 32px 32px;">
                <h1 style="font-size:24px;font-weight:600;color:#FAFAF9;margin-top:0;margin-bottom:16px;line-height:1.35;letter-spacing:-0.02em;">
                  ABRAM News
                </h1>
                <div style="font-size:14px;color:#A1A1AA;line-height:1.6;margin-bottom:28px;">
                  <p style="margin:0 0 16px 0;">Hello {{{first_name}}},</p>
                  <p style="margin:0 0 16px 0;">Write your message here. This template uses a brand-aligned dark background and light text optimized for readability and compliance with the ABRAM brand system.</p>
                  <p style="margin:24px 0 0 0;">Best regards,<br>The ABRAM Team</p>
                </div>
              </td>
            </tr>`,
    }),
    design_tokens: DESIGN_TOKENS,
  },
];

// ── Run ──────────────────────────────────────────────────────────────────────
async function main() {
  // First check what's currently there
  const { data: existing, error: fetchErr } = await supabase
    .from('email_templates')
    .select('name');

  if (fetchErr) {
    console.error('❌  Failed to fetch existing templates:', fetchErr.message);
    process.exit(1);
  }

  console.log(`📋  Existing templates: ${existing.map(r => r.name).join(', ') || '(none)'}`);

  // Upsert all three templates
  const { data, error } = await supabase
    .from('email_templates')
    .upsert(TEMPLATES, { onConflict: 'name' })
    .select('name');

  if (error) {
    console.error('❌  Upsert failed:', error.message);
    console.error('    Details:', error.details || error.hint || '');
    process.exit(1);
  }

  console.log(`✅  Seeded templates: ${data.map(r => r.name).join(', ')}`);

  // Final count
  const { data: final } = await supabase.from('email_templates').select('name');
  console.log(`📊  Total templates in DB: ${final?.length ?? '?'} → [${final?.map(r => r.name).join(', ')}]`);
}

main();
