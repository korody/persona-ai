-- Atualizar função match_exercises para considerar coluna enabled
-- Agora filtra apenas exercícios de cursos ativos/habilitados

CREATE OR REPLACE FUNCTION match_exercises(
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
  is_active boolean,
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
    e.is_active,
    e.enabled,
    e.created_at,
    e.updated_at,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM exercises e
  WHERE 
    e.embedding IS NOT NULL
    AND e.is_active = true
    AND e.enabled = true
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION match_exercises IS 'Busca semântica de exercícios usando embeddings OpenAI. Retorna apenas exercícios de cursos habilitados (enabled=true) e ativos (is_active=true).';
