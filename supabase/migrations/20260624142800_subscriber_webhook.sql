-- =====================================================================
-- ABRAM SUBSCRIBER ASYNCHRONOUS WEBHOOK SYNC MIGRATION
-- Target Database: fovvtmwmrivuwnqemcil.supabase.co
-- =====================================================================

-- 1. Enable pg_net extension for outbound HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Create the trigger function to invoke the sync-subscriber Edge Function
CREATE OR REPLACE FUNCTION public.notify_subscriber_sync()
RETURNS TRIGGER AS $$
BEGIN
  -- Perform an asynchronous HTTP POST request to the Supabase Edge Function
  PERFORM net.http_post(
    url := 'https://fovvtmwmrivuwnqemcil.supabase.co/functions/v1/sync-subscriber',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer abram_db_sync_secret_token_123'
    ),
    body := jsonb_build_object(
      'event', TG_OP,
      'record', row_to_json(NEW)
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger for INSERT events
DROP TRIGGER IF EXISTS trigger_subscriber_insert_webhook ON public.subscribers;
CREATE TRIGGER trigger_subscriber_insert_webhook
    AFTER INSERT ON public.subscribers
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_subscriber_sync();

-- 4. Trigger for UPDATE events (fires only when user-facing columns actually change, avoiding loops)
DROP TRIGGER IF EXISTS trigger_subscriber_update_webhook ON public.subscribers;
CREATE TRIGGER trigger_subscriber_update_webhook
    AFTER UPDATE ON public.subscribers
    FOR EACH ROW
    WHEN (
      OLD.is_marketing_list IS DISTINCT FROM NEW.is_marketing_list
      OR OLD.is_application_list IS DISTINCT FROM NEW.is_application_list
      OR OLD.status IS DISTINCT FROM NEW.status
      OR OLD.first_name IS DISTINCT FROM NEW.first_name
      OR OLD.last_name IS DISTINCT FROM NEW.last_name
    )
    EXECUTE FUNCTION public.notify_subscriber_sync();
