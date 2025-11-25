-- Renomear tabela credits para user_credits (mais descritivo)

-- 1. Renomear a tabela
ALTER TABLE credits RENAME TO user_credits;

-- 2. Verificar estrutura
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_credits'
ORDER BY ordinal_position;

-- 3. Verificar dados
SELECT COUNT(*) as total_usuarios_com_creditos FROM user_credits;
