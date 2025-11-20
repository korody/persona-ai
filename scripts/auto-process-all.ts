#!/usr/bin/env node
/**
 * CLI: Processar todos os documentos pendentes automaticamente
 * 
 * Uso:
 *   npx tsx scripts/auto-process-all.ts
 */

import { createClient } from '@supabase/supabase-js'
import { generateEmbedding } from '../lib/rag/embeddings'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Extrair metadata YAML
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

// Splitter
function splitIntoChunks(text: string, maxChunkSize = 1500): string[] {
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

async function processAllPending() {
  console.log('🚀 PROCESSAMENTO AUTOMÁTICO DE DOCUMENTOS\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // Buscar todos os documentos
  const { data: allDocs } = await supabase
    .from('avatar_knowledge_base')
    .select('*')
    .order('created_at', { ascending: false })

  if (!allDocs || allDocs.length === 0) {
    console.log('❌ Nenhum documento encontrado\n')
    return
  }

  console.log(`📄 Total de documentos: ${allDocs.length}\n`)

  let processed = 0
  let skipped = 0
  let errors = 0
  let totalChunks = 0

  for (const doc of allDocs) {
    try {
      console.log(`\n📑 ${doc.title}`)
      console.log(`   ID: ${doc.id}`)

      // Verificar se já tem chunks
      const { data: existingChunks } = await supabase
        .from('knowledge_chunks')
        .select('id')
        .eq('knowledge_base_id', doc.id)

      if (existingChunks && existingChunks.length > 0) {
        console.log(`   ⏭️  JÁ PROCESSADO (${existingChunks.length} chunks)\n`)
        skipped++
        continue
      }

      // Extrair metadata
      const yamlMetadata = extractYAMLMetadata(doc.content)
      const elemento = yamlMetadata.elemento || 'N/A'
      console.log(`   📋 Elemento: ${elemento}`)

      // Remover YAML
      const contentWithoutYAML = doc.content.replace(/^---\n[\s\S]*?\n---\n\n/, '')

      // Criar chunks
      const textChunks = splitIntoChunks(contentWithoutYAML, 1500)
      console.log(`   ✂️  ${textChunks.length} chunks`)

      // Processar cada chunk
      process.stdout.write(`   🔄 Gerando embeddings...`)
      
      let created = 0
      for (let i = 0; i < textChunks.length; i++) {
        const embedding = await generateEmbedding(textChunks[i])

        const { error: chunkError } = await supabase
          .from('knowledge_chunks')
          .insert({
            avatar_id: doc.avatar_id,
            knowledge_base_id: doc.id,
            content: textChunks[i],
            embedding: embedding,
            metadata: {
              knowledge_base_id: doc.id,
              title: doc.title,
              content_type: 'markdown',
              elemento: yamlMetadata.elemento,
              orgaos: yamlMetadata.orgaos,
              emocao_principal: yamlMetadata.emocao_principal,
              sintomas_fisicos: yamlMetadata.sintomas_fisicos,
              sintomas_emocionais: yamlMetadata.sintomas_emocionais,
              tipo_conteudo: yamlMetadata.tipo_conteudo,
              chunk_index: i,
            }
          })

        if (!chunkError) created++
      }

      console.log(` ✅ ${created} chunks salvos`)
      
      processed++
      totalChunks += created

    } catch (error: any) {
      console.log(`   ❌ ERRO: ${error.message}`)
      errors++
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 RESUMO FINAL:')
  console.log(`   📄 Total de documentos: ${allDocs.length}`)
  console.log(`   ✅ Processados: ${processed}`)
  console.log(`   ⏭️  Já existiam: ${skipped}`)
  console.log(`   ❌ Erros: ${errors}`)
  console.log(`   📦 Total de chunks criados: ${totalChunks}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  if (processed > 0) {
    console.log('✨ Processamento automático concluído com sucesso!\n')
  }
}

processAllPending()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  })
