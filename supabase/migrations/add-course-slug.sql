-- Adicionar coluna memberkit_course_slug
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS memberkit_course_slug TEXT;

-- Atualizar constraint para não permitir null (após popular)
-- ALTER TABLE exercises 
-- ALTER COLUMN memberkit_course_slug SET NOT NULL;
