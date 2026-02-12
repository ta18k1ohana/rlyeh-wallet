-- 008: Create youtube_links table for Streamer plan YouTube embedding

CREATE TABLE IF NOT EXISTS public.youtube_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  play_report_id UUID NOT NULL REFERENCES public.play_reports(id) ON DELETE CASCADE,
  youtube_url TEXT NOT NULL,
  title TEXT,
  thumbnail_url TEXT,
  link_type TEXT DEFAULT 'main' CHECK (link_type IN ('main', 'clip', 'playlist')),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.youtube_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "youtube_links_select" ON public.youtube_links FOR SELECT USING (true);
CREATE POLICY "youtube_links_insert" ON public.youtube_links FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.play_reports WHERE id = play_report_id AND user_id = auth.uid())
);
CREATE POLICY "youtube_links_update" ON public.youtube_links FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.play_reports WHERE id = play_report_id AND user_id = auth.uid())
);
CREATE POLICY "youtube_links_delete" ON public.youtube_links FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.play_reports WHERE id = play_report_id AND user_id = auth.uid())
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_youtube_links_report_id ON public.youtube_links(play_report_id);
