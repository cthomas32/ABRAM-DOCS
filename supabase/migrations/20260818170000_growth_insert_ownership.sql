-- =====================================================================
-- WHAT A PARTNER MAY CREATE, AND NOT ONLY WHAT THEY MAY EDIT
--
-- 20260817120000 gave crm_contacts, crm_accounts and crm_deals careful
-- UPDATE policies keyed on ownership, and then let INSERT through on
-- nothing but "is this person in growth at all":
--
--     __apply_policy('crm_contacts', 'Console creates contacts', 'INSERT',
--         NULL, 'public.is_owner_or_admin() OR public.is_growth_member()')
--
-- A WITH CHECK that never looks at the row is the same as no check. What
-- this cost was never somebody else's data. It was that a partner could
-- write a row belonging to nobody they are:
--
--   * crm_contacts. SELECT is keyed on ownership, so an Advisor who
--     creates a contact without stamping either column cannot read it
--     back. The record exists, the list is empty, and the next thing
--     that happens is they type it in again.
--   * crm_accounts. SELECT is open to every partner by design, so the
--     row is visible, but UPDATE is keyed on ownership. They create a
--     company and cannot correct its name.
--   * crm_deals. As contacts. Invisible on creation.
--
-- The rule this migration installs is one sentence: A GROWTH MEMBER MAY
-- ONLY CREATE A ROW THEY COULD SUBSEQUENTLY EDIT. Every WITH CHECK below
-- is therefore a copy of the UPDATE policy already on the same table,
-- which is the point. Two clauses that are supposed to agree should be
-- the same text, so a future change to one is visibly a change to both.
--
-- growth_sees_all_contacts() is deliberately NOT in these clauses, for
-- the reason 20260817120000 gives for leaving it out of UPDATE: seeing
-- the whole board is context, and creating a record assigned to another
-- partner is a write. A Head of Growth creating work for somebody else
-- still does it as themselves and hands it over, which leaves a trail.
--
-- SAFE TO APPLY: every insert that runs under a caller's own session
-- already stamps ownership from that session, so nothing legitimate
-- starts failing.
--
--   src/app/admin/dashboard/deals/actions.ts     createDeal
--        owner_user_id, sourced_by, created_by = session user
--   src/app/admin/dashboard/companies/actions.ts createAccount
--        owner_user_id, sourced_by = session user
--   src/lib/crm/contactSync.ts                   syncFeedPerson
--        owner_user_id = ownerUserId, passed by both console feeds
--        (people/importActions.ts, people/subscriberActions.ts)
--
-- The three paths that pass no owner all hold the service role and are
-- not subject to these policies at all: /api/crm/capture,
-- /api/newsletter/subscribe, and lib/growth/collectionsSyncService.ts.
-- The newsletter route passes no owner on purpose, because nobody chose.
-- =====================================================================

-- `__apply_policy` is scaffolding, created and dropped inside each
-- migration that needs it (20260817120000 section 10 explains why it is
-- not left reachable). Same body as 20260817160000 carries.
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

-- The policy names match 20260817120000 exactly, so these replace rather
-- than sit beside. A second permissive policy on the same command is an
-- OR, and an OR with the old clause would undo the whole migration.

SELECT public.__apply_policy('crm_contacts', 'Console creates contacts', 'INSERT',
    NULL,
    'public.is_owner_or_admin()
     OR (public.is_growth_member() AND (owner_user_id = auth.uid() OR sourced_by = auth.uid()))');

SELECT public.__apply_policy('crm_accounts', 'Console creates accounts', 'INSERT',
    NULL,
    'public.is_owner_or_admin()
     OR (public.is_growth_member() AND (owner_user_id = auth.uid() OR sourced_by = auth.uid()))');

SELECT public.__apply_policy('crm_deals', 'Console creates deals', 'INSERT',
    NULL,
    'public.is_owner_or_admin()
     OR (public.is_growth_member() AND (owner_user_id = auth.uid() OR sourced_by = auth.uid()))');

DROP FUNCTION IF EXISTS public.__apply_policy(TEXT, TEXT, TEXT, TEXT, TEXT);
