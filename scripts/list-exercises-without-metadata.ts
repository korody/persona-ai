import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function listExercisesWithoutMetadata() {
	try {
		const { data: exercisesWithoutMetadata, error } = await supabase
			.from('exercises')
			.select('memberkit_lesson_id, title, url, memberkit_course_id')
			.is('element', null)
			.order('memberkit_lesson_id')
			.limit(50)

		if (error) throw error

		console.log(
			JSON.stringify(
				exercisesWithoutMetadata.map((e) => ({
					lesson_id: e.memberkit_lesson_id,
					title: e.title,
					url: e.url,
				})),
				null,
				2
			)
		)

		console.log(`\n\nTotal sem metadata: ${exercisesWithoutMetadata.length}`)
	} catch (error) {
		console.error('Erro ao buscar exercícios:', error)
	} finally {
		process.exit(0)
	}
}

listExercisesWithoutMetadata()
