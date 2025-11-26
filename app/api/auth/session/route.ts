// app/api/auth/session/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Endpoint para setar a sessão nos cookies do servidor
export async function POST(request: NextRequest) {
  try {
    const { access_token, refresh_token } = await request.json()

    if (!access_token || !refresh_token) {
      return NextResponse.json(
        { error: 'Tokens são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    })

    if (error) {
      console.error('[session] Error setting session:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    console.log('[session] Session set successfully for user:', data.user?.email)

    return NextResponse.json({ 
      success: true,
      user: data.user?.email,
    })

  } catch (error) {
    console.error('[session] API error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
