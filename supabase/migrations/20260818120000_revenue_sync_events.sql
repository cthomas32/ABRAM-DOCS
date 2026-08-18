-- =====================================================================
-- THE FAR SIDE OF THE COLLECTIONS PIPE
--
-- `revenue_collections` has had no producer since it was written. The
-- whole commission chain existed — terms, entries, payouts, statements,
-- the recompute, the equity tranches — and every figure it produced was
-- structurally correct and permanently zero, because checkout happens in
-- the product's Supabase project and nothing carried a payment across.
--
-- abram-network now queues every cash event and posts it here signed.
-- This migration is what receives it:
--
--   revenue_sync_events   one row per event we were told about, ever.
--                         `event_id` is UNIQUE and that is the whole
--                         idempotency story: a redelivered, retried or
--                         replayed event finds its own row and stops.
--                         The payload is kept so a mapping bug can be
--                         fixed and the same event replayed against the
--                         corrected code, which is the only way to
--                         recover a month of miscredited collections
--                         without asking Stripe for the history again.
--
--   crm_accounts.needs_review, crm_deals.needs_review
--                         The sync will meet payments from customers this
--                         CRM has never heard of. It records them anyway
--                         — a collection nobody can find is worse than an
--                         ugly one — against a placeholder that says out
--                         loud that a person has to look at it. Silently
--                         dropping the payment would make the ledger
--                         quietly short.
--
--   crm_deals.origin      'sync' for a deal this pipe invented. It is
--                         won, because money arrived, and it pays nobody
--                         until somebody sets `sourced_by` — which is the
--                         correct default: an unattributed deal pays
--                         nothing, by the ledger's own rule.
--
-- WHAT THIS DOES NOT CHANGE
--
-- Nothing here is authoritative about money. abram-network is. A row that
-- disagrees with Stripe is wrong by definition, and the event log exists
-- so that disagreement can be traced to the message that caused it.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. LOCAL COPIES OF THE POLICY HELPERS
--
-- `__apply_policy` and `__drop_authenticated_policies` are defined in
-- 20260817120000. Redefined here rather than depended on, deliberately:
-- a migration that assumes a helper from another file is a migration that
-- fails on a fresh database if the order ever changes, and the failure
-- lands halfway through, which is the state that is genuinely hard to
-- recover. CREATE OR REPLACE with an identical body is a no-op against an
-- environment that already has them.
-- ---------------------------------------------------------------------
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
-- 1. THE EVENT LOG
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.revenue_sync_events (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The Stripe event id, carried across unchanged. UNIQUE: the same
    -- payment cannot be applied twice however many times it arrives.
    event_id      TEXT NOT NULL UNIQUE,

    event_type    TEXT NOT NULL,
    sync_type     TEXT NOT NULL,

    -- Exactly what was posted, after signature verification. This is what
    -- a replay re-applies.
    payload       JSONB NOT NULL DEFAULT '{}'::jsonb,

    status        TEXT NOT NULL DEFAULT 'applied',

    -- A sentence for a person, not a stack trace. Why an account was
    -- invented, why a deal was, why nothing happened.
    note          TEXT,

    collection_id UUID REFERENCES public.revenue_collections (id) ON DELETE SET NULL,
    deal_id       UUID REFERENCES public.crm_deals (id) ON DELETE SET NULL,
    account_id    UUID REFERENCES public.crm_accounts (id) ON DELETE SET NULL,

    entries_written INTEGER NOT NULL DEFAULT 0,

    received_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    applied_at    TIMESTAMP WITH TIME ZONE,
    replayed_at   TIMESTAMP WITH TIME ZONE,
    replay_count  INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT revenue_sync_events_status_check
        CHECK (status IN ('applied', 'needs_review', 'ignored', 'failed')),
    CONSTRAINT revenue_sync_events_sync_type_check
        CHECK (sync_type IN ('collected', 'refunded', 'disputed'))
);

