-- ============================================
-- ATUALIZAÇÃO: Adicionar campos Memberkit
-- ============================================

-- Adicionar novas colunas à tabela existente avatar_products
ALTER TABLE avatar_products 
  ADD COLUMN IF NOT EXISTS memberkit_url TEXT,
  ADD COLUMN IF NOT EXISTS memberkit_product_id VARCHAR(255);

-- Atualizar comentários
COMMENT ON COLUMN avatar_products.product_url IS 'URL da página de vendas - usada quando usuário NÃO tem acesso ao produto';
COMMENT ON COLUMN avatar_products.memberkit_url IS 'URL do produto na plataforma Memberkit - usada quando usuário JÁ tem acesso';
COMMENT ON COLUMN avatar_products.memberkit_product_id IS 'ID do produto no Memberkit para verificar se usuário tem acesso';

-- Atualizar a função get_recommended_products
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
  memberkit_product_id VARCHAR,
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
    ap.memberkit_product_id,
    ap.benefits
  FROM avatar_products ap
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

-- ============================================
-- ✅ Execute este SQL no Supabase SQL Editor
-- ============================================
