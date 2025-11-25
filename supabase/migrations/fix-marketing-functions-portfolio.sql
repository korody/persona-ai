-- Corrigir funções de marketing para usar avatar_portfolio
-- Atualizar get_recommended_products para usar a tabela correta

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
  memberkit_course_id INTEGER,
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
    ap.memberkit_course_id,
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

-- Testar a função
SELECT * FROM get_recommended_products('mestre-ye', NULL, 10);

-- Verificar produtos disponíveis
SELECT 
  product_name,
  product_type,
  memberkit_product_id,
  memberkit_url,
  is_available,
  is_featured,
  element
FROM avatar_portfolio
WHERE avatar_slug = 'mestre-ye'
ORDER BY is_available DESC, is_featured DESC;
