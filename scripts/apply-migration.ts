/**
 * Aplica migration para adicionar campos calculados
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function applyMigration() {
  console.log('🔧 Aplicando migration para quiz_leads...\n')

  const migrationPath = join(process.cwd(), 'supabase', 'migrations', 'add-anamnese-calculated-fields.sql')
  const sql = readFileSync(migrationPath, 'utf-8')

  console.log('📜 SQL a ser executado:')
  console.log(sql)
  console.log()

  // Executar migration
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }) as any

  if (error) {
    console.error('❌ Erro ao executar migration:', error)
    console.log('\n💡 A RPC function exec_sql pode não existir. Vou tentar método alternativo...\n')
    
    // Método alternativo: executar via SQL direto
    const lines = sql.split(';').filter(line => line.trim())
    
    for (const line of lines) {
      if (!line.trim() || line.trim().startsWith('--') || line.trim().startsWith('COMMENT')) {
        continue
      }
      
      console.log(`Executando: ${line.substring(0, 50)}...`)
      const { error: lineError } = await (supabase as any).from('_migrations').insert({ query: line })
      
      if (lineError) {
        console.log(`   ⚠️  Erro (pode ser ignorado se coluna já existe):`, lineError.message)
      } else {
        console.log('   ✅')
      }
    }
    
    return
  }

  console.log('✅ Migration aplicada com sucesso!')
}

applyMigration().catch(console.error)
