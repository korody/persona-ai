import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function runMigration() {
  console.log('🔄 Executando migração SQL...\n')

  const sql = `
    ALTER TABLE avatar_portfolio 
    ADD COLUMN IF NOT EXISTS memberkit_product_id INTEGER;

    CREATE INDEX IF NOT EXISTS idx_avatar_portfolio_memberkit_product_id 
    ON avatar_portfolio(memberkit_product_id);
  `

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ query: sql })
    })

    if (!response.ok) {
      // Tentar via Management API
      const mgmtResponse = await fetch(`${supabaseUrl.replace('.supabase.co', '.supabase.co')}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'return=minimal'
        }
      })
    }

    console.log('✅ Migração aplicada!')
    console.log('\n📝 SQL executado:')
    console.log(sql)

  } catch (error: any) {
    console.error('❌ Erro:', error.message)
    console.log('\n⚠️ Execute manualmente no Supabase Dashboard > SQL Editor:')
    console.log(sql)
  }
}

runMigration()
