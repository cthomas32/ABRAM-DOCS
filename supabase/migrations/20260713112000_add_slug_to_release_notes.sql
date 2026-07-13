-- Migration: Add slug column to release_notes table
-- Target Database: fovvtmwmrivuwnqemcil.supabase.co

ALTER TABLE public.release_notes
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
