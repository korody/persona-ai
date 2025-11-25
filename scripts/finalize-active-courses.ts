/**
 * Script para finalizar categorização e semantização de exercícios de cursos ativos
 * Processa apenas exercícios de cursos com is_published = true em hub_courses
 */

import { createClient } from '@supabase/supabase-js'
import { generateExerciseEmbedding } from '../lib/ai/embeddings'
import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function finalizeActiveCourses() {
	console.log('\n🎯 FINALIZANDO CATEGORIZAÇÃO E SEMANTIZAÇÃO DE CURSOS ATIVOS\n')
	console.log('='.repeat(70))

	try {
		// 1. Buscar cursos ativos
		console.log('\n📚 Buscando cursos ativos...')
		const { data: activeCourses, error: coursesError } = await supabase
			.from('hub_courses')
			.select('memberkit_course_id, course_name')
			.eq('is_published', true)

		if (coursesError) throw coursesError

		const activeCourseIds = activeCourses.map(c => c.memberkit_course_id)
		console.log(`✅ ${activeCourses.length} cursos ativos encontrados`)
		activeCourses.forEach(c => console.log(`   - ${c.course_name}`))

		// 2. Buscar exercícios dos cursos ativos
		console.log('\n📝 Buscando exercícios dos cursos ativos...')
		const { data: exercises, error: exercisesError } = await supabase
			.from('hub_exercises')
			.select('*')
			.in('memberkit_course_id', activeCourseIds)
			.order('memberkit_course_id, position')

		if (exercisesError) throw exercisesError

		console.log(`✅ ${exercises.length} exercícios encontrados\n`)

		// 3. Processar categorização
		console.log('\n📋 INICIANDO CATEGORIZAÇÃO...\n')
		let categorized = 0
		let alreadyCategorized = 0
		let categorizationErrors = 0

		for (let i = 0; i < exercises.length; i++) {
			const exercise = exercises[i]
			const progress = `[${i + 1}/${exercises.length}]`

			// Pular se já tem metadata
			if (exercise.duration_minutes !== null) {
				console.log(`${progress} ⏭️  ${exercise.title.substring(0, 60)}... (já categorizado)`)
				alreadyCategorized++
				continue
			}

			try {
				console.log(`${progress} 🔄 Categorizando: ${exercise.title.substring(0, 60)}...`)

				const prompt = `Analise este exercício de Qi Gong e retorne APENAS um JSON válido com os metadados:

Título: ${exercise.title}
Descrição: ${exercise.description || 'N/A'}

Retorne no formato:
{
  "element": "madeira|fogo|terra|metal|agua",
  "organs": ["fígado", "vesícula biliar"],
  "duration_minutes": 10,
  "level": "iniciante|intermediário|avançado",
  "tags": ["flexibilidade", "energia"],
  "benefits": ["melhora circulação", "reduz estresse"],
  "indications": ["dor nas costas", "ansiedade"],
  "contraindications": ["gravidez", "lesões graves"]
}`

				const { text } = await generateText({
					model: anthropic('claude-3-5-sonnet-20241022'),
					prompt
				})

				const metadata = JSON.parse(text)

				// Atualizar no banco
				const { error: updateError } = await supabase
					.from('hub_exercises')
					.update({
						element: metadata.element,
						organs: metadata.organs,
						duration_minutes: metadata.duration_minutes,
						level: metadata.level,
						tags: metadata.tags,
						benefits: metadata.benefits,
						indications: metadata.indications,
						contraindications: metadata.contraindications
					})
					.eq('id', exercise.id)

				if (updateError) throw updateError

				console.log(`${progress} ✅ Categorizado com sucesso`)
				categorized++

				// Rate limiting
				await new Promise(resolve => setTimeout(resolve, 500))

			} catch (error) {
				console.error(`${progress} ❌ Erro: ${exercise.title}`, error)
				categorizationErrors++
			}
		}

		// 4. Processar semantização (embeddings)
		console.log('\n\n🧠 INICIANDO SEMANTIZAÇÃO...\n')
		let semantized = 0
		let alreadySemanticized = 0
		let semantizationErrors = 0

		// Recarregar exercícios com metadata atualizada
		const { data: exercisesForEmbedding } = await supabase
			.from('hub_exercises')
			.select('*')
			.in('memberkit_course_id', activeCourseIds)
			.not('element', 'is', null) // Só processar categorizados
			.order('memberkit_course_id, position')

		for (let i = 0; i < exercisesForEmbedding!.length; i++) {
			const exercise = exercisesForEmbedding![i]
			const progress = `[${i + 1}/${exercisesForEmbedding!.length}]`

			// Pular se já tem embedding
			if (exercise.embedding && exercise.embedding.length > 0) {
				console.log(`${progress} ⏭️  ${exercise.title.substring(0, 60)}... (já semantizado)`)
				alreadySemanticized++
				continue
			}

			try {
				console.log(`${progress} 🔄 Semantizando: ${exercise.title.substring(0, 60)}...`)

				const embedding = await generateExerciseEmbedding({
					title: exercise.title,
					description: exercise.description,
					benefits: exercise.benefits,
					indications: exercise.indications,
					organs: exercise.organs,
				})

				const { error: updateError } = await supabase
					.from('hub_exercises')
					.update({ embedding })
					.eq('id', exercise.id)

				if (updateError) throw updateError

				console.log(`${progress} ✅ Embedding gerado e salvo`)
				semantized++

				// Rate limiting
				await new Promise(resolve => setTimeout(resolve, 100))

			} catch (error) {
				console.error(`${progress} ❌ Erro: ${exercise.title}`, error)
				semantizationErrors++
			}
		}

		// 5. Resumo final
		console.log('\n' + '='.repeat(70))
		console.log('\n📊 RESUMO FINAL:\n')
		console.log('📋 CATEGORIZAÇÃO:')
		console.log(`   ✅ Categorizados: ${categorized}`)
		console.log(`   ⏭️  Já categorizados: ${alreadyCategorized}`)
		console.log(`   ❌ Erros: ${categorizationErrors}`)
		console.log(`   📦 Total processado: ${exercises.length}\n`)

		console.log('🧠 SEMANTIZAÇÃO:')
		console.log(`   ✅ Semantizados: ${semantized}`)
		console.log(`   ⏭️  Já semantizados: ${alreadySemanticized}`)
		console.log(`   ❌ Erros: ${semantizationErrors}`)
		console.log(`   📦 Total processado: ${exercisesForEmbedding?.length || 0}\n`)

		console.log('🎉 Processamento concluído!\n')

	} catch (error) {
		console.error('\n❌ Erro fatal:', error)
		process.exit(1)
	}
}

finalizeActiveCourses()
