-- Function: search_knowledge_generic
-- Purpose: Generic knowledge search without elemento filtering
-- Used by RAG when user has NOT completed anamnese

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
    -- Calculate cosine similarity
    1 - (kc.embedding <=> p_query_embedding) AS similarity
  FROM knowledge_chunks kc
  WHERE 
    kc.avatar_id = p_avatar_id
  ORDER BY
    similarity DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_knowledge_generic(UUID, VECTOR, INTEGER) TO authenticated;

-- Comment for documentation
COMMENT ON FUNCTION search_knowledge_generic IS 
'Generic knowledge search by cosine similarity without elemento filtering. 
Used when user has not completed anamnese or for general queries.';
