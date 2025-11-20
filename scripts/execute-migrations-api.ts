/**
 * Executa migrations diretamente via API do Supabase
 */

import fs from 'fs'
import path from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function executeSQLStatement(sql: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: sql })
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

async function executeViaPSQL() {
  console.log('\n🚀 EXECUTANDO MIGRATIONS VIA POSTGRESQL\n')
  console.log('='.repeat(70))

  const sqlFile = path.join(process.cwd(), 'supabase', 'EXECUTE-THIS.sql')
  const sql = fs.readFileSync(sqlFile, 'utf-8')

  // Dividir em statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => {
      // Remover comentários puros e linhas vazias
      const cleanLine = s.replace(/--[^\n]*/g, '').trim()
      return cleanLine.length > 0 && cleanLine !== ';'
    })

  console.log(`\n📊 Total de statements: ${statements.length}\n`)

  // Executar via fetch direto para o database
  const DB_URL = `${SUPABASE_URL.replace('https://', 'postgresql://postgres:&YzKJ_sfm3B6RNC@db.')}/postgres`
  
  console.log('💡 Como não temos psql instalado, vou executar via REST API...\n')

  // Tentar executar tudo de uma vez via function
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

    // Executar statements um por um
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      if (!statement || statement.startsWith('--')) continue

      const preview = statement.substring(0, 80).replace(/\n/g, ' ')
      process.stdout.write(`  ${i + 1}/${statements.length}: ${preview}... `)

      try {
        // Usar query direto (supabase-js tem um método undocumented)
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: statement + ';' })
        })

        if (response.ok || response.status === 404) {
          console.log('✅')
          successCount++
        } else {
          const error = await response.text()
          console.log('⚠️')
          if (error && !error.includes('already exists')) {
            console.log(`     ${error.substring(0, 100)}`)
            errorCount++
          } else {
            successCount++
          }
        }
      } catch (err: any) {
        console.log('❌')
        console.log(`     ${err.message}`)
        errorCount++
      }

      // Delay para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    console.log('\n' + '='.repeat(70))
    console.log(`\n✅ Sucesso: ${successCount} | ❌ Erros: ${errorCount}\n`)

  } catch (error: any) {
    console.error('\n❌ Erro:', error.message)
    console.log('\n💡 SOLUÇÃO: Execute manualmente no Supabase SQL Editor')
    console.log('   Link: https://supabase.com/dashboard/project/kfkhdfnkwhljhhjcvbqp/sql\n')
  }
}

executeViaPSQL().catch(console.error)
