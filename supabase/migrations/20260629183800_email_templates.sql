-- Migration: Create email_templates table and seed default standard template
-- Created: 2026-06-29T18:38:00Z
-- Description: Standardizes email layouts and templates by storing them in Supabase along with styling design tokens.

CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    subject_layout TEXT,
    badge_layout TEXT,
    html_template TEXT NOT NULL,
    design_tokens JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_update_email_templates_updated_at
    BEFORE UPDATE ON public.email_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_email_templates_updated_at();

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow authenticated full access to email_templates" ON public.email_templates;
CREATE POLICY "Allow authenticated full access to email_templates"
    ON public.email_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed default standard template
INSERT INTO public.email_templates (name, description, subject_layout, badge_layout, html_template, design_tokens)
VALUES (
    'standard',
    'Standard ABRAM dark-mode glassmorphic newsletter email template.',
    '{{SUBJECT}}',
    '{{BADGE}}',
    $$<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>{{EMAIL_SUBJECT}}</title>
    <style type="text/css">
      body {
        margin: 0;
        padding: 0;
        min-width: 100% !important;
        width: 100% !important;
        background-color: #0A0A0A;
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }
      table, td {
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
        border-collapse: collapse !important;
      }
      img {
        border: 0;
        height: auto;
        line-height: 100%;
        outline: none;
        text-decoration: none;
        -ms-interpolation-mode: bicubic;
      }
      .btn-primary:hover {
        background-color: #E4E4E7 !important;
      }
      .btn-glass:hover {
        background-color: #27272A !important;
        border-color: #52525B !important;
      }
      .link-hover:hover {
        color: #FAFAF9 !important;
        text-decoration: underline !important;
      }
      @media screen and (max-width: 620px) {
        .container-table {
          width: 100% !important;
          max-width: 100% !important;
          border-radius: 0px !important;
          border-left: none !important;
          border-right: none !important;
        }
        .content-padding {
          padding: 32px 24px !important;
        }
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FAFAF9;">
    
    <!-- Hidden Preheader for Inbox Preview -->
    <div style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; line-height: 1px; color: #FAF9F6; opacity: 0;">
      {{PREHEADER_TEXT}}
    </div>
    
    <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0A0A0A" style="table-layout: fixed;">
      <tr>
        <td align="center" style="padding: 40px 10px;">
          <!-- Simulated Glass Card -->
          <table width="600" cellpadding="0" cellspacing="0" border="0" class="container-table" bgcolor="#0F0F12" style="width: 600px; border-radius: 16px; border: 1px solid #27272A; border-top: 1px solid #3F3F46; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.6);">
            
            <!-- Floating Logo Header (Unified spacing, no harsh border line) -->
            <tr>
              <td align="center" style="padding: 44px 32px 16px;">
                <img src="https://abram.network/abram-logo-lockup-cream.png" alt="ABRAM" width="110" height="22" style="border: 0; display: block; outline: none; text-decoration: none;" />
              </td>
            </tr>
            
            <!-- Main Content -->
            <tr>
              <td class="content-padding" style="padding: 16px 32px 32px;">
                {{BADGE_SECTION}}
                
                <h1 style="font-size: 24px; font-weight: 600; color: #FAFAF9; margin-top: 0; margin-bottom: 16px; line-height: 1.35; letter-spacing: -0.02em; font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, sans-serif;">
                  {{HEADLINE}}
                </h1>
                
                <div style="font-size: 14px; color: #A1A1AA; line-height: 1.6; margin-bottom: 28px; font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, sans-serif;">
                  {{{BODY_CONTENT}}}
                </div>
                
                {{CTA_SECTION}}
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="padding: 0 32px 40px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 1px solid #27272A; padding-top: 24px;">
                  <tr>
                    <td align="left">
                      <p style="font-size: 11px; color: #71717A; line-height: 1.6; margin: 0; font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, sans-serif;">
                        You are receiving this because you subscribed to updates from ABRAM.
                      </p>
                      <p style="font-size: 11px; color: #71717A; line-height: 1.6; margin: 6px 0 0 0; font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, sans-serif;">
                        Thomas Abram, Inc. &bull; Washington, DC &bull; <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" class="link-hover" style="color: #3B82F6; text-decoration: underline;">Unsubscribe</a> from this list.
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
</html>$$,
    $${
      "canvas_bg": "#0A0A0A",
      "card_bg": "#0F0F12",
      "card_border": "#27272A",
      "card_border_top": "#3F3F46",
      "text_primary": "#FAFAF9",
      "text_secondary": "#A1A1AA",
      "text_muted": "#71717A",
      "text_link": "#3B82F6",
      "badge_color": "#8ECAFF",
      "badge_bg": "rgba(255, 255, 255, 0.04)",
      "badge_border": "rgba(255, 255, 255, 0.15)",
      "cta_bg": "#FAFAF9",
      "cta_color": "#0A0A0A",
      "font_family": "'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    }$$::jsonb
) ON CONFLICT (name) DO UPDATE 
SET html_template = EXCLUDED.html_template, 
    design_tokens = EXCLUDED.design_tokens,
    updated_at = timezone('utc'::text, now());
