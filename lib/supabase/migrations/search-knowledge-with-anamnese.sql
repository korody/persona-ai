-- Function: search_knowledge_with_anamnese
-- Purpose: Search knowledge filtered by elemento principal + secundários + intensidade
-- Used by RAG when user has completed anamnese

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
    -- Calculate cosine similarity
    1 - (kc.embedding <=> p_query_embedding) AS similarity,
    -- Check if matches primary elemento
    COALESCE(kc.metadata->>'elemento' = p_elemento_principal, FALSE) AS is_primary_elemento,
    -- Check if matches secondary elementos
    COALESCE(kc.metadata->>'elemento' = ANY(p_elementos_secundarios), FALSE) AS is_secondary_elemento
  FROM knowledge_chunks kc
  WHERE 
    kc.avatar_id = p_avatar_id
    -- Filter by intensidade if metadata has nivel_severidade
    AND (
      kc.metadata->>'nivel_severidade' IS NULL 
      OR (kc.metadata->>'nivel_severidade')::INTEGER <= p_intensidade
    )
  ORDER BY
    -- Priority 1: Primary elemento matches come first
    CASE 
      WHEN kc.metadata->>'elemento' = p_elemento_principal THEN 0
      WHEN kc.metadata->>'elemento' = ANY(p_elementos_secundarios) THEN 1
      ELSE 2
    END,
    -- Priority 2: Higher similarity
    similarity DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_knowledge_with_anamnese(UUID, VECTOR, TEXT, TEXT[], INTEGER, INTEGER) TO authenticated;

-- Comment for documentation
COMMENT ON FUNCTION search_knowledge_with_anamnese IS 
'Searches knowledge chunks filtered by user''s primary and secondary elementos from anamnese. 
Prioritizes content matching primary elemento, then secondary, then general knowledge. 
Also filters by intensidade to match severity level.';
