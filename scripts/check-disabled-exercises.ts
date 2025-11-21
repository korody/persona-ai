/**
 * Script para verificar exercícios desabilitados no Supabase
 * Mostra quais cursos e exercícios estão excluídos da indexação para IA
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

async function checkDisabledExercises() {
	console.log('🔍 Verificando exercícios desabilitados...\n')

	// Get all exercises
	const { data: allExercises, error } = await supabase
		.from('exercises')
		.select('memberkit_course_slug, title, enabled, has_embedding:embedding')
		.order('memberkit_course_slug')

	if (error) {
		console.error('❌ Erro ao buscar exercícios:', error)
		return
	}

	if (!allExercises) {
		console.log('⚠️  Nenhum exercício encontrado')
		return
	}

	// Group by course
	const courseStats = new Map<
		string,
		{
			total: number
			disabled: number
			exercises: Array<{ title: string; enabled: boolean }>
		}
	>()

	allExercises.forEach((ex) => {
		const slug = ex.memberkit_course_slug || 'sem-curso'
		if (!courseStats.has(slug)) {
			courseStats.set(slug, {
				total: 0,
				disabled: 0,
				exercises: [],
			})
		}
		const stats = courseStats.get(slug)!
		stats.total++
		if (ex.enabled === false) {
			stats.disabled++
			stats.exercises.push({ title: ex.title, enabled: false })
		}
	})

	// Overall stats
	const totalExercises = allExercises.length
	const disabledExercises = allExercises.filter((ex) => ex.enabled === false).length
	const enabledExercises = totalExercises - disabledExercises

	console.log('📊 ESTATÍSTICAS GERAIS')
	console.log('═══════════════════════════════════════════════════')
	console.log(`Total de exercícios: ${totalExercises}`)
	console.log(`✅ Habilitados (indexados para IA): ${enabledExercises}`)
	console.log(`❌ Desabilitados (excluídos da IA): ${disabledExercises}`)
	console.log(
		`📈 Percentual ativo: ${((enabledExercises / totalExercises) * 100).toFixed(1)}%\n`
	)

	// Courses with disabled exercises
	const coursesWithDisabled = Array.from(courseStats.entries())
		.filter(([_, stats]) => stats.disabled > 0)
		.sort((a, b) => b[1].disabled - a[1].disabled)

	if (coursesWithDisabled.length === 0) {
		console.log('✅ Todos os cursos estão 100% ativos!\n')
		return
	}

	console.log('🚫 CURSOS COM EXERCÍCIOS DESABILITADOS')
	console.log('═══════════════════════════════════════════════════\n')

	coursesWithDisabled.forEach(([slug, stats]) => {
		const courseName = slug
			.split('-')
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(' ')

		console.log(`📚 ${courseName}`)
		console.log(`   Slug: ${slug}`)
		console.log(
			`   Desabilitados: ${stats.disabled}/${stats.total} (${((stats.disabled / stats.total) * 100).toFixed(1)}%)`
		)

		if (stats.disabled === stats.total) {
			console.log(`   🔴 CURSO TOTALMENTE DESABILITADO`)
		}

		if (stats.exercises.length <= 10) {
			console.log(`   Exercícios desabilitados:`)
			stats.exercises.forEach((ex) => {
				console.log(`      - ${ex.title}`)
			})
		} else {
			console.log(`   Exercícios desabilitados (primeiros 10):`)
			stats.exercises.slice(0, 10).forEach((ex) => {
				console.log(`      - ${ex.title}`)
			})
			console.log(`      ... e mais ${stats.exercises.length - 10}`)
		}
		console.log()
	})

	// Fully disabled courses
	const fullyDisabledCourses = Array.from(courseStats.entries()).filter(
		([_, stats]) => stats.disabled === stats.total
	)

	if (fullyDisabledCourses.length > 0) {
		console.log('🔴 CURSOS TOTALMENTE DESABILITADOS')
		console.log('═══════════════════════════════════════════════════')
		fullyDisabledCourses.forEach(([slug, stats]) => {
			const courseName = slug
				.split('-')
				.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
				.join(' ')
			console.log(`   - ${courseName} (${stats.total} exercícios)`)
		})
		console.log()
	}

	// Summary
	console.log('💡 RESUMO')
	console.log('═══════════════════════════════════════════════════')
	console.log(`Cursos com pelo menos 1 exercício desabilitado: ${coursesWithDisabled.length}`)
	console.log(`Cursos totalmente desabilitados: ${fullyDisabledCourses.length}`)
	console.log(`\n✅ Script concluído!`)
}

checkDisabledExercises().catch(console.error)
