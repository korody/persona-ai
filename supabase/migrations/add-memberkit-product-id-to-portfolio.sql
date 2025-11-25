-- Adicionar coluna memberkit_product_id de volta à tabela avatar_portfolio
-- Para permitir vincular produtos do portfolio com cursos do Memberkit

ALTER TABLE avatar_portfolio 
ADD COLUMN IF NOT EXISTS memberkit_product_id INTEGER;

-- Criar índice para melhorar performance de buscas
CREATE INDEX IF NOT EXISTS idx_avatar_portfolio_memberkit_product_id 
ON avatar_portfolio(memberkit_product_id);

-- Comentário explicativo
COMMENT ON COLUMN avatar_portfolio.memberkit_product_id IS 'ID do curso no Memberkit (referência ao memberkit_course_id da tabela hub_courses)';

-- Verificar estrutura
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'avatar_portfolio'
ORDER BY ordinal_position;
