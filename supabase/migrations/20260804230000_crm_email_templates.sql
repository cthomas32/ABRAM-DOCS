-- =====================================================================
-- THE WORDS THE FOLLOW UP EMAIL IS MADE OF
-- 4 August 2026
--
-- Somewhere to keep an edited version of an email the conference capture
-- sends, so the wording can change without a deploy.
--
-- Deliberately its own table rather than rows in email_templates. That
-- table holds one dark glassmorphic broadcast shell with a single
-- html_template column and a bag of design tokens, and it is filled in by
-- a composer that supplies a headline, a body and a call to action. What
-- lands in a stranger's inbox an hour after a handshake is a plain note
-- with a subject line, a plain text part and an HTML part, and no shell
-- around it at all. Sharing a table would mean a NOT NULL html_template
-- carrying a note it was never shaped for, and a broadcast layout change
-- reaching an email nobody meant to touch.
--
-- Empty is the normal state. The built in copy lives in
-- src/lib/crm/emailTemplates.ts and is what sends when there is no row
-- here, so a fresh database, an unreachable one and a reset all behave
-- the same way: the original email goes out. A row appears the first time
-- somebody saves an edit and disappears again on reset.
--
-- Additive only. Nothing here is read by any existing screen.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.crm_email_templates (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Stable identifier, matched against the registry in code. More emails
    -- will be added later, so the key is the join and never the row id.
    key         TEXT NOT NULL UNIQUE,
    subject     TEXT NOT NULL DEFAULT '',
    body_text   TEXT NOT NULL DEFAULT '',
    body_html   TEXT NOT NULL DEFAULT '',
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.crm_email_templates IS
    'Edited copy for the emails the conference capture sends. A missing row means the built in copy in src/lib/crm/emailTemplates.ts is used, which is also what happens when a row here fails to render.';

COMMENT ON COLUMN public.crm_email_templates.key IS
    'Stable identifier for one email. capture_follow_up is the note sent when somebody leaves their details.';

CREATE OR REPLACE FUNCTION public.crm_email_templates_touch()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_crm_email_templates_touch ON public.crm_email_templates;
CREATE TRIGGER trg_crm_email_templates_touch
    BEFORE UPDATE ON public.crm_email_templates
    FOR EACH ROW EXECUTE FUNCTION public.crm_email_templates_touch();

-- ---------------------------------------------------------------------
-- Closed, like every other CRM table. The console reads and writes as a
-- signed in admin. The capture route reads with the service role, which
-- bypasses this entirely, so a policy change can never silence a send.
-- ---------------------------------------------------------------------
ALTER TABLE public.crm_email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage crm email templates" ON public.crm_email_templates;
CREATE POLICY "Admins manage crm email templates"
    ON public.crm_email_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
