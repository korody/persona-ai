-- ============================================
-- REMOVER CAMPO is_active DA TABELA EXERCISES
-- Simplificar: usar apenas 'enabled' para controle de ativação
-- ============================================

-- 1. Remover policy que depende de is_active
DROP POLICY IF EXISTS "Anyone can view active exercises" ON exercises;

-- 2. Recriar policy usando 'enabled'
CREATE POLICY "Anyone can view enabled exercises" ON exercises
  FOR SELECT
  USING (enabled = true);

-- 3. Remover função antiga
DROP FUNCTION IF EXISTS match_exercises(vector, float, int);

-- 4. Recriar função match_exercises para usar apenas 'enabled'
CREATE FUNCTION match_exercises(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  memberkit_course_id text,
  memberkit_course_slug text,
  memberkit_section_id text,
  memberkit_lesson_id text,
  title text,
  description text,
  url text,
  exercise_position integer,
  duration_minutes integer,
  level text,
  element text,
  organs text[],
  benefits text[],
  indications text[],
  contraindications text[],
  tags text[],
  enabled boolean,
  created_at timestamptz,
  updated_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.memberkit_course_id,
    e.memberkit_course_slug,
    e.memberkit_section_id,
    e.memberkit_lesson_id,
    e.title,
    e.description,
    e.url,
    e."position" as exercise_position,
    e.duration_minutes,
    e.level,
    e.element,
    e.organs,
    e.benefits,
    e.indications,
    e.contraindications,
    e.tags,
    e.enabled,
    e.created_at,
    e.updated_at,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM exercises e
  WHERE 
    e.embedding IS NOT NULL
    AND e.enabled = true
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 5. Remover índices antigos que usam is_active
DROP INDEX IF EXISTS idx_exercises_element;
DROP INDEX IF EXISTS idx_exercises_level;
DROP INDEX IF EXISTS idx_exercises_indications;
DROP INDEX IF EXISTS idx_exercises_tags;
DROP INDEX IF EXISTS idx_exercises_position;

-- 6. Recriar índices usando 'enabled' ao invés de 'is_active'
CREATE INDEX idx_exercises_element ON exercises(element) WHERE enabled = TRUE;
CREATE INDEX idx_exercises_level ON exercises(level) WHERE enabled = TRUE;
CREATE INDEX idx_exercises_indications ON exercises USING GIN(indications) WHERE enabled = TRUE;
CREATE INDEX idx_exercises_tags ON exercises USING GIN(tags) WHERE enabled = TRUE;
CREATE INDEX idx_exercises_position ON exercises("position") WHERE enabled = TRUE;

-- 7. Remover coluna is_active
ALTER TABLE exercises DROP COLUMN IF EXISTS is_active;
