/**
 * Executa migrations SQL diretamente no Supabase via API
 */

import { createAdminClient } from '../lib/supabase/server'
import fs from 'fs'
import path from 'path'

async function runMigration(sqlFile: string) {
  console.log(`\n📄 Executando: ${sqlFile}\n`)
  console.log('='.repeat(70))

  try {
    const filePath = path.join(process.cwd(), 'supabase', 'migrations', sqlFile)
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Arquivo não encontrado: ${filePath}`)
      return false
    }

    const sql = fs.readFileSync(filePath, 'utf-8')
    
    // Dividir em statements individuais (separados por ;)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📊 ${statements.length} statements SQL encontrados\n`)

    const supabase = await createAdminClient()
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      
      // Pular comentários e statements vazios
      if (statement.trim().startsWith('--') || statement.trim() === ';') {
        continue
      }

      // Mostrar preview do statement (primeiras 80 chars)
      const preview = statement.substring(0, 80).replace(/\n/g, ' ')
      process.stdout.write(`  ${i + 1}/${statements.length}: ${preview}...`)

      try {
        // Executar via rpc (se existir) ou direto
        const { error } = await supabase.rpc('exec_sql', { query: statement })
        
        if (error) {
          // Se exec_sql não existir, tentar executar statements específicos
          if (error.code === 'PGRST202') {
            // Não temos exec_sql, vamos usar outra abordagem
            console.log(' ⚠️ (exec_sql não disponível)')
            continue
          }
          
          console.log(' ❌')
          console.error(`     Erro: ${error.message}`)
          errorCount++
        } else {
          console.log(' ✅')
          successCount++
        }
      } catch (err: any) {
        console.log(' ❌')
        console.error(`     Exceção: ${err.message}`)
        errorCount++
      }

      // Delay pequeno entre statements
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log('\n' + '='.repeat(70))
    console.log(`\n✅ Sucesso: ${successCount} | ❌ Erros: ${errorCount}\n`)

    return errorCount === 0

  } catch (error) {
    console.error('\n❌ Erro ao executar migration:', error)
    return false
  }
}

async function main() {
  console.log('\n🚀 EXECUTANDO MIGRATIONS NO SUPABASE\n')
  console.log('Projeto: ' + process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('='.repeat(70))

  const migrations = [
    'add-training-tables-quiz.sql',
    'create-storage-bucket.sql',
  ]

  for (const migration of migrations) {
    const success = await runMigration(migration)
    if (!success) {
      console.log(`\n⚠️  Migration ${migration} teve erros, mas continuando...\n`)
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log('\n✅ Processo concluído!\n')
  console.log('💡 IMPORTANTE: Execute os SQLs manualmente no Supabase SQL Editor se houver erros.')
  console.log('   Link: https://supabase.com/dashboard/project/kfkhdfnkwhljhhjcvbqp/sql\n')
}

main().catch(console.error)
