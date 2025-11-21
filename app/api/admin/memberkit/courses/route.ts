import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get all exercises grouped by course
    const { data: exercises } = await supabase
      .from('exercises')
      .select('memberkit_course_slug, duration_minutes, embedding, enabled')

    if (!exercises) {
      return NextResponse.json({ courses: [] })
    }

    // Group by course
    const courseMap = new Map<string, {
      total: number
      categorized: number
      withEmbeddings: number
      enabledCount: number
    }>()

    exercises.forEach(exercise => {
      const slug = exercise.memberkit_course_slug || 'sem-curso'
      if (!courseMap.has(slug)) {
        courseMap.set(slug, {
          total: 0,
          categorized: 0,
          withEmbeddings: 0,
          enabledCount: 0
        })
      }
      const stats = courseMap.get(slug)!
      stats.total++
      if (exercise.duration_minutes !== null) stats.categorized++
      if (exercise.embedding !== null) stats.withEmbeddings++
      if (exercise.enabled !== false) stats.enabledCount++ // Count enabled exercises
    })

    // Convert to array
    const courses = Array.from(courseMap.entries())
      .map(([slug, stats]) => {
        const enabled = stats.enabledCount === stats.total
        
        // Debug log for specific course
        if (slug === 'arte-da-cura-metodo-ye-xin') {
          console.log('🎨 Arte da Cura status:', {
            slug,
            total: stats.total,
            enabledCount: stats.enabledCount,
            enabled,
            allEnabled: stats.enabledCount === stats.total
          })
        }
        
        return {
          slug, // Use the slug as-is from the database
          name: slug
            .split('-')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' '),
          total: stats.total,
          categorized: stats.categorized,
          withEmbeddings: stats.withEmbeddings,
          percentage: stats.total > 0 ? (stats.categorized / stats.total) * 100 : 0,
          enabled
        }
      })
      .sort((a, b) => b.total - a.total)

    return NextResponse.json({ courses })
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}
