-- ---------------------------------------------------------------------
-- The brain: what the company believes, and how it writes.
--
-- `abram-network/.agents/brain/` holds four files that are the long term
-- memory of the AI employees: BUSINESS, MARKET, DECISIONS and a README
-- setting out the contract between them. They are files on purpose, and
-- the reasoning is written down there: a knowledge change rides the same
-- Approve/Deny pull request flow as a code change, and `git log` on that
-- directory is a literal record of the company getting smarter.
--
-- This is the same idea with a different trade. Here the store is a table
-- and the editor is the console, because the people who need to read the
-- brand voice before writing a page, or the proposal playbook before
-- writing a proposal, are not all people who open a checkout. That buys
-- reach and costs the review step.
--
-- `brain_doc_revisions` is what buys the history back. Every update files
-- the superseded version before overwriting, so "what did this say last
-- month" and "who changed it" both have answers, which is the half of git
-- that actually gets used on a document.
--
-- The five collections mirror the shape over in the other repository so
-- somebody moving between them is not learning a second taxonomy:
--
--   brand      voice, the claims rule, what may be said out loud
--   business   what ABRAM is, who it is for, what it charges
--   market     competitors, category, pricing benchmarks
--   decisions  settled questions, append only, reversals supersede
--   proposals  how a proposal is written, and the exemplars
--
-- Read is open to anybody who can enter the console, because a brand
-- voice nobody can read is a brand voice nobody follows. Write is owner
-- and admin. There is no propose-a-change path in a table the way there
-- is in a pull request, so widening the write side would quietly turn
-- "an agent thinks this" into "the company believes this" with nobody
-- deciding. That is the one property of the file version worth keeping.
-- ---------------------------------------------------------------------

/* ------------------------------------------------------------------ */
/*  1. The documents                                                   */
/* ------------------------------------------------------------------ */

CREATE TABLE IF NOT EXISTS public.brain_docs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    collection       TEXT NOT NULL,
    slug             TEXT NOT NULL,
    title            TEXT NOT NULL,
    summary          TEXT,
    body_md          TEXT NOT NULL DEFAULT '',

    /* Who answers for it. The file version names an owner at the top of
       every document and this is the same fact, held where it can be
       joined rather than typed. */
    owner_user_id    UUID REFERENCES public.admin_users (user_id) ON DELETE SET NULL,

    status           TEXT NOT NULL DEFAULT 'draft',
    tags             TEXT[] NOT NULL DEFAULT '{}',

    /* Everything decays. The file convention stamps `_Last verified:_` on
       every section; this is the document level version of it, and a date
       more than ninety days old means the content is a lead rather than a
       fact. Nullable because a draft has never been verified. */
    last_verified_on DATE,

    archived         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT brain_docs_collection_check
        CHECK (collection IN ('brand', 'business', 'market', 'decisions', 'proposals')),
    CONSTRAINT brain_docs_status_check
        CHECK (status IN ('draft', 'published')),
    CONSTRAINT brain_docs_slug_check
        CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

COMMENT ON TABLE public.brain_docs IS
    'What the company believes and how it writes. The console-editable sibling of abram-network/.agents/brain/. Read by every console role and by the MCP server; written by owner and admin.';

COMMENT ON COLUMN public.brain_docs.last_verified_on IS
    'The document level version of the _Last verified:_ stamp the file convention puts on every section. More than ninety days old means a lead rather than a fact.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_brain_docs_slug
    ON public.brain_docs (collection, slug) WHERE NOT archived;

CREATE INDEX IF NOT EXISTS idx_brain_docs_collection
    ON public.brain_docs (collection) WHERE NOT archived;

/* Full text over title, summary and body, so the MCP's search tool is one
   query rather than a scan. English rather than simple: a search for
   "pricing" should find "priced". */
CREATE INDEX IF NOT EXISTS idx_brain_docs_search
    ON public.brain_docs
 USING GIN (to_tsvector('english',
        coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(body_md, '')));

/* ------------------------------------------------------------------ */
/*  2. The history                                                     */
/* ------------------------------------------------------------------ */

