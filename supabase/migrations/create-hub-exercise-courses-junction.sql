-- Migration: Junction table hub_exercise_courses
-- Permite que um exercício pertença a múltiplos cursos
-- Popula automaticamente a partir do memberkit_course_id existente em hub_exercises

-- 1. Criar junction table
CREATE TABLE IF NOT EXISTS hub_exercise_courses (
  exercise_id   UUID    NOT NULL REFERENCES hub_exercises(id) ON DELETE CASCADE,
  course_id     INTEGER NOT NULL REFERENCES hub_courses(memberkit_course_id) ON DELETE CASCADE,
  position      INTEGER,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (exercise_id, course_id)
);

-- Índices para queries frequentes
CREATE INDEX IF NOT EXISTS idx_hub_exercise_courses_exercise_id ON hub_exercise_courses(exercise_id);
CREATE INDEX IF NOT EXISTS idx_hub_exercise_courses_course_id   ON hub_exercise_courses(course_id);

-- 2. Popular a partir dos dados existentes em hub_exercises
INSERT INTO hub_exercise_courses (exercise_id, course_id, position, created_at)
SELECT
  e.id                                       AS exercise_id,
  e.memberkit_course_id::INTEGER             AS course_id,
  e.position                                 AS position,
  NOW()                                      AS created_at
FROM hub_exercises e
WHERE e.memberkit_course_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM hub_courses c
    WHERE c.memberkit_course_id = e.memberkit_course_id::INTEGER
  )
ON CONFLICT (exercise_id, course_id) DO NOTHING;

-- 3. View auxiliar: exercícios com nome do curso (facilita debug e queries)
CREATE OR REPLACE VIEW hub_exercises_with_courses AS
SELECT
  e.*,
  c.course_name,
  c.memberkit_course_slug AS course_slug
FROM hub_exercises e
JOIN hub_exercise_courses ec ON ec.exercise_id = e.id
JOIN hub_courses c            ON c.memberkit_course_id = ec.course_id;

-- 4. Função: buscar exercícios por course_id com filtros opcionais
CREATE OR REPLACE FUNCTION get_exercises_by_course(
  p_course_id     INTEGER,
  p_element       TEXT    DEFAULT NULL,
  p_match_count   INTEGER DEFAULT 10
)
RETURNS SETOF hub_exercises
LANGUAGE sql STABLE
AS $$
  SELECT e.*
  FROM hub_exercises e
  JOIN hub_exercise_courses ec ON ec.exercise_id = e.id
  WHERE ec.course_id = p_course_id
    AND e.is_active = TRUE
    AND (p_element IS NULL OR e.element = p_element)
  ORDER BY e.position
  LIMIT p_match_count;
$$;

-- Verificação pós-migration
SELECT
  c.course_name,
  COUNT(ec.exercise_id) AS total_exercises
FROM hub_courses c
LEFT JOIN hub_exercise_courses ec ON ec.course_id = c.memberkit_course_id
GROUP BY c.course_name
ORDER BY total_exercises DESC;
