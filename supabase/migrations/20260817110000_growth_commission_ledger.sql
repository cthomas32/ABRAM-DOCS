-- =====================================================================
-- THE COMMISSION LEDGER
--
-- What a growth partner is owed, derived rather than asserted.
--
-- The agreement pays on "net cash collected by ABRAM through Stripe. Not
-- bookings, not pipeline, not signups." Every design choice below comes
-- out of that sentence:
--
--   * A collection is the unit, not a deal. A deal that closed for
--     $30,000 and collected $2,400 pays on $2,400.
--   * Nothing in this schema is authoritative about money. Collections
--     are mirrored from the payment processor, which lives in the product
--     database and not this one. A row here that disagrees with Stripe is
--     wrong by definition, and the reconciliation column exists to make
--     that disagreement visible rather than silent.
--   * Commission entries are immutable once paid. A clawback is a new,
--     negative row pointing at the one it reverses — never an edit. A
--     ledger you can edit is not a ledger, and the first time a paid
--     figure changes underneath somebody is the last time they trust it.
--
-- Tables:    revenue_collections, commission_entries, commission_payouts,
--            growth_equity_tranches
-- Functions: growth_terms_at, commission_recompute_for_collection
-- Views:     growth_attributed_mrr, commission_statement
--
-- WHO GETS PAID — read this before touching the rule.
--
-- The agreement defines both rates in terms of origination:
--
--     "Closed  — she sourced the account and ran it to completed checkout"
--     "Sourced — she originated it, Connor closed it"
--
-- Both require that she sourced it. So the payee is always the deal's
-- sourcer, and the only question the rate answers is whether that same
-- person also closed it. Closing an account somebody else originated is
-- not a paid event under this agreement.
--
-- That is genuinely counterintuitive and a reasonable engineer would
-- write it the other way round — paying the closer the close rate and the
-- sourcer the source rate, splitting one deal across two people. That
-- reading pays out roughly a third more than the document promises. It is
-- written here rather than left to be re-derived for exactly that reason.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. COLLECTIONS
--
-- One row per payment actually collected, mirrored from the payment
-- processor. This table is a copy and is treated as one: `source` says
-- where it came from and `raw` keeps whatever the processor said, so a
-- reconciliation run can tell a sync bug from a genuine refund.
--
-- Money in integer cents. Currency alongside it, because a mixed-currency
-- ledger that assumes dollars is a bug that surfaces as a rounding
-- complaint eighteen months after it was introduced.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.revenue_collections (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The processor's own id. Unique, and the reason a sync can be re-run
    -- as many times as it needs to be without doubling anybody's pay.
    external_payment_ref  TEXT NOT NULL UNIQUE,
    external_customer_ref TEXT,
    external_invoice_ref  TEXT,

    deal_id               UUID REFERENCES public.crm_deals (id) ON DELETE SET NULL,
    account_id            UUID REFERENCES public.crm_accounts (id) ON DELETE SET NULL,

    collected_at          TIMESTAMP WITH TIME ZONE NOT NULL,

    -- The first of the month the payment landed in. Stored rather than
    -- derived because payouts are keyed to it and a timezone change on
    -- read would move a payment between two statements.
    collection_month      DATE NOT NULL,

    gross_cents           BIGINT NOT NULL DEFAULT 0,
    discount_cents        BIGINT NOT NULL DEFAULT 0,
    fee_cents             BIGINT NOT NULL DEFAULT 0,

    -- What commission is actually calculated on: gross less any discount
    -- applied at checkout. Processor fees are NOT deducted — the agreement
    -- says net of discount and says nothing about fees, and quietly
    -- netting them off would shave a few percent off every payment.
    net_cents             BIGINT NOT NULL DEFAULT 0,

    currency              TEXT NOT NULL DEFAULT 'USD',

    status                TEXT NOT NULL DEFAULT 'collected',
    refunded_cents        BIGINT NOT NULL DEFAULT 0,
    reversed_at           TIMESTAMP WITH TIME ZONE,
    reversal_reason       TEXT,

    -- True for the customer's very first payment. The twelve month tail
    -- runs from here, so it is stamped once by the sync rather than
    -- recomputed by every query that needs to know.
    is_first_payment      BOOLEAN NOT NULL DEFAULT FALSE,

    source                TEXT NOT NULL DEFAULT 'stripe',
    raw                   JSONB NOT NULL DEFAULT '{}'::jsonb,
    synced_at             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT revenue_collections_status_check
        CHECK (status IN ('collected', 'refunded', 'charged_back', 'cancelled')),
    CONSTRAINT revenue_collections_source_check
        CHECK (source IN ('stripe', 'manual', 'import')),
    CONSTRAINT revenue_collections_non_negative
        CHECK (gross_cents >= 0 AND discount_cents >= 0 AND net_cents >= 0 AND refunded_cents >= 0)
);

