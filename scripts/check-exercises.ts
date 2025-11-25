import { createAdminClient } from '../lib/supabase/server.js'

async function checkExercises() {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('hub_exercises')
    .select('*')
    .limit(3)
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log(JSON.stringify(data, null, 2))
}

checkExercises()
