import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function addColumns() {
  console.log('🔧 Adicionando colunas temperature e max_tokens via SQL...')
  
  // Usar API SQL direta
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`
      },
      body: JSON.stringify({
        sql: `
          DO $$ 
          BEGIN
            ALTER TABLE avatars ADD COLUMN IF NOT EXISTS temperature DECIMAL(3,2) DEFAULT 0.7;
            ALTER TABLE avatars ADD COLUMN IF NOT EXISTS max_tokens INTEGER DEFAULT 500;
          END $$;
        `
      })
    }
  )
  
  const result = await response.text()
  console.log('📝 Response:', response.status, result)
  
  if (response.ok) {
    console.log('✅ Colunas adicionadas com sucesso!')
    
    // Verificar
    const { data, error } = await supabase
      .from('avatars')
      .select('id, temperature, max_tokens')
      .limit(1)
      .single()
    
    console.log('\n🔍 Verificação:', data, error)
  } else {
    console.error('❌ Erro:', result)
  }
}

addColumns()
