-- Add TRPG preference columns to profiles table
-- Run this in Supabase SQL editor

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role_preference TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS favorite_report_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS scenario_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS play_style_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS play_style_other TEXT DEFAULT NULL;

-- Constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_role_preference'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT check_role_preference
      CHECK (role_preference IS NULL OR role_preference IN ('pl_main', 'gm_main', 'both'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_favorite_report_ids_max'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT check_favorite_report_ids_max
      CHECK (array_length(favorite_report_ids, 1) IS NULL OR array_length(favorite_report_ids, 1) <= 3);
  END IF;
END $$;
