-- Migration: Add welcome_email_sent_at column to subscribers table
-- Created: 2026-06-24T18:30:00Z
-- Description: Adds a welcome_email_sent_at timestamp column to track and safeguard newsletter welcome email delivery, preventing duplicate sends.

ALTER TABLE public.subscribers
  ADD COLUMN IF NOT EXISTS welcome_email_sent_at timestamptz DEFAULT NULL;