COMMENT ON TABLE public.revenue_collections IS
    'Payments actually collected, mirrored from the payment processor. A copy, never the source of truth: a row here that disagrees with Stripe is wrong by definition.';
COMMENT ON COLUMN public.revenue_collections.net_cents IS
    'Gross less discount applied at checkout. Processor fees are deliberately NOT deducted — the agreement says net of discount and says nothing about fees.';
COMMENT ON COLUMN public.revenue_collections.is_first_payment IS
    'The customer''s first ever payment. The twelve month commission tail runs from here, so it is stamped once at sync rather than recomputed on every read.';

CREATE INDEX IF NOT EXISTS idx_collections_month    ON public.revenue_collections (collection_month DESC);
CREATE INDEX IF NOT EXISTS idx_collections_deal     ON public.revenue_collections (deal_id);
CREATE INDEX IF NOT EXISTS idx_collections_customer ON public.revenue_collections (external_customer_ref, collected_at);
CREATE INDEX IF NOT EXISTS idx_collections_unlinked ON public.revenue_collections (collected_at DESC) WHERE deal_id IS NULL;

-- ---------------------------------------------------------------------
-- 2. PAYOUTS
--
-- A month's statement. Created before its entries are attached, so an
-- entry can point at the statement it will be paid on from the moment it
-- is accrued.
--
-- "Paid monthly, within 30 days of the close of the collection month."
-- due_at is that promise, stored so a late payment is visible rather than
-- a matter of opinion.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.commission_payouts (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES public.admin_users (user_id) ON DELETE CASCADE,
    period_month   DATE NOT NULL,

    total_cents    BIGINT NOT NULL DEFAULT 0,
    currency       TEXT NOT NULL DEFAULT 'USD',

    status         TEXT NOT NULL DEFAULT 'draft',
    due_at         DATE NOT NULL,
    approved_by    UUID REFERENCES public.admin_users (user_id) ON DELETE SET NULL,
    approved_at    TIMESTAMP WITH TIME ZONE,
    paid_at        TIMESTAMP WITH TIME ZONE,
    payment_ref    TEXT,
    note           TEXT,

    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT commission_payouts_status_check
        CHECK (status IN ('draft', 'approved', 'paid', 'void')),
    UNIQUE (user_id, period_month)
);

COMMENT ON COLUMN public.commission_payouts.due_at IS
    'Close of the collection month plus thirty days, per the agreement. Stored so a late payment is visible rather than a matter of opinion.';

CREATE INDEX IF NOT EXISTS idx_payouts_user ON public.commission_payouts (user_id, period_month DESC);

-- ---------------------------------------------------------------------
-- 3. COMMISSION ENTRIES
--
-- One row per (collection, partner). Append only in spirit: an entry that
-- has been paid is never edited, and a reversal is a new negative row
-- carrying `reverses_entry_id`.
--
-- Every entry snapshots the rate it was computed at and the terms row
-- that rate came from. A promotion three months from now must not restate
-- what was already paid.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.commission_entries (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES public.admin_users (user_id) ON DELETE CASCADE,

    collection_id     UUID REFERENCES public.revenue_collections (id) ON DELETE CASCADE,
    deal_id           UUID REFERENCES public.crm_deals (id) ON DELETE SET NULL,
    account_id        UUID REFERENCES public.crm_accounts (id) ON DELETE SET NULL,
    terms_id          UUID REFERENCES public.growth_partner_terms (id) ON DELETE SET NULL,
    payout_id         UUID REFERENCES public.commission_payouts (id) ON DELETE SET NULL,

    -- Which half of the job this pays for. Under this agreement the payee
    -- is the sourcer either way; this records whether they closed it too.
    credit_type       TEXT NOT NULL,

    collection_month  DATE NOT NULL,
    basis_cents       BIGINT NOT NULL DEFAULT 0,
    rate_applied      NUMERIC(6, 4) NOT NULL,

    -- Signed. A clawback is negative, which means a statement is a SUM
    -- rather than a sum minus a separate reversals query that somebody
    -- eventually forgets to write.
    amount_cents      BIGINT NOT NULL DEFAULT 0,
    currency          TEXT NOT NULL DEFAULT 'USD',

    status            TEXT NOT NULL DEFAULT 'accrued',
    reverses_entry_id UUID REFERENCES public.commission_entries (id) ON DELETE SET NULL,

    computed_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    note              TEXT,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT commission_entries_credit_type_check
        CHECK (credit_type IN ('closed', 'sourced')),
    CONSTRAINT commission_entries_status_check
        CHECK (status IN ('accrued', 'payable', 'paid', 'clawed_back', 'void')),
    CONSTRAINT commission_entries_rate_range
        CHECK (rate_applied >= 0 AND rate_applied <= 1)
);

