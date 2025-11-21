-- Remover constraints que estão impedindo a sincronização
ALTER TABLE exercises DROP CONSTRAINT IF EXISTS exercises_element_check;
ALTER TABLE exercises DROP CONSTRAINT IF EXISTS exercises_level_check;

-- Recriar constraints permitindo valores em português corretos
ALTER TABLE exercises ADD CONSTRAINT exercises_element_check 
  CHECK (element IS NULL OR element IN ('METAL', 'ÁGUA', 'MADEIRA', 'FOGO', 'TERRA'));

ALTER TABLE exercises ADD CONSTRAINT exercises_level_check 
  CHECK (level IS NULL OR level IN ('INICIANTE', 'INTERMEDIÁRIO', 'AVANÇADO'));
