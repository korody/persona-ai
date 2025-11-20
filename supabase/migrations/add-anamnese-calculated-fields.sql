-- Adiciona campos calculados na tabela quiz_leads para suporte a RAG com anamnese

-- Adicionar colunas se não existirem
ALTER TABLE quiz_leads 
ADD COLUMN IF NOT EXISTS contagem_elementos JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS intensidade_calculada INT DEFAULT 0;

-- Comentários para documentação
COMMENT ON COLUMN quiz_leads.contagem_elementos IS 'Contagem de respostas por elemento: {MADEIRA: 2, FOGO: 3, TERRA: 1, METAL: 5, ÁGUA: 1, BAÇO: 2}';
COMMENT ON COLUMN quiz_leads.intensidade_calculada IS 'Score do elemento principal (número de respostas marcadas para aquele elemento)';

-- Criar índice para melhor performance em queries
CREATE INDEX IF NOT EXISTS idx_quiz_leads_elemento_principal ON quiz_leads(elemento_principal);
