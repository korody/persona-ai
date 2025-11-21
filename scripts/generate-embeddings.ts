/**
 * Script para gerar embeddings dos exercícios
 * Processa exercícios com metadata e gera embeddings para busca semântica
 */

import { createClient } from '@supabase/supabase-js'
import { generateExerciseEmbedding } from '../lib/ai/embeddings'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function generateEmbeddings() {
	console.log('\n🧠 GERANDO EMBEDDINGS PARA BUSCA SEMÂNTICA\n')
	console.log('='.repeat(70))

	try {
		// 1. Buscar exercícios com metadata (element não null)
		console.log('\n📚 Buscando exercícios curados...')
		const { data: exercises, error } = await supabase
			.from('exercises')
			.select('*')
			.not('element', 'is', null)
			.order('memberkit_lesson_id')

		if (error) throw error

		console.log(`✅ ${exercises.length} exercícios encontrados\n`)

		// 2. Gerar embeddings
		let success = 0
		let skipped = 0
		let errors = 0

		for (let i = 0; i < exercises.length; i++) {
			const exercise = exercises[i]
			const progress = `[${i + 1}/${exercises.length}]`

			try {
				// Verificar se já tem embedding
				if (exercise.embedding && exercise.embedding.length > 0) {
					console.log(`${progress} ⏭️  Pulando: ${exercise.title.substring(0, 50)}... (já tem embedding)`)
					skipped++
					continue
				}

				console.log(`${progress} 🔄 Processando: ${exercise.title.substring(0, 50)}...`)

				// Gerar embedding
				const embedding = await generateExerciseEmbedding({
					title: exercise.title,
					description: exercise.description,
					benefits: exercise.benefits,
					indications: exercise.indications,
					organs: exercise.organs,
				})

				// Salvar no banco
				const { error: updateError } = await supabase
					.from('exercises')
					.update({ embedding })
					.eq('id', exercise.id)

				if (updateError) throw updateError

				console.log(`${progress} ✅ Embedding gerado e salvo`)
				success++

				// Rate limiting - pequena pausa entre requisições
				if (i < exercises.length - 1) {
					await new Promise((resolve) => setTimeout(resolve, 100))
				}
			} catch (error) {
				console.error(`${progress} ❌ Erro: ${exercise.title}`, error)
				errors++
			}
		}

		// 3. Resumo
		console.log('\n' + '='.repeat(70))
		console.log('\n📊 RESUMO:\n')
		console.log(`   ✅ Sucesso: ${success}`)
		console.log(`   ⏭️  Pulados: ${skipped}`)
		console.log(`   ❌ Erros: ${errors}`)
		console.log(`   📦 Total: ${exercises.length}\n`)

		if (success > 0) {
			console.log('🎉 Embeddings gerados com sucesso!')
			console.log('🔍 Busca semântica agora disponível\n')
		}
	} catch (error) {
		console.error('\n❌ Erro fatal:', error)
		process.exit(1)
	}
}

generateEmbeddings()
