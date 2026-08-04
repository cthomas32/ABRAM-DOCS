-- =====================================================================
-- SOCIAL BACKDROPS
--
-- Photographs that go behind a card, uploaded from the studio.
--
-- The drawn skies in `backdrops.ts` need no asset and no deploy to use,
-- which is why they are the default. A real photograph is the register
-- that carries furthest on a feed, and asking for a commit every time
-- somebody finds one puts a working morning behind a pull request. These
-- live in a bucket instead, and a card names one by storage path.
--
-- The row is a record of what was uploaded and what it is called. The
-- rendering half stays where it already was: a spec carries the path, the
-- crop and the scrim, so a card is still a pure function of its spec and
-- nothing here has to be read to draw one.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. STORAGE BUCKET
-- Public read, because the renderer fetches the file on a server action
-- during approval, where there is no caller session to borrow. Writes are
-- signed in, same as the card bucket beside it.
-- ---------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'social-backdrops',
    'social-backdrops',
    TRUE,
    12582912, -- 12 MB. Anything larger is a slow render on every card that uses it.
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
    SET public = TRUE,
        file_size_limit = 12582912,
        allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read of social backdrops" ON storage.objects;
CREATE POLICY "Public read of social backdrops"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'social-backdrops');

DROP POLICY IF EXISTS "Admins upload social backdrops" ON storage.objects;
CREATE POLICY "Admins upload social backdrops"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'social-backdrops');

DROP POLICY IF EXISTS "Admins replace social backdrops" ON storage.objects;
CREATE POLICY "Admins replace social backdrops"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'social-backdrops')
    WITH CHECK (bucket_id = 'social-backdrops');

DROP POLICY IF EXISTS "Admins remove social backdrops" ON storage.objects;
CREATE POLICY "Admins remove social backdrops"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'social-backdrops');

-- ---------------------------------------------------------------------
-- 2. THE LIBRARY
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.social_backdrop_images (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- What to call it in the picker. Defaults to the filename, which is
    -- usually a camera's idea of a name, so it is editable.
    label         TEXT NOT NULL,

    -- The path inside the bucket. This is what a card stores, so it never
    -- changes once something has been drawn on top of it.
    storage_path  TEXT NOT NULL UNIQUE,
    public_url    TEXT NOT NULL,

    -- The colour under the picture. It is what shows while the file is
    -- loading and if the file has gone missing, so a card degrades to a
    -- plain dark one rather than to white.
    base_color    TEXT NOT NULL DEFAULT '#0A0A0A',

    -- The uploaded pixel size, measured in the browser before the upload.
    -- Only used to warn that a picture is too small for a story.
    width         INTEGER,
    height        INTEGER,
    bytes         INTEGER,

    created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS social_backdrop_images_created_idx
    ON public.social_backdrop_images (created_at DESC);

-- ---------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
-- Admin-only end to end, like the card library. The public never reads
-- this table; an approved card carries the picture baked into its PNG.
-- ---------------------------------------------------------------------
ALTER TABLE public.social_backdrop_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read social backdrops" ON public.social_backdrop_images;
CREATE POLICY "Admins read social backdrops"
    ON public.social_backdrop_images FOR SELECT TO authenticated
    USING (TRUE);

DROP POLICY IF EXISTS "Admins write social backdrops" ON public.social_backdrop_images;
CREATE POLICY "Admins write social backdrops"
    ON public.social_backdrop_images FOR INSERT TO authenticated
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Admins update social backdrops" ON public.social_backdrop_images;
CREATE POLICY "Admins update social backdrops"
    ON public.social_backdrop_images FOR UPDATE TO authenticated
    USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Admins delete social backdrops" ON public.social_backdrop_images;
CREATE POLICY "Admins delete social backdrops"
    ON public.social_backdrop_images FOR DELETE TO authenticated
    USING (TRUE);

COMMENT ON TABLE public.social_backdrop_images IS
    'Photographs uploaded for use behind social cards. A card stores the storage_path, so a row here is never read to render one.';
