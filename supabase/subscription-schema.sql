-- ============================================
-- 📊 SCHEMA DE ASSINATURAS E CRÉDITOS
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Tabela: subscription_plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL, -- 'free', 'aprendiz', 'discipulo', 'mestre'
  name TEXT NOT NULL,
  price_brl DECIMAL(10,2) NOT NULL,
  credits_monthly INTEGER NOT NULL,
  stripe_price_id TEXT, -- NULL para FREE
  is_active BOOLEAN DEFAULT true,
  features JSONB, -- Array de features
  history_days INTEGER, -- -1 para ilimitado
  description TEXT,
  estimated_conversations TEXT,
  popular BOOLEAN DEFAULT false,
  initial_bonus_credits INTEGER DEFAULT 0, -- Créditos de boas-vindas (FREE)
  bonus_credits_duration_months INTEGER DEFAULT 0, -- Duração dos créditos mensais (FREE)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE subscription_plans IS 'Planos de assinatura disponíveis';

-- Seed inicial com os 4 planos
INSERT INTO subscription_plans (
  slug, 
  name, 
  price_brl, 
  credits_monthly, 
  history_days, 
  features,
  description,
  estimated_conversations,
  popular,
  initial_bonus_credits,
  bonus_credits_duration_months
) VALUES
(
  'free', 
  'FREE', 
  0.00, 
  20, 
  7, 
  '[
    "50 créditos de boas-vindas",
    "20 créditos por mês (durante 6 meses)",
    "Chat com Mestre Ye",
    "Histórico de 7 dias",
    "Acesso à biblioteca básica",
    "Suporte via email"
  ]'::jsonb,
  'Experimente o Mestre Ye gratuitamente',
  '50 interações (bônus) + 20/mês por 6 meses',
  false,
  50,
  6
),
(
  'aprendiz', 
  'Aprendiz', 
  29.90, 
  50, 
  30, 
  '[
    "50 créditos por mês",
    "Chat com Mestre Ye",
    "Histórico de 30 dias",
    "Acesso à biblioteca básica",
    "Suporte via email"
  ]'::jsonb,
  'Ideal para começar sua jornada com o Mestre Ye',
  '50 interações por mês',
  false,
  0,
  0
),
(
  'discipulo', 
  'Discípulo', 
  59.90, 
  250, 
  -1, 
  '[
    "250 créditos por mês",
    "Chat com Mestre Ye",
    "Histórico completo (ilimitado)",
    "Áudio (Text-to-Speech)",
    "Suporte prioritário (48h)",
    "Acesso antecipado a novos recursos",
    "Biblioteca completa de exercícios"
  ]'::jsonb,
  'Para quem quer mergulhar fundo na medicina chinesa',
  '250 interações por mês',
  true,
  0,
  0
),
(
  'mestre', 
  'Mestre', 
  129.90, 
  600, 
  -1, 
  '[
    "600 créditos por mês",
    "Tudo do plano Discípulo",
    "Upload de imagens para análise",
    "Suporte VIP dedicado (24h)",
    "Relatórios mensais de progresso",
    "Prioridade em novos recursos"
  ]'::jsonb,
  'Experiência completa e personalizada',
  '600 interações por mês',
  false,
  0,
  0
) ON CONFLICT (slug) DO NOTHING;

-- Tabela: user_subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  status TEXT NOT NULL, -- 'active', 'canceled', 'expired', 'past_due'
  current_credits INTEGER DEFAULT 0,
  bonus_credits INTEGER DEFAULT 0, -- Créditos bônus (FREE inicial)
  bonus_credits_expiry TIMESTAMPTZ, -- Validade dos bônus
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_subscription UNIQUE(user_id)
);

COMMENT ON TABLE user_subscriptions IS 'Assinaturas ativas dos usuários';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription ON user_subscriptions(stripe_subscription_id);

