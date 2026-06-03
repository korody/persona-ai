-- Migration: reset_monthly_credits_all (v2)
-- Chamada mensalmente pelo Vercel Cron (/api/cron/reset-credits)
--
-- Reseta o balance de TODOS os usuários, classificando assim:
--   - Tem user_subscriptions.status='active' → usa credits_monthly do plano
--   - Não tem subscription ativa            → trata como FREE (20 créditos)
--
-- Comportamento: SUBSTITUI o balance (modelo "use ou perca").
-- bonus_balance NÃO é alterado (créditos promocionais/boas-vindas têm vida própria).
--
-- Por que LEFT JOIN em vez de INNER: hoje a tabela subscription_plans só tem
-- os 3 planos pagos (aprendiz=50, discipulo=250, mestre=600), e
-- user_subscriptions só é populado pelo webhook do Stripe. Logo, usuários
-- FREE existem apenas como linha em `credits` — precisam ser pegos por LEFT JOIN.

DROP FUNCTION IF EXISTS reset_free_monthly_credits();
DROP FUNCTION IF EXISTS reset_monthly_credits_all();

CREATE OR REPLACE FUNCTION reset_monthly_credits_all()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  plan_slug TEXT,
  credits_set INTEGER,
  previous_balance INTEGER,
  new_balance INTEGER
) AS $$
DECLARE
  v_user RECORD;
  v_previous_balance INTEGER;
  v_credits_to_set INTEGER;
  v_plan_slug TEXT;
  v_free_credits CONSTANT INTEGER := 20;
BEGIN
  FOR v_user IN
    SELECT
      u.id              AS user_id,
      u.email           AS email,
      c.balance         AS current_balance,
      sp.slug           AS plan_slug,
      sp.credits_monthly AS plan_credits
    FROM auth.users u
    JOIN credits c ON c.user_id = u.id
    LEFT JOIN user_subscriptions us
      ON us.user_id = u.id AND us.status = 'active'
    LEFT JOIN subscription_plans sp
      ON sp.id = us.plan_id
  LOOP
    v_previous_balance := v_user.current_balance;

    IF v_user.plan_credits IS NOT NULL THEN
      v_credits_to_set := v_user.plan_credits;
      v_plan_slug      := v_user.plan_slug;
    ELSE
      v_credits_to_set := v_free_credits;
      v_plan_slug      := 'free';
    END IF;

    UPDATE credits
    SET balance    = v_credits_to_set,
        updated_at = NOW()
    WHERE credits.user_id = v_user.user_id;

    INSERT INTO credit_transactions (
      user_id,
      amount,
      type,
      description,
      balance_after
    ) VALUES (
      v_user.user_id,
      v_credits_to_set,
      'monthly_reset',
      'Reset mensal - plano ' || v_plan_slug || ' (' || v_credits_to_set || ' créditos)',
      v_credits_to_set
    );

    user_id          := v_user.user_id;
    email            := v_user.email;
    plan_slug        := v_plan_slug;
    credits_set      := v_credits_to_set;
    previous_balance := v_previous_balance;
    new_balance      := v_credits_to_set;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION reset_monthly_credits_all() IS
  'Reseta o balance de todos os usuários. Usuários com subscription ativa recebem credits_monthly do plano; demais recebem 20 (FREE). Chamada pelo Vercel Cron no dia 1.';
