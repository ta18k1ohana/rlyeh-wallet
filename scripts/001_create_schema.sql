-- R'lyeh Wallet Database Schema

-- Profiles table (references auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  privacy_setting TEXT DEFAULT 'followers',
  is_pro BOOLEAN DEFAULT FALSE,
  twitter_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Play reports
CREATE TABLE IF NOT EXISTS public.play_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scenario_name TEXT NOT NULL,
  scenario_author TEXT,
  edition TEXT,
  play_date_start TIMESTAMPTZ NOT NULL,
  play_date_end TIMESTAMPTZ,
  play_duration DECIMAL(4,1),
  result TEXT,
  end_type TEXT,
  impression TEXT,
  share_code TEXT UNIQUE,
  privacy_setting TEXT DEFAULT 'followers',
  twitter_post_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Play report participants (KP/PL)
CREATE TABLE IF NOT EXISTS public.play_report_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  play_report_id UUID NOT NULL REFERENCES public.play_reports(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  role TEXT NOT NULL,
  character_name TEXT,
  handout TEXT,
  result TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Play report links
CREATE TABLE IF NOT EXISTS public.play_report_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  play_report_id UUID NOT NULL REFERENCES public.play_reports(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Play report images
CREATE TABLE IF NOT EXISTS public.play_report_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  play_report_id UUID NOT NULL REFERENCES public.play_reports(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_type TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  from_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  play_report_id UUID REFERENCES public.play_reports(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User notification settings
CREATE TABLE IF NOT EXISTS public.notification_settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  mention_notification BOOLEAN DEFAULT TRUE,
  share_code_notification BOOLEAN DEFAULT TRUE,
  follow_notification BOOLEAN DEFAULT TRUE,
  email_weekly_summary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.play_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.play_report_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.play_report_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.play_report_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "profiles_select_public" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- RLS Policies for play_reports
CREATE POLICY "play_reports_select" ON public.play_reports FOR SELECT USING (true);
CREATE POLICY "play_reports_insert_own" ON public.play_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "play_reports_update_own" ON public.play_reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "play_reports_delete_own" ON public.play_reports FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for play_report_participants
CREATE POLICY "participants_select" ON public.play_report_participants FOR SELECT USING (true);
CREATE POLICY "participants_insert" ON public.play_report_participants FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.play_reports WHERE id = play_report_id AND user_id = auth.uid())
);
CREATE POLICY "participants_update" ON public.play_report_participants FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.play_reports WHERE id = play_report_id AND user_id = auth.uid())
);
CREATE POLICY "participants_delete" ON public.play_report_participants FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.play_reports WHERE id = play_report_id AND user_id = auth.uid())
);

-- RLS Policies for play_report_links
CREATE POLICY "links_select" ON public.play_report_links FOR SELECT USING (true);
CREATE POLICY "links_insert" ON public.play_report_links FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.play_reports WHERE id = play_report_id AND user_id = auth.uid())
);
CREATE POLICY "links_update" ON public.play_report_links FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.play_reports WHERE id = play_report_id AND user_id = auth.uid())
);
CREATE POLICY "links_delete" ON public.play_report_links FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.play_reports WHERE id = play_report_id AND user_id = auth.uid())
);

-- RLS Policies for play_report_images
CREATE POLICY "images_select" ON public.play_report_images FOR SELECT USING (true);
CREATE POLICY "images_insert" ON public.play_report_images FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.play_reports WHERE id = play_report_id AND user_id = auth.uid())
);
CREATE POLICY "images_update" ON public.play_report_images FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.play_reports WHERE id = play_report_id AND user_id = auth.uid())
);
CREATE POLICY "images_delete" ON public.play_report_images FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.play_reports WHERE id = play_report_id AND user_id = auth.uid())
);

-- RLS Policies for notifications
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for notification_settings
CREATE POLICY "notification_settings_select_own" ON public.notification_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notification_settings_insert_own" ON public.notification_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notification_settings_update_own" ON public.notification_settings FOR UPDATE USING (auth.uid() = user_id);
