-- 009: Create mention_approvals table for Streamer plan mention approval flow

CREATE TABLE IF NOT EXISTS public.mention_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- The user being mentioned (who needs to approve)
  mentioned_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- The report where the mention occurs
  play_report_id UUID NOT NULL REFERENCES public.play_reports(id) ON DELETE CASCADE,
  -- The user who created the mention (report author)
  mentioned_by_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Approval status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent duplicate pending approvals
  UNIQUE(mentioned_user_id, play_report_id)
);

-- Enable RLS
ALTER TABLE public.mention_approvals ENABLE ROW LEVEL SECURITY;

-- Mentioned user can see and manage their own approvals
CREATE POLICY "mention_approvals_select_own" ON public.mention_approvals
  FOR SELECT USING (auth.uid() = mentioned_user_id OR auth.uid() = mentioned_by_user_id);
CREATE POLICY "mention_approvals_insert" ON public.mention_approvals
  FOR INSERT WITH CHECK (auth.uid() = mentioned_by_user_id);
CREATE POLICY "mention_approvals_update_own" ON public.mention_approvals
  FOR UPDATE USING (auth.uid() = mentioned_user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mention_approvals_mentioned_user ON public.mention_approvals(mentioned_user_id, status);
CREATE INDEX IF NOT EXISTS idx_mention_approvals_report ON public.mention_approvals(play_report_id);
