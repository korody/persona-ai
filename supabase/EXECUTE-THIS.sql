-- ============================================
-- MIGRATIONS CONSOLIDADAS PARA SUPABASE
-- Projeto: quiz-mtc-mestreye (kfkhdfnkwhljhhjcvbqp)
-- Gerado em: 2025-11-16T20:55:39.101Z
-- ============================================
-- 
-- INSTRUÇÕES:
-- 1. Acesse: https://supabase.com/dashboard/project/kfkhdfnkwhljhhjcvbqp/sql
-- 2. Copie TODO este arquivo
-- 3. Cole no SQL Editor
-- 4. Clique em RUN
-- 5. Aguarde a execução completa
--
-- ============================================


-- ============================================
-- Migration: add-training-tables-quiz.sql
-- ============================================

-- ============================================
-- COMPLETAR SCHEMA NO PROJETO QUIZ-MTC-MESTREYE
-- Adiciona apenas as tabelas que faltam
-- ============================================

-- ============================================
-- 1. GARANTIR QUE PGVECTOR ESTÁ HABILITADO
-- ============================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- 2. TABELA DE EXEMPLOS DE CONVERSAS (FEW-SHOT)
-- ============================================

CREATE TABLE IF NOT EXISTS avatar_conversation_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avatar_id UUID REFERENCES avatars(id) ON DELETE CASCADE,
  user_message TEXT NOT NULL,
  assistant_response TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_examples_avatar ON avatar_conversation_examples(avatar_id);
CREATE INDEX IF NOT EXISTS idx_examples_active ON avatar_conversation_examples(is_active);
CREATE INDEX IF NOT EXISTS idx_examples_category ON avatar_conversation_examples(category);

-- ============================================
-- 3. TABELA DE CHUNKS (PARA DOCUMENTOS GRANDES)
-- ============================================
-- Para quando implementarmos upload de PDF/DOCX

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_base_id UUID REFERENCES avatar_knowledge_base(id) ON DELETE CASCADE,
  avatar_id UUID REFERENCES avatars(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI text-embedding-3-small
  chunk_index INT NOT NULL,
  token_count INT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca vetorial (cosine similarity)
CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx ON knowledge_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_chunks_knowledge ON knowledge_chunks(knowledge_base_id);
CREATE INDEX IF NOT EXISTS idx_chunks_avatar ON knowledge_chunks(avatar_id);

-- ============================================
-- 4. TABELA DE MEMÓRIA DE USUÁRIO
-- ============================================

CREATE TABLE IF NOT EXISTS user_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_id UUID REFERENCES avatars(id) ON DELETE CASCADE,
  key VARCHAR(100) NOT NULL, -- 'name', 'health_condition', 'preferences', etc
  value TEXT NOT NULL,
  confidence FLOAT DEFAULT 1.0, -- 0.0 - 1.0
  source VARCHAR(50) DEFAULT 'conversation', -- 'quiz', 'conversation', 'manual'
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, avatar_id, key)
);

CREATE INDEX IF NOT EXISTS idx_user_memory_user ON user_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memory_avatar ON user_memory(avatar_id);

-- ============================================
-- 5. TABELA DE PREFERÊNCIAS DE COMUNICAÇÃO
-- ============================================

CREATE TABLE IF NOT EXISTS user_communication_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_id UUID REFERENCES avatars(id) ON DELETE CASCADE,
  preferred_response_length VARCHAR(20) DEFAULT 'medium', -- 'short', 'medium', 'long'
  preferred_formality INT DEFAULT 50, -- 0-100
  prefers_emojis BOOLEAN DEFAULT TRUE,
  prefers_examples BOOLEAN DEFAULT TRUE,
  prefers_questions BOOLEAN DEFAULT TRUE,
  language VARCHAR(10) DEFAULT 'pt-BR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, avatar_id)
);

CREATE INDEX IF NOT EXISTS idx_comm_prefs_user ON user_communication_preferences(user_id);

