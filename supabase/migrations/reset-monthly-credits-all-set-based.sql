-- Migration: reset_monthly_credits_all (v3, em SQL de conjunto)
-- Chamada mensalmente pelo Vercel Cron (/api/cron/reset-credits)
--
-- Por que mudou: a v2 fazia um loop com 1 UPDATE + 1 INSERT por usuário (~31 mil contas)
-- e devolvia uma linha por usuário. Chamada pelo PostgREST, estoura o statement_timeout
-- do papel authenticator (8s) e desfaz tudo: o reset de 1º/10 e o de 1º/11 não rodaram.
--
-- Regra (igual à v2):
--   - user_subscriptions.status='active' → credits_monthly do plano (se tiver mais de uma, a maior)
--   - sem assinatura ativa               → FREE (20 créditos)
--   - SUBSTITUI o balance; bonus_balance NÃO muda.
-- Agora também grava last_reset_at e devolve só a contagem por plano.

DROP FUNCTION IF EXISTS reset_monthly_credits_all();

CREATE OR REPLACE FUNCTION reset_monthly_credits_all()
RETURNS TABLE (
  plan_slug TEXT,
  users_reset BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH plan_by_user AS (
    SELECT DISTINCT ON (us.user_id)
      us.user_id,
      sp.slug,
      sp.credits_monthly
    FROM user_subscriptions us
    JOIN subscription_plans sp ON sp.id = us.plan_id
    WHERE us.status = 'active'
    ORDER BY us.user_id, sp.credits_monthly DESC
  ),
  updated AS (
    UPDATE credits c
    SET balance       = COALESCE(p.credits_monthly, 20),
        last_reset_at = NOW(),
        updated_at    = NOW()
    FROM auth.users u
    LEFT JOIN plan_by_user p ON p.user_id = u.id
    WHERE c.user_id = u.id
    RETURNING c.user_id, c.balance AS credits_set, COALESCE(p.slug, 'free') AS slug
  ),
  logged AS (
    INSERT INTO credit_transactions (user_id, amount, type, description, balance_after)
    SELECT
      updated.user_id,
      updated.credits_set,
      'monthly_reset',
      'Reset mensal - plano ' || updated.slug || ' (' || updated.credits_set || ' créditos)',
      updated.credits_set
    FROM updated
    RETURNING 1
  )
  SELECT updated.slug, COUNT(*)::BIGINT
  FROM updated
  GROUP BY updated.slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION reset_monthly_credits_all() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION reset_monthly_credits_all() TO service_role;

COMMENT ON FUNCTION reset_monthly_credits_all() IS
  'Reseta o balance de todos os usuários (plano ativo = credits_monthly, demais = 20). bonus_balance não muda. Devolve a contagem por plano. Chamada pelo Vercel Cron no dia 1.';
