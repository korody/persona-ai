-- Função helper para inserir conhecimento com embedding
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
