-- =====================================================================
-- SUPABASE MARKETING DASHBOARD SCHEMA ADDITIONS FOR ABRAM CMS
-- Tables: subscribers, content_analytics, analytics_events,
--         campaigns, campaign_logs
-- File Location: /supabase-marketing-schema.sql
-- =====================================================================

-- =====================================================================
-- 1. TABLE DEFINITIONS
-- =====================================================================

-- SUBSCRIBERS TABLE
-- Tracks email subscribers for newsletters and updates.
CREATE TABLE IF NOT EXISTS public.subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    resend_contact_id TEXT,
    status TEXT NOT NULL DEFAULT 'subscribed' CHECK (status IN ('subscribed', 'unsubscribed', 'bounced')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- CONTENT ANALYTICS TABLE (Aggregated Metrics)
-- Stores total page views and reads for blog posts and release notes.
CREATE TABLE IF NOT EXISTS public.content_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE UNIQUE,
    release_note_id UUID REFERENCES public.release_notes(id) ON DELETE CASCADE UNIQUE,
    views INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0),
    reads INTEGER NOT NULL DEFAULT 0 CHECK (reads >= 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT check_single_content_reference CHECK (
        (blog_post_id IS NOT NULL AND release_note_id IS NULL) OR
        (release_note_id IS NOT NULL AND blog_post_id IS NULL)
    )
);

-- ANALYTICS EVENTS TABLE (Detailed Event Logs)
-- Logs raw user events for views and reads to support time-series reporting.
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL CHECK (content_type IN ('blog_post', 'release_note')),
    blog_post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    release_note_id UUID REFERENCES public.release_notes(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('view', 'read')),
    ip_hash TEXT, -- Optional: helps prevent double-counting of views from the same session
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT check_event_reference CHECK (
        (content_type = 'blog_post' AND blog_post_id IS NOT NULL AND release_note_id IS NULL) OR
        (content_type = 'release_note' AND release_note_id IS NOT NULL AND blog_post_id IS NULL)
    )
);

-- NEWSLETTER CAMPAIGNS TABLE
-- Tracks individual newsletter broadcasts and their status.
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT,
    segment_id TEXT,
    resend_broadcast_id TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
    recipients_count INTEGER NOT NULL DEFAULT 0 CHECK (recipients_count >= 0),
    sent_at TIMESTAMP WITH TIME ZONE,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB
);

-- NEWSLETTER CAMPAIGN LOGS TABLE
-- Logs individual email delivery status, opens, and clicks.
CREATE TABLE IF NOT EXISTS public.campaign_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    subscriber_id UUID REFERENCES public.subscribers(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'opened', 'clicked')),
    error_message TEXT,
    event_type TEXT,
    recipient_email TEXT,
    payload JSONB,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);


-- =====================================================================
-- 2. INDEXES FOR PERFORMANCE
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_subscribers_email ON public.subscribers(email);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_campaign_id ON public.campaign_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_subscriber_id ON public.campaign_logs(subscriber_id);


-- =====================================================================
-- 3. TIMESTAMP TRIGGERS
-- =====================================================================

-- Re-uses the existing update_updated_at_column() helper defined in supabase-schema.sql.

DROP TRIGGER IF EXISTS trigger_update_subscribers_updated_at ON public.subscribers;
CREATE TRIGGER trigger_update_subscribers_updated_at
     BEFORE UPDATE ON public.subscribers
     FOR EACH ROW
     EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_content_analytics_updated_at ON public.content_analytics;
CREATE TRIGGER trigger_update_content_analytics_updated_at
     BEFORE UPDATE ON public.content_analytics
     FOR EACH ROW
     EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_campaigns_updated_at ON public.campaigns;
CREATE TRIGGER trigger_update_campaigns_updated_at
     BEFORE UPDATE ON public.campaigns
     FOR EACH ROW
     EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_campaign_logs_updated_at ON public.campaign_logs;
CREATE TRIGGER trigger_update_campaign_logs_updated_at
     BEFORE UPDATE ON public.campaign_logs
     FOR EACH ROW
     EXECUTE FUNCTION update_updated_at_column();


-- =====================================================================
-- 4. ROW-LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_logs ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies to support clean re-runs.
DROP POLICY IF EXISTS "Allow authenticated read of subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Allow public insert of subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Allow authenticated update of subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Allow authenticated delete of subscribers" ON public.subscribers;

DROP POLICY IF EXISTS "Allow public read of content analytics" ON public.content_analytics;
DROP POLICY IF EXISTS "Allow authenticated write of content analytics" ON public.content_analytics;

DROP POLICY IF EXISTS "Allow authenticated read of analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Allow authenticated write of analytics events" ON public.analytics_events;

DROP POLICY IF EXISTS "Allow authenticated full access to campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Allow authenticated full access to campaign logs" ON public.campaign_logs;
DROP POLICY IF EXISTS "Allow public insert of campaign logs" ON public.campaign_logs;

-- Policies for subscribers:
CREATE POLICY "Allow authenticated read of subscribers"
    ON public.subscribers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow public insert of subscribers"
    ON public.subscribers FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow authenticated update of subscribers"
    ON public.subscribers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete of subscribers"
    ON public.subscribers FOR DELETE TO authenticated USING (true);

-- Policies for content_analytics:
CREATE POLICY "Allow public read of content analytics"
    ON public.content_analytics FOR SELECT TO public USING (true);

