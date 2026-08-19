-- =====================================================================
-- CRM LIFECYCLE: ACCOUNTS, OWNERSHIP, DEALS AND ATTRIBUTION
--
-- The CRM could already answer "who did we meet, and where are they in
-- the funnel". It could not answer the two questions a commission
-- agreement actually turns on:
--
--     Whose lead was this, and who closed it?
--     What made it arrive, and can that be proved without an argument?
--
-- Neither is recoverable after the fact. A contact reassigned six months
-- from now overwrites the only evidence of who found it, and a UTM that
-- was never stamped onto a person is gone the moment the session expires.
-- Both are cheap today and impossible later, which is the whole reason
-- this migration is not waiting for the interface that reads it.
--
-- Tables:    crm_accounts, crm_deals, crm_deal_registrations
-- Columns:   ownership and first-touch attribution on crm_contacts
-- Views:     crm_attribution_audit
--
-- The attribution rules below are transcribed from the growth partnership
-- terms, and one line of that document governs how they are written:
--
--     "First match governs. No discretionary override."
--
-- That is why `attribution_rule` is a single column with a fixed
-- vocabulary and a stamped timestamp rather than a set of flags. A set of
-- flags is a conversation. One column with the rule that fired and the
-- moment it fired is a fact.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ACCOUNTS
--
-- The company, as distinct from the people at it. A deal belongs to an
-- account rather than to a contact, because the person who takes the
-- first meeting is regularly not the person who signs, and crediting a
-- close to whoever happened to reply last is how commission disputes
-- start.
--
-- Three of these columns exist purely to answer "does this pay":
-- is_comped, is_company_managed and carve_out. All three are exclusions
-- written into the agreement, so the ledger reads them rather than
-- relying on somebody remembering.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_accounts (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name               TEXT NOT NULL,
    slug               TEXT UNIQUE,

    -- The dedupe key that actually works. Company names are typed three
    -- different ways by three different people; a domain is one string.
    domain             TEXT,

    website            TEXT,
    industry           TEXT,
    size_band          TEXT,
    city               TEXT,
    country            TEXT,
    notes              TEXT,

    -- Who runs this relationship, and who found it. Kept apart on purpose:
    -- see the note on crm_contacts below.
    owner_user_id      UUID REFERENCES public.admin_users (user_id) ON DELETE SET NULL,
    sourced_by         UUID REFERENCES public.admin_users (user_id) ON DELETE SET NULL,

    -- Exclusions, straight from the agreement.
    is_comped          BOOLEAN NOT NULL DEFAULT FALSE,
    is_company_managed BOOLEAN NOT NULL DEFAULT FALSE,
    carve_out          TEXT,

    -- The moment anybody from here first spoke to anybody there. A deal
    -- registration is only valid if it was filed BEFORE this, so it has to
    -- be a stored fact rather than a recollection.
    first_contact_at   TIMESTAMP WITH TIME ZONE,

    lifecycle          TEXT NOT NULL DEFAULT 'prospect',
    archived           BOOLEAN NOT NULL DEFAULT FALSE,
    created_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT crm_accounts_lifecycle_check
        CHECK (lifecycle IN ('prospect', 'engaged', 'customer', 'churned', 'disqualified'))
);

COMMENT ON TABLE public.crm_accounts IS
    'The company, as distinct from the people at it. A deal belongs here because the person who takes the first meeting is regularly not the person who signs.';

COMMENT ON COLUMN public.crm_accounts.carve_out IS
    'Names an agreement that removes this account from commission entirely, for example an introduction made through an investor whose portfolio is excluded by contract. Non-null means the ledger skips it regardless of who sourced or closed it.';

COMMENT ON COLUMN public.crm_accounts.first_contact_at IS
    'A deal registration is only valid if filed before this instant. Stored rather than recalled, because the whole point of registration is that it settles a dispute.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_accounts_domain
    ON public.crm_accounts (lower(domain)) WHERE domain IS NOT NULL AND NOT archived;
CREATE INDEX IF NOT EXISTS idx_crm_accounts_owner  ON public.crm_accounts (owner_user_id) WHERE NOT archived;
CREATE INDEX IF NOT EXISTS idx_crm_accounts_source ON public.crm_accounts (sourced_by) WHERE NOT archived;

