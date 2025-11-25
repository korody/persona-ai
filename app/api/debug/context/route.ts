// app/api/debug/context/route.ts
// Endpoint para debugar o contexto completo que está sendo enviado para a IA

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
import type { QuizLead } from '@/lib/types/anamnese'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { userMessage, avatarSlug = 'mestre-ye' } = await req.json()

    if (!userMessage) {
      return Response.json({ error: 'userMessage is required' }, { status: 400 })
    }

    // Pegar token de autorização
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = await createAdminClient()

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Buscar avatar
    const { data: avatar, error: avatarError } = await supabase
      .from('avatars')
      .select('*')
      .eq('slug', avatarSlug)
      .eq('is_active', true)
      .single()

    if (avatarError || !avatar) {
      return Response.json({ error: 'Avatar not found' }, { status: 404 })
    }

    // Buscar dados do quiz
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
    } else {
      quizContext = buildNoAnamneseContext()
    }

    // Buscar conhecimento
    let knowledgeResults = []
    let knowledgeContext = ''
    
    if (hasQuiz && quizLead) {
      knowledgeResults = await searchKnowledgeWithAnamnese(
        userMessage, 
        avatar.id, 
        quizLead,
        {
          matchThreshold: 0.3,
          matchCount: 5
        }
      )
      knowledgeContext = formatKnowledgeContextWithAnamnese(knowledgeResults)
    } else {
      knowledgeResults = await searchKnowledgeGeneric(
        userMessage,
        avatar.id,
        {
          matchThreshold: 0.3,
          matchCount: 5
        }
      )
      knowledgeContext = formatKnowledgeContext(knowledgeResults)
    }
    
    // Buscar exemplos
    const exampleResults = await searchExamples(userMessage, avatar.id, 3)
    const examplesContext = formatExamples(exampleResults)

    // Montar prompt completo
    const systemPrompt = `${avatar.system_prompt}${quizContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 BASE DE CONHECIMENTO DISPONÍVEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${knowledgeContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 EXEMPLOS DE COMO RESPONDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${examplesContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSTRUÇÕES IMPORTANTES:
1. Use o conhecimento acima quando relevante para a pergunta
2. Cite as fontes numeradas quando usar informações específicas
3. Mantenha o tom e estilo dos exemplos de conversa
4. Se não houver conhecimento relevante, use seu conhecimento geral mas mencione isso
5. Seja sempre empático, educativo e prático
`

    // Retornar análise completa
    return Response.json({
      userMessage,
      avatarSlug,
      hasAnamnese: hasQuiz,
      anamneseData: quizLead ? {
        nome: quizLead.nome,
        elementoPrincipal: quizLead.elemento_principal,
        intensidade: quizLead.intensidade_calculada,
        createdAt: quizLead.created_at
      } : null,
      knowledge: {
        totalFound: knowledgeResults.length,
        threshold: 0.3,
        maxResults: 5,
        results: knowledgeResults.map((k: any) => ({
          title: k.title,
          category: k.category,
          similarity: `${(k.similarity * 100).toFixed(1)}%`,
          isPrimary: k.is_primary || false,
          isSecondary: k.is_secondary || false,
          contentPreview: k.content?.substring(0, 200) + '...'
        }))
      },
      examples: {
        totalFound: exampleResults.length,
        results: exampleResults.map((e: any) => ({
          title: e.title,
          similarity: `${(e.similarity * 100).toFixed(1)}%`,
          messagePreview: e.user_message?.substring(0, 100) + '...'
        }))
      },
      finalPrompt: {
        characterCount: systemPrompt.length,
        wordCount: systemPrompt.split(/\s+/).length,
        sections: {
          hasAnamneseSection: systemPrompt.includes('DIAGNÓSTICO') || systemPrompt.includes('ANAMNESE'),
          hasKnowledgeSection: systemPrompt.includes('BASE DE CONHECIMENTO'),
          hasExamplesSection: systemPrompt.includes('EXEMPLOS DE COMO RESPONDER')
        },
        fullText: systemPrompt // ⚠️ Pode ser grande, só para debug
      }
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    })

  } catch (error) {
    console.error('Debug API Error:', error)
    return Response.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
