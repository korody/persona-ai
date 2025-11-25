-- Verificar tabela hub_courses

-- 1. Verificar se tabela existe
SELECT 'Tabela hub_courses existe' as status
FROM information_schema.tables 
WHERE table_name = 'hub_courses';

-- 2. Contar cursos
SELECT COUNT(*) as total_cursos 
FROM hub_courses;

-- 3. Ver estrutura
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'hub_courses'
ORDER BY ordinal_position;

-- 4. Ver alguns cursos (se existirem)
SELECT 
  memberkit_course_id,
  memberkit_course_slug,
  course_name,
  total_lessons,
  is_published
FROM hub_courses
LIMIT 10;

-- 5. Contar exercícios por curso na hub_exercises
SELECT 
  memberkit_course_id,
  memberkit_course_slug,
  COUNT(*) as total_exercicios,
  COUNT(*) FILTER (WHERE embedding IS NOT NULL) as com_embeddings,
  COUNT(*) FILTER (WHERE duration_minutes IS NOT NULL) as categorizados
FROM hub_exercises
GROUP BY memberkit_course_id, memberkit_course_slug
ORDER BY total_exercicios DESC;
