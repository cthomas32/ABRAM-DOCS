-- =====================================================================
-- SOCIAL IMAGE LIBRARY
--
-- Turns the backdrop uploads into a library somebody keeps rather than a
-- pile of files somebody drops.
--
-- Two things were missing. A picture arrived called DSCF4831, because the
-- label defaulted to the filename and nothing ever asked for a better one,
-- so a library of thirty images was thirty camera serial numbers. And
-- there was nowhere to record who took the photograph, which matters the
-- first time one of these goes out on a paid post and somebody asks.
--
-- `label` already exists and is the title. This adds the credit, and the
-- record of what the compression actually saved, which is the only way to
-- tell later whether a picture in here is the full-size original or the
-- version the browser scaled on the way in.
-- =====================================================================

ALTER TABLE public.social_backdrop_images
    -- Who took it. Optional on purpose: plenty of these are stills off our
    -- own shoots and a required field would get filled with "us".
    ADD COLUMN IF NOT EXISTS credit TEXT,

    -- And where to find them. Stored bare, without the @, so it can be
    -- written into a caption as a tag or into a card as a line without
    -- either place having to strip anything. A tag in the caption is the
    -- half of a credit the creator actually sees.
    ADD COLUMN IF NOT EXISTS credit_handle TEXT,

    -- What the file weighed before the browser scaled and re-encoded it.
    -- `bytes` is what actually landed in the bucket, so the pair is the
    -- record of the saving. Null on anything uploaded before this existed.
    ADD COLUMN IF NOT EXISTS original_bytes INTEGER;

COMMENT ON COLUMN public.social_backdrop_images.credit IS
    'Who took the photograph. Optional, and either this or credit_handle is enough to credit them.';

COMMENT ON COLUMN public.social_backdrop_images.credit_handle IS
    'Their social handle, stored without the @. Goes in the caption as a tag and on the card as a faint line.';

COMMENT ON COLUMN public.social_backdrop_images.original_bytes IS
    'Size of the file the person chose, before the browser scaled and re-encoded it. Null for anything uploaded before compression existed.';

-- A library gets searched by name long before it gets scrolled, and the
-- studio filters on the title as you type.
CREATE INDEX IF NOT EXISTS social_backdrop_images_label_idx
    ON public.social_backdrop_images (LOWER(label));
