-- ============================================
-- VERIFICAR DADOS DO USUÁRIO ANTES DE LIMPAR
-- ============================================
-- Execute este script ANTES do reset para ver o que será deletado

-- IMPORTANTE: Substitua pelo seu email!
DO $$
DECLARE
  target_email TEXT := 'marko@persona.cx'; -- ⚠️ ALTERE AQUI!
  target_user_id UUID;
  count_conversations INT;
  count_messages INT;
  count_knowledge INT;
  count_credits_balance INT;
  count_quiz INT;
BEGIN
  -- Buscar ID do usuário
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RAISE NOTICE '❌ Usuário com email % não encontrado', target_email;
    RETURN;
  END IF;

  RAISE NOTICE '==============================================';
  RAISE NOTICE '📊 DADOS DO USUÁRIO: %', target_email;
  RAISE NOTICE 'ID: %', target_user_id;
  RAISE NOTICE '==============================================';

  -- Conversas
  SELECT COUNT(*) INTO count_conversations FROM conversations WHERE user_id = target_user_id;
  RAISE NOTICE '💬 Conversas: %', count_conversations;

  -- Mensagens
  SELECT COUNT(*) INTO count_messages FROM conversation_messages 
  WHERE conversation_id IN (SELECT id FROM conversations WHERE user_id = target_user_id);
  RAISE NOTICE '✉️  Mensagens: %', count_messages;

  -- Base de conhecimento
  SELECT COUNT(*) INTO count_knowledge FROM avatar_knowledge_base 
  WHERE avatar_id IN (SELECT id FROM avatars WHERE user_id = target_user_id);
  RAISE NOTICE '📚 Documentos de conhecimento: %', count_knowledge;

  -- Créditos
  SELECT COALESCE(balance + bonus_balance, 0) INTO count_credits_balance 
  FROM credits WHERE user_id = target_user_id;
  RAISE NOTICE '💰 Créditos atuais: %', count_credits_balance;

  -- Quiz/Diagnóstico
  SELECT COUNT(*) INTO count_quiz FROM quiz_leads WHERE email = target_email;
  RAISE NOTICE '🩺 Diagnósticos (Quiz): %', count_quiz;

  -- Mostrar dados do quiz se existir
  IF count_quiz > 0 THEN
    RAISE NOTICE '==============================================';
    RAISE NOTICE '📋 DADOS DO DIAGNÓSTICO:';
    FOR rec IN 
      SELECT elemento_principal, elemento_secundario, created_at 
      FROM quiz_leads 
      WHERE email = target_email 
      ORDER BY created_at DESC 
      LIMIT 1
    LOOP
      RAISE NOTICE '   Elemento Principal: %', rec.elemento_principal;
      RAISE NOTICE '   Elemento Secundário: %', rec.elemento_secundario;
      RAISE NOTICE '   Data: %', rec.created_at;
    END LOOP;
  END IF;

  RAISE NOTICE '==============================================';
END $$;
