-- ============================================
-- ROLLBACK: Remover todas as tabelas de treinamento/RAG
-- Execute no Supabase SQL Editor se quiser voltar ao estado anterior
-- ============================================

-- ⚠️  ATENÇÃO: Isto vai DELETAR todas as tabelas e dados criados nas migrations!

-- Remover todas as policies primeiro
DROP POLICY IF EXISTS "Public read active examples" ON avatar_conversation_examples;
DROP POLICY IF EXISTS "Service role all examples" ON avatar_conversation_examples;
DROP POLICY IF EXISTS "Public read chunks" ON knowledge_chunks;
DROP POLICY IF EXISTS "Service role all chunks" ON knowledge_chunks;
DROP POLICY IF EXISTS "Users view own memory" ON user_memory;
DROP POLICY IF EXISTS "Service role all memory" ON user_memory;
DROP POLICY IF EXISTS "Users view own prefs" ON user_communication_preferences;
DROP POLICY IF EXISTS "Users update own prefs" ON user_communication_preferences;
DROP POLICY IF EXISTS "Service role all prefs" ON user_communication_preferences;
DROP POLICY IF EXISTS "Users create feedback" ON conversation_feedback;
DROP POLICY IF EXISTS "Users view own feedback" ON conversation_feedback;
DROP POLICY IF EXISTS "Service role all feedback" ON conversation_feedback;
DROP POLICY IF EXISTS "Service role all patterns" ON learned_patterns;
DROP POLICY IF EXISTS "Service role all highlighted" ON highlighted_conversations;

-- Remover funções
DROP FUNCTION IF EXISTS search_knowledge(UUID, VECTOR, INTEGER, FLOAT);
DROP FUNCTION IF EXISTS search_knowledge_with_anamnese(UUID, VECTOR, TEXT, TEXT[], INTEGER, INTEGER);
DROP FUNCTION IF EXISTS search_knowledge_generic(UUID, VECTOR, INTEGER);
DROP FUNCTION IF EXISTS insert_knowledge_with_embedding(UUID, TEXT, TEXT, VARCHAR, TEXT[], FLOAT[], JSONB);
DROP FUNCTION IF EXISTS update_avatar_personality(UUID, TEXT, DECIMAL, INTEGER);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Remover tabelas (em ordem reversa das dependências)
DROP TABLE IF EXISTS highlighted_conversations CASCADE;
DROP TABLE IF EXISTS learned_patterns CASCADE;
DROP TABLE IF EXISTS conversation_feedback CASCADE;
DROP TABLE IF EXISTS user_communication_preferences CASCADE;
DROP TABLE IF EXISTS user_memory CASCADE;
DROP TABLE IF EXISTS knowledge_chunks CASCADE;
DROP TABLE IF EXISTS avatar_prompt_versions CASCADE;
DROP TABLE IF EXISTS avatar_conversation_examples CASCADE;
DROP TABLE IF EXISTS avatar_knowledge_base CASCADE;

-- Remover bucket de storage
DELETE FROM storage.objects WHERE bucket_id = 'knowledge-base';
DELETE FROM storage.buckets WHERE id = 'knowledge-base';

-- Verificar o que sobrou
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (
    table_name LIKE '%avatar%'
    OR table_name LIKE '%knowledge%'
    OR table_name LIKE '%feedback%'
    OR table_name LIKE '%pattern%'
  )
ORDER BY table_name;

-- Notificar PostgREST
NOTIFY pgrst, 'reload schema';

SELECT '✅ Rollback completo! Banco de dados limpo.' as status;
