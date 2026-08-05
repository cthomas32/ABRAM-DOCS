-- =====================================================================
-- CRM ADVISOR FIXES
--
-- Everything the Supabase linter flagged against the objects created in
-- 20260804120000_crm_conference_capture.sql. Additive and scoped to
-- crm_* objects only.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. VIEW RUNS AS THE CALLER
-- A view defaults to the permissions of whoever created it, which would
-- let anyone reaching crm_event_stats read straight past the row level
-- security on the tables underneath. security_invoker makes the reader's
-- own policies apply, so the admin console sees everything and the
-- public sees nothing.
-- Lint: 0010_security_definer_view (ERROR)
-- ---------------------------------------------------------------------
ALTER VIEW public.crm_event_stats SET (security_invoker = true);

-- ---------------------------------------------------------------------
-- 2. PIN THE TRIGGER FUNCTION'S SEARCH PATH
-- Without this the function resolves names against whatever search_path
-- the calling role happens to have.
-- Lint: 0011_function_search_path_mutable (WARN)
-- ---------------------------------------------------------------------
ALTER FUNCTION public.crm_touch_updated_at() SET search_path = public;

-- ---------------------------------------------------------------------
-- 3. COUNTERS ARE FOR THE SERVER, NOT THE BROWSER
-- Both bump functions are SECURITY DEFINER and write to the codes table.
-- They are only ever called from the ingest routes with the service
-- role, so nobody holding a publishable key should be able to inflate a
-- scan count by posting to /rest/v1/rpc.
-- Lint: 0028_anon_security_definer_function_executable (WARN)
--       0029_authenticated_security_definer_function_executable (WARN)
-- ---------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.crm_bump_code_scan(UUID)    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.crm_bump_code_capture(UUID) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.crm_bump_code_scan(UUID)    TO service_role;
GRANT EXECUTE ON FUNCTION public.crm_bump_code_capture(UUID) TO service_role;

-- ---------------------------------------------------------------------
-- 4. COVERING INDEXES FOR THE REMAINING FOREIGN KEYS
-- crm_contacts.code_id and crm_contacts.scan_id both cascade on delete
-- and both are read when a contact card is opened next to the scan that
-- produced it.
-- Lint: 0001_unindexed_foreign_keys (INFO)
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_crm_contacts_code ON public.crm_contacts (code_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_scan ON public.crm_contacts (scan_id);

-- ---------------------------------------------------------------------
-- 5. ONE POLICY PER ROLE ON PROFILES
-- The public read policy was written against every role, so a signed in
-- admin was evaluating it as well as their own policy on every select.
-- Scoping it to anon leaves behaviour identical: a stranger loading a
-- card is anon, and an admin is already covered by "Admins manage
-- profiles".
-- Lint: 0006_multiple_permissive_policies (WARN)
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read of active cards" ON public.crm_profiles;
CREATE POLICY "Public read of active cards"
    ON public.crm_profiles FOR SELECT TO anon USING (is_active);
