-- Renomear exercises para hub_exercises

-- 1. Renomear a tabela
ALTER TABLE exercises RENAME TO hub_exercises;

-- 2. Atualizar índices (Postgres renomeia automaticamente)

-- 3. Verificar estrutura
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'hub_exercises'
ORDER BY ordinal_position;

-- 4. Verificar dados migrados
SELECT COUNT(*) as total_exercicios FROM hub_exercises;
