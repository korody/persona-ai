-- PARTE 2: RLS Policies, Triggers e Funções
-- Execute esta query DEPOIS da Parte 1 ter sucesso

-- RLS POLICIES

-- avatar_knowledge_base
ALTER TABLE avatar_knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to avatar_knowledge_base"
ON avatar_knowledge_base FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users read active knowledge"
ON avatar_knowledge_base FOR SELECT TO authenticated USING (is_active = true);

-- avatar_conversation_examples
ALTER TABLE avatar_conversation_examples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to avatar_conversation_examples"
ON avatar_conversation_examples FOR ALL TO service_role USING (true) WITH CHECK (true);

-- avatar_prompt_versions
ALTER TABLE avatar_prompt_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to avatar_prompt_versions"
ON avatar_prompt_versions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- user_memory
ALTER TABLE user_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to user_memory"
ON user_memory FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can read own memory"
ON user_memory FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- user_communication_preferences
ALTER TABLE user_communication_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to user_communication_preferences"
ON user_communication_preferences FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can read own preferences"
ON user_communication_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- conversation_feedback
ALTER TABLE conversation_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to conversation_feedback"
ON conversation_feedback FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can manage own feedback"
ON conversation_feedback FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- learned_patterns
ALTER TABLE learned_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to learned_patterns"
ON learned_patterns FOR ALL TO service_role USING (true) WITH CHECK (true);

-- highlighted_conversations
ALTER TABLE highlighted_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to highlighted_conversations"
ON highlighted_conversations FOR ALL TO service_role USING (true) WITH CHECK (true);

-- TRIGGERS

-- Update updated_at on avatar_knowledge_base
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_avatar_knowledge_base_updated_at ON avatar_knowledge_base;
CREATE TRIGGER update_avatar_knowledge_base_updated_at
  BEFORE UPDATE ON avatar_knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_memory_updated_at ON user_memory;
CREATE TRIGGER update_user_memory_updated_at
  BEFORE UPDATE ON user_memory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- VECTOR SEARCH FUNCTION
CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  p_avatar_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  knowledge_avatar_id uuid,
  title text,
  content text,
  content_type text,
  tags text[],
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    akb.id,
    akb.avatar_id AS knowledge_avatar_id,
    akb.title,
    akb.content,
    akb.content_type,
    akb.tags,
    1 - (akb.embedding <=> query_embedding) AS similarity
  FROM avatar_knowledge_base akb
  WHERE 
    akb.is_active = true
    AND (p_avatar_id IS NULL OR akb.avatar_id = p_avatar_id)
    AND akb.embedding IS NOT NULL
    AND 1 - (akb.embedding <=> query_embedding) > match_threshold
  ORDER BY akb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
