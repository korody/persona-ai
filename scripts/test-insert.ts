import { createAdminClient } from '../lib/supabase/server.js'

async function testInsert() {
  const supabase = await createAdminClient()
  
  // Testar inserção do exercício "3938440" - A Sequência Completa com Narração
  const testExercise = {
    memberkit_course_id: 'test',
    memberkit_section_id: 'test',
    memberkit_lesson_id: 'test-lesson-123',
    title: 'Teste',
    slug: 'teste',
    url: 'https://test.com',
    position: 1,
    
    // Metadata que estou tentando inserir
    duration_minutes: 20,
    level: "INICIANTE",
    element: "TERRA",
    organs: ["TODOS"],
    benefits: ["Teste"],
    indications: ["teste"],
    contraindications: []
  }
  
  console.log('Tentando inserir:', JSON.stringify(testExercise, null, 2))
  
  const { data, error } = await supabase
    .from('hub_exercises')
    .insert(testExercise)
    .select()
  
  if (error) {
    console.error('\n❌ ERRO:', error.message)
    console.error('Details:', error.details)
    console.error('Hint:', error.hint)
  } else {
    console.log('\n✅ Sucesso:', data)
  }
}

testInsert()
