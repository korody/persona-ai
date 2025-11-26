// app/api/chat/route.ts

import { anthropic } from '@ai-sdk/anthropic'
import { streamText, convertToCoreMessages } from 'ai'
import { createAdminClient } from '@/lib/supabase/server'
import { 
  searchKnowledge, 
  searchKnowledgeWithAnamnese,
  searchKnowledgeGeneric,
  formatKnowledgeContext,
  formatKnowledgeContextWithAnamnese,
  searchExamples,
  formatExamples
} from '@/lib/rag'
import { buildAnamneseContext, buildNoAnamneseContext } from '@/lib/helpers/anamnese-helpers'
import { 
  searchExercisesByAnamnese, 
  searchExercisesBySymptoms,
  extractSymptomsFromMessage,
  formatExercisesContext,
  isGenericExerciseRequest,
  searchIntroductoryExercises,
  searchExercisesBySemantic
} from '@/lib/helpers/exercise-recommendations'
import { generateSmartTitle } from '@/lib/helpers/conversation-title'
import type { QuizLead } from '@/lib/types/anamnese'
import type { Exercise } from '@/lib/memberkit/types'

export const runtime = 'nodejs'
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
    let hasQuiz = false
    let quizLead: QuizLead | null = null
    
    // 🎯 BUSCA HÍBRIDA: user_id (prioridade 1) → telefone → email
    
    // Prioridade 1: Buscar por user_id (vinculação já estabelecida)
    let { data: quizData } = await supabase
      .from('quiz_leads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Prioridade 2: Se não encontrou, buscar por telefone e vincular
    if (!quizData && user.phone) {
      const { data: quizByPhone } = await supabase
        .from('quiz_leads')
        .select('*')
        .eq('telefone', user.phone)
        .is('user_id', null) // Apenas quiz ainda não vinculado
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (quizByPhone) {
        // Vincular permanentemente
        await supabase
          .from('quiz_leads')
          .update({ user_id: userId })
          .eq('id', quizByPhone.id)
        
        quizData = quizByPhone
        console.log(`✅ Quiz vinculado por telefone: ${quizByPhone.id}`)
      }
    }

    // Prioridade 3: Se ainda não encontrou, buscar por email e vincular
    if (!quizData && user.email) {
      const { data: quizByEmail } = await supabase
        .from('quiz_leads')
        .select('*')
        .eq('email', user.email)
        .is('user_id', null) // Apenas quiz ainda não vinculado
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (quizByEmail) {
        // Vincular permanentemente
        await supabase
          .from('quiz_leads')
          .update({ user_id: userId })
          .eq('id', quizByEmail.id)
        
        quizData = quizByEmail
        console.log(`✅ Quiz vinculado por email: ${quizByEmail.id}`)
      }
    }

    if (quizData) {
      hasQuiz = true
      quizLead = quizData as QuizLead
      quizContext = buildAnamneseContext(quizLead)
    } else {
      quizContext = buildNoAnamneseContext()
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
      // Gerar título inteligente baseado na primeira mensagem
      const userMessage = messages[messages.length - 1]
      const userContent = userMessage.content || 
                          (userMessage.parts ? userMessage.parts.map((p: any) => p.text).join('') : '')
      const smartTitle = generateSmartTitle(userContent)
      
      // Criar nova conversa
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          avatar_id: avatar.id,
          title: smartTitle,
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

    // 7. BUSCAR CONHECIMENTO RELEVANTE (RAG) + EXEMPLOS (FEW-SHOT)
    console.log('🔍 Searching knowledge base and examples...')
    
    // Buscar conhecimento usando anamnese quando disponível
    let knowledgeContext = ''
    
    if (hasQuiz && quizLead) {
      // BUSCA FILTRADA POR ELEMENTO + INTENSIDADE
      console.log(`🎯 Anamnese-aware search for elemento: ${quizLead.elemento_principal} (intensidade: ${quizLead.intensidade_calculada})`)
      
      const relevantKnowledge = await searchKnowledgeWithAnamnese(
        userContent, 
        avatar.id, 
        quizLead,
        {
          matchThreshold: 0.6,
          matchCount: 5
        }
      )
      
      knowledgeContext = formatKnowledgeContextWithAnamnese(relevantKnowledge)
      
      console.log(`✅ Found ${relevantKnowledge.length} knowledge items with anamnese filtering`)
      console.log(`   Primary elemento matches: ${relevantKnowledge.filter(k => k.is_primary).length}`)
      console.log(`   Secondary elemento matches: ${relevantKnowledge.filter(k => k.is_secondary).length}`)
      console.log(`   Similarities: ${relevantKnowledge.map(k => `${(k.similarity * 100).toFixed(1)}%`).join(', ')}`)
    } else {
      // BUSCA GENÉRICA (sem filtros)
      console.log('🔍 Generic search (no anamnese data)')
      
      const relevantKnowledge = await searchKnowledgeGeneric(
        userContent,
        avatar.id,
        {
          matchThreshold: 0.6,
          matchCount: 5
        }
      )
      
      knowledgeContext = formatKnowledgeContext(relevantKnowledge)
      
      console.log(`✅ Found ${relevantKnowledge.length} knowledge items (generic search)`)
      console.log(`   Similarities: ${relevantKnowledge.map(k => `${(k.similarity * 100).toFixed(1)}%`).join(', ')}`)
    }
    
    // Buscar exemplos de conversas similares (não filtrado por elemento)
    const relevantExamples = await searchExamples(userContent, avatar.id, 3)
    const examplesContext = formatExamples(relevantExamples)
    
    console.log(`✅ Found ${relevantExamples.length} conversation examples`)

    // 8. BUSCAR EXERCÍCIOS RELEVANTES
    console.log('🧘 Searching for relevant exercises...')
    
    let exercises: Exercise[] = []
    
    // Primeiro, tentar buscar por sintomas mencionados na mensagem
    const symptoms = extractSymptomsFromMessage(userContent)
    if (symptoms.length > 0) {
      console.log(`🎯 Found symptoms in message: ${symptoms.join(', ')}`)
      exercises = await searchExercisesBySymptoms(symptoms, { matchCount: 3 })
    }
    
    // Se não encontrou por sintomas, verificar se é pedido genérico de exercícios
    if (exercises.length === 0 && isGenericExerciseRequest(userContent)) {
      console.log('📚 Generic exercise request detected, showing introductory exercises')
      exercises = await searchIntroductoryExercises({ matchCount: 3 })
    }
    
    // Se ainda não encontrou, tentar busca semântica (OpenAI embeddings)
    if (exercises.length === 0) {
      console.log('🧠 Trying semantic search with OpenAI embeddings...')
      try {
        exercises = await searchExercisesBySemantic(userContent, { 
          matchCount: 3,
          matchThreshold: 0.5  // Threshold reduzido para aceitar mais resultados
        })
        if (exercises.length > 0) {
          console.log(`✅ Semantic search found ${exercises.length} relevant exercises`)
        }
      } catch (error) {
        console.error('❌ Semantic search failed:', error)
      }
    }
    
    // Se ainda não encontrou e tem anamnese, buscar por elemento
    if (exercises.length === 0 && hasQuiz && quizLead) {
      console.log(`🌳 Searching exercises by element: ${quizLead.elemento_principal}`)
      exercises = await searchExercisesByAnamnese(quizLead, { matchCount: 3 })
    }
    
    const exercisesContext = await formatExercisesContext(exercises, quizLead || undefined, avatarSlug)
    
    if (exercises.length > 0) {
      console.log(`✅ Found ${exercises.length} relevant exercises to recommend`)
    } else {
      console.log('ℹ️  No exercises found for this context')
    }

    // 9. CHAMAR CLAUDE API COM STREAMING
    console.log('🤖 Calling Claude API with enhanced context...')
    
    // Montar prompt do sistema com TUDO
    const systemPrompt = `${avatar.system_prompt}${quizContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 BASE DE CONHECIMENTO DISPONÍVEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${knowledgeContext}

${exercisesContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 EXEMPLOS DE COMO RESPONDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${examplesContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSTRUÇÕES IMPORTANTES:
1. Use o conhecimento acima quando relevante para a pergunta
2. Cite as fontes numeradas quando usar informações específicas
3. Mantenha o tom e estilo dos exemplos de conversa
4. Se houver exercícios recomendados, mencione-os naturalmente na resposta
5. Sempre inclua os links dos exercícios quando mencioná-los
6. Se não houver conhecimento relevante, use seu conhecimento geral mas mencione isso
7. Seja sempre empático, educativo e prático
`

    // Converter mensagens do formato UI para formato do modelo
    const coreMessages = convertToCoreMessages(messages)

    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: systemPrompt,
      messages: coreMessages,
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
