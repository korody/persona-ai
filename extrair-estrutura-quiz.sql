-- SCRIPT PARA COPIAR DO PROJETO QUIZ PARA PERSONA-AI
-- Execute este script NO PROJETO QUIZ (kfkhdfnkwhljhhjcvbqp) para extrair a estrutura

-- 1. Ver todas as tabelas (exceto quiz_leads e whatsapp_logs)
SELECT 
  table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name NOT IN ('quiz_leads', 'whatsapp_logs')
ORDER BY table_name;

-- 2. Gerar CREATE TABLE statements
-- Execute para cada tabela importante:

-- Para subscription_plans:
SELECT 
  'CREATE TABLE subscription_plans (' ||
  string_agg(
    column_name || ' ' || 
    data_type || 
    CASE WHEN character_maximum_length IS NOT NULL 
      THEN '(' || character_maximum_length || ')' 
      ELSE '' 
    END ||
    CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
    CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
    ', '
    ORDER BY ordinal_position
  ) || ');'
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'subscription_plans'
GROUP BY table_name;

-- 3. Ver constraints e indices
SELECT
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'subscription_plans'::regclass;

-- 4. Ver dados para copiar
SELECT * FROM subscription_plans;
SELECT * FROM credits LIMIT 5;
SELECT * FROM profiles LIMIT 5;
