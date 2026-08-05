-- =====================================================================
-- TEAM MEMBERS
--
-- One row per person who works here, and the single place their name,
-- job title and photograph are written down.
--
-- Before this, a blog byline was free text ("Connor Thomas, Founder &
-- Creative") with the photo URL copied onto every post, kept in step by
-- the editor rewriting all of them whenever it changed. A contact card
-- held the same details again. Three copies of one fact.
--
-- Both now point here. The columns they already had stay put and act as
-- overrides, so nothing breaks while they are still populated and a
-- person can differ from the shared record where it genuinely should.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.team_members (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug         TEXT NOT NULL UNIQUE,
    full_name    TEXT NOT NULL,
    job_title    TEXT,
    photo_url    TEXT,
    short_bio    TEXT,
    email        TEXT,
    linkedin_url TEXT,
    x_url        TEXT,
    website      TEXT,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order   INTEGER NOT NULL DEFAULT 0,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.team_members IS
    'The people who work here. Single source of truth for a name, job title and photograph, read by blog bylines and by contact cards.';
COMMENT ON COLUMN public.team_members.job_title IS
    'Kept separate from the name on purpose. The old blog author field held both in one string, which made it impossible to render a byline and a card differently.';

CREATE INDEX IF NOT EXISTS idx_team_members_active ON public.team_members (is_active, sort_order);

DROP TRIGGER IF EXISTS trg_team_members_touch ON public.team_members;
CREATE TRIGGER trg_team_members_touch BEFORE UPDATE ON public.team_members
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- LINKS FROM WHAT ALREADY EXISTS
--
-- Both are nullable and both are ON DELETE SET NULL. Removing a person
-- must never take a published post or a live card down with them.
-- ---------------------------------------------------------------------
ALTER TABLE public.blog_posts
    ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES public.team_members (id) ON DELETE SET NULL;

ALTER TABLE public.crm_profiles
    ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES public.team_members (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_blog_posts_member   ON public.blog_posts (member_id);
CREATE INDEX IF NOT EXISTS idx_crm_profiles_member ON public.crm_profiles (member_id);

COMMENT ON COLUMN public.blog_posts.member_id IS
    'The author as a team member. The legacy author and author_avatar columns remain as a fallback for posts written before this existed.';
COMMENT ON COLUMN public.crm_profiles.member_id IS
    'Identity for this card. Name, job title and photo come from here unless the card overrides them.';

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY
--
-- A byline is public, so anyone may read an active member. Everything
-- else is closed to signed in admins.
-- ---------------------------------------------------------------------
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read of active team members" ON public.team_members;
CREATE POLICY "Public read of active team members"
    ON public.team_members FOR SELECT TO anon USING (is_active);

DROP POLICY IF EXISTS "Admins manage team members" ON public.team_members;
CREATE POLICY "Admins manage team members"
    ON public.team_members FOR ALL TO authenticated USING (true) WITH CHECK (true);
