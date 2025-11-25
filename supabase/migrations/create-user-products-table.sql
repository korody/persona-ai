-- ============================================
-- CRIAR TABELA user_products
-- Armazena quais produtos cada usuário possui
-- ============================================

CREATE TABLE IF NOT EXISTS user_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id VARCHAR(255) NOT NULL, -- ID do produto no Memberkit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Garantir que não haja duplicatas
  UNIQUE(user_id, product_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_products_user_id ON user_products(user_id);
CREATE INDEX IF NOT EXISTS idx_user_products_product_id ON user_products(product_id);

-- RLS (Row Level Security)
ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários só veem seus próprios produtos
CREATE POLICY "Users can view their own products"
  ON user_products
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Service role pode fazer tudo (para webhooks do Memberkit)
CREATE POLICY "Service role can manage all products"
  ON user_products
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE user_products IS 'Produtos que cada usuário possui (integração com Memberkit)';
COMMENT ON COLUMN user_products.product_id IS 'ID do produto no Memberkit (ex: QIG, ADC, MAR)';
