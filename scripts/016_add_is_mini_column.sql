-- Add is_mini column to play_reports for mini-card (placeholder) records
ALTER TABLE play_reports ADD COLUMN IF NOT EXISTS is_mini BOOLEAN DEFAULT FALSE;

-- Index for filtering mini-cards from feeds
CREATE INDEX IF NOT EXISTS idx_play_reports_is_mini ON play_reports(is_mini);
