-- ---------------------------------------------------------------------
-- The demo library: folders, and the videos in them.
--
-- The video files are not here and never will be. They live at Mux, and
-- what this table holds is the playback ID plus the words around it. A
-- screen recording is hundreds of megabytes that has to become an
-- adaptive ladder, a poster frame, a scrub preview and an HLS manifest
-- before anybody can watch it on a phone on hotel wifi, and all of that
-- is addressed off one 40-character string. Storing the file instead
-- would mean one enormous MP4 downloaded in full at one bitrate by every
-- visitor.
--
-- Two things about the shape are worth stating.
--
-- **A folder is a section, not a filter.** The public page stacks folders
-- as headed sections rather than offering tabs, because a tab bar over
-- three demos is chrome pretending to be navigation. If the library ever
-- grows past that, the folder rows already carry everything a filter UI
-- would need.
--
-- **Position is an integer that the console rewrites.** Ordering is a
-- decision a person makes by looking at the page, so it is stored rather
-- than derived from a date. Gaps are fine and expected; nothing reads
-- position except ORDER BY.
--
-- The lifecycle is where most of the care is. A row exists *before* the
-- file does: the console creates it to get a Mux upload URL, the browser
-- PUTs straight to Mux, and the asset becomes playable a minute or two
-- later. So `playback_id` is nullable and `status` is the truth about
-- whether there is anything to watch. The public read policy requires
-- both `published` and a playback ID, which is what stops a half-uploaded
-- row from rendering as a broken card.
-- ---------------------------------------------------------------------

/* ------------------------------------------------------------------ */
/*  1. Folders                                                         */
/* ------------------------------------------------------------------ */

CREATE TABLE IF NOT EXISTS public.demo_folders (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    slug        TEXT NOT NULL,
    name        TEXT NOT NULL,

    /* One optional sentence under the section heading. Most folders will
       not want one, which is why it is nullable rather than ''. */
    description TEXT,

    position    INTEGER NOT NULL DEFAULT 0,
    archived    BOOLEAN NOT NULL DEFAULT FALSE,

    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT demo_folders_slug_check
        CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

COMMENT ON TABLE public.demo_folders IS
    'Sections of the demo library at /demos. A folder is a heading on the public page, not a filter.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_demo_folders_slug
    ON public.demo_folders (slug) WHERE NOT archived;

CREATE INDEX IF NOT EXISTS idx_demo_folders_position
    ON public.demo_folders (position) WHERE NOT archived;

/* ------------------------------------------------------------------ */
/*  2. Videos                                                          */
/* ------------------------------------------------------------------ */

CREATE TABLE IF NOT EXISTS public.demo_videos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    /* A video with no folder is an orphan, not an error: it shows in an
       "Unsorted" section in the console so it can be filed, and stays off
       the public page until it is. ON DELETE SET NULL rather than CASCADE
       because deleting a folder must never delete a recording. */
    folder_id       UUID REFERENCES public.demo_folders (id) ON DELETE SET NULL,

    /* The public address: /demos?v=<slug>. Permanent once shared, which
       is why renaming a title does not touch it. */
    slug            TEXT NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT,

    /* ---- Mux ---------------------------------------------------------
       `mux_upload_id` is handed back when the console asks for an upload
       URL, and is the only handle that exists while the bytes are still
       moving. `mux_asset_id` arrives once Mux has accepted the file, and
       is what a deletion has to go through. `playback_id` is last and is
       the only one of the three the public page ever sees. */
    mux_upload_id   TEXT,
    mux_asset_id    TEXT,
    playback_id     TEXT,

    /* Reported by Mux on the finished asset rather than typed. */
    duration_seconds NUMERIC,

    /* Seconds into the video for the poster frame. Mux defaults to the
       midpoint, which on a screen recording is reliably a half-open menu
       with the cursor mid-drag, so this is worth setting by hand. */
    thumbnail_time  NUMERIC NOT NULL DEFAULT 0,

    /* Where the bytes are.
         pending     row exists, upload URL issued, nothing sent yet
         uploading   the browser is PUTting
         processing  Mux has the file and is encoding
         ready       there is a playback ID and it plays
         errored     Mux refused it; `error` says why */
    status          TEXT NOT NULL DEFAULT 'pending',
    error           TEXT,

    /* Held apart from status on purpose. "Mux has finished encoding" and
       "a person decided this should be on the website" are different
       facts, and conflating them means every upload goes live the moment
       it finishes processing. */
    published       BOOLEAN NOT NULL DEFAULT FALSE,
    published_at    TIMESTAMP WITH TIME ZONE,

    position        INTEGER NOT NULL DEFAULT 0,

    created_by      UUID REFERENCES public.admin_users (user_id) ON DELETE SET NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT demo_videos_slug_check
        CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    CONSTRAINT demo_videos_status_check
        CHECK (status IN ('pending', 'uploading', 'processing', 'ready', 'errored'))
);

COMMENT ON TABLE public.demo_videos IS
    'One row per walkthrough at /demos. The file is at Mux; this holds the playback ID and the words around it.';

COMMENT ON COLUMN public.demo_videos.published IS
    'A person decided this should be on the website. Deliberately not the same fact as status = ready, or every upload would go live the moment Mux finished encoding it.';

COMMENT ON COLUMN public.demo_videos.thumbnail_time IS
    'Seconds into the video for the poster frame. Mux defaults to the midpoint, which on a screen recording is reliably a half-open menu with the cursor mid-drag.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_demo_videos_slug
    ON public.demo_videos (slug);

