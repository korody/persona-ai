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
    const rawData = await request.json()
    console.log('[quiz/complete] Dados brutos recebidos:', JSON.stringify(rawData, null, 2))
    
    // Suportar múltiplos formatos de payload
    // Formato 1: { email, fullName, phone, quizData }
    // Formato 2: { lead: { EMAIL, NOME, CELULAR }, respostas, diagnostico }
    let email: string
    let fullName: string
    let phone: string
    let quizData: any
    
    if (rawData.lead) {
      // Formato do quiz MTC
      email = rawData.lead.EMAIL || rawData.lead.email
      fullName = rawData.lead.NOME || rawData.lead.nome || rawData.lead.fullName
      phone = rawData.lead.CELULAR || rawData.lead.celular || rawData.lead.phone || rawData.lead.telefone
      quizData = {
        elemento_principal: rawData.diagnostico?.elementoPrincipal || rawData.diagnostico?.elemento,
        diagnostico_resumo: rawData.diagnostico?.resumo,
        contagem_elementos: rawData.diagnostico?.contagemElementos,
        intensidade_calculada: rawData.diagnostico?.intensidade,
        respostas: rawData.respostas
      }
    } else {
      // Formato direto
      email = rawData.email
      fullName = rawData.fullName || rawData.nome
      phone = rawData.phone || rawData.telefone || rawData.celular
      quizData = rawData.quizData
    }

    console.log('[quiz/complete] ====== INÍCIO ======')
    console.log('[quiz/complete] Dados processados:', { 
      email, 
      fullName, 
      phone: phone?.substring(0, 5) + '...',
      hasQuizData: !!quizData 
    })

    // Validações
    if (!email || !fullName || !phone) {
      console.error('[quiz/complete] Validação falhou:', { 
        email: { exists: !!email, value: email }, 
        fullName: { exists: !!fullName, value: fullName }, 
        phone: { exists: !!phone, value: phone },
        rawDataKeys: Object.keys(rawData)
      })
      return NextResponse.json(
        { 
          error: 'Email, nome e telefone são obrigatórios',
          received: {
            email: !!email,
            fullName: !!fullName,
            phone: !!phone
          }
        },
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

    if (magicLinkError) {
      console.error('[quiz/complete] Erro ao gerar magic link:', magicLinkError)
      console.error('[quiz/complete] Detalhes do erro:', JSON.stringify(magicLinkError, null, 2))
    }
    
    if (!magicLinkData) {
      console.error('[quiz/complete] magicLinkData está null/undefined')
    } else {
      console.log('[quiz/complete] magicLinkData recebido:', JSON.stringify(magicLinkData, null, 2))
    }

    if (magicLinkError || !magicLinkData) {
      // Mesmo com erro no magic link, retorna sucesso com URL simples
      // O usuário pode fazer login manualmente depois
      console.log('[quiz/complete] Retornando sem magic link - usuário criado com sucesso')
      return NextResponse.json(
        { 
          success: true,
          userId,
          redirectUrl: '/auth',  // URL relativa - o quiz adiciona a base
          message: 'Usuário criado com sucesso. Faça login para continuar.',
          warning: 'Magic link não pôde ser gerado',
          debug: {
            hasMagicLinkError: !!magicLinkError,
            errorMessage: magicLinkError?.message || null,
            hasMagicLinkData: !!magicLinkData
          }
        },
        {
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
    console.log('[quiz/complete] action_link:', magicLinkData.properties.action_link)
    const url = new URL(magicLinkData.properties.action_link)
    const token = url.searchParams.get('token')
    const tokenHash = url.searchParams.get('token_hash')
    
    // Supabase pode retornar 'token' OU 'token_hash' dependendo da versão/config
    const authToken = tokenHash || token

    console.log('[quiz/complete] Token extraído:', token ? 'SIM (hash: ' + token.substring(0, 10) + '...)' : 'NÃO')
    console.log('[quiz/complete] TokenHash extraído:', tokenHash ? 'SIM (hash: ' + tokenHash.substring(0, 10) + '...)' : 'NÃO')
    console.log('[quiz/complete] Auth token final:', authToken ? 'SIM' : 'NÃO')

    if (!authToken) {
      console.error('[quiz/complete] Nenhum token encontrado no magic link')
      console.error('[quiz/complete] URL params:', Array.from(url.searchParams.entries()))
      
      // Retorna sucesso mesmo sem token
      return NextResponse.json(
        { 
          success: true,
          userId,
          redirectUrl: '/auth',  // URL relativa - o quiz adiciona a base
          message: 'Usuário criado com sucesso. Faça login para continuar.',
          warning: 'Token de autenticação não disponível',
          debug: {
            hasToken: !!token,
            hasTokenHash: !!tokenHash,
            actionLink: magicLinkData.properties.action_link
          }
        },
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      )
    }

    // 5. Construir URL de autenticação
    console.log('[quiz/complete] Tokens extraídos com sucesso')
    
    // Usar token_hash se disponível, senão usar token
    const authUrl = tokenHash 
      ? `/auth/callback?token_hash=${tokenHash}&type=magiclink&next=/chat`
      : `/auth/callback?token=${authToken}&type=magiclink&next=/chat`

    console.log('[quiz/complete] URL de autenticação:', authUrl)

    console.log('[quiz/complete] ====== SUCESSO ======')
    
    // Retornar sucesso com URL de redirect
    const response = {
      success: true,
      userId,
      redirectUrl: authUrl,
      message: 'Autenticação preparada com sucesso!',
    }

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
    console.error('[quiz/complete] Tipo do erro:', error?.constructor?.name)
    console.error('[quiz/complete] Mensagem:', error instanceof Error ? error.message : 'Unknown error')
    console.error('[quiz/complete] Stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('[quiz/complete] Erro completo:', error)
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor', 
        details: error instanceof Error ? error.message : 'Unknown error',
        type: error?.constructor?.name || 'UnknownError'
      },
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
