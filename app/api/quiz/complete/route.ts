// app/api/quiz/complete/route.ts
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Permitir CORS para requisições do quiz externo
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

// Handler GET para verificação (retorna 200 mas indica que deve usar POST)
export async function GET(request: Request) {
  return NextResponse.json(
    { 
      error: 'Use POST method',
      message: 'This endpoint accepts POST requests only',
      expectedPayload: {
        email: 'string',
        fullName: 'string', 
        phone: 'string',
        quizData: 'object (optional)'
      }
    },
    { 
      status: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    }
  )
}

export async function POST(request: Request) {
  console.log('[quiz/complete] ====== REQUISIÇÃO RECEBIDA ======')
  console.log('[quiz/complete] Método:', request.method)
  console.log('[quiz/complete] URL:', request.url)
  console.log('[quiz/complete] Headers:', Object.fromEntries(request.headers.entries()))
  
  try {
    const data = await request.json()
    const { email, fullName, phone, quizData } = data

    console.log('[quiz/complete] ====== INÍCIO ======')
    console.log('[quiz/complete] Dados recebidos:', { 
      email, 
      fullName, 
      phone: phone?.substring(0, 5) + '...',
      hasQuizData: !!quizData 
    })

    // Validações
    if (!email || !fullName || !phone) {
      console.error('[quiz/complete] Validação falhou:', { email: !!email, fullName: !!fullName, phone: !!phone })
      return NextResponse.json(
        { error: 'Email, nome e telefone são obrigatórios' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      )
    }

    const adminSupabase = await createAdminClient()

    // 1. Verificar se usuário já existe
    console.log('[quiz/complete] Verificando se usuário existe...')
    const { data: existingUsers } = await adminSupabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(
      u => u.email?.toLowerCase() === email.toLowerCase()
    )

    let userId: string

    if (existingUser) {
      // Usuário já existe - apenas atualizar dados
      console.log('[quiz/complete] Usuário já existe:', existingUser.id)
      userId = existingUser.id

      // Atualizar metadata se necessário
      await adminSupabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          full_name: fullName,
          phone: phone,
        },
      })
    } else {
      // Criar novo usuário
      console.log('[quiz/complete] Criando novo usuário...')
      const { data: newUser, error: signupError } = await adminSupabase.auth.admin.createUser({
        email,
        email_confirm: true, // Auto-confirmar email
        user_metadata: {
          full_name: fullName,
          phone: phone,
        },
      })

      if (signupError || !newUser.user) {
        console.error('[quiz/complete] Erro ao criar usuário:', signupError)
        return NextResponse.json(
          { error: 'Erro ao criar usuário' },
          { 
            status: 500,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            }
          }
        )
      }

      userId = newUser.user.id
      console.log('[quiz/complete] Usuário criado:', userId)
    }

    // 2. Salvar dados do quiz (se fornecidos)
    if (quizData) {
      console.log('[quiz/complete] Salvando dados do quiz...')
      
      // Verificar se já existe registro
      const { data: existingQuiz } = await adminSupabase
        .from('quiz_leads')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (existingQuiz) {
        // Atualizar
        await adminSupabase
          .from('quiz_leads')
          .update({
            nome: fullName,
            whatsapp: phone,
            ...quizData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingQuiz.id)
      } else {
        // Inserir novo
        await adminSupabase
          .from('quiz_leads')
          .insert({
            email,
            nome: fullName,
            whatsapp: phone,
            ...quizData,
          })
      }
    }

    // 3. Criar sessão via magic link
    console.log('[quiz/complete] Gerando magic link...')
    const { data: magicLinkData, error: magicLinkError } = await adminSupabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://digital.mestreye.com'}/chat`,
      },
    })

    if (magicLinkError || !magicLinkData) {
      console.error('[quiz/complete] Erro ao gerar magic link:', magicLinkError)
      return NextResponse.json(
        { error: 'Erro ao criar sessão' },
        { 
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      )
    }

    console.log('[quiz/complete] Magic link gerado com sucesso')

    // 4. Extrair tokens do magic link
    const url = new URL(magicLinkData.properties.action_link)
    const token = url.searchParams.get('token')
    const tokenHash = url.searchParams.get('token_hash')

    if (!token || !tokenHash) {
      console.error('[quiz/complete] Token não encontrado no magic link')
      return NextResponse.json(
        { error: 'Erro ao processar autenticação' },
        { 
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      )
    }

    // 5. Verificar token e criar sessão
    console.log('[quiz/complete] Verificando OTP...')
    const supabase = await createClient()
    const { data: sessionData, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'magiclink',
    })

    if (verifyError || !sessionData.session) {
      console.error('[quiz/complete] Erro ao verificar OTP:', verifyError)
      return NextResponse.json(
        { error: 'Erro ao criar sessão' },
        { 
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      )
    }

    console.log('[quiz/complete] Sessão criada com sucesso!')

    // Retornar sucesso com URL de redirect
    const response = {
      success: true,
      userId,
      redirectUrl: '/chat',
      message: 'Autenticação concluída com sucesso!',
    }

    console.log('[quiz/complete] ====== SUCESSO ======')
    console.log('[quiz/complete] Resposta:', response)

    return NextResponse.json(response, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })

  } catch (error) {
    console.error('[quiz/complete] ====== ERRO ======')
    console.error('[quiz/complete] Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    )
  }
}
