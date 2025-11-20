/**
 * Atualiza metadados dos chunks para adicionar elemento baseado no título
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function updateChunkMetadata() {
  console.log('🔧 Atualizando metadados dos chunks...\n')

  const { data: chunks, error } = await supabase
    .from('knowledge_chunks')
    .select('id, content, metadata')

  if (error || !chunks) {
    console.error('❌ Erro ao buscar chunks:', error)
    return
  }

  console.log(`📊 Total de chunks: ${chunks.length}\n`)

  let updated = 0
  let skipped = 0

  for (const chunk of chunks) {
    const title = chunk.metadata?.title || ''
    const content = chunk.content || ''
    
    // Extrair elemento do título ou conteúdo
    let elemento: string | null = null

    if (title.includes('TERRA') || content.includes('METADATA_DOCUMENTO:\nelemento: TERRA')) {
      elemento = 'TERRA'
    } else if (title.includes('METAL') || content.includes('METADATA_DOCUMENTO:\nelemento: METAL')) {
      elemento = 'METAL'
    } else if (title.includes('MADEIRA') || content.includes('METADATA_DOCUMENTO:\nelemento: MADEIRA')) {
      elemento = 'MADEIRA'
    } else if (title.includes('FOGO') || content.includes('METADATA_DOCUMENTO:\nelemento: FOGO')) {
      elemento = 'FOGO'
    } else if (title.includes('AGUA') || title.includes('ÁGUA') || content.includes('METADATA_DOCUMENTO:\nelemento: ÁGUA')) {
      elemento = 'ÁGUA'
    }

    // Se já tem elemento nos metadados e está correto, pular
    if (chunk.metadata?.elemento && chunk.metadata.elemento !== 'N/A') {
      skipped++
      continue
    }

    // Se encontrou elemento, atualizar
    if (elemento) {
      const newMetadata = {
        ...chunk.metadata,
        elemento
      }

      const { error: updateError } = await supabase
        .from('knowledge_chunks')
        .update({ metadata: newMetadata })
        .eq('id', chunk.id)

      if (updateError) {
        console.error(`   ❌ Erro ao atualizar chunk ${chunk.id}:`, updateError.message)
      } else {
        console.log(`   ✅ ${title} → ${elemento}`)
        updated++
      }
    } else {
      skipped++
    }
  }

  console.log(`\n📊 Resultado:`)
  console.log(`   ✅ Atualizados: ${updated}`)
  console.log(`   ⏭️  Pulados: ${skipped}`)

  // Verificar distribuição após atualização
  const { data: updatedChunks } = await supabase
    .from('knowledge_chunks')
    .select('metadata')

  if (updatedChunks) {
    const porElemento: Record<string, number> = {}
    updatedChunks.forEach((c: any) => {
      const elem = c.metadata?.elemento || 'N/A'
      porElemento[elem] = (porElemento[elem] || 0) + 1
    })

    console.log('\n📊 Distribuição após atualização:\n')
    Object.entries(porElemento)
      .sort(([, a], [, b]) => b - a)
      .forEach(([elem, count]) => {
        console.log(`   ${elem}: ${count}`)
      })
  }
}

updateChunkMetadata().catch(console.error)
