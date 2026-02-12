-- 007: Add subscription-related columns to profiles
-- Required for proper tier management, Stripe integration, and downgrade handling

-- Add tier enum column (defaults to 'free')
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'tier') THEN
    ALTER TABLE public.profiles ADD COLUMN tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'streamer'));
  END IF;
END $$;

-- Add is_streamer boolean
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_streamer') THEN
    ALTER TABLE public.profiles ADD COLUMN is_streamer BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Add Stripe-related columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'stripe_customer_id') THEN
    ALTER TABLE public.profiles ADD COLUMN stripe_customer_id TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'stripe_subscription_id') THEN
    ALTER TABLE public.profiles ADD COLUMN stripe_subscription_id TEXT;
  END IF;
END $$;

-- Add tier lifecycle columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'tier_started_at') THEN
    ALTER TABLE public.profiles ADD COLUMN tier_started_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'tier_expires_at') THEN
    ALTER TABLE public.profiles ADD COLUMN tier_expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add former_tier for downgrade badge display
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'former_tier') THEN
    ALTER TABLE public.profiles ADD COLUMN former_tier TEXT CHECK (former_tier IS NULL OR former_tier IN ('pro', 'streamer'));
  END IF;
END $$;

-- Backfill: sync tier column from is_pro/is_streamer for existing users
UPDATE public.profiles
SET tier = CASE
  WHEN is_streamer = TRUE THEN 'streamer'
  WHEN is_pro = TRUE THEN 'pro'
  ELSE 'free'
END
WHERE tier IS NULL OR tier = 'free';

-- Create index on stripe_customer_id for webhook lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Create index on tier for filtering
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON public.profiles(tier);
