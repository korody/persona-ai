/**
 * Atualiza anamnese com campos calculados faltantes
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Mapeamento de respostas para elementos
const ELEMENTO_MAP: Record<string, string> = {
  A: 'MADEIRA',
  B: 'FOGO',
  C: 'TERRA',
  D: 'METAL',
  E: 'ÁGUA',
  F: 'BAÇO' // Algumas perguntas usam BAÇO diretamente
}

async function updateAnamnese() {
  console.log('🔧 Atualizando anamnese com campos calculados...\n')

  const { data: quizLead, error } = await supabase
    .from('quiz_leads')
    .select('*')
    .eq('nome', 'Marcos')
    .single()

  if (error || !quizLead) {
    console.error('❌ Erro ao buscar anamnese:', error)
    return
  }

  console.log('📋 Anamnese atual:')
  console.log(`   Nome: ${quizLead.nome}`)
  console.log(`   Elemento Principal: ${quizLead.elemento_principal}`)
  console.log(`   Respostas:`, quizLead.respostas)
  console.log()

  // Calcular contagem de elementos
  const respostas = quizLead.respostas as Record<string, string | string[]>
  const contagemElementos: Record<string, number> = {
    MADEIRA: 0,
    FOGO: 0,
    TERRA: 0,
    METAL: 0,
    ÁGUA: 0,
    BAÇO: 0
  }

  // Contar respostas
  Object.entries(respostas).forEach(([pergunta, resposta]) => {
    if (Array.isArray(resposta)) {
      // Pergunta de múltipla escolha
      resposta.forEach(r => {
        const elemento = ELEMENTO_MAP[r]
        if (elemento && contagemElementos[elemento] !== undefined) {
          contagemElementos[elemento]++
        }
      })
    } else {
      // Pergunta de escolha única
      const elemento = ELEMENTO_MAP[resposta]
      if (elemento && contagemElementos[elemento] !== undefined) {
        contagemElementos[elemento]++
      }
    }
  })

  console.log('📊 Contagem de elementos calculada:')
  Object.entries(contagemElementos)
    .sort(([, a], [, b]) => b - a)
    .forEach(([elem, count]) => {
      const isPrincipal = elem === quizLead.elemento_principal
      const marker = isPrincipal ? '⭐' : '  '
      console.log(`   ${marker} ${elem}: ${count}`)
    })
  console.log()

  // Calcular intensidade (score do elemento principal)
  const elementoPrincipal = quizLead.elemento_principal || 'BAÇO'
  const intensidadeCalculada = contagemElementos[elementoPrincipal] || 0

  console.log(`🎯 Intensidade calculada: ${intensidadeCalculada} (score do elemento ${elementoPrincipal})\n`)

  // Atualizar no banco
  console.log('💾 Atualizando no banco de dados...')
  
  const { error: updateError } = await supabase
    .from('quiz_leads')
    .update({
      contagem_elementos: contagemElementos,
      intensidade_calculada: intensidadeCalculada,
      updated_at: new Date().toISOString()
    })
    .eq('id', quizLead.id)

  if (updateError) {
    console.error('❌ Erro ao atualizar:', updateError)
    return
  }

  console.log('✅ Anamnese atualizada com sucesso!\n')

  // Verificar atualização
  const { data: updated } = await supabase
    .from('quiz_leads')
    .select('contagem_elementos, intensidade_calculada')
    .eq('id', quizLead.id)
    .single()

  if (updated) {
    console.log('✅ Verificação pós-atualização:')
    console.log('   contagem_elementos:', updated.contagem_elementos)
    console.log('   intensidade_calculada:', updated.intensidade_calculada)
  }
}

updateAnamnese().catch(console.error)
