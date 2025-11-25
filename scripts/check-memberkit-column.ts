import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
})

async function addColumn() {
  console.log('🔄 Adicionando coluna memberkit_product_id...\n')

  // Usar query SQL direta
  const { data, error } = await supabase
    .from('avatar_portfolio')
    .select('memberkit_product_id')
    .limit(1)

  if (error && error.message.includes('column')) {
    console.log('✅ Coluna não existe, será criada via Supabase Dashboard')
    console.log('\nExecute no SQL Editor do Supabase:')
    console.log('```sql')
    console.log('ALTER TABLE avatar_portfolio ADD COLUMN memberkit_product_id INTEGER;')
    console.log('CREATE INDEX idx_avatar_portfolio_memberkit_product_id ON avatar_portfolio(memberkit_product_id);')
    console.log('```')
  } else if (!error) {
    console.log('✅ Coluna memberkit_product_id já existe!')
  } else {
    console.error('❌ Erro:', error)
  }
}

addColumn()
