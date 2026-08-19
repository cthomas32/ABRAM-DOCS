-- ---------------------------------------------------------------------
-- `sources` always contains `source`.
--
-- 20260818090000 added both columns and stated the invariant in its
-- header: the array is every way a person has ever reached us, and it
-- always contains the scalar that says how they first did. It backfilled
-- every row that existed and then left the rule to be remembered by each
-- writer.
--
-- It was not remembered. The capture route inserted `source` and never
-- `sources`, so every person met at a conference since that date carried
-- an empty array. The visible symptom was mild and misleading: the source
-- filters and the conference list quietly returned fewer people than the
-- pipeline said existed, which reads as a slow week rather than as a bug.
-- The lead score in `crm_lead_score` also takes `sources` as an argument,
-- so those people scored lower than they should have.
--
-- A rule that has to be remembered by every writer is a rule that will be
-- broken by the next writer. This makes the database keep it.
--
-- Repair rather than refusal, deliberately. Raising on a mismatch would
-- turn a forgotten column into a failed capture, and a capture fails in
-- front of somebody at a conference stand with a queue behind them. The
-- trigger adds the missing value and lets the write through, which is
-- what every caller wanted anyway.
-- ---------------------------------------------------------------------

/* ------------------------------------------------------------------ */
/*  The rule                                                           */
/* ------------------------------------------------------------------ */

CREATE OR REPLACE FUNCTION public.crm_contacts_ensure_source()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
    IF NEW.source IS NULL THEN
        RETURN NEW;
    END IF;

    IF NEW.sources IS NULL THEN
        NEW.sources := ARRAY[NEW.source];
    ELSIF NOT (NEW.source = ANY (NEW.sources)) THEN
        NEW.sources := NEW.sources || NEW.source;
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.crm_contacts_ensure_source() IS
    'Keeps crm_contacts.sources containing crm_contacts.source. Repairs rather than refuses, because the writer that forgets is the conference capture route and a refused capture happens in front of a person.';

DROP TRIGGER IF EXISTS trg_crm_contacts_ensure_source ON public.crm_contacts;

CREATE TRIGGER trg_crm_contacts_ensure_source
    BEFORE INSERT OR UPDATE OF source, sources ON public.crm_contacts
    FOR EACH ROW
    EXECUTE FUNCTION public.crm_contacts_ensure_source();

/* ------------------------------------------------------------------ */
/*  The rows written while nobody was keeping it                       */
/* ------------------------------------------------------------------ */

DO $$
DECLARE
    repaired BIGINT;
BEGIN
    WITH fixed AS (
        UPDATE public.crm_contacts
           SET sources = CASE
                             WHEN sources IS NULL THEN ARRAY[source]
                             ELSE sources || source
                         END
         WHERE source IS NOT NULL
           AND (sources IS NULL OR NOT (source = ANY (sources)))
        RETURNING 1
    )
    SELECT count(*) INTO repaired FROM fixed;

    RAISE NOTICE 'sources repaired on % contact(s).', repaired;
END $$;
