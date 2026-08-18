-- One person record, however they arrived.
--
-- The console had grown five different objects that were all, in the end,
-- a person: a newsletter subscriber, an event signup, a captured contact,
-- a company someone works at, and a deal someone signs. Four of those are
-- rows in four tables with no agreement about which one is the person.
-- The symptom is mundane and constant: the same human is emailed twice,
-- counted twice, and worked twice.
--
-- The answer here is deliberately small. `crm_contacts` is THE person.
-- Nothing is migrated, nothing is dropped, no table is added. Two columns
-- are added to the person record and everything else becomes a feed into
-- it:
--
--   lifecycle_stage  how far along they are as a person. Distinct from
--                    `stage`, which is where their *pipeline* sits, and
--                    from a deal's stage, which is where the *money*
--                    sits. Those three were being conflated because two
--                    of them shared a column.
--   sources          every way they have reached us, not just the first.
--                    An array because somebody who subscribed, then came
--                    to a conference, then filled in a form is all three
--                    and the funnel report is wrong if it has to pick.
--
-- `source` (singular) stays exactly as it was: the first way in, written
-- once at capture. `sources` is the accumulating set, and it always
-- contains `source`.
--
-- No policies are added. crm_contacts already has role-aware RLS from
-- 20260817120000 and a column added to a table inherits the table's
-- policies, so there is nothing here for __apply_policy to do.

-- ---------------------------------------------------------------------
-- 1. THE TWO COLUMNS
-- ---------------------------------------------------------------------

ALTER TABLE public.crm_contacts
    ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT NOT NULL DEFAULT 'lead',
    ADD COLUMN IF NOT EXISTS sources         TEXT[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN public.crm_contacts.lifecycle_stage IS
    'How far along this person is: subscriber, lead, mql, sql, customer, churned. Not the same as stage (where their pipeline sits) and not the same as a deal stage (where the money sits).';
COMMENT ON COLUMN public.crm_contacts.sources IS
    'Every way this person has reached us, accumulating. Always contains the value of source, which is the first way in and never changes.';

-- ---------------------------------------------------------------------
-- 2. THE TWO VOCABULARIES
--
-- Both closed, because an open text column is how a funnel report ends
-- up with 'Newsletter', 'newsletter' and 'news letter' as three stages.
-- ---------------------------------------------------------------------

ALTER TABLE public.crm_contacts
    DROP CONSTRAINT IF EXISTS crm_contacts_lifecycle_stage_check;
ALTER TABLE public.crm_contacts
    ADD CONSTRAINT crm_contacts_lifecycle_stage_check CHECK (
        lifecycle_stage IN ('subscriber', 'lead', 'mql', 'sql', 'customer', 'churned')
    );

-- `source` was checked against the four ways the conference app could
-- create a row. The feeds below produce three more, and a row created by
-- converting a subscriber would have failed the old constraint.
ALTER TABLE public.crm_contacts
    DROP CONSTRAINT IF EXISTS crm_contacts_source_check;
ALTER TABLE public.crm_contacts
    ADD CONSTRAINT crm_contacts_source_check CHECK (
        source IN ('qr_card', 'capture_mode', 'manual', 'import',
                   'newsletter', 'event', 'form', 'promo', 'app_signup')
    );

-- The array is checked as a whole rather than per element, which is the
-- only way Postgres will express it without a trigger.
ALTER TABLE public.crm_contacts
    DROP CONSTRAINT IF EXISTS crm_contacts_sources_check;
ALTER TABLE public.crm_contacts
    ADD CONSTRAINT crm_contacts_sources_check CHECK (
        sources <@ ARRAY['qr_card', 'capture_mode', 'manual', 'import',
                         'newsletter', 'event', 'form', 'promo', 'app_signup']::text[]
    );

-- ---------------------------------------------------------------------
-- 3. WHAT THE EXISTING ROWS ALREADY WERE
--
-- Every contact in the table today already has a lifecycle and at least
-- one source; nobody had written them down. Read off the columns that
-- were recording the same facts by other means, so the first time
-- anybody opens the filter it is not empty.
-- ---------------------------------------------------------------------

UPDATE public.crm_contacts
   SET lifecycle_stage = CASE
       WHEN stage = 'subscriber'                     THEN 'subscriber'
       WHEN stage IN ('new', 'contacted')            THEN 'lead'
       WHEN stage = 'qualified'                      THEN 'mql'
       WHEN stage IN ('demo', 'opportunity')         THEN 'sql'
       WHEN stage = 'won'                            THEN 'customer'
       WHEN stage = 'lost'                           THEN 'churned'
       ELSE 'lead'
   END
 WHERE lifecycle_stage = 'lead';

-- The first source, plus the newsletter when they are on it, plus the
-- event when they came from one. `array_remove` drops the nulls rather
-- than storing them.
UPDATE public.crm_contacts
   SET sources = (
       SELECT ARRAY(
           SELECT DISTINCT value FROM unnest(
               array_remove(ARRAY[
                   source,
                   CASE WHEN subscriber_id IS NOT NULL THEN 'newsletter' END,
                   CASE WHEN event_id IS NOT NULL THEN 'event' END
               ], NULL)
           ) AS value
       )
   )
 WHERE cardinality(sources) = 0;

-- ---------------------------------------------------------------------
-- 4. READ PATHS
--
-- The lifecycle filter on the people screen, and the "who came from the
-- newsletter" question the funnel report asks. GIN because the second
-- one is a containment test on an array.
-- ---------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_crm_contacts_lifecycle
    ON public.crm_contacts (lifecycle_stage)
    WHERE NOT archived;

CREATE INDEX IF NOT EXISTS idx_crm_contacts_sources
    ON public.crm_contacts USING GIN (sources);
