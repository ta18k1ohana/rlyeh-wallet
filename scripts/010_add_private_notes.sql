-- 010: Add private_notes column to play_reports for Pro plan

-- Private notes are only visible to the report owner
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'play_reports' AND column_name = 'private_notes') THEN
    ALTER TABLE public.play_reports ADD COLUMN private_notes TEXT;
  END IF;
END $$;

-- Note: RLS already ensures only the owner can update their reports.
-- For reading, we need to ensure private_notes is stripped in public queries.
-- This is handled at the application layer by excluding private_notes from
-- queries where user_id != auth.uid().
