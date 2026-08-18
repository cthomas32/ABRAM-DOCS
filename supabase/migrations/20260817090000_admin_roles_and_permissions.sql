-- =====================================================================
-- ADMIN ROLES AND PERMISSIONS
--
-- Until this migration, every table in this database was readable and
-- writable by anybody holding a signed-in session. The policies said
--
--     FOR ALL TO authenticated USING (true) WITH CHECK (true)
--
-- which is not an access rule, it is the absence of one. It was correct
-- while exactly one person had a login. It stops being correct the moment
-- a second person does, and the second person is arriving with a written
-- agreement that says they never touch the admin console, never touch
-- Stripe and never touch the database.
--
-- So the rule has to be real, and it has to be enforced here rather than
-- in the interface. A hidden nav item is a decoration; a signed-in browser
-- can still query any table this database will answer for. Everything the
-- console hides, the policies below refuse.
--
-- Tables:    admin_users, growth_partner_terms
-- Functions: current_admin_role, current_admin_id, is_owner_or_admin,
--            has_console_access, is_growth_member, growth_sees_all_contacts
--
-- IMPORTANT — read before changing a policy in here.
--
-- Every existing auth user is backfilled as `owner` at the bottom of this
-- file. That is deliberate and it is the only thing standing between this
-- migration and locking the founder out of his own console. If you add a
-- role check to a table, check that the backfill still covers whoever
-- needs it. The recovery path if it ever goes wrong is a service-role
-- write to admin_users, which bypasses all of this.
--
-- BEFORE RUNNING THIS ON PRODUCTION — check auth.users first.
--
--     SELECT id, email, created_at, last_sign_in_at
--       FROM auth.users
--      ORDER BY created_at;
--
-- Every row that query returns is handed `owner` by the backfill in
-- section 10, and owner is the role that can read the commission ledger,
-- change anybody's role and send a broadcast. One row is expected. If a
-- second appears, a test account or a stale invite from development, it
-- is not a reason to change the backfill: delete or demote that account
-- in the same session and then run this. Narrowing the backfill instead
-- is how the founder ends up locked out of his own console.
--
-- Then run scripts/audit-open-policies.sql before and after the whole
-- 2026-08-17 set. See supabase/README.md.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. WHO MAY SIGN IN, AND AS WHAT
--
-- One row per person with a login. A auth.users row with no row here is
-- authenticated but unauthorized: it can hold a session and read nothing,
-- which is the correct posture for an account created by mistake.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
    email        TEXT NOT NULL,
    full_name    TEXT,

    -- The same person as the blog byline and the contact card, when there
    -- is one. Nullable because a login can exist before the public record
    -- does, and removing a team member must never revoke a session.
    member_id    UUID REFERENCES public.team_members (id) ON DELETE SET NULL,

    role         TEXT NOT NULL DEFAULT 'viewer',

    -- Where a growth partner is in their own progression. Null for
    -- everybody else. This drives two unrelated things — how much of the
    -- pipeline they can see, and what a closed deal pays — which is why
    -- it lives on the person rather than being inferred from either.
    growth_stage TEXT,

    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    invited_at   TIMESTAMP WITH TIME ZONE,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    notes        TEXT,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT admin_users_role_check
        CHECK (role IN ('owner', 'admin', 'growth', 'contributor', 'viewer')),

    CONSTRAINT admin_users_growth_stage_check
        CHECK (growth_stage IS NULL OR growth_stage IN ('advisor', 'head_of_growth', 'employee')),

    -- A growth stage on a non-growth role is meaningless and would make
    -- the commission rate lookup ambiguous. Refuse it at the door.
    CONSTRAINT admin_users_growth_stage_requires_growth_role
        CHECK (growth_stage IS NULL OR role = 'growth')
);

COMMENT ON TABLE public.admin_users IS
    'One row per person with a login, and the single place a role is written down. An auth.users row with no row here can hold a session and read nothing.';

COMMENT ON COLUMN public.admin_users.role IS
    'owner: everything, including handing out roles. admin: everything except roles. growth: the Growth workspace only, never the admin console. contributor: content surfaces only. viewer: read only.';

COMMENT ON COLUMN public.admin_users.growth_stage IS
    'advisor: sees only the accounts assigned to them. head_of_growth: sees the whole pipeline, edits their own. employee: post-conversion, full pipeline.';

CREATE INDEX IF NOT EXISTS idx_admin_users_role   ON public.admin_users (role) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_admin_users_member ON public.admin_users (member_id);

