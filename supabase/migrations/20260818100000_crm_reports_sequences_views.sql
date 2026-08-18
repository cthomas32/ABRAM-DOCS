-- =====================================================================
-- P1: REPORTING, SEQUENCES, SAVED VIEWS AND A LEAD SCORE
--
-- Four things the console could not do, and one shape they share: every
-- one of them is a *read across everybody*, which is exactly the read row
-- level security spends its time refusing.
--
-- So the reporting functions here are SECURITY DEFINER and each one opens
-- with the same guard. An owner or an admin may read the whole console. A
-- growth partner may read it only once they see the whole pipeline, which
-- is the Head of Growth stage and above, because a partner who cannot see
-- a rival's contact must not be handed a rollup that counts it.
--
-- The three new tables are the opposite: ordinary rows behind ordinary
-- policies, growth sees its own, owner sees all, nothing is ever
-- `USING (true)`.
--
-- Every statement is guarded with to_regclass or IF NOT EXISTS, so this
-- file is safe against a database where the CRM tables were made by hand.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. WHO MAY READ A ROLLUP
--
-- One function, so the six reporting functions below cannot drift into
-- six different answers to the same question.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_read_reports()
RETURNS BOOLEAN AS $$
    SELECT public.is_owner_or_admin()
        OR (public.is_growth_member() AND public.growth_sees_all_contacts());
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_catalog;

GRANT EXECUTE ON FUNCTION public.can_read_reports() TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.can_read_reports() FROM anon, public;

COMMENT ON FUNCTION public.can_read_reports() IS
    'Owner, admin, or a growth partner who already sees the whole pipeline. A partner scoped to their own accounts must not be handed a rollup that counts everybody else.';

