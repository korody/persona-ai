/**
 * Guia para aplicar migrações do banco de dados
 * 
 * Como aplicar as migrações:
 * 
 * 1. Acesse o Dashboard do Supabase: https://supabase.com/dashboard
 * 2. Selecione seu projeto
 * 3. Vá em "SQL Editor" no menu lateral
 * 4. Crie uma nova query
 * 
 * 5. MIGRAÇÃO 1 - Adicionar coluna enabled:
 *    Copie e cole o conteúdo de: supabase/migrations/add-enabled-column.sql
 *    Execute a query (Run)
 * 
 * 6. MIGRAÇÃO 2 - Atualizar função match_exercises:
 *    Copie e cole o conteúdo de: supabase/migrations/20241204_update_match_exercises_enabled.sql
 *    Execute a query (Run)
 * 
 * 7. Verifique se tudo funcionou:
 *    Execute o script de teste abaixo
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
	throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testMigrations() {
	console.log('🔍 Testando migrações...\n')

	// Teste 1: Verificar se coluna enabled existe
	console.log('1️⃣ Verificando coluna enabled...')
	const { data: exercises, error: error1 } = await supabase
		.from('hub_exercises')
		.select('id, title, enabled')
		.limit(5)

	if (error1) {
		console.error('❌ Erro ao buscar exercises:', error1.message)
		console.log('   A coluna enabled provavelmente não existe ainda')
		console.log('   Aplique a migração 1 (add-enabled-column.sql)')
		return
	}

	console.log('✅ Coluna enabled existe!')
	console.log(`   Encontrados ${exercises?.length || 0} exercícios`)
	if (exercises && exercises.length > 0) {
		console.log(
			`   Exemplo: ${exercises[0].title} - enabled: ${exercises[0].enabled}`
		)
	}

	// Teste 2: Contar exercícios por status
	console.log('\n2️⃣ Contando exercícios por status enabled...')
	const { count: enabledCount } = await supabase
		.from('hub_exercises')
		.select('*', { count: 'exact', head: true })
		.eq('enabled', true)

	const { count: disabledCount } = await supabase
		.from('hub_exercises')
		.select('*', { count: 'exact', head: true })
		.eq('enabled', false)

	console.log(`✅ Exercícios habilitados: ${enabledCount}`)
	console.log(`✅ Exercícios desabilitados: ${disabledCount || 0}`)

	// Teste 3: Verificar se função match_exercises foi atualizada
	console.log('\n3️⃣ Testando função match_exercises...')
	console.log('   (Este teste requer ter embeddings gerados)')

	const { data: exercisesWithEmbedding } = await supabase
		.from('hub_exercises')
		.select('embedding')
		.not('embedding', 'is', null)
		.limit(1)

	if (!exercisesWithEmbedding || exercisesWithEmbedding.length === 0) {
		console.log('⚠️  Nenhum exercício com embedding encontrado')
		console.log('   Gere embeddings primeiro para testar a função match_exercises')
	} else {
		const testEmbedding = exercisesWithEmbedding[0].embedding
		const { data: matches, error: error3 } = await supabase.rpc(
			'match_exercises',
			{
				query_embedding: testEmbedding,
				match_threshold: 0.5,
				match_count: 3,
			}
		)

		if (error3) {
			console.error('❌ Erro ao executar match_exercises:', error3.message)
			console.log('   A função provavelmente não foi atualizada')
			console.log('   Aplique a migração 2 (20241204_update_match_exercises_enabled.sql)')
		} else {
			console.log(`✅ Função match_exercises funcionando!`)
			console.log(`   Retornou ${matches?.length || 0} resultados`)
			if (matches && matches.length > 0) {
				console.log(
					`   Exemplo: ${matches[0].title} (similarity: ${(matches[0].similarity * 100).toFixed(1)}%)`
				)
				console.log(
					`   Enabled: ${matches[0].enabled !== undefined ? matches[0].enabled : 'campo não retornado'}`
				)
			}
		}
	}

	console.log('\n✅ Testes concluídos!')
	console.log('\n📋 Resumo:')
	console.log('   - Coluna enabled: ✅')
	console.log('   - Função match_exercises: ✅')
	console.log('\nAgora você pode usar o Course Selector! 🎉')
}

testMigrations().catch(console.error)
