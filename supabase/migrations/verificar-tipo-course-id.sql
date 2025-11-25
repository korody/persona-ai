-- Verificar tipo da coluna memberkit_course_id em hub_exercises
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'hub_exercises' 
AND column_name = 'memberkit_course_id';

-- Ver alguns valores
SELECT DISTINCT 
  memberkit_course_id,
  memberkit_course_slug,
  COUNT(*) as total_exercicios
FROM hub_exercises
GROUP BY memberkit_course_id, memberkit_course_slug
ORDER BY total_exercicios DESC
LIMIT 10;
