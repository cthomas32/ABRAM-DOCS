-- =====================================================================
-- QR DESIGN STUDIO
-- 4 August 2026
--
-- Somewhere to keep the design a printed code is drawn with.
--
-- A design is a spec rather than a picture, exactly as a social card is: a
-- template, a size, a palette, an ink and a few lines of copy. Rendering is
-- a pure function of that, which is why nothing here stores an image. The
-- studio draws the preview and the download in the browser from this
-- object, so changing a template later redraws every code that has not been
-- exported since.
--
-- Additive only. A row with no design behaves exactly as it did before, and
-- so does a build that has never heard of this column.
-- =====================================================================

ALTER TABLE public.crm_capture_codes
    ADD COLUMN IF NOT EXISTS design JSONB;

COMMENT ON COLUMN public.crm_capture_codes.design IS
    'The saved QR design for this code: template, size, palette, plate and ink, mark cutout and caption. Read through parseQrDesign in src/lib/crm/qrDesign.ts, which defaults every field, so an older or hand edited object is never a broken render.';
