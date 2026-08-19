-- ---------------------------------------------------------------------
-- The carve out column stops naming a real firm.
--
-- `crm_accounts.carve_out` was documented with a worked example naming a
-- real private equity house, and the same string sat in the console as
-- the field's placeholder. AGENTS.md is explicit that no real brand name
-- appears in a template, a mockup, a doc or a code example. A placeholder
-- is read by every person who ever opens that field, so it is exactly the
-- kind of example that gets copied into a live row by somebody in a
-- hurry.
--
-- The column keeps its meaning and its type. Only the words change, here
-- and at src/app/admin/dashboard/accounts/AccountDrawer.tsx, which now
-- reads `fund_portfolio`.
--
-- 20260817100000 has already run everywhere it is going to run, so
-- editing its text fixes only a database built from scratch after today.
-- Both were done: the string there is corrected so a fresh build never
-- writes the old wording, and this re-issues the comment so an existing
-- database is corrected too. Only a comment string changed there, no DDL,
-- so the schema that migration produces is byte for byte what it was.
--
-- Existing data is reported and not touched. A carve out names a real
-- agreement, so a stored value is a business fact rather than a typo, and
-- rewriting one in a migration would quietly move money: any account it
-- names is skipped by the commission ledger regardless of who sourced or
-- closed it. The notice below lists what is actually stored, so whoever
-- runs this can see whether any of it needs renaming from the console,
-- where the change is attributable to a person.
-- ---------------------------------------------------------------------

COMMENT ON COLUMN public.crm_accounts.carve_out IS
    'Names an agreement that removes this account from commission entirely, for example an introduction made through an investor whose portfolio is excluded by contract. Non-null means the ledger skips it regardless of who sourced or closed it.';

DO $$
DECLARE
    stored TEXT;
BEGIN
    SELECT string_agg(DISTINCT carve_out, ', ' ORDER BY carve_out)
      INTO stored
      FROM public.crm_accounts
     WHERE carve_out IS NOT NULL AND btrim(carve_out) <> '';

    IF stored IS NOT NULL THEN
        RAISE NOTICE
            'carve_out values currently stored: %. Review them for real brand names and rename any from the console; this migration does not touch rows.',
            stored;
    END IF;
END $$;
