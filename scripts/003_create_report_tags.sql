-- Create report_tags table
-- Tags are per-report labels like table name, session number, abbreviation
CREATE TABLE IF NOT EXISTS report_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  play_report_id UUID NOT NULL REFERENCES play_reports(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Each tag name must be unique per report
  UNIQUE(play_report_id, tag_name)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_report_tags_report_id ON report_tags(play_report_id);
CREATE INDEX IF NOT EXISTS idx_report_tags_tag_name ON report_tags(tag_name);

-- Full text search index for tag names
CREATE INDEX IF NOT EXISTS idx_report_tags_tag_name_gin ON report_tags USING gin(to_tsvector('simple', tag_name));

-- RLS policies
ALTER TABLE report_tags ENABLE ROW LEVEL SECURITY;

-- Anyone can view tags on public reports
CREATE POLICY "Anyone can view tags on public reports" ON report_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM play_reports 
      WHERE play_reports.id = report_tags.play_report_id 
      AND play_reports.privacy_setting = 'public'
    )
  );

-- Report owners can manage their tags
CREATE POLICY "Report owners can manage tags" ON report_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM play_reports 
      WHERE play_reports.id = report_tags.play_report_id 
      AND play_reports.user_id = auth.uid()
    )
  );
