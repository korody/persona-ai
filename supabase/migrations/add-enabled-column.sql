-- Add enabled column to exercises table
-- This allows admins to control which courses are included in recommendations

ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_exercises_enabled ON exercises(enabled);

-- Update existing rows to be enabled by default
UPDATE exercises SET enabled = true WHERE enabled IS NULL;

COMMENT ON COLUMN exercises.enabled IS 'Whether this exercise should be included in avatar recommendations';
