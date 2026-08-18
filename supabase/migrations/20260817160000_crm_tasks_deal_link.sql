-- =====================================================================
-- CRM: A DEAL CAN CARRY A TASK, A TIMELINE AND A STAGE HISTORY OF ITS OWN
--
-- Three tables were built around a contact and only a contact:
-- `crm_tasks`, `crm_interactions` and `crm_stage_changes` all hang off
-- `contact_id NOT NULL`. That was right when the CRM was people at
-- conferences. It stopped being right the moment deals existed.
--
-- The consequence, in the console today: a follow up about a deal has to
-- be filed against whoever happens to be the primary contact, and a deal
-- with no contact on it silently drops its history. Moving a deal from
-- proposal to negotiation writes nothing anywhere. "What happened on
-- this deal" is a question the schema could not answer.
--
-- So each of the three gains a nullable `deal_id`, and the two that also
-- need to exist without a person have `contact_id` relaxed to nullable
-- under a CHECK that at least one of the two is present. A row about
-- neither a person nor a deal is not history, it is a leak, and the
-- constraint refuses it.
--
-- `crm_tasks.contact_id` deliberately stays NOT NULL. Every task in the
-- console today is about somebody, the queue groups by contact, and
-- relaxing a column is one way. If a deal-only task turns out to be
-- needed it is a two-line follow up; guessing now is not.
--
-- Every statement is guarded with `to_regclass` or `IF NOT EXISTS`, in
-- the pattern of 20260817120000, so this file is safe to run against a
-- project where the CRM tables were made by hand rather than by these
-- migrations.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. COLUMNS
-- ---------------------------------------------------------------------
DO $$
BEGIN
    IF to_regclass('public.crm_deals') IS NULL THEN
        RAISE NOTICE 'crm_deals is absent; 20260817160000 did nothing.';
        RETURN;
    END IF;

    -- Tasks. A follow up can now name the deal it is about.
    IF to_regclass('public.crm_tasks') IS NOT NULL THEN
        ALTER TABLE public.crm_tasks
            ADD COLUMN IF NOT EXISTS deal_id UUID
                REFERENCES public.crm_deals (id) ON DELETE SET NULL;
    END IF;

    -- Timeline. Both columns nullable, at least one of them present.
    IF to_regclass('public.crm_interactions') IS NOT NULL THEN
        ALTER TABLE public.crm_interactions
            ADD COLUMN IF NOT EXISTS deal_id UUID
                REFERENCES public.crm_deals (id) ON DELETE CASCADE;

        ALTER TABLE public.crm_interactions
            ALTER COLUMN contact_id DROP NOT NULL;

        ALTER TABLE public.crm_interactions
            DROP CONSTRAINT IF EXISTS crm_interactions_subject_present;
        ALTER TABLE public.crm_interactions
            ADD CONSTRAINT crm_interactions_subject_present
            CHECK (contact_id IS NOT NULL OR deal_id IS NOT NULL);
    END IF;

    -- Stage history. Deals move between stages too, and the funnel is
    -- measured off this table, so it gets the same treatment.
    IF to_regclass('public.crm_stage_changes') IS NOT NULL THEN
        ALTER TABLE public.crm_stage_changes
            ADD COLUMN IF NOT EXISTS deal_id UUID
                REFERENCES public.crm_deals (id) ON DELETE CASCADE;

        ALTER TABLE public.crm_stage_changes
            ALTER COLUMN contact_id DROP NOT NULL;

        ALTER TABLE public.crm_stage_changes
            DROP CONSTRAINT IF EXISTS crm_stage_changes_subject_present;
        ALTER TABLE public.crm_stage_changes
            ADD CONSTRAINT crm_stage_changes_subject_present
            CHECK (contact_id IS NOT NULL OR deal_id IS NOT NULL);
    END IF;
END;
$$;

-- ---------------------------------------------------------------------
-- 2. INDEXES
--
-- Each one serves the query the drawer actually runs: everything about
-- this deal, newest first.
-- ---------------------------------------------------------------------
DO $$
BEGIN
    IF to_regclass('public.crm_tasks') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_crm_tasks_deal
            ON public.crm_tasks (deal_id, due_at)
            WHERE deal_id IS NOT NULL AND status = 'open';
    END IF;

    IF to_regclass('public.crm_interactions') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_crm_interactions_deal
            ON public.crm_interactions (deal_id, occurred_at DESC)
            WHERE deal_id IS NOT NULL;
    END IF;

    IF to_regclass('public.crm_stage_changes') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_crm_stage_changes_deal
            ON public.crm_stage_changes (deal_id, changed_at DESC)
            WHERE deal_id IS NOT NULL;
    END IF;
END;
$$;

