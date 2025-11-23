-- ============================================
-- 🔄 MIGRAÇÃO: Atualizar tabela subscription_plans
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Adicionar novas colunas se não existirem
ALTER TABLE subscription_plans 
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS estimated_conversations TEXT,
  ADD COLUMN IF NOT EXISTS popular BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS initial_bonus_credits INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bonus_credits_duration_months INTEGER DEFAULT 0;

-- Atualizar dados dos planos existentes
UPDATE subscription_plans SET
  description = 'Experimente o Mestre Ye gratuitamente',
  estimated_conversations = '50 interações por mês',
  popular = false,
  initial_bonus_credits = 50,
  bonus_credits_duration_months = 6
WHERE slug = 'free';

UPDATE subscription_plans SET
  description = 'Ideal para começar sua jornada com o Mestre Ye',
  estimated_conversations = '50 interações por mês',
  popular = false
WHERE slug = 'aprendiz';

UPDATE subscription_plans SET
  description = 'Para quem quer mergulhar fundo na medicina chinesa',
  estimated_conversations = '250 interações por mês',
  popular = true
WHERE slug = 'discipulo';

UPDATE subscription_plans SET
  description = 'Experiência completa e personalizada',
  estimated_conversations = '600 interações por mês',
  popular = false
WHERE slug = 'mestre';

-- ============================================
-- ✅ MIGRAÇÃO COMPLETA!
-- ============================================
