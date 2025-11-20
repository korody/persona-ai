-- ============================================
-- RESET COMPLETO DE USUÁRIO PARA TESTES
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- Vai limpar todos os dados do usuário especificado

-- 1. DEFINA O EMAIL DO USUÁRIO A SER REMOVIDO
-- IMPORTANTE: Substitua pelo seu email!
DO $$
DECLARE
  target_email TEXT := 'marko@persona.cx'; -- ⚠️ ALTERE AQUI!
  target_user_id UUID;
BEGIN
  -- Buscar ID do usuário
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RAISE NOTICE 'Usuário com email % não encontrado', target_email;
    RETURN;
  END IF;

  RAISE NOTICE 'Limpando dados do usuário: % (ID: %)', target_email, target_user_id;

  -- 2. DELETAR CONVERSAS (se a tabela existir)
  RAISE NOTICE 'Deletando conversas...';
  DELETE FROM conversations WHERE user_id = target_user_id;

  -- 3. DELETAR BASE DE CONHECIMENTO
  RAISE NOTICE 'Deletando base de conhecimento...';
  DELETE FROM knowledge_chunks WHERE avatar_id IN (
    SELECT id FROM avatars WHERE user_id = target_user_id
  );
  DELETE FROM avatar_knowledge_base WHERE avatar_id IN (
    SELECT id FROM avatars WHERE user_id = target_user_id
  );

  -- 4. DELETAR EXEMPLOS DE CONVERSAS
  RAISE NOTICE 'Deletando exemplos de conversas...';
  DELETE FROM avatar_conversation_examples WHERE avatar_id IN (
    SELECT id FROM avatars WHERE user_id = target_user_id
  );

  -- 5. DELETAR CONVERSAS DESTACADAS
  RAISE NOTICE 'Deletando conversas destacadas...';
  DELETE FROM highlighted_conversations WHERE avatar_id IN (
    SELECT id FROM avatars WHERE user_id = target_user_id
  );

  -- 6. DELETAR PROMPTS
  RAISE NOTICE 'Deletando prompts...';
  DELETE FROM avatar_prompt_versions WHERE avatar_id IN (
    SELECT id FROM avatars WHERE user_id = target_user_id
  );

  -- 7. DELETAR AVATARES
  RAISE NOTICE 'Deletando avatares...';
  DELETE FROM avatars WHERE user_id = target_user_id;

  -- 8. DELETAR TRANSAÇÕES DE CRÉDITOS
  RAISE NOTICE 'Deletando histórico de créditos...';
  DELETE FROM credit_transactions WHERE user_id = target_user_id;

  -- 9. DELETAR CRÉDITOS
  RAISE NOTICE 'Deletando créditos...';
  DELETE FROM credits WHERE user_id = target_user_id;

  -- 10. DELETAR QUIZ/ANAMNESE
  RAISE NOTICE 'Deletando quiz/anamnese...';
  DELETE FROM quiz_leads WHERE email = target_email;

  -- 11. DELETAR ASSINATURA
  RAISE NOTICE 'Deletando assinaturas...';
  DELETE FROM subscriptions WHERE user_id = target_user_id;

  -- 12. DELETAR USUÁRIO DA AUTH
  RAISE NOTICE 'Deletando usuário do sistema de autenticação...';
  DELETE FROM auth.users WHERE id = target_user_id;

  RAISE NOTICE '✅ Limpeza completa! Usuário % removido.', target_email;
  RAISE NOTICE 'Agora você pode criar uma nova conta do zero.';
END $$;