-- ============================================
-- 6. TABELA DE FEEDBACK DE CONVERSAS
-- ============================================

CREATE TABLE IF NOT EXISTS conversation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INT CHECK (rating >= 1 AND rating <= 5), -- 1-5 stars or thumbs up/down (1 ou 5)
  feedback_type VARCHAR(20), -- 'thumbs_up', 'thumbs_down', 'report'
  feedback_text TEXT,
  tags TEXT[] DEFAULT '{}', -- 'helpful', 'inaccurate', 'too_long', etc
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_conversation ON conversation_feedback(conversation_id);
CREATE INDEX IF NOT EXISTS idx_feedback_message ON conversation_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON conversation_feedback(rating);

-- ============================================
-- 7. TABELA DE PADRÕES APRENDIDOS
-- ============================================

CREATE TABLE IF NOT EXISTS learned_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avatar_id UUID REFERENCES avatars(id) ON DELETE CASCADE,
  pattern_type VARCHAR(50), -- 'common_question', 'good_response', 'user_confusion'
  pattern_content JSONB NOT NULL,
  frequency INT DEFAULT 1,
  avg_rating FLOAT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'active'
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patterns_avatar ON learned_patterns(avatar_id);
CREATE INDEX IF NOT EXISTS idx_patterns_status ON learned_patterns(status);
CREATE INDEX IF NOT EXISTS idx_patterns_type ON learned_patterns(pattern_type);

-- ============================================
-- 8. TABELA DE CONVERSAS DESTACADAS
-- ============================================

CREATE TABLE IF NOT EXISTS highlighted_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  avatar_id UUID REFERENCES avatars(id) ON DELETE CASCADE,
  reason VARCHAR(100), -- 'high_rating', 'interesting_topic', 'good_example'
  notes TEXT,
  highlighted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_highlighted_conversation ON highlighted_conversations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_highlighted_avatar ON highlighted_conversations(avatar_id);

-- ============================================
-- 9. FUNÇÃO PARA BUSCA SEMÂNTICA (RAG)
-- ============================================

