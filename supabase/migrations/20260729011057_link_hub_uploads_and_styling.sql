-- =====================================================================
-- LINK HUB UPLOADS AND STYLING
--
-- Adds a storage bucket so avatars, thumbnails and backgrounds are
-- uploaded rather than pasted in as addresses, plus the extra
-- appearance controls: avatar kind (including the ABRAM mark), button
-- size, and blur / darkening for a background image.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. STORAGE BUCKET
-- Public read so the page can render the images, writes limited to
-- signed-in admins.
-- ---------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'link-hub',
    'link-hub',
    TRUE,
    5242880, -- 5 MB
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif']
)
ON CONFLICT (id) DO UPDATE
    SET public = TRUE,
        file_size_limit = 5242880,
        allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read of link hub images" ON storage.objects;
CREATE POLICY "Public read of link hub images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'link-hub');

DROP POLICY IF EXISTS "Admins upload link hub images" ON storage.objects;
CREATE POLICY "Admins upload link hub images"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'link-hub');

DROP POLICY IF EXISTS "Admins replace link hub images" ON storage.objects;
CREATE POLICY "Admins replace link hub images"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'link-hub')
    WITH CHECK (bucket_id = 'link-hub');

DROP POLICY IF EXISTS "Admins remove link hub images" ON storage.objects;
CREATE POLICY "Admins remove link hub images"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'link-hub');

-- ---------------------------------------------------------------------
-- 2. APPEARANCE
-- ---------------------------------------------------------------------
ALTER TABLE public.link_hub_settings
    -- 'abram' renders the brand mark, so the page can carry the product
    -- identity without anyone having to upload the logo.
    ADD COLUMN IF NOT EXISTS avatar_kind        TEXT    NOT NULL DEFAULT 'image',
    ADD COLUMN IF NOT EXISTS button_size        TEXT    NOT NULL DEFAULT 'regular',
    ADD COLUMN IF NOT EXISTS background_blur    INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS background_overlay INTEGER NOT NULL DEFAULT 55;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'link_hub_settings_avatar_kind_check') THEN
        ALTER TABLE public.link_hub_settings
            ADD CONSTRAINT link_hub_settings_avatar_kind_check
            CHECK (avatar_kind IN ('none', 'image', 'abram'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'link_hub_settings_button_size_check') THEN
        ALTER TABLE public.link_hub_settings
            ADD CONSTRAINT link_hub_settings_button_size_check
            CHECK (button_size IN ('compact', 'regular', 'large'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'link_hub_settings_background_blur_check') THEN
        ALTER TABLE public.link_hub_settings
            ADD CONSTRAINT link_hub_settings_background_blur_check
            CHECK (background_blur BETWEEN 0 AND 40);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'link_hub_settings_background_overlay_check') THEN
        ALTER TABLE public.link_hub_settings
            ADD CONSTRAINT link_hub_settings_background_overlay_check
            CHECK (background_overlay BETWEEN 0 AND 90);
    END IF;
END $$;

-- Pages that already have an avatar address keep showing it; the rest
-- start with no avatar rather than an empty frame.
UPDATE public.link_hub_settings
SET avatar_kind = CASE WHEN COALESCE(avatar_url, '') = '' THEN 'none' ELSE 'image' END
WHERE avatar_kind = 'image';