COMMENT ON TABLE public.revenue_sync_events IS
    'Every cash event abram-network told us about. event_id is UNIQUE, which is the entire idempotency story; the payload is kept so a mapping bug can be fixed and the event replayed.';
COMMENT ON COLUMN public.revenue_sync_events.status IS
    'applied — a collection was written or updated. needs_review — it was, against an invented account or deal. ignored — nothing to do. failed — the mapping refused it, and it can be replayed.';
COMMENT ON COLUMN public.revenue_sync_events.payload IS
    'The verified body, kept verbatim. A replay re-applies this rather than asking Stripe again, so a month of miscredited collections is recoverable in one pass.';

CREATE INDEX IF NOT EXISTS idx_revenue_sync_events_received
    ON public.revenue_sync_events (received_at DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_sync_events_attention
    ON public.revenue_sync_events (received_at DESC)
    WHERE status IN ('needs_review', 'failed');

-- ---------------------------------------------------------------------
-- 2. WHAT A SYNCED ROW LOOKS LIKE ON THE CRM
-- ---------------------------------------------------------------------
ALTER TABLE public.crm_accounts
    -- The customer over in the product database. `crm_deals` has had this
    -- since the start; the account needs it too, because the sync meets
    -- the customer before it knows which deal — and often before there is
    -- one at all.
    ADD COLUMN IF NOT EXISTS external_customer_ref TEXT,
    ADD COLUMN IF NOT EXISTS needs_review          BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.crm_accounts.external_customer_ref IS
    'The organization or Stripe customer this account is, over in the product database. How a payment finds its account without a name match.';
COMMENT ON COLUMN public.crm_accounts.needs_review IS
    'Invented by the collections sync because a payment arrived from a customer this CRM had never heard of. Recording it and flagging it beats dropping it.';

CREATE INDEX IF NOT EXISTS idx_crm_accounts_external_ref
    ON public.crm_accounts (external_customer_ref)
    WHERE external_customer_ref IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_accounts_needs_review
    ON public.crm_accounts (created_at DESC) WHERE needs_review;

ALTER TABLE public.crm_deals
    ADD COLUMN IF NOT EXISTS origin       TEXT NOT NULL DEFAULT 'manual',
    ADD COLUMN IF NOT EXISTS needs_review BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.crm_deals DROP CONSTRAINT IF EXISTS crm_deals_origin_check;
ALTER TABLE public.crm_deals
    ADD CONSTRAINT crm_deals_origin_check CHECK (origin IN ('manual', 'sync'));

COMMENT ON COLUMN public.crm_deals.origin IS
    'sync means the collections mirror invented this deal because money arrived against an account with no won deal. It pays nobody until sourced_by is set, which is the correct default.';

CREATE INDEX IF NOT EXISTS idx_crm_deals_needs_review
    ON public.crm_deals (created_at DESC) WHERE needs_review;

-- ---------------------------------------------------------------------
-- 3. THE SYNC HAS TO BE ABLE TO ASK WHO OWNS A CODE
--
-- `growth_attribution_owners` and `crm_live_registration_for_account` are
-- SECURITY DEFINER and gated on has_console_access(), which asks who is
-- signed in. The sync is signed in as nobody — it is a service-role
-- process — so both would return empty, and attribution would resolve
-- "unattributed" on a deal whose promo code we had just written onto it.
-- That is not a permission failure, it is a wrong answer that then gets
-- locked when the deal is settled.
--
-- So the gate gains one more way to be true, and only one: the service
-- role. Not `anon`, not `authenticated` without a console row. The
-- service role already bypasses RLS on every table these functions read;
-- refusing it here bought no privacy at all and cost a correct answer.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.growth_is_service_role()
RETURNS BOOLEAN AS $$
    SELECT COALESCE(
        NULLIF(current_setting('request.jwt.claim.role', true), ''),
        (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'),
        ''
    ) = 'service_role';
$$ LANGUAGE sql STABLE SET search_path = public, pg_catalog;

COMMENT ON FUNCTION public.growth_is_service_role() IS
    'True for the collections sync and nothing else. The service role already bypasses RLS on the tables the attribution lookups read, so refusing it there bought no privacy and cost a correct verdict.';

GRANT EXECUTE ON FUNCTION public.growth_is_service_role() TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.growth_is_service_role() FROM anon, public;

DO $$
BEGIN
    IF to_regclass('public.growth_attribution_keys') IS NULL THEN
        RAISE NOTICE 'growth_attribution_keys is absent; skipping the service-role gate.';
        RETURN;
    END IF;

    CREATE OR REPLACE FUNCTION public.growth_attribution_owners(
        p_key_types TEXT[],
        p_values    TEXT[]
    )
    RETURNS TABLE (key_type TEXT, key_value TEXT, owner_user_id UUID) AS $fn$
        SELECT k.key_type, lower(btrim(k.key_value)), k.user_id
          FROM public.growth_attribution_keys k
         WHERE (public.has_console_access() OR public.growth_is_service_role())
           AND k.active
           AND k.key_type = ANY (COALESCE(p_key_types, ARRAY[]::TEXT[]))
           AND lower(btrim(k.key_value)) = ANY (
                   SELECT lower(btrim(v)) FROM unnest(COALESCE(p_values, ARRAY[]::TEXT[])) AS v
               );
    $fn$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

    GRANT EXECUTE ON FUNCTION public.growth_attribution_owners(TEXT[], TEXT[]) TO authenticated, service_role;
    REVOKE EXECUTE ON FUNCTION public.growth_attribution_owners(TEXT[], TEXT[]) FROM anon, public;
END $$;

DO $$
BEGIN
    IF to_regclass('public.crm_deal_registrations') IS NULL THEN
        RETURN;
    END IF;

    CREATE OR REPLACE FUNCTION public.crm_live_registration_for_account(
        p_account_id UUID,
        p_domain     TEXT DEFAULT NULL
    )
    RETURNS TABLE (
        id                  UUID,
        requested_by        UUID,
        requested_at        TIMESTAMP WITH TIME ZONE,
        status              TEXT,
        decline_deadline_at TIMESTAMP WITH TIME ZONE,
        expires_at          TIMESTAMP WITH TIME ZONE
    ) AS $fn$
        SELECT r.id, r.requested_by, r.requested_at, r.status,
               r.decline_deadline_at, r.expires_at
          FROM public.crm_deal_registrations r
         WHERE (public.has_console_access() OR public.growth_is_service_role())
           AND r.status IN ('pending', 'approved', 'converted')
           AND (
                 (p_account_id IS NOT NULL AND r.account_id = p_account_id)
              OR (p_domain IS NOT NULL AND lower(btrim(r.account_domain)) = lower(btrim(p_domain)))
               )
         ORDER BY r.requested_at ASC
         LIMIT 1;
    $fn$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

    GRANT EXECUTE ON FUNCTION public.crm_live_registration_for_account(UUID, TEXT) TO authenticated, service_role;
    REVOKE EXECUTE ON FUNCTION public.crm_live_registration_for_account(UUID, TEXT) FROM anon, public;
END $$;

-- ---------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
--
-- The same line the ledger already draws: "Stripe — Never. Customer
-- payment data — Never." Every row in the event log names a customer, an
-- amount and a Stripe id, so a growth partner gets no policy on it at
-- all. Owners and admins read it; nobody writes it but the sync, which
-- arrives as the service role and is not subject to policies.
-- ---------------------------------------------------------------------
ALTER TABLE public.revenue_sync_events ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname FROM pg_policies
         WHERE schemaname = 'public' AND tablename = 'revenue_sync_events'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.revenue_sync_events', pol.policyname);
    END LOOP;
END $$;

SELECT public.__apply_policy('revenue_sync_events', 'Owners read the sync log', 'SELECT',
    'public.is_owner_or_admin()');

REVOKE ALL ON public.revenue_sync_events FROM anon;
GRANT SELECT ON public.revenue_sync_events TO authenticated;
GRANT ALL    ON public.revenue_sync_events TO service_role;
