-- =====================================================================
-- LINK HUB: OPTIONAL ICONS
-- Some pages read cleaner as pure typography. Turning icons off is the
-- fastest route to a restrained, premium look.
-- =====================================================================
ALTER TABLE public.link_hub_settings
    ADD COLUMN IF NOT EXISTS show_icons BOOLEAN NOT NULL DEFAULT TRUE;
