import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  console.log('🔄 Executando migração: add-memberkit-product-id-to-portfolio\n')

  try {
    // Adicionar coluna
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE avatar_portfolio ADD COLUMN IF NOT EXISTS memberkit_product_id INTEGER'
    })

    if (alterError) {
      console.error('❌ Erro ao adicionar coluna:', alterError)
      throw alterError
    }

    console.log('✅ Coluna memberkit_product_id adicionada')

    // Criar índice
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: 'CREATE INDEX IF NOT EXISTS idx_avatar_portfolio_memberkit_product_id ON avatar_portfolio(memberkit_product_id)'
    })

    if (indexError) {
      console.error('⚠️ Erro ao criar índice (pode já existir):', indexError.message)
    } else {
      console.log('✅ Índice criado')
    }

    // Verificar estrutura
    const { data, error } = await supabase
      .from('avatar_portfolio')
      .select('*')
      .limit(1)

    if (!error) {
      console.log('\n✅ Migração concluída com sucesso!')
      console.log('📊 Colunas da tabela avatar_portfolio:', Object.keys(data[0] || {}))
    }

  } catch (error) {
    console.error('\n❌ Erro na migração:', error)
    process.exit(1)
  }
}

runMigration()
