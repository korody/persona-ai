-- ============================================
-- ATUALIZAR TABELA avatar_knowledge_base
-- Adicionar colunas necessárias para RAG
-- ============================================

-- Adicionar colunas se não existirem
ALTER TABLE avatar_knowledge_base 
  ADD COLUMN IF NOT EXISTS content_type VARCHAR(50) DEFAULT 'document',
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS embedding VECTOR(1536),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Criar índice para busca vetorial
CREATE INDEX IF NOT EXISTS avatar_knowledge_base_embedding_idx 
  ON avatar_knowledge_base 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_knowledge_base_active ON avatar_knowledge_base(is_active);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_content_type ON avatar_knowledge_base(content_type);

-- Atualizar registros existentes (se houver)
UPDATE avatar_knowledge_base 
SET 
  content_type = COALESCE(file_type, 'document'),
  is_active = CASE WHEN status = 'processed' THEN TRUE ELSE FALSE END
WHERE content_type IS NULL;

-- Verificar
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'avatar_knowledge_base'
ORDER BY ordinal_position;
