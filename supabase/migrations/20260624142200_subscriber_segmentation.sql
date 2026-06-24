-- =====================================================================
-- ABRAM SUBSCRIBER SEGMENTATION & BROADCASTER SAFETY MIGRATION
-- Target Database: fovvtmwmrivuwnqemcil.supabase.co
-- =====================================================================

-- 1. Upgrades to public.subscribers table
ALTER TABLE public.subscribers 
  ADD COLUMN IF NOT EXISTS is_marketing_list BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_application_list BOOLEAN NOT NULL DEFAULT FALSE;

-- Enforce check constraint: if someone is on the application list, they must also be on the marketing list.
ALTER TABLE public.subscribers
  DROP CONSTRAINT IF EXISTS check_marketing_if_app,
  ADD CONSTRAINT check_marketing_if_app CHECK (NOT is_application_list OR is_marketing_list);

-- Trigger function to automatically set is_marketing_list = TRUE when is_application_list is set to TRUE.
CREATE OR REPLACE FUNCTION public.sync_marketing_list()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_application_list = TRUE THEN
        NEW.is_marketing_list := TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to public.subscribers
DROP TRIGGER IF EXISTS trigger_sync_marketing_list ON public.subscribers;
CREATE TRIGGER trigger_sync_marketing_list
    BEFORE INSERT OR UPDATE ON public.subscribers
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_marketing_list();

-- 2. Upgrades to public.campaigns table to support drafts and manual sending audit trail
ALTER TABLE public.campaigns 
  ADD COLUMN IF NOT EXISTS html_content TEXT,
  ADD COLUMN IF NOT EXISTS text_content TEXT,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approval_ip TEXT,
  ADD COLUMN IF NOT EXISTS approval_user_agent TEXT,
  ADD COLUMN IF NOT EXISTS approval_metadata JSONB DEFAULT '{}'::jsonb;
