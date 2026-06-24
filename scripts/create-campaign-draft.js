/* eslint-disable */
/**
 * ABRAM Campaign Draft Creator
 * This script compiles markdown email copy into the design-system-aligned
 * HTML template and securely inserts it into the Supabase database.
 * 
 * Usage:
 * node scripts/create-campaign-draft.js \
 *   --title "Weekly Update - June 2026" \
 *   --subject "Check out our new features! 🚀" \
 *   --badge "CHANGELOG" \
 *   --headline "New Integrations & Feature Spotlight" \
 *   --markdown-file "./content/my-email.md" \
 *   --cta-text "Read More" \
 *   --cta-url "https://abram.network/changelog"
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Manually load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const parts = trimmed.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        let val = parts.slice(1).join('=').trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    });
  }
}

// 2. Parse command line arguments
function parseArgs() {
  const args = {};
  const rawArgs = process.argv.slice(2);
  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];
    if (arg.startsWith('--')) {
      const key = arg.substring(2);
      const nextArg = rawArgs[i + 1];
      if (nextArg && !nextArg.startsWith('--')) {
        args[key] = nextArg;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

// 3. Convert basic markdown to email-safe inline HTML
function markdownToHtml(markdown) {
  if (!markdown) return '';
  
  // Normalize line endings
  let text = markdown.replace(/\r\n/g, '\n').trim();
  
  // Parse Blockquotes: > quote
  text = text.replace(/^>\s+(.*?)$/gm, '<blockquote style="margin: 0 0 16px 0; padding-left: 16px; border-left: 2px solid #CE1C1C; color: #D4D4D8; font-style: italic;">$1</blockquote>');
  
  // Parse Headings: ### title, ## title
  text = text.replace(/^###\s+(.*?)$/gm, '<h3 style="font-size: 16px; font-weight: 600; color: #FAFAF9; margin-top: 20px; margin-bottom: 8px;">$1</h3>');
  text = text.replace(/^##\s+(.*?)$/gm, '<h2 style="font-size: 18px; font-weight: 600; color: #FAFAF9; margin-top: 24px; margin-bottom: 12px;">$1</h2>');
  text = text.replace(/^#\s+(.*?)$/gm, '<h1 style="font-size: 20px; font-weight: 700; color: #FAFAF9; margin-top: 28px; margin-bottom: 16px;">$1</h1>');

  // Split into blocks by double newlines (paragraphs / lists)
  const blocks = text.split(/\n\n+/);
  const parsedBlocks = blocks.map(block => {
    const trimmed = block.trim();
    if (!trimmed) return '';
    
    // If it's already a heading or blockquote, return as-is
    if (trimmed.startsWith('<h') || trimmed.startsWith('<blockquote')) {
      return trimmed;
    }
    
    // Parse Unordered Lists
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const items = trimmed.split(/\n[-*]\s+/);
      const listHtml = items.map((item, index) => {
        let cleanItem = item.trim();
        if (index === 0) {
          cleanItem = cleanItem.replace(/^[-*]\s+/, '');
        }
        if (!cleanItem) return '';
        // Apply inline styles to items
        cleanItem = inlineStyles(cleanItem);
        return `<li style="margin-bottom: 8px; line-height: 1.6; font-size: 15px; color: #A1A1AA;">${cleanItem}</li>`;
      }).filter(Boolean).join('');
      return `<ul style="margin: 0 0 16px 0; padding-left: 20px; color: #A1A1AA;">${listHtml}</ul>`;
    }
    
    // Standard Paragraph
    const inlineContent = inlineStyles(trimmed);
    return `<p style="margin-top: 0; margin-bottom: 16px; line-height: 1.6; color: #A1A1AA; font-size: 15px;">${inlineContent}</p>`;
  });
  
  return parsedBlocks.filter(Boolean).join('\n');
}

// 4. Helper to replace inline styles (Bold, Italics, Code, Links)
function inlineStyles(text) {
  let clean = text;
  // Bold: **text**
  clean = clean.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600; color: #FAFAF9;">$1</strong>');
  // Italics: *text* or _text_
  clean = clean.replace(/\*(.*?)\*/g, '<em style="font-style: italic; color: #D4D4D8;">$1</em>');
  // Inline Code: `code`
  clean = clean.replace(/`(.*?)`/g, '<code style="font-family: Menlo, Monaco, Consolas, \'Courier New\', monospace; font-size: 13px; background-color: #1F1F23; padding: 2px 6px; border-radius: 4px; color: #FAFAF9;">$1</code>');
  // Links: [text](url)
  clean = clean.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" style="color: #CE1C1C; text-decoration: underline;">$1</a>');
  return clean;
}

