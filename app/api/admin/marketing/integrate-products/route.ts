/**
 * API Route: Integrar produtos com cursos
 * POST /api/admin/marketing/integrate-products
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { integrateProductsWithCourses } from '@/lib/helpers/integrate-products-courses'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = await createAdminClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await req.json()
    const { avatarSlug, minSimilarity = 0.6 } = body
    
    if (!avatarSlug) {
      return NextResponse.json(
        { error: 'avatarSlug is required' },
        { status: 400 }
      )
    }
    
    console.log(`🔄 Starting product-course integration for ${avatarSlug}...`)
    console.log(`📊 Minimum similarity threshold: ${minSimilarity * 100}%`)
    
    const result = await integrateProductsWithCourses(avatarSlug, minSimilarity)
    
    console.log(`✅ Integration complete:`)
    console.log(`   - Matched: ${result.matched}`)
    console.log(`   - Not matched: ${result.notMatched}`)
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('❌ Integration error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
