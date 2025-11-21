/**
 * Testa busca semântica diretamente
 */

import { createAdminClient } from '../lib/supabase/server'
import { generateQueryEmbedding } from '../lib/ai/embeddings'

async function testSemanticSearch() {
  console.log('\n🧪 TESTANDO BUSCA SEMÂNTICA\n')
  console.log('━'.repeat(70))

  const queries = [
    'estou muito cansado',
    'sem energia',
    'fadiga',
    'dor nas costas',
    'ansiedade'
  ]

  const supabase = await createAdminClient()

  for (const query of queries) {
    console.log(`\n🔍 Query: "${query}"`)
    
    try {
      // Gerar embedding
      const embedding = await generateQueryEmbedding(query)
      console.log(`   ✅ Embedding gerado (${embedding.length} dimensões)`)
      
      // Buscar com threshold baixo
      const { data, error } = await supabase.rpc('match_exercises', {
        query_embedding: embedding,
        match_threshold: 0.3, // Bem baixo para teste
        match_count: 5
      })
      
      if (error) {
        console.log(`   ❌ Erro:`, error)
      } else {
        console.log(`   ✅ Resultados: ${data?.length || 0}`)
        if (data && data.length > 0) {
          data.forEach((ex: any, i: number) => {
            console.log(`      ${i+1}. ${ex.title.substring(0, 50)} (${(ex.similarity * 100).toFixed(1)}% similar)`)
          })
        }
      }
    } catch (err) {
      console.log(`   ❌ Erro:`, err)
    }
  }

  console.log('\n━'.repeat(70))
}

testSemanticSearch().catch(console.error)