COMMENT ON TABLE public.commission_entries IS
    'One row per collection per partner. Never edited once paid — a clawback is a new negative row pointing at the one it reverses.';
COMMENT ON COLUMN public.commission_entries.rate_applied IS
    'Snapshotted, not looked up. A promotion three months from now must not restate what was already paid.';
COMMENT ON COLUMN public.commission_entries.amount_cents IS
    'Signed. Clawbacks are negative so a statement is a plain SUM rather than a sum minus a reversals query somebody eventually forgets to write.';

-- One live entry per collection per person. The recompute function relies
-- on this to be safely re-runnable.
CREATE UNIQUE INDEX IF NOT EXISTS idx_commission_entries_once
    ON public.commission_entries (collection_id, user_id)
    WHERE reverses_entry_id IS NULL AND status <> 'void';

CREATE INDEX IF NOT EXISTS idx_commission_entries_user
    ON public.commission_entries (user_id, collection_month DESC);
CREATE INDEX IF NOT EXISTS idx_commission_entries_payout
    ON public.commission_entries (payout_id);

DROP TRIGGER IF EXISTS trg_commission_payouts_touch ON public.commission_payouts;
CREATE TRIGGER trg_commission_payouts_touch BEFORE UPDATE ON public.commission_payouts
    FOR EACH ROW EXECUTE FUNCTION public.crm_touch_updated_at();

-- ---------------------------------------------------------------------
-- 4. A PAID ENTRY IS IMMUTABLE
--
-- The guarantee that makes the ledger worth reading. Without it, "your
-- March statement" is whatever the table happens to say today.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.commission_entries_guard_immutable()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'paid'
       AND (NEW.amount_cents  IS DISTINCT FROM OLD.amount_cents
         OR NEW.rate_applied  IS DISTINCT FROM OLD.rate_applied
         OR NEW.basis_cents   IS DISTINCT FROM OLD.basis_cents
         OR NEW.user_id       IS DISTINCT FROM OLD.user_id
         OR NEW.collection_id IS DISTINCT FROM OLD.collection_id)
    THEN
        RAISE EXCEPTION
            'A paid commission entry cannot be altered. Post a reversing entry instead.'
            USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_commission_entries_immutable ON public.commission_entries;
CREATE TRIGGER trg_commission_entries_immutable BEFORE UPDATE ON public.commission_entries
    FOR EACH ROW EXECUTE FUNCTION public.commission_entries_guard_immutable();

-- ---------------------------------------------------------------------
-- 5. WHICH TERMS APPLIED ON A GIVEN DAY
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.growth_terms_at(p_user_id UUID, p_on DATE)
RETURNS public.growth_partner_terms AS $$
    SELECT *
      FROM public.growth_partner_terms
     WHERE user_id = p_user_id
       AND effective_from <= p_on
       AND (effective_to IS NULL OR effective_to >= p_on)
     ORDER BY effective_from DESC
     LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------
-- 6. THE RULE, IN ONE PLACE
--
-- Everything the agreement says about whether a payment pays anybody,
-- evaluated in the order it is written. Safe to re-run over any
-- collection at any time: it voids whatever it previously wrote for that
-- collection and writes the current answer, so a late-arriving deal link
-- or a corrected refund produces the right figure without a manual fix.
--
-- Returns the number of entries written.
-- ---------------------------------------------------------------------
/**
 * Voids whatever is currently live against a collection.
 *
 * Split out because the recompute has four places it can conclude "there
 * should be nothing here", and every one of them has to clear a stale
 * entry rather than leave one behind.
 */
CREATE OR REPLACE FUNCTION public.__commission_void_live(p_collection_id UUID)
RETURNS VOID AS $$
    UPDATE public.commission_entries
       SET status = 'void',
           note   = COALESCE(note, '') || ' [superseded by recompute]'
     WHERE collection_id = p_collection_id
       AND status IN ('accrued', 'payable');
