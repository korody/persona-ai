/**
 * Script para completar categorização e semantização dos exercícios pendentes
 * Processa APENAS exercícios de cursos ativos que ainda não foram categorizados/semantizados
 */

import { createClient } from '@supabase/supabase-js'
import { generateExerciseEmbedding } from '../lib/ai/embeddings'
import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function completePendingExercises() {
	console.log('\n🎯 COMPLETANDO CATEGORIZAÇÃO E SEMANTIZAÇÃO\n')
	console.log('='.repeat(70))

	try {
		// 1. Buscar IDs dos cursos ativos
		const { data: activeCourses } = await supabase
			.from('hub_courses')
			.select('memberkit_course_id, course_name')
			.eq('is_published', true)

		const activeCourseIds = activeCourses!.map(c => c.memberkit_course_id)
		console.log(`\n✅ ${activeCourses!.length} cursos ativos`)

		// 2. CATEGORIZAÇÃO - Buscar exercícios SEM metadata dos cursos ativos
		console.log('\n📋 INICIANDO CATEGORIZAÇÃO...\n')
		const { data: uncategorized } = await supabase
			.from('hub_exercises')
			.select('*')
			.in('memberkit_course_id', activeCourseIds)
			.is('duration_minutes', null)
			.order('memberkit_course_id, position')

		console.log(`📝 ${uncategorized!.length} exercícios para categorizar\n`)

		let categorized = 0
		let categorizationErrors = 0

		for (let i = 0; i < uncategorized!.length; i++) {
			const exercise = uncategorized![i]
			const progress = `[${i + 1}/${uncategorized!.length}]`

			try {
				console.log(`${progress} 🔄 ${exercise.title.substring(0, 60)}...`)

				const { text } = await generateText({
					model: anthropic('claude-sonnet-4-20250514'),
					prompt: `Analise este exercício de Qi Gong e retorne APENAS JSON:

Título: ${exercise.title}
Descrição: ${exercise.description || 'N/A'}

Formato:
{
  "element": "madeira|fogo|terra|metal|agua",
  "organs": ["fígado", "vesícula biliar"],
  "duration_minutes": 10,
  "level": "iniciante|intermediário|avançado",
  "tags": ["flexibilidade", "energia"],
  "benefits": ["melhora circulação"],
  "indications": ["dor nas costas"],
  "contraindications": ["gravidez"]
}`
				})

				// Extrair JSON do markdown se necessário
				let jsonText = text.trim()
				if (jsonText.startsWith('```')) {
					jsonText = jsonText.replace(/^```json?\n/, '').replace(/\n```$/, '')
				}

				const metadata = JSON.parse(jsonText)

				await supabase
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

				console.log(`${progress} ✅ Categorizado`)
				categorized++

				await new Promise(resolve => setTimeout(resolve, 500))

			} catch (error) {
				console.error(`${progress} ❌ Erro:`, error)
				categorizationErrors++
			}
		}

		// 3. SEMANTIZAÇÃO - Buscar exercícios SEM embeddings dos cursos ativos
		console.log('\n\n🧠 INICIANDO SEMANTIZAÇÃO...\n')
		const { data: unsemanticized } = await supabase
			.from('hub_exercises')
			.select('*')
			.in('memberkit_course_id', activeCourseIds)
			.not('element', 'is', null)
			.is('embedding', null)
			.order('memberkit_course_id, position')

		console.log(`🔍 ${unsemanticized!.length} exercícios para semantizar\n`)

		let semantized = 0
		let semantizationErrors = 0

		for (let i = 0; i < unsemanticized!.length; i++) {
			const exercise = unsemanticized![i]
			const progress = `[${i + 1}/${unsemanticized!.length}]`

			try {
				console.log(`${progress} 🔄 ${exercise.title.substring(0, 60)}...`)

				const embedding = await generateExerciseEmbedding({
					title: exercise.title,
					description: exercise.description,
					benefits: exercise.benefits,
					indications: exercise.indications,
					organs: exercise.organs,
				})

				await supabase
					.from('hub_exercises')
					.update({ embedding })
					.eq('id', exercise.id)

				console.log(`${progress} ✅ Semantizado`)
				semantized++

				await new Promise(resolve => setTimeout(resolve, 100))

			} catch (error) {
				console.error(`${progress} ❌ Erro:`, error)
				semantizationErrors++
			}
		}

		// 4. Resumo
		console.log('\n' + '='.repeat(70))
		console.log('\n📊 RESUMO:\n')
		console.log('📋 CATEGORIZAÇÃO:')
		console.log(`   ✅ Categorizados: ${categorized}`)
		console.log(`   ❌ Erros: ${categorizationErrors}`)
		console.log(`   📦 Total: ${uncategorized!.length}\n`)

		console.log('🧠 SEMANTIZAÇÃO:')
		console.log(`   ✅ Semantizados: ${semantized}`)
		console.log(`   ❌ Erros: ${semantizationErrors}`)
		console.log(`   📦 Total: ${unsemanticized!.length}\n`)

		console.log('🎉 Processamento concluído!\n')

	} catch (error) {
		console.error('\n❌ Erro fatal:', error)
		process.exit(1)
	}
}

completePendingExercises()