-- ---------------------------------------------------------------------
-- 2. OWNERSHIP AND CREDIT ON A CONTACT
--
-- Three separate people, and they are separate because conflating them
-- loses money for somebody:
--
--   owner_user_id  who works it today. Changes freely, means nothing
--                  financially.
--   sourced_by     who originated it. Set once, at creation, and never
--                  moved by a reassignment.
--   closed_by      who ran it to a completed checkout.
--
-- The agreement pays a different rate for sourcing than for closing, so a
-- single "owner" column cannot express what is owed. Deriving credit from
-- whoever holds the record at the moment it moves to Won is worse still:
-- it means handing a contact to a colleague silently moves the money.
-- ---------------------------------------------------------------------
ALTER TABLE public.crm_contacts
    ADD COLUMN IF NOT EXISTS account_id     UUID REFERENCES public.crm_accounts (id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS owner_user_id  UUID REFERENCES public.admin_users (user_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS sourced_by     UUID REFERENCES public.admin_users (user_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS closed_by      UUID REFERENCES public.admin_users (user_id) ON DELETE SET NULL,

    -- Which journey this person is on. The two motions do not share a
    -- stage vocabulary and never should, but they are the same people
    -- table — see .agents/marketing-funnel.md.
    ADD COLUMN IF NOT EXISTS motion         TEXT NOT NULL DEFAULT 'enterprise',

    -- First touch, stamped onto the person at the moment they became one.
    -- Until now `landing_visits` held 113 visits that resolved to nobody,
    -- which meant the funnel could count people but could not say what
    -- produced them. These columns are that join, finally made.
    ADD COLUMN IF NOT EXISTS first_touch_source       TEXT,
    ADD COLUMN IF NOT EXISTS first_touch_medium       TEXT,
    ADD COLUMN IF NOT EXISTS first_touch_campaign     TEXT,
    ADD COLUMN IF NOT EXISTS first_touch_content      TEXT,
    ADD COLUMN IF NOT EXISTS first_touch_term         TEXT,
    ADD COLUMN IF NOT EXISTS first_touch_landing_path TEXT,
    ADD COLUMN IF NOT EXISTS first_touch_referrer     TEXT,
    ADD COLUMN IF NOT EXISTS first_touch_at           TIMESTAMP WITH TIME ZONE,

    -- The landing session this person came out of, so behaviour already
    -- recorded against an anonymous session becomes readable as theirs.
    ADD COLUMN IF NOT EXISTS first_session_id         TEXT,

    -- A promo code seen on the way in. Attribution rule one reads the
    -- code actually redeemed at checkout, which lives on the deal; this
    -- is the earlier, weaker signal and is kept apart from it.
    ADD COLUMN IF NOT EXISTS promo_code               TEXT;

COMMENT ON COLUMN public.crm_contacts.sourced_by IS
    'Who originated this lead. Set once at creation and never moved by a reassignment, because the agreement pays for sourcing separately from closing.';
COMMENT ON COLUMN public.crm_contacts.owner_user_id IS
    'Who works it today. Changes freely and carries no financial meaning — that is the point of it being a different column from sourced_by.';
COMMENT ON COLUMN public.crm_contacts.motion IS
    'self_serve or enterprise. Two funnels, one spine: the same people table, a stage set per journey.';

ALTER TABLE public.crm_contacts
    DROP CONSTRAINT IF EXISTS crm_contacts_motion_check;
ALTER TABLE public.crm_contacts
    ADD CONSTRAINT crm_contacts_motion_check CHECK (motion IN ('self_serve', 'enterprise'));

-- The stage vocabulary gains the two the funnel document already named.
-- `subscriber` is where a newsletter signup lands, which is earlier than
-- anything the conference flow ever produced. `demo` is the enterprise
-- step between a real conversation and a proposal on the table.
ALTER TABLE public.crm_contacts
    DROP CONSTRAINT IF EXISTS crm_contacts_stage_check;
ALTER TABLE public.crm_contacts
    ADD CONSTRAINT crm_contacts_stage_check CHECK (stage IN (
        'subscriber', 'new', 'contacted', 'qualified', 'demo', 'opportunity', 'won', 'lost'
    ));

CREATE INDEX IF NOT EXISTS idx_crm_contacts_account ON public.crm_contacts (account_id) WHERE NOT archived;
CREATE INDEX IF NOT EXISTS idx_crm_contacts_owner   ON public.crm_contacts (owner_user_id) WHERE NOT archived;
CREATE INDEX IF NOT EXISTS idx_crm_contacts_sourced ON public.crm_contacts (sourced_by) WHERE NOT archived;
CREATE INDEX IF NOT EXISTS idx_crm_contacts_session ON public.crm_contacts (first_session_id) WHERE first_session_id IS NOT NULL;

-- Every contact that exists today was found and is worked by the founder.
-- Leaving these null would make the first pipeline query show an unowned
-- board and would make the first commission run ambiguous.
UPDATE public.crm_contacts c
   SET owner_user_id = (SELECT user_id FROM public.admin_users WHERE role = 'owner' ORDER BY created_at LIMIT 1),
       sourced_by    = (SELECT user_id FROM public.admin_users WHERE role = 'owner' ORDER BY created_at LIMIT 1)
 WHERE c.owner_user_id IS NULL;

-- ---------------------------------------------------------------------
-- 3. AN INTERACTION KNOWS WHO WROTE IT
--
-- `author` was free text. Free text cannot be filtered on reliably, and
-- "who has actually been working this account" is a question that gets
-- asked the first time a commission figure looks wrong.
-- ---------------------------------------------------------------------
ALTER TABLE public.crm_interactions
    ADD COLUMN IF NOT EXISTS author_user_id UUID REFERENCES public.admin_users (user_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_crm_interactions_author
    ON public.crm_interactions (author_user_id, occurred_at DESC);

ALTER TABLE public.crm_tasks
    ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.admin_users (user_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS created_by  UUID REFERENCES public.admin_users (user_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_crm_tasks_assigned
    ON public.crm_tasks (assigned_to, due_at) WHERE status = 'open';

-- The timeline gains the kinds the lifecycle needs to record.
ALTER TABLE public.crm_interactions
    DROP CONSTRAINT IF EXISTS crm_interactions_kind_check;
ALTER TABLE public.crm_interactions
    ADD CONSTRAINT crm_interactions_kind_check CHECK (kind IN (
        'capture', 'scan', 'note', 'email_sent', 'email_received',
        'email_opened', 'email_clicked', 'call', 'meeting', 'demo',
        'stage_change', 'task_created', 'task_done', 'rescan',
        'owner_change', 'deal_created', 'deal_won', 'deal_lost',
        'registration_filed', 'registration_decided'
    ));

-- ---------------------------------------------------------------------
-- 4. DEAL REGISTRATIONS
--
-- Attribution rule three: a named account, registered in writing before
-- first contact, closed within 120 days. It is the only one of the three
-- rules that involves a human decision, so it is the only one that needs
-- a table — the other two are facts read off a checkout.
--
-- Two clocks run from the moment it is filed, and they are different
-- lengths on purpose:
--
--   5 business days   the window in which the company may decline it
--                     because the account is already in progress.
--   120 days          the window in which it must close to pay anything.
--
-- The five-day clock is stored as a resolved timestamp rather than
-- computed on read, because "five business days" depends on a calendar
-- and a calendar changes. What was true when it was filed stays true.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_deal_registrations (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id         UUID REFERENCES public.crm_accounts (id) ON DELETE SET NULL,
    account_name       TEXT NOT NULL,
    account_domain     TEXT,

    requested_by       UUID NOT NULL REFERENCES public.admin_users (user_id) ON DELETE CASCADE,
    requested_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    rationale          TEXT,

    status             TEXT NOT NULL DEFAULT 'pending',

    decline_deadline_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at          TIMESTAMP WITH TIME ZONE NOT NULL,

    decided_by         UUID REFERENCES public.admin_users (user_id) ON DELETE SET NULL,
    decided_at         TIMESTAMP WITH TIME ZONE,
    decision_reason    TEXT,

    created_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT crm_deal_registrations_status_check
        CHECK (status IN ('pending', 'approved', 'declined', 'expired', 'converted'))
);

COMMENT ON TABLE public.crm_deal_registrations IS
    'Attribution rule three: a named account claimed in writing before first contact. The only one of the three rules involving a human decision, which is why it is the only one with a table.';
COMMENT ON COLUMN public.crm_deal_registrations.decline_deadline_at IS
    'Resolved to a timestamp when filed rather than computed on read. "Five business days" depends on a calendar, and the calendar that applied is the one in force on the day it was filed.';

CREATE INDEX IF NOT EXISTS idx_crm_registrations_pending
    ON public.crm_deal_registrations (status, decline_deadline_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_crm_registrations_requester
    ON public.crm_deal_registrations (requested_by, requested_at DESC);

-- One live claim per account. A second pending registration on the same
-- domain is the dispute this table exists to prevent, so the database
-- refuses it rather than letting two people both believe they have it.
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_registrations_one_live
    ON public.crm_deal_registrations (lower(account_domain))
    WHERE account_domain IS NOT NULL AND status IN ('pending', 'approved');

-- ---------------------------------------------------------------------
-- 5. DEALS
--
-- What might be worth money, and what rule says whose it is.
--
-- Money is stored in integer cents. A NUMERIC would also be correct;
-- a float would not, and cents is the shape the payment processor already
-- speaks, so there is no conversion to get wrong at the boundary.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_deals (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id         UUID NOT NULL REFERENCES public.crm_accounts (id) ON DELETE CASCADE,
    primary_contact_id UUID REFERENCES public.crm_contacts (id) ON DELETE SET NULL,

    name               TEXT NOT NULL,
    motion             TEXT NOT NULL DEFAULT 'enterprise',
    stage              TEXT NOT NULL DEFAULT 'opportunity',

    -- What it is expected to be worth. Expected, because a deal's value
    -- before it closes is a forecast and should never be confused with
    -- the collected cash the ledger actually pays on.
    amount_cents       BIGINT NOT NULL DEFAULT 0,
    mrr_cents          BIGINT NOT NULL DEFAULT 0,
    currency           TEXT NOT NULL DEFAULT 'USD',
    billing_period     TEXT NOT NULL DEFAULT 'monthly',
    plan_tier          TEXT,
    seats              INTEGER,

    expected_close_on  DATE,
    closed_at          TIMESTAMP WITH TIME ZONE,
    lost_reason        TEXT,

    -- Credit. Both nullable: a deal that nobody at the company sourced is
    -- a real thing (it walked in), and a deal not yet closed has no closer.
    sourced_by         UUID REFERENCES public.admin_users (user_id) ON DELETE SET NULL,
    closed_by          UUID REFERENCES public.admin_users (user_id) ON DELETE SET NULL,
    owner_user_id      UUID REFERENCES public.admin_users (user_id) ON DELETE SET NULL,

    -- Attribution: which rule fired, what it matched on, and when it was
    -- settled. Once attribution_locked_at is set the rule is history and
    -- the ledger stops re-deriving it.
    attribution_rule      TEXT NOT NULL DEFAULT 'unattributed',
    attribution_ref       TEXT,
    attribution_note      TEXT,
    attribution_locked_at TIMESTAMP WITH TIME ZONE,
    registration_id       UUID REFERENCES public.crm_deal_registrations (id) ON DELETE SET NULL,

    -- The evidence each rule reads.
    promo_code         TEXT,
    utm_source         TEXT,
    utm_medium         TEXT,
    utm_campaign       TEXT,

    -- The customer this became, over in the product's own database. A
    -- reference, never a copy: collections are reconciled against the
    -- payment processor and nothing here is authoritative about money.
    external_customer_ref TEXT,
    first_payment_at      TIMESTAMP WITH TIME ZONE,

    notes              TEXT,
    created_by         UUID REFERENCES public.admin_users (user_id) ON DELETE SET NULL,
    created_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT crm_deals_stage_check
        CHECK (stage IN ('opportunity', 'proposal', 'negotiation', 'won', 'lost')),
    CONSTRAINT crm_deals_motion_check
        CHECK (motion IN ('self_serve', 'enterprise')),
    CONSTRAINT crm_deals_billing_period_check
        CHECK (billing_period IN ('one_off', 'monthly', 'annual')),
    CONSTRAINT crm_deals_attribution_rule_check
        CHECK (attribution_rule IN ('promo_code', 'utm_link', 'registered_account', 'unattributed')),
    CONSTRAINT crm_deals_amounts_non_negative
        CHECK (amount_cents >= 0 AND mrr_cents >= 0),

    -- A won deal has a closer and a date. Without both, the ledger has
    -- nothing to key a collection month against, and a deal that pays
    -- nobody is worse than one that was never marked won.
    CONSTRAINT crm_deals_won_needs_close
        CHECK (stage <> 'won' OR (closed_at IS NOT NULL AND closed_by IS NOT NULL))
);

COMMENT ON TABLE public.crm_deals IS
    'What might be worth money, and what rule says whose it is. Amounts here are forecasts; the commission ledger pays on collected cash and never reads these.';
COMMENT ON COLUMN public.crm_deals.attribution_rule IS
    'First match governs, in this order: promo_code, utm_link, registered_account. Anything else is unattributed and pays nothing.';
COMMENT ON COLUMN public.crm_deals.attribution_locked_at IS
    'When attribution was settled. After this the rule is history — the ledger reads it rather than re-deriving it, so a UTM column edited later cannot silently move money.';
COMMENT ON COLUMN public.crm_deals.external_customer_ref IS
    'The customer over in the product database. A reference, never a copy. Nothing in this schema is authoritative about money.';

CREATE INDEX IF NOT EXISTS idx_crm_deals_account   ON public.crm_deals (account_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_stage     ON public.crm_deals (stage, expected_close_on);
CREATE INDEX IF NOT EXISTS idx_crm_deals_closed_by ON public.crm_deals (closed_by) WHERE stage = 'won';
CREATE INDEX IF NOT EXISTS idx_crm_deals_sourced   ON public.crm_deals (sourced_by);
CREATE INDEX IF NOT EXISTS idx_crm_deals_customer  ON public.crm_deals (external_customer_ref) WHERE external_customer_ref IS NOT NULL;

-- ---------------------------------------------------------------------
-- 6. TOUCH TRIGGERS
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_crm_accounts_touch ON public.crm_accounts;
CREATE TRIGGER trg_crm_accounts_touch BEFORE UPDATE ON public.crm_accounts
    FOR EACH ROW EXECUTE FUNCTION public.crm_touch_updated_at();

DROP TRIGGER IF EXISTS trg_crm_deals_touch ON public.crm_deals;
CREATE TRIGGER trg_crm_deals_touch BEFORE UPDATE ON public.crm_deals
    FOR EACH ROW EXECUTE FUNCTION public.crm_touch_updated_at();

DROP TRIGGER IF EXISTS trg_crm_registrations_touch ON public.crm_deal_registrations;
CREATE TRIGGER trg_crm_registrations_touch BEFORE UPDATE ON public.crm_deal_registrations
    FOR EACH ROW EXECUTE FUNCTION public.crm_touch_updated_at();

-- ---------------------------------------------------------------------
-- 7. SOURCED_BY IS WRITE ONCE
--
-- The single most valuable column in this schema and the easiest one to
-- destroy by accident: an UPDATE that carries the whole row back, with
-- sourced_by read from a stale copy, silently reassigns who found the
-- lead. The trigger refuses to move it once it is set. An owner clearing
-- it deliberately still can, by setting it to NULL first.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.crm_protect_sourced_by()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.sourced_by IS NOT NULL
       AND NEW.sourced_by IS DISTINCT FROM OLD.sourced_by
       AND NOT public.is_owner_or_admin()
    THEN
        RAISE EXCEPTION
            'sourced_by records who originated this lead and cannot be reassigned. Ask an owner.'
            USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_crm_contacts_protect_source ON public.crm_contacts;
CREATE TRIGGER trg_crm_contacts_protect_source BEFORE UPDATE ON public.crm_contacts
    FOR EACH ROW EXECUTE FUNCTION public.crm_protect_sourced_by();

DROP TRIGGER IF EXISTS trg_crm_deals_protect_source ON public.crm_deals;
CREATE TRIGGER trg_crm_deals_protect_source BEFORE UPDATE ON public.crm_deals
    FOR EACH ROW EXECUTE FUNCTION public.crm_protect_sourced_by();

-- ---------------------------------------------------------------------
-- 8. WHAT THE LEDGER WILL BE ASKED TO JUSTIFY
--
-- Every won deal, the rule that attributed it, and whether anything
-- excludes it. This is the view somebody opens when a commission figure
-- is questioned, so it deliberately shows the deals that pay nothing
-- alongside the ones that do — a person asking "why was this not paid"
-- needs to find the row, not fail to find it.
-- ---------------------------------------------------------------------
-- `security_invoker` is set here as well as by the ALTER in
-- 20260817110000, and the repetition is the point: CREATE OR REPLACE VIEW
-- resets any option the statement does not name, so the next person to
-- add a column to this view would silently hand it back the definer's
-- rights and let it read straight past the policies on crm_deals.
CREATE OR REPLACE VIEW public.crm_attribution_audit
WITH (security_invoker = on) AS
SELECT
    d.id                     AS deal_id,
    d.name                   AS deal_name,
    d.stage,
    d.closed_at,
    d.amount_cents,
    d.mrr_cents,
    d.currency,
    a.id                     AS account_id,
    a.name                   AS account_name,
    a.domain                 AS account_domain,
    d.attribution_rule,
    d.attribution_ref,
    d.attribution_locked_at,
    d.sourced_by,
    d.closed_by,
    d.first_payment_at,
    -- The single question the ledger asks of every deal.
    CASE
        WHEN a.carve_out IS NOT NULL          THEN 'carve_out'
        WHEN a.is_comped                      THEN 'comped'
        WHEN a.is_company_managed             THEN 'company_managed'
        WHEN d.attribution_rule = 'unattributed' THEN 'unattributed'
        WHEN d.stage <> 'won'                 THEN 'not_won'
        ELSE NULL
    END                      AS exclusion_reason
FROM public.crm_deals d
JOIN public.crm_accounts a ON a.id = d.account_id;

COMMENT ON VIEW public.crm_attribution_audit IS
    'Every deal with the rule that attributed it and the reason it does or does not pay. Shows non-paying deals on purpose: somebody asking "why was this not paid" needs to find the row.';
