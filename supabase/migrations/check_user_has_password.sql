-- Função para verificar se um usuário tem senha cadastrada
-- Acessa diretamente auth.users.encrypted_password
CREATE OR REPLACE FUNCTION public.check_user_has_password(user_email TEXT)
RETURNS TABLE(has_password BOOLEAN, created_via_quiz BOOLEAN) 
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID;
  v_app_metadata JSONB;
  v_quiz_lead_exists BOOLEAN;
  v_is_passwordless BOOLEAN;
BEGIN
  -- Buscar user_id e app_metadata
  SELECT 
    au.id,
    au.raw_app_meta_data
  INTO 
    v_user_id,
    v_app_metadata
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

  -- Verificar se app_metadata indica que é passwordless
  v_is_passwordless := COALESCE(
    (v_app_metadata->>'passwordless')::boolean,
    (v_app_metadata->>'created_via_quiz')::boolean,
    false
  );

  -- LÓGICA ROBUSTA:
  -- has_password = false se:
  --   1. app_metadata.passwordless = true OU
  --   2. app_metadata.created_via_quiz = true
  -- Caso contrário, assume que tem senha
  
  RETURN QUERY SELECT 
    NOT v_is_passwordless,  -- Inverte: se é passwordless, não tem senha
    v_quiz_lead_exists;
END;
$$;

-- Permitir acesso para service_role
GRANT EXECUTE ON FUNCTION public.check_user_has_password(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_user_has_password(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_has_password(TEXT) TO anon;

COMMENT ON FUNCTION public.check_user_has_password IS 
'Verifica se um usuário tem senha cadastrada verificando auth.users.encrypted_password. Também verifica se foi criado via quiz.';
