-- =====================================================================
-- LINK HUB PRO
-- Brings the shareable link page up to parity with the mainstream
-- bio-link tools: block types (link / header / social), thumbnails,
-- attention highlights, scheduling, full theming, and page analytics.
--
-- Extends:   link_hub_links, link_hub_settings
-- Adds:      link_hub_visits, link_hub_events
-- Functions: record_link_hub_view, record_link_hub_click,
--            get_link_hub_analytics
--
-- Privacy: no raw IP addresses are stored. Only a salted daily hash
-- (for de-duplication) and a coarse country code are retained, matching
-- the approach used by the landing page analytics.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. LINK BLOCKS
-- A row is no longer always a button. `block_type` lets the same table
-- hold section headers and the social icon row too, so ordering stays
-- in one place.
-- ---------------------------------------------------------------------
ALTER TABLE public.link_hub_links
    ADD COLUMN IF NOT EXISTS block_type    TEXT NOT NULL DEFAULT 'link',
    ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
    ADD COLUMN IF NOT EXISTS highlight     TEXT NOT NULL DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS starts_at     TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS ends_at       TIMESTAMP WITH TIME ZONE;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'link_hub_links_block_type_check'
    ) THEN
        ALTER TABLE public.link_hub_links
            ADD CONSTRAINT link_hub_links_block_type_check
            CHECK (block_type IN ('link', 'header', 'social'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'link_hub_links_highlight_check'
    ) THEN
        ALTER TABLE public.link_hub_links
            ADD CONSTRAINT link_hub_links_highlight_check
            CHECK (highlight IN ('none', 'pulse', 'shine', 'bounce'));
    END IF;
END $$;

-- A header block has no destination, so the URL requirement is relaxed
-- to an empty string rather than dropped (keeps reads simple).
ALTER TABLE public.link_hub_links ALTER COLUMN url SET DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_link_hub_links_type     ON public.link_hub_links (block_type);
CREATE INDEX IF NOT EXISTS idx_link_hub_links_schedule ON public.link_hub_links (starts_at, ends_at);

-- ---------------------------------------------------------------------
-- 2. PAGE SETTINGS
-- Everything the page needs to render its identity and theme.
-- ---------------------------------------------------------------------
ALTER TABLE public.link_hub_settings
    ADD COLUMN IF NOT EXISTS avatar_url           TEXT,
    ADD COLUMN IF NOT EXISTS avatar_shape         TEXT    NOT NULL DEFAULT 'rounded',
    ADD COLUMN IF NOT EXISTS theme                TEXT    NOT NULL DEFAULT 'midnight',
    ADD COLUMN IF NOT EXISTS background_style     TEXT    NOT NULL DEFAULT 'glow',
    ADD COLUMN IF NOT EXISTS background_color     TEXT    NOT NULL DEFAULT '#0A0A0A',
    ADD COLUMN IF NOT EXISTS background_color_alt TEXT    NOT NULL DEFAULT '#111C33',
    ADD COLUMN IF NOT EXISTS background_image_url TEXT,
    ADD COLUMN IF NOT EXISTS button_style         TEXT    NOT NULL DEFAULT 'glass',
    ADD COLUMN IF NOT EXISTS button_radius        TEXT    NOT NULL DEFAULT 'rounded',
    ADD COLUMN IF NOT EXISTS button_color         TEXT    NOT NULL DEFAULT '#141414',
    ADD COLUMN IF NOT EXISTS button_text_color    TEXT    NOT NULL DEFAULT '#FFFFFF',
    ADD COLUMN IF NOT EXISTS accent_color         TEXT    NOT NULL DEFAULT '#8ECAFF',
    ADD COLUMN IF NOT EXISTS text_color           TEXT    NOT NULL DEFAULT '#FFFFFF',
    ADD COLUMN IF NOT EXISTS font_family          TEXT    NOT NULL DEFAULT 'sans',
    ADD COLUMN IF NOT EXISTS share_enabled        BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS seo_title            TEXT,
    ADD COLUMN IF NOT EXISTS seo_description      TEXT,
    ADD COLUMN IF NOT EXISTS og_image_url         TEXT,
    ADD COLUMN IF NOT EXISTS views                INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'link_hub_settings_background_style_check'
    ) THEN
        ALTER TABLE public.link_hub_settings
            ADD CONSTRAINT link_hub_settings_background_style_check
            CHECK (background_style IN ('solid', 'gradient', 'glow', 'image'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'link_hub_settings_button_style_check'
    ) THEN
        ALTER TABLE public.link_hub_settings
            ADD CONSTRAINT link_hub_settings_button_style_check
            CHECK (button_style IN ('glass', 'fill', 'outline', 'soft', 'hard'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'link_hub_settings_button_radius_check'
    ) THEN
        ALTER TABLE public.link_hub_settings
            ADD CONSTRAINT link_hub_settings_button_radius_check
            CHECK (button_radius IN ('sharp', 'rounded', 'pill'));
    END IF;
END $$;

-- ---------------------------------------------------------------------
-- 3. VISITS (one row per browsing session on the hub)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.link_hub_visits (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id    TEXT NOT NULL UNIQUE,

    source        TEXT NOT NULL DEFAULT 'direct',
    referrer      TEXT,
    referrer_host TEXT,

    device_type   TEXT,
    browser       TEXT,
    os            TEXT,
    country       TEXT,
    language      TEXT,
    ip_hash       TEXT,
    is_bot        BOOLEAN NOT NULL DEFAULT FALSE,

    clicks        INTEGER NOT NULL DEFAULT 0,
    first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    last_seen_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_link_hub_visits_seen   ON public.link_hub_visits (first_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_link_hub_visits_source ON public.link_hub_visits (source);
CREATE INDEX IF NOT EXISTS idx_link_hub_visits_bot    ON public.link_hub_visits (is_bot);

-- ---------------------------------------------------------------------
-- 4. EVENTS (raw log, used for the daily chart and per-link totals)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.link_hub_events (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT,
    link_id    UUID REFERENCES public.link_hub_links(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click', 'share')),
    source     TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_link_hub_events_created ON public.link_hub_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_link_hub_events_link    ON public.link_hub_events (link_id);
CREATE INDEX IF NOT EXISTS idx_link_hub_events_type    ON public.link_hub_events (event_type);

-- ---------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- Analytics are written only by the server-side ingest route using the
-- service role, and read only by signed-in admins.
-- ---------------------------------------------------------------------
ALTER TABLE public.link_hub_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_hub_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read of link hub visits" ON public.link_hub_visits;
CREATE POLICY "Allow authenticated read of link hub visits"
    ON public.link_hub_visits FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated read of link hub events" ON public.link_hub_events;
CREATE POLICY "Allow authenticated read of link hub events"
    ON public.link_hub_events FOR SELECT TO authenticated USING (true);

-- ---------------------------------------------------------------------
-- 6. VIEW INGEST
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_link_hub_view(
    p_session_id TEXT,
    p_visit      JSONB DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_is_new BOOLEAN := FALSE;
    v_source TEXT;
    v_is_bot BOOLEAN;
BEGIN
    IF p_session_id IS NULL OR length(p_session_id) = 0 THEN
        RETURN;
    END IF;

    INSERT INTO public.link_hub_visits (
        session_id, source, referrer, referrer_host,
        device_type, browser, os, country, language, ip_hash, is_bot
    ) VALUES (
        p_session_id,
        COALESCE(NULLIF(p_visit->>'source', ''), 'direct'),
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
        SET last_seen_at = timezone('utc'::text, now())
    RETURNING (xmax = 0) INTO v_is_new;

    SELECT source, is_bot INTO v_source, v_is_bot
    FROM public.link_hub_visits WHERE session_id = p_session_id;

    -- Only the first view of a session counts towards the page total,
    -- so a refresh does not inflate the number.
    IF v_is_new AND NOT v_is_bot THEN
        INSERT INTO public.link_hub_events (session_id, event_type, source)
        VALUES (p_session_id, 'view', v_source);

        UPDATE public.link_hub_settings SET views = views + 1 WHERE id = TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.record_link_hub_view(TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_link_hub_view(TEXT, JSONB) FROM anon;
REVOKE ALL ON FUNCTION public.record_link_hub_view(TEXT, JSONB) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.record_link_hub_view(TEXT, JSONB) TO service_role;

-- ---------------------------------------------------------------------
-- 7. CLICK INGEST
-- Replaces the single-argument version from the original migration so
-- clicks can be attributed to a session for the analytics view.
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.record_link_hub_click(UUID);

CREATE OR REPLACE FUNCTION public.record_link_hub_click(
    p_link_id    UUID,
    p_session_id TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_source TEXT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.link_hub_links WHERE id = p_link_id) THEN
        RETURN;
    END IF;

    UPDATE public.link_hub_links
    SET clicks = clicks + 1,
        last_clicked_at = timezone('utc'::text, now())
    WHERE id = p_link_id;

    IF p_session_id IS NOT NULL THEN
        UPDATE public.link_hub_visits
        SET clicks = clicks + 1,
            last_seen_at = timezone('utc'::text, now())
        WHERE session_id = p_session_id
        RETURNING source INTO v_source;
    END IF;

    INSERT INTO public.link_hub_events (session_id, link_id, event_type, source)
    VALUES (p_session_id, p_link_id, 'click', COALESCE(v_source, 'direct'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.record_link_hub_click(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_link_hub_click(UUID, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.record_link_hub_click(UUID, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.record_link_hub_click(UUID, TEXT) TO service_role;

-- ---------------------------------------------------------------------
-- 8. REPORTING
-- One round trip for the whole admin analytics panel.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_link_hub_analytics(p_days INTEGER DEFAULT 30)
RETURNS JSONB AS $$
DECLARE
    v_days   INTEGER;
    v_since  TIMESTAMP WITH TIME ZONE;
    v_result JSONB;
BEGIN
    v_days  := GREATEST(1, LEAST(365, COALESCE(p_days, 30)));
    v_since := timezone('utc'::text, now()) - (v_days || ' days')::INTERVAL;

    WITH scoped_visits AS (
        SELECT * FROM public.link_hub_visits
        WHERE first_seen_at >= v_since AND is_bot = FALSE
    ),
    scoped_events AS (
        SELECT * FROM public.link_hub_events WHERE created_at >= v_since
    )
    SELECT jsonb_build_object(
        'range_days', v_days,
        'since', v_since,

        'totals', jsonb_build_object(
            'views',      (SELECT COUNT(*) FROM scoped_events WHERE event_type = 'view'),
            'visitors',   (SELECT COUNT(*) FROM scoped_visits),
            'clicks',     (SELECT COUNT(*) FROM scoped_events WHERE event_type = 'click'),
            'shares',     (SELECT COUNT(*) FROM scoped_events WHERE event_type = 'share'),
            'clickers',   (SELECT COUNT(*) FROM scoped_visits WHERE clicks > 0),
            'ctr',        (SELECT CASE WHEN COUNT(*) > 0
                                  THEN ROUND(100.0 * COUNT(*) FILTER (WHERE clicks > 0) / COUNT(*), 1)
                                  ELSE 0 END
                           FROM scoped_visits),
            'all_time_views',  COALESCE((SELECT views FROM public.link_hub_settings WHERE id = TRUE), 0),
            'all_time_clicks', COALESCE((SELECT SUM(clicks) FROM public.link_hub_links), 0)
        ),

        'by_link', COALESCE((
            SELECT jsonb_agg(row_to_json(t)) FROM (
                SELECT
                    l.id,
                    l.label,
                    l.url,
                    l.icon,
                    l.block_type,
                    l.is_active,
                    l.clicks                                        AS all_time_clicks,
                    COUNT(e.id)                                     AS clicks,
                    MAX(e.created_at)                               AS last_click
                FROM public.link_hub_links l
                LEFT JOIN scoped_events e ON e.link_id = l.id AND e.event_type = 'click'
                WHERE l.block_type <> 'header'
                GROUP BY l.id, l.label, l.url, l.icon, l.block_type, l.is_active, l.clicks
                ORDER BY clicks DESC, all_time_clicks DESC
                LIMIT 50
            ) t
        ), '[]'::jsonb),

        'by_source', COALESCE((
            SELECT jsonb_agg(row_to_json(t)) FROM (
                SELECT
                    source,
                    COUNT(*)                               AS visits,
                    COUNT(*) FILTER (WHERE clicks > 0)     AS clicked,
                    COALESCE(SUM(clicks), 0)               AS clicks
                FROM scoped_visits GROUP BY source ORDER BY visits DESC LIMIT 15
            ) t
        ), '[]'::jsonb),

        'by_referrer', COALESCE((
            SELECT jsonb_agg(row_to_json(t)) FROM (
                SELECT COALESCE(NULLIF(referrer_host, ''), 'direct') AS referrer_host,
                       COUNT(*) AS visits
                FROM scoped_visits GROUP BY 1 ORDER BY visits DESC LIMIT 12
            ) t
        ), '[]'::jsonb),

        'by_device', COALESCE((
            SELECT jsonb_agg(row_to_json(t)) FROM (
                SELECT COALESCE(NULLIF(device_type, ''), 'unknown') AS device_type,
                       COUNT(*) AS visits
                FROM scoped_visits GROUP BY 1 ORDER BY visits DESC
            ) t
        ), '[]'::jsonb),

        'by_country', COALESCE((
            SELECT jsonb_agg(row_to_json(t)) FROM (
                SELECT COALESCE(NULLIF(country, ''), 'unknown') AS country,
                       COUNT(*) AS visits
                FROM scoped_visits GROUP BY 1 ORDER BY visits DESC LIMIT 10
            ) t
        ), '[]'::jsonb),

        'timeseries', COALESCE((
            SELECT jsonb_agg(row_to_json(t)) FROM (
                SELECT
                    to_char(date_trunc('day', created_at), 'YYYY-MM-DD')  AS day,
                    COUNT(*) FILTER (WHERE event_type = 'view')           AS views,
                    COUNT(*) FILTER (WHERE event_type = 'click')          AS clicks
                FROM scoped_events GROUP BY 1 ORDER BY 1 ASC
            ) t
        ), '[]'::jsonb)
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.get_link_hub_analytics(INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_link_hub_analytics(INTEGER) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_link_hub_analytics(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_link_hub_analytics(INTEGER) TO service_role;

-- ---------------------------------------------------------------------
-- 9. SEED THE SOCIAL ROW
-- Social handles sit above the buttons on every comparable page, so the
-- hub ships with the row in place and hidden until the URLs are filled.
-- ---------------------------------------------------------------------
INSERT INTO public.link_hub_links (label, url, icon, block_type, sort_order, is_active)
SELECT * FROM (VALUES
    ('Instagram', 'https://instagram.com/abramnetwork', 'instagram', 'social', 1, FALSE),
    ('X',         'https://x.com/abramnetwork',         'x',         'social', 2, FALSE),
    ('YouTube',   'https://youtube.com/@abramnetwork',  'youtube',   'social', 3, FALSE),
    ('LinkedIn',  'https://linkedin.com/company/abramnetwork', 'linkedin', 'social', 4, FALSE)
) AS seed(label, url, icon, block_type, sort_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.link_hub_links WHERE block_type = 'social');
