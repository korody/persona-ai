-- Migration: fecha a escrita em user_subscriptions para anon/authenticated
--
-- As políticas "Sistema pode criar/atualizar assinaturas" (papel public, true) deixavam
-- qualquer pessoa logada criar ou alterar qualquer assinatura pela chave pública,
-- por exemplo pôr-se no plano mestre e ganhar 600 créditos por mês no reset mensal.
-- Quem escreve aqui é o webhook do Stripe, que agora usa a service role (passa por cima da RLS).
-- Fica só a política de SELECT (auth.uid() = user_id).

DROP POLICY IF EXISTS "Sistema pode atualizar assinaturas" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Sistema pode criar assinaturas" ON public.user_subscriptions;

REVOKE INSERT, UPDATE, DELETE ON public.user_subscriptions FROM anon, authenticated;