-- Tabela: credit_transactions (Log de uso)
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Negativo para uso, positivo para adição
  type TEXT NOT NULL, -- 'usage', 'refill', 'bonus', 'purchase', 'monthly_reset'
  description TEXT,
  conversation_id UUID, -- Referência à conversa (se aplicável)
  balance_after INTEGER, -- Saldo após a transação
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE credit_transactions IS 'Log de todas as transações de créditos';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_conversation_id ON credit_transactions(conversation_id);

-- ============================================
-- 🔒 ROW LEVEL SECURITY (RLS)
-- ============================================

-- subscription_plans: Todos podem ver, só admin pode editar
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans" ON subscription_plans
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Only admins can manage plans" ON subscription_plans
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN ('admin@mestreye.com', 'contato@qigongbrasil.com')
    )
  );

-- user_subscriptions: Usuário só vê sua própria assinatura
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON user_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert subscriptions" ON user_subscriptions
  FOR INSERT
  WITH CHECK (true); -- Webhook do Stripe precisa inserir

-- credit_transactions: Usuário só vê suas próprias transações
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON credit_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions" ON credit_transactions
  FOR INSERT
  WITH CHECK (true); -- Sistema precisa registrar uso

-- ============================================
-- 🔧 FUNÇÕES AUXILIARES
-- ============================================

-- Função para deduzir créditos (uso em conversa)
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_conversation_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_current_credits INTEGER;
  v_bonus_credits INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Buscar créditos atuais
  SELECT current_credits, bonus_credits 
  INTO v_current_credits, v_bonus_credits
  FROM user_subscriptions
  WHERE user_id = p_user_id AND status = 'active';
  
  IF v_current_credits IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Assinatura não encontrada'
    );
  END IF;
  
  -- Verificar se tem créditos suficientes
  IF (v_current_credits + v_bonus_credits) < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Créditos insuficientes',
      'available', v_current_credits + v_bonus_credits,
      'required', p_amount
    );
  END IF;
  
  -- Deduzir primeiro dos créditos regulares, depois bônus
  IF v_current_credits >= p_amount THEN
    UPDATE user_subscriptions
    SET current_credits = current_credits - p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  ELSE
    -- Deduz o que pode dos regulares
    UPDATE user_subscriptions
    SET current_credits = 0,
        bonus_credits = bonus_credits - (p_amount - v_current_credits),
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
  
  -- Pegar novo saldo
  SELECT current_credits + bonus_credits INTO v_new_balance
  FROM user_subscriptions
  WHERE user_id = p_user_id;
  
  -- Registrar transação
  INSERT INTO credit_transactions (
    user_id,
    amount,
    type,
    description,
    conversation_id,
    balance_after
  ) VALUES (
    p_user_id,
    -p_amount,
    'usage',
    'Uso em conversa',
    p_conversation_id,
    v_new_balance
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'credits_used', p_amount,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para resetar créditos mensais
CREATE OR REPLACE FUNCTION reset_monthly_credits(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_plan_credits INTEGER;
BEGIN
  -- Buscar créditos do plano
  SELECT sp.credits_monthly INTO v_plan_credits
  FROM user_subscriptions us
  JOIN subscription_plans sp ON sp.id = us.plan_id
  WHERE us.user_id = p_user_id;
  
  -- Resetar créditos
  UPDATE user_subscriptions
  SET current_credits = v_plan_credits,
      current_period_start = NOW(),
      current_period_end = NOW() + INTERVAL '1 month',
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Registrar transação
  INSERT INTO credit_transactions (
    user_id,
    amount,
    type,
    description,
    balance_after
  ) VALUES (
    p_user_id,
    v_plan_credits,
    'monthly_reset',
    'Reset mensal de créditos',
    v_plan_credits
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ✅ MIGRATION COMPLETA!
-- ============================================
-- Execute este arquivo no Supabase SQL Editor
-- Depois configure os STRIPE_PRICE_IDs no Stripe Dashboard
