/**
 * API Debug de Contexto
 * Retorna informações COMPLETAS sobre o que será enviado para a IA
 * Espelho da lógica do chat normal
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  searchKnowledgeWithAnamnese,
  searchKnowledgeGeneric,
  searchExamples
} from '@/lib/rag'
import { 
  searchExercisesBySymptoms,
  extractSymptomsFromMessage,
  isGenericExerciseRequest,
  searchIntroductoryExercises,
  searchExercisesBySemantic,
  searchExercisesByAnamnese
} from '@/lib/helpers/exercise-recommendations'
import type { QuizLead } from '@/lib/types/anamnese'
import type { Exercise } from '@/lib/memberkit/types'

export const runtime = 'edge'
export const maxDuration = 30

interface Message {
  role: string
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, messages = [], avatarSlug } = body

    if (!message || !avatarSlug) {
      return NextResponse.json(
        { error: 'Message and avatarSlug are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Buscar avatar
    const { data: avatar } = await supabase
      .from('avatars')
      .select('id')
      .eq('slug', avatarSlug)
      .single()

    if (!avatar) {
      return NextResponse.json({ error: 'Avatar not found' }, { status: 404 })
    }

    // BUSCAR DADOS DO QUIZ (igual ao chat)
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
    }

    const anamnese = {
      nome: quizLead?.nome || user.user_metadata?.name || 'Usuário Teste',
      elemento: quizLead?.elemento_principal || 'N/A',
      intensidade: quizLead?.intensidade_calculada || 0,
      data: quizLead?.created_at 
        ? new Date(quizLead.created_at).toLocaleDateString('pt-BR')
        : 'N/A',
      hasAnamnese: hasQuiz
    }

    // BUSCAR CONHECIMENTO (igual ao chat)
    let knowledgeDocs: any[] = []
    
    if (hasQuiz && quizLead) {
      knowledgeDocs = await searchKnowledgeWithAnamnese(
        message, avatar.id, quizLead,
        { matchThreshold: 0.4, matchCount: 5 }
      )
    } else {
      knowledgeDocs = await searchKnowledgeGeneric(
        message, avatar.id,
        { matchThreshold: 0.4, matchCount: 5 }
      )
    }

    // BUSCAR EXEMPLOS (igual ao chat)
    const examples = await searchExamples(message, avatar.id, 3)

    // BUSCAR EXERCÍCIOS (igual ao chat)
    let exercises: Exercise[] = []
    let searchMethod = 'none'
    
    // 1. Por sintomas
    const symptoms = extractSymptomsFromMessage(message)
    if (symptoms.length > 0) {
      exercises = await searchExercisesBySymptoms(symptoms, { matchCount: 3 })
      if (exercises.length > 0) searchMethod = 'symptoms'
    }
    
    // 2. Pedido genérico
    if (exercises.length === 0 && isGenericExerciseRequest(message)) {
      exercises = await searchIntroductoryExercises({ matchCount: 3 })
      if (exercises.length > 0) searchMethod = 'generic'
    }
    
    // 3. Busca semântica
    if (exercises.length === 0) {
      try {
        exercises = await searchExercisesBySemantic(message, { 
          matchCount: 3,
          matchThreshold: 0.5
        })
        if (exercises.length > 0) searchMethod = 'semantic'
      } catch (error) {
        // Silent fail
      }
    }
    
    // 4. Por elemento (se tem anamnese)
    if (exercises.length === 0 && hasQuiz && quizLead) {
      exercises = await searchExercisesByAnamnese(quizLead, { matchCount: 3 })
      if (exercises.length > 0) searchMethod = 'element'
    }

    // Formatar exercícios para debug
    const exercisesFound = exercises.map((ex: any) => ({
      title: ex.title,
      course: ex.memberkit_course_slug || 'N/A',
      similarity: ex.similarity || 0.85,
      level: ex.level || 'N/A',
      element: ex.element || 'N/A',
      duration_minutes: ex.duration_minutes || 0,
      enabled: ex.enabled ?? true,
      benefits: ex.benefits || [],
      indications: ex.indications || []
    }))

    // Formatar base de conhecimento
    const knowledgeBase = {
      total: knowledgeDocs.length,
      threshold: 40, // 0.4 * 100
      maxDocs: 5,
      items: knowledgeDocs.map((doc: any) => ({
        title: doc.title || doc.metadata?.title || 'Sem título',
        category: doc.category || doc.metadata?.category || 'N/A',
        similarity: Math.round((doc.similarity || 0) * 100),
        isPrimary: doc.is_primary || false,
        isSecondary: doc.is_secondary || false
      }))
    }

    // Formatar exemplos
    const conversationExamples = {
      total: examples.length,
      items: examples.map((ex: any) => ({
        userMessage: ex.user_message?.substring(0, 100) || '',
        assistantResponse: ex.assistant_response?.substring(0, 100) || '',
        similarity: Math.round((ex.similarity || 0) * 100)
      }))
    }

    // Contexto da conversa
    const conversationContext = {
      messageCount: messages.length + 1,
      lastUserMessage: message,
      hasAnamnese: hasQuiz
    }

    // Informações de busca
    const searchInfo = {
      method: searchMethod,
      symptomsFound: symptoms,
      isGenericRequest: isGenericExerciseRequest(message),
      elemento: quizLead?.elemento_principal || null
    }

    return NextResponse.json({
      anamnese,
      knowledgeBase,
      exercisesFound,
      conversationContext,
      conversationExamples,
      searchInfo
    })

  } catch (error) {
    console.error('Debug API Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
