-- Seed para tabela subscription_plans
-- Execute este SQL no Supabase SQL Editor

-- 1. Criar tabela (se não existir)
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

-- 2. Inserir planos
INSERT INTO subscription_plans (slug, name, description, price_brl, credits_monthly, features, sort_order)
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
    1
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
    2
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
    3
  )
ON CONFLICT (slug) 
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_brl = EXCLUDED.price_brl,
  credits_monthly = EXCLUDED.credits_monthly,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- 3. Verificar dados inseridos
SELECT * FROM subscription_plans ORDER BY sort_order;
