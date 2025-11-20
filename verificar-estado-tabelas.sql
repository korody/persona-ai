-- Script de verificação: Checar o estado atual das tabelas

-- 1. Verificar se as tabelas existem no PostgreSQL
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%avatar%'
ORDER BY table_name;

-- 2. Verificar colunas da avatar_knowledge_base
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'avatar_knowledge_base'
ORDER BY ordinal_position;

-- 3. Verificar índices
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename LIKE '%avatar%'
ORDER BY tablename, indexname;

-- 4. Verificar políticas RLS
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename LIKE '%avatar%'
ORDER BY tablename, policyname;

-- 5. Verificar funções relacionadas
SELECT
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%knowledge%'
ORDER BY routine_name;

-- 6. Contar registros em cada tabela
SELECT 'avatar_knowledge_base' as table_name, COUNT(*) as count FROM avatar_knowledge_base
UNION ALL
SELECT 'avatar_conversation_examples', COUNT(*) FROM avatar_conversation_examples
UNION ALL
SELECT 'avatar_prompt_versions', COUNT(*) FROM avatar_prompt_versions
UNION ALL
SELECT 'user_memory', COUNT(*) FROM user_memory
UNION ALL
SELECT 'user_communication_preferences', COUNT(*) FROM user_communication_preferences
UNION ALL
SELECT 'conversation_feedback', COUNT(*) FROM conversation_feedback
UNION ALL
SELECT 'learned_patterns', COUNT(*) FROM learned_patterns
UNION ALL
SELECT 'highlighted_conversations', COUNT(*) FROM highlighted_conversations;

-- 7. Verificar se pgvector está habilitado
SELECT 
  extname,
  extversion
FROM pg_extension
WHERE extname = 'vector';
