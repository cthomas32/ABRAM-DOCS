-- =====================================================================
-- APPROVING A POST FROM SLACK
--
-- Approval used to be a click in Social Studio. The draft arrived in
-- #kipp in the morning, and approving it meant leaving Slack, finding the
-- post on the calendar, and clicking Mark ready. Everything needed to
-- make that decision was already in the Slack message; the trip to the
-- dashboard added nothing to it.
--
-- So the review message carries the buttons. These columns are what that
-- needs: a stamp so a draft is only ever asked about once, a place for
-- the words when the answer is "not like that", and a record of who
-- answered.
--
-- Deliberately NOT here: anything that lets a machine approve. Every
-- column below is written in response to a person pressing a button, and
-- the status check still only knows the four values it always did.
-- =====================================================================

ALTER TABLE public.social_posts
    -- Stamped when the draft was put in Slack for review. The queue reads
    -- this rather than the date, the same contract notified_at uses for
    -- the morning pack: a re-run or a late run is then harmless, and a
    -- draft is never asked about twice.
    ADD COLUMN IF NOT EXISTS review_notified_at    TIMESTAMPTZ,

    -- What was asked for, in the reviewer's words. Read by KIPP on its
    -- next run and cleared when the post is rewritten, so a note left
    -- here is a piece of work outstanding rather than a comment.
    ADD COLUMN IF NOT EXISTS revision_note         TEXT,
    ADD COLUMN IF NOT EXISTS revision_requested_at TIMESTAMPTZ,

    -- Who pressed the button, as Slack knows them. Stored as text rather
    -- than a reference to auth.users because the person approving from a
    -- phone at the school gate is not signed in to the dashboard, and a
    -- foreign key that can only sometimes be filled records less than a
    -- name that is always there.
    ADD COLUMN IF NOT EXISTS reviewed_by           TEXT,
    ADD COLUMN IF NOT EXISTS reviewed_at           TIMESTAMPTZ;

-- The review queue's read: drafts, oldest scheduled first, that have not
-- been asked about yet. Partial on status because drafts are the only
-- rows this index is ever used for and the table is mostly not drafts.
CREATE INDEX IF NOT EXISTS social_posts_review_queue_idx
    ON public.social_posts (scheduled_for, slot)
    WHERE status = 'draft';

COMMENT ON COLUMN public.social_posts.review_notified_at IS
    'When this draft was put in Slack for approval. Null means it has not been asked about. Same never-twice contract as notified_at.';
COMMENT ON COLUMN public.social_posts.revision_note IS
    'What the reviewer asked to be changed. KIPP reads it on the next run and clears it when the post is rewritten.';
COMMENT ON COLUMN public.social_posts.reviewed_by IS
    'The Slack display name of whoever approved, sent back, or skipped this post.';
