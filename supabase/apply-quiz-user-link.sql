-- ============================================
-- 🔗 VINCULAÇÃO ROBUSTA: QUIZ → USUÁRIO
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1️⃣ ADICIONAR COLUNAS NECESSÁRIAS
-- user_id: Permite vincular diagnóstico ao usuário autenticado
ALTER TABLE quiz_leads 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN quiz_leads.user_id IS 'ID do usuário autenticado. NULL = lead que ainda não se cadastrou';

-- 2️⃣ CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_quiz_leads_user_id ON quiz_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_email ON quiz_leads(email);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_celular ON quiz_leads(celular);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_user_email ON quiz_leads(user_id, email);

-- 3️⃣ FUNÇÃO: Vincular quiz ao novo usuário (trigger automático no signup)
CREATE OR REPLACE FUNCTION link_quiz_to_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_quiz_id UUID;
  v_matched_by TEXT;
BEGIN
  -- 🎯 BUSCA PRIORIZADA: Celular (mais único) → Email (mais comum)
  
  -- Prioridade 1: Celular
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    SELECT id INTO v_quiz_id
    FROM quiz_leads
    WHERE celular = NEW.phone
      AND user_id IS NULL
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_quiz_id IS NOT NULL THEN
      v_matched_by := 'celular';
    END IF;
  END IF;
  
  -- Prioridade 2: Email (se não encontrou por celular)
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
  
  -- Vincular se encontrou
  IF v_quiz_id IS NOT NULL THEN
    UPDATE quiz_leads
    SET user_id = NEW.id,
        updated_at = NOW()
    WHERE id = v_quiz_id;
    
    RAISE NOTICE '✅ Quiz % vinculado ao usuário % via %', v_quiz_id, NEW.id, v_matched_by;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION link_quiz_to_new_user() IS 'Trigger que vincula quiz_leads ao novo usuário via celular ou email';

-- 4️⃣ CRIAR TRIGGER (executa automaticamente após INSERT em auth.users)
DROP TRIGGER IF EXISTS on_user_created_link_quiz ON auth.users;
CREATE TRIGGER on_user_created_link_quiz
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION link_quiz_to_new_user();

-- 5️⃣ FUNÇÃO HELPER: Buscar diagnóstico do usuário
-- Uso: SELECT * FROM get_user_quiz_lead('user-uuid-aqui')
CREATE OR REPLACE FUNCTION get_user_quiz_lead(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  email VARCHAR,
  nome VARCHAR,
  celular VARCHAR,
  elemento_principal VARCHAR,
  diagnostico_resumo TEXT,
  contagem_elementos JSONB,
  intensidade_calculada INT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ql.id,
    ql.email,
    ql.nome,
    ql.celular,
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

COMMENT ON FUNCTION get_user_quiz_lead(UUID) IS 'Busca o diagnóstico mais recente do usuário';

-- ============================================
-- 6️⃣ MIGRAÇÃO DE DADOS EXISTENTES (OPCIONAL)
-- Vincular quizzes históricos aos usuários já cadastrados
-- ⚠️ DESCOMENTE APENAS SE QUISER MIGRAR DADOS ANTIGOS
-- ============================================

/*
-- Ver quantos serão vinculados (DRY RUN)
SELECT 
  COUNT(*) as total_a_vincular,
  COUNT(DISTINCT ql.id) as quizzes_unicos,
  COUNT(DISTINCT u.id) as usuarios_unicos
FROM quiz_leads ql
JOIN auth.users u ON (
  (u.phone IS NOT NULL AND ql.celular = u.phone)
  OR (ql.email = u.email)
)
WHERE ql.user_id IS NULL;

-- Aplicar vinculação (EXECUTAR APENAS UMA VEZ)
UPDATE quiz_leads ql
SET user_id = u.id,
    updated_at = NOW()
FROM auth.users u
WHERE ql.user_id IS NULL
  AND (
    (u.phone IS NOT NULL AND ql.celular = u.phone) -- Prioridade 1: celular
    OR (ql.email = u.email) -- Prioridade 2: email
  );

-- Confirmar resultado
SELECT 
  COUNT(*) FILTER (WHERE user_id IS NOT NULL) as vinculados,
  COUNT(*) FILTER (WHERE user_id IS NULL) as nao_vinculados,
  COUNT(*) as total
FROM quiz_leads;
*/

-- ============================================
-- ✅ VALIDAÇÃO (execute para confirmar)
-- ============================================

-- Ver estrutura da coluna
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'quiz_leads' AND column_name = 'user_id';

-- Ver índices criados
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'quiz_leads'
ORDER BY indexname;

-- Ver triggers
SELECT tgname, tgtype, tgenabled
FROM pg_trigger 
WHERE tgrelid = 'quiz_leads'::regclass
  AND tgisinternal = false;

-- Status de vinculação
SELECT 
  CASE 
    WHEN user_id IS NOT NULL THEN '✅ Vinculado'
    ELSE '⏳ Aguardando cadastro'
  END as status,
  COUNT(*) as total
FROM quiz_leads
GROUP BY CASE WHEN user_id IS NOT NULL THEN '✅ Vinculado' ELSE '⏳ Aguardando cadastro' END
ORDER BY status;

-- ============================================
-- 🎉 MIGRATION COMPLETA!
-- ============================================
