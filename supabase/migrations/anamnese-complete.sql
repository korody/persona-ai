-- ==================================================
-- COMPLETE ANAMNESE + RAG INTEGRATION
-- Run this in Supabase SQL Editor
-- ==================================================

-- 1. Update insert_knowledge_with_embedding to support metadata
CREATE OR REPLACE FUNCTION insert_knowledge_with_embedding(
  p_avatar_id UUID,
  p_title TEXT,
  p_content TEXT,
  p_content_type VARCHAR(50),
  p_tags TEXT[],
  p_embedding_array FLOAT[],
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO avatar_knowledge_base (
    avatar_id,
    title,
    content,
    content_type,
    tags,
    embedding,
    metadata,
    is_active,
    file_type
  ) VALUES (
    p_avatar_id,
    p_title,
    p_content,
    p_content_type,
    p_tags,
    p_embedding_array::vector(1536),
    p_metadata,
    true,
    'manual'
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Search knowledge with anamnese filtering
CREATE OR REPLACE FUNCTION search_knowledge_with_anamnese(
  p_avatar_id UUID,
  p_query_embedding VECTOR(1536),
  p_elemento_principal TEXT,
  p_elementos_secundarios TEXT[],
  p_intensidade INTEGER,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE(
  id UUID,
  avatar_id UUID,
  content TEXT,
  metadata JSONB,
  embedding VECTOR(1536),
  similarity FLOAT,
  is_primary_elemento BOOLEAN,
  is_secondary_elemento BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kc.id,
    kc.avatar_id,
    kc.content,
    kc.metadata,
    kc.embedding,
    1 - (kc.embedding <=> p_query_embedding) AS similarity,
    COALESCE(kc.metadata->>'elemento' = p_elemento_principal, FALSE) AS is_primary_elemento,
    COALESCE(kc.metadata->>'elemento' = ANY(p_elementos_secundarios), FALSE) AS is_secondary_elemento
  FROM knowledge_chunks kc
  WHERE 
    kc.avatar_id = p_avatar_id
    AND (
      kc.metadata->>'nivel_severidade' IS NULL 
      OR (kc.metadata->>'nivel_severidade')::INTEGER <= p_intensidade
    )
  ORDER BY
    CASE 
      WHEN kc.metadata->>'elemento' = p_elemento_principal THEN 0
      WHEN kc.metadata->>'elemento' = ANY(p_elementos_secundarios) THEN 1
      ELSE 2
    END,
    similarity DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 3. Generic knowledge search
CREATE OR REPLACE FUNCTION search_knowledge_generic(
  p_avatar_id UUID,
  p_query_embedding VECTOR(1536),
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE(
  id UUID,
  avatar_id UUID,
  content TEXT,
  metadata JSONB,
  embedding VECTOR(1536),
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kc.id,
    kc.avatar_id,
    kc.content,
    kc.metadata,
    kc.embedding,
    1 - (kc.embedding <=> p_query_embedding) AS similarity
  FROM knowledge_chunks kc
  WHERE 
    kc.avatar_id = p_avatar_id
  ORDER BY
    similarity DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION insert_knowledge_with_embedding(UUID, TEXT, TEXT, VARCHAR, TEXT[], FLOAT[], JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION search_knowledge_with_anamnese(UUID, VECTOR, TEXT, TEXT[], INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION search_knowledge_generic(UUID, VECTOR, INTEGER) TO authenticated;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Done!
SELECT 'Anamnese RAG functions created successfully!' AS status;