-- ---------------------------------------------------------------------
-- 2. WHAT A CLOSE IS WORTH, AND WHEN IT WAS WORTH THAT
--
-- Commission rates move when a partner advances a stage. A rate stored
-- only on the person answers "what do they earn now" and quietly gets the
-- wrong answer for every month already paid, because the row it reads was
-- overwritten by the promotion.
--
-- So rates are a history rather than a value. One row per stage per
-- person, with the window it applied to. A commission entry snapshots the
-- rate it used and points back at the row it came from, which means a
-- statement from four months ago still recomputes to the figure that was
-- actually paid.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.growth_partner_terms (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES public.admin_users (user_id) ON DELETE CASCADE,
    stage          TEXT NOT NULL,

    -- Stored as fractions, not percents. 0.3000 is thirty percent. Percent
    -- columns invite a division by a hundred that is either done twice or
    -- not at all, and both mistakes look plausible in a spreadsheet.
    close_rate     NUMERIC(6, 4) NOT NULL,
    source_rate    NUMERIC(6, 4) NOT NULL,

    -- Collections keep paying for this many months after a customer's
    -- first payment, then stop permanently.
    tail_months    INTEGER NOT NULL DEFAULT 12,

    -- A refund, chargeback or cancellation inside this window reverses the
    -- commission already accrued on it.
    clawback_days  INTEGER NOT NULL DEFAULT 90,

    effective_from DATE NOT NULL,
    effective_to   DATE,
    note           TEXT,
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT growth_partner_terms_stage_check
        CHECK (stage IN ('advisor', 'head_of_growth', 'employee')),
    CONSTRAINT growth_partner_terms_rate_range
        CHECK (close_rate >= 0 AND close_rate <= 1 AND source_rate >= 0 AND source_rate <= 1),
    CONSTRAINT growth_partner_terms_window
        CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

COMMENT ON TABLE public.growth_partner_terms IS
    'Commission rates as a history rather than a value. A promotion closes one row and opens another; a paid month keeps recomputing to the figure that was actually paid.';

COMMENT ON COLUMN public.growth_partner_terms.close_rate IS
    'Applies when the partner both sourced the account and ran it to completed checkout. Stored as a fraction: 0.3000 is thirty percent.';

COMMENT ON COLUMN public.growth_partner_terms.source_rate IS
    'Applies when the partner originated the account and somebody else closed it.';

-- One open-ended row per person. A second would make "the current rate"
-- a question with two answers.
CREATE UNIQUE INDEX IF NOT EXISTS idx_growth_terms_one_open
    ON public.growth_partner_terms (user_id)
    WHERE effective_to IS NULL;

CREATE INDEX IF NOT EXISTS idx_growth_terms_user
    ON public.growth_partner_terms (user_id, effective_from DESC);

-- ---------------------------------------------------------------------
-- 3. THE PREDICATES EVERY POLICY IS BUILT FROM
--
-- All of these are SECURITY DEFINER for one reason: they read
-- admin_users, and admin_users has RLS on it. A policy that called a
-- plain function here would recurse into the policy it is evaluating.
-- Running as the table owner steps outside RLS and terminates.
--
-- All of them are STABLE rather than VOLATILE so the planner evaluates
-- them once per statement instead of once per row. On a pipeline query
-- that is the difference between one lookup and one lookup per contact.
--
-- All of them set search_path explicitly, because a SECURITY DEFINER
-- function without one is a privilege escalation waiting for somebody to
-- create a table that shadows a name it uses.
-- ---------------------------------------------------------------------

/**
 * The signed-in caller's role, or NULL when they have no row or are
 * deactivated. NULL is the important return: every policy below is
 * written so that NULL fails closed.
 */
CREATE OR REPLACE FUNCTION public.current_admin_role()
RETURNS TEXT AS $$
    SELECT role
      FROM public.admin_users
     WHERE user_id = auth.uid()
       AND is_active
     LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

/** The caller's growth stage, or NULL if they are not a growth partner. */
CREATE OR REPLACE FUNCTION public.current_growth_stage()
RETURNS TEXT AS $$
    SELECT growth_stage
      FROM public.admin_users
     WHERE user_id = auth.uid()
       AND is_active
     LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

/** Full run of the place. Content, email, settings, roles. */
CREATE OR REPLACE FUNCTION public.is_owner_or_admin()
RETURNS BOOLEAN AS $$
    SELECT public.current_admin_role() IN ('owner', 'admin');
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

/** Only an owner hands out roles. An admin runs the site; an owner runs who runs it. */
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
    SELECT public.current_admin_role() = 'owner';
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

/** A growth partner, at any stage. */
CREATE OR REPLACE FUNCTION public.is_growth_member()
RETURNS BOOLEAN AS $$
    SELECT public.current_admin_role() = 'growth';
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

/**
 * Anybody with a live login. Distinct from `authenticated`, which only
 * means a token parsed. This is the floor every policy sits on.
 */
CREATE OR REPLACE FUNCTION public.has_console_access()
RETURNS BOOLEAN AS $$
    SELECT public.current_admin_role() IS NOT NULL;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

/**
 * Whether the caller sees the whole pipeline or only what is theirs.
 *
 * The Growth Advisor stage is contractually "her accounts only, read and
 * write". Head of Growth is "full pipeline". That single sentence is this
 * function, and it is the only place the distinction is expressed, so
 * advancing somebody is one column change rather than an audit.
 */
CREATE OR REPLACE FUNCTION public.growth_sees_all_contacts()
RETURNS BOOLEAN AS $$
    SELECT public.current_growth_stage() IN ('head_of_growth', 'employee');
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- These are called from inside policies evaluated for signed-in users, so
-- the authenticated role has to be able to execute them. They read one
-- row of admin_users and return a scalar; there is nothing to leak.
GRANT EXECUTE ON FUNCTION public.current_admin_role()        TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_growth_stage()      TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_owner_or_admin()         TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_owner()                  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_growth_member()          TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_console_access()        TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.growth_sees_all_contacts()  TO authenticated, service_role;

-- Nobody anonymous has any business asking any of these.
REVOKE EXECUTE ON FUNCTION public.current_admin_role()       FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.current_growth_stage()     FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_owner_or_admin()        FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_owner()                 FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_growth_member()         FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_console_access()       FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.growth_sees_all_contacts() FROM anon, public;

-- ---------------------------------------------------------------------
-- 4. TOUCH TRIGGERS
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_admin_users_touch ON public.admin_users;
CREATE TRIGGER trg_admin_users_touch BEFORE UPDATE ON public.admin_users
    FOR EACH ROW EXECUTE FUNCTION public.crm_touch_updated_at();

-- ---------------------------------------------------------------------
-- 5. GUARD: A PARTNER MAY NOT PROMOTE THEMSELVES
--
-- The policy below lets a person update their own admin_users row, which
-- is what makes "set your own display name" work without a round trip
-- through the owner. That same policy would let them set role='owner'.
--
-- Splitting it into a column-level grant is not available to RLS, so the
-- refusal happens in a trigger instead. It fires for everybody and lets
-- the service role and an owner through, which keeps the recovery path
-- open.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_users_guard_privilege_change()
RETURNS TRIGGER AS $$
BEGIN
    -- The service role has no auth.uid() and is how a locked-out console
    -- gets fixed. It is never subject to this.
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    IF (NEW.role IS DISTINCT FROM OLD.role
        OR NEW.growth_stage IS DISTINCT FROM OLD.growth_stage
        OR NEW.is_active IS DISTINCT FROM OLD.is_active)
       AND NOT public.is_owner()
    THEN
        RAISE EXCEPTION
            'Only an owner may change a role, a growth stage or whether an account is active.'
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_admin_users_guard ON public.admin_users;
CREATE TRIGGER trg_admin_users_guard BEFORE UPDATE ON public.admin_users
    FOR EACH ROW EXECUTE FUNCTION public.admin_users_guard_privilege_change();

-- ---------------------------------------------------------------------
-- 6. RLS ON THE ROLE TABLES THEMSELVES
-- ---------------------------------------------------------------------
ALTER TABLE public.admin_users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_partner_terms ENABLE ROW LEVEL SECURITY;

-- Everyone may see the colleagues they work alongside: a pipeline that
-- says "assigned to 8f3a-…" instead of a name is unusable. Only the
-- non-sensitive columns matter here and the table holds no secrets, so
-- the read is open to anybody with a live login rather than sliced.
DROP POLICY IF EXISTS "Console users read the team" ON public.admin_users;
CREATE POLICY "Console users read the team"
    ON public.admin_users FOR SELECT TO authenticated
    USING (public.has_console_access());

DROP POLICY IF EXISTS "Owners manage logins" ON public.admin_users;
CREATE POLICY "Owners manage logins"
    ON public.admin_users FOR ALL TO authenticated
    USING (public.is_owner())
    WITH CHECK (public.is_owner());

-- Your own row, for a display name. The trigger above is what stops this
-- from also being a promotion.
DROP POLICY IF EXISTS "Users update their own profile" ON public.admin_users;
CREATE POLICY "Users update their own profile"
    ON public.admin_users FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- A partner may read their own terms — they are entitled to know what
-- they are being paid — and may never write them.
DROP POLICY IF EXISTS "Partners read their own terms" ON public.growth_partner_terms;
CREATE POLICY "Partners read their own terms"
    ON public.growth_partner_terms FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.is_owner_or_admin());

DROP POLICY IF EXISTS "Owners manage terms" ON public.growth_partner_terms;
CREATE POLICY "Owners manage terms"
    ON public.growth_partner_terms FOR ALL TO authenticated
    USING (public.is_owner())
    WITH CHECK (public.is_owner());

-- ---------------------------------------------------------------------
-- 7. BACKFILL
--
-- Everybody who could already sign in had unrestricted access to every
-- table, so `owner` is not a promotion, it is a description of what they
-- already had. Anything narrower here would revoke access as a side
-- effect of tightening it, which is exactly the failure this migration
-- exists to prevent.
--
-- ON CONFLICT DO NOTHING so re-running is safe and so a role set by hand
-- after the fact is never stamped back to owner.
-- ---------------------------------------------------------------------
INSERT INTO public.admin_users (user_id, email, full_name, role)
SELECT
    u.id,
    COALESCE(u.email, 'unknown'),
    COALESCE(u.raw_user_meta_data ->> 'full_name', u.email),
    'owner'
FROM auth.users u
ON CONFLICT (user_id) DO NOTHING;
