/**
 * Deletar e reprocessar APENAS os 5 documentos de elementos
 */

import { createClient } from '@supabase/supabase-js'
import { generateEmbedding } from '../lib/rag/embeddings'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Parser YAML
function extractYAMLMetadata(content: string): any {
  const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!yamlMatch) return {}

  const yamlContent = yamlMatch[1]
  const metadata: any = {}
  const lines = yamlContent.split('\n')
  
  for (const line of lines) {
    if (line.includes('METADATA_DOCUMENTO:')) continue
    
    const arrayMatch = line.match(/^(\w+):\s*\[(.+)\]/)
    if (arrayMatch) {
      metadata[arrayMatch[1].trim()] = arrayMatch[2].split(',').map(v => v.trim())
      continue
    }
    
    const kvMatch = line.match(/^(\w+):\s*(.+)/)
    if (kvMatch) {
      metadata[kvMatch[1].trim()] = kvMatch[2].trim()
    }
  }

  return metadata
}

// Splitter simples mas eficaz
function simpleChunkSplitter(text: string, maxChunkSize = 1500): string[] {
  const chunks: string[] = []
  const paragraphs = text.split(/\n\n+/)
  
  let currentChunk = ''
  
  for (const para of paragraphs) {
    if ((currentChunk + para).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      currentChunk = para
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }
  
  return chunks
}

async function reprocessElementos() {
  console.log('🔄 Reprocessando documentos de elementos MTC...\n')

  const elementoTitles = [
    'ELEMENTO TERRA',
    'ELEMENTO AGUA', 
    'ELEMENTO METAL',
    'ELEMENTO MADEIRA',
    'ELEMENTO FOGO'
  ]

  for (const title of elementoTitles) {
    console.log(`\n🔥 Processando: ${title}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // Buscar documento
    const { data: doc } = await supabase
      .from('avatar_knowledge_base')
      .select('*')
      .eq('title', title)
      .single()

    if (!doc) {
      console.log(`   ⚠️ Documento não encontrado, pulando...\n`)
      continue
    }

    // Deletar chunks antigos
    const { data: oldChunks } = await supabase
      .from('knowledge_chunks')
      .select('id')
      .eq('knowledge_base_id', doc.id)

    if (oldChunks && oldChunks.length > 0) {
      console.log(`   🗑️  Deletando ${oldChunks.length} chunks antigos...`)
      
      await supabase
        .from('knowledge_chunks')
        .delete()
        .eq('knowledge_base_id', doc.id)
    }

    // Extrair metadata YAML
    const yamlMetadata = extractYAMLMetadata(doc.content)
    console.log(`   📋 Elemento: ${yamlMetadata.elemento || 'N/A'}`)

    // Remover cabeçalho YAML do conteúdo
    const contentWithoutYAML = doc.content.replace(/^---\n[\s\S]*?\n---\n\n/, '')

    // Dividir em chunks
    const chunks = simpleChunkSplitter(contentWithoutYAML, 1500)
    console.log(`   ✂️  Dividido em ${chunks.length} chunks`)

    // Criar chunks com embeddings
    console.log(`   🔄 Gerando embeddings...`)
    
    let created = 0
    for (let i = 0; i < chunks.length; i++) {
      const chunkContent = chunks[i]
      const embedding = await generateEmbedding(chunkContent)

      const { error } = await supabase.from('knowledge_chunks').insert({
        avatar_id: doc.avatar_id,
        knowledge_base_id: doc.id,
        content: chunkContent,
        embedding: embedding,
        metadata: {
          knowledge_base_id: doc.id,
          title: doc.title,
          content_type: 'markdown',
          // Metadata do YAML
          elemento: yamlMetadata.elemento,
          orgaos: yamlMetadata.orgaos,
          emocao_principal: yamlMetadata.emocao_principal,
          sintomas_fisicos: yamlMetadata.sintomas_fisicos,
          sintomas_emocionais: yamlMetadata.sintomas_emocionais,
          tipo_conteudo: yamlMetadata.tipo_conteudo,
          chunk_index: i,
        }
      })

      if (error) {
        console.error(`      ❌ Erro no chunk ${i}:`, error.message)
      } else {
        created++
        if (created % 10 === 0) {
          process.stdout.write(`   📝 ${created}/${chunks.length} chunks criados...\r`)
        }
      }
    }

    console.log(`   ✅ ${created} chunks criados com sucesso!\n`)
  }

  console.log('\n✅ REPROCESSAMENTO CONCLUÍDO!')
}

reprocessElementos().catch(console.error)
