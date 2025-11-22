-- ============================================
-- 🗑️ FUNÇÃO SEGURA DE EXCLUSÃO DE CONTA (LGPD)
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Tabela de log de exclusões (para auditoria LGPD)
CREATE TABLE IF NOT EXISTS account_deletions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  deleted_by TEXT, -- 'user' ou 'admin'
  reason TEXT,
  data_snapshot JSONB, -- snapshot dos dados principais antes da exclusão
  deleted_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE account_deletions IS 'Log de exclusões de conta para auditoria LGPD';

-- Função para exclusão segura de conta
CREATE OR REPLACE FUNCTION delete_user_account(
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_email TEXT;
  v_credits_balance INTEGER;
  v_conversations_count INTEGER;
  v_messages_count INTEGER;
  v_quiz_leads_count INTEGER;
  v_result JSONB;
BEGIN
  -- 1. Buscar dados do usuário antes da exclusão
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id;
  
  IF v_user_email IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário não encontrado'
    );
  END IF;
  
  -- 2. Contar dados que serão apagados/anonimizados
  SELECT balance INTO v_credits_balance
  FROM credits
  WHERE user_id = p_user_id;
  
  SELECT COUNT(*) INTO v_conversations_count
  FROM conversations
  WHERE user_id = p_user_id;
  
  SELECT COUNT(*) INTO v_messages_count
  FROM messages m
  JOIN conversations c ON c.id = m.conversation_id
  WHERE c.user_id = p_user_id;
  
  SELECT COUNT(*) INTO v_quiz_leads_count
  FROM quiz_leads
  WHERE user_id = p_user_id;
  
  -- 3. Criar snapshot dos dados principais
  INSERT INTO account_deletions (
    user_id,
    user_email,
    deleted_by,
    reason,
    data_snapshot
  ) VALUES (
    p_user_id,
    v_user_email,
    'user', -- ou 'admin' se for exclusão administrativa
    p_reason,
    jsonb_build_object(
      'email', v_user_email,
      'credits_balance', COALESCE(v_credits_balance, 0),
      'conversations_count', v_conversations_count,
      'messages_count', v_messages_count,
      'quiz_leads_count', v_quiz_leads_count,
      'deleted_at', now()
    )
  );
  
  -- 4. ANONIMIZAR quiz_leads ANTES de deletar (LGPD - dados sensíveis de saúde)
  -- Remove dados identificáveis mas mantém dados de saúde para fins estatísticos
  UPDATE quiz_leads
  SET 
    user_id = NULL,
    email = 'anonimizado_' || id::text || '@example.com',
    nome = 'Usuário Anonimizado',
    celular = NULL,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- 5. DELETAR usuário (CASCADE apagará: credits, credit_transactions, conversations, messages)
  DELETE FROM auth.users WHERE id = p_user_id;
  
  -- 6. Retornar resultado
  v_result := jsonb_build_object(
    'success', true,
    'message', 'Conta excluída com sucesso',
    'deleted_data', jsonb_build_object(
      'email', v_user_email,
      'credits_deleted', COALESCE(v_credits_balance, 0),
      'conversations_deleted', v_conversations_count,
      'messages_deleted', v_messages_count,
      'quiz_leads_anonymized', v_quiz_leads_count
    )
  );
  
  RAISE NOTICE '✅ Conta % excluída. Dados: %', v_user_email, v_result;
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION delete_user_account(UUID, TEXT) IS 'Função segura para exclusão de conta com logging LGPD';

-- ============================================
-- 📊 QUERIES DE AUDITORIA
-- ============================================

-- Ver histórico de exclusões
-- SELECT * FROM account_deletions ORDER BY deleted_at DESC LIMIT 10;

-- Estatísticas de exclusões
/*
SELECT 
  DATE(deleted_at) as data_exclusao,
  COUNT(*) as total_exclusoes,
  AVG((data_snapshot->>'conversations_count')::INTEGER) as media_conversas,
  AVG((data_snapshot->>'credits_balance')::INTEGER) as media_creditos
FROM account_deletions
GROUP BY DATE(deleted_at)
ORDER BY data_exclusao DESC;
*/

-- ============================================
-- 🔒 RLS (Row Level Security)
-- ============================================

-- Apenas admins podem ver logs de exclusão
ALTER TABLE account_deletions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view deletion logs" ON account_deletions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN ('admin@mestreye.com', 'contato@qigongbrasil.com')
    )
  );

-- ============================================
-- ✅ MIGRATION COMPLETA!
-- ============================================
