-- =====================================================================
-- LINK HUB
-- A single shareable page of links (the one URL that goes in a social
-- bio), managed from the admin panel.
--
-- Tables:    link_hub_links, link_hub_settings
-- Functions: record_link_hub_click
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. LINKS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.link_hub_links (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label           TEXT NOT NULL,
    url             TEXT NOT NULL,
    description     TEXT,
    icon            TEXT NOT NULL DEFAULT 'link',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    clicks          INTEGER NOT NULL DEFAULT 0,
    last_clicked_at TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_link_hub_links_order  ON public.link_hub_links (sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_link_hub_links_active ON public.link_hub_links (is_active);

-- ---------------------------------------------------------------------
-- 2. SETTINGS (single row)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.link_hub_settings (
    id          BOOLEAN PRIMARY KEY DEFAULT TRUE,
    heading     TEXT NOT NULL DEFAULT 'ABRAM',
    subheading  TEXT NOT NULL DEFAULT 'The creative operations platform for production teams.',
    footer_note TEXT,
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT link_hub_settings_single_row CHECK (id)
);

INSERT INTO public.link_hub_settings (id) VALUES (TRUE) ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
-- The page is public, so anyone may read. Only signed-in admins write,
-- and click counts are incremented server side through the function
-- below rather than by granting the public an UPDATE.
-- ---------------------------------------------------------------------
ALTER TABLE public.link_hub_links    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_hub_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read of active links" ON public.link_hub_links;
CREATE POLICY "Allow public read of active links"
    ON public.link_hub_links FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert of links" ON public.link_hub_links;
CREATE POLICY "Allow authenticated insert of links"
    ON public.link_hub_links FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update of links" ON public.link_hub_links;
CREATE POLICY "Allow authenticated update of links"
    ON public.link_hub_links FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated delete of links" ON public.link_hub_links;
CREATE POLICY "Allow authenticated delete of links"
    ON public.link_hub_links FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow public read of link settings" ON public.link_hub_settings;
CREATE POLICY "Allow public read of link settings"
    ON public.link_hub_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated update of link settings" ON public.link_hub_settings;
CREATE POLICY "Allow authenticated update of link settings"
    ON public.link_hub_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------
-- 4. CLICK COUNTER
-- Called from the server-side ingest route using the service role.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_link_hub_click(p_link_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.link_hub_links
    SET clicks = clicks + 1,
        last_clicked_at = timezone('utc'::text, now())
    WHERE id = p_link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.record_link_hub_click(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_link_hub_click(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.record_link_hub_click(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.record_link_hub_click(UUID) TO service_role;

-- ---------------------------------------------------------------------
-- 5. SEED
-- Starting set pointing at the conversion pages, so the hub is useful
-- the moment it exists. Safe to edit or delete from the admin panel.
-- ---------------------------------------------------------------------
INSERT INTO public.link_hub_links (label, url, description, icon, sort_order, is_featured)
SELECT * FROM (VALUES
    ('Start free', 'https://abram.network/start', 'Run the whole production from one place', 'rocket', 10, TRUE),
    ('For filmmakers', 'https://abram.network/start/filmmakers', 'Script in, call sheet out', 'clapperboard', 20, FALSE),
    ('For studios and agencies', 'https://abram.network/start/agencies', 'Take on more work without hiring for it', 'building', 30, FALSE),
    ('For post production', 'https://abram.network/start/post-production', 'Get to final cut faster', 'scissors', 40, FALSE),
    ('For gear and crew', 'https://abram.network/start/resource-management', 'Never double book a camera again', 'boxes', 50, FALSE),
    ('The ABRAM assistant', 'https://abram.network/start/ai-assistant', 'Run the platform by asking for it', 'abram', 60, FALSE),
    ('Pricing', 'https://abram.network/pricing', 'Plans, credits and processing fees', 'tag', 70, FALSE),
    ('Help centre', 'https://abram.network/docs', 'Guides for every part of the platform', 'book', 80, FALSE)
) AS seed(label, url, description, icon, sort_order, is_featured)
WHERE NOT EXISTS (SELECT 1 FROM public.link_hub_links);
