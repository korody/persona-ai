-- SISTEMA DE APRENDIZADO MULTI-CAMADA PARA AVATARES

-- ========================================
-- HABILITAR EXTENSÕES NECESSÁRIAS
-- ========================================

-- Habilitar pgvector para embeddings (busca semântica)
CREATE EXTENSION IF NOT EXISTS vector;

-- ========================================
-- CAMADA 1: CONHECIMENTO BASE (ADMIN)
-- ========================================

-- 1.1 Documentos/Artigos para RAG
CREATE TABLE IF NOT EXISTS avatar_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avatar_id UUID NOT NULL REFERENCES avatars(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL,
  tags TEXT[],
  embedding vector(1536),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para busca vetorial (pgvector)
CREATE INDEX IF NOT EXISTS avatar_knowledge_embedding_idx ON avatar_knowledge_base 
USING ivfflat (embedding vector_cosine_ops);

-- 1.2 Exemplos de Conversas Ideais (Few-shot learning)
CREATE TABLE IF NOT EXISTS avatar_conversation_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avatar_id UUID NOT NULL REFERENCES avatars(id) ON DELETE CASCADE,
  user_message TEXT NOT NULL,
  avatar_response TEXT NOT NULL,
  category TEXT,
  quality_score INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.3 Versões do Prompt (histórico de mudanças)
CREATE TABLE IF NOT EXISTS avatar_prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avatar_id UUID NOT NULL REFERENCES avatars(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  system_prompt TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  performance_notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- CAMADA 2: PERFIL INDIVIDUAL DO USUÁRIO
-- ========================================

-- 2.1 Memória Pessoal do Usuário
CREATE TABLE IF NOT EXISTS user_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_id UUID NOT NULL REFERENCES avatars(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  confidence_score FLOAT DEFAULT 1.0,
  source_conversation_id UUID REFERENCES conversations(id),
  last_confirmed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, avatar_id, memory_type, key)
);

-- 2.2 Preferências de Comunicação
CREATE TABLE IF NOT EXISTS user_communication_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_id UUID NOT NULL REFERENCES avatars(id) ON DELETE CASCADE,
  response_style TEXT,
  preferred_length TEXT,
  tone_preference TEXT,
  emoji_preference BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, avatar_id)
);

-- ========================================
-- CAMADA 3: APRENDIZADO COLETIVO
-- ========================================

-- 3.1 Feedback de Conversas
CREATE TABLE IF NOT EXISTS conversation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback_type TEXT,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3.2 Padrões que Funcionam (Aprendizado Coletivo)
CREATE TABLE IF NOT EXISTS learned_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avatar_id UUID NOT NULL REFERENCES avatars(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL,
  context_summary TEXT NOT NULL,
  action_taken TEXT NOT NULL,
  success_rate FLOAT DEFAULT 0.0,
  usage_count INTEGER DEFAULT 0,
  positive_feedback_count INTEGER DEFAULT 0,
  negative_feedback_count INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3.3 Conversas Destacadas (para revisão e aprendizado)
CREATE TABLE IF NOT EXISTS highlighted_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  highlight_reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  reviewer_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- ÍNDICES E FUNÇÕES
-- ========================================

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_memory_user_avatar ON user_memory(user_id, avatar_id);
CREATE INDEX IF NOT EXISTS idx_conversation_feedback_rating ON conversation_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_learned_patterns_success ON learned_patterns(success_rate DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_tags ON avatar_knowledge_base USING gin(tags);

-- Função para atualizar padrões aprendidos baseado em feedback
CREATE OR REPLACE FUNCTION update_learned_pattern_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar estatísticas do padrão quando receber feedback
  UPDATE learned_patterns lp
  SET 
    positive_feedback_count = (
      SELECT COUNT(*) FROM conversation_feedback cf
      JOIN messages m ON cf.message_id = m.id
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.avatar_id = lp.avatar_id
      AND cf.rating >= 4
    ),
    negative_feedback_count = (
      SELECT COUNT(*) FROM conversation_feedback cf
      JOIN messages m ON cf.message_id = m.id
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.avatar_id = lp.avatar_id
      AND cf.rating <= 2
    ),
    success_rate = CASE 
      WHEN (positive_feedback_count + negative_feedback_count) > 0 
      THEN positive_feedback_count::FLOAT / (positive_feedback_count + negative_feedback_count)
      ELSE 0.0
    END,
    updated_at = now()
  WHERE lp.avatar_id = (
    SELECT c.avatar_id FROM conversations c
    JOIN messages m ON m.conversation_id = c.id
    WHERE m.id = NEW.message_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar padrões
DROP TRIGGER IF EXISTS update_pattern_stats_on_feedback ON conversation_feedback;

CREATE TRIGGER update_pattern_stats_on_feedback
AFTER INSERT ON conversation_feedback
FOR EACH ROW
EXECUTE FUNCTION update_learned_pattern_stats();

-- Função para extrair memórias de conversas
CREATE OR REPLACE FUNCTION extract_user_memory(
  p_user_id UUID,
  p_avatar_id UUID,
  p_memory_type TEXT,
  p_key TEXT,
  p_value TEXT,
  p_conversation_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_memory_id UUID;
BEGIN
  INSERT INTO user_memory (user_id, avatar_id, memory_type, key, value, source_conversation_id)
  VALUES (p_user_id, p_avatar_id, p_memory_type, p_key, p_value, p_conversation_id)
  ON CONFLICT (user_id, avatar_id, memory_type, key) 
  DO UPDATE SET 
    value = EXCLUDED.value,
    last_confirmed_at = now(),
    updated_at = now()
  RETURNING id INTO v_memory_id;
  
  RETURN v_memory_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- POLÍTICAS RLS (Row Level Security)
-- ========================================

-- Admin pode tudo na knowledge base
ALTER TABLE avatar_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_conversation_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_prompt_versions ENABLE ROW LEVEL SECURITY;

-- Usuários só veem suas próprias memórias
ALTER TABLE user_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_communication_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own memory"
  ON user_memory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memory"
  ON user_memory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memory"
  ON user_memory FOR UPDATE
  USING (auth.uid() = user_id);

-- Feedback só do próprio usuário
ALTER TABLE conversation_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feedback"
  ON conversation_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback"
  ON conversation_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);
