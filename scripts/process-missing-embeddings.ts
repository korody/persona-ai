// Script para processar documentos sem embedding
import { createClient } from '@supabase/supabase-js'
import { generateEmbedding } from '../lib/rag/embeddings'
import { splitTextIntoChunks } from '../lib/rag/chunk-splitter'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function processDocuments() {
  console.log('🔄 Processando documentos sem embedding...\n')

  // Buscar avatar
  const { data: avatar } = await supabase
    .from('avatars')
    .select('id, name, slug')
    .eq('slug', 'mestre-ye')
    .single()

  if (!avatar) {
    console.log('❌ Avatar não encontrado')
    return
  }

  console.log(`✅ Avatar: ${avatar.name}\n`)

  // Buscar documentos sem embedding
  const { data: documents } = await supabase
    .from('avatar_knowledge_base')
    .select('*')
    .eq('avatar_id', avatar.id)
    .is('embedding', null)

  if (!documents || documents.length === 0) {
    console.log('✅ Todos os documentos já têm embedding!')
    return
  }

  console.log(`📄 Encontrados ${documents.length} documentos para processar\n`)

  let processed = 0
  let errors = 0

  for (const doc of documents) {
    try {
      console.log(`⏳ Processando: ${doc.title}...`)

      // 1. Gerar embedding do documento completo
      const docEmbedding = await generateEmbedding(doc.content)

      // 2. Atualizar documento com embedding
      await supabase
        .from('avatar_knowledge_base')
        .update({ embedding: docEmbedding })
        .eq('id', doc.id)

      // 3. Chunkar o documento (dividir em pedaços menores)
      const chunksData = await splitTextIntoChunks(doc.content, {
        chunkSize: 1000,
        chunkOverlap: 200
      })

      console.log(`   📝 Criando ${chunksData.length} chunks...`)

      // 4. Criar chunks com embeddings
      for (const chunkData of chunksData) {
        const chunkEmbedding = await generateEmbedding(chunkData.content)

        const { data: insertedChunk, error: insertError } = await supabase.from('knowledge_chunks').insert({
          avatar_id: avatar.id,
          knowledge_base_id: doc.id,
          content: chunkData.content,
          embedding: chunkEmbedding,
          chunk_index: chunkData.index,
          metadata: {
            knowledge_base_id: doc.id,
            title: doc.title,
            content_type: doc.content_type,
            category: doc.metadata?.category,
            elemento: doc.metadata?.elemento,
            nivel_severidade: doc.metadata?.nivel_severidade,
          }
        })

        if (insertError) {
          console.error(`      ⚠️ Erro ao inserir chunk ${chunkData.index}:`, insertError)
          throw insertError
        }
      }

      console.log(`   ✅ ${doc.title} processado com sucesso! (${chunksData.length} chunks)\n`)
      processed++

    } catch (error) {
      console.error(`   ❌ Erro ao processar ${doc.title}:`, error)
      errors++
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📊 RESUMO:`)
  console.log(`   ✅ Processados: ${processed}`)
  console.log(`   ❌ Erros: ${errors}`)
  console.log(`   📄 Total: ${documents.length}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

processDocuments()
  .then(() => {
    console.log('✅ Script finalizado!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  })
