-- Migration: Drop the orphaned "Resend Email Integration" help doc
-- Created: 2026-07-27T14:00:00Z
-- Description: user-guide/6.4-resend-email-integration.md was removed from the repo
--              in commit 1c2b97a, and the 6.4 slot was reassigned to
--              user-guide/6.4-client-portal. scripts/seed-help-docs.js upserts on
--              slug and never deletes, so the old row survived every reseed and kept
--              surfacing in docs search and the chatbot.
--
--              Reversible: the source markdown is still in git history at
--              `git show 1c2b97a^:user-guide/6.4-resend-email-integration.md`
--              (3760 bytes). Restore the file and rerun the seed script to bring
--              the row back.
--
--              Data-only and idempotent — safe to re-run.

DELETE FROM public.help_docs
WHERE slug = 'user-guide/6.4-resend-email-integration';
