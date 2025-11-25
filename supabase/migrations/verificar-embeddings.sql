-- Verificar onde estão os embeddings e dados

-- 1. Verificar se tabela exercises ainda existe
SELECT 'Tabela exercises existe' as status
FROM information_schema.tables 
WHERE table_name = 'exercises';

-- 2. Verificar se tabela hub_exercises existe
SELECT 'Tabela hub_exercises existe' as status
FROM information_schema.tables 
WHERE table_name = 'hub_exercises';

-- 3. Contar exercícios com embeddings na tabela exercises (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exercises') THEN
    RAISE NOTICE 'Tabela exercises encontrada';
    PERFORM COUNT(*) FROM exercises WHERE embedding IS NOT NULL;
  ELSE
    RAISE NOTICE 'Tabela exercises não existe';
  END IF;
END $$;

-- 4. Contar exercícios com embeddings na tabela hub_exercises
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE embedding IS NOT NULL) as com_embeddings,
  COUNT(*) FILTER (WHERE duration_minutes IS NOT NULL) as categorizados,
  COUNT(*) FILTER (WHERE is_active = true) as ativos
FROM hub_exercises;

-- 4b. Ver alguns exercícios com e sem embeddings
SELECT 
  id,
  title,
  memberkit_course_slug,
  duration_minutes,
  CASE WHEN embedding IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as tem_embedding,
  is_active
FROM hub_exercises
ORDER BY 
  CASE WHEN embedding IS NOT NULL THEN 0 ELSE 1 END,
  created_at DESC
LIMIT 20;

-- 5. Verificar colunas da hub_exercises
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'hub_exercises'
ORDER BY ordinal_position;
