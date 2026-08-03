-- Only the server-side ingest route (service role) may write landing
-- telemetry. Signed-in users read analytics, they never record events.
--
-- Recovered 2026-08-03 from the remote migration history: this migration was applied to the
-- database but had no local file, so `supabase db push` reported a history mismatch and the
-- CLI's suggested fix (`migration repair --status reverted`) would have dropped it from
-- tracked history while leaving the grants live in the database. Restored verbatim instead.
REVOKE ALL ON FUNCTION public.record_landing_event(TEXT, TEXT, TEXT, TEXT, INTEGER, JSONB) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.record_landing_event(TEXT, TEXT, TEXT, TEXT, INTEGER, JSONB) TO service_role;
