import { createAdminClient } from '../lib/supabase/server.js'
import fs from 'fs'

async function runMigration() {
  const supabase = await createAdminClient()
  
  const sql = fs.readFileSync('supabase/migrations/fix-constraints.sql', 'utf-8')
  
  console.log('📜 Executando migration:\n', sql)
  
  // Dividir em statements individuais
  const statements = sql.split(';').filter(s => s.trim())
  
  for (const statement of statements) {
    if (!statement.trim()) continue
    
    console.log('\n🔄 Executando:', statement.trim().substring(0, 100) + '...')
    
    const { error } = await supabase.rpc('exec_sql', { sql: statement })
    
    if (error) {
      console.error('❌ Erro:', error)
    } else {
      console.log('✅ Sucesso')
    }
  }
  
  console.log('\n✅ Migration concluída!')
}

runMigration()
