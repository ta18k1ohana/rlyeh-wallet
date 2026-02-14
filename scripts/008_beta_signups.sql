-- Beta signups table for collecting email addresses
CREATE TABLE IF NOT EXISTS beta_signups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE beta_signups ENABLE ROW LEVEL SECURITY;

-- Only service role can manage beta signups
CREATE POLICY "Service role can manage beta_signups"
  ON beta_signups
  FOR ALL
  USING (auth.role() = 'service_role');
