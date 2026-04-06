-- Migration: Criar função reset_free_monthly_credits
-- Chamada mensalmente pelo Vercel Cron (/api/cron/reset-credits)
-- Adiciona 20 créditos para usuários do plano FREE dentro do período de 6 meses

CREATE OR REPLACE FUNCTION reset_free_monthly_credits()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  credits_added INTEGER,
  new_balance INTEGER,
  months_active INTEGER
) AS $$
DECLARE
  v_user RECORD;
  v_months_active INTEGER;
  v_credits_to_add INTEGER := 20; -- Créditos mensais do plano FREE
  v_max_months INTEGER := 6;      -- Duração: 6 meses
  v_new_balance INTEGER;
BEGIN
  -- Iterar sobre todos os usuários do plano FREE ativos
  FOR v_user IN
    SELECT
      u.id AS user_id,
      u.email,
      c.balance,
      us.started_at
    FROM auth.users u
    JOIN credits c ON c.user_id = u.id
    JOIN user_subscriptions us ON us.user_id = u.id
    JOIN subscription_plans sp ON sp.id = us.plan_id
    WHERE sp.slug = 'free'
      AND us.status = 'active'
  LOOP
    -- Calcular quantos meses o usuário está ativo
    v_months_active := EXTRACT(
      MONTH FROM AGE(NOW(), v_user.started_at)
    ) + (EXTRACT(YEAR FROM AGE(NOW(), v_user.started_at)) * 12);

    -- Só adicionar créditos se ainda está dentro do período de 6 meses
    IF v_months_active < v_max_months THEN
      -- Adicionar créditos
      UPDATE credits
      SET balance = balance + v_credits_to_add,
          updated_at = NOW()
      WHERE user_id = v_user.user_id
      RETURNING balance INTO v_new_balance;

      -- Registrar transação
      INSERT INTO credit_transactions (
        user_id,
        amount,
        type,
        description,
        balance_after
      ) VALUES (
        v_user.user_id,
        v_credits_to_add,
        'monthly_reset',
        'Créditos mensais gratuitos - Plano FREE (mês ' || (v_months_active + 1) || ' de ' || v_max_months || ')',
        v_new_balance
      );

      -- Retornar resultado
      user_id       := v_user.user_id;
      email         := v_user.email;
      credits_added := v_credits_to_add;
      new_balance   := v_new_balance;
      months_active := v_months_active;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar se o plano FREE está correto
SELECT slug, credits_monthly, bonus_credits_duration_months
FROM subscription_plans
WHERE slug = 'free';
