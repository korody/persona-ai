-- Adicionar coluna is_active na hub_exercises (renomeada de exercises)
-- Manter consistência com padrão is_active em toda aplicação

-- 1. Remover policies que dependem da coluna enabled
DROP POLICY IF EXISTS "Anyone can view enabled exercises" ON hub_exercises;
DROP POLICY IF EXISTS "Anyone can view active exercises" ON hub_exercises;

-- 2. Adicionar coluna is_active
ALTER TABLE hub_exercises 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 3. Copiar valores de enabled para is_active (se enabled existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hub_exercises' AND column_name = 'enabled'
  ) THEN
    UPDATE hub_exercises SET is_active = enabled WHERE enabled IS NOT NULL;
    ALTER TABLE hub_exercises DROP COLUMN enabled;
  END IF;
END $$;

-- 4. Recriar policy com is_active
CREATE POLICY "Anyone can view active exercises"
  ON hub_exercises FOR SELECT
  USING (is_active = true);

-- 5. Criar índice
CREATE INDEX IF NOT EXISTS idx_hub_exercises_active 
  ON hub_exercises(is_active);

-- 6. Comentário
COMMENT ON COLUMN hub_exercises.is_active IS 'Indica se o exercício está ativo e disponível para recomendação';

-- 7. Verificar
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_active = true) as ativos,
  COUNT(*) FILTER (WHERE is_active = false) as inativos
FROM hub_exercises;
