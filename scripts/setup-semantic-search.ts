/**
 * Script para criar função RPC match_exercises no Supabase
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupSemanticSearch() {
	console.log('\n🔍 SETUP BUSCA SEMÂNTICA\n')
	console.log('='.repeat(70))

	try {
		// Ler arquivo SQL
		const sqlPath = join(
			process.cwd(),
			'supabase',
			'migrations',
			'20241120_create_match_exercises_function.sql'
		)
		const sql = readFileSync(sqlPath, 'utf-8')

		console.log('\n📋 SQL para executar no Supabase SQL Editor:\n')
		console.log('='.repeat(70))
		console.log(sql)
		console.log('='.repeat(70))

		console.log('\n📍 INSTRUÇÕES:')
		console.log('1. Acesse: https://supabase.com/dashboard/project/[PROJECT_ID]/sql/new')
		console.log('2. Cole o SQL acima')
		console.log('3. Clique em "Run"\n')
		console.log('⚠️  Após executar, rode: pnpm generate-embeddings\n')
	} catch (error) {
		console.error('\n❌ Erro:', error)
		process.exit(1)
	}
}

setupSemanticSearch()
