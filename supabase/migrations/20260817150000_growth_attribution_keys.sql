-- =====================================================================
-- WHOSE CODE IS THIS, AND WHOSE LINK
--
-- Two of the three attribution rules are lookups, and until now there was
-- nothing to look in. `resolveAttribution` takes an ownership map —
-- promo code to partner, tracked source to partner — and the map had no
-- home, so the function had no callers and attribution was a column
-- somebody typed. This table is that map.
--
-- One row per key. A key is a promo code redeemed at checkout, a
-- utm_source recorded at signup, or a tracked link handed out at an
-- event.
--
-- WHY THE UNIQUE INDEX IS GLOBAL AND NOT PER PARTNER
--
-- "First match governs. No discretionary override." A rule that resolves
-- to two people is not a rule, and the moment a code appears under two
-- partners the verdict depends on which row the query happened to read
-- first. So an active key belongs to exactly one person, enforced by the
-- database rather than by everybody remembering. Deactivating a key frees
-- it, which is the honest way to hand a code over: the old row stays as
-- the record that it used to be theirs.
--
-- WHY OWNERS WRITE IT AND PARTNERS ONLY READ THEIR OWN
--
-- A partner who can insert their own keys can insert somebody else's
-- code under their own name and take the commission. That is the entire
-- attack, it is one INSERT, and it is why every write here is
-- is_owner_or_admin(). Handing a partner a code is an act of the company.
--
-- Reading is the mirror of the same argument: a partner sees their own
-- keys, because those are the instruments they are accountable for, and
-- not the roster of everybody else's. What they *can* learn, through
-- growth_attribution_owners() below, is who owns a specific key that is
-- already in evidence on a deal in front of them — which the verdict on
-- that deal was going to tell them anyway.
--
-- Table:     growth_attribution_keys
-- Function:  growth_attribution_owners
-- =====================================================================

DO $$
BEGIN
    -- admin_users arrives in 20260817090000. Guarding the whole migration
    -- rather than each statement keeps a fresh environment from failing
    -- half-applied, which is the state that is genuinely hard to recover.
    IF to_regclass('public.admin_users') IS NULL THEN
        RAISE NOTICE 'admin_users is absent; skipping growth_attribution_keys.';
        RETURN;
    END IF;

    CREATE TABLE IF NOT EXISTS public.growth_attribution_keys (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        -- The partner this key pays. CASCADE on delete: a key that pays
        -- nobody is worse than no key, because it silently attributes a
        -- deal to a dangling id.
        user_id     UUID NOT NULL REFERENCES public.admin_users (user_id) ON DELETE CASCADE,

        key_type    TEXT NOT NULL,

        -- Stored as typed, matched lowercased. Keeping the original casing
        -- means the console can show a code the way it is printed on a
        -- card while the lookup stays case-insensitive.
        key_value   TEXT NOT NULL,

        label       TEXT,
        note        TEXT,

        -- Deactivated rather than deleted. The question asked later is
        -- "whose was this in March", and a deleted row cannot answer it.
        active      BOOLEAN NOT NULL DEFAULT TRUE,

        created_by  UUID REFERENCES public.admin_users (user_id) ON DELETE SET NULL,
        created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
        updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),

        CONSTRAINT growth_attribution_keys_type_check
            CHECK (key_type IN ('promo_code', 'utm_source', 'tracked_link')),
        CONSTRAINT growth_attribution_keys_value_check
            CHECK (length(btrim(key_value)) BETWEEN 1 AND 200)
    );
END $$;

DO $$
BEGIN
    IF to_regclass('public.growth_attribution_keys') IS NULL THEN
        RETURN;
    END IF;

    COMMENT ON TABLE public.growth_attribution_keys IS
        'Promo codes, tracked sources and links, and the partner each one pays. The ownership map resolveAttribution reads; without it two of the three attribution rules cannot fire.';
    COMMENT ON COLUMN public.growth_attribution_keys.active IS
        'Deactivated rather than deleted, and only an inactive key frees its value for somebody else. "Whose was this in March" is a question a deleted row cannot answer.';
    COMMENT ON COLUMN public.growth_attribution_keys.key_value IS
        'Stored as typed, matched lowercased. The console shows the code the way it is printed; the lookup does not care about case.';
END $$;

-- One live owner per key, across everybody. See the header: a key that
-- resolves to two people makes the verdict depend on row order.
CREATE UNIQUE INDEX IF NOT EXISTS idx_growth_attribution_keys_live
    ON public.growth_attribution_keys (key_type, lower(btrim(key_value)))
    WHERE active;

-- The per-partner uniqueness the plan asks for, holding for inactive rows
-- too: the same person listing the same code twice is a data entry slip,
-- not a history worth keeping.
CREATE UNIQUE INDEX IF NOT EXISTS idx_growth_attribution_keys_per_partner
    ON public.growth_attribution_keys (user_id, key_type, lower(btrim(key_value)));

CREATE INDEX IF NOT EXISTS idx_growth_attribution_keys_user
    ON public.growth_attribution_keys (user_id) WHERE active;

-- ---------------------------------------------------------------------
-- TOUCH TRIGGER
--
-- The same function the rest of the CRM tables use, so `updated_at` means
-- the same thing everywhere.
-- ---------------------------------------------------------------------
DO $$
BEGIN
    IF to_regclass('public.growth_attribution_keys') IS NULL THEN
        RETURN;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname = 'public' AND p.proname = 'crm_touch_updated_at'
    ) THEN
        DROP TRIGGER IF EXISTS trg_growth_attribution_keys_touch ON public.growth_attribution_keys;
        CREATE TRIGGER trg_growth_attribution_keys_touch
            BEFORE UPDATE ON public.growth_attribution_keys
            FOR EACH ROW EXECUTE FUNCTION public.crm_touch_updated_at();
    END IF;
