-- R'lyeh Wallet: Streamer Ads Schema
-- Phase 1: Streamer Plan Advertising Feature

-- =============================================
-- user_ad_preferences: 広告表示設定（Pro+用）
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_ad_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  hide_streamer_ads BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- streamer_ad_impressions: 広告表示トラッキング（分析用）
-- =============================================
CREATE TABLE IF NOT EXISTS public.streamer_ad_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  play_report_id UUID NOT NULL REFERENCES public.play_reports(id) ON DELETE CASCADE,
  viewer_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  impression_type TEXT NOT NULL CHECK (impression_type IN ('view', 'click', 'dismiss')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_streamer_ad_impressions_report 
  ON public.streamer_ad_impressions(play_report_id);

CREATE INDEX IF NOT EXISTS idx_streamer_ad_impressions_date 
  ON public.streamer_ad_impressions(created_at);

-- =============================================
-- Enable RLS
-- =============================================
ALTER TABLE public.user_ad_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streamer_ad_impressions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies for user_ad_preferences
-- =============================================

-- Users can only view their own ad preferences
CREATE POLICY "user_ad_preferences_select_own" 
  ON public.user_ad_preferences 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can insert their own ad preferences
CREATE POLICY "user_ad_preferences_insert_own" 
  ON public.user_ad_preferences 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own ad preferences
CREATE POLICY "user_ad_preferences_update_own" 
  ON public.user_ad_preferences 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- =============================================
-- RLS Policies for streamer_ad_impressions
-- =============================================

-- Anyone can insert impressions (for anonymous tracking)
CREATE POLICY "streamer_ad_impressions_insert" 
  ON public.streamer_ad_impressions 
  FOR INSERT 
  WITH CHECK (true);

-- Streamers can view impressions on their own reports
CREATE POLICY "streamer_ad_impressions_select_own" 
  ON public.streamer_ad_impressions 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.play_reports 
      WHERE id = play_report_id AND user_id = auth.uid()
    )
  );
