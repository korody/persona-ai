-- ============================================
-- MEMBERKIT EXERCISES TABLE
-- ============================================
-- Integration with Memberkit platform to sync Qi Gong exercises

CREATE TABLE IF NOT EXISTS exercises (
  -- IDs
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Memberkit data (source)
  memberkit_course_id TEXT NOT NULL,
  memberkit_section_id TEXT NOT NULL,
  memberkit_lesson_id TEXT NOT NULL UNIQUE, -- Unique constraint for upsert
  
  -- Basic information
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL,
  url TEXT NOT NULL,
  
  -- MTC classification
  element TEXT CHECK (element IN ('METAL', 'ÁGUA', 'MADEIRA', 'FOGO', 'TERRA')),
  organs TEXT[], -- Array: PULMÃO, RIM, FÍGADO, CORAÇÃO, BAÇO, etc
  
  -- Exercise details
  duration_minutes INTEGER,
  level TEXT CHECK (level IN ('INICIANTE', 'INTERMEDIÁRIO', 'AVANÇADO')),
  
  -- Tags and search
  tags TEXT[],
  benefits TEXT[],
  indications TEXT[], -- For symptom search: ansiedade, insonia, dor_lombar, etc
  contraindications TEXT[],
  
  -- Embedding for semantic search (1536 dimensions - OpenAI)
  embedding vector(1536),
  
  -- Control
  is_active BOOLEAN DEFAULT TRUE,
  position INTEGER NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Search by element
CREATE INDEX IF NOT EXISTS idx_exercises_element ON exercises(element) WHERE is_active = TRUE;

-- Search by level
CREATE INDEX IF NOT EXISTS idx_exercises_level ON exercises(level) WHERE is_active = TRUE;

-- Search by indications (GIN for arrays)
CREATE INDEX IF NOT EXISTS idx_exercises_indications ON exercises USING GIN(indications) WHERE is_active = TRUE;

-- Search by tags
CREATE INDEX IF NOT EXISTS idx_exercises_tags ON exercises USING GIN(tags) WHERE is_active = TRUE;

-- Vector search (embedding)
CREATE INDEX IF NOT EXISTS idx_exercises_embedding ON exercises USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Unique constraint for sync
CREATE UNIQUE INDEX IF NOT EXISTS idx_exercises_memberkit_lesson ON exercises(memberkit_lesson_id);

-- Sort by position
CREATE INDEX IF NOT EXISTS idx_exercises_position ON exercises(position) WHERE is_active = TRUE;

-- ============================================
-- RLS (Row Level Security)
-- ============================================

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active exercises
DROP POLICY IF EXISTS "Anyone can view active exercises" ON exercises;
CREATE POLICY "Anyone can view active exercises" 
ON exercises FOR SELECT 
USING (is_active = TRUE);

-- Policy: Only service_role can insert/update (for sync)
DROP POLICY IF EXISTS "Service role can manage exercises" ON exercises;
CREATE POLICY "Service role can manage exercises"
ON exercises FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- TRIGGER: Auto-update updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_exercises_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_exercises_updated_at ON exercises;
CREATE TRIGGER trigger_exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_exercises_updated_at();

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 
  'Exercises table created successfully!' as status,
  COUNT(*) as total_exercises
FROM exercises;