END $$;

-- ---------------------------------------------------------------------
-- RESOLVING KEYS THAT ARE ALREADY IN EVIDENCE
--
-- The service that attributes a deal needs the owner of the specific code
-- or source stamped on that deal, and it runs as the signed-in person. A
-- partner reading only their own rows would see a rival's code as
-- "belongs to nobody" and the verdict would fall through to the next
-- rule — which is not a permission error, it is a wrong answer that pays
-- the wrong person.
--
-- So this function is SECURITY DEFINER and takes the candidates rather
-- than returning the table: it answers "who owns these three strings I am
-- already looking at", and cannot be used to enumerate anybody's keys.
-- has_console_access() is the gate; a signed-in nobody gets nothing.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.growth_attribution_owners(
    p_key_types TEXT[],
    p_values    TEXT[]
)
RETURNS TABLE (key_type TEXT, key_value TEXT, owner_user_id UUID) AS $$
    SELECT k.key_type, lower(btrim(k.key_value)), k.user_id
      FROM public.growth_attribution_keys k
     WHERE public.has_console_access()
       AND k.active
       AND k.key_type = ANY (COALESCE(p_key_types, ARRAY[]::TEXT[]))
       AND lower(btrim(k.key_value)) = ANY (
               SELECT lower(btrim(v)) FROM unnest(COALESCE(p_values, ARRAY[]::TEXT[])) AS v
           );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.growth_attribution_owners(TEXT[], TEXT[]) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.growth_attribution_owners(TEXT[], TEXT[]) FROM anon, public;

-- ---------------------------------------------------------------------
-- THE LIVE REGISTRATION ON AN ACCOUNT
--
-- Same problem, same shape. Rule three reads the registration covering
-- the account, and a partner may only read registrations they filed. So a
-- partner attributing a deal on an account somebody else registered sees
-- no registration at all, and the verdict comes back "unattributed" —
-- then gets locked, and the wrong answer is now history.
--
-- A partner already sees every account, and the registrations page tells
-- an owner the same thing. What this adds is that the person looking at a
-- deal can be told the account is claimed, which is information they are
-- entitled to before they spend a quarter on it.
-- ---------------------------------------------------------------------
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
) AS $$
    SELECT r.id, r.requested_by, r.requested_at, r.status,
           r.decline_deadline_at, r.expires_at
      FROM public.crm_deal_registrations r
     WHERE public.has_console_access()
       AND r.status IN ('pending', 'approved', 'converted')
       AND (
             (p_account_id IS NOT NULL AND r.account_id = p_account_id)
          OR (p_domain IS NOT NULL AND lower(btrim(r.account_domain)) = lower(btrim(p_domain)))
           )
     -- At most one survives the unique index on a live claim; ordering
     -- earliest-first settles the case where a domain and an account id
     -- both hit and one of them is stale.
     ORDER BY r.requested_at ASC
     LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.crm_live_registration_for_account(UUID, TEXT) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.crm_live_registration_for_account(UUID, TEXT) FROM anon, public;

-- ---------------------------------------------------------------------
-- RECOMPUTING A COLLECTION FROM THE CONSOLE
--
-- commission_recompute_for_collection is service_role only, which is
-- right for a sync daemon and leaves the ledger with no producer a person
-- can reach. Until the Stripe-to-DOCS sync exists, an owner entering a
-- collection by hand has to be able to make the entries appear, and the
-- alternative — handing a server action the service role key — would
-- bypass every policy on every table it touches for the sake of one call.
--
-- So: a wrapper that adds the one check, and nothing else. A growth
-- partner calling it gets a permission error, which is the same answer
-- the underlying function's grants already gave them.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.commission_recompute_as_owner(p_collection_id UUID)
RETURNS INTEGER AS $$
BEGIN
    IF NOT public.is_owner_or_admin() THEN
        RAISE EXCEPTION 'Only an owner recomputes commission.' USING ERRCODE = '42501';
    END IF;

    RETURN public.commission_recompute_for_collection(p_collection_id);
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.commission_recompute_as_owner(UUID) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.commission_recompute_as_owner(UUID) FROM anon, public;

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY
--
-- Never `TO authenticated USING (true)`. Read is scoped to the owner of
-- the row; every write is the company's.
-- ---------------------------------------------------------------------
DO $$
BEGIN
    IF to_regclass('public.growth_attribution_keys') IS NULL THEN
        RETURN;
    END IF;

    EXECUTE 'ALTER TABLE public.growth_attribution_keys ENABLE ROW LEVEL SECURITY';

    DROP POLICY IF EXISTS "Partners read their own keys" ON public.growth_attribution_keys;
    CREATE POLICY "Partners read their own keys"
        ON public.growth_attribution_keys FOR SELECT TO authenticated
        USING (
            public.is_owner_or_admin()
            OR (public.is_growth_member() AND user_id = auth.uid())
        );

    -- Handing somebody a code is an act of the company. A partner who
    -- could insert here could insert somebody else's code under their own
    -- name, which is the whole of the attack.
    DROP POLICY IF EXISTS "Owners manage attribution keys" ON public.growth_attribution_keys;
    CREATE POLICY "Owners manage attribution keys"
        ON public.growth_attribution_keys FOR ALL TO authenticated
        USING (public.is_owner_or_admin())
        WITH CHECK (public.is_owner_or_admin());
END $$;
