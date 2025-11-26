-- Tabela para rastrear se usuário configurou senha manualmente
-- Isso permite diferenciar entre usuários que NUNCA tiveram senha
-- vs usuários que criaram senha depois (mesmo vindo do quiz)

CREATE TABLE IF NOT EXISTS public.user_password_status (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  has_password BOOLEAN NOT NULL DEFAULT false,
  password_created_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_user_password_status_user_id ON public.user_password_status(user_id);

-- RLS (Row Level Security)
ALTER TABLE public.user_password_status ENABLE ROW LEVEL SECURITY;

-- Dropar policies antigas se existirem
DROP POLICY IF EXISTS "Users can view own password status" ON public.user_password_status;
DROP POLICY IF EXISTS "Service role can manage password status" ON public.user_password_status;

-- Policy: usuários podem ver seu próprio status
CREATE POLICY "Users can view own password status"
  ON public.user_password_status
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: service_role pode fazer tudo
CREATE POLICY "Service role can manage password status"
  ON public.user_password_status
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Função para atualizar status de senha
CREATE OR REPLACE FUNCTION public.mark_user_has_password(p_user_id UUID)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_password_status (user_id, has_password, password_created_at, updated_at)
  VALUES (p_user_id, true, NOW(), NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    has_password = true,
    password_created_at = COALESCE(user_password_status.password_created_at, NOW()),
    updated_at = NOW();
END;
$$;

-- Atualizar função check_user_has_password para usar a nova tabela
CREATE OR REPLACE FUNCTION public.check_user_has_password(user_email TEXT)
RETURNS TABLE(has_password BOOLEAN, created_via_quiz BOOLEAN) 
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID;
  v_quiz_lead_exists BOOLEAN;
  v_password_status BOOLEAN;
BEGIN
  -- Buscar user_id
  SELECT au.id
  INTO v_user_id
  FROM auth.users au
  WHERE LOWER(au.email) = LOWER(user_email)
  LIMIT 1;

  -- Se usuário não existe, retornar false para ambos
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, false;
    RETURN;
  END IF;

  -- Verificar se tem registro em quiz_leads
  SELECT EXISTS(
    SELECT 1 
    FROM public.quiz_leads ql
    WHERE ql.user_id = v_user_id
  ) INTO v_quiz_lead_exists;

  -- Verificar status de senha na tabela dedicada
  SELECT COALESCE(ups.has_password, false)
  INTO v_password_status
  FROM public.user_password_status ups
  WHERE ups.user_id = v_user_id;

  -- Se não tem registro na tabela, significa que nunca criou senha
  IF v_password_status IS NULL THEN
    v_password_status := false;
  END IF;

  RETURN QUERY SELECT v_password_status, v_quiz_lead_exists;
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION public.mark_user_has_password(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_user_has_password(UUID) TO authenticated;

GRANT EXECUTE ON FUNCTION public.check_user_has_password(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_user_has_password(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_has_password(TEXT) TO anon;

COMMENT ON TABLE public.user_password_status IS 
'Rastreia se um usuário criou senha explicitamente. Usado para diferenciar usuários passwordless (quiz) de usuários com senha.';

COMMENT ON FUNCTION public.mark_user_has_password IS 
'Marca que um usuário criou/definiu senha. Deve ser chamado ao criar conta com senha ou ao definir senha posteriormente.';
