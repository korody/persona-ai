-- ============================================
-- MIGRATION: Adicionar user_id à quiz_leads
-- Objetivo: Vincular diagnósticos aos usuários de forma sólida
-- ============================================

-- 1. Adicionar coluna user_id (nullable para leads que ainda não se cadastraram)
ALTER TABLE quiz_leads 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_quiz_leads_user_id ON quiz_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_email ON quiz_leads(email);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_telefone ON quiz_leads(telefone);

-- 3. Criar índice composto para busca híbrida otimizada
CREATE INDEX IF NOT EXISTS idx_quiz_leads_user_email ON quiz_leads(user_id, email);

-- 4. Adicionar constraint para evitar duplicação (um usuário não pode ter múltiplos quiz vinculados)
-- Comentado porque pode haver casos legítimos de múltiplos diagnósticos
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_leads_unique_user ON quiz_leads(user_id) WHERE user_id IS NOT NULL;

-- ============================================
-- TRIGGER: Vincular automaticamente quiz ao novo usuário
-- Busca por: 1) Telefone, 2) Email, 3) Mais recente
-- ============================================

CREATE OR REPLACE FUNCTION link_quiz_to_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_quiz_id UUID;
  v_matched_by TEXT;
BEGIN
  -- Buscar quiz leads não vinculados para este usuário
  -- Prioridade 1: Telefone (mais único e confiável)
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    SELECT id INTO v_quiz_id
    FROM quiz_leads
    WHERE telefone = NEW.phone
      AND user_id IS NULL
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_quiz_id IS NOT NULL THEN
      v_matched_by := 'telefone';
    END IF;
  END IF;
  
  -- Prioridade 2: Email (se não encontrou por telefone)
  IF v_quiz_id IS NULL THEN
    SELECT id INTO v_quiz_id
    FROM quiz_leads
    WHERE email = NEW.email
      AND user_id IS NULL
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_quiz_id IS NOT NULL THEN
      v_matched_by := 'email';
    END IF;
  END IF;
  
  -- Se encontrou algum quiz, vincular ao usuário
  IF v_quiz_id IS NOT NULL THEN
    UPDATE quiz_leads
    SET user_id = NEW.id,
        updated_at = NOW()
    WHERE id = v_quiz_id;
    
    -- Log para debug (opcional - comentar em produção se não quiser logs)
    RAISE NOTICE 'Quiz % vinculado ao usuário % via %', v_quiz_id, NEW.id, v_matched_by;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS on_user_created_link_quiz ON auth.users;
CREATE TRIGGER on_user_created_link_quiz
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION link_quiz_to_new_user();

-- ============================================
-- FUNÇÃO HELPER: Buscar diagnóstico do usuário
-- Para usar no código: SELECT * FROM get_user_quiz_lead('user-uuid')
-- ============================================

CREATE OR REPLACE FUNCTION get_user_quiz_lead(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  email VARCHAR,
  nome VARCHAR,
  telefone VARCHAR,
  elemento_principal VARCHAR,
  diagnostico_resumo TEXT,
  contagem_elementos JSONB,
  intensidade_calculada INT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Buscar quiz já vinculado por user_id
  RETURN QUERY
  SELECT 
    ql.id,
    ql.email,
    ql.nome,
    ql.telefone,
    ql.elemento_principal,
    ql.diagnostico_resumo,
    ql.contagem_elementos,
    ql.intensidade_calculada,
    ql.created_at
  FROM quiz_leads ql
  WHERE ql.user_id = p_user_id
  ORDER BY ql.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MIGRATION DE DADOS EXISTENTES (OPCIONAL)
-- Vincular quiz_leads existentes aos usuários já cadastrados
-- Execute apenas se quiser vincular dados históricos
-- ============================================

-- DESCOMENTE PARA EXECUTAR:
/*
UPDATE quiz_leads ql
SET user_id = u.id
FROM auth.users u
WHERE ql.user_id IS NULL
  AND (
    -- Match por telefone (prioridade 1)
    (u.phone IS NOT NULL AND ql.telefone = u.phone)
    OR
    -- Match por email (prioridade 2)
    (ql.email = u.email)
  );
*/

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON COLUMN quiz_leads.user_id IS 'ID do usuário autenticado. NULL = lead que ainda não se cadastrou';
COMMENT ON FUNCTION link_quiz_to_new_user() IS 'Trigger que vincula quiz_leads ao novo usuário via telefone ou email';
COMMENT ON FUNCTION get_user_quiz_lead(UUID) IS 'Busca o diagnóstico mais recente do usuário';
