-- =====================================================================
-- CAMPAIGN LANDING PAGE ANALYTICS
-- Tables:    landing_visits, landing_events
-- Functions: record_landing_event, get_landing_analytics
--
-- Purpose: track visitors arriving on the /start conversion landing
-- pages from paid/organic social channels (TikTok, Reddit, etc.) and
-- measure the funnel through to app sign-up.
--
-- Privacy: no raw IP addresses are ever stored. Only a salted daily
-- hash (for de-duplication) and a coarse country code are retained.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. LANDING VISITS (one row per browsing session per landing page)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.landing_visits (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id        TEXT NOT NULL UNIQUE,
    page_slug         TEXT NOT NULL,
    variant           TEXT,
    landing_path      TEXT,

    -- Attribution
    source            TEXT NOT NULL DEFAULT 'direct', -- normalized: tiktok, reddit, direct...
    raw_source        TEXT,                            -- utm_source / src exactly as supplied
    medium            TEXT,
    campaign          TEXT,
    content           TEXT,
    term              TEXT,
    referrer          TEXT,
    referrer_host     TEXT,

    -- Environment
    device_type       TEXT,   -- mobile | tablet | desktop
    browser           TEXT,
    os                TEXT,
    country           TEXT,   -- ISO-3166 alpha-2, coarse only
    language          TEXT,
    ip_hash           TEXT,   -- sha256(ip + user agent + daily salt)
    is_bot            BOOLEAN NOT NULL DEFAULT FALSE,

    -- Engagement rollups (maintained by record_landing_event)
    max_scroll_pct    INTEGER NOT NULL DEFAULT 0 CHECK (max_scroll_pct BETWEEN 0 AND 100),
    cta_clicks        INTEGER NOT NULL DEFAULT 0,
    signup_clicks     INTEGER NOT NULL DEFAULT 0,
    reached_signup    BOOLEAN NOT NULL DEFAULT FALSE,
    email_captured    BOOLEAN NOT NULL DEFAULT FALSE,
    email             TEXT,
    duration_seconds  INTEGER NOT NULL DEFAULT 0,
    event_count       INTEGER NOT NULL DEFAULT 0,

    first_seen_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    last_seen_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_landing_visits_first_seen ON public.landing_visits (first_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_landing_visits_page       ON public.landing_visits (page_slug);
CREATE INDEX IF NOT EXISTS idx_landing_visits_source     ON public.landing_visits (source);
CREATE INDEX IF NOT EXISTS idx_landing_visits_bot        ON public.landing_visits (is_bot);

-- ---------------------------------------------------------------------
-- 2. LANDING EVENTS (raw funnel event log)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.landing_events (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id   TEXT NOT NULL,
    page_slug    TEXT NOT NULL,
    event_type   TEXT NOT NULL CHECK (event_type IN (
                     'view', 'scroll', 'cta_click', 'signup_click',
                     'email_capture', 'faq_open', 'section_view', 'exit'
                 )),
    label        TEXT,
    value        INTEGER,
    source       TEXT,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_landing_events_created ON public.landing_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_landing_events_session ON public.landing_events (session_id);
CREATE INDEX IF NOT EXISTS idx_landing_events_type    ON public.landing_events (event_type);
CREATE INDEX IF NOT EXISTS idx_landing_events_page    ON public.landing_events (page_slug);

-- ---------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
-- Writes happen exclusively through the server-side ingest route using
-- the service role key. Signed-in admins get read access.
-- ---------------------------------------------------------------------
ALTER TABLE public.landing_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read of landing visits" ON public.landing_visits;
CREATE POLICY "Allow authenticated read of landing visits"
    ON public.landing_visits FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated read of landing events" ON public.landing_events;
CREATE POLICY "Allow authenticated read of landing events"
    ON public.landing_events FOR SELECT TO authenticated USING (true);

-- ---------------------------------------------------------------------
-- 4. INGEST FUNCTION
-- Records a single funnel event and keeps the visit rollups in sync.
-- p_visit is supplied on the initial 'view' event and carries the
-- attribution payload assembled by the ingest route.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_landing_event(
    p_session_id TEXT,
    p_page_slug  TEXT,
    p_event_type TEXT,
    p_label      TEXT DEFAULT NULL,
    p_value      INTEGER DEFAULT NULL,
    p_visit      JSONB DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_source TEXT;
BEGIN
    IF p_session_id IS NULL OR p_page_slug IS NULL OR p_event_type IS NULL THEN
        RAISE EXCEPTION 'session_id, page_slug and event_type are required';
    END IF;

    -- Create or refresh the visit row
    IF p_visit IS NOT NULL THEN
        INSERT INTO public.landing_visits (
            session_id, page_slug, variant, landing_path,
            source, raw_source, medium, campaign, content, term,
            referrer, referrer_host,
            device_type, browser, os, country, language, ip_hash, is_bot
        ) VALUES (
            p_session_id,
            p_page_slug,
            p_visit->>'variant',
            p_visit->>'landing_path',
            COALESCE(NULLIF(p_visit->>'source', ''), 'direct'),
            p_visit->>'raw_source',
            p_visit->>'medium',
            p_visit->>'campaign',
            p_visit->>'content',
            p_visit->>'term',
            p_visit->>'referrer',
            p_visit->>'referrer_host',
            p_visit->>'device_type',
            p_visit->>'browser',
            p_visit->>'os',
            p_visit->>'country',
            p_visit->>'language',
            p_visit->>'ip_hash',
            COALESCE((p_visit->>'is_bot')::BOOLEAN, FALSE)
        )
        ON CONFLICT (session_id) DO UPDATE
            SET last_seen_at = timezone('utc'::text, now());
    END IF;

    -- Skip orphan events (an event arriving without its visit row)
    IF NOT EXISTS (SELECT 1 FROM public.landing_visits WHERE session_id = p_session_id) THEN
        RETURN;
    END IF;

    SELECT source INTO v_source FROM public.landing_visits WHERE session_id = p_session_id;

    INSERT INTO public.landing_events (session_id, page_slug, event_type, label, value, source)
    VALUES (p_session_id, p_page_slug, p_event_type, p_label, p_value, v_source);

    UPDATE public.landing_visits
    SET
        last_seen_at     = timezone('utc'::text, now()),
        event_count      = event_count + 1,
        max_scroll_pct   = CASE
                              WHEN p_event_type = 'scroll' AND p_value IS NOT NULL
                              THEN GREATEST(max_scroll_pct, LEAST(100, GREATEST(0, p_value)))
                              ELSE max_scroll_pct
                           END,
        cta_clicks       = CASE WHEN p_event_type = 'cta_click' THEN cta_clicks + 1 ELSE cta_clicks END,
        signup_clicks    = CASE WHEN p_event_type = 'signup_click' THEN signup_clicks + 1 ELSE signup_clicks END,
        reached_signup   = CASE WHEN p_event_type = 'signup_click' THEN TRUE ELSE reached_signup END,
        email_captured   = CASE WHEN p_event_type = 'email_capture' THEN TRUE ELSE email_captured END,
        email            = CASE WHEN p_event_type = 'email_capture' AND p_label IS NOT NULL
                                THEN p_label ELSE email END,
        duration_seconds = CASE
                              WHEN p_event_type = 'exit' AND p_value IS NOT NULL
                              THEN GREATEST(duration_seconds, LEAST(7200, GREATEST(0, p_value)))
                              ELSE duration_seconds
                           END
    WHERE session_id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Only the server-side ingest route may write. Signed-in admins read
-- the analytics function below, they never record events directly.
REVOKE ALL ON FUNCTION public.record_landing_event(TEXT, TEXT, TEXT, TEXT, INTEGER, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_landing_event(TEXT, TEXT, TEXT, TEXT, INTEGER, JSONB) FROM anon;
REVOKE ALL ON FUNCTION public.record_landing_event(TEXT, TEXT, TEXT, TEXT, INTEGER, JSONB) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.record_landing_event(TEXT, TEXT, TEXT, TEXT, INTEGER, JSONB) TO service_role;

-- ---------------------------------------------------------------------
-- 5. REPORTING FUNCTION
-- Returns the complete admin dashboard payload in a single round trip.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_landing_analytics(
    p_days INTEGER DEFAULT 30,
    p_page TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_since  TIMESTAMP WITH TIME ZONE;
    v_result JSONB;
BEGIN
    v_since := timezone('utc'::text, now()) - (GREATEST(1, LEAST(365, COALESCE(p_days, 30))) || ' days')::INTERVAL;

    WITH scoped AS (
        SELECT *
        FROM public.landing_visits
        WHERE first_seen_at >= v_since
          AND is_bot = FALSE
          AND (p_page IS NULL OR page_slug = p_page)
    )
    SELECT jsonb_build_object(
        'range_days', GREATEST(1, LEAST(365, COALESCE(p_days, 30))),
        'since', v_since,

        'totals', (
            SELECT jsonb_build_object(
                'visits',          COUNT(*),
                'cta_clicks',      COALESCE(SUM(cta_clicks), 0),
                'signup_clicks',   COALESCE(SUM(signup_clicks), 0),
                'signup_sessions', COUNT(*) FILTER (WHERE reached_signup),
                'emails',          COUNT(*) FILTER (WHERE email_captured),
                'engaged',         COUNT(*) FILTER (WHERE max_scroll_pct >= 50),
                'avg_scroll',      COALESCE(ROUND(AVG(max_scroll_pct)), 0),
                'avg_duration',    COALESCE(ROUND(AVG(NULLIF(duration_seconds, 0))), 0),
                'countries',       COUNT(DISTINCT country) FILTER (WHERE country IS NOT NULL)
            ) FROM scoped
        ),

        'funnel', (
            SELECT jsonb_build_object(
                'landed',    COUNT(*),
                'scrolled',  COUNT(*) FILTER (WHERE max_scroll_pct >= 25),
                'engaged',   COUNT(*) FILTER (WHERE max_scroll_pct >= 50),
                'finished',  COUNT(*) FILTER (WHERE max_scroll_pct >= 90),
                'clicked',   COUNT(*) FILTER (WHERE cta_clicks > 0),
                'signup',    COUNT(*) FILTER (WHERE reached_signup)
            ) FROM scoped
        ),

        'by_page', COALESCE((
            SELECT jsonb_agg(row_to_json(t)) FROM (
                SELECT
                    page_slug,
                    COUNT(*)                                        AS visits,
                    COUNT(*) FILTER (WHERE reached_signup)          AS signups,
                    COUNT(*) FILTER (WHERE email_captured)          AS emails,
                    COALESCE(ROUND(AVG(max_scroll_pct)), 0)         AS avg_scroll,
                    CASE WHEN COUNT(*) > 0
                         THEN ROUND(100.0 * COUNT(*) FILTER (WHERE reached_signup) / COUNT(*), 1)
                         ELSE 0 END                                 AS conversion_rate
                FROM scoped GROUP BY page_slug ORDER BY visits DESC
            ) t
        ), '[]'::jsonb),

        'by_source', COALESCE((
            SELECT jsonb_agg(row_to_json(t)) FROM (
                SELECT
                    source,
                    COUNT(*)                                        AS visits,
                    COUNT(*) FILTER (WHERE cta_clicks > 0)          AS clicked,
                    COUNT(*) FILTER (WHERE reached_signup)          AS signups,
                    COUNT(*) FILTER (WHERE email_captured)          AS emails,
                    COALESCE(ROUND(AVG(max_scroll_pct)), 0)         AS avg_scroll,
                    CASE WHEN COUNT(*) > 0
                         THEN ROUND(100.0 * COUNT(*) FILTER (WHERE reached_signup) / COUNT(*), 1)
                         ELSE 0 END                                 AS conversion_rate
                FROM scoped GROUP BY source ORDER BY visits DESC LIMIT 25
            ) t
        ), '[]'::jsonb),

        'by_campaign', COALESCE((
            SELECT jsonb_agg(row_to_json(t)) FROM (
                SELECT
                    COALESCE(NULLIF(campaign, ''), 'none') AS campaign,
                    COALESCE(NULLIF(content, ''), '—')     AS content,
                    source,
                    COUNT(*)                               AS visits,
                    COUNT(*) FILTER (WHERE reached_signup) AS signups
                FROM scoped
                GROUP BY 1, 2, 3 ORDER BY visits DESC LIMIT 25
            ) t
        ), '[]'::jsonb),

        'by_referrer', COALESCE((
            SELECT jsonb_agg(row_to_json(t)) FROM (
                SELECT COALESCE(NULLIF(referrer_host, ''), 'direct') AS referrer_host, COUNT(*) AS visits
                FROM scoped GROUP BY 1 ORDER BY visits DESC LIMIT 15
            ) t
        ), '[]'::jsonb),

        'by_device', COALESCE((
            SELECT jsonb_agg(row_to_json(t)) FROM (
                SELECT COALESCE(NULLIF(device_type, ''), 'unknown') AS device_type, COUNT(*) AS visits
                FROM scoped GROUP BY 1 ORDER BY visits DESC
            ) t
        ), '[]'::jsonb),

        'by_country', COALESCE((
            SELECT jsonb_agg(row_to_json(t)) FROM (
                SELECT COALESCE(NULLIF(country, ''), 'unknown') AS country, COUNT(*) AS visits
                FROM scoped GROUP BY 1 ORDER BY visits DESC LIMIT 12
            ) t
        ), '[]'::jsonb),

        'timeseries', COALESCE((
            SELECT jsonb_agg(row_to_json(t)) FROM (
                SELECT
                    to_char(date_trunc('day', first_seen_at), 'YYYY-MM-DD') AS day,
                    COUNT(*)                                                AS visits,
                    COUNT(*) FILTER (WHERE reached_signup)                  AS signups
                FROM scoped GROUP BY 1 ORDER BY 1 ASC
            ) t
        ), '[]'::jsonb),

        'recent', COALESCE((
            SELECT jsonb_agg(row_to_json(t)) FROM (
                SELECT
                    session_id, page_slug, source, medium, campaign, referrer_host,
                    device_type, browser, os, country, max_scroll_pct, cta_clicks,
                    reached_signup, email_captured, duration_seconds, first_seen_at
                FROM scoped ORDER BY first_seen_at DESC LIMIT 60
            ) t
        ), '[]'::jsonb)
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.get_landing_analytics(INTEGER, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_landing_analytics(INTEGER, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_landing_analytics(INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_landing_analytics(INTEGER, TEXT) TO service_role;
