-- =====================================================================
-- WIDENING THE GROWTH ROLE TO THE REST OF THE CONSOLE
--
-- 20260817120000 built the growth role on the reading that the
-- partnership terms' "Admin console — Never" meant this console. It does
-- not. It means the platform super-admin in `abram-network` — other
-- people's organisations, plan tiers, entitlements — which is a separate
-- system this repository holds no credentials for and cannot reach.
--
-- So a growth partner works inside the one console, with a role. This
-- migration grants the surfaces that decision opens up, and no more:
--
--   subscribers     read only. Seeing the list, never exporting or editing it.
--   campaigns       drafting only. Sending stays an owner's click.
--   campaign_logs   read, so a draft can be judged against what went before.
--   email_templates read, so a draft can use one.
--   blog_posts      full. Content is an acquisition channel.
--   help_docs       full, same reasoning.
--
-- Deliberately still withheld: release_notes (a changelog is a product
-- claim), team_members (an identity record), and anything under
-- commission management or roles.
--
-- THE ONE THAT NEEDED THOUGHT
--
-- "Draft only" is not a permission, it is a state machine, and RLS is the
-- only place it can be enforced honestly. A partner may create and edit a
-- campaign **while it is a draft**, and the WITH CHECK refuses to let
-- them move it out of that state. So they can write the words, and the
-- transition to `scheduled` or `sending` — the irreversible part — is
-- refused by the database rather than merely hidden by the interface.
--
-- The matching guard in the send action is a courtesy that produces a
-- sentence instead of a policy violation. It is not what stops the send.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. WHY EVERY POLICY BELOW IS WRAPPED
--
-- subscribers, campaigns, campaign_logs and email_templates were created
-- in the Supabase dashboard, not by any migration in this repository. A
-- bare CREATE POLICY on them is fine on production, where they exist,
-- and hard-fails the whole file on `supabase db reset` or a fresh branch
-- database, where they do not. Section 3 already used to_regclass. These
-- did not, and that was an oversight rather than a decision.
--
-- The guard skips the table when it is absent. It does not create it: a
-- policy migration inventing an empty subscribers table would be worse
-- than the error it replaced.
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- 1. THE MAILING LIST — READ ONLY
--
-- Read without write is the whole point. It is enough to size a segment
-- and see who is on it, and not enough to change anybody's consent state,
-- which is the one thing on this table that must never move by accident.
-- ---------------------------------------------------------------------
DO $$
DECLARE
    spec RECORD;
BEGIN
    FOR spec IN
        SELECT * FROM (VALUES
            ('subscribers',     'Growth reads subscribers'),
            ('campaign_logs',   'Growth reads campaign logs'),
            ('email_templates', 'Growth reads email templates')
        ) AS v(table_name, policy_name)
    LOOP
        IF to_regclass('public.' || quote_ident(spec.table_name)) IS NULL THEN CONTINUE; END IF;

        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', spec.policy_name, spec.table_name);
        EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_growth_member())',
            spec.policy_name, spec.table_name
        );
    END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 2. BROADCASTS — DRAFTING ONLY
--
-- Three policies rather than one FOR ALL, because the three verbs need
-- genuinely different conditions.
--
-- A new campaign must start as a draft. Nothing stops somebody writing
-- one; what is refused is conjuring one that is already sending.
--
-- On the UPDATE policy, USING says which rows may be edited: drafts
-- only, so a sent campaign becomes read-only history the moment it
-- leaves. WITH CHECK says what they may become: still a draft. Both
-- halves are needed. USING alone would let a draft be updated straight
-- to 'sending'.
-- ---------------------------------------------------------------------
DO $$
BEGIN
    IF to_regclass('public.campaigns') IS NULL THEN
        RAISE NOTICE 'public.campaigns is absent, skipping the growth campaign policies.';
        RETURN;
    END IF;

    DROP POLICY IF EXISTS "Growth reads campaigns" ON public.campaigns;
    CREATE POLICY "Growth reads campaigns"
        ON public.campaigns FOR SELECT TO authenticated
        USING (public.is_growth_member());

    DROP POLICY IF EXISTS "Growth drafts campaigns" ON public.campaigns;
    CREATE POLICY "Growth drafts campaigns"
        ON public.campaigns FOR INSERT TO authenticated
        WITH CHECK (public.is_growth_member() AND status = 'draft');

    DROP POLICY IF EXISTS "Growth edits its own drafts" ON public.campaigns;
    CREATE POLICY "Growth edits its own drafts"
        ON public.campaigns FOR UPDATE TO authenticated
        USING (public.is_growth_member() AND status = 'draft')
        WITH CHECK (public.is_growth_member() AND status = 'draft');
END $$;

-- ---------------------------------------------------------------------
-- 3. CONTENT
--
-- blog_posts and help_docs gain the growth role. release_notes and
-- team_members deliberately do not: a changelog entry is a product claim
-- and a team record is somebody's identity, and neither is an acquisition
-- surface.
-- ---------------------------------------------------------------------
DO $$
DECLARE t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['blog_posts', 'help_docs'] LOOP
        IF to_regclass('public.' || quote_ident(t)) IS NULL THEN CONTINUE; END IF;

        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Editors manage content', t);
        EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (%s) WITH CHECK (%s)',
            'Editors manage content', t,
            'public.current_admin_role() IN (''owner'', ''admin'', ''contributor'', ''growth'')',
            'public.current_admin_role() IN (''owner'', ''admin'', ''contributor'', ''growth'')'
        );
    END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 4. NOTE FOR THE NEXT READER
-- ---------------------------------------------------------------------
DO $$
BEGIN
    IF to_regclass('public.campaigns') IS NULL THEN RETURN; END IF;

    COMMENT ON TABLE public.campaigns IS
        'Email broadcasts. A growth partner may create and edit a campaign only while status = ''draft''; the transition out of draft is refused by RLS, not merely hidden. Sending remains an owner action.';
END $$;
