import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function migrate() {
  console.log('🔧 Executando migração add-avatar-personality-columns.sql...\n')
  
  // Ler arquivo SQL
  const sql = readFileSync(
    join(process.cwd(), 'supabase/migrations/add-avatar-personality-columns.sql'),
    'utf-8'
  )
  
  console.log('📝 SQL a executar:')
  console.log(sql)
  console.log('\n---\n')
  
  // Executar cada statement separadamente
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'))
  
  for (const statement of statements) {
    if (!statement) continue
    
    console.log(`⚡ Executando: ${statement.substring(0, 60)}...`)
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: statement + ';'
      })
      
      if (error) {
        // Tentar via SQL direto se RPC falhar
        console.log('⚠️  RPC falhou, tentando via SQL direto...')
        
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL!.replace('/rest/v1', '')}/rest/v1/`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({ query: statement + ';' })
          }
        )
        
        if (!response.ok) {
          console.error('❌ Erro ao executar statement')
          continue
        }
      }
      
      console.log('✅ Statement executado\n')
    } catch (err) {
      console.error('❌ Erro:', err)
    }
  }
  
  console.log('\n🎉 Migração concluída!')
  
  // Verificar
  const { data, error } = await supabase
    .from('avatars')
    .select('id, name, temperature, max_tokens')
    .limit(1)
    .single()
  
  console.log('\n🔍 Verificação:', data)
  console.log('Error:', error)
}

migrate()
