-- Migration: Fix run-on sentence left by the Inc. -> LLC rename
-- Created: 2026-07-27T12:30:00Z
-- Description: 20260727120000 restored the sentence period after "Thomas Abram, LLC"
--              using exact-match REPLACE. The stored Terms of Use copy uses
--              "All rights Reserved." (capital R), which drifted from the repo's
--              "All rights reserved.", so that one occurrence was missed.
--              This uses a case-insensitive regex to catch every casing variant.
--              Data-only and idempotent — safe to re-run.

UPDATE public.help_docs
SET content = regexp_replace(
        content,
        'Thomas Abram, LLC (All rights reserved)',
        'Thomas Abram, LLC. \1',
        'gi')
WHERE content ~* 'Thomas Abram, LLC All rights reserved';

UPDATE public.help_docs
SET content = regexp_replace(
        content,
        'Thomas Abram, LLC (Third-party)',
        'Thomas Abram, LLC. \1',
        'g')
WHERE content ~ 'Thomas Abram, LLC Third-party';
