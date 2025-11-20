-- Verificar políticas RLS na tabela avatar_knowledge_base
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'avatar_knowledge_base';

-- Verificar se RLS está habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'avatar_knowledge_base';
