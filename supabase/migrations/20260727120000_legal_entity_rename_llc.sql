-- Migration: Rename legal entity from "Thomas Abram, Inc." to "Thomas Abram, LLC"
-- Created: 2026-07-27T12:00:00Z
-- Description: The operating entity is now Thomas Abram, LLC. The source-of-truth
--              markdown (user-guide/*.md), email templates, and seed scripts were
--              updated in-repo; this migration fixes the rows already live in the
--              database so the docs site and outbound email footers match.
--              Data-only and idempotent — safe to re-run.

-- Legal documents and any other help doc that names the entity.
-- "Inc." carried a trailing period that also ended the sentence in a couple of
-- places; "LLC" does not, so those sentence periods are restored afterwards.
UPDATE public.help_docs
SET content = REPLACE(
        REPLACE(
            REPLACE(content, 'Thomas Abram, Inc.', 'Thomas Abram, LLC'),
            'Thomas Abram, LLC All rights reserved.', 'Thomas Abram, LLC. All rights reserved.'),
        'exclusive property of Thomas Abram, LLC Third-party',
        'exclusive property of Thomas Abram, LLC. Third-party')
WHERE content LIKE '%Thomas Abram, Inc.%';

-- CAN-SPAM footer in the stored email layouts
UPDATE public.email_templates
SET html_template = REPLACE(html_template, 'Thomas Abram, Inc.', 'Thomas Abram, LLC')
WHERE html_template LIKE '%Thomas Abram, Inc.%';

-- Refresh the "Last Updated" line on the three legal documents to match the repo
UPDATE public.help_docs
SET content = REPLACE(
        REPLACE(content, '**Last Updated:** July 14, 2026', '**Last Updated:** July 27, 2026'),
        '**Last Updated:** June 23, 2026', '**Last Updated:** July 27, 2026')
WHERE slug IN (
    'user-guide/ABRAM_Terms_of_Use',
    'user-guide/ABRAM_Privacy_Policy',
    'user-guide/ABRAM_Acceptable_Use_Policy'
);
