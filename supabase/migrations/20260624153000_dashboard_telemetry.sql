-- =====================================================================
-- ABRAM DASHBOARD TELEMETRY VIEWS & RPC FUNCTIONS
-- Migration File: supabase/migrations/20260624153000_dashboard_telemetry.sql
-- Project Target: fovvtmwmrivuwnqemcil.supabase.co
-- =====================================================================

-- 1. View: Subscriber Weekly Trends
-- Aggregates subscriber sign-ups week-by-week.
CREATE OR REPLACE VIEW public.v_subscriber_trends AS
SELECT 
    date_trunc('week', created_at)::date AS week_start,
    COUNT(id) AS signup_count,
    SUM(COUNT(id)) OVER (ORDER BY date_trunc('week', created_at)::date) AS cumulative_signups
FROM public.subscribers
WHERE created_at >= now() - INTERVAL '6 months'
GROUP BY date_trunc('week', created_at)::date
ORDER BY week_start ASC;

-- 2. View: Campaign Performance Summary
-- Aggregates delivery, open, and click rates per campaign.
CREATE OR REPLACE VIEW public.v_campaign_performance AS
SELECT 
    c.id AS campaign_id,
    c.title,
    c.subject,
    c.status AS campaign_status,
    c.sent_at,
    c.recipients_count AS total_sent,
    COALESCE(COUNT(CASE WHEN cl.status = 'delivered' THEN 1 END), 0) AS delivered_count,
    COALESCE(COUNT(CASE WHEN cl.status = 'opened' THEN 1 END), 0) AS opened_count,
    COALESCE(COUNT(CASE WHEN cl.status = 'clicked' THEN 1 END), 0) AS clicked_count,
    COALESCE(COUNT(CASE WHEN cl.status = 'failed' THEN 1 END), 0) AS failed_count,
    CASE 
        WHEN c.recipients_count > 0 THEN 
            ROUND((COALESCE(COUNT(CASE WHEN cl.status = 'opened' THEN 1 END), 0)::numeric / c.recipients_count::numeric) * 100, 1)
        ELSE 0.0 
    END AS open_rate,
    CASE 
        WHEN c.recipients_count > 0 THEN 
            ROUND((COALESCE(COUNT(CASE WHEN cl.status = 'clicked' THEN 1 END), 0)::numeric / c.recipients_count::numeric) * 100, 1)
        ELSE 0.0 
    END AS click_rate
FROM public.campaigns c
LEFT JOIN public.campaign_logs cl ON c.id = cl.campaign_id
GROUP BY c.id, c.title, c.subject, c.status, c.sent_at, c.recipients_count;

-- 3. View: Top Performing Content Engagement
-- Computes read-to-view ratios for blog posts and release notes.
CREATE OR REPLACE VIEW public.v_content_performance AS
SELECT 
    ca.id AS analytics_id,
    COALESCE(bp.title, rn.title) AS content_title,
    CASE 
        WHEN bp.id IS NOT NULL THEN 'Blog'
        ELSE 'Release'
    END AS content_type,
    ca.views,
    ca.reads,
    CASE 
        WHEN ca.views > 0 THEN 
            ROUND((ca.reads::numeric / ca.views::numeric) * 100, 1)
        ELSE 0.0 
    END AS read_ratio,
    ca.updated_at
FROM public.content_analytics ca
LEFT JOIN public.blog_posts bp ON ca.blog_post_id = bp.id
LEFT JOIN public.release_notes rn ON ca.release_note_id = rn.id
ORDER BY ca.views DESC;

-- 4. Secure RPC Function: 30-Day Sparkline Time-Series
-- Aggregates daily page views and newsletter sign-ups for sparkline visuals.
CREATE OR REPLACE FUNCTION public.get_dashboard_sparklines()
RETURNS TABLE (
    event_date DATE,
    page_views BIGINT,
    newsletter_signups BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(
            (now() - INTERVAL '29 days')::date,
            now()::date,
            '1 day'::interval
        )::date AS d_date
    ),
    views_agg AS (
        SELECT created_at::date AS e_date, COUNT(*) AS view_count
        FROM public.analytics_events
        WHERE event_type = 'view' AND created_at >= now() - INTERVAL '30 days'
        GROUP BY created_at::date
    ),
    signups_agg AS (
        SELECT created_at::date AS s_date, COUNT(*) AS signup_count
        FROM public.subscribers
        WHERE created_at >= now() - INTERVAL '30 days'
        GROUP BY created_at::date
    )
    SELECT 
        ds.d_date AS event_date,
        COALESCE(va.view_count, 0)::BIGINT AS page_views,
        COALESCE(sa.signup_count, 0)::BIGINT AS newsletter_signups
    FROM date_series ds
    LEFT JOIN views_agg va ON ds.d_date = va.e_date
    LEFT JOIN signups_agg sa ON ds.d_date = sa.s_date
    ORDER BY ds.d_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to authenticated role.
GRANT EXECUTE ON FUNCTION public.get_dashboard_sparklines() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_sparklines() TO anon;
