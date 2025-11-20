// Script de debug para verificar documentos
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDocuments() {
  console.log('🔍 Verificando documentos...\n')

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

  console.log(`✅ Avatar encontrado: ${avatar.name} (${avatar.id})\n`)

  // Verificar avatar_knowledge_base
  const { data: knowledgeBase, error: kbError } = await supabase
    .from('avatar_knowledge_base')
    .select('id, title, content_type, embedding')
    .eq('avatar_id', avatar.id)

  console.log(`📚 Avatar Knowledge Base:`)
  console.log(`   Total: ${knowledgeBase?.length || 0} documentos`)
  
  if (knowledgeBase && knowledgeBase.length > 0) {
    const withEmbedding = knowledgeBase.filter(d => d.embedding).length
    console.log(`   Com embedding: ${withEmbedding}`)
    console.log(`   Sem embedding: ${knowledgeBase.length - withEmbedding}`)
    console.log(`\n   Documentos:`)
    knowledgeBase.forEach((doc, i) => {
      console.log(`   ${i + 1}. ${doc.title} (${doc.content_type}) - Embedding: ${doc.embedding ? '✅' : '❌'}`)
    })
  }

  // Verificar knowledge_chunks
  const { data: chunks, error: chunksError } = await supabase
    .from('knowledge_chunks')
    .select('id, content, embedding, metadata')
    .eq('avatar_id', avatar.id)

  console.log(`\n📄 Knowledge Chunks:`)
  console.log(`   Total: ${chunks?.length || 0} chunks`)
  
  if (chunks && chunks.length > 0) {
    const withEmbedding = chunks.filter(c => c.embedding).length
    console.log(`   Com embedding: ${withEmbedding}`)
    console.log(`   Sem embedding: ${chunks.length - withEmbedding}`)
    
    // Agrupar por knowledge_base_id
    const grouped = chunks.reduce((acc: any, chunk: any) => {
      const kbId = chunk.metadata?.knowledge_base_id || 'unknown'
      if (!acc[kbId]) acc[kbId] = []
      acc[kbId].push(chunk)
      return acc
    }, {})
    
    console.log(`\n   Chunks por documento:`)
    Object.entries(grouped).forEach(([kbId, chunkList]: [string, any]) => {
      console.log(`   - ${kbId}: ${chunkList.length} chunks`)
    })
  } else {
    console.log(`   ❌ NENHUM CHUNK ENCONTRADO!`)
    console.log(`   \n   Isso significa que os documentos não foram processados em chunks.`)
    console.log(`   Você precisa fazer upload dos documentos novamente.`)
  }

  if (chunksError) {
    console.log(`\n   Erro ao buscar chunks:`, chunksError)
  }
  if (kbError) {
    console.log(`\n   Erro ao buscar knowledge base:`, kbError)
  }
}

checkDocuments()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erro:', error)
    process.exit(1)
  })
