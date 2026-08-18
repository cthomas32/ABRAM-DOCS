-- =====================================================================
-- ROLE AWARE ROW LEVEL SECURITY
--
-- The migration that actually closes the door. 20260817090000 created the
-- roles; this one makes the database care about them.
--
-- HOW THE OLD POLICIES ARE REMOVED, AND WHY IT IS DONE THIS WAY
--
-- Policies are OR'd together. Leaving one `FOR ALL TO authenticated
-- USING (true)` in place anywhere would make every careful policy below
-- decorative, so the old ones have to go. But "drop every policy on the
-- table" would also take out the ones serving the public website —
-- published blog posts, active contact cards, the link hub, the
-- newsletter signup insert — and the failure mode there is a marketing
-- site that 404s its own content.
--
-- The two are distinguishable. Admin policies were written `TO
-- authenticated`; public ones were written `TO public` or with no TO
-- clause at all. So the sweep below drops only policies whose role list
-- is exactly {authenticated}, and every anonymous path survives untouched.
--
-- If you add a table, add it to the right group here. A table with RLS on
-- and no policy is unreadable by the console, which is a loud failure and
-- the correct direction to fail in.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. CAN THIS PERSON SEE / TOUCH THIS CONTACT
--
-- The Advisor stage is contractually "her accounts only, read and write".
-- Head of Growth is "full pipeline", and the choice made alongside it is
-- that a full-pipeline partner still edits only what is theirs — seeing
-- the board is context, moving somebody else's record is not.
--
-- Ownership means either column: the person working it, or the person who
-- found it. A partner who sourced a lead and handed it over keeps read
-- access to the thing their commission depends on, which is the whole
-- point of sourced_by being permanent.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.crm_can_see_contact(p_contact_id UUID)
RETURNS BOOLEAN AS $$
    SELECT CASE
        WHEN public.is_owner_or_admin() THEN TRUE
        WHEN NOT public.is_growth_member() THEN FALSE
        WHEN public.growth_sees_all_contacts() THEN TRUE
        ELSE EXISTS (
            SELECT 1 FROM public.crm_contacts c
             WHERE c.id = p_contact_id
               AND (c.owner_user_id = auth.uid() OR c.sourced_by = auth.uid())
        )
    END;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.crm_can_edit_contact(p_contact_id UUID)
RETURNS BOOLEAN AS $$
    SELECT CASE
        WHEN public.is_owner_or_admin() THEN TRUE
        WHEN NOT public.is_growth_member() THEN FALSE
        ELSE EXISTS (
            SELECT 1 FROM public.crm_contacts c
             WHERE c.id = p_contact_id
               AND (c.owner_user_id = auth.uid() OR c.sourced_by = auth.uid())
        )
    END;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.crm_can_see_contact(UUID)  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.crm_can_edit_contact(UUID) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.crm_can_see_contact(UUID)  FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.crm_can_edit_contact(UUID) FROM anon, public;

-- ---------------------------------------------------------------------
-- 2. THE SWEEP
--
-- Drops every policy addressed exactly to `authenticated` on the tables
-- named below, leaving public and anon policies in place. Skips tables
-- that do not exist, because several of these were created by hand in the
-- Supabase dashboard rather than by a migration in this folder and are
-- not guaranteed to be present in a fresh environment.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.__drop_authenticated_policies(p_tables TEXT[])
RETURNS VOID AS $$
DECLARE
    t   TEXT;
    pol RECORD;
BEGIN
    FOREACH t IN ARRAY p_tables LOOP
        IF to_regclass('public.' || quote_ident(t)) IS NULL THEN
            CONTINUE;
        END IF;

        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

        FOR pol IN
            SELECT policyname
              FROM pg_policies
             WHERE schemaname = 'public'
               AND tablename  = t
               AND roles      = ARRAY['authenticated']::name[]
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql VOLATILE SET search_path = public, pg_catalog;

/**
 * Applies one policy, skipping tables that are not present.
 * p_check of NULL means no WITH CHECK clause.
 */
CREATE OR REPLACE FUNCTION public.__apply_policy(
    p_table TEXT, p_name TEXT, p_cmd TEXT, p_using TEXT, p_check TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    sql TEXT;
BEGIN
    IF to_regclass('public.' || quote_ident(p_table)) IS NULL THEN
        RETURN;
    END IF;

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p_name, p_table);

    sql := format('CREATE POLICY %I ON public.%I FOR %s TO authenticated',
                  p_name, p_table, p_cmd);

    IF p_using IS NOT NULL THEN
        sql := sql || format(' USING (%s)', p_using);
    END IF;
    IF p_check IS NOT NULL THEN
        sql := sql || format(' WITH CHECK (%s)', p_check);
    END IF;

    EXECUTE sql;
END;
$$ LANGUAGE plpgsql VOLATILE SET search_path = public, pg_catalog;

-- ---------------------------------------------------------------------
-- 3. GROUP A — CONTACT DATA
--
-- The pipeline itself. Owner and admin see everything. A growth partner
-- sees according to their stage and writes only what is theirs.
-- ---------------------------------------------------------------------
SELECT public.__drop_authenticated_policies(ARRAY[
    'crm_contacts', 'crm_interactions', 'crm_tasks', 'crm_stage_changes',
    'crm_accounts', 'crm_deals', 'crm_deal_registrations'
]);

-- Contacts
SELECT public.__apply_policy('crm_contacts', 'Console reads contacts in scope', 'SELECT',
    'public.is_owner_or_admin()
     OR (public.is_growth_member() AND (
            public.growth_sees_all_contacts()
            OR owner_user_id = auth.uid()
            OR sourced_by = auth.uid()))');

SELECT public.__apply_policy('crm_contacts', 'Console creates contacts', 'INSERT',
    NULL,
    'public.is_owner_or_admin() OR public.is_growth_member()');

SELECT public.__apply_policy('crm_contacts', 'Console edits its own contacts', 'UPDATE',
    'public.is_owner_or_admin()
     OR (public.is_growth_member() AND (owner_user_id = auth.uid() OR sourced_by = auth.uid()))',
    'public.is_owner_or_admin()
     OR (public.is_growth_member() AND (owner_user_id = auth.uid() OR sourced_by = auth.uid()))');

-- Deletion stays with owner and admin. A partner archives; the archive
-- flag is reversible and a DELETE is not, and the record of who was met
-- at which conference is company property under the agreement.
SELECT public.__apply_policy('crm_contacts', 'Owners delete contacts', 'DELETE',
    'public.is_owner_or_admin()');

-- Timeline, tasks and stage history follow their contact exactly.
SELECT public.__apply_policy('crm_interactions', 'Timeline follows the contact', 'SELECT',
    'public.crm_can_see_contact(contact_id)');
SELECT public.__apply_policy('crm_interactions', 'Timeline written by the owner', 'INSERT',
    NULL, 'public.crm_can_edit_contact(contact_id)');
SELECT public.__apply_policy('crm_interactions', 'Timeline edited by the owner', 'UPDATE',
    'public.crm_can_edit_contact(contact_id)', 'public.crm_can_edit_contact(contact_id)');
SELECT public.__apply_policy('crm_interactions', 'Owners delete timeline rows', 'DELETE',
    'public.is_owner_or_admin()');

SELECT public.__apply_policy('crm_tasks', 'Tasks follow the contact', 'SELECT',
    'public.crm_can_see_contact(contact_id)');
SELECT public.__apply_policy('crm_tasks', 'Tasks written by the owner', 'INSERT',
    NULL, 'public.crm_can_edit_contact(contact_id)');
SELECT public.__apply_policy('crm_tasks', 'Tasks edited by the owner', 'UPDATE',
    'public.crm_can_edit_contact(contact_id)', 'public.crm_can_edit_contact(contact_id)');
SELECT public.__apply_policy('crm_tasks', 'Owners delete tasks', 'DELETE',
    'public.is_owner_or_admin()');

SELECT public.__apply_policy('crm_stage_changes', 'Stage history follows the contact', 'SELECT',
    'public.crm_can_see_contact(contact_id)');
SELECT public.__apply_policy('crm_stage_changes', 'Stage history written by the owner', 'INSERT',
    NULL, 'public.crm_can_edit_contact(contact_id)');
-- Never updated, never deleted by anybody but an owner. It is the audit
-- trail the funnel is measured from.
SELECT public.__apply_policy('crm_stage_changes', 'Owners delete stage history', 'DELETE',
    'public.is_owner_or_admin()');

-- Accounts. Read is open to every partner regardless of stage: an account
-- list is how you find out somebody is already talking to a company
-- before you file a registration on it.
SELECT public.__apply_policy('crm_accounts', 'Console reads accounts', 'SELECT',
    'public.is_owner_or_admin() OR public.is_growth_member()');
SELECT public.__apply_policy('crm_accounts', 'Console creates accounts', 'INSERT',
    NULL, 'public.is_owner_or_admin() OR public.is_growth_member()');
SELECT public.__apply_policy('crm_accounts', 'Console edits its own accounts', 'UPDATE',
    'public.is_owner_or_admin()
     OR (public.is_growth_member() AND (owner_user_id = auth.uid() OR sourced_by = auth.uid()))',
    'public.is_owner_or_admin()
     OR (public.is_growth_member() AND (owner_user_id = auth.uid() OR sourced_by = auth.uid()))');
SELECT public.__apply_policy('crm_accounts', 'Owners delete accounts', 'DELETE',
    'public.is_owner_or_admin()');

-- Deals. A partner reads deals on accounts they can see and edits their
-- own. The columns that decide money — attribution_rule, closed_by — are
-- writable by them, which is deliberate: the alternative is the founder
-- transcribing every close by hand. What protects it is that sourced_by
-- is immutable, stage changes are logged, and the ledger runs off
-- collected cash that only ever arrives from the payment processor.
SELECT public.__apply_policy('crm_deals', 'Console reads deals', 'SELECT',
    'public.is_owner_or_admin()
     OR (public.is_growth_member() AND (
            public.growth_sees_all_contacts()
            OR owner_user_id = auth.uid()
            OR sourced_by = auth.uid()))');
SELECT public.__apply_policy('crm_deals', 'Console creates deals', 'INSERT',
    NULL, 'public.is_owner_or_admin() OR public.is_growth_member()');
SELECT public.__apply_policy('crm_deals', 'Console edits its own deals', 'UPDATE',
    'public.is_owner_or_admin()
     OR (public.is_growth_member() AND (owner_user_id = auth.uid() OR sourced_by = auth.uid()))',
    'public.is_owner_or_admin()
     OR (public.is_growth_member() AND (owner_user_id = auth.uid() OR sourced_by = auth.uid()))');
SELECT public.__apply_policy('crm_deals', 'Owners delete deals', 'DELETE',
    'public.is_owner_or_admin()');

-- Registrations. A partner files one and reads their own; only an owner
-- decides one. That asymmetry is the entire mechanism — a claim you can
-- approve yourself is not a claim.
SELECT public.__apply_policy('crm_deal_registrations', 'Partners read their own registrations', 'SELECT',
    'public.is_owner_or_admin() OR requested_by = auth.uid()');
SELECT public.__apply_policy('crm_deal_registrations', 'Partners file registrations', 'INSERT',
    NULL,
    'public.is_owner_or_admin() OR (public.is_growth_member() AND requested_by = auth.uid())');
SELECT public.__apply_policy('crm_deal_registrations', 'Owners decide registrations', 'UPDATE',
    'public.is_owner_or_admin()', 'public.is_owner_or_admin()');
SELECT public.__apply_policy('crm_deal_registrations', 'Owners delete registrations', 'DELETE',
    'public.is_owner_or_admin()');

-- ---------------------------------------------------------------------
-- 4. GROUP B — CRM OPERATIONS
--
-- Events, printed codes, scans and cards. A partner running a conference
-- needs all of it; the one thing they do not get is somebody else's card,
-- because a card is an identity.
-- ---------------------------------------------------------------------
SELECT public.__drop_authenticated_policies(ARRAY[
    'crm_profiles', 'crm_events', 'crm_capture_codes', 'crm_scans', 'crm_email_templates'
]);

SELECT public.__apply_policy('crm_profiles', 'Console reads cards', 'SELECT',
    'public.has_console_access()');
SELECT public.__apply_policy('crm_profiles', 'Owners manage cards', 'ALL',
    'public.is_owner_or_admin()', 'public.is_owner_or_admin()');
SELECT public.__apply_policy('crm_profiles', 'Partners edit their own card', 'UPDATE',
    'public.is_growth_member() AND owner_user_id = auth.uid()',
    'public.is_growth_member() AND owner_user_id = auth.uid()');

SELECT public.__apply_policy('crm_events', 'Console manages events', 'ALL',
    'public.is_owner_or_admin() OR public.is_growth_member()',
    'public.is_owner_or_admin() OR public.is_growth_member()');

SELECT public.__apply_policy('crm_capture_codes', 'Console manages codes', 'ALL',
    'public.is_owner_or_admin() OR public.is_growth_member()',
    'public.is_owner_or_admin() OR public.is_growth_member()');

SELECT public.__apply_policy('crm_scans', 'Console reads scans', 'SELECT',
    'public.is_owner_or_admin() OR public.is_growth_member()');

-- Email copy is read by a partner and written by an owner. Editing the
-- words that go out under the company's sending domain is a different
-- decision from sending one, and the agreement grants "send only".
SELECT public.__apply_policy('crm_email_templates', 'Console reads email copy', 'SELECT',
    'public.has_console_access()');
SELECT public.__apply_policy('crm_email_templates', 'Owners manage email copy', 'ALL',
    'public.is_owner_or_admin()', 'public.is_owner_or_admin()');

-- ---------------------------------------------------------------------
-- 5. GROUP C — CONTENT
--
-- Docs, blog, release notes, the team record. The admin console proper.
-- A growth partner has no policy here at all, which is the table-level
-- expression of "Admin console — Never".
-- ---------------------------------------------------------------------
SELECT public.__drop_authenticated_policies(ARRAY[
    'blog_posts', 'help_docs', 'release_notes', 'team_members'
]);

DO $$
DECLARE t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['blog_posts', 'help_docs', 'release_notes', 'team_members'] LOOP
        PERFORM public.__apply_policy(
            t, 'Editors manage content', 'ALL',
            'public.current_admin_role() IN (''owner'', ''admin'', ''contributor'')',
            'public.current_admin_role() IN (''owner'', ''admin'', ''contributor'')'
        );
    END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 6. GROUP D — THE MAILING LIST
--
-- Owner and admin only, at the table. "Resend — send only" for a Head of
-- Growth is a capability granted through a server action that sends on
-- their behalf and logs it, not a grant of read/write over the subscriber
-- table. The distinction matters: a table grant lets somebody export the
-- list, and an export is not a send.
-- ---------------------------------------------------------------------
SELECT public.__drop_authenticated_policies(ARRAY[
    'subscribers', 'campaigns', 'campaign_logs', 'email_templates'
]);

DO $$
DECLARE t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['subscribers', 'campaigns', 'campaign_logs', 'email_templates'] LOOP
        PERFORM public.__apply_policy(
            t, 'Owners manage the list', 'ALL',
            'public.is_owner_or_admin()', 'public.is_owner_or_admin()'
        );
    END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 7. GROUP E — THE GROWTH SURFACES
--
-- Social Studio, tracked links, the link hub, campaign landing pages.
-- Granted to a growth partner in full: these are the acquisition tools
-- and withholding them would leave somebody accountable for a number they
-- have no instrument to move.
-- ---------------------------------------------------------------------
SELECT public.__drop_authenticated_policies(ARRAY[
    'social_posts', 'social_campaigns', 'social_image_assets', 'social_backdrop_images',
    'link_hub_links', 'link_hub_settings', 'link_hub_visits', 'link_hub_events',
    'campaign_link_pages', 'campaign_link_channels'
]);

DO $$
DECLARE t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'social_posts', 'social_campaigns', 'social_image_assets', 'social_backdrop_images',
        'link_hub_links', 'link_hub_settings',
        'campaign_link_pages', 'campaign_link_channels'
    ] LOOP
        PERFORM public.__apply_policy(
            t, 'Growth surfaces', 'ALL',
            'public.is_owner_or_admin() OR public.is_growth_member()',
            'public.is_owner_or_admin() OR public.is_growth_member()'
        );
    END LOOP;

    -- Visit and click logs are read-only to everybody: they are written by
    -- ingest routes running as the service role.
    FOREACH t IN ARRAY ARRAY['link_hub_visits', 'link_hub_events'] LOOP
        PERFORM public.__apply_policy(
            t, 'Console reads link telemetry', 'SELECT',
            'public.is_owner_or_admin() OR public.is_growth_member()'
        );
    END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 8. GROUP F — ANALYTICS
--
-- "Website analytics — read-only" at the Advisor stage, and these tables
-- are append-only telemetry written by ingest routes anyway, so read is
-- the only grant that means anything.
-- ---------------------------------------------------------------------
-- seo_audit_runs and seo_query_snapshots are written by a scheduled agent
-- with the service role and read by the console. They arrived with a
-- `USING (true)` read policy of their own, which is the same hole this
-- migration exists to close, so they belong in this group rather than
-- being left alone because they are only telemetry.
SELECT public.__drop_authenticated_policies(ARRAY[
    'landing_visits', 'landing_events', 'analytics_events', 'content_analytics',
    'seo_audit_runs', 'seo_query_snapshots'
]);

DO $$
DECLARE t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'landing_visits', 'landing_events', 'analytics_events', 'content_analytics',
        'seo_audit_runs', 'seo_query_snapshots'
    ] LOOP
        PERFORM public.__apply_policy(
            t, 'Console reads analytics', 'SELECT',
            'public.is_owner_or_admin() OR public.is_growth_member()'
        );
        PERFORM public.__apply_policy(
            t, 'Owners manage analytics', 'ALL',
            'public.is_owner_or_admin()', 'public.is_owner_or_admin()'
        );
    END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 9. PUT BACK WHAT THE PUBLIC SITE NEEDS
--
-- The sweep only removed `{authenticated}` policies, so the public ones
-- are still there. This is belt and braces on the one that would be
-- noticed last and hurt most: a contact card that stops rendering breaks
-- a printed QR code somebody is holding at a conference, and there is no
-- way to reprint it.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read of active cards" ON public.crm_profiles;
CREATE POLICY "Public read of active cards"
    ON public.crm_profiles FOR SELECT USING (is_active);

-- ---------------------------------------------------------------------
-- 10. TIDY UP
--
-- The two helpers were scaffolding for this migration and nothing should
-- call them at runtime — they build and execute DDL from strings, which
-- is not something to leave reachable.
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.__apply_policy(TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.__drop_authenticated_policies(TEXT[]);
