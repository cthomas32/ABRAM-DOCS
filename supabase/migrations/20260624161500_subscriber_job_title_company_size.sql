-- =====================================================================
-- ABRAM SUBSCRIBER PROFILE MARKETING FIELDS MIGRATION
-- Target Database: fovvtmwmrivuwnqemcil.supabase.co
-- Run this script in the Supabase SQL Editor.
-- =====================================================================

-- 1. Add job_title and company_size columns to public.subscribers
ALTER TABLE public.subscribers 
  ADD COLUMN IF NOT EXISTS job_title TEXT,
  ADD COLUMN IF NOT EXISTS company_size TEXT;
