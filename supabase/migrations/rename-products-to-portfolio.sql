-- Renomear avatar_products para avatar_portfolio
-- Remover coluna memberkit_product_id (não utilizada)

-- 1. Renomear a tabela
ALTER TABLE avatar_products RENAME TO avatar_portfolio;

-- 2. Remover coluna memberkit_product_id
ALTER TABLE avatar_portfolio DROP COLUMN IF EXISTS memberkit_product_id;

-- 3. Atualizar função get_recommended_products para usar nova tabela
DROP FUNCTION IF EXISTS get_recommended_products(VARCHAR, VARCHAR, INTEGER);

CREATE OR REPLACE FUNCTION get_recommended_products(
  p_avatar_slug VARCHAR,
  p_element VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  product_name VARCHAR,
  product_type VARCHAR,
  product_description TEXT,
  product_price_brl DECIMAL,
  product_url TEXT,
  memberkit_url TEXT,
  benefits TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ap.id,
    ap.product_name,
    ap.product_type,
    ap.product_description,
    ap.product_price_brl,
    ap.product_url,
    ap.memberkit_url,
    ap.benefits
  FROM avatar_portfolio ap
  WHERE ap.avatar_slug = p_avatar_slug
    AND ap.is_available = true
    AND (p_element IS NULL OR ap.element IS NULL OR ap.element = p_element)
  ORDER BY 
    ap.is_featured DESC,
    CASE WHEN ap.element = p_element THEN 0 ELSE 1 END,
    ap.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 4. Atualizar índices (se existirem)
-- O Postgres renomeia automaticamente índices quando a tabela é renomeada

-- 4. Atualizar índices (se existirem)
-- O Postgres renomeia automaticamente índices quando a tabela é renomeada

-- 5. Verificar estrutura da nova tabela
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'avatar_portfolio'
ORDER BY ordinal_position;

-- 6. Verificar dados migrados
SELECT COUNT(*) as total_produtos FROM avatar_portfolio;