-- ---------------------------------------------------------------------
-- 1. SEQUENCES
--
-- A sequence is an ordered list of steps with day offsets. Enrolling
-- somebody turns those steps into follow ups in the queue, dated from the
-- day of enrolment, and that is the whole mechanism. There is no
-- scheduler, no background worker and no auto-advance, because a job that
-- silently emails people is the one part of this a person must not be
-- able to start by accident.
--
-- An email step becomes a task named "Send: <step>" which opens the
-- one-to-one composer already filled in. The send stays a human pressing
-- send, which is also the only reading of "Resend, send only" that the
-- partnership terms support.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_sequences (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    description   TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    owner_user_id UUID REFERENCES public.admin_users (user_id) ON DELETE SET NULL,
    created_by    UUID REFERENCES public.admin_users (user_id) ON DELETE SET NULL,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.crm_sequences IS
    'An ordered set of follow ups with day offsets. Enrolling a contact writes crm_tasks; nothing here sends anything on its own.';

CREATE TABLE IF NOT EXISTS public.crm_sequence_steps (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_id  UUID NOT NULL REFERENCES public.crm_sequences (id) ON DELETE CASCADE,
    position     INTEGER NOT NULL,
    kind         TEXT NOT NULL DEFAULT 'task',
    title        TEXT NOT NULL,
    details      TEXT,
    -- The key of the email template this step drafts from, when it is an
    -- email step. Deliberately not a foreign key: templates are keyed by
    -- a string this build ships with, and a renamed key should degrade to
    -- an empty composer rather than refuse the enrolment.
    template_key TEXT,
    day_offset   INTEGER NOT NULL DEFAULT 0,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT crm_sequence_steps_kind_check CHECK (kind IN ('email', 'task')),
    CONSTRAINT crm_sequence_steps_offset_check CHECK (day_offset >= 0 AND day_offset <= 365),
    CONSTRAINT crm_sequence_steps_position_check CHECK (position >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_sequence_steps_order
    ON public.crm_sequence_steps (sequence_id, position);

CREATE TABLE IF NOT EXISTS public.crm_sequence_enrollments (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_id   UUID NOT NULL REFERENCES public.crm_sequences (id) ON DELETE CASCADE,
    contact_id    UUID NOT NULL REFERENCES public.crm_contacts (id) ON DELETE CASCADE,
    enrolled_by   UUID REFERENCES public.admin_users (user_id) ON DELETE SET NULL,
    status        TEXT NOT NULL DEFAULT 'active',
    started_on    DATE NOT NULL DEFAULT (timezone('utc'::text, now()))::date,
    tasks_created INTEGER NOT NULL DEFAULT 0,
    cancelled_at  TIMESTAMP WITH TIME ZONE,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT crm_sequence_enrollments_status_check
        CHECK (status IN ('active', 'completed', 'cancelled'))
);

-- One live enrolment per person per sequence. Enrolling somebody twice is
-- how a person receives the same follow up twice, so it is refused rather
-- than deduped afterwards.
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_sequence_enrollments_live
    ON public.crm_sequence_enrollments (sequence_id, contact_id)
    WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_crm_sequence_enrollments_contact
    ON public.crm_sequence_enrollments (contact_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_crm_sequences_touch ON public.crm_sequences;
CREATE TRIGGER trg_crm_sequences_touch BEFORE UPDATE ON public.crm_sequences
    FOR EACH ROW EXECUTE FUNCTION public.crm_touch_updated_at();

-- The steps and the enrolments are reachable only through their sequence,
-- so their visibility is the sequence's visibility. SECURITY DEFINER
-- because crm_sequences is itself behind RLS: without it the check that
-- decides whether a partner may see their own sequence could not read it.
CREATE OR REPLACE FUNCTION public.crm_can_see_sequence(p_sequence_id UUID)
RETURNS BOOLEAN AS $$
    SELECT CASE
        WHEN p_sequence_id IS NULL THEN FALSE
        WHEN public.is_owner_or_admin() THEN TRUE
        WHEN NOT public.is_growth_member() THEN FALSE
        ELSE EXISTS (
            SELECT 1 FROM public.crm_sequences s
             WHERE s.id = p_sequence_id
               AND s.owner_user_id = auth.uid()
        )
    END;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_catalog;

GRANT EXECUTE ON FUNCTION public.crm_can_see_sequence(UUID) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.crm_can_see_sequence(UUID) FROM anon, public;

-- ---------------------------------------------------------------------
-- 2. SAVED VIEWS
--
-- A list is a filter somebody named. Stored as jsonb rather than as
-- columns because the filter set on the people screen has grown twice
-- already, and a saved view that silently drops a filter it does not have
-- a column for is worse than one that stores a shape it does not
-- understand.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_saved_views (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    scope         TEXT NOT NULL DEFAULT 'contacts',
    filter        JSONB NOT NULL DEFAULT '{}'::jsonb,
    owner_user_id UUID NOT NULL REFERENCES public.admin_users (user_id) ON DELETE CASCADE,
    -- Shared with the rest of the console. Read only for everybody except
    -- the person who made it, so a shared list cannot be edited out from
    -- under them.
    is_shared     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT crm_saved_views_scope_check CHECK (scope IN ('contacts', 'deals', 'tasks')),
    UNIQUE (owner_user_id, scope, name)
);

COMMENT ON COLUMN public.crm_saved_views.filter IS
    'The filter set as the people screen writes it. jsonb rather than columns because the filter set has grown twice already.';

CREATE INDEX IF NOT EXISTS idx_crm_saved_views_owner
    ON public.crm_saved_views (owner_user_id, scope, name);

DROP TRIGGER IF EXISTS trg_crm_saved_views_touch ON public.crm_saved_views;
CREATE TRIGGER trg_crm_saved_views_touch BEFORE UPDATE ON public.crm_saved_views
    FOR EACH ROW EXECUTE FUNCTION public.crm_touch_updated_at();

-- ---------------------------------------------------------------------
-- 3. LEAD SCORE
--
-- Visible arithmetic rather than a model. Ava has to be able to predict
-- it, and a score she can predict is worth more than a better one she
-- cannot argue with.
--
-- The function is pure and takes its inputs, so it can be reasoned about
-- and tested on its own. The view is what gathers them.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.crm_lead_score(
    p_lifecycle    TEXT,
    p_sources      TEXT[],
    p_has_account  BOOLEAN,
    p_job_title    TEXT,
    p_opens        INTEGER,
    p_clicks       INTEGER,
    p_replies      INTEGER,
    p_meetings     INTEGER
)
RETURNS INTEGER AS $$
    SELECT GREATEST(0, LEAST(100,
        -- How far along the person already is.
        CASE COALESCE(p_lifecycle, 'lead')
            WHEN 'subscriber' THEN 5
            WHEN 'lead'       THEN 10
            WHEN 'mql'        THEN 25
            WHEN 'sql'        THEN 40
            WHEN 'customer'   THEN 50
            WHEN 'churned'    THEN 0
            ELSE 10
        END
        -- Reached us more than one way. Capped, because a person with six
        -- sources is not six times the lead.
        + LEAST(10, 5 * GREATEST(0, COALESCE(cardinality(p_sources), 0) - 1))
        -- Sources that mean somebody did something deliberate.
        + CASE WHEN p_sources && ARRAY['event', 'promo', 'app_signup']::TEXT[] THEN 5 ELSE 0 END
        -- Rolls up to a company we know.
        + CASE WHEN COALESCE(p_has_account, FALSE) THEN 10 ELSE 0 END
        -- Seniority, read off the title they gave us.
        + CASE
            WHEN p_job_title IS NULL THEN 0
            WHEN p_job_title ~* '(chief|founder|owner|president|ceo|cto|coo|cfo|head of|vp|vice president|director|partner)' THEN 10
            WHEN p_job_title ~* '(manager|lead|producer)' THEN 5
            ELSE 0
          END
        -- What they have actually done, recently, capped so engagement
        -- cannot swamp everything the person is.
        + LEAST(10, 2 * GREATEST(0, COALESCE(p_opens, 0)))
        + LEAST(15, 5 * GREATEST(0, COALESCE(p_clicks, 0)))
        + LEAST(15, 5 * GREATEST(0, COALESCE(p_replies, 0)))
        + LEAST(15, 5 * GREATEST(0, COALESCE(p_meetings, 0)))
    ));
$$ LANGUAGE sql IMMUTABLE;

GRANT EXECUTE ON FUNCTION public.crm_lead_score(TEXT, TEXT[], BOOLEAN, TEXT, INTEGER, INTEGER, INTEGER, INTEGER)
    TO authenticated, service_role;

COMMENT ON FUNCTION public.crm_lead_score(TEXT, TEXT[], BOOLEAN, TEXT, INTEGER, INTEGER, INTEGER, INTEGER) IS
    'Additive, clamped 0 to 100, deliberately predictable. Not a model. Engagement is counted over the last 30 days by the view that calls this.';

-- Engagement is counted over a window rather than for all time, so a
-- person who clicked once a year ago does not score like one who clicked
-- last week.
DROP VIEW IF EXISTS public.crm_contact_lead_scores;
CREATE VIEW public.crm_contact_lead_scores
WITH (security_invoker = on) AS
WITH engagement AS (
    SELECT
        i.contact_id,
        COUNT(*) FILTER (WHERE i.kind = 'email_opened')                     AS opens,
        COUNT(*) FILTER (WHERE i.kind = 'email_clicked')                    AS clicks,
        COUNT(*) FILTER (WHERE i.kind = 'email_received')                   AS replies,
        COUNT(*) FILTER (WHERE i.kind IN ('meeting', 'demo', 'call'))       AS meetings
      FROM public.crm_interactions i
     WHERE i.contact_id IS NOT NULL
       AND i.occurred_at >= timezone('utc'::text, now()) - INTERVAL '30 days'
     GROUP BY i.contact_id
)
SELECT
    c.id AS contact_id,
    public.crm_lead_score(
        c.lifecycle_stage,
        c.sources,
        c.account_id IS NOT NULL,
        c.job_title,
        COALESCE(e.opens, 0)::INTEGER,
        COALESCE(e.clicks, 0)::INTEGER,
        COALESCE(e.replies, 0)::INTEGER,
        COALESCE(e.meetings, 0)::INTEGER
    ) AS score,
    COALESCE(e.opens, 0)    AS opens_30d,
    COALESCE(e.clicks, 0)   AS clicks_30d,
    COALESCE(e.replies, 0)  AS replies_30d,
    COALESCE(e.meetings, 0) AS meetings_30d
FROM public.crm_contacts c
LEFT JOIN engagement e ON e.contact_id = c.id
WHERE NOT c.archived;

COMMENT ON VIEW public.crm_contact_lead_scores IS
    'One score per live contact. security_invoker, so the reader sees scores only for the people row level security already lets them see.';

GRANT SELECT ON public.crm_contact_lead_scores TO authenticated, service_role;
REVOKE ALL ON public.crm_contact_lead_scores FROM anon;

-- ---------------------------------------------------------------------
-- 4. THE REPORTS
--
-- Six functions, one guard each. They return counts and sums and never a
-- row of somebody's record, which is what makes it safe to hand a Head of
-- Growth the whole company's numbers without handing her the rows behind
-- them.
--
-- Probability per stage is not here on purpose. The weighting lives in
-- src/lib/crm/constants.ts, where the rest of the stage vocabulary lives,
-- and these return the raw counts it multiplies.
-- ---------------------------------------------------------------------

-- Pipeline by stage: how many deals, and what they are forecast at.
CREATE OR REPLACE FUNCTION public.crm_report_pipeline()
RETURNS TABLE (
    stage        TEXT,
    deals        BIGINT,
    amount_cents BIGINT,
    mrr_cents    BIGINT
) AS $$
BEGIN
    IF NOT public.can_read_reports() THEN
        RAISE EXCEPTION 'Reporting is not available to your role.' USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT d.stage,
           COUNT(*)::BIGINT,
           COALESCE(SUM(d.amount_cents), 0)::BIGINT,
           COALESCE(SUM(d.mrr_cents), 0)::BIGINT
      FROM public.crm_deals d
     GROUP BY d.stage;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_catalog;

-- Open deals expected to close in a window, by stage. The caller weights.
CREATE OR REPLACE FUNCTION public.crm_report_forecast(p_from DATE, p_to DATE)
RETURNS TABLE (
    stage        TEXT,
    deals        BIGINT,
    amount_cents BIGINT,
    mrr_cents    BIGINT
) AS $$
BEGIN
    IF NOT public.can_read_reports() THEN
        RAISE EXCEPTION 'Reporting is not available to your role.' USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT d.stage,
           COUNT(*)::BIGINT,
           COALESCE(SUM(d.amount_cents), 0)::BIGINT,
           COALESCE(SUM(d.mrr_cents), 0)::BIGINT
      FROM public.crm_deals d
     WHERE d.stage <> 'lost'
       AND d.expected_close_on IS NOT NULL
       AND d.expected_close_on >= p_from
       AND d.expected_close_on <  p_to
     GROUP BY d.stage;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_catalog;

-- Sourced and closed, per person. Two different jobs and two columns,
-- because the commission agreement pays differently for each.
CREATE OR REPLACE FUNCTION public.crm_report_by_rep()
RETURNS TABLE (
    user_id              UUID,
    full_name            TEXT,
    email                TEXT,
    sourced_deals        BIGINT,
    sourced_won          BIGINT,
    sourced_won_cents    BIGINT,
    closed_won           BIGINT,
    closed_won_cents     BIGINT,
    attributed_mrr_cents BIGINT
) AS $$
BEGIN
    IF NOT public.can_read_reports() THEN
        RAISE EXCEPTION 'Reporting is not available to your role.' USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT u.user_id,
           u.full_name,
           u.email,
           COALESCE(s.total, 0)::BIGINT,
           COALESCE(s.won, 0)::BIGINT,
           COALESCE(s.won_cents, 0)::BIGINT,
           COALESCE(c.won, 0)::BIGINT,
           COALESCE(c.won_cents, 0)::BIGINT,
           COALESCE(m.attributed_mrr_cents, 0)::BIGINT
      FROM public.admin_users u
      LEFT JOIN (
          SELECT d.sourced_by AS uid,
                 COUNT(*) AS total,
                 COUNT(*) FILTER (WHERE d.stage = 'won') AS won,
                 COALESCE(SUM(d.amount_cents) FILTER (WHERE d.stage = 'won'), 0) AS won_cents
            FROM public.crm_deals d
           WHERE d.sourced_by IS NOT NULL
           GROUP BY d.sourced_by
      ) s ON s.uid = u.user_id
      LEFT JOIN (
          SELECT d.closed_by AS uid,
                 COUNT(*) FILTER (WHERE d.stage = 'won') AS won,
                 COALESCE(SUM(d.amount_cents) FILTER (WHERE d.stage = 'won'), 0) AS won_cents
            FROM public.crm_deals d
           WHERE d.closed_by IS NOT NULL
           GROUP BY d.closed_by
      ) c ON c.uid = u.user_id
      LEFT JOIN public.growth_attributed_mrr m ON m.user_id = u.user_id
     WHERE u.is_active
       AND (s.uid IS NOT NULL OR c.uid IS NOT NULL OR u.role IN ('owner', 'admin', 'growth'));
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_catalog;

-- What everybody actually did, by week. Read off the timeline, which is
-- why logging a call matters: an unlogged call is an unworked week here.
CREATE OR REPLACE FUNCTION public.crm_report_activity(p_weeks INTEGER DEFAULT 8)
RETURNS TABLE (
    user_id    UUID,
    full_name  TEXT,
    week_start DATE,
    kind       TEXT,
    events     BIGINT
) AS $$
DECLARE
    weeks INTEGER := LEAST(GREATEST(COALESCE(p_weeks, 8), 1), 52);
BEGIN
    IF NOT public.can_read_reports() THEN
        RAISE EXCEPTION 'Reporting is not available to your role.' USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT i.author_user_id,
           u.full_name,
           (date_trunc('week', i.occurred_at AT TIME ZONE 'UTC'))::DATE,
           i.kind,
           COUNT(*)::BIGINT
      FROM public.crm_interactions i
      LEFT JOIN public.admin_users u ON u.user_id = i.author_user_id
     WHERE i.author_user_id IS NOT NULL
       AND i.occurred_at >= date_trunc('week', timezone('utc'::text, now())) - (weeks || ' weeks')::INTERVAL
       AND i.kind IN ('call', 'meeting', 'demo', 'email_sent', 'note')
     GROUP BY i.author_user_id, u.full_name,
              (date_trunc('week', i.occurred_at AT TIME ZONE 'UTC'))::DATE, i.kind;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_catalog;

-- The person funnel: how many are at each rung.
CREATE OR REPLACE FUNCTION public.crm_report_lifecycle()
RETURNS TABLE (
    lifecycle_stage TEXT,
    people          BIGINT
) AS $$
BEGIN
    IF NOT public.can_read_reports() THEN
        RAISE EXCEPTION 'Reporting is not available to your role.' USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT c.lifecycle_stage, COUNT(*)::BIGINT
      FROM public.crm_contacts c
     WHERE NOT c.archived
     GROUP BY c.lifecycle_stage;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_catalog;

-- Owed and paid, across everybody. The partner's own version of this is
-- the earnings screen, which reads commission_statement under RLS.
CREATE OR REPLACE FUNCTION public.crm_report_commission()
RETURNS TABLE (
    user_id           UUID,
    full_name         TEXT,
    currency          TEXT,
    earned_cents      BIGINT,
    paid_cents        BIGINT,
    outstanding_cents BIGINT,
    months            BIGINT
) AS $$
BEGIN
    IF NOT public.is_owner_or_admin() THEN
        RAISE EXCEPTION 'Commission across everybody is an owner''s figure.' USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT s.user_id,
           u.full_name,
           s.currency,
           COALESCE(SUM(s.total_cents), 0)::BIGINT,
           COALESCE(SUM(s.paid_cents), 0)::BIGINT,
           COALESCE(SUM(s.outstanding_cents), 0)::BIGINT,
           COUNT(*)::BIGINT
      FROM public.commission_statement s
      LEFT JOIN public.admin_users u ON u.user_id = s.user_id
     GROUP BY s.user_id, u.full_name, s.currency;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_catalog;

DO $$
DECLARE
    fn TEXT;
BEGIN
    FOREACH fn IN ARRAY ARRAY[
        'public.crm_report_pipeline()',
        'public.crm_report_forecast(DATE, DATE)',
        'public.crm_report_by_rep()',
        'public.crm_report_activity(INTEGER)',
        'public.crm_report_lifecycle()',
        'public.crm_report_commission()'
    ]
    LOOP
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', fn);
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, public', fn);
    END LOOP;
END;
$$;

-- ---------------------------------------------------------------------
-- 5. POLICIES
--
-- `__apply_policy` is dropped at the end of 20260817120000, so this
-- migration carries its own copy of it, same body, and drops it again
-- when it is done.
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

ALTER TABLE public.crm_sequences             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_sequence_steps        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_sequence_enrollments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_saved_views           ENABLE ROW LEVEL SECURITY;

-- Sequences: a partner works their own, an owner works all of them.
SELECT public.__apply_policy('crm_sequences', 'Sequences are read by their owner', 'SELECT',
    'public.crm_can_see_sequence(id)');
SELECT public.__apply_policy('crm_sequences', 'Sequences are written by growth', 'INSERT',
    NULL,
    '(public.is_owner_or_admin() OR public.is_growth_member()) AND owner_user_id = auth.uid()');
SELECT public.__apply_policy('crm_sequences', 'Sequences are edited by their owner', 'UPDATE',
    'public.crm_can_see_sequence(id)',
    'public.crm_can_see_sequence(id)');
SELECT public.__apply_policy('crm_sequences', 'Sequences are deleted by their owner', 'DELETE',
    'public.crm_can_see_sequence(id)');

-- Steps and enrolments inherit the sequence they hang off.
SELECT public.__apply_policy('crm_sequence_steps', 'Steps follow the sequence', 'SELECT',
    'public.crm_can_see_sequence(sequence_id)');
SELECT public.__apply_policy('crm_sequence_steps', 'Steps written with the sequence', 'INSERT',
    NULL, 'public.crm_can_see_sequence(sequence_id)');
SELECT public.__apply_policy('crm_sequence_steps', 'Steps edited with the sequence', 'UPDATE',
    'public.crm_can_see_sequence(sequence_id)',
    'public.crm_can_see_sequence(sequence_id)');
SELECT public.__apply_policy('crm_sequence_steps', 'Steps deleted with the sequence', 'DELETE',
    'public.crm_can_see_sequence(sequence_id)');

-- An enrolment is about a person as well as a sequence, so both have to
-- let you in. That is stricter than either alone and it is the correct
-- reading: enrolling somebody is an act on them.
SELECT public.__apply_policy('crm_sequence_enrollments', 'Enrolments follow both subjects', 'SELECT',
    'public.crm_can_see_sequence(sequence_id) AND public.crm_can_see_contact(contact_id)');
SELECT public.__apply_policy('crm_sequence_enrollments', 'Enrolments written by the worker', 'INSERT',
    NULL,
    'public.crm_can_see_sequence(sequence_id) AND public.crm_can_edit_contact(contact_id)');
SELECT public.__apply_policy('crm_sequence_enrollments', 'Enrolments edited by the worker', 'UPDATE',
    'public.crm_can_see_sequence(sequence_id) AND public.crm_can_edit_contact(contact_id)',
    'public.crm_can_see_sequence(sequence_id) AND public.crm_can_edit_contact(contact_id)');

-- Saved views: yours, plus whatever somebody chose to share.
SELECT public.__apply_policy('crm_saved_views', 'Views are read by their owner', 'SELECT',
    'public.has_console_access() AND (owner_user_id = auth.uid() OR is_shared OR public.is_owner_or_admin())');
SELECT public.__apply_policy('crm_saved_views', 'Views are written by their owner', 'INSERT',
    NULL, 'public.has_console_access() AND owner_user_id = auth.uid()');
SELECT public.__apply_policy('crm_saved_views', 'Views are edited by their owner', 'UPDATE',
    'owner_user_id = auth.uid() OR public.is_owner_or_admin()',
    'owner_user_id = auth.uid() OR public.is_owner_or_admin()');
SELECT public.__apply_policy('crm_saved_views', 'Views are deleted by their owner', 'DELETE',
    'owner_user_id = auth.uid() OR public.is_owner_or_admin()');

DROP FUNCTION IF EXISTS public.__apply_policy(TEXT, TEXT, TEXT, TEXT, TEXT);