$$ LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.__commission_void_live(UUID) FROM anon, authenticated, public;

CREATE OR REPLACE FUNCTION public.commission_recompute_for_collection(p_collection_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_existing     public.commission_entries;
    v_collection   public.revenue_collections;
    v_deal         public.crm_deals;
    v_account      public.crm_accounts;
    v_terms        public.growth_partner_terms;
    v_payee        UUID;
    v_credit_type  TEXT;
    v_rate         NUMERIC(6, 4);
    v_basis        BIGINT;
    v_first_paid   TIMESTAMP WITH TIME ZONE;
    v_written      INTEGER := 0;
BEGIN
    SELECT * INTO v_collection FROM public.revenue_collections WHERE id = p_collection_id;
    IF NOT FOUND THEN
        RETURN 0;
    END IF;

    IF v_collection.deal_id IS NULL THEN
        -- Not linked to a deal yet. Anything previously written against
        -- it is now wrong and gets voided; there is nothing to replace it.
        PERFORM public.__commission_void_live(p_collection_id);
        RETURN 0;
    END IF;

    SELECT * INTO v_deal FROM public.crm_deals WHERE id = v_collection.deal_id;
    IF NOT FOUND THEN PERFORM public.__commission_void_live(p_collection_id); RETURN 0; END IF;

    SELECT * INTO v_account FROM public.crm_accounts WHERE id = v_deal.account_id;
    IF NOT FOUND THEN PERFORM public.__commission_void_live(p_collection_id); RETURN 0; END IF;

    -- Exclusions, in the order the agreement lists them. Each one voids
    -- anything already sitting there: an account marked comped today must
    -- stop paying, not merely stop accruing more.
    IF v_account.carve_out IS NOT NULL
       OR v_account.is_comped
       OR v_account.is_company_managed
       OR v_deal.attribution_rule = 'unattributed'
       OR v_deal.stage <> 'won'
    THEN
        PERFORM public.__commission_void_live(p_collection_id);
        RETURN 0;
    END IF;

    -- The payee is the sourcer. See the header of this file — this is the
    -- part a future reader will be tempted to "fix".
    v_payee := v_deal.sourced_by;
    IF v_payee IS NULL THEN PERFORM public.__commission_void_live(p_collection_id); RETURN 0; END IF;

    -- Owners are not paid commission by this ledger.
    IF EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = v_payee AND role <> 'growth') THEN
        PERFORM public.__commission_void_live(p_collection_id);
        RETURN 0;
    END IF;

    -- The twelve month tail, measured from the customer's first payment
    -- rather than from the close date. A customer who signed in January
    -- and first paid in March pays through the following February.
    SELECT MIN(collected_at) INTO v_first_paid
      FROM public.revenue_collections
     WHERE external_customer_ref = v_collection.external_customer_ref
       AND external_customer_ref IS NOT NULL;

    v_terms := public.growth_terms_at(v_payee, v_collection.collection_month);
    IF v_terms.id IS NULL THEN PERFORM public.__commission_void_live(p_collection_id); RETURN 0; END IF;

    IF v_first_paid IS NOT NULL
       AND v_collection.collected_at >= v_first_paid + make_interval(months => v_terms.tail_months)
    THEN
        -- Tail has run out. It ends permanently.
        PERFORM public.__commission_void_live(p_collection_id);
        RETURN 0;
    END IF;

    -- Closed pays the higher rate only when the sourcer also closed it.
    IF v_deal.closed_by IS NOT NULL AND v_deal.closed_by = v_payee THEN
        v_credit_type := 'closed';
        v_rate        := v_terms.close_rate;
    ELSE
        v_credit_type := 'sourced';
        v_rate        := v_terms.source_rate;
    END IF;

    -- A reversed collection accrues nothing. The clawback window is
    -- enforced by the sync that sets `reversed_at`; by the time a row
    -- reaches here already reversed, the answer is simply zero.
    IF v_collection.status <> 'collected' THEN
        v_basis := 0;
    ELSE
        v_basis := GREATEST(v_collection.net_cents - v_collection.refunded_cents, 0);
    END IF;

    IF v_basis = 0 THEN PERFORM public.__commission_void_live(p_collection_id); RETURN 0; END IF;

    -- If the live entry already says exactly this, leave it alone.
    --
    -- Without this the function is still correct but not quiet: a nightly
    -- recompute would void and rewrite every entry every night, and a
    -- year later each collection carries three hundred dead rows and the
    -- audit trail is unreadable. A no-op when nothing changed is what
    -- makes this safe to run on a schedule.
    SELECT * INTO v_existing
      FROM public.commission_entries
     WHERE collection_id = p_collection_id
       AND status IN ('accrued', 'payable')
     LIMIT 1;

    IF FOUND
       AND v_existing.user_id      = v_payee
       AND v_existing.credit_type  = v_credit_type
       AND v_existing.rate_applied = v_rate
       AND v_existing.basis_cents  = v_basis
       AND v_existing.amount_cents = ROUND(v_basis * v_rate)
    THEN
        RETURN 0;
    END IF;

    PERFORM public.__commission_void_live(p_collection_id);

    INSERT INTO public.commission_entries (
        user_id, collection_id, deal_id, account_id, terms_id,
        credit_type, collection_month, basis_cents, rate_applied,
        amount_cents, currency, status
    ) VALUES (
        v_payee, p_collection_id, v_deal.id, v_account.id, v_terms.id,
        v_credit_type, v_collection.collection_month, v_basis, v_rate,
        ROUND(v_basis * v_rate), v_collection.currency, 'accrued'
    );

    v_written := 1;
    RETURN v_written;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.commission_recompute_for_collection(UUID) IS
    'The whole agreement in one function, evaluated in the order it is written. Safe to re-run over any collection at any time.';

