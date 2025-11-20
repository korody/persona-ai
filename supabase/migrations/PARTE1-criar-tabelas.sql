-- PARTE 1: Criar apenas as tabelas e índices
-- Execute esta query PRIMEIRO

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
