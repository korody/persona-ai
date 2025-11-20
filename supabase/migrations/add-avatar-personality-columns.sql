-- Adicionar colunas de personalidade na tabela avatars
-- temperature: Controla criatividade do modelo (0-2)
-- max_tokens: Tamanho máximo da resposta

ALTER TABLE avatars 
ADD COLUMN IF NOT EXISTS temperature DECIMAL(3,2) DEFAULT 0.7,
ADD COLUMN IF NOT EXISTS max_tokens INTEGER DEFAULT 500;

-- Atualizar avatares existentes com valores padrão
UPDATE avatars 
SET 
  temperature = 0.7,
  max_tokens = 500
WHERE temperature IS NULL OR max_tokens IS NULL;

-- Comentários nas colunas
COMMENT ON COLUMN avatars.temperature IS 'Controla criatividade: 0 = mais previsível, 2 = mais criativo';
COMMENT ON COLUMN avatars.max_tokens IS 'Tamanho máximo da resposta em tokens (~0.75 palavras por token)';
