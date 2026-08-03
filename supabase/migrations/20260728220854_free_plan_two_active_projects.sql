-- The free plan allows 2 active projects, not 1. The markdown in the repo
-- is the source of truth; these rows back docs search and the assistant,
-- so they are corrected to match. Idempotent and data-only.
UPDATE public.help_docs
SET content = replace(
      content,
      'the Free plan''s limit of 1 active project',
      'the Free plan''s limit of 2 active projects'
    ),
    updated_at = timezone('utc'::text, now())
WHERE slug = 'user-guide/2.1-ai-brief-analyzer'
  AND content LIKE '%the Free plan''s limit of 1 active project%';

UPDATE public.help_docs
SET content = replace(
      content,
      'the Free plan allows 1 active project',
      'the Free plan allows 2 active projects'
    ),
    updated_at = timezone('utc'::text, now())
WHERE slug = 'user-guide/2.2-manual-project-creation'
  AND content LIKE '%the Free plan allows 1 active project%';
