-- =====================================================================
-- SOCIAL STUDIO
--
-- A library of social images plus the queue KIPP files drafts into.
--
-- The important design decision: a row stores a SPEC, not a picture. The
-- renderer is a pure function of the spec, so a draft can exist with no
-- file behind it and still be previewed. A PNG is only written to storage
-- when someone approves the card, which is also the point at which it
-- earns a stable public address. That keeps the scheduled agent's job to
-- writing a row — it never needs storage credentials or a render budget.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. STORAGE BUCKET
-- Public read so an approved card can be pasted anywhere, writes limited
-- to signed-in admins. Same shape as the link hub bucket.
-- ---------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'social-images',
    'social-images',
    TRUE,
    10485760, -- 10 MB, a 1080x1920 PNG lands well under this
    ARRAY['image/png']
)
ON CONFLICT (id) DO UPDATE
    SET public = TRUE,
        file_size_limit = 10485760,
        allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read of social images" ON storage.objects;
CREATE POLICY "Public read of social images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'social-images');

DROP POLICY IF EXISTS "Admins upload social images" ON storage.objects;
CREATE POLICY "Admins upload social images"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'social-images');

DROP POLICY IF EXISTS "Admins replace social images" ON storage.objects;
CREATE POLICY "Admins replace social images"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'social-images')
    WITH CHECK (bucket_id = 'social-images');

DROP POLICY IF EXISTS "Admins remove social images" ON storage.objects;
CREATE POLICY "Admins remove social images"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'social-images');

-- ---------------------------------------------------------------------
-- 2. THE LIBRARY
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.social_image_assets (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- What this card is for, in your own words. Shown in the library grid
    -- and used to build the download filename.
    title        TEXT NOT NULL,

    -- The whole image. Everything else on this row is derived from it and
    -- stored flat only so the library can filter without opening the JSON.
    spec         JSONB NOT NULL,
    template     TEXT  NOT NULL,
    format       TEXT  NOT NULL,
    theme        TEXT  NOT NULL,
    width        INTEGER NOT NULL,
    height       INTEGER NOT NULL,

    -- draft    : proposed, not rendered to a file yet
    -- approved : rendered, in the bucket, safe to post
    -- archived : kept for the record, hidden from the default view
    status       TEXT NOT NULL DEFAULT 'draft',

    -- Who made it. Drafts from the scheduled agent are reviewed before use.
    source       TEXT NOT NULL DEFAULT 'studio',

    -- Carousels. A set shares one id and orders by slide_index, which is
    -- 1-based; a standalone card has no set and sits at index 0. Slides are
    -- rows rather than an array on one row so a single slide can be
    -- re-rendered, re-approved or swapped without touching the rest.
    set_id       UUID,
    slide_index  INTEGER NOT NULL DEFAULT 0,

    -- Optional links back to what the card is promoting
    campaign_slug TEXT,
    post_slug     TEXT,

    -- The agent's reasoning: where it suggests posting this and why. Free
    -- text on purpose, it is a note to a human, not a machine field.
    note         TEXT,

    -- Set on approval
    storage_path TEXT,
    public_url   TEXT,
    approved_at  TIMESTAMPTZ,

    created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'social_image_assets_status_check') THEN
        ALTER TABLE public.social_image_assets
            ADD CONSTRAINT social_image_assets_status_check
            CHECK (status IN ('draft', 'approved', 'archived'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'social_image_assets_source_check') THEN
        ALTER TABLE public.social_image_assets
            ADD CONSTRAINT social_image_assets_source_check
            CHECK (source IN ('studio', 'kipp'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS social_image_assets_status_idx
    ON public.social_image_assets (status, created_at DESC);
CREATE INDEX IF NOT EXISTS social_image_assets_source_idx
    ON public.social_image_assets (source, created_at DESC);
CREATE INDEX IF NOT EXISTS social_image_assets_format_idx
    ON public.social_image_assets (format);
CREATE INDEX IF NOT EXISTS social_image_assets_set_idx
    ON public.social_image_assets (set_id, slide_index);

-- ---------------------------------------------------------------------
-- 3. UPDATED_AT
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_social_image_assets_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS social_image_assets_updated_at ON public.social_image_assets;
CREATE TRIGGER social_image_assets_updated_at
    BEFORE UPDATE ON public.social_image_assets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_social_image_assets_updated_at();

-- ---------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- The library is an internal tool, so it is admin-only end to end. The
-- public never reads this table: an approved card is served from the
-- storage bucket, which has its own public read policy above.
-- ---------------------------------------------------------------------
ALTER TABLE public.social_image_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read social image assets" ON public.social_image_assets;
CREATE POLICY "Admins read social image assets"
    ON public.social_image_assets FOR SELECT TO authenticated
    USING (TRUE);

DROP POLICY IF EXISTS "Admins write social image assets" ON public.social_image_assets;
CREATE POLICY "Admins write social image assets"
    ON public.social_image_assets FOR INSERT TO authenticated
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Admins update social image assets" ON public.social_image_assets;
CREATE POLICY "Admins update social image assets"
    ON public.social_image_assets FOR UPDATE TO authenticated
    USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Admins delete social image assets" ON public.social_image_assets;
CREATE POLICY "Admins delete social image assets"
    ON public.social_image_assets FOR DELETE TO authenticated
    USING (TRUE);

COMMENT ON TABLE public.social_image_assets IS
    'Social image library. Each row is a render spec; the PNG only exists once the card is approved.';
