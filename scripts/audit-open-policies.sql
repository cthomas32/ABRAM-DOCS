-- =====================================================================
-- OPEN POLICY AUDIT
--
-- Run this against the production project immediately BEFORE and
-- immediately AFTER deploying the 2026-08-17 role migrations.
--
-- The role migrations sweep away every policy of the shape
--
--     FOR ALL TO authenticated USING (true)
--
-- but the sweep works from an explicit table list. Several tables in this
-- database were created in the Supabase dashboard rather than by a
-- migration, so a table nobody remembered to name keeps its open policy
-- and stays readable and writable by every login, including a growth
-- partner and a viewer. That is the failure this query catches, and it
-- catches it in seconds where an audit of the console would not catch it
-- at all.
--
-- HOW TO READ THE RESULTS
--
--   Query 1 must come back EMPTY after the deploy. Any row is a table
--   still open to every authenticated session. Add it to a policy group
--   in a follow-up migration. Do not leave it.
--
--   Query 2 should be checked BEFORE the deploy. Any row is a table with
--   RLS on and no policy at all, which means nobody can read it. That is
--   the safe direction to fail in and it is still an outage, so know
--   about it first.
--
--   Query 3 is context, not a pass or fail. It lists what survives per
--   table so the after-picture can be compared with intent.
--
-- HOW TO RUN
--
--   Supabase dashboard, SQL editor, on the DOCS project. Or:
--     psql "$DOCS_DATABASE_URL" -f scripts/audit-open-policies.sql
--
--   Read only. It creates nothing and changes nothing.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. STILL OPEN TO EVERY LOGIN. Must be empty after the deploy.
--
-- roles = {authenticated} exactly, so a `TO public` or `TO anon` policy
-- serving the marketing site is not reported here. Those are meant to be
-- open and removing one takes the public site down.
-- ---------------------------------------------------------------------
SELECT
    'OPEN TO EVERY LOGIN' AS finding,
    tablename,
    policyname,
    cmd,
    roles,
    qual
FROM pg_policies
WHERE schemaname = 'public'
  AND roles = ARRAY['authenticated']::name[]
  AND qual = 'true'
ORDER BY tablename, policyname;

-- ---------------------------------------------------------------------
-- 2. ABOUT TO GO DARK. RLS enabled, no policy of any kind.
-- ---------------------------------------------------------------------
SELECT
    'RLS ON, NO POLICY' AS finding,
    c.relname AS tablename
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity
  AND NOT EXISTS (
      SELECT 1 FROM pg_policies p
       WHERE p.schemaname = 'public'
         AND p.tablename = c.relname
  )
ORDER BY c.relname;

-- ---------------------------------------------------------------------
-- 3. THE WHOLE PICTURE, one line per table. Context for the diff.
-- ---------------------------------------------------------------------
SELECT
    c.relname AS tablename,
    c.relrowsecurity AS rls_enabled,
    count(p.policyname) AS policy_count,
    coalesce(string_agg(p.policyname, ', ' ORDER BY p.policyname), '(none)') AS policies
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policies p ON p.schemaname = 'public' AND p.tablename = c.relname
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
GROUP BY c.relname, c.relrowsecurity
ORDER BY c.relrowsecurity DESC, c.relname;