-- Only the sync process and an owner may recompute. A partner running
-- this against their own accounts would be marking their own homework.
REVOKE EXECUTE ON FUNCTION public.commission_recompute_for_collection(UUID) FROM anon, authenticated, public;
GRANT  EXECUTE ON FUNCTION public.commission_recompute_for_collection(UUID) TO service_role;
GRANT  EXECUTE ON FUNCTION public.growth_terms_at(UUID, DATE) TO authenticated, service_role;

-- ---------------------------------------------------------------------
-- 7. ATTRIBUTED MRR
--
-- The number the equity tranches trigger on, and the number that promotes
-- an Advisor to Head of Growth. It counts recurring revenue on won,
-- attributed, non-excluded deals sourced by each partner.
--
-- Deliberately reads deals rather than collections: MRR is a run rate, and
-- a run rate computed from last month's cash lags reality by a month in
-- the one direction that matters here.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW public.growth_attributed_mrr AS
SELECT
    d.sourced_by                                   AS user_id,
    SUM(d.mrr_cents) FILTER (WHERE d.stage = 'won') AS attributed_mrr_cents,
    COUNT(*) FILTER (WHERE d.stage = 'won')         AS won_deals,
    COUNT(*) FILTER (WHERE d.stage NOT IN ('won', 'lost')) AS open_deals
FROM public.crm_deals d
JOIN public.crm_accounts a ON a.id = d.account_id
WHERE d.sourced_by IS NOT NULL
  AND d.attribution_rule <> 'unattributed'
  AND a.carve_out IS NULL
  AND NOT a.is_comped
  AND NOT a.is_company_managed
GROUP BY d.sourced_by;

COMMENT ON VIEW public.growth_attributed_mrr IS
    'The number equity tranches trigger on and the number that promotes an Advisor. Reads deals rather than collections because MRR is a run rate, and a run rate computed from last month''s cash lags by a month.';

-- ---------------------------------------------------------------------
-- 8. EQUITY TRANCHES
--
-- Not a payment system — a record of whether a threshold has been crossed
-- and when. The instrument itself is paper, and deliberately stays paper.
-- What this stores is the trigger, so "has she hit $6,000" is answered by
-- the same data as her commission rather than by a separate spreadsheet
-- that disagrees.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.growth_equity_tranches (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES public.admin_users (user_id) ON DELETE CASCADE,
    label               TEXT NOT NULL,
    size_pct            NUMERIC(6, 4) NOT NULL,
    trigger_kind        TEXT NOT NULL DEFAULT 'attributed_mrr',
    trigger_mrr_cents   BIGINT,
    triggered_at        TIMESTAMP WITH TIME ZONE,
    granted_on          DATE,
    vest_months         INTEGER NOT NULL DEFAULT 48,
    cliff_months        INTEGER NOT NULL DEFAULT 0,
    note                TEXT,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT growth_equity_trigger_kind_check
        CHECK (trigger_kind IN ('signing', 'attributed_mrr')),
    UNIQUE (user_id, label)
);

