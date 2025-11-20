-- Migration: Create Avatar Learning System Tables
-- Created: 2025-11-15
-- Description: Tables for knowledge base, user memory, and collective learning

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. AVATAR KNOWLEDGE BASE
CREATE TABLE IF NOT EXISTS public.avatar_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avatar_id UUID NOT NULL REFERENCES public.avatars(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'article',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  embedding vector(1536),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_avatar_knowledge_avatar ON avatar_knowledge_base(avatar_id);
CREATE INDEX IF NOT EXISTS idx_avatar_knowledge_active ON avatar_knowledge_base(is_active);
CREATE INDEX IF NOT EXISTS idx_avatar_knowledge_embedding ON avatar_knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 2. AVATAR CONVERSATION EXAMPLES
CREATE TABLE IF NOT EXISTS public.avatar_conversation_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avatar_id UUID NOT NULL REFERENCES public.avatars(id) ON DELETE CASCADE,
  user_message TEXT NOT NULL,
  avatar_response TEXT NOT NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_examples_avatar ON avatar_conversation_examples(avatar_id);

-- 3. AVATAR PROMPT VERSIONS
CREATE TABLE IF NOT EXISTS public.avatar_prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avatar_id UUID NOT NULL REFERENCES public.avatars(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  system_prompt TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(avatar_id, version)
);

CREATE INDEX IF NOT EXISTS idx_prompt_versions_avatar ON avatar_prompt_versions(avatar_id);

-- 4. USER MEMORY
CREATE TABLE IF NOT EXISTS public.user_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_id UUID NOT NULL REFERENCES public.avatars(id) ON DELETE CASCADE,
  memory_key TEXT NOT NULL,
  memory_value JSONB NOT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 1.0,
  source_conversation_id UUID REFERENCES public.conversations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, avatar_id, memory_key)
);

CREATE INDEX IF NOT EXISTS idx_user_memory_user ON user_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memory_avatar ON user_memory(avatar_id);

-- 5. USER COMMUNICATION PREFERENCES  
CREATE TABLE IF NOT EXISTS public.user_communication_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_id UUID NOT NULL REFERENCES public.avatars(id) ON DELETE CASCADE,
  preference_type TEXT NOT NULL,
  preference_value TEXT NOT NULL,
  learned_from_conversation_id UUID REFERENCES public.conversations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, avatar_id, preference_type)
);

CREATE INDEX IF NOT EXISTS idx_user_comm_prefs_user ON user_communication_preferences(user_id);

-- 6. CONVERSATION FEEDBACK
CREATE TABLE IF NOT EXISTS public.conversation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('like', 'dislike', 'report')),
  feedback_comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_feedback_conv ON conversation_feedback(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_feedback_msg ON conversation_feedback(message_id);

-- 7. LEARNED PATTERNS
CREATE TABLE IF NOT EXISTS public.learned_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avatar_id UUID NOT NULL REFERENCES public.avatars(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL,
  pattern_data JSONB NOT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 1.0,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_learned_patterns_avatar ON learned_patterns(avatar_id);

-- 8. HIGHLIGHTED CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.highlighted_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  avatar_id UUID NOT NULL REFERENCES public.avatars(id) ON DELETE CASCADE,
  highlight_reason TEXT NOT NULL,
  reviewed BOOLEAN NOT NULL DEFAULT false,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_highlighted_conv_avatar ON highlighted_conversations(avatar_id);
CREATE INDEX IF NOT EXISTS idx_highlighted_conv_reviewed ON highlighted_conversations(reviewed);

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
