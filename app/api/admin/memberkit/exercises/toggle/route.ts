import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { lessonId, enabled } = await request.json()

    if (!lessonId) {
      return NextResponse.json(
        { error: 'lessonId is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Update the specific exercise
    const { error } = await supabase
      .from('exercises')
      .update({ enabled })
      .eq('memberkit_lesson_id', lessonId)

    if (error) {
      console.error('Error toggling exercise:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error toggling exercise:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