COMMENT ON TABLE public.growth_equity_tranches IS
    'Whether a threshold has been crossed and when. The instrument stays paper; this exists so "has she hit $6,000" is answered by the same data as her commission.';

-- ---------------------------------------------------------------------
-- 9. THE STATEMENT
--
-- What a partner opens to see what they have earned. One row per month
-- per person, clawbacks already folded in because entries are signed.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW public.commission_statement AS
SELECT
    e.user_id,
    e.collection_month,
    e.currency,
    SUM(e.amount_cents) FILTER (WHERE e.status <> 'void')                    AS total_cents,
    SUM(e.amount_cents) FILTER (WHERE e.status = 'paid')                     AS paid_cents,
    SUM(e.amount_cents) FILTER (WHERE e.status IN ('accrued', 'payable'))    AS outstanding_cents,
    SUM(e.amount_cents) FILTER (WHERE e.status = 'clawed_back')              AS clawed_back_cents,
    SUM(e.basis_cents)  FILTER (WHERE e.status <> 'void')                    AS basis_cents,
    COUNT(DISTINCT e.deal_id)                                                AS deals
FROM public.commission_entries e
GROUP BY e.user_id, e.collection_month, e.currency;

-- ---------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY
--
-- The line drawn here comes straight from the access table in the
-- agreement: "Stripe — Never. Customer payment data — Never."
--
--   revenue_collections   owner and admin only. This is the raw payment
--                         mirror: every customer, every invoice
--                         reference, every refund. A partner has no
--                         business in it and gets no policy.
--
--   commission_entries    a partner reads their own. That does reveal
--                         what their own accounts paid, and that is
--                         deliberate: they can already derive it from
--                         their commission and their known rate, so
--                         hiding it would be theatre rather than privacy.
--                         What they still cannot see is anybody else's
--                         accounts, or a single payment instrument.
--
--   Writes are closed to everybody. Entries come from the recompute
--   function running as the service role, and a ledger a partner can
--   write to is not a ledger.
-- ---------------------------------------------------------------------
ALTER TABLE public.revenue_collections    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_entries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_payouts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_equity_tranches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners read collections" ON public.revenue_collections;
CREATE POLICY "Owners read collections"
    ON public.revenue_collections FOR SELECT TO authenticated
    USING (public.is_owner_or_admin());

DROP POLICY IF EXISTS "Owners manage collections" ON public.revenue_collections;
CREATE POLICY "Owners manage collections"
    ON public.revenue_collections FOR ALL TO authenticated
    USING (public.is_owner_or_admin())
    WITH CHECK (public.is_owner_or_admin());

DROP POLICY IF EXISTS "Partners read their own entries" ON public.commission_entries;
CREATE POLICY "Partners read their own entries"
    ON public.commission_entries FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.is_owner_or_admin());

DROP POLICY IF EXISTS "Owners manage entries" ON public.commission_entries;
CREATE POLICY "Owners manage entries"
    ON public.commission_entries FOR ALL TO authenticated
    USING (public.is_owner_or_admin())
    WITH CHECK (public.is_owner_or_admin());

DROP POLICY IF EXISTS "Partners read their own payouts" ON public.commission_payouts;
CREATE POLICY "Partners read their own payouts"
    ON public.commission_payouts FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.is_owner_or_admin());

DROP POLICY IF EXISTS "Owners manage payouts" ON public.commission_payouts;
CREATE POLICY "Owners manage payouts"
    ON public.commission_payouts FOR ALL TO authenticated
    USING (public.is_owner_or_admin())
    WITH CHECK (public.is_owner_or_admin());

DROP POLICY IF EXISTS "Partners read their own tranches" ON public.growth_equity_tranches;
CREATE POLICY "Partners read their own tranches"
    ON public.growth_equity_tranches FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.is_owner_or_admin());

DROP POLICY IF EXISTS "Owners manage tranches" ON public.growth_equity_tranches;
CREATE POLICY "Owners manage tranches"
    ON public.growth_equity_tranches FOR ALL TO authenticated
    USING (public.is_owner())
    WITH CHECK (public.is_owner());

-- Views inherit nothing. `security_invoker` makes each of these run with
-- the caller's own permissions, so the policies above actually apply
-- rather than being bypassed by reading through a view.
ALTER VIEW public.commission_statement   SET (security_invoker = on);
ALTER VIEW public.growth_attributed_mrr  SET (security_invoker = on);
ALTER VIEW public.crm_attribution_audit  SET (security_invoker = on);
