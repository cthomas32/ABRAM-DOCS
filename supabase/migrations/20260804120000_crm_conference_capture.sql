-- =====================================================================
-- CONFERENCE CAPTURE AND CRM
--
-- Someone at an event scans a printed code, lands on a card at /c/<slug>,
-- saves the contact and leaves their own details. Those details become a
-- contact with a pipeline stage, a timeline and follow ups.
--
-- Tables:    crm_profiles, crm_events, crm_capture_codes, crm_scans,
--            crm_contacts, crm_interactions, crm_tasks, crm_stage_changes
-- Views:     crm_event_stats
-- Functions: crm_touch_updated_at, crm_bump_code_scan, crm_bump_code_capture
--
-- Every table carries profile_id even though there is one profile today.
-- Adding a second person later is then a row rather than a migration.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. SHARED TRIGGER
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.crm_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 1. PROFILES
-- The person whose card gets scanned.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_profiles (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug           TEXT NOT NULL UNIQUE,
    owner_user_id  UUID,
    full_name      TEXT NOT NULL,
    job_title      TEXT,
    company        TEXT DEFAULT 'ABRAM',
    tagline        TEXT,
    bio            TEXT,
    email          TEXT,
    phone          TEXT,
    website        TEXT,
    linkedin_url   TEXT,
    x_url          TEXT,
    calendar_url   TEXT,
    avatar_url     TEXT,
    cta_label      TEXT,
    cta_url        TEXT,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.crm_profiles IS
    'The person whose card is scanned at an event. One row per teammate once the team grows.';

-- ---------------------------------------------------------------------
-- 2. EVENTS
-- A conference, trade show or meetup.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    venue       TEXT,
    city        TEXT,
    country     TEXT,
    starts_on   DATE,
    ends_on     DATE,
    notes       TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON COLUMN public.crm_events.is_active IS
    'The event a scan is attributed to when the code that was scanned does not name one. Set it on the morning of the show.';

CREATE INDEX IF NOT EXISTS idx_crm_events_active ON public.crm_events (is_active) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_crm_events_dates  ON public.crm_events (starts_on DESC);

-- ---------------------------------------------------------------------
-- 3. CAPTURE CODES
-- One row per printed or rendered QR, so a badge sticker can be told
-- apart from a booth banner.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_capture_codes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            TEXT NOT NULL UNIQUE,
    label           TEXT NOT NULL,
    profile_id      UUID NOT NULL REFERENCES public.crm_profiles (id) ON DELETE CASCADE,
    event_id        UUID REFERENCES public.crm_events (id) ON DELETE SET NULL,
    placement       TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    scan_count      INTEGER NOT NULL DEFAULT 0,
    capture_count   INTEGER NOT NULL DEFAULT 0,
    last_scanned_at TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON COLUMN public.crm_capture_codes.code IS
    'Short token appended to the card URL as ?k=. Kept short because every character makes the printed square denser and harder to scan across a room.';

CREATE INDEX IF NOT EXISTS idx_crm_codes_profile ON public.crm_capture_codes (profile_id);
CREATE INDEX IF NOT EXISTS idx_crm_codes_event   ON public.crm_capture_codes (event_id);

-- ---------------------------------------------------------------------
-- 4. SCANS
-- Every load of a card page. No raw IP address is stored: the address is
-- hashed with the user agent and a salt that rotates daily, exactly as
-- the landing page telemetry already does.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_scans (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id   UUID NOT NULL REFERENCES public.crm_profiles (id) ON DELETE CASCADE,
    code_id      UUID REFERENCES public.crm_capture_codes (id) ON DELETE SET NULL,
    event_id     UUID REFERENCES public.crm_events (id) ON DELETE SET NULL,
    contact_id   UUID,
    occurred_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    visitor_hash TEXT,
    device       TEXT,
    browser      TEXT,
    os           TEXT,
    referrer     TEXT,
    is_bot       BOOLEAN NOT NULL DEFAULT FALSE,
    converted    BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_crm_scans_profile ON public.crm_scans (profile_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_scans_event   ON public.crm_scans (event_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_scans_code    ON public.crm_scans (code_id);

-- ---------------------------------------------------------------------
-- 5. CONTACTS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_contacts (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id        UUID NOT NULL REFERENCES public.crm_profiles (id) ON DELETE CASCADE,
    client_token      TEXT,
    full_name         TEXT NOT NULL,
    email             TEXT,
    phone             TEXT,
    company           TEXT,
    job_title         TEXT,
    website           TEXT,
    linkedin_url      TEXT,
    city              TEXT,
    country           TEXT,
    notes             TEXT,
    met_context       TEXT,
    met_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    event_id          UUID REFERENCES public.crm_events (id) ON DELETE SET NULL,
    code_id           UUID REFERENCES public.crm_capture_codes (id) ON DELETE SET NULL,
    scan_id           UUID REFERENCES public.crm_scans (id) ON DELETE SET NULL,
    source            TEXT NOT NULL DEFAULT 'qr_card',
    stage             TEXT NOT NULL DEFAULT 'new',
    priority          TEXT NOT NULL DEFAULT 'normal',
    tags              TEXT[] NOT NULL DEFAULT '{}',
    consent_marketing BOOLEAN NOT NULL DEFAULT FALSE,
    consent_at        TIMESTAMP WITH TIME ZONE,
    vcard_sent_at     TIMESTAMP WITH TIME ZONE,
    notified_at       TIMESTAMP WITH TIME ZONE,
    last_activity_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    next_follow_up_at TIMESTAMP WITH TIME ZONE,
    archived          BOOLEAN NOT NULL DEFAULT FALSE,
    captured_offline  BOOLEAN NOT NULL DEFAULT FALSE,
    captured_at       TIMESTAMP WITH TIME ZONE,
    raw               JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT crm_contacts_stage_check
        CHECK (stage IN ('new', 'contacted', 'qualified', 'opportunity', 'won', 'lost')),
    CONSTRAINT crm_contacts_priority_check
        CHECK (priority IN ('hot', 'normal', 'low')),
    CONSTRAINT crm_contacts_source_check
        CHECK (source IN ('qr_card', 'capture_mode', 'manual', 'import'))
);

COMMENT ON COLUMN public.crm_contacts.client_token IS
    'Generated on the device before the first send attempt. An offline retry that already reached us updates this row rather than creating a second one.';
COMMENT ON COLUMN public.crm_contacts.captured_at IS
    'Device clock at the moment of capture, which can be hours before the row reached the server on a bad network.';

-- Idempotency for retried offline sends.
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_contacts_client_token
    ON public.crm_contacts (client_token)
    WHERE client_token IS NOT NULL;

-- One live row per person per owner. The ingest route looks a contact up
-- before writing; this index is the backstop if two requests race.
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_contacts_owner_email
    ON public.crm_contacts (profile_id, lower(email))
    WHERE email IS NOT NULL AND archived = FALSE;

CREATE INDEX IF NOT EXISTS idx_crm_contacts_stage    ON public.crm_contacts (profile_id, stage) WHERE NOT archived;
CREATE INDEX IF NOT EXISTS idx_crm_contacts_event    ON public.crm_contacts (event_id, met_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_recent   ON public.crm_contacts (profile_id, met_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_followup ON public.crm_contacts (next_follow_up_at) WHERE next_follow_up_at IS NOT NULL AND NOT archived;
CREATE INDEX IF NOT EXISTS idx_crm_contacts_tags     ON public.crm_contacts USING GIN (tags);

-- ---------------------------------------------------------------------
-- 6. INTERACTIONS
-- The timeline on a contact.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_interactions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id  UUID NOT NULL REFERENCES public.crm_contacts (id) ON DELETE CASCADE,
    kind        TEXT NOT NULL,
    body        TEXT,
    meta        JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    author      TEXT,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT crm_interactions_kind_check CHECK (kind IN (
        'capture', 'scan', 'note', 'email_sent', 'email_received',
        'call', 'meeting', 'stage_change', 'task_created', 'task_done', 'rescan'
    ))
);

CREATE INDEX IF NOT EXISTS idx_crm_interactions_contact
    ON public.crm_interactions (contact_id, occurred_at DESC);

-- ---------------------------------------------------------------------
-- 7. TASKS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_tasks (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id   UUID NOT NULL REFERENCES public.crm_contacts (id) ON DELETE CASCADE,
    title        TEXT NOT NULL,
    details      TEXT,
    due_at       TIMESTAMP WITH TIME ZONE,
    status       TEXT NOT NULL DEFAULT 'open',
    priority     TEXT NOT NULL DEFAULT 'normal',
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT crm_tasks_status_check CHECK (status IN ('open', 'done', 'snoozed', 'cancelled')),
    CONSTRAINT crm_tasks_priority_check CHECK (priority IN ('hot', 'normal', 'low'))
);

CREATE INDEX IF NOT EXISTS idx_crm_tasks_open
    ON public.crm_tasks (due_at) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_crm_tasks_contact
    ON public.crm_tasks (contact_id, status);

-- ---------------------------------------------------------------------
-- 8. STAGE CHANGES
-- Kept separate from interactions so the funnel can be measured without
-- parsing free text.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_stage_changes (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES public.crm_contacts (id) ON DELETE CASCADE,
    from_stage TEXT,
    to_stage   TEXT NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    note       TEXT
);

CREATE INDEX IF NOT EXISTS idx_crm_stage_changes_contact
    ON public.crm_stage_changes (contact_id, changed_at DESC);

-- ---------------------------------------------------------------------
-- 9. UPDATED AT TRIGGERS
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_crm_profiles_touch ON public.crm_profiles;
CREATE TRIGGER trg_crm_profiles_touch BEFORE UPDATE ON public.crm_profiles
    FOR EACH ROW EXECUTE FUNCTION public.crm_touch_updated_at();

DROP TRIGGER IF EXISTS trg_crm_events_touch ON public.crm_events;
CREATE TRIGGER trg_crm_events_touch BEFORE UPDATE ON public.crm_events
    FOR EACH ROW EXECUTE FUNCTION public.crm_touch_updated_at();

DROP TRIGGER IF EXISTS trg_crm_codes_touch ON public.crm_capture_codes;
CREATE TRIGGER trg_crm_codes_touch BEFORE UPDATE ON public.crm_capture_codes
    FOR EACH ROW EXECUTE FUNCTION public.crm_touch_updated_at();

DROP TRIGGER IF EXISTS trg_crm_contacts_touch ON public.crm_contacts;
CREATE TRIGGER trg_crm_contacts_touch BEFORE UPDATE ON public.crm_contacts
    FOR EACH ROW EXECUTE FUNCTION public.crm_touch_updated_at();

DROP TRIGGER IF EXISTS trg_crm_tasks_touch ON public.crm_tasks;
CREATE TRIGGER trg_crm_tasks_touch BEFORE UPDATE ON public.crm_tasks
    FOR EACH ROW EXECUTE FUNCTION public.crm_touch_updated_at();

-- ---------------------------------------------------------------------
-- 10. COUNTERS
-- Called from the ingest routes with the service role, so the public is
-- never granted UPDATE on the codes table.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.crm_bump_code_scan(p_code_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.crm_capture_codes
       SET scan_count      = scan_count + 1,
           last_scanned_at = timezone('utc'::text, now())
     WHERE id = p_code_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.crm_bump_code_capture(p_code_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.crm_capture_codes
       SET capture_count = capture_count + 1
     WHERE id = p_code_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------
-- 11. EVENT ROLLUP
-- What a conference actually produced, which is the number worth knowing
-- when deciding whether to buy a stand again next year.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW public.crm_event_stats AS
SELECT
    e.id                                                   AS event_id,
    e.slug,
    e.name,
    e.starts_on,
    e.ends_on,
    COUNT(DISTINCT s.id) FILTER (WHERE NOT s.is_bot)       AS scans,
    COUNT(DISTINCT s.visitor_hash) FILTER (WHERE NOT s.is_bot) AS unique_scanners,
    COUNT(DISTINCT c.id) FILTER (WHERE NOT c.archived)     AS contacts,
    COUNT(DISTINCT c.id) FILTER (WHERE c.stage IN ('qualified', 'opportunity', 'won')) AS qualified,
    COUNT(DISTINCT c.id) FILTER (WHERE c.stage = 'won')    AS won
FROM public.crm_events e
LEFT JOIN public.crm_scans    s ON s.event_id = e.id
LEFT JOIN public.crm_contacts c ON c.event_id = e.id
GROUP BY e.id, e.slug, e.name, e.starts_on, e.ends_on;

-- ---------------------------------------------------------------------
-- 12. ROW LEVEL SECURITY
--
-- A card is public by design, so anyone may read an active profile. Every
-- other table is closed: the console reads and writes as a signed in
-- admin, and captures from strangers arrive through a server route using
-- the service role, which bypasses these policies.
-- ---------------------------------------------------------------------
ALTER TABLE public.crm_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_capture_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_scans         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contacts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_interactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_tasks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_stage_changes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read of active cards" ON public.crm_profiles;
CREATE POLICY "Public read of active cards"
    ON public.crm_profiles FOR SELECT USING (is_active);

DROP POLICY IF EXISTS "Admins manage profiles" ON public.crm_profiles;
CREATE POLICY "Admins manage profiles"
    ON public.crm_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage events" ON public.crm_events;
CREATE POLICY "Admins manage events"
    ON public.crm_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage codes" ON public.crm_capture_codes;
CREATE POLICY "Admins manage codes"
    ON public.crm_capture_codes FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins read scans" ON public.crm_scans;
CREATE POLICY "Admins read scans"
    ON public.crm_scans FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage contacts" ON public.crm_contacts;
CREATE POLICY "Admins manage contacts"
    ON public.crm_contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage interactions" ON public.crm_interactions;
CREATE POLICY "Admins manage interactions"
    ON public.crm_interactions FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage tasks" ON public.crm_tasks;
CREATE POLICY "Admins manage tasks"
    ON public.crm_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins read stage changes" ON public.crm_stage_changes;
CREATE POLICY "Admins read stage changes"
    ON public.crm_stage_changes FOR ALL TO authenticated USING (true) WITH CHECK (true);
