-- R'lyeh Wallet: Scenario Preferences Schema
-- Phase 1: Pro Plan Matching Feature

-- =============================================
-- scenario_preferences: 回りたい/回せるシナリオ
-- =============================================
CREATE TABLE IF NOT EXISTS public.scenario_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scenario_name TEXT NOT NULL,
  scenario_author TEXT,
  preference_type TEXT NOT NULL CHECK (preference_type IN ('want_to_play', 'can_run')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate entries for the same scenario/type per user
  UNIQUE(user_id, scenario_name, preference_type)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_scenario_preferences_user_id 
  ON public.scenario_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_scenario_preferences_scenario_name 
  ON public.scenario_preferences(scenario_name);

CREATE INDEX IF NOT EXISTS idx_scenario_preferences_type 
  ON public.scenario_preferences(preference_type);

-- Composite index for matching queries
CREATE INDEX IF NOT EXISTS idx_scenario_preferences_matching 
  ON public.scenario_preferences(scenario_name, preference_type);

-- =============================================
-- Enable RLS
-- =============================================
ALTER TABLE public.scenario_preferences ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies
-- =============================================

-- Everyone can view scenario preferences (for matching)
CREATE POLICY "scenario_preferences_select" 
  ON public.scenario_preferences 
  FOR SELECT 
  USING (true);

-- Users can only insert their own preferences
CREATE POLICY "scenario_preferences_insert_own" 
  ON public.scenario_preferences 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own preferences
CREATE POLICY "scenario_preferences_update_own" 
  ON public.scenario_preferences 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can only delete their own preferences
CREATE POLICY "scenario_preferences_delete_own" 
  ON public.scenario_preferences 
  FOR DELETE 
  USING (auth.uid() = user_id);
