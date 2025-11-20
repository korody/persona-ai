import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function addColumns() {
  console.log('🔧 Adicionando colunas temperature e max_tokens...')
  
  const sql = `
    ALTER TABLE avatars 
    ADD COLUMN IF NOT EXISTS temperature DECIMAL(3,2) DEFAULT 0.7,
    ADD COLUMN IF NOT EXISTS max_tokens INTEGER DEFAULT 500;
  `
  
  const { data, error } = await supabase.rpc('exec_sql', { sql })
  
  if (error) {
    console.error('❌ Erro:', error)
  } else {
    console.log('✅ Colunas adicionadas com sucesso!')
  }
}

addColumns()
