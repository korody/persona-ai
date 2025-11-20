-- ATUALIZAR ESTRUTURA E DADOS NO PROJETO PERSONA-AI
-- Execute este SQL no SQL Editor do Supabase (projeto persona-ai)

-- ============================================
-- 1. CRIAR TABELA SUBSCRIPTION_PLANS
-- ============================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price_brl DECIMAL(10,2) NOT NULL,
  credits_monthly INTEGER NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Política: todos podem ver planos ativos
CREATE POLICY "Anyone can view active subscription plans" ON subscription_plans
  FOR SELECT USING (is_active = true);

-- ============================================
-- 2. CRIAR TABELA USER_SUBSCRIPTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'expired'
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, plan_id)
);

-- Habilitar RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- 3. ADICIONAR COLUNA bonus_balance NA TABELA CREDITS
-- ============================================

ALTER TABLE credits 
ADD COLUMN IF NOT EXISTS bonus_balance INTEGER NOT NULL DEFAULT 0;

-- Atualizar créditos existentes
UPDATE credits 
SET bonus_balance = 0 
WHERE bonus_balance IS NULL;

-- ============================================
-- 4. POPULAR SUBSCRIPTION_PLANS
-- ============================================

INSERT INTO subscription_plans (slug, name, description, price_brl, credits_monthly, features, sort_order, is_active)
VALUES 
  -- Plano Aprendiz
  (
    'aprendiz',
    'Aprendiz',
    'Ideal para começar sua jornada com o Mestre Ye',
    29.90,
    50,
    '[
      "50 interações por mês com o Mestre Ye",
      "Chat ilimitado (1 crédito por interação)",
      "Histórico de 30 dias",
      "Suporte via email"
    ]'::jsonb,
    1,
    true
  ),
  
  -- Plano Discípulo (MAIS POPULAR)
  (
    'discipulo',
    'Discípulo',
    'Para quem quer mergulhar fundo na medicina chinesa',
    59.90,
    250,
    '[
      "250 interações por mês com o Mestre Ye",
      "Chat ilimitado (1 crédito por interação)",
      "Histórico completo",
      "Áudio (Text-to-Speech)",
      "Suporte prioritário",
      "Acesso antecipado a novos recursos"
    ]'::jsonb,
    2,
    true
  ),
  
  -- Plano Mestre
  (
    'mestre',
    'Mestre',
    'Experiência completa e personalizada',
    129.90,
    600,
    '[
      "600 interações por mês com o Mestre Ye",
      "Tudo do plano Discípulo",
      "Áudio bidirecional (falar e ouvir)",
      "Upload de imagens para análise",
      "Suporte VIP dedicado",
      "Sessões mensais em grupo (em breve)"
    ]'::jsonb,
    3,
    true
  )
ON CONFLICT (slug) 
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_brl = EXCLUDED.price_brl,
  credits_monthly = EXCLUDED.credits_monthly,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- ============================================
-- 3. NOTIFICAR POSTGREST PARA RECARREGAR CACHE
-- ============================================

NOTIFY pgrst, 'reload schema';

-- ============================================
-- 4. VERIFICAR DADOS
-- ============================================

-- Ver planos inseridos
SELECT 
  slug,
  name,
  price_brl,
  credits_monthly,
  is_active,
  sort_order
FROM subscription_plans 
ORDER BY sort_order;

-- Ver estrutura da tabela credits
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'credits'
ORDER BY ordinal_position;
