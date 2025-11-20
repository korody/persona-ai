/**
 * Testa busca vetorial com query real
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

const supabase = createClient(supabaseUrl, supabaseKey)

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return response.data[0].embedding
}

function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    return 0
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  if (denominator === 0) {
    return 0
  }

  return dotProduct / denominator
}

async function testSearch() {
  const query = 'Quais alimentos são bons para o baço?'
  const avatarId = '4ba4ff39-823a-4aa9-a129-8f23fec2704d' // mestre-ye
  const matchThreshold = 0.3 // 30%

  console.log('🔍 Testando busca vetorial...\n')
  console.log(`Query: "${query}"`)
  console.log(`Avatar: ${avatarId}`)
  console.log(`Threshold: ${matchThreshold}\n`)

  // Gerar embedding da query
  console.log('📊 Gerando embedding da query...')
  const queryEmbedding = await generateEmbedding(query)
  console.log(`✅ Embedding gerado: ${queryEmbedding.length} dimensões\n`)

  // Buscar chunks
  console.log('🔎 Buscando chunks...')
  const { data, error } = await supabase
    .from('knowledge_chunks')
    .select('id, content, embedding, metadata')
    .eq('avatar_id', avatarId)
    .limit(100)

  if (error) {
    console.error('❌ Erro ao buscar chunks:', error)
    return
  }

  console.log(`✅ ${data?.length || 0} chunks encontrados\n`)

  if (!data || data.length === 0) {
    console.log('⚠️  Nenhum chunk encontrado!')
    return
  }

  // Parse embeddings from string to array
  const validData = data.map((chunk: any) => {
    if (typeof chunk.embedding === 'string') {
      chunk.embedding = chunk.embedding
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map((v: string) => parseFloat(v.trim()))
    }
    return chunk
  }).filter((chunk: any) => 
    chunk.embedding && 
    Array.isArray(chunk.embedding) && 
    chunk.embedding.length === 1536
  )

  console.log(`✅ ${validData.length} chunks com embeddings válidos\n`)

  // Calcular similaridades
  console.log('📐 Calculando similaridades...\n')
  
  const results = validData
    .map((chunk: any) => {
      const similarity = calculateCosineSimilarity(queryEmbedding, chunk.embedding)
      return {
        id: chunk.id,
        content: chunk.content.substring(0, 100) + '...',
        similarity,
        elemento: chunk.metadata?.elemento,
        title: chunk.metadata?.title,
      }
    })
    .sort((a, b) => b.similarity - a.similarity)

  // Mostrar top 10
  console.log('📊 Top 10 resultados (por similaridade):\n')
  results.slice(0, 10).forEach((r, i) => {
    const passesThreshold = r.similarity >= matchThreshold ? '✅' : '❌'
    console.log(`${i + 1}. ${passesThreshold} Similaridade: ${(r.similarity * 100).toFixed(1)}%`)
    console.log(`   Elemento: ${r.elemento || 'N/A'}`)
    console.log(`   Title: ${r.title || 'N/A'}`)
    console.log(`   Conteúdo: ${r.content}`)
    console.log()
  })

  // Filtrar por threshold
  const filtered = results.filter(r => r.similarity >= matchThreshold)
  console.log(`\n✅ ${filtered.length} resultados passam no threshold de ${matchThreshold}`)
  
  // Mostrar estatísticas
  console.log(`\n📊 Estatísticas:`)
  console.log(`   Maior similaridade: ${(results[0].similarity * 100).toFixed(1)}%`)
  console.log(`   Menor similaridade: ${(results[results.length - 1].similarity * 100).toFixed(1)}%`)
  console.log(`   Média: ${(results.reduce((sum, r) => sum + r.similarity, 0) / results.length * 100).toFixed(1)}%`)
}

testSearch().catch(console.error)
