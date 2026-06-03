/**
 * Aplica a migration supabase/migrations/reset-monthly-credits-all-plans.sql
 *
 * Tenta dois caminhos:
 *   1. RPC `exec_sql({ sql_query })` se ela existir no projeto.
 *   2. Conexão Postgres direta via `pg` usando DATABASE_URL.
 *
 * Uso:
 *   pnpm tsx --env-file=.env.local scripts/run-cron-credits-migration.ts
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'

const MIGRATION_FILE = 'supabase/migrations/reset-monthly-credits-all-plans.sql'

async function tryExecSqlRpc(sql: string): Promise<boolean> {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_API_KEY ||
    ''

  if (!url || !key) {
    console.log('   skip: faltam SUPABASE_URL / service key no ambiente')
    return false
  }

  const supabase = createClient(url, key)
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql }) as any

  if (error) {
    console.log(`   falhou: ${error.message}`)
    return false
  }
  return true
}

async function tryPgDirect(sql: string): Promise<boolean> {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.log('   skip: DATABASE_URL não definida')
    return false
  }

  const { Client } = await import('pg')
  const client = new Client({ connectionString: dbUrl })

  try {
    await client.connect()
    await client.query(sql)
    return true
  } catch (err: any) {
    console.log(`   falhou: ${err.message}`)
    return false
  } finally {
    await client.end().catch(() => {})
  }
}

async function main() {
  const sql = readFileSync(join(process.cwd(), MIGRATION_FILE), 'utf-8')

  console.log(`\n📜 Migration: ${MIGRATION_FILE} (${sql.length} chars)\n`)

  console.log('1) Tentando RPC exec_sql ...')
  if (await tryExecSqlRpc(sql)) {
    console.log('\n✅ Migration aplicada via RPC exec_sql')
    return
  }

  console.log('\n2) Tentando conexão direta (pg + DATABASE_URL) ...')
  if (await tryPgDirect(sql)) {
    console.log('\n✅ Migration aplicada via Postgres direto')
    return
  }

  console.log('\n❌ Nenhum método funcionou.\n')
  console.log('Cole o SQL no Supabase SQL Editor:')
  console.log(
    '   https://supabase.com/dashboard/project/kfkhdfnkwhljhhjcvbqp/sql/new\n'
  )
  process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