CREATE POLICY "Allow authenticated write of content analytics"
    ON public.content_analytics FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policies for analytics_events:
CREATE POLICY "Allow authenticated read of analytics events"
    ON public.analytics_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated write of analytics events"
    ON public.analytics_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policies for campaigns:
CREATE POLICY "Allow authenticated full access to campaigns"
    ON public.campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policies for campaign_logs:
CREATE POLICY "Allow authenticated full access to campaign logs"
    ON public.campaign_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow public insert of campaign logs"
    ON public.campaign_logs FOR INSERT TO public WITH CHECK (true);


-- =====================================================================
-- 5. SECURE REMOTE PROCEDURE CALLS (RPC FUNCTIONS)
-- =====================================================================

-- SECURE CONTENT EVENT TRACKING FUNCTION
-- Allows public users/clients to record page views or read-throughs securely
-- without granting them write/update permissions to the tables directly.
CREATE OR REPLACE FUNCTION public.track_content_event(
    p_content_type TEXT,
    p_id UUID,
    p_event_type TEXT,
    p_ip_hash TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_blog_post_id UUID := NULL;
    v_release_note_id UUID := NULL;
BEGIN
    -- Validate params
    IF p_content_type NOT IN ('blog_post', 'release_note') THEN
        RAISE EXCEPTION 'Invalid content type: must be blog_post or release_note';
    END IF;
    
    IF p_event_type NOT IN ('view', 'read') THEN
        RAISE EXCEPTION 'Invalid event type: must be view or read';
    END IF;

    -- Assign and check existence
    IF p_content_type = 'blog_post' THEN
        v_blog_post_id := p_id;
        IF NOT EXISTS (SELECT 1 FROM public.blog_posts WHERE id = v_blog_post_id) THEN
            RAISE EXCEPTION 'Blog post not found';
        END IF;
    ELSE
        v_release_note_id := p_id;
        IF NOT EXISTS (SELECT 1 FROM public.release_notes WHERE id = v_release_note_id) THEN
            RAISE EXCEPTION 'Release note not found';
        END IF;
    END IF;

    -- 1. Log the raw event for time-series charts
    INSERT INTO public.analytics_events (
        content_type,
        blog_post_id,
        release_note_id,
        event_type,
        ip_hash
    ) VALUES (
        p_content_type,
        v_blog_post_id,
        v_release_note_id,
        p_event_type,
        p_ip_hash
    );

    -- 2. Upsert the aggregated view/read counts
    IF p_content_type = 'blog_post' THEN
        INSERT INTO public.content_analytics (blog_post_id, views, reads)
        VALUES (
            v_blog_post_id, 
            CASE WHEN p_event_type = 'view' THEN 1 ELSE 0 END, 
            CASE WHEN p_event_type = 'read' THEN 1 ELSE 0 END
        )
        ON CONFLICT (blog_post_id) DO UPDATE
        SET 
            views = public.content_analytics.views + CASE WHEN p_event_type = 'view' THEN 1 ELSE 0 END,
            reads = public.content_analytics.reads + CASE WHEN p_event_type = 'read' THEN 1 ELSE 0 END,
            updated_at = now();
    ELSE
        INSERT INTO public.content_analytics (release_note_id, views, reads)
        VALUES (
            v_release_note_id, 
            CASE WHEN p_event_type = 'view' THEN 1 ELSE 0 END, 
            CASE WHEN p_event_type = 'read' THEN 1 ELSE 0 END
        )
        ON CONFLICT (release_note_id) DO UPDATE
        SET 
            views = public.content_analytics.views + CASE WHEN p_event_type = 'view' THEN 1 ELSE 0 END,
            reads = public.content_analytics.reads + CASE WHEN p_event_type = 'read' THEN 1 ELSE 0 END,
            updated_at = now();
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution privileges to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.track_content_event(TEXT, UUID, TEXT, TEXT) TO anon, authenticated;


-- SECURE UNSUBSCRIBE FUNCTION
-- Allows unsubscribing using the subscriber's UUID (safely unguessable)
-- without exposing general UPDATE access to public users.
CREATE OR REPLACE FUNCTION public.unsubscribe_subscriber_by_id(p_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated BOOLEAN := FALSE;
BEGIN
    UPDATE public.subscribers
    SET status = 'unsubscribed', updated_at = now()
    WHERE id = p_id AND status = 'subscribed';
    
    IF FOUND THEN
        v_updated := TRUE;
    END IF;
    
    RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.unsubscribe_subscriber_by_id(UUID) TO anon, authenticated;


-- SECURE CAMPAIGN OPEN TRACKING FUNCTION
-- Records email opens securely via tracker pixel or gateway calls.
CREATE OR REPLACE FUNCTION public.track_campaign_open(p_log_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.campaign_logs
    SET status = 'opened', updated_at = now()
    WHERE id = p_log_id AND status IN ('sent', 'delivered');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.track_campaign_open(UUID) TO anon, authenticated;


-- SECURE CAMPAIGN CLICK TRACKING FUNCTION
-- Records email link clicks securely via tracking redirects.
CREATE OR REPLACE FUNCTION public.track_campaign_click(p_log_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.campaign_logs
    SET status = 'clicked', updated_at = now()
    WHERE id = p_log_id AND status IN ('sent', 'delivered', 'opened');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.track_campaign_click(UUID) TO anon, authenticated;
