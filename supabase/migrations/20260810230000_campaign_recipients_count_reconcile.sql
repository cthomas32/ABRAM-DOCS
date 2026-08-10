-- Campaign recipient counts: reconcile against delivery logs.
--
-- campaigns.recipients_count was only ever written at draft time, from an estimate of
-- how many subscribers a segment resolved to. Nothing rewrote it once a campaign was
-- actually sent, and a draft saved without an explicit count reset it to zero, so the
-- dashboard reported audience sizes that never happened.
--
-- The authoritative number for a segment broadcast is the set of recipients Resend
-- reported an 'email.sent' event for, since Resend expands the segment on its own side
-- and never tells us the size up front. This migration adds a function that derives
-- that number, and backfills the campaigns whose stored value disagrees with it.

-- 1. Reconciliation function.
-- Returns the reconciled count, or NULL when there is nothing to reconcile from.
CREATE OR REPLACE FUNCTION public.reconcile_campaign_recipients_count(p_campaign_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count integer;
BEGIN
    SELECT COUNT(DISTINCT recipient_email)
      INTO v_count
      FROM public.campaign_logs
     WHERE campaign_id = p_campaign_id
       AND event_type = 'email.sent'
       AND recipient_email IS NOT NULL;

    -- A campaign with no delivery logs tells us nothing. Returning early here keeps
    -- the function from overwriting a genuine count with a zero for campaigns that
    -- were sent before webhooks were wired up.
    IF v_count IS NULL OR v_count = 0 THEN
        RETURN NULL;
    END IF;

    UPDATE public.campaigns
       SET recipients_count = v_count,
           updated_at = NOW()
     WHERE id = p_campaign_id
       AND recipients_count IS DISTINCT FROM v_count;

    RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.reconcile_campaign_recipients_count(uuid) IS
    'Recomputes campaigns.recipients_count from distinct email.sent recipients in campaign_logs. Returns NULL and writes nothing when the campaign has no delivery logs.';

-- Only the webhook handler (service role) may move these numbers.
REVOKE ALL ON FUNCTION public.reconcile_campaign_recipients_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reconcile_campaign_recipients_count(uuid) TO service_role;

-- 2. Backfill historical rows.
-- Scoped to campaigns that actually have 'email.sent' logs: campaigns predating the
-- webhook integration keep whatever count they already carry rather than being reset.
UPDATE public.campaigns c
   SET recipients_count = t.actual,
       updated_at = NOW()
  FROM (
        SELECT campaign_id,
               COUNT(DISTINCT recipient_email) AS actual
          FROM public.campaign_logs
         WHERE campaign_id IS NOT NULL
           AND event_type = 'email.sent'
           AND recipient_email IS NOT NULL
         GROUP BY campaign_id
       ) t
 WHERE c.id = t.campaign_id
   AND t.actual > 0
   AND c.recipients_count IS DISTINCT FROM t.actual;
