import { createAdminClient } from '../lib/supabase/server.js'

async function checkConstraints() {
  const supabase = await createAdminClient()
  
  // Pegar definição da tabela diretamente
  const { data, error } = await supabase
    .from('hub_exercises')
    .select('*')
    .limit(0)
  
  console.log('Erro ao consultar (para ver estrutura):', error)
  
  // Tentar insert com valor inválido para ver a mensagem de erro detalhada
  const testCases = [
    { element: 'ÁGUA', expected: 'pass' },
    { element: 'TERRA', expected: 'pass' },
    { element: 'FOGO', expected: 'pass' },
    { element: 'METAL', expected: 'pass' },
    { element: 'MADEIRA', expected: 'pass' },
  ]
  
  for (const test of testCases) {
    const result = await supabase
      .from('hub_exercises')
      .insert({
        memberkit_course_id: 'test',
        memberkit_section_id: 'test',
        memberkit_lesson_id: `test-${test.element}`,
        title: 'Test',
        slug: `test-${test.element}`,
        url: 'https://test.com',
        position: 1,
        element: test.element
      })
    
    if (result.error) {
      console.log(`❌ ${test.element}: ${result.error.message}`)
    } else {
      console.log(`✅ ${test.element}: aceito`)
      // Deletar o teste
      await supabase
        .from('hub_exercises')
        .delete()
        .eq('memberkit_lesson_id', `test-${test.element}`)
    }
  }
}

checkConstraints()