CREATE OR REPLACE FUNCTION search_knowledge(
  p_avatar_id UUID,
  p_query_embedding VECTOR(1536),
  p_limit INT DEFAULT 5,
  p_similarity_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity FLOAT,
  title TEXT,
  content_type VARCHAR,
  tags TEXT[],
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kb.id,
    kb.content,
    1 - (kb.embedding <=> p_query_embedding) AS similarity,
    kb.title,
    kb.content_type,
    kb.tags,
    kb.metadata
  FROM avatar_knowledge_base kb
  WHERE kb.avatar_id = p_avatar_id
    AND kb.is_active = TRUE
    AND kb.embedding IS NOT NULL
    AND 1 - (kb.embedding <=> p_query_embedding) > p_similarity_threshold
  ORDER BY kb.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. TRIGGERS PARA updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
DROP TRIGGER IF EXISTS update_knowledge_base_updated_at ON avatar_knowledge_base;
CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE ON avatar_knowledge_base
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_examples_updated_at ON avatar_conversation_examples;
CREATE TRIGGER update_examples_updated_at BEFORE UPDATE ON avatar_conversation_examples
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_memory_updated_at ON user_memory;
CREATE TRIGGER update_user_memory_updated_at BEFORE UPDATE ON user_memory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comm_prefs_updated_at ON user_communication_preferences;
CREATE TRIGGER update_comm_prefs_updated_at BEFORE UPDATE ON user_communication_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_patterns_updated_at ON learned_patterns;
CREATE TRIGGER update_patterns_updated_at BEFORE UPDATE ON learned_patterns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 11. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE avatar_conversation_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_communication_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE learned_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlighted_conversations ENABLE ROW LEVEL SECURITY;

-- Políticas (permissivas para começar)
-- Usar DROP + CREATE para evitar erro de IF NOT EXISTS

DROP POLICY IF EXISTS "Public read active examples" ON avatar_conversation_examples;
CREATE POLICY "Public read active examples" ON avatar_conversation_examples
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Service role all examples" ON avatar_conversation_examples;
CREATE POLICY "Service role all examples" ON avatar_conversation_examples
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Public read chunks" ON knowledge_chunks;
CREATE POLICY "Public read chunks" ON knowledge_chunks
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role all chunks" ON knowledge_chunks;
CREATE POLICY "Service role all chunks" ON knowledge_chunks
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Users view own memory" ON user_memory;
CREATE POLICY "Users view own memory" ON user_memory
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role all memory" ON user_memory;
CREATE POLICY "Service role all memory" ON user_memory
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Users view own prefs" ON user_communication_preferences;
CREATE POLICY "Users view own prefs" ON user_communication_preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own prefs" ON user_communication_preferences;
CREATE POLICY "Users update own prefs" ON user_communication_preferences
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role all prefs" ON user_communication_preferences;
CREATE POLICY "Service role all prefs" ON user_communication_preferences
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Users create feedback" ON conversation_feedback;
CREATE POLICY "Users create feedback" ON conversation_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own feedback" ON conversation_feedback;
CREATE POLICY "Users view own feedback" ON conversation_feedback
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role all feedback" ON conversation_feedback;
CREATE POLICY "Service role all feedback" ON conversation_feedback
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role all patterns" ON learned_patterns;
CREATE POLICY "Service role all patterns" ON learned_patterns
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role all highlighted" ON highlighted_conversations;
CREATE POLICY "Service role all highlighted" ON highlighted_conversations
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- 12. NOTIFICAR POSTGREST
-- ============================================

NOTIFY pgrst, 'reload schema';

-- ============================================
-- 13. VERIFICAÇÃO FINAL
-- ============================================

SELECT 
  'Tabelas criadas:' as status,
  COUNT(*) as total
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%avatar%'
    OR table_name LIKE '%knowledge%'
    OR table_name LIKE '%user_memory%'
    OR table_name LIKE '%feedback%'
    OR table_name LIKE '%pattern%'
    OR table_name LIKE '%highlighted%'
  );



-- ============================================
-- Migration: create-storage-bucket.sql
-- ============================================

/**
 * Criar bucket 'knowledge-base' no Supabase Storage
 * Execute este SQL no Supabase SQL Editor
 */

-- 1. Criar bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('knowledge-base', 'knowledge-base', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Política para permitir uploads (service role apenas)
DROP POLICY IF EXISTS "Service role can upload knowledge files" ON storage.objects;
CREATE POLICY "Service role can upload knowledge files"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'knowledge-base');

-- 3. Política para leitura pública
DROP POLICY IF EXISTS "Public can read knowledge files" ON storage.objects;
CREATE POLICY "Public can read knowledge files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'knowledge-base');

-- 4. Política para deletar (service role apenas)
DROP POLICY IF EXISTS "Service role can delete knowledge files" ON storage.objects;
CREATE POLICY "Service role can delete knowledge files"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'knowledge-base');

-- 5. Verificar
SELECT * FROM storage.buckets WHERE id = 'knowledge-base';



-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- Listar todas as tabelas criadas
SELECT 
  table_name,
  (SELECT COUNT(*) 
   FROM information_schema.columns 
   WHERE columns.table_schema = 'public' 
     AND columns.table_name = tables.table_name) as column_count
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%avatar%'
    OR table_name LIKE '%knowledge%'
    OR table_name LIKE '%user_%'
    OR table_name LIKE '%conversation%'
    OR table_name LIKE '%feedback%'
    OR table_name LIKE '%pattern%'
  )
ORDER BY table_name;

-- Listar funções criadas
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%knowledge%'
ORDER BY routine_name;

-- Listar buckets de storage
SELECT * FROM storage.buckets WHERE id = 'knowledge-base';
