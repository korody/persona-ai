-- ============================================
-- SCHEMA COMPLETO DO SISTEMA DE TREINAMENTO DE AVATARES
-- Projeto: quiz-mtc-mestreye (kfkhdfnkwhljhhjcvbqp)
-- Baseado no direcionamento do Claude + nosso RAG existente
-- ============================================

-- ============================================
-- 1. HABILITAR EXTENSÃO PGVECTOR
-- ============================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- 2. TABELA DE BASE DE CONHECIMENTO (NOSSA VERSÃO ATUAL)
-- ============================================
-- Esta tabela já existe e funciona - vamos apenas garantir que tenha todos os campos

CREATE TABLE IF NOT EXISTS avatar_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avatar_id UUID REFERENCES avatars(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type VARCHAR(50), -- 'text', 'qa', 'guidelines', 'document'
  embedding VECTOR(1536), -- OpenAI text-embedding-3-small
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  file_url TEXT, -- Para uploads futuros
  file_type VARCHAR(50), -- 'pdf', 'docx', 'txt', 'manual'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_knowledge_avatar ON avatar_knowledge_base(avatar_id);
CREATE INDEX idx_knowledge_status ON avatar_knowledge_base(status);
CREATE INDEX idx_knowledge_tags ON avatar_knowledge_base USING GIN(tags);

-- ============================================
-- 3. TABELA DE CHUNKS COM EMBEDDINGS (RAG)
-- ============================================

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
CREATE INDEX ON knowledge_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX idx_chunks_knowledge ON knowledge_chunks(knowledge_base_id);
CREATE INDEX idx_chunks_avatar ON knowledge_chunks(avatar_id);

-- ============================================
-- 4. TABELA DE EXEMPLOS DE CONVERSAS (FEW-SHOT)
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

CREATE INDEX idx_examples_avatar ON avatar_conversation_examples(avatar_id);
CREATE INDEX idx_examples_active ON avatar_conversation_examples(is_active);
CREATE INDEX idx_examples_category ON avatar_conversation_examples(category);

-- ============================================
-- 5. TABELA DE VERSÕES DO PROMPT
-- ============================================

CREATE TABLE IF NOT EXISTS avatar_prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avatar_id UUID REFERENCES avatars(id) ON DELETE CASCADE,
  version VARCHAR(20) NOT NULL,
  system_prompt TEXT NOT NULL,
  personality_config JSONB DEFAULT '{}', -- sliders: formality, empathy, emoji_usage, etc
  model_config JSONB DEFAULT '{}', -- temperature, max_tokens, etc
  is_active BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_prompt_versions_avatar ON avatar_prompt_versions(avatar_id);
CREATE INDEX idx_prompt_versions_active ON avatar_prompt_versions(is_active);

-- ============================================
-- 6. TABELA DE MEMÓRIA DE USUÁRIO
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

CREATE INDEX idx_user_memory_user ON user_memory(user_id);
CREATE INDEX idx_user_memory_avatar ON user_memory(avatar_id);

-- ============================================
-- 7. TABELA DE PREFERÊNCIAS DE COMUNICAÇÃO
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

CREATE INDEX idx_comm_prefs_user ON user_communication_preferences(user_id);

-- ============================================
-- 8. TABELA DE FEEDBACK DE CONVERSAS
-- ============================================

CREATE TABLE IF NOT EXISTS conversation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INT CHECK (rating >= 1 AND rating <= 5), -- 1-5 stars or thumbs up/down
  feedback_type VARCHAR(20), -- 'thumbs_up', 'thumbs_down', 'report'
  feedback_text TEXT,
  tags TEXT[] DEFAULT '{}', -- 'helpful', 'inaccurate', 'too_long', etc
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feedback_conversation ON conversation_feedback(conversation_id);
CREATE INDEX idx_feedback_message ON conversation_feedback(message_id);
CREATE INDEX idx_feedback_rating ON conversation_feedback(rating);

-- ============================================
-- 9. TABELA DE PADRÕES APRENDIDOS (COLLECTIVE LEARNING)
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

CREATE INDEX idx_patterns_avatar ON learned_patterns(avatar_id);
CREATE INDEX idx_patterns_status ON learned_patterns(status);
CREATE INDEX idx_patterns_type ON learned_patterns(pattern_type);

-- ============================================
-- 10. TABELA DE CONVERSAS DESTACADAS
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

CREATE INDEX idx_highlighted_conversation ON highlighted_conversations(conversation_id);
CREATE INDEX idx_highlighted_avatar ON highlighted_conversations(avatar_id);

-- ============================================
-- 11. FUNÇÃO PARA BUSCA SEMÂNTICA (RAG)
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
  knowledge_base_title TEXT,
  knowledge_base_id UUID,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kc.id,
    kc.content,
    1 - (kc.embedding <=> p_query_embedding) AS similarity,
    kb.title AS knowledge_base_title,
    kb.id AS knowledge_base_id,
    kc.metadata
  FROM knowledge_chunks kc
  JOIN avatar_knowledge_base kb ON kb.id = kc.knowledge_base_id
  WHERE kc.avatar_id = p_avatar_id
    AND kb.status = 'active'
    AND 1 - (kc.embedding <=> p_query_embedding) > p_similarity_threshold
  ORDER BY kc.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 12. FUNÇÃO PARA ATUALIZAR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE ON avatar_knowledge_base
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_examples_updated_at BEFORE UPDATE ON avatar_conversation_examples
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_memory_updated_at BEFORE UPDATE ON user_memory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comm_prefs_updated_at BEFORE UPDATE ON user_communication_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patterns_updated_at BEFORE UPDATE ON learned_patterns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 13. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE avatar_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_conversation_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_communication_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE learned_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlighted_conversations ENABLE ROW LEVEL SECURITY;

-- Políticas - permitir leitura para todos, escrita apenas para service role
CREATE POLICY "Anyone can read active knowledge" ON avatar_knowledge_base
  FOR SELECT USING (status = 'active');

CREATE POLICY "Service role can manage knowledge" ON avatar_knowledge_base
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Anyone can read chunks" ON knowledge_chunks
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage chunks" ON knowledge_chunks
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Anyone can read active examples" ON avatar_conversation_examples
  FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage examples" ON avatar_conversation_examples
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Anyone can read active prompts" ON avatar_prompt_versions
  FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage prompts" ON avatar_prompt_versions
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Users can view their own memory" ON user_memory
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage user memory" ON user_memory
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Users can view their own preferences" ON user_communication_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_communication_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage preferences" ON user_communication_preferences
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Users can create feedback" ON conversation_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback" ON conversation_feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage feedback" ON conversation_feedback
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can manage patterns" ON learned_patterns
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can manage highlighted" ON highlighted_conversations
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- 14. NOTIFICAR POSTGREST
-- ============================================

NOTIFY pgrst, 'reload schema';

-- ============================================
-- 15. VERIFICAÇÃO
-- ============================================

SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_schema = 'public' AND columns.table_name = tables.table_name) as column_count
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_name LIKE '%avatar%'
  OR table_name LIKE '%knowledge%'
  OR table_name LIKE '%user_memory%'
  OR table_name LIKE '%feedback%'
ORDER BY table_name;
