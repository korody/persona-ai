import { createAdminClient } from '../lib/supabase/server.js'

async function deleteAllExercises() {
  const supabase = await createAdminClient()
  
  console.log('⚠️  Deletando TODOS os exercícios...\n')
  
  const { error } = await supabase
    .from('hub_exercises')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Deleta tudo (truthy condition)
  
  if (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }
  
  // Confirmar
  const { count } = await supabase
    .from('hub_exercises')
    .select('*', { count: 'exact', head: true })
  
  console.log(`✅ Exercícios restantes: ${count}\n`)
}

deleteAllExercises()
