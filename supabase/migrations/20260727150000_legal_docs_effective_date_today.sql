-- Migration: Set the legal documents' Effective Date to July 27, 2026
-- Created: 2026-07-27T15:00:00Z
-- Description: The Terms of Use, Privacy Policy, and Acceptable Use Policy now take
--              effect on the date of the Thomas Abram, LLC entity change rather than
--              the original June 23, 2026 date. Mirrors the repo markdown.
--
--              NOTE: Section 19 of the Terms of Use commits to notifying users of
--              material changes at least 30 days before they take effect. An
--              Effective Date of today is a deliberate choice made by the owner.
--
--              Data-only and idempotent — safe to re-run.

UPDATE public.help_docs
SET content = REPLACE(content,
        '**Effective Date:** June 23, 2026',
        '**Effective Date:** July 27, 2026')
WHERE slug IN (
    'user-guide/ABRAM_Terms_of_Use',
    'user-guide/ABRAM_Privacy_Policy',
    'user-guide/ABRAM_Acceptable_Use_Policy'
);
