-- Atualizar créditos do usuário marko@persona.cx para 2

-- 1. Ver dados atuais do usuário
SELECT
  u.id,
  u.email,
  c.balance,
  c.bonus_balance,
  c.total_spent
FROM auth.users u
LEFT JOIN credits c ON u.id = c.user_id
WHERE u.email = 'marko@persona.cx';

-- 2. Atualizar para 2 créditos (no balance)
UPDATE credits
SET balance = 2, updated_at = now()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'marko@persona.cx');

-- 3. Verificar resultado
SELECT
  u.id,
  u.email,
  c.balance,
  c.bonus_balance,
  c.total_spent,
  c.updated_at
FROM auth.users u
LEFT JOIN credits c ON u.id = c.user_id
WHERE u.email = 'marko@persona.cx';
