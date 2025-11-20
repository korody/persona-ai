-- Função para buscar conhecimento relevante por similaridade vetorial

CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 3,
  p_avatar_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  avatar_id uuid,
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
    akb.avatar_id,
    akb.title,
    akb.content,
    akb.content_type,
    akb.tags,
    1 - (akb.embedding <=> query_embedding) as similarity
  FROM avatar_knowledge_base akb
  WHERE akb.is_active = true
    AND (p_avatar_id IS NULL OR akb.avatar_id = p_avatar_id)
    AND 1 - (akb.embedding <=> query_embedding) > match_threshold
  ORDER BY akb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
