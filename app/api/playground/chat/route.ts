/**
 * API Route: Playground Chat (sem debitar créditos)
 * POST /api/playground/chat
 * 
 * ESPELHO DO CHAT NORMAL - para testes sem consumir créditos
 */

import { anthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import { createAdminClient } from '@/lib/supabase/server'
import { 
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
import type { QuizLead } from '@/lib/types/anamnese'
import type { Exercise } from '@/lib/memberkit/types'

export const runtime = 'edge'
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages, avatarSlug = 'mestre-ye' } = body

    console.log('📥 Playground API received:', {
      messagesLength: messages?.length || 0,
      avatarSlug
    })

    // Validar mensagens
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

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

    // Buscar avatar
    const { data: avatar, error: avatarError } = await supabase
      .from('avatars')
      .select('*')
      .eq('slug', avatarSlug)
      .single()

    if (avatarError || !avatar) {
      return new Response('Avatar not found', { status: 404 })
    }

    // BUSCAR DADOS DO QUIZ PARA PERSONALIZAÇÃO (igual ao chat normal)
    let quizContext = ''
    let hasQuiz = false
    let quizLead: QuizLead | null = null
    
    const { data: quizData } = await supabase
      .from('quiz_leads')
      .select('*')
      .eq('email', user.email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (quizData) {
      hasQuiz = true
      quizLead = quizData as QuizLead
      quizContext = buildAnamneseContext(quizLead)
      console.log(`🎯 Anamnese: ${quizLead.elemento_principal}`)
    } else {
      quizContext = buildNoAnamneseContext()
      console.log('ℹ️  No anamnese')
    }

    // Pegar última mensagem do usuário
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop()
    const userQuery = lastUserMessage?.content || ''

    // BUSCAR CONHECIMENTO RELEVANTE (igual ao chat normal)
    console.log('🔍 Searching knowledge...')
    
    let knowledgeContext = ''
    
    if (hasQuiz && quizLead) {
      const relevantKnowledge = await searchKnowledgeWithAnamnese(
        userQuery, avatar.id, quizLead,
        { matchThreshold: 0.4, matchCount: 5 }
      )
      knowledgeContext = formatKnowledgeContextWithAnamnese(relevantKnowledge)
      console.log(`✅ ${relevantKnowledge.length} knowledge items (with anamnese)`)
    } else {
      const relevantKnowledge = await searchKnowledgeGeneric(
        userQuery, avatar.id,
        { matchThreshold: 0.4, matchCount: 5 }
      )
      knowledgeContext = formatKnowledgeContext(relevantKnowledge)
      console.log(`✅ ${relevantKnowledge.length} knowledge items (generic)`)
    }
    
    // Buscar exemplos
    const relevantExamples = await searchExamples(userQuery, avatar.id, 3)
    const examplesContext = formatExamples(relevantExamples)
    console.log(`✅ ${relevantExamples.length} examples`)

    // BUSCAR EXERCÍCIOS (igual ao chat normal)
    console.log('🧘 Searching exercises...')
    
    let exercises: Exercise[] = []
    
    const symptoms = extractSymptomsFromMessage(userQuery)
    if (symptoms.length > 0) {
      console.log(`🎯 Symptoms: ${symptoms.join(', ')}`)
      exercises = await searchExercisesBySymptoms(symptoms, { matchCount: 3 })
    }
    
    if (exercises.length === 0 && isGenericExerciseRequest(userQuery)) {
      console.log('📚 Generic request')
      exercises = await searchIntroductoryExercises({ matchCount: 3 })
    }
    
    if (exercises.length === 0) {
      console.log('🧠 Semantic search...')
      try {
        exercises = await searchExercisesBySemantic(userQuery, { 
          matchCount: 3,
          matchThreshold: 0.5
        })
        if (exercises.length > 0) {
          console.log(`✅ Found ${exercises.length} exercises`)
        }
      } catch (error) {
        console.error('Semantic search failed:', error)
      }
    }
    
    if (exercises.length === 0 && hasQuiz && quizLead) {
      console.log(`🌳 By element: ${quizLead.elemento_principal}`)
      exercises = await searchExercisesByAnamnese(quizLead, { matchCount: 3 })
    }
    
    const exercisesContext = formatExercisesContext(exercises, quizLead || undefined)
    console.log(`✅ ${exercises.length} exercises`)

    // MONTAR PROMPT DO SISTEMA (igual ao chat normal)
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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`

    // Formatar mensagens
    const formattedMessages = messages.map((m: any) => ({
      role: m.role,
      content: String(m.content || '')
    }))

    // Stream
    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: systemPrompt,
      messages: formattedMessages as any,
      temperature: 0.7,
    })

    return result.toTextStreamResponse()

  } catch (error) {
    console.error('Playground error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
