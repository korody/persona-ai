/**
 * Centralized Chat Context Builder
 * Shared between /api/chat and /api/playground/chat
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { 
  searchKnowledgeWithAnamnese,
  searchKnowledgeGeneric,
  formatKnowledgeContext,
  formatKnowledgeContextWithAnamnese,
  searchExamples,
  formatExamples
} from '@/lib/rag'
import { buildAnamneseContext, buildNoAnamneseContext } from '@/lib/helpers/anamnese-helpers'
import { getMarketingContext, formatMarketingContext } from '@/lib/helpers/marketing-helpers'
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

export interface ChatContextOptions {
  supabase: SupabaseClient
  avatarId: string
  avatarSlug: string
  avatarSystemPrompt: string
  userEmail: string | undefined
  userId: string | undefined
  userQuery: string
}

export interface ChatContext {
  systemPrompt: string
  hasAnamnese: boolean
  quizLead: QuizLead | null
  knowledgeCount: number
  examplesCount: number
  exercisesCount: number
  productsCount: number
  hasActiveCampaign: boolean
}

export async function buildChatContext(options: ChatContextOptions): Promise<ChatContext> {
  const { supabase, avatarId, avatarSlug, avatarSystemPrompt, userEmail, userId, userQuery } = options

  // 1. BUSCAR DADOS DO QUIZ PARA PERSONALIZA��O
  let quizContext = ''
  let hasQuiz = false
  let quizLead: QuizLead | null = null
  
  if (userEmail) {
    const { data: quizData } = await supabase
      .from('quiz_leads')
      .select('*')
      .eq('email', userEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (quizData) {
      hasQuiz = true
      quizLead = quizData as QuizLead
      quizContext = buildAnamneseContext(quizLead)
      console.log(`?? Anamnese: ${quizLead.elemento_principal}`)
    }
  }
  
  if (!hasQuiz) {
    quizContext = buildNoAnamneseContext()
    console.log('??  No anamnese')
  }

  // 2. BUSCAR CONHECIMENTO RELEVANTE
  console.log('?? Searching knowledge...')
  
  let knowledgeContext = ''
  let knowledgeCount = 0
  
  if (hasQuiz && quizLead) {
    const relevantKnowledge = await searchKnowledgeWithAnamnese(
      userQuery, avatarId, quizLead,
      { matchThreshold: 0.6, matchCount: 5 }
    )
    knowledgeContext = formatKnowledgeContextWithAnamnese(relevantKnowledge)
    knowledgeCount = relevantKnowledge.length
    console.log(`? ${knowledgeCount} knowledge items (with anamnese)`)
  } else {
    const relevantKnowledge = await searchKnowledgeGeneric(
      userQuery, avatarId,
      { matchThreshold: 0.6, matchCount: 5 }
    )
    knowledgeContext = formatKnowledgeContext(relevantKnowledge)
    knowledgeCount = relevantKnowledge.length
    console.log(`? ${knowledgeCount} knowledge items (generic)`)
  }
  
  // 3. BUSCAR EXEMPLOS
  const relevantExamples = await searchExamples(userQuery, avatarId, 3)
  const examplesContext = formatExamples(relevantExamples)
  const examplesCount = relevantExamples.length
  console.log(`? ${examplesCount} examples`)

  // 4. BUSCAR EXERC�CIOS
  console.log('?? Searching exercises...')
  
  let exercises: Exercise[] = []
  
  const symptoms = extractSymptomsFromMessage(userQuery)
  if (symptoms.length > 0) {
    console.log(`?? Symptoms: ${symptoms.join(', ')}`)
    exercises = await searchExercisesBySymptoms(symptoms, { matchCount: 3 })
  }
  
  if (exercises.length === 0 && isGenericExerciseRequest(userQuery)) {
    console.log('?? Generic request')
    exercises = await searchIntroductoryExercises({ matchCount: 3 })
  }
  
  if (exercises.length === 0) {
    console.log('?? Semantic search...')
    try {
      exercises = await searchExercisesBySemantic(userQuery, { 
        matchCount: 3,
        matchThreshold: 0.5
      })
      if (exercises.length > 0) {
        console.log(`? Semantic search found ${exercises.length} relevant exercises`)
      }
    } catch (error) {
      console.error('? Semantic search failed:', error)
    }
  }
  
  if (exercises.length === 0 && hasQuiz && quizLead) {
    console.log(`?? Searching exercises by element: ${quizLead.elemento_principal}`)
    exercises = await searchExercisesByAnamnese(quizLead, { matchCount: 3 })
  }
  
  const exercisesContext = await formatExercisesContext(exercises, quizLead || undefined, avatarSlug)
  const exercisesCount = exercises.length
  
  if (exercisesCount > 0) {
    console.log(`? Found ${exercisesCount} relevant exercises to recommend`)
  } else {
    console.log('??  No exercises found for this context')
  }

  // 5. BUSCAR CONTEXTO DE MARKETING (campanhas + produtos)
  console.log('?? Loading marketing context...')
  const marketingContext = await getMarketingContext(
    supabase, 
    avatarSlug,
    userId,
    quizLead?.elemento_principal
  )
  const marketingSection = formatMarketingContext(marketingContext)
  
  const hasActiveCampaign = !!marketingContext.activeCampaign
  const productsCount = marketingContext.recommendedProducts.length
  
  if (hasActiveCampaign) {
    console.log(`? Active campaign: ${marketingContext.activeCampaign.name}`)
  }
  if (productsCount > 0) {
    console.log(`? Found ${productsCount} products to recommend`)
  }

  // 6. MONTAR PROMPT DO SISTEMA
  const systemPrompt = `${avatarSystemPrompt}${quizContext}

?? IMPORTANT RULES ABOUT PRODUCTS:
- Only mention products listed in the "?? PRODUTOS E SERVI�OS DISPON�VEIS" section below
- Use the EXACT product name and URL provided
- Never invent or modify product names or URLs

??????????????????????????????????????????????????
?? BASE DE CONHECIMENTO DISPON�VEL
??????????????????????????????????????????????????

${knowledgeContext}

${exercisesContext}

${marketingSection}

??????????????????????????????????????????????????
?? EXEMPLOS DE COMO RESPONDER
??????????????????????????????????????????????????

${examplesContext}

??????????????????????????????????????????????????

INSTRU��ES IMPORTANTES:
1. Use o conhecimento acima quando relevante para a pergunta
2. Cite as fontes numeradas quando usar informa��es espec�ficas
3. Mantenha o tom e estilo dos exemplos de conversa
4. Se houver exerc�cios recomendados, mencione-os naturalmente na resposta
5. Sempre inclua os links dos exerc�cios quando mencion�-los
6. Se n�o houver conhecimento relevante, use seu conhecimento geral mas mencione isso
7. Seja sempre emp�tico, educativo e pr�tico
`

  return {
    systemPrompt,
    hasAnamnese: hasQuiz,
    quizLead,
    knowledgeCount,
    examplesCount,
    exercisesCount,
    productsCount,
    hasActiveCampaign
  }
}
