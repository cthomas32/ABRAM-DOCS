-- ---------------------------------------------------------------------
-- site_settings: the handful of values a person changes without a deploy.
--
-- One row per setting, keyed by a short name. It exists because the
-- password on /demos was an environment variable, and an environment
-- variable is changed by somebody who can open Vercel and trigger a
-- redeploy. That is the wrong bar for a word that gets handed out at the
-- end of a call, so the value moves here and the console gets a field.
--
-- Deliberately a key/value table rather than a settings row with a
-- column per thing. The set is small, unrelated and expected to grow one
-- item at a time; a column per setting means a migration per setting,
-- and a JSON blob means nothing can be granted separately from anything
-- else.
--
-- **Nothing here is readable by anon.** The first value stored is a
-- password, so the read policy is console-only and the public page reads
-- it with the service key on the server. If a setting is ever added that
-- the browser needs, it gets its own table or its own policy — not a
-- widening of this one.
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.site_settings (
    key        TEXT PRIMARY KEY,

    /* Always text. A setting that wants a number is a number spelled out,
       because the thing reading it has to validate the value anyway and a
       typed column would only move the failure earlier without removing
       it. */
    value      TEXT NOT NULL DEFAULT '',

    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT site_settings_key_check
        CHECK (key ~ '^[a-z0-9]+(_[a-z0-9]+)*$')
);

COMMENT ON TABLE public.site_settings IS
    'Key/value settings a console user can change without a deploy. Console-read only; never exposed to anon.';

CREATE OR REPLACE FUNCTION public.touch_site_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_site_settings_touch ON public.site_settings;
CREATE TRIGGER trg_site_settings_touch
    BEFORE UPDATE ON public.site_settings
    FOR EACH ROW EXECUTE FUNCTION public.touch_site_settings_updated_at();

/* ------------------------------------------------------------------ */
/*  Row level security                                                 */
/* ------------------------------------------------------------------ */

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Console reads settings"  ON public.site_settings;
DROP POLICY IF EXISTS "Owners write settings"   ON public.site_settings;

/* No anon policy at all. The demo password lives in this table, and a
   public read policy on it would put the password in the page bundle of
   anything that queried it with the anon key. */
CREATE POLICY "Console reads settings"
    ON public.site_settings FOR SELECT TO authenticated
    USING (public.has_console_access());

/* The same bar as publishing a demo, for the same reason: this changes
   what the marketing site does. */
CREATE POLICY "Owners write settings"
    ON public.site_settings FOR ALL TO authenticated
    USING (public.is_owner_or_admin())
    WITH CHECK (public.is_owner_or_admin());

/* ------------------------------------------------------------------ */
/*  The first setting                                                  */
/* ------------------------------------------------------------------ */

/* Seeded empty rather than with a word. An empty value means "not set
   here", which falls through to DEMOS_PASSWORD and then to the built-in
   default, so applying this migration changes nothing until somebody
   types something into the console. */
INSERT INTO public.site_settings (key, value)
VALUES ('demos_password', '')
ON CONFLICT (key) DO NOTHING;
