-- Script para configurar os créditos no Supabase
-- Execute isso no SQL Editor do Supabase

-- 1. Adicionar créditos para o seu usuário (substitua 'SEU_USER_ID' pelo ID real)
-- Para pegar seu user_id, execute: SELECT id, email FROM auth.users;

INSERT INTO credits (user_id, balance, bonus_balance, total_earned, total_spent)
VALUES (
  'SEU_USER_ID',  -- Substitua pelo seu user_id real
  100,            -- Créditos normais
  20,             -- Créditos bônus
  120,            -- Total ganho
  0               -- Total gasto
)
ON CONFLICT (user_id) 
DO UPDATE SET
  balance = 100,
  bonus_balance = 20,
  total_earned = 120,
  updated_at = now();

-- 2. Ou, se preferir, adicionar créditos para TODOS os usuários existentes:
INSERT INTO credits (user_id, balance, bonus_balance, total_earned, total_spent)
SELECT 
  id as user_id,
  100 as balance,
  20 as bonus_balance,
  120 as total_earned,
  0 as total_spent
FROM auth.users
ON CONFLICT (user_id) 
DO UPDATE SET
  balance = EXCLUDED.balance,
  bonus_balance = EXCLUDED.bonus_balance,
  total_earned = EXCLUDED.total_earned,
  updated_at = now();

-- 3. Verificar créditos dos usuários
SELECT 
  u.email,
  c.balance,
  c.bonus_balance,
  c.balance + c.bonus_balance as total,
  c.total_earned,
  c.total_spent
FROM auth.users u
LEFT JOIN credits c ON c.user_id = u.id;
