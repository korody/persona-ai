// Script para criar chunks para TODOS os documentos
import { createClient } from '@supabase/supabase-js'
import { generateEmbedding } from '../lib/rag/embeddings'
import { splitTextIntoChunks } from '../lib/rag/chunk-splitter'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// Extrair metadados do cabeçalho YAML
function extractYAMLMetadata(content: string): any {
  const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!yamlMatch) return {}

  const yamlContent = yamlMatch[1]
  const metadata: any = {}

  // Parsear manualmente (simples, mas funcional)
  const lines = yamlContent.split('\n')
  let currentKey = ''
  
  for (const line of lines) {
    if (line.includes('METADATA_DOCUMENTO:')) continue
    
    // Detectar arrays (ex: sintomas_fisicos: [valor1, valor2])
    const arrayMatch = line.match(/^(\w+):\s*\[(.+)\]/)
    if (arrayMatch) {
      const key = arrayMatch[1].trim()
      const values = arrayMatch[2].split(',').map(v => v.trim())
      metadata[key] = values
      continue
    }
    
    // Detectar key: value simples
    const kvMatch = line.match(/^(\w+):\s*(.+)/)
    if (kvMatch) {
      const key = kvMatch[1].trim()
      const value = kvMatch[2].trim()
      metadata[key] = value
      currentKey = key
    } else if (line.trim().startsWith('-') && currentKey) {
      // Array multilinhas
      if (!Array.isArray(metadata[currentKey])) {
        metadata[currentKey] = []
      }
      metadata[currentKey].push(line.trim().replace(/^-\s*/, ''))
    }
  }

  return metadata
}

async function createChunks() {
  console.log('🔄 Criando chunks para todos os documentos...\n')

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

  // Buscar TODOS os documentos
  const { data: documents } = await supabase
    .from('avatar_knowledge_base')
    .select('*')
    .eq('avatar_id', avatar.id)

  if (!documents || documents.length === 0) {
    console.log('❌ Nenhum documento encontrado!')
    return
  }

  console.log(`📄 Encontrados ${documents.length} documentos\n`)

  let processed = 0
  let errors = 0
  let totalChunks = 0

  for (const doc of documents) {
    try {
      console.log(`⏳ Processando: ${doc.title}...`)

      // Verificar se já tem chunks
      const { data: existingChunks } = await supabase
        .from('knowledge_chunks')
        .select('id')
        .eq('knowledge_base_id', doc.id)

      if (existingChunks && existingChunks.length > 0) {
        console.log(`   ⏭️  Já tem ${existingChunks.length} chunks, pulando...\n`)
        continue
      }

      // Extrair metadados do YAML
      const yamlMetadata = extractYAMLMetadata(doc.content)
      console.log(`   📋 Elemento detectado: ${yamlMetadata.elemento || 'N/A'}`)

      // Chunkar o documento
      const chunksData = await splitTextIntoChunks(doc.content, {
        chunkSize: 1000,
        chunkOverlap: 200
      })

      console.log(`   📝 Criando ${chunksData.length} chunks...`)

      // Criar chunks com embeddings
      for (const chunkData of chunksData) {
        const chunkEmbedding = await generateEmbedding(chunkData.content)

        const { error: insertError } = await supabase.from('knowledge_chunks').insert({
          avatar_id: avatar.id,
          knowledge_base_id: doc.id,
          content: chunkData.content,
          embedding: chunkEmbedding,
          metadata: {
            knowledge_base_id: doc.id,
            title: doc.title,
            content_type: doc.content_type,
            category: doc.metadata?.category,
            // Metadados do YAML (prioridade)
            elemento: yamlMetadata.elemento || doc.metadata?.elemento,
            orgaos: yamlMetadata.orgaos,
            emocao_principal: yamlMetadata.emocao_principal,
            sintomas_fisicos: yamlMetadata.sintomas_fisicos,
            sintomas_emocionais: yamlMetadata.sintomas_emocionais,
            tipo_conteudo: yamlMetadata.tipo_conteudo,
            nivel_severidade: doc.metadata?.nivel_severidade,
            chunk_index: chunkData.index,
          }
        })

        if (insertError) {
          console.error(`      ⚠️ Erro ao inserir chunk ${chunkData.index}:`)
          console.error(`         Mensagem: ${insertError.message}`)
          console.error(`         Detalhes: ${insertError.details}`)
          console.error(`         Hint: ${insertError.hint}`)
          throw insertError
        }
      }

      totalChunks += chunksData.length
      console.log(`   ✅ ${doc.title} processado! (${chunksData.length} chunks)\n`)
      processed++

    } catch (error) {
      console.error(`   ❌ Erro ao processar ${doc.title}:`, error)
      errors++
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📊 RESUMO:`)
  console.log(`   ✅ Processados: ${processed}`)
  console.log(`   📄 Total de chunks criados: ${totalChunks}`)
  console.log(`   ❌ Erros: ${errors}`)
  console.log(`   📄 Total de docs: ${documents.length}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

createChunks()
  .then(() => {
    console.log('✅ Script finalizado!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  })
