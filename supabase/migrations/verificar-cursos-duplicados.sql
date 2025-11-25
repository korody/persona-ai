-- Verificar cursos duplicados na hub_courses

SELECT 
  memberkit_course_slug,
  COUNT(*) as quantidade,
  STRING_AGG(memberkit_course_id::text, ', ') as course_ids,
  STRING_AGG(course_name, ' | ') as nomes
FROM hub_courses
GROUP BY memberkit_course_slug
HAVING COUNT(*) > 1;

-- Ver todos os cursos
SELECT 
  memberkit_course_id,
  memberkit_course_slug,
  course_name,
  total_lessons,
  is_published
FROM hub_courses
ORDER BY course_name;
