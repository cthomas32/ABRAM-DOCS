-- =====================================================================
-- EMAIL ENGAGEMENT ON THE CONTACT TIMELINE
--
-- Opens and clicks already arrive at /api/webhooks/resend and are written
-- to campaign_logs, where they answer "how did that broadcast do". They
-- have never answered the question somebody actually asks while looking
-- at a person: has this one read anything I sent them?
--
-- This migration is the join that makes that possible, plus the one guard
-- without which it would make the timeline unusable.
--
-- THE GUARD
--
-- An open is not an event, it is a pixel, and a pixel loads every time
-- the message is scrolled past, re-opened, or previewed by a scanner.
-- Writing one timeline row per delivered open would bury a contact's
-- history under a single email within a week.
--
-- So engagement rows are deduplicated at the database rather than in the
-- handler. An open is unique per message; a click is unique per message
-- per link, because clicking two different links in one email is two
-- genuinely different facts and clicking the same one twice is not.
--
-- Doing it with an index rather than a read-then-write also survives the
-- thing that makes this hard: Resend retries, and two retries arriving
-- together both see no existing row.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. WHERE AN ENGAGEMENT ROW CAME FROM
--
-- The provider's message id, kept on the interaction so a timeline row
-- can be traced back to the send that produced it.
-- ---------------------------------------------------------------------
COMMENT ON COLUMN public.crm_interactions.meta IS
    'Free-form detail for the kind. Engagement rows carry email_id (the provider message id) and, for a click, url. Those two keys are what the dedupe index below is built on, so do not rename them.';

-- ---------------------------------------------------------------------
-- 2. DEDUPE
--
-- md5 over the concatenation rather than a multi-column expression
-- index, because an index on two independent JSONB extractions cannot
-- express "these two together are the key" when either may be absent.
-- Coalescing to empty strings keeps a null url from making every row
-- unique, which would silently defeat the whole index.
-- ---------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_interactions_engagement_once
    ON public.crm_interactions (
        contact_id,
        kind,
        md5(COALESCE(meta ->> 'email_id', '') || '|' || COALESCE(meta ->> 'url', ''))
    )
    WHERE kind IN ('email_opened', 'email_clicked');

-- ---------------------------------------------------------------------
-- 3. RECORDING ONE
--
-- Runs as the service role from the webhook. Returns true when a row was
-- actually written, so the handler can tell a first open from the
-- fourteenth without querying for it.
--
-- Resolves the contact by address itself rather than taking a contact id,
-- because the webhook knows an email address and nothing else. The
-- lookup escapes nothing and uses plain equality on a lowered column —
-- there is no pattern matching here, so there is no wildcard to smuggle
-- in, unlike the capture route's dedupe.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.crm_record_email_engagement(
    p_email      TEXT,
    p_kind       TEXT,
    p_email_id   TEXT,
    p_url        TEXT DEFAULT NULL,
    p_subject    TEXT DEFAULT NULL,
    p_occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_contact_id UUID;
    v_inserted   INTEGER;
BEGIN
    IF p_email IS NULL OR p_kind NOT IN ('email_opened', 'email_clicked') THEN
        RETURN FALSE;
    END IF;

    -- The live contact for this address. An archived row is deliberately
    -- skipped: resurrecting somebody's timeline because a scanner opened
    -- an old message is not an outcome anybody wants.
    SELECT id INTO v_contact_id
      FROM public.crm_contacts
     WHERE lower(email) = lower(trim(p_email))
       AND NOT archived
     ORDER BY created_at
     LIMIT 1;

    IF v_contact_id IS NULL THEN
        RETURN FALSE;
    END IF;

    INSERT INTO public.crm_interactions (contact_id, kind, body, meta, occurred_at)
    VALUES (
        v_contact_id,
        p_kind,
        CASE
            WHEN p_kind = 'email_clicked' THEN COALESCE('Clicked a link in "' || p_subject || '"', 'Clicked a link')
            ELSE COALESCE('Opened "' || p_subject || '"', 'Opened an email')
        END,
        jsonb_strip_nulls(
            jsonb_build_object('email_id', p_email_id, 'url', p_url, 'subject', p_subject)
        ),
        COALESCE(p_occurred_at, timezone('utc'::text, now()))
    )
    ON CONFLICT DO NOTHING;

    GET DIAGNOSTICS v_inserted = ROW_COUNT;

    -- Only a genuinely new engagement moves the contact's activity clock.
    -- A re-opened message is not a reason for somebody to reappear at the
    -- top of a list sorted by last activity.
    IF v_inserted > 0 THEN
        UPDATE public.crm_contacts
           SET last_activity_at = GREATEST(
                   last_activity_at,
                   COALESCE(p_occurred_at, timezone('utc'::text, now()))
               )
         WHERE id = v_contact_id;
    END IF;

    RETURN v_inserted > 0;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.crm_record_email_engagement(TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ) IS
    'Writes an open or click onto a contact timeline, deduplicated per message (and per link, for a click). Returns true only when a row was actually written.';

-- The webhook is the only caller and it runs as the service role. Nobody
-- signed in has any business writing engagement they did not generate.
REVOKE EXECUTE ON FUNCTION public.crm_record_email_engagement(TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ)
    FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.crm_record_email_engagement(TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ)
    TO service_role;

-- ---------------------------------------------------------------------
-- 4. WHAT WAS SENT ONE TO ONE
--
-- A broadcast is recorded in campaign_logs. A single email to one person
-- from their own record has no campaign, so it needs somewhere to live
-- that the timeline can point at.
-- ---------------------------------------------------------------------
ALTER TABLE public.crm_interactions
    ADD COLUMN IF NOT EXISTS email_message_id TEXT;

CREATE INDEX IF NOT EXISTS idx_crm_interactions_email_message
    ON public.crm_interactions (email_message_id)
    WHERE email_message_id IS NOT NULL;

COMMENT ON COLUMN public.crm_interactions.email_message_id IS
    'Provider message id for a one-to-one send, so a later open or click can be tied back to the exact message rather than only to the person.';
