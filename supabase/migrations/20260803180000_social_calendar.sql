-- =====================================================================
-- SOCIAL CALENDAR
--
-- The Social Studio holds pictures. This holds POSTS: a date, a channel,
-- the words, the tracked link, and the card that goes with them. One row
-- is everything needed to post once, which is what the morning Slack
-- message reads out.
--
-- Two tables:
--   social_campaigns  a named push, so a week of posts hangs together
--   social_posts      the packet. Campaign is optional; a one-off post
--                     is a row with no campaign.
--
-- Deliberately NOT here: anything that posts. Nothing in this schema
-- holds a social credential and nothing publishes on a schedule. The
-- calendar's job is to make posting a thirty second job, done by a
-- person, from a message that already has everything in it.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. CAMPAIGNS
--
-- Thin on purpose. The landing pages and the channels already live in
-- campaign_link_pages / campaign_link_channels, and the analytics join on
-- page_slug, so this table adds only what neither of those has: a name, a
-- reason, and a span of dates.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.social_campaigns (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Becomes utm_campaign on every link built for this campaign, so keep
    -- it lowercase and stable. Renaming one after posting splits its
    -- attribution across two names.
    slug        TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,

    -- One line: what this push is supposed to achieve. Shown above the
    -- week so a post that does not serve it is obvious.
    goal        TEXT,

    -- Which landing page the posts point at by default. Matches
    -- campaign_link_pages.slug. Soft reference rather than a foreign key:
    -- retiring a page should not cascade into the record of what was
    -- posted while it existed.
    page_slug   TEXT,

    starts_on   DATE,
    ends_on     DATE,

    -- planning : being written, nothing scheduled yet
    -- active   : posts are going out
    -- done     : ran its course, kept for the record
    -- archived : hidden from the default view
    status      TEXT NOT NULL DEFAULT 'planning',

    created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 2. POSTS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.social_posts (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    campaign_id   UUID REFERENCES public.social_campaigns(id) ON DELETE SET NULL,

    -- A date, not a timestamp. The time of day a post goes out is a
    -- judgement made in the moment by the person posting; pretending to
    -- schedule it to the minute would be precision this system does not
    -- have and cannot act on.
    scheduled_for DATE NOT NULL,

    -- Second and third post of the same day on the same channel. Ordering
    -- only, no meaning beyond it.
    slot          SMALLINT NOT NULL DEFAULT 1,

    -- Matches campaign_link_channels.source, which is also the utm_source.
    -- Keeping the same spelling is what stops tagged clicks and untagged
    -- referrer traffic from landing in two separate rows in the dashboard.
    channel       TEXT NOT NULL,

    -- The words. Empty is allowed: a card often carries the whole message
    -- and an empty caption is a real editorial choice, not an unfinished
    -- one.
    caption       TEXT NOT NULL DEFAULT '',

    -- The tracked URL, stored built rather than derived. What was actually
    -- posted has to stay readable even after a channel is renamed or a
    -- landing page is retired.
    link_url      TEXT,
    page_slug     TEXT,

    -- The card. A carousel sets both: asset_id is slide one, which is what
    -- previews, and set_id is the whole set to download.
    asset_id      UUID REFERENCES public.social_image_assets(id) ON DELETE SET NULL,
    set_id        UUID,

    alt_text      TEXT,

    -- draft   : being written, or proposed by KIPP and not looked at yet
    -- ready    : approved to post. The morning message only carries these.
    -- posted   : out in the world
    -- skipped  : deliberately not posted, kept so the gap is explained
    status        TEXT NOT NULL DEFAULT 'draft',

    source        TEXT NOT NULL DEFAULT 'studio',

    -- Why this post, in the proposer's words. Same contract as the note on
    -- a card: a packet a reviewer has to reverse engineer is one that sits.
    note          TEXT,

    posted_at     TIMESTAMPTZ,

    -- Stamped by the morning job so a post is never announced twice. The
    -- job reads this, not the date, which is what makes a delayed or
    -- re-run job harmless.
    notified_at   TIMESTAMPTZ,

    created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'social_campaigns_status_check') THEN
        ALTER TABLE public.social_campaigns
            ADD CONSTRAINT social_campaigns_status_check
            CHECK (status IN ('planning', 'active', 'done', 'archived'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'social_posts_status_check') THEN
        ALTER TABLE public.social_posts
            ADD CONSTRAINT social_posts_status_check
            CHECK (status IN ('draft', 'ready', 'posted', 'skipped'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'social_posts_source_check') THEN
        ALTER TABLE public.social_posts
            ADD CONSTRAINT social_posts_source_check
            CHECK (source IN ('studio', 'kipp'));
    END IF;
END $$;

-- The morning job's query: everything on one date that is ready and has
-- not been announced. Leading with scheduled_for because every read of
-- this table is a date range.
CREATE INDEX IF NOT EXISTS social_posts_schedule_idx
    ON public.social_posts (scheduled_for, slot, channel);
CREATE INDEX IF NOT EXISTS social_posts_status_idx
    ON public.social_posts (status, scheduled_for);
CREATE INDEX IF NOT EXISTS social_posts_campaign_idx
    ON public.social_posts (campaign_id, scheduled_for);
CREATE INDEX IF NOT EXISTS social_posts_asset_idx
    ON public.social_posts (asset_id);

CREATE INDEX IF NOT EXISTS social_campaigns_status_idx
    ON public.social_campaigns (status, starts_on DESC);

-- ---------------------------------------------------------------------
-- 3. UPDATED_AT
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_social_calendar_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS social_campaigns_touch ON public.social_campaigns;
CREATE TRIGGER social_campaigns_touch
    BEFORE UPDATE ON public.social_campaigns
    FOR EACH ROW EXECUTE FUNCTION public.touch_social_calendar_updated_at();

DROP TRIGGER IF EXISTS social_posts_touch ON public.social_posts;
CREATE TRIGGER social_posts_touch
    BEFORE UPDATE ON public.social_posts
    FOR EACH ROW EXECUTE FUNCTION public.touch_social_calendar_updated_at();

-- ---------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
--
-- Admin-only end to end, matching social_image_assets. The public never
-- reads either table: an approved card is served from the storage bucket,
-- which has its own public read policy.
-- ---------------------------------------------------------------------
ALTER TABLE public.social_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read social campaigns" ON public.social_campaigns;
CREATE POLICY "Admins read social campaigns"
    ON public.social_campaigns FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Admins write social campaigns" ON public.social_campaigns;
CREATE POLICY "Admins write social campaigns"
    ON public.social_campaigns FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Admins read social posts" ON public.social_posts;
CREATE POLICY "Admins read social posts"
    ON public.social_posts FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Admins write social posts" ON public.social_posts;
CREATE POLICY "Admins write social posts"
    ON public.social_posts FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

COMMENT ON TABLE public.social_campaigns IS
    'A named social push. Groups posts and supplies the utm_campaign. Landing pages and channels stay in campaign_link_pages / campaign_link_channels.';
COMMENT ON TABLE public.social_posts IS
    'One post: date, channel, caption, tracked link and card. Status ready is what the morning Slack job reads; nothing here ever posts by itself.';
