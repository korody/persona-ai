/**
 * Corrigir metadata do ELEMENTO METAL
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function fixMetalMetadata() {
  console.log('🔧 Corrigindo metadata do ELEMENTO METAL...\n')

  // Buscar documento METAL
  const { data: doc } = await supabase
    .from('avatar_knowledge_base')
    .select('id')
    .eq('title', 'ELEMENTO METAL')
    .single()

  if (!doc) {
    console.log('❌ Documento METAL não encontrado')
    return
  }

  // Buscar chunks do METAL
  const { data: chunks } = await supabase
    .from('knowledge_chunks')
    .select('id, metadata')
    .eq('knowledge_base_id', doc.id)

  console.log(`📄 Encontrados ${chunks?.length || 0} chunks do METAL`)

  if (!chunks) return

  // Atualizar cada chunk
  let updated = 0
  for (const chunk of chunks) {
    const { error } = await supabase
      .from('knowledge_chunks')
      .update({
        metadata: {
          ...chunk.metadata,
          elemento: 'METAL',
          orgaos: ['Pulmão', 'Intestino Grosso'],
          emocao_principal: 'Tristeza',
          tipo_conteudo: 'diagnostico_completo'
        }
      })
      .eq('id', chunk.id)

    if (!error) updated++
  }

  console.log(`\n✅ ${updated} chunks atualizados com sucesso!`)
}

fixMetalMetadata().catch(console.error)
