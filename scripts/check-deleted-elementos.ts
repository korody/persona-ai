/**
 * Verificar se MADEIRA, TERRA e FOGO foram completamente deletados
 * Checando documentos e chunks
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDeletedElementos() {
  console.log('\n🔍 VERIFICANDO DELEÇÃO DE ELEMENTOS\n')
  console.log('='.repeat(70))

  const elementosParaVerificar = ['MADEIRA', 'TERRA', 'FOGO']

  // 1. Verificar documentos base
  console.log('\n📄 1. VERIFICANDO DOCUMENTOS BASE (avatar_knowledge_base):\n')
  
  for (const elemento of elementosParaVerificar) {
    const { data: docs, error } = await supabase
      .from('avatar_knowledge_base')
      .select('id, title, metadata')
      .ilike('title', `%${elemento}%`)
    
    if (error) {
      console.log(`   ❌ Erro ao verificar ${elemento}:`, error.message)
    } else if (docs && docs.length > 0) {
      console.log(`   ⚠️  ${elemento}: ${docs.length} documento(s) AINDA EXISTEM`)
      docs.forEach(doc => {
        console.log(`      - ${doc.id}: ${doc.title}`)
      })
    } else {
      console.log(`   ✅ ${elemento}: NENHUM documento encontrado (OK)`)
    }
  }

  // 2. Verificar chunks
  console.log('\n\n📦 2. VERIFICANDO CHUNKS (knowledge_chunks):\n')
  
  for (const elemento of elementosParaVerificar) {
    const { data: chunks, error } = await supabase
      .from('knowledge_chunks')
      .select('id, metadata')
      .eq('metadata->>elemento', elemento)
    
    if (error) {
      console.log(`   ❌ Erro ao verificar chunks de ${elemento}:`, error.message)
    } else if (chunks && chunks.length > 0) {
      console.log(`   ⚠️  ${elemento}: ${chunks.length} chunk(s) AINDA EXISTEM`)
      console.log(`      IDs: ${chunks.map(c => c.id.substring(0, 8)).join(', ')}...`)
    } else {
      console.log(`   ✅ ${elemento}: NENHUM chunk encontrado (OK)`)
    }
  }

  // 3. Verificar embeddings (chunks com embedding)
  console.log('\n\n🔢 3. VERIFICANDO EMBEDDINGS:\n')
  
  for (const elemento of elementosParaVerificar) {
    const { data: chunksComEmbedding, error } = await supabase
      .from('knowledge_chunks')
      .select('id, embedding, metadata')
      .eq('metadata->>elemento', elemento)
      .not('embedding', 'is', null)
    
    if (error) {
      console.log(`   ❌ Erro ao verificar embeddings de ${elemento}:`, error.message)
    } else if (chunksComEmbedding && chunksComEmbedding.length > 0) {
      console.log(`   ⚠️  ${elemento}: ${chunksComEmbedding.length} chunk(s) COM EMBEDDING ainda existem`)
    } else {
      console.log(`   ✅ ${elemento}: NENHUM embedding encontrado (OK)`)
    }
  }

  // 4. Verificar total de chunks por elemento (todos os elementos)
  console.log('\n\n📊 4. DISTRIBUIÇÃO GERAL DE CHUNKS POR ELEMENTO:\n')
  
  const { data: allChunks } = await supabase
    .from('knowledge_chunks')
    .select('metadata')
  
  if (allChunks) {
    const distribuicao: Record<string, number> = {}
    
    allChunks.forEach((chunk: any) => {
      const elemento = chunk.metadata?.elemento || 'N/A'
      distribuicao[elemento] = (distribuicao[elemento] || 0) + 1
    })
    
    Object.entries(distribuicao)
      .sort(([, a], [, b]) => b - a)
      .forEach(([elemento, count]) => {
        const status = ['MADEIRA', 'TERRA', 'FOGO'].includes(elemento) ? '⚠️  PROBLEMA' : '✅'
        console.log(`   ${status} ${elemento}: ${count} chunks`)
      })
    
    const total = Object.values(distribuicao).reduce((sum, count) => sum + count, 0)
    console.log(`\n   📦 Total de chunks no sistema: ${total}`)
  }

  // 5. Verificar total de documentos
  console.log('\n\n📄 5. TOTAL DE DOCUMENTOS:\n')
  
  const { count: totalDocs } = await supabase
    .from('avatar_knowledge_base')
    .select('*', { count: 'exact', head: true })
  
  console.log(`   📚 Total de documentos: ${totalDocs}`)

  // 6. Verificar documentos restantes por título
  console.log('\n\n📋 6. DOCUMENTOS RESTANTES (primeiros 10):\n')
  
  const { data: remainingDocs } = await supabase
    .from('avatar_knowledge_base')
    .select('id, title, metadata')
    .limit(10)
  
  if (remainingDocs && remainingDocs.length > 0) {
    remainingDocs.forEach((doc, i) => {
      const elemento = doc.metadata?.elemento || 'N/A'
      console.log(`   ${i + 1}. ${doc.title}`)
      console.log(`      Elemento: ${elemento}`)
      console.log(`      ID: ${doc.id}`)
      console.log()
    })
  }

  console.log('='.repeat(70))
  console.log('\n✅ Verificação completa!\n')
}

checkDeletedElementos().catch(console.error)
