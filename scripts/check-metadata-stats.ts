import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkStats() {
	try {
		const { data: withMetadata } = await supabase
			.from('exercises')
			.select('memberkit_lesson_id, element')
			.not('element', 'is', null)

		const { data: without } = await supabase
			.from('exercises')
			.select('memberkit_lesson_id')
			.is('element', null)

		console.log('✅ Com metadata:', withMetadata?.length || 0)
		console.log('❌ Sem metadata:', without?.length || 0)
		console.log(
			'📊 Total:',
			(withMetadata?.length || 0) + (without?.length || 0)
		)

		console.log('\n📈 Distribuição por elemento:')
		const dist: Record<string, number> = {}
		withMetadata?.forEach((e) => {
			dist[e.element] = (dist[e.element] || 0) + 1
		})

		Object.entries(dist)
			.sort((a, b) => b[1] - a[1])
			.forEach(([el, count]) => console.log(`   ${el}: ${count}`))
	} catch (error) {
		console.error('Erro:', error)
	} finally {
		process.exit(0)
	}
}

checkStats()
