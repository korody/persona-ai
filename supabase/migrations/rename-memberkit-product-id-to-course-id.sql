-- Renomear memberkit_product_id para memberkit_course_id na tabela avatar_portfolio
-- Este campo é usado para fazer o link entre produtos do portfólio e cursos do Memberkit

-- 1. Renomear a coluna
ALTER TABLE avatar_portfolio 
RENAME COLUMN memberkit_product_id TO memberkit_course_id;

-- 2. Atualizar índice
DROP INDEX IF EXISTS idx_avatar_portfolio_memberkit_product_id;
CREATE INDEX IF NOT EXISTS idx_avatar_portfolio_memberkit_course_id 
ON avatar_portfolio(memberkit_course_id);

-- 3. Verificar a mudança
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'avatar_portfolio' 
  AND column_name = 'memberkit_course_id';

-- 4. Verificar produtos com curso vinculado
SELECT 
  product_name,
  product_type,
  memberkit_course_id,
  product_url,
  is_available
FROM avatar_portfolio
WHERE avatar_slug = 'mestre-ye'
  AND memberkit_course_id IS NOT NULL
ORDER BY is_featured DESC;
