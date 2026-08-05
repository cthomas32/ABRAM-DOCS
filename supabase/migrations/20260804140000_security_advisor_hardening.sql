-- =====================================================================
-- SECURITY ADVISOR HARDENING
--
-- Clears the pre-existing findings the Supabase linter reports against
-- objects created before the CRM work. Nothing here drops or alters a
-- table, a column or a function body. It changes who may execute what,
-- pins search paths, switches three reporting views to invoker rights,
-- and gives two tables the read policy they were missing.
--
-- Every EXECUTE decision below was made by tracing the actual caller in
-- the application, and the caller is named in the comment.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. REPORTING VIEWS
--
-- All three ran with the definer's rights, so anyone able to select from
-- them read straight past row level security on subscribers, campaigns
-- and campaign_logs. The tables underneath already carry policies that
-- grant the authenticated role read access, so the admin console keeps
-- working once the views defer to the caller.
-- ---------------------------------------------------------------------
ALTER VIEW public.v_subscriber_trends    SET (security_invoker = true);
ALTER VIEW public.v_campaign_performance SET (security_invoker = true);
ALTER VIEW public.v_content_performance  SET (security_invoker = true);

-- ---------------------------------------------------------------------
-- 2. SEO TABLES
--
-- Both have row level security enabled and no policy at all, which means
-- the console cannot read them even though the audit and Search Console
-- scripts keep writing to them with the service role. Reads are opened to
-- signed-in admins. Writes stay service role only, which is what the
-- scripts already use.
--
-- Both tables were created by a script running as the service role, so
-- they never picked up the table level grant that migrations applied by
-- the owner get. A policy on its own is not enough: without the GRANT the
-- read fails with a plain permission denied before row level security is
-- ever consulted.
-- ---------------------------------------------------------------------
GRANT SELECT ON public.seo_audit_runs      TO authenticated;
GRANT SELECT ON public.seo_query_snapshots TO authenticated;

DROP POLICY IF EXISTS "Admins read seo audit runs" ON public.seo_audit_runs;
CREATE POLICY "Admins read seo audit runs"
    ON public.seo_audit_runs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins read seo query snapshots" ON public.seo_query_snapshots;
CREATE POLICY "Admins read seo query snapshots"
    ON public.seo_query_snapshots FOR SELECT TO authenticated USING (true);

-- ---------------------------------------------------------------------
-- 3. SEARCH PATH PINNING
--
-- An unpinned search_path on a SECURITY DEFINER function lets a caller
-- who can create objects shadow an unqualified name and have it run with
-- the definer's privileges. These bodies already qualify their tables,
-- so pinning changes no behaviour.
--
-- notify_subscriber_sync gets the extensions schema as well because it
-- reaches pg_net. The call inside it is schema qualified, so this is
-- belt and braces rather than a requirement.
-- ---------------------------------------------------------------------
ALTER FUNCTION public.update_updated_at_column()              SET search_path = public;
ALTER FUNCTION public.update_email_templates_updated_at()     SET search_path = public;
ALTER FUNCTION public.sync_marketing_list()                   SET search_path = public;
ALTER FUNCTION public.notify_subscriber_sync()                SET search_path = public, extensions;
ALTER FUNCTION public.track_content_event(text, uuid, text, text) SET search_path = public;
ALTER FUNCTION public.track_campaign_open(uuid)               SET search_path = public;
ALTER FUNCTION public.track_campaign_click(uuid)              SET search_path = public;
ALTER FUNCTION public.unsubscribe_subscriber_by_id(uuid)      SET search_path = public;
ALTER FUNCTION public.get_dashboard_sparklines()              SET search_path = public;

-- rls_auto_enable is an event trigger already pinned to pg_catalog and is
-- left exactly as it is.

-- ---------------------------------------------------------------------
-- 4. EXECUTE GRANTS
--
-- Every SECURITY DEFINER function in the public schema is reachable at
-- /rest/v1/rpc/<name> by whoever holds the matching key, so a grant here
-- is a public API surface rather than an internal detail.
-- ---------------------------------------------------------------------

-- 4a. Stays callable without signing in.
-- track_content_event is called by src/components/TelemetryTracker.tsx,
-- a client component on public blog and release note pages using the
-- browser client. Revoking anon here would silently stop view and read
-- counts, so the grant is deliberate and stays.
GRANT EXECUTE ON FUNCTION public.track_content_event(text, uuid, text, text) TO anon, authenticated;

-- 4b. Admin analytics. Read by the signed-in console only.
-- get_dashboard_sparklines  -> src/app/admin/dashboard/page.tsx
-- get_landing_analytics     -> src/app/admin/dashboard/campaigns/page.tsx
-- get_link_hub_analytics    -> src/components/links/admin/LinkHubAnalyticsPanel.tsx
-- Anonymous execute is removed. get_dashboard_sparklines in particular
-- was returning thirty days of page views and newsletter signup counts
-- to anyone holding the publishable key.
-- PUBLIC is revoked as well as anon. A new function is created with
-- EXECUTE granted to PUBLIC, and anon inherits that, so revoking anon on
-- its own leaves the function wide open.
REVOKE EXECUTE ON FUNCTION public.get_dashboard_sparklines()             FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_landing_analytics(integer, text)   FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_link_hub_analytics(integer)        FROM anon, PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_dashboard_sparklines()             TO authenticated;
GRANT  EXECUTE ON FUNCTION public.get_landing_analytics(integer, text)   TO authenticated;
GRANT  EXECUTE ON FUNCTION public.get_link_hub_analytics(integer)        TO authenticated;

-- 4c. Nothing in the application calls these over the REST API.
-- unsubscribe_subscriber_by_id would let any holder of the publishable
-- key unsubscribe a person given their id. track_campaign_open and
-- track_campaign_click would let the same caller mark any campaign log
-- as opened or clicked, quietly corrupting open and click rates.
-- Unsubscribes arrive through the Resend webhook at
-- src/app/api/webhooks/resend/marketing/route.ts, which uses the service
-- role and is unaffected by these revokes.
REVOKE EXECUTE ON FUNCTION public.unsubscribe_subscriber_by_id(uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.track_campaign_open(uuid)          FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.track_campaign_click(uuid)         FROM anon, authenticated, PUBLIC;
GRANT  EXECUTE ON FUNCTION public.unsubscribe_subscriber_by_id(uuid) TO service_role;
GRANT  EXECUTE ON FUNCTION public.track_campaign_open(uuid)          TO service_role;
GRANT  EXECUTE ON FUNCTION public.track_campaign_click(uuid)         TO service_role;

-- 4d. Trigger and event trigger functions, which are never meant to be
-- called directly. Postgres does not check EXECUTE when a trigger fires,
-- so removing these grants leaves the triggers working.
REVOKE EXECUTE ON FUNCTION public.notify_subscriber_sync() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_marketing_list()    FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable()        FROM anon, authenticated, PUBLIC;
