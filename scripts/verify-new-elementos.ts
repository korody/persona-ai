/**
 * Verificação detalhada de embeddings dos novos elementos
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkNewElementos() {
  console.log('\n✅ VERIFICAÇÃO DETALHADA - FOGO E MADEIRA\n')
  console.log('='.repeat(70))

  const elementos = ['FOGO', 'MADEIRA']

  for (const elemento of elementos) {
    console.log(`\n🔥 ELEMENTO ${elemento}:\n`)

    // Buscar chunks do elemento
    const { data: chunks, error } = await supabase
      .from('knowledge_chunks')
      .select('id, content, embedding, metadata')
      .eq('metadata->>elemento', elemento)

    if (error) {
      console.log(`   ❌ Erro: ${error.message}`)
      continue
    }

    if (!chunks || chunks.length === 0) {
      console.log(`   ⚠️  Nenhum chunk encontrado!`)
      continue
    }

    console.log(`   📦 Total de chunks: ${chunks.length}`)

    // Verificar embeddings
    let comEmbedding = 0
    let semEmbedding = 0
    let embeddingInvalido = 0

    chunks.forEach((chunk: any) => {
      if (!chunk.embedding) {
        semEmbedding++
      } else {
        // Parse embedding
        let parsed: number[] | null = null
        
        if (typeof chunk.embedding === 'string') {
          try {
            const cleaned = chunk.embedding.replace(/^\[|\]$/g, '')
            parsed = cleaned.split(',').map((v: string) => parseFloat(v.trim()))
          } catch {
            embeddingInvalido++
          }
        } else if (Array.isArray(chunk.embedding)) {
          parsed = chunk.embedding
        }

        if (parsed && parsed.length === 1536) {
          comEmbedding++
        } else {
          embeddingInvalido++
        }
      }
    })

    console.log(`   ✅ Com embedding válido (1536d): ${comEmbedding}`)
    console.log(`   ❌ Sem embedding: ${semEmbedding}`)
    console.log(`   ⚠️  Embedding inválido: ${embeddingInvalido}`)

    // Mostrar preview dos chunks
    console.log(`\n   📝 Preview dos chunks:`)
    chunks.slice(0, 3).forEach((chunk: any, i) => {
      const preview = chunk.content.substring(0, 80).replace(/\n/g, ' ')
      console.log(`      ${i + 1}. ${preview}...`)
    })

    if (chunks.length > 3) {
      console.log(`      ... e mais ${chunks.length - 3} chunks`)
    }
  }

  // Resumo geral
  console.log('\n' + '='.repeat(70))
  console.log('\n📊 RESUMO GERAL DO SISTEMA:\n')

  const { data: allChunks } = await supabase
    .from('knowledge_chunks')
    .select('metadata, embedding')

  if (allChunks) {
    const stats: Record<string, { total: number; comEmbedding: number }> = {}

    allChunks.forEach((chunk: any) => {
      const elemento = chunk.metadata?.elemento || 'N/A'
      
      if (!stats[elemento]) {
        stats[elemento] = { total: 0, comEmbedding: 0 }
      }
      
      stats[elemento].total++
      
      if (chunk.embedding) {
        stats[elemento].comEmbedding++
      }
    })

    Object.entries(stats)
      .sort(([, a], [, b]) => b.total - a.total)
      .forEach(([elemento, { total, comEmbedding }]) => {
        const percent = ((comEmbedding / total) * 100).toFixed(0)
        const status = comEmbedding === total ? '✅' : '⚠️'
        console.log(`   ${status} ${elemento.padEnd(10)} ${total} chunks (${comEmbedding} com embedding = ${percent}%)`)
      })

    const totalChunks = allChunks.length
    const chunksComEmbedding = allChunks.filter((c: any) => c.embedding).length
    const percentGeral = ((chunksComEmbedding / totalChunks) * 100).toFixed(1)

    console.log(`\n   📦 TOTAL: ${totalChunks} chunks`)
    console.log(`   ✅ Com embedding: ${chunksComEmbedding} (${percentGeral}%)`)
  }

  console.log('\n' + '='.repeat(70) + '\n')
}

checkNewElementos().catch(console.error)
