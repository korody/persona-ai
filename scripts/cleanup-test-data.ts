import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function cleanup() {
  console.log('🧹 Limpando dados de teste...\n')

  const { error } = await supabase
    .from('avatar_knowledge_base')
    .delete()
    .eq('avatar_id', '4ba4ff39-823a-4aa9-a129-8f23fec2704d')

  if (error) {
    console.log('❌ Erro:', error)
  } else {
    console.log('✅ Dados de teste removidos!')
  }
}

cleanup()