-- ---------------------------------------------------------------------
-- 3. VISIBILITY
--
-- `crm_can_see_contact(NULL)` and `crm_can_edit_contact(NULL)` are both
-- false, which is correct and also useless: with contact_id nullable,
-- the policies from 20260817120000 would hide every deal-only row from
-- everybody including the person who wrote it.
--
-- These two are the deal-shaped twins of those functions, with the same
-- rule: owner and admin see everything, a growth partner sees what their
-- stage allows plus what is theirs, and everybody else sees nothing.
-- SECURITY DEFINER because they read `crm_deals`, which is itself behind
-- RLS — without it a partner's own row would be invisible to the check
-- that decides whether they can see it.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.crm_can_see_deal(p_deal_id UUID)
RETURNS BOOLEAN AS $$
    SELECT CASE
        WHEN p_deal_id IS NULL THEN FALSE
        WHEN public.is_owner_or_admin() THEN TRUE
        WHEN NOT public.is_growth_member() THEN FALSE
        WHEN public.growth_sees_all_contacts() THEN TRUE
        ELSE EXISTS (
            SELECT 1 FROM public.crm_deals d
             WHERE d.id = p_deal_id
               AND (d.owner_user_id = auth.uid() OR d.sourced_by = auth.uid())
        )
    END;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_catalog;

CREATE OR REPLACE FUNCTION public.crm_can_edit_deal(p_deal_id UUID)
RETURNS BOOLEAN AS $$
    SELECT CASE
        WHEN p_deal_id IS NULL THEN FALSE
        WHEN public.is_owner_or_admin() THEN TRUE
        WHEN NOT public.is_growth_member() THEN FALSE
        ELSE EXISTS (
            SELECT 1 FROM public.crm_deals d
             WHERE d.id = p_deal_id
               AND (d.owner_user_id = auth.uid() OR d.sourced_by = auth.uid())
        )
    END;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_catalog;

GRANT EXECUTE ON FUNCTION public.crm_can_see_deal(UUID)  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.crm_can_edit_deal(UUID) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.crm_can_see_deal(UUID)  FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.crm_can_edit_deal(UUID) FROM anon, public;

-- ---------------------------------------------------------------------
-- 4. POLICIES
--
-- Rewritten, not added to: a second permissive policy on the same
-- command is an OR, so leaving the contact-only versions in place next
-- to these would be the same thing. `__apply_policy` from 20260817120000
-- drops by name before it creates, and skips absent tables.
--
-- The rule is "either subject lets you in", which is what a row about
-- both a person and a deal means. Nothing here is ever `USING (true)`:
-- a row with no subject cannot exist, and a row with one is reachable
-- only through that subject.
-- ---------------------------------------------------------------------
DO $$
BEGIN
    IF to_regproc('public.__apply_policy(text,text,text,text,text)') IS NULL THEN
        RAISE EXCEPTION
            '__apply_policy is missing. Apply 20260817120000_role_aware_rls.sql first.';
    END IF;
END;
$$;

-- Timeline
SELECT public.__apply_policy('crm_interactions', 'Timeline follows the contact', 'SELECT',
    'public.crm_can_see_contact(contact_id) OR public.crm_can_see_deal(deal_id)');
SELECT public.__apply_policy('crm_interactions', 'Timeline written by the owner', 'INSERT',
    NULL, 'public.crm_can_edit_contact(contact_id) OR public.crm_can_edit_deal(deal_id)');
SELECT public.__apply_policy('crm_interactions', 'Timeline edited by the owner', 'UPDATE',
    'public.crm_can_edit_contact(contact_id) OR public.crm_can_edit_deal(deal_id)',
    'public.crm_can_edit_contact(contact_id) OR public.crm_can_edit_deal(deal_id)');
-- DELETE is unchanged and stays with owner and admin.

-- Tasks. `contact_id` is still NOT NULL here, so the contact rule alone
-- would work; the deal clause is what lets a partner who owns the deal
-- but not the contact see the follow up they filed on it.
SELECT public.__apply_policy('crm_tasks', 'Tasks follow the contact', 'SELECT',
    'public.crm_can_see_contact(contact_id) OR public.crm_can_see_deal(deal_id)');
SELECT public.__apply_policy('crm_tasks', 'Tasks written by the owner', 'INSERT',
    NULL, 'public.crm_can_edit_contact(contact_id) OR public.crm_can_edit_deal(deal_id)');
SELECT public.__apply_policy('crm_tasks', 'Tasks edited by the owner', 'UPDATE',
    'public.crm_can_edit_contact(contact_id) OR public.crm_can_edit_deal(deal_id)',
    'public.crm_can_edit_contact(contact_id) OR public.crm_can_edit_deal(deal_id)');

-- Stage history. Still never updated by anybody, still deleted only by
-- an owner: it is the audit trail the funnel is measured from.
SELECT public.__apply_policy('crm_stage_changes', 'Stage history follows the contact', 'SELECT',
    'public.crm_can_see_contact(contact_id) OR public.crm_can_see_deal(deal_id)');
SELECT public.__apply_policy('crm_stage_changes', 'Stage history written by the owner', 'INSERT',
    NULL, 'public.crm_can_edit_contact(contact_id) OR public.crm_can_edit_deal(deal_id)');

DO $$
BEGIN
    IF to_regclass('public.crm_tasks') IS NOT NULL THEN
        COMMENT ON COLUMN public.crm_tasks.deal_id IS
            'The deal this follow up is about. Null for a task about a person only.';
    END IF;
    IF to_regclass('public.crm_interactions') IS NOT NULL THEN
        COMMENT ON COLUMN public.crm_interactions.deal_id IS
            'The deal this line is about. Either this or contact_id must be present.';
    END IF;
    IF to_regclass('public.crm_stage_changes') IS NOT NULL THEN
        COMMENT ON COLUMN public.crm_stage_changes.deal_id IS
            'The deal that moved. Either this or contact_id must be present.';
    END IF;
END;
$$;
