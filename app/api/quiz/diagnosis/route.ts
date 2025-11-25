import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Buscar quiz do usuário com diagnóstico completo
    const { data: quizData, error: quizError } = await supabase
      .from('quiz_leads')
      .select('elemento_principal, nome_perfil, diagnostico_completo, diagnostico_resumo')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (quizError || !quizData) {
      return NextResponse.json(
        { error: 'Anamnese não encontrada' },
        { status: 404 }
      )
    }

    // Priorizar diagnostico_completo, depois diagnostico_resumo
    const diagnosis = quizData.diagnostico_completo || quizData.diagnostico_resumo

    if (!diagnosis) {
      return NextResponse.json(
        { error: 'Diagnóstico não disponível' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      diagnosis,
      element: quizData.elemento_principal,
      profile: quizData.nome_perfil
    })
  } catch (error) {
    console.error('Erro ao buscar diagnóstico:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