CREATE TABLE IF NOT EXISTS public.brain_doc_revisions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_id      UUID NOT NULL REFERENCES public.brain_docs (id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    body_md     TEXT NOT NULL,
    summary     TEXT,
    /* Who made the edit that superseded this version, and when. */
    edited_by   UUID REFERENCES public.admin_users (user_id) ON DELETE SET NULL,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.brain_doc_revisions IS
    'The superseded versions. A row is written before an update overwrites, so this holds what the document used to say rather than what it says now.';

CREATE INDEX IF NOT EXISTS idx_brain_doc_revisions_doc
    ON public.brain_doc_revisions (doc_id, created_at DESC);

/* ------------------------------------------------------------------ */
/*  3. Keeping the history without being asked                         */
/* ------------------------------------------------------------------ */

CREATE OR REPLACE FUNCTION public.brain_docs_file_revision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
    /* Only when the words actually changed. Publishing a document, adding
       a tag or stamping a verification date are not edits to the text, and
       filing a revision for each of them turns the history into noise. */
    IF NEW.body_md IS DISTINCT FROM OLD.body_md
       OR NEW.title IS DISTINCT FROM OLD.title
       OR NEW.summary IS DISTINCT FROM OLD.summary
    THEN
        INSERT INTO public.brain_doc_revisions (doc_id, title, body_md, summary, edited_by)
        VALUES (OLD.id, OLD.title, OLD.body_md, OLD.summary, auth.uid());
    END IF;

    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.brain_docs_file_revision() IS
    'Files the superseded version before an update overwrites it. SECURITY DEFINER because the revisions table is not writable by anybody directly: a history a person can edit is not a history.';

DROP TRIGGER IF EXISTS trg_brain_docs_file_revision ON public.brain_docs;

CREATE TRIGGER trg_brain_docs_file_revision
    BEFORE UPDATE ON public.brain_docs
    FOR EACH ROW
    EXECUTE FUNCTION public.brain_docs_file_revision();

/* ------------------------------------------------------------------ */
/*  4. Access                                                          */
/* ------------------------------------------------------------------ */

ALTER TABLE public.brain_docs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_doc_revisions  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Console reads the brain"        ON public.brain_docs;
DROP POLICY IF EXISTS "Owners write the brain"         ON public.brain_docs;
DROP POLICY IF EXISTS "Owners create brain docs"       ON public.brain_docs;
DROP POLICY IF EXISTS "Owners delete brain docs"       ON public.brain_docs;
DROP POLICY IF EXISTS "Console reads brain history"    ON public.brain_doc_revisions;

/* Anybody who works here may read it. A published document is the point;
   a draft is visible too, because the alternative is two people writing
   the same page without knowing. */
CREATE POLICY "Console reads the brain"
    ON public.brain_docs FOR SELECT TO authenticated
    USING (public.has_console_access());

CREATE POLICY "Owners create brain docs"
    ON public.brain_docs FOR INSERT TO authenticated
    WITH CHECK (public.is_owner_or_admin());

CREATE POLICY "Owners write the brain"
    ON public.brain_docs FOR UPDATE TO authenticated
    USING (public.is_owner_or_admin())
    WITH CHECK (public.is_owner_or_admin());

/* Archiving is an update. Deletion is an owner's act and takes the
   revisions with it, which is the one operation this table has that
   cannot be undone. */
CREATE POLICY "Owners delete brain docs"
    ON public.brain_docs FOR DELETE TO authenticated
    USING (public.is_owner());

/* The history is readable by everybody who can read the document and
   writable by nobody. There is no INSERT, UPDATE or DELETE policy here on
   purpose: the trigger is SECURITY DEFINER and writes past RLS, and a
   history somebody can edit is not a history. */
CREATE POLICY "Console reads brain history"
    ON public.brain_doc_revisions FOR SELECT TO authenticated
    USING (public.has_console_access());

/* ------------------------------------------------------------------ */
/*  5. The first four documents                                        */
/* ------------------------------------------------------------------ */

/* Seeded empty rather than full. The words are written in the console by
   a person, and pasting the current contents of brand-voice.md in here
   would create a second copy of a file that is still the source of truth
   for KIPP until somebody decides otherwise. What these give is the
   shelf, with the owner and the convention already on it. */

INSERT INTO public.brain_docs (collection, slug, title, summary, status, body_md)
VALUES
    ('brand', 'voice', 'Voice and the claims rule',
     'How ABRAM writes, and the rule that every product claim traces to a merged change or a number somebody measured.',
     'draft',
     E'# Voice and the claims rule\n\n_Last verified: unset._\n\n> This document is the shelf, not the contents. The working version is\n> `.agents/brand-voice.md` in this repository. Move it here when the\n> console becomes the place people actually read it, and delete the file\n> in the same change so there is never a second source of truth.\n\n## Owner\n\nUnassigned.\n'),

    ('business', 'what-abram-is', 'What ABRAM is',
     'Who the product is for, what it charges, and what stage the company is at.',
     'draft',
     E'# What ABRAM is\n\n_Last verified: unset._\n\n> Mirrors `abram-network/.agents/brain/BUSINESS.md`, which is owned by\n> Connor and changed by pull request. Anything written here that\n> contradicts that file is wrong until that file changes.\n\n## Owner\n\nUnassigned.\n'),

    ('proposals', 'how-we-write-proposals', 'How we write a proposal',
     'The shape of a proposal, what goes in it, and the claims it may make.',
     'draft',
     E'# How we write a proposal\n\n_Last verified: unset._\n\n## The one idea\n\nA proposal makes claims, and the claims rule in the brand voice applies\nto every one of them: it traces to a merged change or to a number\nsomebody measured. No customer counts, no testimonials, no invented\nmetrics.\n\n## Owner\n\nUnassigned.\n'),

    ('decisions', 'settled', 'Settled questions',
     'Questions that have an answer, append only. A reversal supersedes and links back rather than deleting.',
     'draft',
     E'# Settled questions\n\n_Last verified: unset._\n\nAppend only. A reversal supersedes the entry it replaces and links back\nto it. Nothing here is ever deleted, because the value of this document\nis that it records what was believed at the time as well as what is\nbelieved now.\n\n## Owner\n\nUnassigned.\n')
ON CONFLICT DO NOTHING;
