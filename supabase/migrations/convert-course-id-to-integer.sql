-- Converter memberkit_course_id de TEXT para INTEGER em hub_exercises

-- 1. Adicionar coluna temporária INTEGER
ALTER TABLE hub_exercises 
ADD COLUMN memberkit_course_id_int INTEGER;

-- 2. Converter valores TEXT para INTEGER
UPDATE hub_exercises 
SET memberkit_course_id_int = memberkit_course_id::INTEGER
WHERE memberkit_course_id IS NOT NULL AND memberkit_course_id ~ '^[0-9]+$';

-- 3. Dropar coluna antiga
ALTER TABLE hub_exercises 
DROP COLUMN memberkit_course_id;

-- 4. Renomear coluna nova para o nome original
ALTER TABLE hub_exercises 
RENAME COLUMN memberkit_course_id_int TO memberkit_course_id;

-- 5. Adicionar índice
CREATE INDEX IF NOT EXISTS idx_hub_exercises_course_id 
ON hub_exercises(memberkit_course_id);

-- 6. Verificar resultado
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'hub_exercises' 
AND column_name = 'memberkit_course_id';

-- 7. Testar JOIN
SELECT 
  c.memberkit_course_id,
  c.course_name,
  COUNT(e.id) as total_exercicios
FROM hub_courses c
LEFT JOIN hub_exercises e ON e.memberkit_course_id = c.memberkit_course_id
GROUP BY c.memberkit_course_id, c.course_name
ORDER BY total_exercicios DESC;
