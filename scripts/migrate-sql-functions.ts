import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kfkhdfnkwhljhhjcvbqp.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function executeSQLFunction() {
  console.log('🚀 Executing SQL functions...')

  // Function 1: search_knowledge_with_anamnese
  const sql1 = `
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

GRANT EXECUTE ON FUNCTION search_knowledge_with_anamnese(UUID, VECTOR, TEXT, TEXT[], INTEGER, INTEGER) TO authenticated;
  `

  const { error: error1 } = await supabase.rpc('exec_sql', { sql: sql1 })
  
  if (error1) {
    console.error('❌ Error creating search_knowledge_with_anamnese:', error1)
  } else {
    console.log('✅ search_knowledge_with_anamnese created successfully')
  }

  // Function 2: search_knowledge_generic
  const sql2 = `
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

GRANT EXECUTE ON FUNCTION search_knowledge_generic(UUID, VECTOR, INTEGER) TO authenticated;
  `

  const { error: error2 } = await supabase.rpc('exec_sql', { sql: sql2 })
  
  if (error2) {
    console.error('❌ Error creating search_knowledge_generic:', error2)
  } else {
    console.log('✅ search_knowledge_generic created successfully')
  }

  console.log('\n🎉 Migration completed!')
}

executeSQLFunction()
