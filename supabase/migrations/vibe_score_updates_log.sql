-- Table to log automated vibe score updates
CREATE TABLE IF NOT EXISTS vibe_score_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  venues_processed INTEGER,
  duration_ms INTEGER,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying recent updates
CREATE INDEX idx_vibe_score_updates_triggered_at ON vibe_score_updates(triggered_at DESC);

-- RLS policies
ALTER TABLE vibe_score_updates ENABLE ROW LEVEL SECURITY;

-- Admin can view all logs
CREATE POLICY "Admin can view vibe score update logs"
  ON vibe_score_updates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.default_role = 'super_admin'
    )
  );

COMMENT ON TABLE vibe_score_updates IS 'Logs automated vibe score calculation runs';