// 5. Opaque stripping of HTML to generate clean text fallback
function htmlToText(html) {
  let clean = html
    .replace(/<style([\s\S]*?)<\/style>/gi, '')
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '"$1"\n')
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n\n$1\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n\s*\n+/g, '\n\n')
    .trim();
  return clean;
}

// 6. Template compilation
function compileTemplate(data) {
  const templatePath = path.join(__dirname, 'email-template.html');
  let template = '';
  
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf8');
  } else {
    // Inline fallback template if file is missing
    template = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>{{EMAIL_SUBJECT}}</title>
    <style type="text/css">
      body { margin: 0; padding: 0; min-width: 100% !important; width: 100% !important; background-color: #0A0A0A; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse !important; }
      img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
      .btn-primary:hover { background-color: #E4E4E7 !important; }
      .btn-accent:hover { background-color: #A31616 !important; }
      .link-hover:hover { color: #FAFAF9 !important; text-decoration: underline !important; }
      @media screen and (max-width: 620px) {
        .container-table { width: 100% !important; max-width: 100% !important; border-radius: 0px !important; border-left: none !important; border-right: none !important; }
        .content-padding { padding: 32px 20px !important; }
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Geist Sans', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FAFAF9;">
    <div style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; line-height: 1px; color: #FAF9F6; opacity: 0;">
      {{PREHEADER_TEXT}}
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0A0A0A" style="table-layout: fixed;">
      <tr>
        <td align="center" style="padding: 40px 10px;">
          <table width="600" cellpadding="0" cellspacing="0" border="0" class="container-table" bgcolor="#0F0F11" style="width: 600px; border-radius: 16px; border: 1px solid #1F1F23; overflow: hidden;">
            <tr>
              <td align="center" style="padding: 32px 20px 24px; border-bottom: 1px solid #1F1F23;">
                <span style="font-size: 18px; font-weight: 700; color: #FAFAF9; letter-spacing: 2px; text-transform: uppercase;">ABRAM</span>
              </td>
            </tr>
            <tr>
              <td class="content-padding" style="padding: 40px 32px;">
                {{BADGE_SECTION}}
                <h1 style="font-size: 24px; font-weight: 700; color: #FAFAF9; margin-top: 0; margin-bottom: 16px; line-height: 1.35; letter-spacing: -0.015em;">
                  {{HEADLINE}}
                </h1>
                <div style="font-size: 15px; color: #A1A1AA; line-height: 1.6; margin-bottom: 32px;">
                  {{{BODY_CONTENT}}}
                </div>
                {{CTA_SECTION}}
              </td>
            </tr>
            <tr>
              <td style="padding: 0 32px 40px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 1px solid #1F1F23; padding-top: 24px;">
                  <tr>
                    <td align="left">
                      <p style="font-size: 12px; color: #71717A; line-height: 1.6; margin: 0;">
                        You are receiving this because you subscribed to updates from ABRAM.
                      </p>
                      <p style="font-size: 12px; color: #71717A; line-height: 1.6; margin: 6px 0 0 0;">
                        ABRAM Inc. &bull; <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" class="link-hover" style="color: #CE1C1C; text-decoration: underline;">Unsubscribe</a> from this list.
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
</html>
`;
  }

  // Compile Badge section
  const badgeSection = data.badge
    ? `<table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 18px;">
        <tr>
          <td align="center" style="border: 1px solid #CE1C1C; border-radius: 9999px; padding: 4px 12px; background-color: rgba(206, 28, 28, 0.08);">
            <span style="font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #CE1C1C;">
              ${data.badge}
            </span>
          </td>
        </tr>
      </table>`
    : '';

  // Compile CTA section
  const ctaSection = data.ctaUrl
    ? `<table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 8px;">
        <tr>
          <td bgcolor="${data.ctaBg}" class="${data.ctaClass}" style="border-radius: 9999px; overflow: hidden;">
            <a href="${data.ctaUrl}" target="_blank" style="display: block; padding: 12px 28px; font-size: 13px; font-weight: 600; color: ${data.ctaColor}; text-decoration: none; text-align: center;">
              ${data.ctaText}
            </a>
          </td>
        </tr>
      </table>`
    : '';

  // Safe variables replacement
  let html = template;
  html = html.replace(/\{\{EMAIL_SUBJECT\}\}/g, data.subject || '');
  html = html.replace(/\{\{PREHEADER_TEXT\}\}/g, data.preheader || '');
  html = html.replace(/\{\{BADGE_SECTION\}\}/g, badgeSection);
  html = html.replace(/\{\{HEADLINE\}\}/g, data.headline || '');
  html = html.replace(/\{\{\{BODY_CONTENT\}\}\}/g, data.bodyHtml || '');
  html = html.replace(/\{\{CTA_SECTION\}\}/g, ctaSection);
  html = html.replace(/\{\{\{RESEND_UNSUBSCRIBE_URL\}\}\}/g, '{{{RESEND_UNSUBSCRIBE_URL}}}'); // Retain for Resend engine substitution
  
  return html;
}

async function main() {
  loadEnv();
  const args = parseArgs();

  // Validate credentials
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured in environment variables.');
    process.exit(1);
  }

  // Validate required args
  if (!args.title || !args.subject || !args.headline) {
    console.error('Error: Missing required arguments. --title, --subject, and --headline are required.');
    process.exit(1);
  }

  // Load markdown content
  let markdown = '';
  if (args.markdown) {
    markdown = args.markdown;
  } else if (args['markdown-file']) {
    const mdPath = path.resolve(args['markdown-file']);
    if (fs.existsSync(mdPath)) {
      markdown = fs.readFileSync(mdPath, 'utf8');
    } else {
      console.error(`Error: Markdown file not found at ${mdPath}`);
      process.exit(1);
    }
  } else {
    console.error('Error: Please provide email body copy via either --markdown "text" or --markdown-file "./file.md".');
    process.exit(1);
  }

  // Compile components
  const bodyHtml = markdownToHtml(markdown);
  const textContent = htmlToText(bodyHtml);
  const preheader = args.preheader || textContent.substring(0, 130).replace(/\n/g, ' ') + '...';

  const campaignData = {
    subject: args.subject,
    preheader: preheader,
    badge: args.badge || '',
    headline: args.headline,
    bodyHtml: bodyHtml,
    ctaText: args['cta-text'] || 'Read More',
    ctaUrl: args['cta-url'] || '',
    ctaBg: args['cta-bg'] || '#CE1C1C',
    ctaColor: args['cta-color'] || '#FAFAF9',
    ctaClass: args['cta-bg'] ? 'btn-custom' : 'btn-accent'
  };

  const htmlContent = compileTemplate(campaignData);

  // Initialize Supabase Client
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Sending draft payload to Supabase campaigns table...');
  const segmentId = args.segment || process.env.RESEND_MARKETING_SEGMENT_ID || '8324468f-0399-4c05-9b98-3e17e76ffa41';

  // Get recipient count estimate from database
  let recipientsCount = 0;
  const isApplicationSegment = segmentId === (process.env.RESEND_APPLICATION_SEGMENT_ID || '42a3da82-ad27-475f-b2ad-113c9c8fa6b8');
  const targetColumn = isApplicationSegment ? 'is_application_list' : 'is_marketing_list';

  try {
    const { count, error: countError } = await supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .eq(targetColumn, true)
      .eq('status', 'subscribed');
    
    if (!countError) {
      recipientsCount = count || 0;
    }
  } catch (err) {}

  const { data: campaign, error: dbError } = await supabase
    .from('campaigns')
    .insert({
      title: args.title,
      subject: args.subject,
      segment_id: segmentId,
      status: 'draft',
      html_content: htmlContent,
      text_content: textContent,
      recipients_count: recipientsCount,
      metadata: {
        created_via: 'claude_app_cli_automation',
        badge: args.badge || null,
        headline: args.headline,
        cta: args['cta-url'] ? { text: args['cta-text'], url: args['cta-url'] } : null
      }
    })
    .select()
    .single();

  if (dbError) {
    console.error('Database Insertion Error:', dbError.message);
    process.exit(1);
  }

  console.log('=============================================');
  console.log('Campaign Draft Created Successfully!');
  console.log(`Campaign ID: ${campaign.id}`);
  console.log(`Title:       ${campaign.title}`);
  console.log(`Subject:     ${campaign.subject}`);
  console.log(`Recipients:  ${campaign.recipients_count} subscribers`);
  console.log('=============================================');
}

main();
