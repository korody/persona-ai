/**
 * Verifica estrutura completa da anamnese
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAnamneseData() {
  console.log('🔍 Verificando dados de anamnese...\n')

  const { data, error } = await supabase
    .from('quiz_leads')
    .select('*')
    .eq('nome', 'Marcos')
    .single()

  if (error) {
    console.error('❌ Erro:', error)
    return
  }

  if (!data) {
    console.log('⚠️  Nenhuma anamnese encontrada para Marcos')
    return
  }

  console.log('📋 Dados completos da anamnese:\n')
  console.log(JSON.stringify(data, null, 2))
  console.log('\n\n📊 Análise dos campos:\n')

  const campos = [
    'id',
    'email',
    'nome',
    'elemento_principal',
    'diagnostico_resumo',
    'intensidade_calculada',
    'contagem_elementos',
    'nome_perfil',
    'arquetipo',
    'created_at'
  ]

  campos.forEach(campo => {
    const valor = (data as any)[campo]
    const tipo = typeof valor
    const presente = valor !== null && valor !== undefined ? '✅' : '❌'
    console.log(`${presente} ${campo}: ${tipo} = ${JSON.stringify(valor)}`)
  })
}

checkAnamneseData().catch(console.error)