CREATE INDEX IF NOT EXISTS idx_demo_videos_folder
    ON public.demo_videos (folder_id, position);

/* The public page's exact query: published, playable, in order. */
CREATE INDEX IF NOT EXISTS idx_demo_videos_public
    ON public.demo_videos (position)
    WHERE published AND playback_id IS NOT NULL;

/* Mux webhooks and the polling fallback both arrive holding an upload or
   asset id rather than our own, so both need to be findable. */
CREATE INDEX IF NOT EXISTS idx_demo_videos_upload
    ON public.demo_videos (mux_upload_id) WHERE mux_upload_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_demo_videos_asset
    ON public.demo_videos (mux_asset_id) WHERE mux_asset_id IS NOT NULL;

/* ------------------------------------------------------------------ */
/*  3. updated_at                                                      */
/* ------------------------------------------------------------------ */

CREATE OR REPLACE FUNCTION public.touch_demo_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_demo_folders_touch ON public.demo_folders;
CREATE TRIGGER trg_demo_folders_touch
    BEFORE UPDATE ON public.demo_folders
    FOR EACH ROW EXECUTE FUNCTION public.touch_demo_updated_at();

DROP TRIGGER IF EXISTS trg_demo_videos_touch ON public.demo_videos;
CREATE TRIGGER trg_demo_videos_touch
    BEFORE UPDATE ON public.demo_videos
    FOR EACH ROW EXECUTE FUNCTION public.touch_demo_updated_at();

/* Stamp published_at the first time a video is published, and clear it if
   it is ever unpublished. Held in a trigger rather than in the server
   action so a write that goes around the console still gets it right. */
CREATE OR REPLACE FUNCTION public.stamp_demo_published_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.published AND NOT COALESCE(OLD.published, FALSE) THEN
        NEW.published_at := COALESCE(NEW.published_at, timezone('utc'::text, now()));
    ELSIF NOT NEW.published THEN
        NEW.published_at := NULL;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_demo_videos_published_at ON public.demo_videos;
CREATE TRIGGER trg_demo_videos_published_at
    BEFORE INSERT OR UPDATE OF published ON public.demo_videos
    FOR EACH ROW EXECUTE FUNCTION public.stamp_demo_published_at();

/* ------------------------------------------------------------------ */
/*  4. Row level security                                              */
/* ------------------------------------------------------------------ */

ALTER TABLE public.demo_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_videos  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads live folders"    ON public.demo_folders;
DROP POLICY IF EXISTS "Console reads all folders"    ON public.demo_folders;
DROP POLICY IF EXISTS "Writers manage folders"       ON public.demo_folders;
DROP POLICY IF EXISTS "Anyone reads live demos"      ON public.demo_videos;
DROP POLICY IF EXISTS "Console reads all demos"      ON public.demo_videos;
DROP POLICY IF EXISTS "Writers create demos"         ON public.demo_videos;
DROP POLICY IF EXISTS "Writers update demos"         ON public.demo_videos;
DROP POLICY IF EXISTS "Writers delete demos"         ON public.demo_videos;

/* The public page is served to signed-out visitors with the anon key, so
   the read has to be open to `anon` and narrowed by the WHERE clause
   rather than by a role check. Only live folders and only videos that a
   person published AND that actually have something to play. */
CREATE POLICY "Anyone reads live folders"
    ON public.demo_folders FOR SELECT TO anon, authenticated
    USING (NOT archived);

CREATE POLICY "Anyone reads live demos"
    ON public.demo_videos FOR SELECT TO anon, authenticated
    USING (published AND playback_id IS NOT NULL AND status = 'ready');

/* The console needs the rest: drafts, half-processed uploads, failures.
   A second permissive SELECT policy widens rather than narrows, which is
   what is wanted — a signed-in editor sees everything, a visitor sees the
   published subset, and neither policy has to know about the other. */
CREATE POLICY "Console reads all folders"
    ON public.demo_folders FOR SELECT TO authenticated
    USING (public.has_console_access());

CREATE POLICY "Console reads all demos"
    ON public.demo_videos FOR SELECT TO authenticated
    USING (public.has_console_access());

/* Writing is owner and admin, the same bar as the release notes next
   door and for the same reason: a demo video is a product claim that
   ships to the marketing site. */
CREATE POLICY "Writers manage folders"
    ON public.demo_folders FOR ALL TO authenticated
    USING (public.is_owner_or_admin())
    WITH CHECK (public.is_owner_or_admin());

CREATE POLICY "Writers create demos"
    ON public.demo_videos FOR INSERT TO authenticated
    WITH CHECK (public.is_owner_or_admin());

CREATE POLICY "Writers update demos"
    ON public.demo_videos FOR UPDATE TO authenticated
    USING (public.is_owner_or_admin())
    WITH CHECK (public.is_owner_or_admin());

CREATE POLICY "Writers delete demos"
    ON public.demo_videos FOR DELETE TO authenticated
    USING (public.is_owner_or_admin());

/* ------------------------------------------------------------------ */
/*  5. The first folder                                                */
/* ------------------------------------------------------------------ */

/* One folder so the console opens onto something rather than onto an
   empty state explaining what a folder is. */
INSERT INTO public.demo_folders (slug, name, description, position)
VALUES ('product-tour', 'Product tour', 'Start here.', 0)
ON CONFLICT DO NOTHING;
