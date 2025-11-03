// app/api/chat/route.ts

import { anthropic } from '@ai-sdk/anthropic'
import { streamText, convertToCoreMessages } from 'ai'
import { createAdminClient } from '@/lib/supabase/server'

export const runtime = 'edge'
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { messages, conversationId, avatarSlug = 'mestre-ye' } = await req.json()

    // Pegar token de autorização
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = await createAdminClient()

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const userId = user.id

    // 1. VERIFICAR CRÉDITOS
    const { data: credits, error: creditsError } = await supabase
      .from('credits')
      .select('balance, bonus_balance')
      .eq('user_id', userId)
      .single()

    if (creditsError || !credits) {
      return new Response('Credits not found', { status: 404 })
    }

    const totalCredits = credits.balance + credits.bonus_balance
    if (totalCredits < 1) {
      return new Response(
        JSON.stringify({ 
          error: 'insufficient_credits',
          message: 'Você não tem créditos suficientes. Assine um plano para continuar!'
        }),
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 2. BUSCAR AVATAR
    const { data: avatar, error: avatarError } = await supabase
      .from('avatars')
      .select('*')
      .eq('slug', avatarSlug)
      .eq('is_active', true)
      .single()

    if (avatarError || !avatar) {
      return new Response('Avatar not found', { status: 404 })
    }

    // 3. BUSCAR DADOS DO QUIZ PARA PERSONALIZAÇÃO
    let quizContext = ''
    const { data: quizLead } = await supabase
      .from('quiz_leads')
      .select('elemento_principal, diagnostico_resumo, nome_perfil, arquetipo, nome')
      .eq('email', user.email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (quizLead) {
      quizContext = `

CONTEXTO DO USUÁRIO (do Quiz MTC):
- Nome: ${quizLead.nome}
- Elemento Principal: ${quizLead.elemento_principal}
- Perfil: ${quizLead.nome_perfil} (${quizLead.arquetipo})
- Diagnóstico: ${quizLead.diagnostico_resumo}

Use essas informações naturalmente na conversa, sem perguntar o que já sabe.`
    }

    // 4. DEBITAR CRÉDITO ANTES DE CHAMAR IA
    const { error: debitError } = await supabase.rpc('debit_credits', {
      p_user_id: userId,
      p_amount: 1,
      p_type: 'message_sent',
      p_reference_id: conversationId || null,
      p_description: 'Mensagem enviada ao Mestre Ye'
    })

    if (debitError) {
      console.error('Error debiting credits:', debitError)
      return new Response('Error processing credits', { status: 500 })
    }

    // 5. CRIAR/ATUALIZAR CONVERSA
    let finalConversationId = conversationId

    if (!conversationId) {
      // Criar nova conversa
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          avatar_id: avatar.id,
          title: 'Nova Conversa',
          total_credits_used: 1
        })
        .select()
        .single()

      if (convError) {
        console.error('Error creating conversation:', convError)
        return new Response('Error creating conversation', { status: 500 })
      }

      finalConversationId = newConv.id
    } else {
      // Atualizar conversa existente
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          total_credits_used: supabase.rpc('increment', { x: 1 })
        })
        .eq('id', conversationId)
    }

    // 6. SALVAR MENSAGEM DO USUÁRIO
    const userMessage = messages[messages.length - 1]
    const userContent = userMessage.content || 
                        (userMessage.parts ? userMessage.parts.map((p: any) => p.text).join('') : '')
    
    await supabase.from('messages').insert({
      conversation_id: finalConversationId,
      role: 'user',
      content: userContent,
      credits_used: 1
    })

    // 7. CHAMAR CLAUDE API COM STREAMING
    console.log('Calling Claude API with Anthropic...')
    const systemPrompt = avatar.system_prompt + quizContext

    // Converter mensagens do formato UI para formato do modelo
    const coreMessages = convertToCoreMessages(messages)

    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: systemPrompt,
      messages: coreMessages,
      maxTokens: 1000,
      temperature: 0.7,
      onFinish: async ({ text }) => {
        console.log('Claude response finished, saving to DB...')
        // Salvar resposta do assistente
        await supabase.from('messages').insert({
          conversation_id: finalConversationId,
          role: 'assistant',
          content: text,
          credits_used: 0
        })
      }
    })

    // Retornar stream usando o método correto do AI SDK v5.x
    return result.toTextStreamResponse({
      headers: {
        'X-Conversation-Id': finalConversationId,
        'X-Credits-Remaining': String(totalCredits - 1),
      }
    })

  } catch (error) {
    console.error('Chat API Error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}