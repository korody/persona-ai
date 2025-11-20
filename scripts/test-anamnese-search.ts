/**
 * Testa se a busca está priorizando o elemento do diagnóstico
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
  if (vecA.length !== vecB.length) return 0

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  return denominator === 0 ? 0 : dotProduct / denominator
}

async function testAnamneseSearch() {
  const query = 'pode me passar meu diagnostico?'
  const avatarId = '4ba4ff39-823a-4aa9-a129-8f23fec2704d'
  const matchThreshold = 0.3

  console.log('🔍 Testando busca com Anamnese...\n')
  console.log(`Query: "${query}"`)
  console.log(`Threshold: ${matchThreshold}\n`)

  // Buscar anamnese do usuário
  console.log('👤 Buscando anamnese do usuário Marcos...')
  const { data: quizData } = await supabase
    .from('quiz_leads')
    .select('*')
    .eq('nome', 'Marcos')
    .single()

  if (!quizData) {
    console.log('❌ Anamnese não encontrada!')
    return
  }

  console.log(`✅ Anamnese encontrada:`)
  console.log(`   Nome: ${quizData.nome}`)
  console.log(`   Elemento Principal: ${quizData.elemento_principal}`)
  console.log(`   Intensidade: ${quizData.intensidade_calculada}`)
  console.log(`   Contagem elementos:`, quizData.contagem_elementos)
  console.log()

  // Obter elementos secundários (score > 2)
  const contagemElementos = quizData.contagem_elementos as Record<string, number>
  const elementosSecundarios = Object.entries(contagemElementos)
    .filter(([elem, count]) => 
      elem !== quizData.elemento_principal && 
      count > 2
    )
    .map(([elem]) => elem)

  console.log(`📊 Elementos Secundários (score > 2): ${elementosSecundarios.join(', ') || 'nenhum'}\n`)

  // Gerar embedding
  const queryEmbedding = await generateEmbedding(query)

  // Buscar chunks
  const { data: chunks } = await supabase
    .from('knowledge_chunks')
    .select('id, content, embedding, metadata')
    .eq('avatar_id', avatarId)
    .limit(100)

  if (!chunks || chunks.length === 0) {
    console.log('❌ Nenhum chunk encontrado!')
    return
  }

  // Parse embeddings e calcular similaridade
  const validData = chunks.map((chunk: any) => {
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

  // Calcular similaridade e categorizar
  const results = validData
    .map((chunk: any) => {
      const similarity = calculateCosineSimilarity(queryEmbedding, chunk.embedding)
      const chunkElemento = chunk.metadata?.elemento as string | undefined
      
      const isPrimary = chunkElemento === quizData.elemento_principal
      const isSecondary = elementosSecundarios.includes(chunkElemento || '')

      return {
        similarity,
        elemento: chunkElemento || 'N/A',
        isPrimary,
        isSecondary,
        title: chunk.metadata?.title || 'N/A',
        contentPreview: chunk.content.substring(0, 100) + '...',
      }
    })
    .filter(r => r.similarity >= matchThreshold)
    .sort((a, b) => {
      // Ordenar por prioridade: Primary > Secondary > Geral, depois similaridade
      if (a.isPrimary && !b.isPrimary) return -1
      if (!a.isPrimary && b.isPrimary) return 1
      if (a.isSecondary && !b.isSecondary) return -1
      if (!a.isSecondary && b.isSecondary) return 1
      return b.similarity - a.similarity
    })

  console.log(`📊 Resultados (${results.length} encontrados):\n`)

  results.slice(0, 10).forEach((r, i) => {
    const badge = r.isPrimary 
      ? '⭐ PRIMÁRIO' 
      : r.isSecondary 
        ? '⚠️ SECUNDÁRIO' 
        : '📄 GERAL'
    
    console.log(`${i + 1}. ${badge} | ${(r.similarity * 100).toFixed(1)}% | ${r.elemento}`)
    console.log(`   Title: ${r.title}`)
    console.log(`   Preview: ${r.contentPreview}`)
    console.log()
  })

  // Estatísticas
  const primaryCount = results.filter(r => r.isPrimary).length
  const secondaryCount = results.filter(r => r.isSecondary).length
  const generalCount = results.filter(r => !r.isPrimary && !r.isSecondary).length

  console.log(`\n📈 Estatísticas de Priorização:`)
  console.log(`   ⭐ Elemento Principal (${quizData.elemento_principal}): ${primaryCount} resultados`)
  console.log(`   ⚠️ Elementos Secundários: ${secondaryCount} resultados`)
  console.log(`   📄 Conhecimento Geral: ${generalCount} resultados`)
  console.log(`   Total: ${results.length} resultados`)
}

testAnamneseSearch().catch(console.error)
