-- Função para atualizar personalidade do avatar
-- Bypassa o cache do PostgREST porque é uma função que já existe no schema
CREATE OR REPLACE FUNCTION update_avatar_personality(
  p_avatar_id UUID,
  p_system_prompt TEXT,
  p_temperature DECIMAL(3,2),
  p_max_tokens INTEGER
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  system_prompt TEXT,
  temperature DECIMAL(3,2),
  max_tokens INTEGER,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  UPDATE avatars
  SET 
    system_prompt = p_system_prompt,
    temperature = p_temperature,
    max_tokens = p_max_tokens,
    updated_at = NOW()
  WHERE avatars.id = p_avatar_id
  RETURNING 
    avatars.id,
    avatars.name,
    avatars.system_prompt,
    avatars.temperature,
    avatars.max_tokens,
    avatars.updated_at;
END;
$$ LANGUAGE plpgsql;
