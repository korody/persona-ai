-- ============================================
-- MARKETING CONFIGURATION FOR AVATARS
-- Campanhas ativas e produtos disponíveis
-- ============================================

-- 1. Tabela de campanhas ativas
CREATE TABLE IF NOT EXISTS avatar_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  avatar_slug VARCHAR(100) NOT NULL,
  
  -- Informações da campanha
  campaign_name VARCHAR(255) NOT NULL,
  campaign_description TEXT,
  campaign_cta TEXT, -- Call to action (ex: "Inscreva-se agora!")
  campaign_url TEXT, -- Link de destino
  
  -- Período de vigência
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- Maior prioridade = mais importante
  
  -- Contexto para IA
  target_audience TEXT, -- Ex: "Pessoas com dor nas costas", "Iniciantes em Qi Gong"
  suggested_moments TEXT, -- Ex: "Quando usuário mencionar evento, quando perguntar sobre cursos"
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de produtos disponíveis
CREATE TABLE IF NOT EXISTS avatar_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  avatar_slug VARCHAR(100) NOT NULL,
  
  -- Informações do produto
  product_name VARCHAR(255) NOT NULL,
  product_type VARCHAR(100), -- Ex: "curso", "mentoria", "ebook", "evento"
  product_description TEXT,
  product_price_brl DECIMAL(10,2),
  product_url TEXT, -- URL da página de vendas (para quem NÃO tem acesso)
  memberkit_url TEXT, -- URL do produto na plataforma de membros (para quem JÁ tem acesso)
  memberkit_product_id VARCHAR(255), -- ID do produto no Memberkit para verificação de acesso
  
  -- Categorização
  tags TEXT[], -- Ex: ["dor nas costas", "iniciante", "avançado"]
  element VARCHAR(50), -- Ex: "METAL", "FOGO" (null = todos)
  
  -- Status
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false, -- Produto em destaque
  
  -- Contexto para IA
  recommended_for TEXT, -- Quando recomendar este produto
  benefits TEXT, -- Principais benefícios
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_campaigns_avatar_active 
  ON avatar_campaigns(avatar_slug, is_active, priority DESC);

CREATE INDEX IF NOT EXISTS idx_campaigns_dates 
  ON avatar_campaigns(start_date, end_date) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_products_avatar_available 
  ON avatar_products(avatar_slug, is_available);

CREATE INDEX IF NOT EXISTS idx_products_element 
  ON avatar_products(element) 
  WHERE is_available = true;

-- 4. Função para buscar campanha ativa
CREATE OR REPLACE FUNCTION get_active_campaign(p_avatar_slug VARCHAR)
RETURNS TABLE (
  id UUID,
  campaign_name VARCHAR,
  campaign_description TEXT,
  campaign_cta TEXT,
  campaign_url TEXT,
  target_audience TEXT,
  suggested_moments TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ac.id,
    ac.campaign_name,
    ac.campaign_description,
    ac.campaign_cta,
    ac.campaign_url,
    ac.target_audience,
    ac.suggested_moments
  FROM avatar_campaigns ac
  WHERE ac.avatar_slug = p_avatar_slug
    AND ac.is_active = true
    AND (ac.start_date IS NULL OR ac.start_date <= now())
    AND (ac.end_date IS NULL OR ac.end_date >= now())
  ORDER BY ac.priority DESC, ac.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 5. Função para buscar produtos recomendados
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

-- 6. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_marketing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON avatar_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_marketing_updated_at();

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON avatar_products
  FOR EACH ROW
  EXECUTE FUNCTION update_marketing_updated_at();

-- 7. Comentários para documentação
COMMENT ON TABLE avatar_campaigns IS 'Campanhas de marketing ativas para cada avatar';
COMMENT ON TABLE avatar_products IS 'Produtos e serviços disponíveis para recomendação';
COMMENT ON COLUMN avatar_campaigns.priority IS 'Maior valor = maior prioridade. Usado quando há múltiplas campanhas ativas.';
COMMENT ON COLUMN avatar_products.is_featured IS 'Produto em destaque - aparece primeiro nas recomendações';
COMMENT ON COLUMN avatar_products.product_url IS 'URL da página de vendas - usada quando usuário NÃO tem acesso ao produto';
COMMENT ON COLUMN avatar_products.memberkit_url IS 'URL do produto na plataforma Memberkit - usada quando usuário JÁ tem acesso';
COMMENT ON COLUMN avatar_products.memberkit_product_id IS 'ID do produto no Memberkit para verificar se usuário tem acesso';

-- ============================================
-- ✅ Execute este SQL no Supabase SQL Editor
-- ============================================
