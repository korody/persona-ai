import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkColumns() {
  // Tentar selecionar todas as colunas de um avatar
  const { data, error } = await supabase
    .from('avatars')
    .select('*')
    .limit(1)
    .single()

  console.log('\n📊 Avatar data:', data)
  console.log('\n❌ Error:', error)
  
  if (data) {
    console.log('\n✅ Colunas disponíveis:', Object.keys(data))
    console.log('\n🔍 Valores específicos:')
    console.log('- system_prompt:', data.system_prompt ? 'EXISTS' : 'NULL/MISSING')
    console.log('- temperature:', data.temperature)
    console.log('- max_tokens:', data.max_tokens)
  }
}

checkColumns()
