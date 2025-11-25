-- Query para exportar TODOS os cursos do Memberkit (ativos e desativados)
-- Execute no SQL Editor e exporte como CSV

SELECT 
  memberkit_course_slug as "Nome do Curso",
  memberkit_course_id as "ID do Curso",
  MIN(url) as "URL",
  BOOL_OR(enabled) as "Tem Aula Ativa"
FROM exercises
WHERE memberkit_course_id IS NOT NULL
  AND memberkit_course_slug IS NOT NULL
GROUP BY memberkit_course_id, memberkit_course_slug
ORDER BY memberkit_course_slug;
