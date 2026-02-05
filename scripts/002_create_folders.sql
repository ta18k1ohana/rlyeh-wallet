-- Create report_folders table for grouping play reports
CREATE TABLE IF NOT EXISTS report_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_report_id UUID, -- The report whose image is used as folder cover
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_folder_name_per_user UNIQUE(user_id, name)
);

-- Add folder_id to play_reports table
ALTER TABLE play_reports 
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES report_folders(id) ON DELETE SET NULL;

-- Add folder_sort_order for ordering reports within a folder
ALTER TABLE play_reports 
ADD COLUMN IF NOT EXISTS folder_sort_order INTEGER DEFAULT 0;

-- Create index for faster folder lookups
CREATE INDEX IF NOT EXISTS idx_play_reports_folder_id ON play_reports(folder_id);
CREATE INDEX IF NOT EXISTS idx_report_folders_user_id ON report_folders(user_id);

-- Enable RLS on report_folders
ALTER TABLE report_folders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own folders
CREATE POLICY "Users can view own folders" ON report_folders
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can create their own folders
CREATE POLICY "Users can create own folders" ON report_folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own folders
CREATE POLICY "Users can update own folders" ON report_folders
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own folders
CREATE POLICY "Users can delete own folders" ON report_folders
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_report_folders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_report_folders_updated_at ON report_folders;
CREATE TRIGGER update_report_folders_updated_at
  BEFORE UPDATE ON report_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_report_folders_updated_at();
