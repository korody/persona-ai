-- Refresh PostgREST schema cache
-- Execute este SQL no Supabase SQL Editor para atualizar o cache

-- 1. Recriar as funções (garante que estão corretas)

DROP FUNCTION IF EXISTS search_knowledge_generic(UUID, VECTOR(1536), INTEGER);
DROP FUNCTION IF EXISTS search_knowledge_with_anamnese(UUID, VECTOR(1536), TEXT, TEXT[], INTEGER, INTEGER);

-- Function: search_knowledge_generic
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

GRANT EXECUTE ON FUNCTION search_knowledge_generic(UUID, VECTOR, INTEGER) TO authenticated, anon;

-- Function: search_knowledge_with_anamnese
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

GRANT EXECUTE ON FUNCTION search_knowledge_with_anamnese(UUID, VECTOR, TEXT, TEXT[], INTEGER, INTEGER) TO authenticated, anon;

-- 2. Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
